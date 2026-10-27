import nodemailer from "nodemailer";
import { renderTicket } from "../ticket/renderTicket.js";

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

// ─── Byte Talks Design Tokens ─────────────────────────────────────────────────
const BT_BG       = "#0d1117";
const BT_CARD     = "#161b22";
const BT_GREEN    = "#00c853";
const BT_GREEN_DK = "#009624";
const BT_BORDER   = "#21262d";
const BT_TEXT     = "#e6edf3";
const BT_MUTED    = "#8b949e";

// ─── Shared header HTML ───────────────────────────────────────────────────────
const emailHeader = () => `
  <div style="background-color:${BT_BG}; text-align:center; padding:40px 20px 30px; border-bottom:3px solid ${BT_GREEN};">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="padding-right:14px; vertical-align:middle;">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="12" fill="${BT_GREEN}" fill-opacity="0.15"/>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" fill="${BT_GREEN}"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="${BT_GREEN}" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="12" y1="19" x2="12" y2="23" stroke="${BT_GREEN}" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="8" y1="23" x2="16" y2="23" stroke="${BT_GREEN}" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </td>
        <td style="vertical-align:middle; text-align:left;">
          <div style="font-family:'Arial Black',Arial,sans-serif; font-size:32px; font-weight:900; color:#ffffff; letter-spacing:2px; text-transform:uppercase; line-height:1;">BYTE</div>
          <div style="font-family:'Arial Black',Arial,sans-serif; font-size:32px; font-weight:900; color:${BT_GREEN}; letter-spacing:2px; text-transform:uppercase; line-height:1;">TALKS</div>
        </td>
      </tr>
    </table>
    <p style="margin:14px 0 0 0; font-family:Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:4px; text-transform:uppercase; color:${BT_MUTED};">ALUMNI EDITION &nbsp;·&nbsp; 30 OCT &nbsp;·&nbsp; CSIT SEMINAR HALL</p>
  </div>`;

// ─── Shared footer HTML ───────────────────────────────────────────────────────
const emailFooter = () => `
  <div style="background-color:#0a0f15; text-align:center; padding:28px 20px; border-top:1px solid ${BT_BORDER};">
    <p style="margin:0 0 6px 0; font-family:Arial,sans-serif; font-size:13px; color:${BT_MUTED};">Keep Learning &nbsp;·&nbsp; Keep Building &nbsp;·&nbsp; Keep Inspiring</p>
    <p style="margin:0 0 4px 0; font-family:Arial,sans-serif; font-size:13px; font-weight:700; color:${BT_TEXT};">Team GDG On Campus AKGEC</p>
    <p style="margin:0; font-family:Arial,sans-serif; font-size:11px; color:${BT_MUTED};">&copy; ${new Date().getFullYear()} GDG On Campus AKGEC. All rights reserved.</p>
  </div>`;

// ─── Email wrapper ────────────────────────────────────────────────────────────
const wrapEmail = (bodyHtml) => `
  <div style="background-color:#080c10; padding:20px 0; font-family:Arial,sans-serif;">
    <div style="max-width:600px; margin:0 auto; background-color:${BT_BG}; border:1px solid ${BT_BORDER}; border-radius:12px; overflow:hidden; box-shadow:0 8px 32px rgba(0,200,83,0.08);">
      ${emailHeader()}
      ${bodyHtml}
      ${emailFooter()}
    </div>
  </div>`;

