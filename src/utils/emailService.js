import nodemailer from "nodemailer";
import { generateQRCode } from "../ticket/generateQRCode.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER || process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
  },
});

// ─── Byte Talks Design Tokens (Custom Palette: #097b59 & #1d212c) ──────────────
const BT_PRIMARY      = "#097b59";               // Deep emerald green accent
const BT_PRIMARY_HOVER= "#0c956c";
const BT_PRIMARY_TINT = "rgba(9, 123, 89, 0.16)";
const BT_CONTAINER    = "#1d212c";               // Dark slate container base
const BT_BG           = "#13161f";               // Outer canvas background
const BT_CARD         = "#242938";               // Card surfaces
const BT_BORDER       = "#2f3648";               // Subtle card borders
const BT_TEXT         = "#f0f4f8";               // High-contrast clean text
const BT_MUTED        = "#9ba5b5";               // Readable secondary text

// ─── Shared header HTML ───────────────────────────────────────────────────────
export const emailHeader = () => `
  <div style="background-color:${BT_CONTAINER}; text-align:center; padding:38px 20px 28px; border-bottom:3px solid ${BT_PRIMARY};">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="padding-right:14px; vertical-align:middle;">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="12" fill="${BT_PRIMARY}" fill-opacity="0.18"/>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" fill="${BT_PRIMARY}"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="${BT_PRIMARY}" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="12" y1="19" x2="12" y2="23" stroke="${BT_PRIMARY}" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="8" y1="23" x2="16" y2="23" stroke="${BT_PRIMARY}" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </td>
        <td style="vertical-align:middle; text-align:left;">
          <div style="font-family:'Arial Black',Arial,sans-serif; font-size:30px; font-weight:900; color:#ffffff; letter-spacing:2px; text-transform:uppercase; line-height:1;">BYTE</div>
          <div style="font-family:'Arial Black',Arial,sans-serif; font-size:30px; font-weight:900; color:${BT_PRIMARY}; letter-spacing:2px; text-transform:uppercase; line-height:1;">TALKS</div>
        </td>
      </tr>
    </table>
    <p style="margin:14px 0 0 0; font-family:Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:4px; text-transform:uppercase; color:${BT_MUTED};">ALUMNI EDITION &nbsp;·&nbsp; 30 OCT &nbsp;·&nbsp; CSIT SEMINAR HALL</p>
  </div>`;

// ─── Shared footer HTML ───────────────────────────────────────────────────────
export const emailFooter = () => `
  <div style="background-color:#161922; text-align:center; padding:28px 20px; border-top:1px solid ${BT_BORDER};">
    <p style="margin:0 0 6px 0; font-family:Arial,sans-serif; font-size:13px; color:${BT_MUTED};">Keep Learning &nbsp;·&nbsp; Keep Building &nbsp;·&nbsp; Keep Inspiring</p>
    <p style="margin:0 0 4px 0; font-family:Arial,sans-serif; font-size:13px; font-weight:700; color:${BT_TEXT};">Team GDG On Campus AKGEC</p>
    <p style="margin:0; font-family:Arial,sans-serif; font-size:11px; color:${BT_MUTED};">&copy; ${new Date().getFullYear()} GDG On Campus AKGEC. All rights reserved.</p>
  </div>`;

// ─── Email wrapper ────────────────────────────────────────────────────────────
export const wrapEmail = (bodyHtml) => `
  <div style="background-color:${BT_BG}; padding:24px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:600px; margin:0 auto; background-color:${BT_CONTAINER}; border:1px solid ${BT_BORDER}; border-radius:12px; overflow:hidden; box-shadow:0 10px 36px rgba(0,0,0,0.45);">
      ${emailHeader()}
      ${bodyHtml}
      ${emailFooter()}
    </div>
  </div>`;

// ─── Exported Template Builders (Single Source of Truth) ─────────────────────

