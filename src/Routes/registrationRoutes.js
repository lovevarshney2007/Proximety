import express from "express";
import {
  sendRegistrationOtp,
  verifyOtp,
  registerStudent,
  getRegistrationStatus,
} from "../controllers/registrationController.js";
import {
  checkIpBlacklist,
  sendOtpLimiter,
  verifyOtpLimiter,
  strictRegistrationLimiter as registerLimiter,
} from "../middlewares/securityLimiters.js";
import {
  blockIpManually,
  unblockIp,
  markAttendance,
  getAllUsers,
  getAllBlockedIps,
  clearAllBlockedIps,
  getStats,
  sendEventReminders,
  resendSingleReminder,
} from "../controllers/adminController.js";
import adminAuth from "../middlewares/adminAuth.js";

const router = express.Router();

// Admin Routes
router.post("/admin/block-ip", adminAuth, blockIpManually);
router.post("/admin/unblock-ip", adminAuth, unblockIp);
router.post("/admin/mark-attendance", adminAuth, markAttendance);
router.post("/admin/send-reminders", adminAuth, sendEventReminders);
router.post("/admin/resend-reminder", adminAuth, resendSingleReminder);
router.get("/admin/users", adminAuth, getAllUsers);
router.get("/admin/blocked-ips", adminAuth, getAllBlockedIps);
router.delete("/admin/clear-all-blocked-ips", adminAuth, clearAllBlockedIps);
router.get("/admin/stats", adminAuth, getStats);

// Public IP Blacklist Guard
router.use(checkIpBlacklist);

// Public Registration Routes with Dedicated Limiters
router.get("/registration-status", getRegistrationStatus);
router.post("/send-otp", sendOtpLimiter, sendRegistrationOtp);
router.post("/verify-otp", verifyOtpLimiter, verifyOtp);
router.post("/register", registerLimiter, registerStudent);

export default router;