// ==========================================
// 1. BYTE TALKS — OTP EMAIL
// ==========================================
export const sendOtpEmail = async (email, name, otp) => {
  if (process.env.TEST_MODE === "true") {
    console.log(`🧪 [TEST_MODE] Simulated sending OTP ${otp} to ${email}`);
    return;
  }
  try {
    const body = `
      <div style="padding:36px 28px;">
        <div style="text-align:center; margin-bottom:28px;">
          <span style="display:inline-block; background-color:rgba(0,200,83,0.12); color:${BT_GREEN}; border:1px solid ${BT_GREEN_DK}; padding:8px 22px; border-radius:50px; font-size:13px; font-weight:700; letter-spacing:2px; text-transform:uppercase;">🔐 Email Verification</span>
        </div>
        <p style="font-size:16px; color:${BT_TEXT}; margin:0 0 12px 0;">Hi <strong>${name}</strong>,</p>
        <p style="font-size:15px; color:${BT_MUTED}; line-height:1.7; margin:0 0 28px 0;">
          Thank you for registering for <strong style="color:${BT_TEXT};">Byte Talks — Alumni Edition</strong>.
          Use the One-Time Password below to verify your email and complete your registration.
        </p>
        <div style="text-align:center; margin:0 0 28px 0;">
          <div style="display:inline-block; background-color:${BT_CARD}; border:2px dashed ${BT_GREEN}; border-radius:12px; padding:28px 40px;">
            <p style="margin:0 0 8px 0; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:${BT_MUTED};">YOUR OTP</p>
            <span style="font-family:'Arial Black',Arial,sans-serif; font-size:42px; font-weight:900; letter-spacing:14px; color:${BT_GREEN};">${otp}</span>
          </div>
        </div>
        <p style="font-size:13px; color:${BT_MUTED}; text-align:center; margin:0;">⏳ This OTP is valid for <strong style="color:${BT_TEXT};">5 minutes</strong>. Do not share it with anyone.</p>
      </div>`;

    const mailOptions = {
      from: `"Byte Talks 2026" <${process.env.EMAIL_USER || process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: "🔐 Action Required: Your OTP for Byte Talks 2026 Registration",
      html: wrapEmail(body),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP Email sent successfully to ${email}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email. Please try again later.");
  }
};


// ==========================================
// 2. BYTE TALKS — REGISTRATION SUCCESS EMAIL + QR TICKET
// ==========================================
export const sendRegisterationEmail = async (student) => {
  try {
    const passDataUri = await renderTicket(student);

    const body = `
      <div style="padding:36px 28px;">
        <div style="text-align:center; margin-bottom:28px;">
          <span style="display:inline-block; background-color:rgba(0,200,83,0.12); color:${BT_GREEN}; border:1px solid ${BT_GREEN_DK}; padding:8px 22px; border-radius:50px; font-size:13px; font-weight:700; letter-spacing:2px; text-transform:uppercase;">🎉 Registration Confirmed</span>
        </div>
        <p style="font-size:16px; color:${BT_TEXT}; margin:0 0 12px 0;">Hi <strong>${student.name || "Participant"}</strong>,</p>
        <p style="font-size:15px; color:${BT_MUTED}; line-height:1.7; margin:0 0 28px 0;">
          You're officially in! 🎤 Your registration for <strong style="color:${BT_TEXT};">Byte Talks — Alumni Edition</strong> has been confirmed.
          Get ready to <strong style="color:${BT_GREEN};">Learn &middot; Connect &middot; Inspire</strong>.
        </p>

        <div style="background-color:${BT_CARD}; border:1px solid ${BT_BORDER}; border-left:4px solid ${BT_GREEN}; border-radius:8px; padding:22px; margin:0 0 22px 0;">
          <h3 style="margin:0 0 14px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:${BT_GREEN};">&#128205; Event Details</h3>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr><td style="padding:6px 0; font-size:14px; color:${BT_MUTED}; width:40%;">Date</td><td style="padding:6px 0; font-size:14px; color:${BT_TEXT}; font-weight:700;">30th October, 2026</td></tr>
            <tr><td style="padding:6px 0; font-size:14px; color:${BT_MUTED};">Venue</td><td style="padding:6px 0; font-size:14px; color:${BT_TEXT}; font-weight:700;">CSIT Seminar Hall</td></tr>
            <tr><td style="padding:6px 0; font-size:14px; color:${BT_MUTED};">Time</td><td style="padding:6px 0; font-size:14px; color:${BT_TEXT}; font-weight:700;">4:00 PM – 8:00 PM</td></tr>
          </table>
        </div>

        <div style="background-color:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:8px; padding:22px; margin:0 0 22px 0;">
          <h3 style="margin:0 0 14px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:${BT_MUTED};">&#128203; Your Details</h3>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr style="border-bottom:1px solid ${BT_BORDER};"><td style="padding:10px 0; color:${BT_MUTED};">Name</td><td style="padding:10px 0; color:${BT_TEXT}; font-weight:700; text-align:right;">${student.name || "N/A"}</td></tr>
            <tr style="border-bottom:1px solid ${BT_BORDER};"><td style="padding:10px 0; color:${BT_MUTED};">Branch</td><td style="padding:10px 0; color:${BT_TEXT}; font-weight:700; text-align:right;">${student.branch}</td></tr>
            <tr><td style="padding:10px 0; color:${BT_MUTED};">Student ID</td><td style="padding:10px 0; color:${BT_GREEN}; font-weight:700; text-align:right;">${student.studentNumber}</td></tr>
          </table>
        </div>

        <div style="text-align:center; margin:0 0 22px 0; padding:28px 20px; background-color:${BT_CARD}; border:2px dashed ${BT_GREEN}; border-radius:12px;">
          <span style="background-color:${BT_GREEN}; color:#000; padding:6px 18px; border-radius:20px; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px;">Official Entry Pass</span>
          <div style="margin-top:22px;"><img src="cid:gdg-ticket-pass" alt="Byte Talks Entry Pass" style="max-width:540px; width:100%; height:auto; border-radius:8px; box-shadow:0 4px 16px rgba(0,200,83,0.2);" /></div>
          <p style="font-size:13px; color:${BT_MUTED}; margin-top:16px; line-height:1.6;"><strong style="color:${BT_TEXT};">Note:</strong> Present this QR code at the registration desk for seamless check-in.</p>
        </div>

        <div style="background-color:${BT_CARD}; border:1px solid #3d2b00; border-left:4px solid #f9a825; border-radius:8px; padding:22px; margin:0 0 22px 0;">
          <h3 style="margin:0 0 12px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:#f9a825;">&#9888;&#65039; Important Instructions</h3>
          <ul style="margin:0; padding-left:18px; color:${BT_MUTED}; font-size:14px; line-height:1.8;">
            <li style="margin-bottom:6px;">Keep your <strong style="color:${BT_TEXT};">mobile phones on silent mode</strong> during the event.</li>
            <li style="margin-bottom:6px;">Carry your physical <strong style="color:${BT_TEXT};">college ID card</strong> for verification.</li>
            <li>Arrive at least <strong style="color:${BT_TEXT};">15 minutes early</strong> to avoid queues.</li>
          </ul>
        </div>

        <div style="background-color:${BT_CARD}; border:1px solid #3d0a06; border-left:4px solid #f44336; border-radius:8px; padding:22px; margin:0 0 22px 0;">
          <h3 style="margin:0 0 12px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:#f44336;">&#9878;&#65039; Discipline &amp; Decorum</h3>
          <ul style="margin:0; padding-left:18px; color:${BT_MUTED}; font-size:14px; line-height:1.8;">
            <li style="margin-bottom:6px;">Any cheating attempt will result in immediate disqualification.</li>
            <li style="margin-bottom:6px;">Bring your own pen; paper will be provided.</li>
            <li>Smart watches and similar devices must be submitted before the event begins.</li>
          </ul>
        </div>

        <div style="background-color:${BT_CARD}; border:1px solid ${BT_BORDER}; border-left:4px solid ${BT_GREEN}; border-radius:8px; padding:22px; margin:0;">
          <h3 style="margin:0 0 12px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:${BT_GREEN};">&#128222; Need Help?</h3>
          <p style="margin:6px 0; font-size:14px; color:${BT_MUTED};"><strong style="color:${BT_TEXT};">Naman Srivastava:</strong> 7275573139</p>
          <p style="margin:0; font-size:14px; color:${BT_MUTED};"><strong style="color:${BT_TEXT};">Trisha Singh:</strong> 8081387855</p>
        </div>
      </div>`;

    const mailOptions = {
      from: `"Byte Talks 2026" <${process.env.EMAIL_USER || process.env.EMAIL_USERNAME}>`,
      to: student.email,
      subject: "🎉 You're In! Your Entry Pass for Byte Talks 2026 — Alumni Edition",
      html: wrapEmail(body),
      attachments: [
        {
          filename: `ByteTalks-Ticket-${student.studentNumber || "2026"}.png`,
          path: passDataUri,
          cid: "gdg-ticket-pass",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Registration Success Email (with QR ticket) sent to ${student.email}`);
  } catch (error) {
    console.error("❌ Error sending registration email:", error);
    throw error;
  }
};