// 1. OTP Email Template
export const buildOtpEmailHtml = (name, otp) => {
  const body = `
      <div style="padding:36px 28px;">
        <div style="text-align:center; margin-bottom:28px;">
          <span style="display:inline-block; background-color:${BT_PRIMARY_TINT}; color:${BT_PRIMARY}; border:1px solid ${BT_PRIMARY}; padding:8px 22px; border-radius:50px; font-size:13px; font-weight:700; letter-spacing:2px; text-transform:uppercase;">🔐 Email Verification</span>
        </div>
        <p style="font-size:16px; color:${BT_TEXT}; margin:0 0 12px 0;">Hi <strong>${name}</strong>,</p>
        <p style="font-size:15px; color:${BT_MUTED}; line-height:1.7; margin:0 0 28px 0;">
          Thank you for registering for <strong style="color:${BT_TEXT};">Byte Talks — Alumni Edition</strong>.
          Use the One-Time Password below to verify your email and complete your registration.
        </p>
        <div style="text-align:center; margin:0 0 28px 0;">
          <div style="display:inline-block; background-color:${BT_CARD}; border:2px dashed ${BT_PRIMARY}; border-radius:12px; padding:28px 40px;">
            <p style="margin:0 0 8px 0; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:${BT_MUTED};">YOUR OTP</p>
            <span style="font-family:'Arial Black',Arial,sans-serif; font-size:42px; font-weight:900; letter-spacing:14px; color:${BT_PRIMARY};">${otp}</span>
          </div>
        </div>
        <p style="font-size:13px; color:${BT_MUTED}; text-align:center; margin:0;">⏳ This OTP is valid for <strong style="color:${BT_TEXT};">5 minutes</strong>. Do not share it with anyone.</p>
      </div>`;
  return wrapEmail(body);
};

