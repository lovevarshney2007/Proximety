import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { generateQRCode } from "../ticket/generateQRCode.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.resolve(__dirname, "..", "..", "assets", "logos", "byte-talks-logo.png");
const MIC_PATH = path.resolve(__dirname, "..", "..", "assets", "graphics", "mic-icon.png");

// Lazy-cached base64 data URIs (for local browser preview & fallback rendering)
let _logoDataUri = null;
export function getLogoDataUri() {
  if (!_logoDataUri) {
    try {
      const buf = fs.readFileSync(LOGO_PATH);
      _logoDataUri = `data:image/png;base64,${buf.toString("base64")}`;
    } catch (err) {
      console.warn("Could not load byte-talks-logo.png:", err.message);
      _logoDataUri = "";
    }
  }
  return _logoDataUri;
}

let _micDataUri = null;
export function getMicDataUri() {
  if (!_micDataUri) {
    try {
      const buf = fs.readFileSync(MIC_PATH);
      _micDataUri = `data:image/png;base64,${buf.toString("base64")}`;
    } catch (err) {
      console.warn("Could not load mic-icon.png:", err.message);
      _micDataUri = "";
    }
  }
  return _micDataUri;
}

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

// ─── Design Tokens (Palette: #097b59 & #1d212c) ──────────────────────────────
const BT_PRIMARY      = "#097b59";               // Primary emerald green
const BT_ACCENT       = "#2dd494";               // Bright emerald accent
const BT_CONTAINER    = "#1d212c";               // Dark slate container base
const BT_BG           = "#12151d";               // Canvas background
const BT_CARD         = "#222735";               // Card surfaces
const BT_CARD_HEADER  = "#1a1e2a";               // Elevated card headers
const BT_BORDER       = "#2e3547";               // Card borders
const BT_TEXT         = "#f0f4f8";               // Clean white text
const BT_TEXT_MUTED   = "#aab4c2";               // Body secondary text
const BT_MUTED        = "#8e99a8";               // Labels & metadata

// ─── Shared Header HTML with Rasterized PNG Microphone + Logo Lockup ──────────
export const emailHeader = (logoSrc = "cid:byte-talks-logo", micSrc = "cid:byte-talks-mic") => `
  <!-- Top Emerald Gradient Bar -->
  <div style="background:linear-gradient(90deg, #097b59 0%, #2dd494 50%, #097b59 100%); height:4px; width:100%;"></div>

  <div style="background-color:${BT_CONTAINER}; text-align:center; padding:32px 20px 22px; border-bottom:1px solid #282e3d;">
    <!-- Logo + Mic Lockup Table (Uses <img> tags so Gmail/Outlook never strip it) -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="vertical-align:middle; padding-right:14px;">
          <img src="${micSrc}" alt="Microphone" width="44" height="44" style="width:44px; height:44px; display:block; border-radius:12px; border:0; outline:none;" />
        </td>
        <td style="vertical-align:middle;">
          <img src="${logoSrc}" alt="Byte Talks" width="200" style="width:200px; max-width:100%; height:auto; display:block; border:0; outline:none;" />
        </td>
      </tr>
    </table>

    <!-- Edition Subtitle Badge -->
    <div style="margin-top:14px;">
      <span style="display:inline-block; background:rgba(9,123,89,0.12); border:1px solid rgba(9,123,89,0.35); color:${BT_ACCENT}; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:4px 14px; border-radius:20px;">
        Alumni Edition &bull; 30 Oct &bull; CSIT Seminar Hall
      </span>
    </div>
  </div>`;

// ─── Shared Footer HTML ───────────────────────────────────────────────────────
export const emailFooter = () => `
  <div style="background-color:#161922; text-align:center; padding:22px 20px; border-top:1px solid #252a37;">
    <p style="margin:0 0 4px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-size:12px; font-weight:600; color:${BT_MUTED};">Google Developer Groups on Campus &middot; AKGEC</p>
    <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-size:11px; color:#6b7685;">Ajay Kumar Garg Engineering College, Ghaziabad</p>
  </div>`;

