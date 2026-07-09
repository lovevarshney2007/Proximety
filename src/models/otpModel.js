import mongoose from "mongoose";
import validator from "validator";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "College Email is required"],
    lowercase: true,
    trim: true,
    validate: [
      {
        validator: validator.isEmail,
        message: "Invalid email format",
      },
      {
        validator: function (value) {
          // 1. Check if ends with @akgec.ac.in
          if (!value.endsWith("@akgec.ac.in")) return false;

          // 2. Extract digits before @akgec.ac.in
          const match = value.match(/(\d{7,8})@akgec\.ac\.in$/);
          if (!match) return false;

          const emailStudentNumber = match[1];

          // 3. Compare with the studentNumber provided
          return this.studentNumber === emailStudentNumber;
        },
        message: "Email must contain the same student number as the 'student ID' )",
      },
    ],
  },
  studentNumber: {
    type: String,
    required: [true, "Student ID is required for email validation"],
    match: [/^25[0-9]{5,6}$/, "Student number must start with 25 and contain only digits"],
  },
  otp: {
    type: String,
    required: [true, "OTP is required"],
    match: [/^\d{6}$/, "OTP must be exactly 6 digits long"],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900, // 15 minutes expiry
  },
});

export const Otp = mongoose.model("Otp", otpSchema);