// 2. Registration Confirmation Template
export const buildRegistrationEmailHtml = (student, qrCodeSrc = "cid:student-qr-code") => {
  const body = `
      <div style="padding:36px 28px;">
        <div style="text-align:center; margin-bottom:28px;">
          <span style="display:inline-block; background-color:${BT_PRIMARY_TINT}; color:${BT_PRIMARY}; border:1px solid ${BT_PRIMARY}; padding:8px 22px; border-radius:50px; font-size:13px; font-weight:700; letter-spacing:2px; text-transform:uppercase;">🎉 Registration Confirmed</span>
        </div>
        <p style="font-size:16px; color:${BT_TEXT}; margin:0 0 12px 0;">Hi <strong>${student.name || "Participant"}</strong>,</p>
        <p style="font-size:15px; color:${BT_MUTED}; line-height:1.7; margin:0 0 28px 0;">
          You're officially in! 🎤 Your registration for <strong style="color:${BT_TEXT};">Byte Talks — Alumni Edition</strong> has been confirmed.
          Get ready to <strong style="color:${BT_PRIMARY};">Learn &middot; Connect &middot; Inspire</strong>.
        </p>

        <!-- Event Details -->
        <div style="background-color:${BT_CARD}; border:1px solid ${BT_BORDER}; border-left:4px solid ${BT_PRIMARY}; border-radius:8px; padding:22px; margin:0 0 22px 0;">
          <h3 style="margin:0 0 14px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:${BT_PRIMARY};">&#128205; Event Details</h3>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr><td style="padding:6px 0; font-size:14px; color:${BT_MUTED}; width:35%;">Date</td><td style="padding:6px 0; font-size:14px; color:${BT_TEXT}; font-weight:700;">30th October, 2026</td></tr>
            <tr><td style="padding:6px 0; font-size:14px; color:${BT_MUTED};">Venue</td><td style="padding:6px 0; font-size:14px; color:${BT_TEXT}; font-weight:700;">CSIT Seminar Hall</td></tr>
            <tr><td style="padding:6px 0; font-size:14px; color:${BT_MUTED};">Time</td><td style="padding:6px 0; font-size:14px; color:${BT_TEXT}; font-weight:700;">10:00 AM – 12:30 PM</td></tr>
          </table>
        </div>

        <!-- Student Details -->
        <div style="background-color:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:8px; padding:22px; margin:0 0 22px 0;">
          <h3 style="margin:0 0 14px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:${BT_MUTED};">&#128203; Your Details</h3>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr style="border-bottom:1px solid ${BT_BORDER};"><td style="padding:10px 0; color:${BT_MUTED};">Name</td><td style="padding:10px 0; color:${BT_TEXT}; font-weight:700; text-align:right;">${student.name || "N/A"}</td></tr>
            <tr style="border-bottom:1px solid ${BT_BORDER};"><td style="padding:10px 0; color:${BT_MUTED};">Branch</td><td style="padding:10px 0; color:${BT_TEXT}; font-weight:700; text-align:right;">${student.branch}</td></tr>
            <tr><td style="padding:10px 0; color:${BT_MUTED};">Student ID</td><td style="padding:10px 0; color:${BT_PRIMARY}; font-weight:700; text-align:right;">${student.studentNumber}</td></tr>
          </table>
        </div>

        <!-- Embedded Entry QR Code -->
        <div style="text-align:center; margin:0 0 22px 0; padding:28px 20px; background-color:${BT_CARD}; border:2px dashed ${BT_PRIMARY}; border-radius:12px;">
          <span style="display:inline-block; background-color:${BT_PRIMARY}; color:#ffffff; padding:6px 18px; border-radius:20px; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:18px;">Entry QR Code</span>
          <div style="margin:0 auto; width:190px; height:190px; padding:12px; background:#ffffff; border-radius:10px; box-shadow:0 6px 20px rgba(0,0,0,0.35);">
            <img src="${qrCodeSrc}" alt="Entry QR Code (${student.studentNumber})" width="190" height="190" style="width:100%; height:100%; display:block; border-radius:4px;" />
          </div>
          <p style="margin:16px 0 4px 0; font-family:'Arial Black',Arial,sans-serif; font-size:15px; font-weight:900; color:${BT_TEXT}; letter-spacing:1px;">
            STUDENT ID: <span style="color:${BT_PRIMARY};">${student.studentNumber}</span>
          </p>
          <p style="font-size:13px; color:${BT_MUTED}; margin:4px 0 0 0; line-height:1.5;">Present this QR code at the registration desk for check-in.</p>
        </div>

        <!-- Important Instructions -->
        <div style="background-color:${BT_CARD}; border:1px solid #4a3800; border-left:4px solid #f9a825; border-radius:8px; padding:22px; margin:0 0 22px 0;">
          <h3 style="margin:0 0 12px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:#f9a825;">&#9888;&#65039; Important Instructions</h3>
          <ul style="margin:0; padding-left:18px; color:${BT_MUTED}; font-size:14px; line-height:1.8;">
            <li style="margin-bottom:6px;">Keep your <strong style="color:${BT_TEXT};">mobile phones on silent mode</strong> during the event.</li>
            <li style="margin-bottom:6px;">Carry your physical <strong style="color:${BT_TEXT};">college ID card</strong> for verification.</li>
            <li>Arrive at least <strong style="color:${BT_TEXT};">15 minutes early</strong> to avoid queues.</li>
          </ul>
        </div>

        <!-- Contact Coordinators -->
        <div style="background-color:${BT_CARD}; border:1px solid ${BT_BORDER}; border-left:4px solid ${BT_PRIMARY}; border-radius:8px; padding:22px; margin:0;">
          <h3 style="margin:0 0 12px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:${BT_PRIMARY};">&#128222; Need Help? Contact Coordinators</h3>
          <p style="margin:6px 0; font-size:14px; color:${BT_MUTED};"><strong style="color:${BT_TEXT};">Shivansh:</strong> 8115526688</p>
          <p style="margin:0; font-size:14px; color:${BT_MUTED};"><strong style="color:${BT_TEXT};">Sarika:</strong> 6394316608</p>
        </div>
      </div>`;
  return wrapEmail(body);
};

