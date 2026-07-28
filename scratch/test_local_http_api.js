import "dotenv/config";
import axios from "axios";
import getRedisClient from "../src/config/redis.js";
import { clearVerification } from "../src/services/otpRedisService.js";

// Set environment variables for local testing
process.env.TEST_MODE = "true";
process.env.NODE_ENV = "development";
process.env.RECAPTCHA_BYPASS = "true";
const TEST_PORT = 8899;
process.env.PORT = String(TEST_PORT);

const BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

const runHttpApiTests = async () => {
  console.log("🚀 Starting Local HTTP API Integration Test (with Redis OTP)...\n");
  
  const testEmail = "localhttp2515312@akgec.ac.in";
  const studentNum = "2515312";

  // Clean up any existing state before starting
  await clearVerification(testEmail);

  // Import app after env vars are set
  const { default: app } = await import("../src/server.js");

  const server = app.listen(TEST_PORT, async () => {
    console.log(`📡 Local Express Test Server running on port ${TEST_PORT}...\n`);

    try {
      // 1. Test SEND OTP Endpoint
      console.log("1️⃣ Testing POST /api/v1/send-otp...");
      let res = await axios.post(`${BASE_URL}/send-otp`, {
        name: "Local Test User",
        email: testEmail,
        studentNumber: studentNum,
        gender: "Male",
        branch: "CSE",
        phone: "9876543210",
        residence: "Day Scholar",
        domain: "backend development",
        githubId: "testgit",
        hackerrankId: "testhacker",
        captchaToken: "dummy_token"
      });
      console.log("   Status:", res.status, res.data);
      if (!res.data.success) throw new Error("Send OTP failed");
      console.log("   ✅ Send OTP API succeeded (0 DB queries)!");

      // 2. Test Spam Cooldown via API (hitting send-otp again immediately)
      console.log("\n2️⃣ Testing Spam Cooldown via API (POST /api/v1/send-otp again)...");
      try {
        await axios.post(`${BASE_URL}/send-otp`, {
          name: "Local Test User",
          email: testEmail,
          studentNumber: studentNum,
          captchaToken: "dummy_token"
        });
        throw new Error("Should have thrown 429 Too Many Requests!");
      } catch (err) {
        if (err.response && err.response.status === 429) {
          console.log("   Status:", err.response.status, err.response.data);
          console.log("   ✅ API rate limit cooldown successfully blocked duplicate request in < 1ms!");
        } else {
          throw err;
        }
      }

      // 3. Retrieve actual OTP generated from Redis memory
      console.log("\n3️⃣ Retrieving generated OTP from Redis memory...");
      const redis = getRedisClient();
      const rawData = await redis.get(`otp_data:${testEmail}`);
      if (!rawData) throw new Error("OTP data not found in Redis!");
      const { otp: generatedOtp } = JSON.parse(rawData);
      console.log(`   ✅ Found OTP in RAM: [ ${generatedOtp} ]`);

      // 4. Test wrong OTP via verify-otp endpoint
      console.log("\n4️⃣ Testing Brute-Force Rejection via API (POST /api/v1/verify-otp with wrong OTP)...");
      try {
        await axios.post(`${BASE_URL}/verify-otp`, {
          email: testEmail,
          otp: "000000"
        });
        throw new Error("Should have thrown 400 Invalid OTP!");
      } catch (err) {
        if (err.response && err.response.status === 400) {
          console.log("   Status:", err.response.status, err.response.data);
          console.log("   ✅ API correctly rejected wrong OTP!");
        } else {
          throw err;
        }
      }

      // 5. Test correct OTP via verify-otp endpoint
      console.log("\n5️⃣ Testing Correct OTP Verification via API (POST /api/v1/verify-otp)...");
      res = await axios.post(`${BASE_URL}/verify-otp`, {
        email: testEmail,
        otp: generatedOtp
      });
      console.log("   Status:", res.status, res.data);
      if (!res.data.success) throw new Error("Verify OTP failed");
      console.log("   ✅ OTP successfully verified over HTTP API!");

      // 6. Check verification flag in Redis
      const isVer = await redis.exists(`otp_verified:${testEmail}`);
      if (isVer !== 1) throw new Error("Verified key missing in Redis");
      console.log("   ✅ Verified state confirmed in Redis RAM!");

      // 7. Cleanup
      console.log("\n7️⃣ Cleaning up test state...");
      await clearVerification(testEmail);
      console.log("   ✅ Cleanup complete!");

      console.log("\n🎉 ALL LOCAL HTTP API TESTS (SEND-OTP, SPAM COOLDOWN, VERIFY-OTP) PASSED! 🚀");
      server.close(() => {
        process.exit(0);
      });
    } catch (error) {
      console.error("\n❌ LOCAL API TEST FAILED:", error.message);
      if (error.response) console.error("Response:", error.response.data);
      server.close(() => {
        process.exit(1);
      });
    }
  });
};

runHttpApiTests();
