import "dotenv/config";
import { sendEventInviteEmail } from "../src/utils/emailService.js";

const recipients = [
  { name: "Navneet", email: "navneet24153089@akgec.ac.in" },
  { name: "Love Varshney", email: "love2510084@akgec.ac.in" },
  { name: "Naman", email: "naman24153020@akgec.ac.in" },
];

const sharedDetails = {
  registrationUrl: "https://register.gdgakgec.org",
  eventDate: "30 OCT 2026",
  eventTime: "10:00 AM – 12:30 PM",
  eventVenue: "CSIT SEMINAR HALL",
};

async function main() {
  console.log(`🚀 Dispatching refined Byte Talks invitations to ${recipients.length} recipients...\n`);

  for (const target of recipients) {
    try {
      console.log(`📨 Sending invitation to ${target.name} <${target.email}>...`);
      const result = await sendEventInviteEmail(target.email, {
        name: target.name,
        ...sharedDetails,
      });
      console.log(`✅ Sent successfully! Message ID: ${result?.messageId || "OK"}\n`);
    } catch (error) {
      console.error(`❌ Failed to send to ${target.email}:`, error.message);
    }
  }

  console.log("🏁 All dispatch tasks processed.");
}

main();