// 3. Event Reminder Template
export const buildReminderEmailHtml = (student, qrCodeSrc = "cid:student-qr-code") => {
  const body = `
      <div style="padding:36px 28px;">
        <div style="text-align:center; margin-bottom:28px;">
          <span style="display:inline-block; background-color:rgba(249,168,37,0.12); color:#f9a825; border:1px solid #7a5200; padding:8px 22px; border-radius:50px; font-size:13px; font-weight:700; letter-spacing:2px; text-transform:uppercase;">⏳ Event Reminder</span>
        </div>
        <p style="font-size:16px; color:${BT_TEXT}; margin:0 0 12px 0;">Hi <strong>${student.name || "Participant"}</strong>,</p>
        <p style="font-size:15px; color:${BT_MUTED}; line-height:1.7; margin:0 0 28px 0;">
          Just a heads-up — <strong style="color:${BT_TEXT};">Byte Talks — Alumni Edition</strong> is almost here! 🎤
          We can't wait to see you there. Here's everything you need.
        </p>

        <!-- Event Details -->
        <div style="background-color:${BT_CARD}; border:1px solid ${BT_BORDER}; border-left:4px solid ${BT_PRIMARY}; border-radius:8px; padding:22px; margin:0 0 22px 0;">
          <h3 style="margin:0 0 14px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:${BT_PRIMARY};">&#128205; Event Details</h3>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr><td style="padding:6px 0; font-size:14px; color:${BT_MUTED}; width:35%;">Date</td><td style="padding:6px 0; font-size:14px; color:${BT_TEXT}; font-weight:700;">30th October, 2026</td></tr>
            <tr><td style="padding:6px 0; font-size:14px; color:${BT_MUTED};">Venue</td><td style="padding:6px 0; font-size:14px; color:${BT_TEXT}; font-weight:700;">CSIT Seminar Hall</td></tr>
            <tr><td style="padding:6px 0; font-size:14px; color:${BT_MUTED};">Time</td><td style="padding:6px 0; font-size:14px; color:${BT_TEXT}; font-weight:700;">10:00 AM – 12:30 PM</td></tr>
          </table>
        </div>

        <!-- Student Details -->
        <div style="background-color:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:8px; padding:22px; margin:0 0 22px 0;">
          <h3 style="margin:0 0 14px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:${BT_MUTED};">&#128203; Your Details</h3>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr style="border-bottom:1px solid ${BT_BORDER};"><td style="padding:10px 0; color:${BT_MUTED};">Name</td><td style="padding:10px 0; color:${BT_TEXT}; font-weight:700; text-align:right;">${student.name || "N/A"}</td></tr>
            <tr style="border-bottom:1px solid ${BT_BORDER};"><td style="padding:10px 0; color:${BT_MUTED};">Branch</td><td style="padding:10px 0; color:${BT_TEXT}; font-weight:700; text-align:right;">${student.branch}</td></tr>
            <tr><td style="padding:10px 0; color:${BT_MUTED};">Student ID</td><td style="padding:10px 0; color:${BT_PRIMARY}; font-weight:700; text-align:right;">${student.studentNumber}</td></tr>
          </table>
        </div>

        <!-- Embedded Entry QR Code -->
        <div style="text-align:center; margin:0 0 22px 0; padding:28px 20px; background-color:${BT_CARD}; border:2px dashed ${BT_PRIMARY}; border-radius:12px;">
          <span style="display:inline-block; background-color:${BT_PRIMARY}; color:#ffffff; padding:6px 18px; border-radius:20px; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:18px;">Entry QR Code</span>
          <div style="margin:0 auto; width:190px; height:190px; padding:12px; background:#ffffff; border-radius:10px; box-shadow:0 6px 20px rgba(0,0,0,0.35);">
            <img src="${qrCodeSrc}" alt="Entry QR Code (${student.studentNumber})" width="190" height="190" style="width:100%; height:100%; display:block; border-radius:4px;" />
          </div>
          <p style="margin:16px 0 4px 0; font-family:'Arial Black',Arial,sans-serif; font-size:15px; font-weight:900; color:${BT_TEXT}; letter-spacing:1px;">
            STUDENT ID: <span style="color:${BT_PRIMARY};">${student.studentNumber}</span>
          </p>
          <p style="font-size:13px; color:${BT_MUTED}; margin:4px 0 0 0; line-height:1.5;">Present this QR code at the registration desk for check-in.</p>
        </div>

        <!-- Important Instructions -->
        <div style="background-color:${BT_CARD}; border:1px solid #4a3800; border-left:4px solid #f9a825; border-radius:8px; padding:22px; margin:0 0 22px 0;">
          <h3 style="margin:0 0 12px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:#f9a825;">&#9888;&#65039; Important Instructions</h3>
          <ul style="margin:0; padding-left:18px; color:${BT_MUTED}; font-size:14px; line-height:1.8;">
            <li style="margin-bottom:6px;">Keep your <strong style="color:${BT_TEXT};">mobile phones on silent mode</strong> during the event.</li>
            <li style="margin-bottom:6px;">Carry your physical <strong style="color:${BT_TEXT};">college ID card</strong> for verification.</li>
            <li>Arrive at least <strong style="color:${BT_TEXT};">15 minutes early</strong> to avoid queues.</li>
          </ul>
        </div>

        <!-- Contact Coordinators -->
        <div style="background-color:${BT_CARD}; border:1px solid ${BT_BORDER}; border-left:4px solid ${BT_PRIMARY}; border-radius:8px; padding:22px; margin:0;">
          <h3 style="margin:0 0 12px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:${BT_PRIMARY};">&#128222; Need Help? Contact Coordinators</h3>
          <p style="margin:6px 0; font-size:14px; color:${BT_MUTED};"><strong style="color:${BT_TEXT};">Shivansh:</strong> 8115526688</p>
          <p style="margin:0; font-size:14px; color:${BT_MUTED};"><strong style="color:${BT_TEXT};">Sarika:</strong> 6394316608</p>
        </div>
      </div>`;
  return wrapEmail(body);
};

