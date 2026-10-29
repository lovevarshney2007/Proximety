import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
  },
  studentNumber: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // MongoDB native TTL index — auto-expires in 10 minutes (600 seconds)
  },
  cooldownUntil: {
    type: Date,
    default: () => new Date(Date.now() + 60 * 1000), // 60 seconds cooldown lock
  },
});

export const Otp = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
