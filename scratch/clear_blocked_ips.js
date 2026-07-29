import "dotenv/config";
import mongoose from "mongoose";
import { BlockedIp } from "../src/models/blockedIpModel.js";
import { SuspiciousActivity } from "../src/models/suspiciousActivityModel.js";

const clearBlockedIps = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB.\n");

    // Delete all blocked IPs
    const blockedResult = await BlockedIp.deleteMany({});
    console.log(`🗑️  Deleted ${blockedResult.deletedCount} blocked IP(s) from the database.`);

    // Also clear suspicious activity logs
    const suspiciousResult = await SuspiciousActivity.deleteMany({});
    console.log(`🗑️  Deleted ${suspiciousResult.deletedCount} suspicious activity log(s) from the database.`);

    console.log("\n✅ All blocked IPs and suspicious activity records have been cleared!");
    console.log("ℹ️  Note: In-memory caches will be cleared on the next server restart.");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
    process.exit(0);
  }
};

clearBlockedIps();
