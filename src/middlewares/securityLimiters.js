import rateLimit from "express-rate-limit";
import { SuspiciousActivity } from "../models/suspiciousActivityModel.js";
import { BlockedIp } from "../models/blockedIpModel.js";
import { safePayload } from "../utils/safePayload.js";

// ─── IN-MEMORY CACHES & THROTTLING (For Serverless DDoS & CPU Protection) ───
// In Vercel serverless, database calls on every blocked request quickly drain CPU quota and crash MongoDB pools.
// We cache IP blacklist status and throttle DB writes so DDoS/bot attacks terminate in < 0.1ms with 0 DB queries.

const blockedIpsCache = new Set();
const cleanIpsCache = new Map(); // key: ip, value: expireTimestamp
const CLEAN_IP_TTL_MS = 5 * 60 * 1000; // 5 minutes cache for clean IPs
const MAX_CACHE_SIZE = 5000; // Protect memory against distributed random IP attacks

// In-memory violation attempt counter per IP/key with sliding TTL window
// Stores: key -> { count: number, firstSeen: timestamp }
const violationCounts = new Map();
const VIOLATION_WINDOW_MS = 10 * 60 * 1000; // 10 minutes sliding window

const getClientIp = (req) => req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || "unknown_ip";

const cleanupCacheIfFull = () => {
  const now = Date.now();
  if (cleanIpsCache.size >= MAX_CACHE_SIZE) {
    for (const [ip, expireAt] of cleanIpsCache.entries()) {
      if (expireAt <= now) {
        cleanIpsCache.delete(ip);
      }
    }
    if (cleanIpsCache.size >= MAX_CACHE_SIZE) {
      cleanIpsCache.clear();
    }
  }

  if (violationCounts.size >= MAX_CACHE_SIZE) {
    for (const [key, val] of violationCounts.entries()) {
      if (now - val.firstSeen > VIOLATION_WINDOW_MS) {
        violationCounts.delete(key);
      }
    }
    if (violationCounts.size >= MAX_CACHE_SIZE) {
      violationCounts.clear();
    }
  }
};

// Exported helpers for admin manual blocking/unblocking
export const addIpToMemoryBlocklist = (ip) => {
  if (ip) blockedIpsCache.add(ip);
};

export const removeIpFromMemoryBlocklist = (ip) => {
  if (ip) {
    blockedIpsCache.delete(ip);
    cleanIpsCache.delete(ip);
  }
};

// Clear ALL in-memory caches (used by admin clear-all endpoint)
export const clearAllMemoryBlocklists = () => {
  blockedIpsCache.clear();
  cleanIpsCache.clear();
  violationCounts.clear();
};

// ===============================
//  IP BLACKLIST CHECKER
// ===============================
export const checkIpBlacklist = async (req, res, next) => {
  const clientIp = getClientIp(req);
  const now = Date.now();
  
  // 1. Ultra-fast in-memory block check (0.05 ms CPU, 0 DB queries!)
  if (blockedIpsCache.has(clientIp)) {
    return res.status(403).json({ 
      success: false, 
      message: "Access Denied: Your IP address has been blocked due to suspicious activity." 
    });
  }

  // 2. Ultra-fast in-memory clean IP check (prevents DB read on every normal request)
  if (cleanIpsCache.has(clientIp)) {
    if (now < cleanIpsCache.get(clientIp)) {
      return next();
    } else {
      cleanIpsCache.delete(clientIp);
    }
  }

  // 3. Fallback DB check for IPs not in memory cache
  try {
    const isBlocked = await BlockedIp.exists({ ipAddress: clientIp });
    if (isBlocked) {
      blockedIpsCache.add(clientIp);
      return res.status(403).json({ 
        success: false, 
        message: "Access Denied: Your IP address has been blocked due to suspicious activity." 
      });
    }

    cleanupCacheIfFull();
    cleanIpsCache.set(clientIp, now + CLEAN_IP_TTL_MS);
    next();
  } catch (error) {
    next(); // DB error aaye toh app block na ho
  }
};

