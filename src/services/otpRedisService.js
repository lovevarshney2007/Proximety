import { Otp } from "../models/otpModel.js";

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes strict TTL

export const checkCooldown = async (email) => {
  const normalized = normalizeEmail(email);
  const record = await Otp.findOne({ email: normalized });
  if (record && record.cooldownUntil && record.cooldownUntil > new Date()) {
    const remainingSeconds = Math.ceil((record.cooldownUntil.getTime() - Date.now()) / 1000);
    return { isOnCooldown: true, remainingSeconds };
  }
  return { isOnCooldown: false, remainingSeconds: 0 };
};

export const storeOtp = async (email, studentNumber, otp) => {
  const normalized = normalizeEmail(email);
  const now = new Date();
  const cooldownUntil = new Date(now.getTime() + 60 * 1000); // 60s cooldown

  await Otp.findOneAndUpdate(
    { email: normalized },
    {
      studentNumber,
      otp: String(otp),
      attempts: 0,
      isVerified: false,
      createdAt: now,
      cooldownUntil,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
};

export const verifyOtpInRedis = async (email, otp, maxAttempts = 5) => {
  const normalized = normalizeEmail(email);
  const record = await Otp.findOne({ email: normalized });

  if (!record) {
    return { success: false, message: "OTP expired or invalid" };
  }

  // Strict 10-minute expiry validation
  if (record.createdAt && Date.now() - record.createdAt.getTime() > OTP_EXPIRY_MS) {
    await Otp.deleteOne({ email: normalized });
    return {
      success: false,
      message: "OTP has expired. Please request a new OTP.",
    };
  }

  record.attempts = (record.attempts || 0) + 1;

  if (record.attempts >= maxAttempts) {
    await Otp.deleteOne({ email: normalized });
    return {
      success: false,
      message: "Too many failed attempts. Please request a new OTP.",
    };
  }

  const cleanInputOtp = String(otp || "").replace(/\s+/g, "").trim();

  if (record.otp !== cleanInputOtp) {
    await record.save();
    return {
      success: false,
      message: "OTP expired or invalid",
    };
  }

  // OTP matches! Mark as verified
  record.isVerified = true;
  await record.save();

  return { success: true, message: "OTP verified" };
};

export const isOtpVerified = async (email) => {
  const normalized = normalizeEmail(email);
  const record = await Otp.findOne({ email: normalized, isVerified: true });
  if (!record) return false;

  // Verified state also expires if older than 15 minutes without final registration
  if (record.createdAt && Date.now() - record.createdAt.getTime() > 15 * 60 * 1000) {
    await Otp.deleteOne({ email: normalized });
    return false;
  }

  return true;
};

export const clearVerification = async (email) => {
  const normalized = normalizeEmail(email);
  await Otp.deleteOne({ email: normalized });
};
