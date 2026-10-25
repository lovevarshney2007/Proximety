import { Otp } from "../models/otpModel.js";

const normalizeEmail = (email = "") => email.trim().toLowerCase();

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
  const cooldownUntil = new Date(now.getTime() + 60 * 1000);

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
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const verifyOtpInRedis = async (email, otp, maxAttempts = 5) => {
  const normalized = normalizeEmail(email);
  const record = await Otp.findOne({ email: normalized });

  if (!record) {
    return { success: false, message: "OTP expired or invalid" };
  }

  record.attempts = (record.attempts || 0) + 1;

  if (record.attempts >= maxAttempts) {
    await Otp.deleteOne({ email: normalized });
    return {
      success: false,
      message: "Too many failed attempts. Please request a new OTP.",
    };
  }

  if (record.otp !== String(otp)) {
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
  return Boolean(record);
};

export const clearVerification = async (email) => {
  const normalized = normalizeEmail(email);
  await Otp.deleteOne({ email: normalized });
};
