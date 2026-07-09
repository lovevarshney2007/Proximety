import mongoose from "mongoose";

const blockedIpSchema = new mongoose.Schema({
  ipAddress: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  reason: { 
    type: String, 
    default: "Suspicious Activity" 
  },
  blockedAt: { 
    type: Date, 
    default: Date.now 
  }
});

export const BlockedIp = mongoose.model("BlockedIp", blockedIpSchema);