// ─── Email Wrapper ────────────────────────────────────────────────────────────
export const wrapEmail = (bodyHtml, logoSrc = "cid:byte-talks-logo", micSrc = "cid:byte-talks-mic") => `
  <div style="background-color:${BT_BG}; padding:28px 12px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:580px; margin:0 auto; background-color:${BT_CONTAINER}; border:1px solid ${BT_BORDER}; border-radius:12px; overflow:hidden; box-shadow:0 10px 36px rgba(0,0,0,0.45);">
      ${emailHeader(logoSrc, micSrc)}
      ${bodyHtml}
      ${emailFooter()}
    </div>
  </div>`;

// ─── Exported Template Builders (Single Source of Truth) ─────────────────────

// 1. OTP Email Template
export const buildOtpEmailHtml = (name, otp, logoSrc = "cid:byte-talks-logo", micSrc = "cid:byte-talks-mic") => {
  const body = `
      <div style="padding:32px 28px;">
        <p style="font-size:15px; color:#ffffff; font-weight:600; margin:0 0 10px 0;">Hi ${name},</p>
        <p style="font-size:14px; color:${BT_TEXT_MUTED}; line-height:1.6; margin:0 0 24px 0;">
          Thank you for registering for <strong>Byte Talks &mdash; Alumni Edition</strong>.
          Use the one-time verification code below to verify your college email and complete your registration:
        </p>

        <!-- Decorated OTP Verification Card -->
        <div style="background:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:12px; padding:28px 20px; text-align:center; margin:0 0 24px 0; box-shadow:0 6px 20px rgba(0,0,0,0.3);">
          <div style="display:inline-block; background:rgba(9,123,89,0.16); border:1px solid ${BT_PRIMARY}; color:${BT_ACCENT}; font-size:10px; font-weight:800; letter-spacing:2px; text-transform:uppercase; padding:4px 14px; border-radius:12px; margin-bottom:14px;">
            One-Time Password
          </div>
          <div>
            <span style="font-family:'SF Mono',Consolas,Menlo,Monaco,monospace; font-size:40px; font-weight:800; letter-spacing:12px; color:${BT_ACCENT}; text-shadow:0 0 24px rgba(9,123,89,0.45); margin-left:12px;">${otp}</span>
          </div>
          <div style="margin-top:14px; font-size:12px; color:${BT_MUTED};">
            Valid for <strong>5 minutes</strong> &bull; Single-use verification code
          </div>
        </div>

        <p style="font-size:12px; color:${BT_MUTED}; text-align:center; margin:0;">
          If you did not initiate this request, you can safely ignore this email.
        </p>
      </div>`;
  return wrapEmail(body, logoSrc, micSrc);
};

