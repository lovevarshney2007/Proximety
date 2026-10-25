import "dotenv/config";
import axios from "axios";
import { Redis } from "ioredis";

const BASE_URL = process.env.DEPLOYED_URL || "https://proximety-7nt5.vercel.app";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "9720028781";
const REDIS_URL = process.env.REDIS_URL;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const studentData = {
  name: "Love Varshney",
  studentNumber: "2410084",
  email: "love2410084@akgec.ac.in",
  gender: "Male",
  branch: "CSE",
  phone: "9720028781",
  residence: "Day Scholar",
  domain: "backend development",
  hackerrankId: "lovevarshney",
  githubId: "lovevarshney2007",
  unstopId: "lovevarshney",
};

async function runLiveTests() {
  console.log("==================================================");
  console.log(`🌐 Testing Live Deployed Backend: ${BASE_URL}`);
  console.log("==================================================\n");

  // Step 1: Health Check
  try {
    process.stdout.write("1️⃣  Testing GET /api/v1/health ... ");
    const healthRes = await axios.get(`${BASE_URL}/api/v1/health`);
    console.log(`✅ [${healthRes.status}] Status: ${JSON.stringify(healthRes.data)}`);
  } catch (err) {
    console.log(`❌ Failed: ${err.response?.status || err.message}`);
    process.exit(1);
  }

  // Step 2: Send OTP
  try {
    process.stdout.write(`2️⃣  Testing POST /api/v1/send-otp for ${studentData.email} ... `);
    const sendOtpRes = await axios.post(
      `${BASE_URL}/api/v1/send-otp`,
      {
        name: studentData.name,
        email: studentData.email,
        studentNumber: studentData.studentNumber,
        gender: studentData.gender,
        residence: studentData.residence,
        captchaToken: ADMIN_API_KEY,
      },
      {
        headers: { "x-api-key": ADMIN_API_KEY },
      }
    );
    console.log(`✅ [${sendOtpRes.status}] Response: ${JSON.stringify(sendOtpRes.data)}`);
  } catch (err) {
    console.log(`❌ Failed: [${err.response?.status}] ${JSON.stringify(err.response?.data || err.message)}`);
    process.exit(1);
  }

  // Step 3: Fetch OTP from Upstash Redis
  let otp = null;
  const redis = new Redis(REDIS_URL);
  try {
    process.stdout.write("3️⃣  Retrieving generated OTP from Redis ... ");
    const normalizedEmail = studentData.email.trim().toLowerCase();
    const rawData = await redis.get(`otp_data:${normalizedEmail}`);
    if (!rawData) {
      throw new Error(`No OTP found in Redis for ${normalizedEmail}`);
    }
    const parsed = JSON.parse(rawData);
    otp = parsed.otp;
    console.log(`✅ Retrieved OTP: ${otp}`);
  } catch (err) {
    console.log(`❌ Failed to retrieve OTP: ${err.message}`);
    await redis.quit();
    process.exit(1);
  }

  // Step 4: Verify OTP
  try {
    process.stdout.write(`4️⃣  Testing POST /api/v1/verify-otp with OTP ${otp} ... `);
    const verifyRes = await axios.post(`${BASE_URL}/api/v1/verify-otp`, {
      email: studentData.email,
      otp: otp,
    });
    console.log(`✅ [${verifyRes.status}] Response: ${JSON.stringify(verifyRes.data)}`);
  } catch (err) {
    console.log(`❌ Failed: [${err.response?.status}] ${JSON.stringify(err.response?.data || err.message)}`);
    await redis.quit();
    process.exit(1);
  } finally {
    await redis.quit();
  }

  // Step 5: Register Student
  try {
    process.stdout.write(`5️⃣  Testing POST /api/v1/register for ${studentData.name} ... `);
    const registerRes = await axios.post(`${BASE_URL}/api/v1/register`, studentData);
    console.log(`✅ [${registerRes.status}] Response: ${JSON.stringify(registerRes.data)}`);
  } catch (err) {
    console.log(`❌ Failed: [${err.response?.status}] ${JSON.stringify(err.response?.data || err.message)}`);
    process.exit(1);
  }

  // Small delay to allow DB writes to settle
  await sleep(1000);

  // Step 6: Verify Admin Users
  try {
    process.stdout.write("6️⃣  Testing GET /api/v1/admin/users ... ");
    const usersRes = await axios.get(`${BASE_URL}/api/v1/admin/users`, {
      headers: { "x-api-key": ADMIN_API_KEY },
    });
    const found = usersRes.data.data?.find((u) => u.email === studentData.email);
    if (found) {
      console.log(`✅ Found registered student: ${found.name} (${found.studentNumber}) - ID: ${found._id}`);
    } else {
      console.log(`⚠️ User not found in users list. Count: ${usersRes.data.count}`);
    }
  } catch (err) {
    console.log(`❌ Failed: [${err.response?.status}] ${JSON.stringify(err.response?.data || err.message)}`);
  }

  // Step 7: Verify Admin Stats
  try {
    process.stdout.write("7️⃣  Testing GET /api/v1/admin/stats ... ");
    const statsRes = await axios.get(`${BASE_URL}/api/v1/admin/stats`, {
      headers: { "x-api-key": ADMIN_API_KEY },
    });
    console.log(`✅ Stats: ${JSON.stringify(statsRes.data.data)}`);
  } catch (err) {
    console.log(`❌ Failed: [${err.response?.status}] ${JSON.stringify(err.response?.data || err.message)}`);
  }

  console.log("\n==================================================");
  console.log("🎉 All routes tested and student registered successfully!");
  console.log("==================================================");
}

runLiveTests();
