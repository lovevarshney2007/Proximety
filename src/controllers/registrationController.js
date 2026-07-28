import axios from "axios";
import crypto from "crypto";

import { checkCooldown, storeOtp, verifyOtpInRedis, isOtpVerified, clearVerification } from "../services/otpRedisService.js";
import { Registration } from "../models/registrationModel.js";
import { sendOtpEmail, sendRegisterationEmail } from "../utils/emailService.js";
import { registrationValidation, sendOtpValidation } from "../validations/registrationValidation.js";


const MAX_REGISTRATIONS = 150;
const OTP_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const isOtpBypassEmail = (email = "") =>
  process.env.NODE_ENV !== "production" &&
  process.env.OTP_BYPASS_EMAIL &&
  normalizeEmail(email) === normalizeEmail(process.env.OTP_BYPASS_EMAIL);

const isRegistrationFull = async () => {
  const count = await Registration.countDocuments({ isVerified: true });
  return count >= MAX_REGISTRATIONS;
};



/* ===============================
  CAPTCHA VERIFICATION HELPER
================================ */

const verifyCaptcha = async (captchaToken) => {

  const isDev = process.env.NODE_ENV !== "production";
  const bypassCaptcha = isDev && process.env.RECAPTCHA_BYPASS === "true";

  if (bypassCaptcha) return { isValid: true };

  if (!captchaToken) {
    return { isValid: false, message: "Verification failed" };
  }

  try {

    const { data } = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: captchaToken,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 5000,
      }
    );
    if (!data || !data.success) {
      return {
        isValid: false,
        message: "Verification failed",
      };
    }

    return { isValid: true };

  } catch (error) {

    return {
      isValid: false,
      message: "Verification failed",
    };

  }
};



/* ===============================
  SEND OTP
================================ */

export const sendRegistrationOtp = async (req, res, next) => {

  try {

    if (await isRegistrationFull()) {
      return res.status(403).json({
        success: false,
        message: "Registrations are full",
      });
    }

    const value = await sendOtpValidation.validateAsync(req.body, {
      abortEarly: true,
      stripUnknown: true,
    });

    let { email, name, studentNumber, captchaToken } = value;

    const captchaStatus = await verifyCaptcha(captchaToken);

    if (!captchaStatus.isValid) {
      return res.status(400).json({
        success: false,
        message: captchaStatus.message,
      });
    }

    // email = email.trim().toLowerCase();
    email = normalizeEmail(email);

    const existingUser = await Registration.findOne({
      $or: [{ email }, { studentNumber }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Already registered",
      });
    }

    if (isOtpBypassEmail(email)) {
      return res.json({
        success: true,
        message: "OTP sent",
      });
    }

    // Cooldown check — prevent spamming same email in Redis (<1ms, 0 DB query)
    const { isOnCooldown, remainingSeconds } = await checkCooldown(email);
    if (isOnCooldown) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    await storeOtp(email, studentNumber, otp);

    await sendOtpEmail(email, name, otp);

    res.status(200).json({
      success: true,
      message: "OTP sent",
    });

  } catch (error) {
    if (error.isJoi) {
      return res.status(422).json({
        success: false,
        message: "Invalid request data",
      });
    }
    next(error);
  }
};



/* ===============================
  VERIFY OTP
================================ */

export const verifyOtp = async (req, res, next) => {

  try {

    let { email, otp } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // email = email.trim().toLowerCase();
    email = normalizeEmail(email);

    if (isOtpBypassEmail(email)) {
      return res.json({
        success: true,
        message: "OTP verified",
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP required",
      });
    }

    const verificationResult = await verifyOtpInRedis(email, otp, MAX_OTP_ATTEMPTS);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP verified",
    });

  } catch (error) {
    next(error);
  }
};



/* ===============================
  REGISTER STUDENT
================================ */

export const registerStudent = async (req, res, next) => {

  try {

    const formData = req.body;

    /* ===== VALIDATION ===== */

    const value =
      await registrationValidation.validateAsync(
        formData,
        {
          abortEarly: true,
          stripUnknown: true,
        }
      );

    const email =
      // value.email.trim().toLowerCase();
      normalizeEmail(value.email);

    const shouldBypassOtp = isOtpBypassEmail(email);


    /* ===== OTP CHECK ===== */

    const isVerifiedInRedis = shouldBypassOtp ? true : await isOtpVerified(email);

    if (!isVerifiedInRedis) {
      return res.status(400).json({
        success: false,
        message: "OTP not verified",
      });
    }

    /* ===== DUPLICATE CHECK ===== */

    const existing =
      await Registration.findOne({
        $or: [
          { email },
          { studentNumber: value.studentNumber },
          { phone: value.phone },
        ],
      });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Already registered",
      });
    }

    if (await isRegistrationFull()) {
      return res.status(403).json({
        success: false,
        message: "Registrations are full",
      });
    }


    /* ===== CREATE ===== */

    value.email = email;

    value.isVerified = true;

    const student =
      await Registration.create(value);


    // await Otp.findByIdAndDelete(
    //   otpRecord._id
    // );

    // await sendRegisterationEmail(student);

    // Clean up verified state in Redis after successful registration in DB
    if (!shouldBypassOtp) {
      await clearVerification(email);
    }

    await sendRegisterationEmail(student);


    res.status(201).json({
      success: true,
      message: "Registration successful",
    });

  } catch (error) {

    if (error.isJoi) {
      return res.status(422).json({
        success: false,
        message: "Invalid request data",
      });
    }

    next(error);
  }
};
