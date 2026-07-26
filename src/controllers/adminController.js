import { BlockedIp } from "../models/blockedIpModel.js";
import { Registration } from "../models/registrationModel.js";
import { AuditLog } from "../models/auditLogModel.js";
import { SuspiciousActivity } from "../models/suspiciousActivityModel.js";
import mongoose from "mongoose";
import { sendReminderEmail } from "../utils/emailService.js";
import { addIpToMemoryBlocklist, removeIpFromMemoryBlocklist } from "../middlewares/securityLimiters.js";

// Helper for delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ... (other functions) ...

// Send Event Reminders to all verified users
export const sendEventReminders = async (req, res, next) => {
  try {
    const users = await Registration.find({ isVerified: true });

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No verified users found to send reminders."
      });
    }

    let successCount = 0;
    let failureCount = 0;
    const failures = [];

    // Send emails in a loop with a delay
    for (const user of users) {
      try {
        await sendReminderEmail(user);
        successCount++;
        // 500ms delay to avoid SMTP rate limits
        await sleep(500);
      } catch (error) {
        failureCount++;
        failures.push({ email: user.email, error: error.message });
        console.error(`Failed to send reminder to ${user.email}:`, error);
      }
    }

    await AuditLog.create({
      actionType: 'REMINDERS_SENT',
      details: `Sent ${successCount} reminders, ${failureCount} failed.`
    });

    return res.status(200).json({
      success: true,
      message: `Reminder process completed.`,
      stats: {
        totalVerified: users.length,
        successfullySent: successCount,
        failed: failureCount
      },
      failures: failures.length > 0 ? failures : undefined
    });

  } catch (error) {
    next(error);
  }
};

// Resend reminder to a single user
export const resendSingleReminder = async (req, res, next) => {
  try {
    const { identifier } = req.body; // Can be email or studentNumber

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Identifier (email or studentNumber) is required."
      });
    }

    const user = await Registration.findOne({
      $or: [
        { email: identifier },
        { studentNumber: identifier }
      ],
      isVerified: true
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Verified user not found."
      });
    }

    await sendReminderEmail(user);

    await AuditLog.create({
      actionType: 'SINGLE_REMINDER_SENT',
      targetStudentId: user._id,
      details: `Resent reminder to ${user.email}`
    });

    return res.status(200).json({
      success: true,
      message: `Reminder resent successfully to ${user.email}.`
    });

  } catch (error) {
    next(error);
  }
};
export const blockIpManually = async (req, res, next) => {
  try {
    const { ipAddress, reason } = req.body;
    
    if (!ipAddress) {
      return res.status(400).json({ success: false, message: "IP Address is required" });
    }
    
    addIpToMemoryBlocklist(ipAddress);
    await BlockedIp.findOneAndUpdate(
      { ipAddress }, 
      { ipAddress, reason: reason || "Manually blocked by admin" }, 
      { upsert: true }
    );

    await AuditLog.create({
      actionType: 'IP_BLOCKED',
      targetIp: ipAddress,
      details: reason || "Manually blocked by admin"
    });
    
    return res.status(200).json({ 
      success: true, 
      message: `IP ${ipAddress} has been blocked.` 
    });
  } catch (error) {
    next(error);
  }
};

// Ublock ip 
export const unblockIp = async (req, res, next) => {
  try {
    const { ipAddress } = req.body;
    
    if (!ipAddress) {
      return res.status(400).json({ success: false, message: "IP Address is required" });
    }

    removeIpFromMemoryBlocklist(ipAddress);
    await BlockedIp.findOneAndDelete({ ipAddress });
    
    await AuditLog.create({
      actionType: 'IP_UNBLOCKED',
      targetIp: ipAddress,
      details: "IP unblocked by admin"
    });
    
    return res.status(200).json({ 
      success: true, 
      message: `IP ${ipAddress} has been unblocked.` 
    });
  } catch (error) {
    next(error);
  }
};



//  MARK ATTENDANCE

