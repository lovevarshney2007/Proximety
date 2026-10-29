import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { buildEventInviteEmailHtml } from "../src/utils/emailService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.resolve(__dirname, "..", "assets", "logos", "byte-talks-logo.png");
const MIC_PATH = path.resolve(__dirname, "..", "assets", "graphics", "mic-icon.png");

const SENDER_EMAIL = "naman24153020@akgec.ac.in";
const SENDER_PASS = "wrdj aclo yyff hzqj";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: SENDER_EMAIL,
    pass: SENDER_PASS,
  },
});

const sharedDetails = {
  name: "",
  registrationUrl: "https://register.gdgakgec.org",
  eventDate: "30 OCT 2026",
  eventTime: "10:00 AM – 12:30 PM",
  eventVenue: "CSIT SEMINAR HALL",
};

async function sendInvitation(recipientEmail) {
  const mailOptions = {
    from: `"Byte Talks — GDG on Campus AKGEC" <${SENDER_EMAIL}>`,
    to: recipientEmail,
    subject: "Byte Talks (Alumni Edition) — Registrations Open for 2nd Year | GDG AKGEC",
    html: buildEventInviteEmailHtml(sharedDetails, "cid:byte-talks-logo", "cid:byte-talks-mic"),
    attachments: [
      {
        filename: "byte-talks-logo.png",
        path: LOGO_PATH,
        cid: "byte-talks-logo",
      },
      {
        filename: "mic-icon.png",
        path: MIC_PATH,
        cid: "byte-talks-mic",
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

async function main() {
  const target = "ug2025@akgec.ac.in";
  console.log(`🚀 Dispatching Byte Talks invitation to ${target} via ${SENDER_EMAIL}...`);

  try {
    const result = await sendInvitation(target);
    console.log(`✅ Sent successfully! Message ID: ${result?.messageId || "OK"}`);
  } catch (error) {
    console.error(`❌ Failed to send to ${target}:`, error);
  }
}

main();