// 2. Registration Confirmation Template
export const buildRegistrationEmailHtml = (
  student,
  qrCodeSrc = "cid:student-qr-code",
  logoSrc = "cid:byte-talks-logo",
  micSrc = "cid:byte-talks-mic"
) => {
  const body = `
      <div style="padding:32px 28px;">
        <p style="font-size:15px; color:#ffffff; font-weight:600; margin:0 0 8px 0;">Hi ${student.name || "Participant"},</p>
        <p style="font-size:14px; color:${BT_TEXT_MUTED}; line-height:1.6; margin:0 0 22px 0;">
          Your registration for <strong>Byte Talks &mdash; Alumni Edition</strong> has been confirmed. Below is your event schedule and personal entry pass.
        </p>

        <!-- 3 Quick Event Stat Chips -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom:18px;">
          <tr>
            <td style="width:33.33%; padding:0 4px 0 0;">
              <div style="background:${BT_CARD_HEADER}; border:1px solid ${BT_BORDER}; border-top:2px solid ${BT_PRIMARY}; border-radius:8px; padding:12px 8px; text-align:center;">
                <div style="font-size:10px; font-weight:700; color:${BT_MUTED}; letter-spacing:1.5px; text-transform:uppercase;">DATE</div>
                <div style="font-size:13px; font-weight:700; color:#ffffff; margin-top:4px;">30 OCT 2026</div>
              </div>
            </td>
            <td style="width:33.33%; padding:0 2px;">
              <div style="background:${BT_CARD_HEADER}; border:1px solid ${BT_BORDER}; border-top:2px solid ${BT_PRIMARY}; border-radius:8px; padding:12px 8px; text-align:center;">
                <div style="font-size:10px; font-weight:700; color:${BT_MUTED}; letter-spacing:1.5px; text-transform:uppercase;">TIME</div>
                <div style="font-size:13px; font-weight:700; color:#ffffff; margin-top:4px;">10:00 AM – 12:30 PM</div>
              </div>
            </td>
            <td style="width:33.33%; padding:0 0 0 4px;">
              <div style="background:${BT_CARD_HEADER}; border:1px solid ${BT_BORDER}; border-top:2px solid ${BT_PRIMARY}; border-radius:8px; padding:12px 8px; text-align:center;">
                <div style="font-size:10px; font-weight:700; color:${BT_MUTED}; letter-spacing:1.5px; text-transform:uppercase;">VENUE</div>
                <div style="font-size:13px; font-weight:700; color:#ffffff; margin-top:4px;">CSIT SEMINAR HALL</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Registered Attendee Card -->
        <div style="background:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:10px; padding:16px 20px; margin-bottom:20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="vertical-align:middle;">
                <div style="font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:${BT_PRIMARY};">REGISTERED ATTENDEE</div>
                <div style="font-size:16px; font-weight:700; color:#ffffff; margin-top:3px;">${student.name || "Participant"}</div>
                <div style="font-size:12px; color:${BT_MUTED}; margin-top:2px;">${student.branch} &bull; AKGEC</div>
              </td>
              <td style="vertical-align:middle; text-align:right;">
                <div style="display:inline-block; background:rgba(9,123,89,0.14); border:1px solid ${BT_PRIMARY}; border-radius:8px; padding:6px 14px; text-align:center;">
                  <div style="font-size:9px; font-weight:700; letter-spacing:1px; color:${BT_MUTED}; text-transform:uppercase;">STUDENT ID</div>
                  <div style="font-size:14px; font-weight:800; color:${BT_ACCENT}; font-family:'SF Mono',Consolas,monospace;">${student.studentNumber}</div>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Official Entry Pass / QR Code Box -->
        <div style="background:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:12px; overflow:hidden; margin-bottom:20px; box-shadow:0 8px 24px rgba(0,0,0,0.35);">
          <!-- Pass Header Strip -->
          <div style="background:${BT_CARD_HEADER}; padding:10px 18px; border-bottom:1px solid #282e3d;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
              <tr>
                <td style="font-size:10px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:${BT_PRIMARY};">
                  &bull; OFFICIAL ENTRY PASS
                </td>
                <td style="text-align:right; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:${BT_ACCENT};">
                  ADMIT ONE
                </td>
              </tr>
            </table>
          </div>

          <div style="padding:24px 20px; text-align:center;">
            <!-- QR Tile in white rounded frame -->
            <div style="display:inline-block; padding:12px; background:#ffffff; border-radius:10px; box-shadow:0 6px 20px rgba(0,0,0,0.35);">
              <img src="${qrCodeSrc}" alt="Entry QR Code" width="165" height="165" style="display:block; width:165px; height:165px;" />
            </div>

            <!-- Scannable ID Chip -->
            <div style="margin-top:14px;">
              <span style="font-family:'SF Mono',Consolas,monospace; font-size:13px; font-weight:800; color:#ffffff; background:#141720; border:1px solid #2b3244; padding:5px 16px; border-radius:20px; letter-spacing:1px;">
                STUDENT ID: <strong style="color:${BT_ACCENT};">${student.studentNumber}</strong>
              </span>
            </div>

            <p style="margin:12px 0 0 0; font-size:12px; color:${BT_MUTED};">
              Present this QR code at the check-in desk for entry verification.
            </p>
          </div>
        </div>

        <!-- Important Guidelines with Numbered Badges -->
        <div style="background:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:10px; padding:18px 20px; margin-bottom:20px;">
          <div style="font-size:10px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:${BT_PRIMARY}; margin-bottom:12px;">
            IMPORTANT GUIDELINES
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; font-size:13px; color:${BT_TEXT_MUTED};">
            <tr>
              <td style="padding:5px 0; vertical-align:top; width:26px;">
                <span style="display:inline-block; background:rgba(9,123,89,0.2); color:${BT_ACCENT}; font-size:10px; font-weight:800; width:18px; height:18px; line-height:18px; text-align:center; border-radius:50%; border:1px solid ${BT_PRIMARY};">1</span>
              </td>
              <td style="padding:5px 0; vertical-align:middle; line-height:1.5;">
                Carry your physical <strong style="color:#ffffff;">College ID Card</strong> for verification.
              </td>
            </tr>
            <tr>
              <td style="padding:5px 0; vertical-align:top;">
                <span style="display:inline-block; background:rgba(9,123,89,0.2); color:${BT_ACCENT}; font-size:10px; font-weight:800; width:18px; height:18px; line-height:18px; text-align:center; border-radius:50%; border:1px solid ${BT_PRIMARY};">2</span>
              </td>
              <td style="padding:5px 0; vertical-align:middle; line-height:1.5;">
                Arrive at the CSIT Seminar Hall by <strong style="color:#ffffff;">9:45 AM</strong> (15 minutes early).
              </td>
            </tr>
            <tr>
              <td style="padding:5px 0; vertical-align:top;">
                <span style="display:inline-block; background:rgba(9,123,89,0.2); color:${BT_ACCENT}; font-size:10px; font-weight:800; width:18px; height:18px; line-height:18px; text-align:center; border-radius:50%; border:1px solid ${BT_PRIMARY};">3</span>
              </td>
              <td style="padding:5px 0; vertical-align:middle; line-height:1.5;">
                Keep all mobile devices on <strong style="color:#ffffff;">silent mode</strong> inside the hall.
              </td>
            </tr>
          </table>
        </div>

        <!-- Event Coordinator Bar -->
        <div style="background:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:10px; padding:16px 20px; margin:0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="vertical-align:middle;">
                <div style="font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:${BT_MUTED};">NEED HELP?</div>
                <div style="font-size:13px; font-weight:600; color:#ffffff; margin-top:2px;">Event Coordinator</div>
              </td>
              <td style="vertical-align:middle; text-align:right;">
                <span style="display:inline-block; background:#161922; border:1px solid ${BT_BORDER}; color:${BT_TEXT}; font-size:12px; font-weight:600; padding:6px 14px; border-radius:6px;">Shivansh: <strong style="color:${BT_ACCENT};">8115526688</strong></span>
              </td>
            </tr>
          </table>
        </div>
      </div>`;
  return wrapEmail(body, logoSrc, micSrc);
};

