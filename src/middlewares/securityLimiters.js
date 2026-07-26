import rateLimit from "express-rate-limit";
import { SuspiciousActivity } from "../models/suspiciousActivityModel.js";
import { BlockedIp } from "../models/blockedIpModel.js";
import { safePayload } from "../utils/safePayload.js";

// ===============================
//  IP BLACKLIST CHECKER
// ===============================
export const checkIpBlacklist = async (req, res, next) => {
  const clientIp = req.ip || req.socket?.remoteAddress;
  
  try {
    const isBlocked = await BlockedIp.exists({ ipAddress: clientIp });
    if (isBlocked) {
      return res.status(403).json({ 
        success: false, 
        message: "Access Denied: Your IP address has been blocked due to suspicious activity." 
      });
    }
    next();
  } catch (error) {
    next(); // DB error aaye toh app block na ho
  }
};

// ===============================
//  GLOBAL RATE LIMITER
// ===============================
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, 
    message: { success: false, message: "Too many general requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// ===============================
//  AUTH RATE LIMITER
// ===============================
export const authLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 20, 
    standardHeaders: true,
    legacyHeaders: false,
    handler: async (req, res, next, options) => {
        const clientIp = req.ip || req.socket?.remoteAddress;
        
        try {
            const updatedActivity = await SuspiciousActivity.findOneAndUpdate(
                { ipAddress: clientIp, eventType: 'AUTH_RATE_LIMIT_BLOCK' }, 
                {
                    $inc: { attemptCount: 1 },
                    $set: {
                        endpoint: req.originalUrl,
                        details: { limit: options.max, window: options.windowMs },
                        payload: safePayload(req.body),
                    }
                },
                { upsert: true, new: true } 
            );

            if (updatedActivity && updatedActivity.attemptCount > 30) {
                await BlockedIp.findOneAndUpdate(
                    { ipAddress: clientIp },
                    { ipAddress: clientIp, reason: "Auto-blocked: Exceeded 30+ auth rate limit violations" },
                    { upsert: true }
                );
                console.log(`🚨 DANGER: IP ${clientIp} permanently auto-blocked after 30+ attempts!`);
            } else {
                console.log(`⚠️ Suspicious Activity Logged. IP: ${clientIp} | Count: ${updatedActivity.attemptCount}`);
            }
        } catch (err) {
            console.error("Logging/Blocking Error:", err);
        }

        res.status(options.statusCode).json({ success: false, message: "Too many attempts. Please try again after 30 minutes." });
    }
});

// ===============================
//  STRICT REGISTRATION LIMITER
// ===============================
export const strictRegistrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5, 
    standardHeaders: true,
    legacyHeaders: false,
    handler: async (req, res, next, options) => {
        const clientIp = req.ip || req.socket?.remoteAddress;

        try {
            const updatedActivity = await SuspiciousActivity.findOneAndUpdate(
                { ipAddress: clientIp, eventType: 'RATE_LIMIT_BLOCK' },
                {
                    $inc: { attemptCount: 1 },
                    $set: {
                        endpoint: req.originalUrl,
                        details: { limit: options.max, window: options.windowMs },
                        payload: safePayload(req.body)
                    }
                },
                { upsert: true, new: true }
            );

            if (updatedActivity && updatedActivity.attemptCount > 20) {
                await BlockedIp.findOneAndUpdate(
                    { ipAddress: clientIp },
                    { ipAddress: clientIp, reason: "Auto-blocked: Exceeded 20+ registration spam attempts" },
                    { upsert: true }
                );
                console.log(`🚨 DANGER: IP ${clientIp} permanently auto-blocked after 20+ attempts!`);
            }
        } catch (err) {
            console.error("Error logging activity:", err);
        }

        res.status(options.statusCode).json({ success: false, message: "Too many registration attempts. Please try again after one hour." });
    }
});

// ===============================
//  CHATBOT LIMITER
// ===============================
export const chatbotLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20, 
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({ success: false, message: "You are chatting too fast! Please wait a moment." });
    }
});