// ==========================================
// 1. BYTE TALKS — OTP EMAIL
// ==========================================
export const sendOtpEmail = async (email, name, otp) => {
  if (process.env.TEST_MODE === "true") {
    console.log(`🧪 [TEST_MODE] Simulated sending OTP ${otp} to ${email}`);
    return;
  }
  try {
    const mailOptions = {
      from: `"Byte Talks 2026" <${process.env.EMAIL_USER || process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: "🔐 Action Required: Your OTP for Byte Talks 2026 Registration",
      html: buildOtpEmailHtml(name, otp),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP Email sent successfully to ${email}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email. Please try again later.");
  }
};

// ==========================================
// 2. BYTE TALKS — REGISTRATION SUCCESS EMAIL + QR CODE
// ==========================================
export const sendRegisterationEmail = async (student) => {
  try {
    const qrPayload = String(student.studentNumber || student._id);
    const qrBuffer = await generateQRCode(qrPayload);

    const mailOptions = {
      from: `"Byte Talks 2026" <${process.env.EMAIL_USER || process.env.EMAIL_USERNAME}>`,
      to: student.email,
      subject: "🎉 You're In! Your Entry QR Code for Byte Talks 2026 — Alumni Edition",
      html: buildRegistrationEmailHtml(student, "cid:student-qr-code"),
      attachments: [
        {
          filename: `ByteTalks-QR-${student.studentNumber || "entry"}.png`,
          content: qrBuffer,
          cid: "student-qr-code",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Registration Success Email (with QR code) sent to ${student.email}`);
  } catch (error) {
    console.error("❌ Error sending registration email:", error);
    throw error;
  }
};

// ==========================================
// 3. BYTE TALKS — EVENT REMINDER EMAIL + QR CODE
// ==========================================
export const sendReminderEmail = async (student) => {
  try {
    const qrPayload = String(student.studentNumber || student._id);
    const qrBuffer = await generateQRCode(qrPayload);

    const mailOptions = {
      from: `"Byte Talks 2026" <${process.env.EMAIL_USER || process.env.EMAIL_USERNAME}>`,
      to: student.email,
      subject: "📢 Reminder: Byte Talks — Alumni Edition is Almost Here!",
      html: buildReminderEmailHtml(student, "cid:student-qr-code"),
      attachments: [
        {
          filename: `ByteTalks-QR-${student.studentNumber || "entry"}.png`,
          content: qrBuffer,
          cid: "student-qr-code",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Reminder Email sent successfully to ${student.email}`);
  } catch (error) {
    console.error("❌ Error sending reminder email:", error);
    throw error;
  }
};