// 3. Event Reminder Template
export const buildReminderEmailHtml = (
  student,
  qrCodeSrc = "cid:student-qr-code",
  logoSrc = "cid:byte-talks-logo",
  micSrc = "cid:byte-talks-mic"
) => {
  const body = `
      <div style="padding:32px 28px;">
        <p style="font-size:15px; color:#ffffff; font-weight:600; margin:0 0 8px 0;">Hi ${student.name || "Participant"},</p>
        <p style="font-size:14px; color:${BT_TEXT_MUTED}; line-height:1.6; margin:0 0 22px 0;">
          This is a quick reminder that <strong>Byte Talks &mdash; Alumni Edition</strong> takes place on <strong>Friday, 30th October</strong> at CSIT Seminar Hall. Here is your schedule and entry pass.
        </p>

        <!-- 3 Quick Event Stat Chips -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom:18px;">
          <tr>
            <td style="width:33.33%; padding:0 4px 0 0;">
              <div style="background:${BT_CARD_HEADER}; border:1px solid ${BT_BORDER}; border-top:2px solid ${BT_PRIMARY}; border-radius:8px; padding:12px 8px; text-align:center;">
                <div style="font-size:10px; font-weight:700; color:${BT_MUTED}; letter-spacing:1.5px; text-transform:uppercase;">DATE</div>
                <div style="font-size:13px; font-weight:700; color:#ffffff; margin-top:4px;">30 OCT 2026</div>
              </div>
            </td>
            <td style="width:33.33%; padding:0 2px;">
              <div style="background:${BT_CARD_HEADER}; border:1px solid ${BT_BORDER}; border-top:2px solid ${BT_PRIMARY}; border-radius:8px; padding:12px 8px; text-align:center;">
                <div style="font-size:10px; font-weight:700; color:${BT_MUTED}; letter-spacing:1.5px; text-transform:uppercase;">TIME</div>
                <div style="font-size:13px; font-weight:700; color:#ffffff; margin-top:4px;">10:00 AM – 12:30 PM</div>
              </div>
            </td>
            <td style="width:33.33%; padding:0 0 0 4px;">
              <div style="background:${BT_CARD_HEADER}; border:1px solid ${BT_BORDER}; border-top:2px solid ${BT_PRIMARY}; border-radius:8px; padding:12px 8px; text-align:center;">
                <div style="font-size:10px; font-weight:700; color:${BT_MUTED}; letter-spacing:1.5px; text-transform:uppercase;">VENUE</div>
                <div style="font-size:13px; font-weight:700; color:#ffffff; margin-top:4px;">CSIT SEMINAR HALL</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Registered Attendee Card -->
        <div style="background:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:10px; padding:16px 20px; margin-bottom:20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="vertical-align:middle;">
                <div style="font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:${BT_PRIMARY};">REGISTERED ATTENDEE</div>
                <div style="font-size:16px; font-weight:700; color:#ffffff; margin-top:3px;">${student.name || "Participant"}</div>
                <div style="font-size:12px; color:${BT_MUTED}; margin-top:2px;">${student.branch} &bull; AKGEC</div>
              </td>
              <td style="vertical-align:middle; text-align:right;">
                <div style="display:inline-block; background:rgba(9,123,89,0.14); border:1px solid ${BT_PRIMARY}; border-radius:8px; padding:6px 14px; text-align:center;">
                  <div style="font-size:9px; font-weight:700; letter-spacing:1px; color:${BT_MUTED}; text-transform:uppercase;">STUDENT ID</div>
                  <div style="font-size:14px; font-weight:800; color:${BT_ACCENT}; font-family:'SF Mono',Consolas,monospace;">${student.studentNumber}</div>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Official Entry Pass / QR Code Box -->
        <div style="background:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:12px; overflow:hidden; margin-bottom:20px; box-shadow:0 8px 24px rgba(0,0,0,0.35);">
          <!-- Pass Header Strip -->
          <div style="background:${BT_CARD_HEADER}; padding:10px 18px; border-bottom:1px solid #282e3d;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
              <tr>
                <td style="font-size:10px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:${BT_PRIMARY};">
                  &bull; OFFICIAL ENTRY PASS
                </td>
                <td style="text-align:right; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:${BT_ACCENT};">
                  ADMIT ONE
                </td>
              </tr>
            </table>
          </div>

          <div style="padding:24px 20px; text-align:center;">
            <!-- QR Tile in white rounded frame -->
            <div style="display:inline-block; padding:12px; background:#ffffff; border-radius:10px; box-shadow:0 6px 20px rgba(0,0,0,0.35);">
              <img src="${qrCodeSrc}" alt="Entry QR Code" width="165" height="165" style="display:block; width:165px; height:165px;" />
            </div>

            <!-- Scannable ID Chip -->
            <div style="margin-top:14px;">
              <span style="font-family:'SF Mono',Consolas,monospace; font-size:13px; font-weight:800; color:#ffffff; background:#141720; border:1px solid #2b3244; padding:5px 16px; border-radius:20px; letter-spacing:1px;">
                STUDENT ID: <strong style="color:${BT_ACCENT};">${student.studentNumber}</strong>
              </span>
            </div>

            <p style="margin:12px 0 0 0; font-size:12px; color:${BT_MUTED};">
              Present this QR code at the check-in desk for entry verification.
            </p>
          </div>
        </div>

        <!-- Important Guidelines with Numbered Badges -->
        <div style="background:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:10px; padding:18px 20px; margin-bottom:20px;">
          <div style="font-size:10px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:${BT_PRIMARY}; margin-bottom:12px;">
            IMPORTANT GUIDELINES
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; font-size:13px; color:${BT_TEXT_MUTED};">
            <tr>
              <td style="padding:5px 0; vertical-align:top; width:26px;">
                <span style="display:inline-block; background:rgba(9,123,89,0.2); color:${BT_ACCENT}; font-size:10px; font-weight:800; width:18px; height:18px; line-height:18px; text-align:center; border-radius:50%; border:1px solid ${BT_PRIMARY};">1</span>
              </td>
              <td style="padding:5px 0; vertical-align:middle; line-height:1.5;">
                Carry your physical <strong style="color:#ffffff;">College ID Card</strong> for verification.
              </td>
            </tr>
            <tr>
              <td style="padding:5px 0; vertical-align:top;">
                <span style="display:inline-block; background:rgba(9,123,89,0.2); color:${BT_ACCENT}; font-size:10px; font-weight:800; width:18px; height:18px; line-height:18px; text-align:center; border-radius:50%; border:1px solid ${BT_PRIMARY};">2</span>
              </td>
              <td style="padding:5px 0; vertical-align:middle; line-height:1.5;">
                Arrive at the CSIT Seminar Hall by <strong style="color:#ffffff;">9:45 AM</strong> (15 minutes early).
              </td>
            </tr>
            <tr>
              <td style="padding:5px 0; vertical-align:top;">
                <span style="display:inline-block; background:rgba(9,123,89,0.2); color:${BT_ACCENT}; font-size:10px; font-weight:800; width:18px; height:18px; line-height:18px; text-align:center; border-radius:50%; border:1px solid ${BT_PRIMARY};">3</span>
              </td>
              <td style="padding:5px 0; vertical-align:middle; line-height:1.5;">
                Keep all mobile devices on <strong style="color:#ffffff;">silent mode</strong> inside the hall.
              </td>
            </tr>
          </table>
        </div>

        <!-- Event Coordinator Bar -->
        <div style="background:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:10px; padding:16px 20px; margin:0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="vertical-align:middle;">
                <div style="font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:${BT_MUTED};">NEED HELP?</div>
                <div style="font-size:13px; font-weight:600; color:#ffffff; margin-top:2px;">Event Coordinator</div>
              </td>
              <td style="vertical-align:middle; text-align:right;">
                <span style="display:inline-block; background:#161922; border:1px solid ${BT_BORDER}; color:${BT_TEXT}; font-size:12px; font-weight:600; padding:6px 14px; border-radius:6px;">Shivansh: <strong style="color:${BT_ACCENT};">8115526688</strong></span>
              </td>
            </tr>
          </table>
        </div>
      </div>`;
  return wrapEmail(body, logoSrc, micSrc);
};

