import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    actionType: {
        type: String,
        required: true,
        enum: ['IP_BLOCKED', 'IP_UNBLOCKED', 'ALL_IPS_CLEARED', 'ATTENDANCE_MARKED', 'REMINDERS_SENT', 'SINGLE_REMINDER_SENT']
    },
    targetIp: {
        type: String,
        default: null
    },
    targetStudentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Registration',
        default: null
    },
    details: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
