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

// In-memory violation attempt counter per IP/key
const violationCounts = new Map();

const getClientIp = (req) => req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || "unknown_ip";

const cleanupCacheIfFull = () => {
  if (cleanIpsCache.size >= MAX_CACHE_SIZE) {
    const now = Date.now();
    for (const [ip, expireAt] of cleanIpsCache.entries()) {
      if (expireAt <= now) {
        cleanIpsCache.delete(ip);
      }
    }
    if (cleanIpsCache.size >= MAX_CACHE_SIZE) {
      cleanIpsCache.clear(); // Emergency flush if still full
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

  // 1. Send HTTP 429 response IMMEDIATELY without waiting for database operations
  res.status(options.statusCode).json({ success: false, message: options.message });

  // 2. Track violation in memory
  const currentCount = (violationCounts.get(trackerKey) || 0) + 1;
  violationCounts.set(trackerKey, currentCount);

  // 3. Auto-block immediately in memory if threshold crossed
  if (currentCount >= maxAttemptsForBlock) {
    if (!blockedIpsCache.has(clientIp)) {
      blockedIpsCache.add(clientIp);
      cleanIpsCache.delete(clientIp);
      
      // Background DB block write (fire-and-forget)
      BlockedIp.findOneAndUpdate(
        { ipAddress: clientIp },
        { ipAddress: clientIp, reason: reason || `Auto-blocked: Exceeded ${maxAttemptsForBlock}+ rate limit violations (${eventType})` },
        { upsert: true }
      ).catch(err => console.error(`Async Auto-block Error for ${clientIp}:`, err.message));
      
      console.log(`🚨 DANGER: IP ${clientIp} permanently auto-blocked in memory and DB after ${currentCount} attempts!`);
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
          details: { limit: options.max, window: options.windowMs, currentCount },
          payload: safePayload(req.body),
        }
      },
      { upsert: true, new: true } 
    ).catch(err => console.error(`Async Logging Error (${eventType}):`, err.message));
  }
};

// ===============================
//  GLOBAL RATE LIMITER
// ===============================
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, 
    message: "Too many general requests from this IP, please try again later or switch to another network.",
    standardHeaders: true,
    legacyHeaders: false,
});

// ===============================
//  AUTH RATE LIMITER
// ===============================
export const authLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 50, 
    message: "Too many attempts. Please try again later or switch to another network.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        handleThrottledRateLimitViolation(
            req, 
            res, 
            options, 
            'AUTH_RATE_LIMIT_BLOCK', 
            50, 
            "Auto-blocked: Exceeded 50+ auth rate limit violations"
        );
    }
});

// ===============================
//  STRICT REGISTRATION LIMITER
// ===============================
export const strictRegistrationLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 50, 
    message: "Too many registration attempts. Please try again later or switch to another network.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        handleThrottledRateLimitViolation(
            req, 
            res, 
            options, 
            'RATE_LIMIT_BLOCK', 
            150, 
            "Auto-blocked: Exceeded 150+ registration spam attempts"
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