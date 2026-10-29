import "dotenv/config";
import { sendEventInviteEmail } from "../src/utils/emailService.js";

const recipientEmail = process.argv[2] || "love2410084@akgec.ac.in";

const details = {
  name: "Love Varshney",
  registrationUrl: "https://register.gdgakgec.org",
  eventDate: "30 OCT 2026",
  eventTime: "10:00 AM – 12:30 PM",
  eventVenue: "CSIT SEMINAR HALL",
};

async function main() {
  console.log(`🚀 Dispatching event invitation & details to ${recipientEmail}...`);
  try {
    const result = await sendEventInviteEmail(recipientEmail, details);
    console.log(`🎉 Successfully sent! Message ID: ${result?.messageId || "OK"}`);
  } catch (error) {
    console.error("❌ Failed to send event invitation:", error.message);
    process.exit(1);
  }
}

main();
