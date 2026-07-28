import "dotenv/config";
import { checkCooldown, storeOtp, verifyOtpInRedis, isOtpVerified, clearVerification } from "../src/services/otpRedisService.js";

const testRedisOtpFlow = async () => {
  console.log("🚀 Starting Redis OTP Verification Test...\n");
  const testEmail = "test_student_2515312@akgec.ac.in";
  const studentNum = "2515312";
  const testOtp = "654321";

  try {
    // Clean up any old test state
    await clearVerification(testEmail);

    // 1. Initial cooldown check
    console.log("1️⃣ Checking initial cooldown state...");
    let cd = await checkCooldown(testEmail);
    console.log("   Result:", cd);
    if (cd.isOnCooldown) throw new Error("Should not be on cooldown initially");

    // 2. Store OTP
    console.log("\n2️⃣ Storing OTP in Redis (0 DB calls)...");
    await storeOtp(testEmail, studentNum, testOtp);
    console.log("   ✅ OTP Stored successfully in Redis memory.");

    // 3. Verify cooldown lock is active
    console.log("\n3️⃣ Checking if cooldown lock was set...");
    cd = await checkCooldown(testEmail);
    console.log("   Result:", cd);
    if (!cd.isOnCooldown) throw new Error("Cooldown lock failed!");
    console.log(`   ✅ Spam protection active! Remaining cooldown: ${cd.remainingSeconds}s`);

    // 4. Test wrong OTP attempt (Brute-force test)
    console.log("\n4️⃣ Testing incorrect OTP verification attempt...");
    let res = await verifyOtpInRedis(testEmail, "000000");
    console.log("   Result:", res);
    if (res.success) throw new Error("Wrong OTP should fail");
    console.log("   ✅ Incorrect OTP properly rejected.");

    // 5. Test correct OTP verification
    console.log("\n5️⃣ Testing correct OTP verification...");
    res = await verifyOtpInRedis(testEmail, testOtp);
    console.log("   Result:", res);
    if (!res.success) throw new Error("Correct OTP should succeed: " + res.message);
    console.log("   ✅ Correct OTP verified successfully!");

    // 6. Check verified state in Redis
    console.log("\n6️⃣ Checking if user is marked as verified in Redis...");
    let isVer = await isOtpVerified(testEmail);
    console.log("   Result:", isVer);
    if (!isVer) throw new Error("User should be marked as verified in Redis");
    console.log("   ✅ User verification status confirmed in RAM!");

    // 7. Cleanup after registration simulation
    console.log("\n7️⃣ Simulating registration completion & clearing Redis state...");
    await clearVerification(testEmail);
    isVer = await isOtpVerified(testEmail);
    if (isVer) throw new Error("Verification state should be cleared");
    console.log("   ✅ Redis state cleaned up completely!");

    console.log("\n🎉 ALL REDIS OTP & ATTACK MITIGATION TESTS PASSED SUCCESSFULLY! 🚀");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    process.exit(1);
  }
};

testRedisOtpFlow();