export const markAttendance = async (req, res, next) => {
  try {
    const { qrData, day } = req.body; 

    if (!qrData) {
      return res.status(400).json({ success: false, message: "QR Data is required." });
    }

    if (!day || (Number(day) !== 1 && Number(day) !== 2 && Number(day) !== 3)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please specify a valid day (1, 2, or 3) for attendance." 
      });
    }

    const currentDay = Number(day);

    let student;
    if (mongoose.Types.ObjectId.isValid(qrData)) {
      student = await Registration.findById(qrData);
    } else {
      student = await Registration.findOne({ studentNumber: qrData });
    }

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "❌ INVALID QR CODE: Student not found in database!" 
      });
    }

    if (!student.isVerified) {
      return res.status(400).json({ 
        success: false, 
        data: { name: student.name },
        message: "⚠️ ENTRY DENIED: Payment is not verified yet!" 
      });
    }

    if (currentDay === 1) {
      if (student.isPresentDay1) {
        return res.status(400).json({ 
          success: false, 
          data: { name: student.name, time: student.checkInTimeDay1 },
          message: "🛑 ALREADY INSIDE: Day 1 attendance is already marked!" 
        });
      }
      student.isPresentDay1 = true;
      student.checkInTimeDay1 = new Date();
    } else if (currentDay === 2) {
      if (student.isPresentDay2) {
        return res.status(400).json({ 
          success: false, 
          data: { name: student.name, time: student.checkInTimeDay2 },
          message: "🛑 ALREADY INSIDE: Day 2 attendance is already marked!" 
        });
      }
      student.isPresentDay2 = true;
      student.checkInTimeDay2 = new Date();
    } else if (currentDay === 3) {
      if (student.isPresentDay3) {
        return res.status(400).json({ 
          success: false, 
          data: { name: student.name, time: student.checkInTimeDay3 },
          message: "🛑 ALREADY INSIDE: Day 3 attendance is already marked!" 
        });
      }
      student.isPresentDay3 = true;
      student.checkInTimeDay3 = new Date();
    }

    await student.save();

    await AuditLog.create({
      actionType: 'ATTENDANCE_MARKED',
      targetStudentId: student._id,
      details: `Day ${currentDay} attendance marked`
    });

    return res.status(200).json({
      success: true,
      data: {
        name: student.name,
        studentNumber: student.studentNumber,
        branch: student.branch,
        dayMarked: currentDay
      },
      message: `✅ ENTRY APPROVED: Day ${currentDay} Attendance marked successfully!`
    });

  } catch (error) {
    // Agar mongoose ki ID invalid ho
    if (error.name === "CastError") {
        return res.status(400).json({ 
            success: false, 
            message: "❌ INVALID QR FORMAT: This is not a valid code." 
        });
    }
    next(error);
  }
};


// Get all users (for admin dashboard)
export const getAllUsers = async (req, res, next) => {
  try {
    // Fetch all students and sort by newest first
    const users = await Registration.find({}).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
      message: "All users fetched successfully."
    });
  } catch (error) {
    next(error);
  }
};

// Get all blocked IPs (for admin dashboard)
export const getAllBlockedIps = async (req, res, next) => {
  try {
    const blockedIps = await BlockedIp.find({}).sort({ blockedAt: -1 });

    return res.status(200).json({
      success: true,
      count: blockedIps.length,
      data: blockedIps,
      message: "All blocked IPs fetched successfully."
    });
  } catch (error) {
    next(error);
  }
};

// Get stats for admin dashboard
export const getStats = async (req, res, next) => {
  try {
    const [total, verified, day1, day2, day3, blocked] = await Promise.all([
      Registration.countDocuments({}),
      Registration.countDocuments({ isVerified: true }),
      Registration.countDocuments({ isPresentDay1: true }),
      Registration.countDocuments({ isPresentDay2: true }),
      Registration.countDocuments({ isPresentDay3: true }),
      BlockedIp.countDocuments({}),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalRegistrations: total,
        verified,
        day1Present: day1,
        day2Present: day2,
        day3Present: day3,
        blockedIPs: blocked,
        attendanceRate: total > 0
          ? Math.round(((day1 + day2 + day3) / (total * 3)) * 100)
          : 0,
      },
      message: "Stats fetched successfully."
    });
  } catch (error) {
    next(error);
  }
};