// Helper for non-blocking, throttled rate limit logging and auto-blocking
const handleThrottledRateLimitViolation = (req, res, options, eventType, maxAttemptsForBlock, reason, customKey = null) => {
  const clientIp = getClientIp(req);
  const trackerKey = customKey || `${clientIp}_${eventType}`;
  const now = Date.now();

  // 1. Send HTTP 429 response IMMEDIATELY without waiting for database operations
  res.status(options.statusCode).json({ success: false, message: options.message });

  // 2. Track violation in memory with sliding 10-minute window (protects shared campus Wi-Fi)
  cleanupCacheIfFull();
  let violationData = violationCounts.get(trackerKey);
  if (!violationData || now - violationData.firstSeen > VIOLATION_WINDOW_MS) {
    violationData = { count: 1, firstSeen: now };
  } else {
    violationData.count += 1;
  }
  violationCounts.set(trackerKey, violationData);
  const currentCount = violationData.count;

  // 3. Auto-block immediately in memory if burst threshold crossed within the 10-minute window
  if (currentCount >= maxAttemptsForBlock) {
    if (!blockedIpsCache.has(clientIp)) {
      blockedIpsCache.add(clientIp);
      cleanIpsCache.delete(clientIp);
      
      // Background DB block write (fire-and-forget)
      BlockedIp.findOneAndUpdate(
        { ipAddress: clientIp },
        { ipAddress: clientIp, reason: reason || `Auto-blocked: Exceeded ${maxAttemptsForBlock}+ rapid violations (${eventType}) within 10 minutes` },
        { upsert: true }
      ).catch(err => console.error(`Async Auto-block Error for ${clientIp}:`, err.message));
      
      console.log(`🚨 DANGER: IP ${clientIp} permanently auto-blocked after ${currentCount} rapid violations within window!`);
    }
  }

  // 4. Throttled background DB logging (only on 1st, 5th, 10th, etc. attempt to prevent DB flooding)
  if (currentCount === 1 || currentCount % 5 === 0 || currentCount === maxAttemptsForBlock) {
    SuspiciousActivity.findOneAndUpdate(
      { ipAddress: clientIp, eventType }, 
      {
        $inc: { attemptCount: currentCount === 1 ? 1 : 5 },
        $set: {
          endpoint: req.originalUrl,
          details: { limit: options.max, window: options.windowMs, currentCount, windowMs: VIOLATION_WINDOW_MS },
          payload: safePayload(req.body),
        }
      },
      { upsert: true, new: true } 
    ).catch(err => console.error(`Async Logging Error (${eventType}):`, err.message));
  }
};

// ===============================
//  GLOBAL RATE LIMITER (All /api/* routes)
//  Allows 1000 requests per 15 min per IP to prevent college Wi-Fi false-positives
// ===============================
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, 
  message: "Too many requests from this network. Please try again in a few minutes or switch networks.",
  standardHeaders: true,
  legacyHeaders: false,
});

// ===============================
//  SEND OTP LIMITER (POST /api/v1/send-otp)
//  Protects email SMTP sending quota while allowing ~50 registrations per 15 min per shared campus IP
// ===============================
export const sendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, 
  message: "Too many OTP requests from this network. Please wait a few minutes or switch networks.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    handleThrottledRateLimitViolation(
      req, 
      res, 
      options, 
      'AUTH_RATE_LIMIT_BLOCK', 
      30, 
      "Auto-blocked: Exceeded 30+ rapid OTP spam attempts within 10 minutes"
    );
  }
});

// ===============================
//  VERIFY OTP LIMITER (POST /api/v1/verify-otp)
//  Pure DB lookup without SMTP cost; already protected by MAX_OTP_ATTEMPTS=5 per email
// ===============================
export const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
  message: "Too many OTP verification attempts. Please wait a few minutes or switch networks.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({ success: false, message: options.message });
  }
});

// Backward compatibility alias: authLimiter -> sendOtpLimiter
export const authLimiter = sendOtpLimiter;

// ===============================
//  STRICT REGISTRATION LIMITER (POST /api/v1/register)
//  Guards final submission (requires OTP verification first)
// ===============================
export const strictRegistrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80, 
  message: "Too many registration attempts from this network. Please try again in a few minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    handleThrottledRateLimitViolation(
      req, 
      res, 
      options, 
      'RATE_LIMIT_BLOCK', 
      50, 
      "Auto-blocked: Exceeded 50+ rapid registration spam attempts within 10 minutes"
    );
  }
});

// ===============================
//  CHATBOT LIMITER
// ===============================
export const chatbotLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100, 
  message: "You are chatting too fast! Please wait a moment.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({ success: false, message: options.message });
  }
});