// 4. Event Invitation / Information Template
export const buildEventInviteEmailHtml = (
  {
    name = "",
    registrationUrl = "https://register.gdgakgec.org",
    eventDate = "30 OCT 2026",
    eventTime = "10:00 AM – 12:30 PM",
    eventVenue = "CSIT SEMINAR HALL",
  } = {},
  logoSrc = "cid:byte-talks-logo",
  micSrc = "cid:byte-talks-mic"
) => {
  const greeting = name && name.trim() && name !== "Student" && name !== "Participant"
    ? `Hey ${name.trim()},`
    : `Hey everyone,`;

  const body = `
      <div style="padding:32px 28px;">
        <p style="font-size:16px; color:#ffffff; font-weight:600; margin:0 0 14px 0;">${greeting}</p>
        
        <p style="font-size:14px; color:${BT_TEXT_MUTED}; line-height:1.7; margin:0 0 14px 0;">
          As you move deeper into your 2nd year, discussions about internships, placements, DSA, open-source, and tech stacks naturally start picking up. With countless roadmaps and conflicting advice across social media, it is easy to feel confused about where to actually invest your time.
        </p>

        <p style="font-size:14px; color:${BT_TEXT_MUTED}; line-height:1.7; margin:0 0 22px 0;">
          To help you cut through the noise, <strong style="color:#ffffff;">GDG on Campus AKGEC</strong> is organizing <strong style="color:${BT_ACCENT};">Byte Talks &mdash; Alumni Edition</strong>. We are bringing back our college alumni who sat in these exact classrooms, navigated the same curriculum, and cracked top tech firms to talk directly with you.
        </p>

        <!-- 3 Event Stat Chips -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom:22px;">
          <tr>
            <td style="width:33.33%; padding:0 4px 0 0;">
              <div style="background:${BT_CARD_HEADER}; border:1px solid ${BT_BORDER}; border-top:2px solid ${BT_PRIMARY}; border-radius:8px; padding:12px 8px; text-align:center;">
                <div style="font-size:10px; font-weight:700; color:${BT_MUTED}; letter-spacing:1.5px; text-transform:uppercase;">DATE</div>
                <div style="font-size:13px; font-weight:700; color:#ffffff; margin-top:4px;">${eventDate}</div>
              </div>
            </td>
            <td style="width:33.33%; padding:0 2px;">
              <div style="background:${BT_CARD_HEADER}; border:1px solid ${BT_BORDER}; border-top:2px solid ${BT_PRIMARY}; border-radius:8px; padding:12px 8px; text-align:center;">
                <div style="font-size:10px; font-weight:700; color:${BT_MUTED}; letter-spacing:1.5px; text-transform:uppercase;">TIME</div>
                <div style="font-size:13px; font-weight:700; color:#ffffff; margin-top:4px;">${eventTime}</div>
              </div>
            </td>
            <td style="width:33.33%; padding:0 0 0 4px;">
              <div style="background:${BT_CARD_HEADER}; border:1px solid ${BT_BORDER}; border-top:2px solid ${BT_PRIMARY}; border-radius:8px; padding:12px 8px; text-align:center;">
                <div style="font-size:10px; font-weight:700; color:${BT_MUTED}; letter-spacing:1.5px; text-transform:uppercase;">VENUE</div>
                <div style="font-size:13px; font-weight:700; color:#ffffff; margin-top:4px;">${eventVenue}</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Key Discussion Points -->
        <div style="background:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:10px; padding:18px 20px; margin-bottom:22px;">
          <div style="font-size:11px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:${BT_ACCENT}; margin-bottom:12px;">
            WHAT WE WILL BE DISCUSSING
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; font-size:13px; color:${BT_TEXT_MUTED};">
            <tr>
              <td style="padding:6px 0; vertical-align:top; width:20px; color:${BT_ACCENT}; font-size:15px; line-height:1.4;">&bull;</td>
              <td style="padding:6px 0; vertical-align:middle; line-height:1.6;">
                <strong style="color:#ffffff;">The 2nd-to-3rd Year Roadmap:</strong> How to balance college academics while building strong DSA fundamentals and genuine projects that get noticed.
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0; vertical-align:top; width:20px; color:${BT_ACCENT}; font-size:15px; line-height:1.4;">&bull;</td>
              <td style="padding:6px 0; vertical-align:middle; line-height:1.6;">
                <strong style="color:#ffffff;">Choosing Your Focus:</strong> Honest advice on navigating Web Development, Cloud/DevOps, AI/ML, and Core CS roles without getting lost in tutorial hell.
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0; vertical-align:top; width:20px; color:${BT_ACCENT}; font-size:15px; line-height:1.4;">&bull;</td>
              <td style="padding:6px 0; vertical-align:middle; line-height:1.6;">
                <strong style="color:#ffffff;">Internships &amp; Off-Campus Opportunities:</strong> How our alumni secured internships and placement offers, resume strategies, and common mistakes to avoid.
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0; vertical-align:top; width:20px; color:${BT_ACCENT}; font-size:15px; line-height:1.4;">&bull;</td>
              <td style="padding:6px 0; vertical-align:middle; line-height:1.6;">
                <strong style="color:#ffffff;">Open Q&amp;A:</strong> Direct, unfiltered discussion where you can ask whatever doubts you have about your tech journey.
              </td>
            </tr>
          </table>
        </div>

        <!-- Registration Card -->
        <div style="background:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:10px; padding:22px 20px; text-align:center; margin-bottom:22px;">
          <p style="font-size:13px; color:${BT_TEXT_MUTED}; margin:0 0 16px 0; line-height:1.6;">
            Seating inside the CSIT Seminar Hall is limited, so please register early to confirm your attendance:
          </p>
          <div style="margin:10px 0 14px 0;">
            <a href="${registrationUrl}" target="_blank" style="display:inline-block; background:linear-gradient(135deg, #097b59 0%, #2dd494 100%); color:#0b1d16; font-size:13px; font-weight:800; letter-spacing:0.5px; text-decoration:none; padding:12px 28px; border-radius:8px; box-shadow:0 4px 16px rgba(45,212,148,0.25);">
              Register on the Portal &rarr;
            </a>
          </div>
          <div style="font-size:12px; color:${BT_MUTED};">
            Portal link: <a href="${registrationUrl}" target="_blank" style="color:${BT_ACCENT}; text-decoration:none;">${registrationUrl}</a>
          </div>
        </div>

        <!-- Note & Verification Guideline -->
        <div style="background:#161922; border-left:3px solid ${BT_PRIMARY}; border-radius:6px; padding:12px 16px; margin-bottom:22px;">
          <p style="font-size:12px; color:${BT_TEXT_MUTED}; line-height:1.6; margin:0;">
            <strong style="color:#ffffff;">Please Note:</strong> Entry to the seminar hall will require your physical <strong>College ID card</strong> and the <strong>Digital QR Pass</strong> sent to your email upon registering on the portal.
          </p>
        </div>

        <!-- Event Coordinator Bar -->
        <div style="background:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:10px; padding:14px 18px; margin:0 0 20px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="vertical-align:middle;">
                <div style="font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:${BT_MUTED};">QUERIES &amp; ASSISTANCE</div>
                <div style="font-size:13px; font-weight:600; color:#ffffff; margin-top:2px;">Event Coordinator</div>
              </td>
              <td style="vertical-align:middle; text-align:right;">
                <span style="display:inline-block; background:#161922; border:1px solid ${BT_BORDER}; color:${BT_TEXT}; font-size:12px; font-weight:600; padding:6px 14px; border-radius:6px;">Shivansh: <strong style="color:${BT_ACCENT};">8115526688</strong></span>
              </td>
            </tr>
          </table>
        </div>

        <p style="font-size:13px; color:${BT_MUTED}; line-height:1.6; margin:0;">
          See you at the CSIT Seminar Hall!<br/>
          <strong style="color:#ffffff;">Team GDG on Campus &bull; AKGEC</strong>
        </p>
      </div>`;
  return wrapEmail(body, logoSrc, micSrc);
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
      subject: "Byte Talks 2026 — Verification Code",
      html: buildOtpEmailHtml(name, otp, "cid:byte-talks-logo", "cid:byte-talks-mic"),
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
      subject: "Registration Confirmed — Byte Talks 2026",
      html: buildRegistrationEmailHtml(student, "cid:student-qr-code", "cid:byte-talks-logo", "cid:byte-talks-mic"),
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
      subject: "Event Reminder — Byte Talks 2026",
      html: buildReminderEmailHtml(student, "cid:student-qr-code", "cid:byte-talks-logo", "cid:byte-talks-mic"),
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

// ==========================================
// 4. BYTE TALKS — EVENT INVITATION / INFO EMAIL
// ==========================================
export const sendEventInviteEmail = async (email, details = {}) => {
  try {
    const mailOptions = {
      from: `"Byte Talks — GDG on Campus AKGEC" <${process.env.EMAIL_USER || process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: "Byte Talks (Alumni Edition) — Registrations Open for 2nd Year | GDG AKGEC",
      html: buildEventInviteEmailHtml(details, "cid:byte-talks-logo", "cid:byte-talks-mic"),
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
    console.log(`✅ Event Invitation Email sent successfully to ${email}`);
    return info;
  } catch (error) {
    console.error("❌ Error sending event invitation email:", error);
    throw error;
  }
};

