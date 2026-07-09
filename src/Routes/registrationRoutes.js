import express from "express";
import { sendRegistrationOtp, verifyOtp, registerStudent } from "../controllers/registrationController.js";
import { checkIpBlacklist, authLimiter, strictRegistrationLimiter as registerLimiter } from "../middlewares/securityLimiters.js";
import { blockIpManually, unblockIp, markAttendance, getAllUsers, getAllBlockedIps, getStats, sendEventReminders, resendSingleReminder } from "../controllers/adminController.js";
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
router.get("/admin/stats", adminAuth, getStats);


router.use(checkIpBlacklist);

router.post("/send-otp", authLimiter, sendRegistrationOtp);
router.post("/verify-otp", authLimiter, verifyOtp);
router.post("/register", registerLimiter, registerStudent);



export default router;
