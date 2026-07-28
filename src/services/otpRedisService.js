import getRedisClient from "../config/redis.js";

const OTP_TTL_SECONDS = 900;       // 15 minutes expiry for OTP
const COOLDOWN_TTL_SECONDS = 60;   // 60 seconds cooldown between OTP requests
const VERIFIED_TTL_SECONDS = 1800; // 30 minutes expiry for verified state before registration

const normalizeEmail = (email = "") => email.trim().toLowerCase();

export const checkCooldown = async (email) => {
  const redis = getRedisClient();
  const key = `otp_cooldown:${normalizeEmail(email)}`;
  const ttl = await redis.ttl(key);
  if (ttl && ttl > 0) {
    return { isOnCooldown: true, remainingSeconds: ttl };
  }
  return { isOnCooldown: false, remainingSeconds: 0 };
};

export const storeOtp = async (email, studentNumber, otp) => {
  const redis = getRedisClient();
  const normalized = normalizeEmail(email);
  
  const dataKey = `otp_data:${normalized}`;
  const cooldownKey = `otp_cooldown:${normalized}`;
  const attemptsKey = `otp_attempts:${normalized}`;

  const payload = JSON.stringify({
    otp: String(otp),
    studentNumber,
    createdAt: Date.now(),
  });

  // 1. Store OTP payload with 15 mins expiry (EX 900)
  await redis.set(dataKey, payload, "EX", OTP_TTL_SECONDS);

  // 2. Set cooldown lock for 60 seconds (EX 60)
  await redis.set(cooldownKey, "locked", "EX", COOLDOWN_TTL_SECONDS);

  // 3. Reset failed attempts counter
  await redis.del(attemptsKey);
};

export const verifyOtpInRedis = async (email, otp, maxAttempts = 5) => {
  const redis = getRedisClient();
  const normalized = normalizeEmail(email);
  
  const dataKey = `otp_data:${normalized}`;
  const attemptsKey = `otp_attempts:${normalized}`;
  const verifiedKey = `otp_verified:${normalized}`;

  // 1. Check if OTP exists in Redis
  const rawData = await redis.get(dataKey);
  if (!rawData) {
    return { success: false, message: "OTP expired or invalid" };
  }

  // 2. Increment attempt counter atomically (INCR)
  const attempts = await redis.incr(attemptsKey);
  
  // Set TTL on attemptsKey if it's new so it doesn't leak memory
  if (attempts === 1) {
    await redis.set(attemptsKey, String(attempts), "EX", OTP_TTL_SECONDS);
  }

  // 3. Check if brute-force threshold exceeded
  if (attempts >= maxAttempts) {
    await redis.del(dataKey);
    await redis.del(attemptsKey);
    return {
      success: false,
      message: "Too many failed attempts. Please request a new OTP.",
    };
  }

  // 4. Validate OTP match
  let parsedData;
  try {
    parsedData = JSON.parse(rawData);
  } catch (err) {
    await redis.del(dataKey);
    return { success: false, message: "OTP expired or invalid" };
  }

  if (parsedData.otp !== String(otp)) {
    return {
      success: false,
      message: "OTP expired or invalid",
    };
  }

  // 5. OTP matches! Mark as verified in Redis with 30 mins TTL
  await redis.set(verifiedKey, "true", "EX", VERIFIED_TTL_SECONDS);

  // 6. Clean up temporary OTP and attempts keys
  await redis.del(dataKey);
  await redis.del(attemptsKey);
  await redis.del(`otp_cooldown:${normalized}`);

  return { success: true, message: "OTP verified" };
};

export const isOtpVerified = async (email) => {
  const redis = getRedisClient();
  const key = `otp_verified:${normalizeEmail(email)}`;
  const val = await redis.exists(key);
  return val === 1;
};

export const clearVerification = async (email) => {
  const redis = getRedisClient();
  const normalized = normalizeEmail(email);
  await redis.del(`otp_verified:${normalized}`);
  await redis.del(`otp_data:${normalized}`);
  await redis.del(`otp_attempts:${normalized}`);
  await redis.del(`otp_cooldown:${normalized}`);
};