// ==========================================
// 3. BYTE TALKS — EVENT REMINDER EMAIL
// ==========================================
export const sendReminderEmail = async (student) => {
  try {
    const passDataUri = await renderTicket(student);

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

        <div style="background-color:${BT_CARD}; border:1px solid ${BT_BORDER}; border-left:4px solid ${BT_GREEN}; border-radius:8px; padding:22px; margin:0 0 22px 0;">
          <h3 style="margin:0 0 14px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:${BT_GREEN};">&#128205; Event Details</h3>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr><td style="padding:6px 0; font-size:14px; color:${BT_MUTED}; width:40%;">Date</td><td style="padding:6px 0; font-size:14px; color:${BT_TEXT}; font-weight:700;">30th October, 2026</td></tr>
            <tr><td style="padding:6px 0; font-size:14px; color:${BT_MUTED};">Venue</td><td style="padding:6px 0; font-size:14px; color:${BT_TEXT}; font-weight:700;">CSIT Seminar Hall</td></tr>
            <tr><td style="padding:6px 0; font-size:14px; color:${BT_MUTED};">Time</td><td style="padding:6px 0; font-size:14px; color:${BT_TEXT}; font-weight:700;">4:00 PM – 8:00 PM</td></tr>
          </table>
        </div>

        <div style="background-color:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:8px; padding:22px; margin:0 0 22px 0;">
          <h3 style="margin:0 0 14px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:${BT_MUTED};">&#128203; Your Details</h3>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr style="border-bottom:1px solid ${BT_BORDER};"><td style="padding:10px 0; color:${BT_MUTED};">Name</td><td style="padding:10px 0; color:${BT_TEXT}; font-weight:700; text-align:right;">${student.name || "N/A"}</td></tr>
            <tr style="border-bottom:1px solid ${BT_BORDER};"><td style="padding:10px 0; color:${BT_MUTED};">Branch</td><td style="padding:10px 0; color:${BT_TEXT}; font-weight:700; text-align:right;">${student.branch}</td></tr>
            <tr><td style="padding:10px 0; color:${BT_MUTED};">Student ID</td><td style="padding:10px 0; color:${BT_GREEN}; font-weight:700; text-align:right;">${student.studentNumber}</td></tr>
          </table>
        </div>

        <div style="text-align:center; margin:0 0 22px 0; padding:28px 20px; background-color:${BT_CARD}; border:2px dashed ${BT_GREEN}; border-radius:12px;">
          <span style="background-color:${BT_GREEN}; color:#000; padding:6px 18px; border-radius:20px; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px;">Official Entry Pass</span>
          <div style="margin-top:22px;"><img src="cid:gdg-ticket-pass" alt="Byte Talks Entry Pass" style="max-width:540px; width:100%; height:auto; border-radius:8px; box-shadow:0 4px 16px rgba(0,200,83,0.2);" /></div>
          <p style="font-size:13px; color:${BT_MUTED}; margin-top:16px; line-height:1.6;"><strong style="color:${BT_TEXT};">Note:</strong> Present this QR code at the registration desk for seamless check-in.</p>
        </div>

        <div style="background-color:${BT_CARD}; border:1px solid ${BT_BORDER}; border-left:4px solid ${BT_GREEN}; border-radius:8px; padding:22px; margin:0;">
          <h3 style="margin:0 0 12px 0; font-family:'Arial Black',Arial,sans-serif; font-size:12px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:${BT_GREEN};">&#128222; Need Help?</h3>
          <p style="margin:6px 0; font-size:14px; color:${BT_MUTED};"><strong style="color:${BT_TEXT};">Naman Srivastava:</strong> 7275573139</p>
          <p style="margin:0; font-size:14px; color:${BT_MUTED};"><strong style="color:${BT_TEXT};">Trisha Singh:</strong> 8081387855</p>
        </div>
      </div>`;

    const mailOptions = {
      from: `"Byte Talks 2026" <${process.env.EMAIL_USER || process.env.EMAIL_USERNAME}>`,
      to: student.email,
      subject: "📢 Reminder: Byte Talks — Alumni Edition is Almost Here!",
      html: wrapEmail(body),
      attachments: [
        {
          filename: `ByteTalks-Ticket-${student.studentNumber || "2026"}.png`,
          path: passDataUri,
          cid: "gdg-ticket-pass",
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
