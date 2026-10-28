import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { generateQRCode } from "../ticket/generateQRCode.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.resolve(__dirname, "..", "..", "assets", "logos", "byte-talks-logo.png");

// Lazy-cached base64 data URI of the Byte Talks logo (for local previews & web rendering)
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

// ─── Shared Header HTML with Microphone Icon + Logo Lockup ────────────────────
export const emailHeader = (logoSrc = "cid:byte-talks-logo") => `
  <!-- Top Emerald Gradient Bar -->
  <div style="background:linear-gradient(90deg, #097b59 0%, #2dd494 50%, #097b59 100%); height:4px; width:100%;"></div>

  <div style="background-color:${BT_CONTAINER}; text-align:center; padding:32px 20px 22px; border-bottom:1px solid #282e3d;">
    <!-- Logo + Mic Lockup Table -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="vertical-align:middle; padding-right:14px;">
          <div style="width:44px; height:44px; background:rgba(9,123,89,0.18); border:1px solid #097b59; border-radius:12px; text-align:center; box-shadow:0 0 16px rgba(9,123,89,0.3);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle; margin-top:10px;">
              <rect x="9" y="3" width="6" height="11" rx="3" fill="${BT_ACCENT}"/>
              <path d="M5.5 10v1.5a6.5 6.5 0 0 0 13 0V10" stroke="${BT_ACCENT}" stroke-width="2" stroke-linecap="round"/>
              <line x1="12" y1="18" x2="12" y2="21" stroke="${BT_ACCENT}" stroke-width="2" stroke-linecap="round"/>
              <line x1="8" y1="21" x2="16" y2="21" stroke="${BT_ACCENT}" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </td>
        <td style="vertical-align:middle;">
          <img src="${logoSrc}" alt="Byte Talks" width="200" style="width:200px; max-width:100%; height:auto; display:block;" />
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
export const wrapEmail = (bodyHtml, logoSrc = "cid:byte-talks-logo") => `
  <div style="background-color:${BT_BG}; padding:28px 12px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:580px; margin:0 auto; background-color:${BT_CONTAINER}; border:1px solid ${BT_BORDER}; border-radius:12px; overflow:hidden; box-shadow:0 10px 36px rgba(0,0,0,0.45);">
      ${emailHeader(logoSrc)}
      ${bodyHtml}
      ${emailFooter()}
    </div>
  </div>`;

// ─── Exported Template Builders (Single Source of Truth) ─────────────────────

// 1. OTP Email Template
export const buildOtpEmailHtml = (name, otp, logoSrc = "cid:byte-talks-logo") => {
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
  return wrapEmail(body, logoSrc);
};

// 2. Registration Confirmation Template
export const buildRegistrationEmailHtml = (
  student,
  qrCodeSrc = "cid:student-qr-code",
  logoSrc = "cid:byte-talks-logo"
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

        <!-- Event Coordinators Bar -->
        <div style="background:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:10px; padding:16px 20px; margin:0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="vertical-align:middle;">
                <div style="font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:${BT_MUTED};">NEED HELP?</div>
                <div style="font-size:13px; font-weight:600; color:#ffffff; margin-top:2px;">Event Coordinators</div>
              </td>
              <td style="vertical-align:middle; text-align:right;">
                <span style="display:inline-block; background:#161922; border:1px solid ${BT_BORDER}; color:${BT_TEXT}; font-size:12px; font-weight:600; padding:6px 12px; border-radius:6px; margin-right:6px;">Shivansh: <strong style="color:${BT_ACCENT};">8115526688</strong></span>
                <span style="display:inline-block; background:#161922; border:1px solid ${BT_BORDER}; color:${BT_TEXT}; font-size:12px; font-weight:600; padding:6px 12px; border-radius:6px;">Sarika: <strong style="color:${BT_ACCENT};">6394316608</strong></span>
              </td>
            </tr>
          </table>
        </div>
      </div>`;
  return wrapEmail(body, logoSrc);
};

// 3. Event Reminder Template
export const buildReminderEmailHtml = (
  student,
  qrCodeSrc = "cid:student-qr-code",
  logoSrc = "cid:byte-talks-logo"
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

        <!-- Event Coordinators Bar -->
        <div style="background:${BT_CARD}; border:1px solid ${BT_BORDER}; border-radius:10px; padding:16px 20px; margin:0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="vertical-align:middle;">
                <div style="font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:${BT_MUTED};">NEED HELP?</div>
                <div style="font-size:13px; font-weight:600; color:#ffffff; margin-top:2px;">Event Coordinators</div>
              </td>
              <td style="vertical-align:middle; text-align:right;">
                <span style="display:inline-block; background:#161922; border:1px solid ${BT_BORDER}; color:${BT_TEXT}; font-size:12px; font-weight:600; padding:6px 12px; border-radius:6px; margin-right:6px;">Shivansh: <strong style="color:${BT_ACCENT};">8115526688</strong></span>
                <span style="display:inline-block; background:#161922; border:1px solid ${BT_BORDER}; color:${BT_TEXT}; font-size:12px; font-weight:600; padding:6px 12px; border-radius:6px;">Sarika: <strong style="color:${BT_ACCENT};">6394316608</strong></span>
              </td>
            </tr>
          </table>
        </div>
      </div>`;
  return wrapEmail(body, logoSrc);
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
      html: buildOtpEmailHtml(name, otp, "cid:byte-talks-logo"),
      attachments: [
        {
          filename: "byte-talks-logo.png",
          path: LOGO_PATH,
          cid: "byte-talks-logo",
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
      html: buildRegistrationEmailHtml(student, "cid:student-qr-code", "cid:byte-talks-logo"),
      attachments: [
        {
          filename: "byte-talks-logo.png",
          path: LOGO_PATH,
          cid: "byte-talks-logo",
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
      html: buildReminderEmailHtml(student, "cid:student-qr-code", "cid:byte-talks-logo"),
      attachments: [
        {
          filename: "byte-talks-logo.png",
          path: LOGO_PATH,
          cid: "byte-talks-logo",
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
