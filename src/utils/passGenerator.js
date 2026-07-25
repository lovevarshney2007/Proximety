import bwipjs from "bwip-js";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, "..", "assets", "logo.png");

/**
 * Generates a Code128 barcode for the given payload and composes it
 * with the event logo into a single pass image.
 *
 * The logo is placed centered above the barcode with generous spacing
 * so it never obstructs scan reliability.
 *
 * @param {string} payload - The unique identifier to encode (e.g. studentId).
 * @returns {Promise<string>} Base64-encoded PNG data URI for embedding in email HTML.
 */
export async function generatePassImage(payload) {
  // ── 1. Generate Code128 barcode PNG via bwip-js ──────────────────
  const barcodeBuffer = await bwipjs.toBuffer({
    bcid: "code128",        // Code 128 symbology
    text: payload,          // Data to encode
    scale: 3,               // 3x scaling for crisp rendering
    height: 15,             // Bar height in mm
    includetext: true,      // Human-readable text below bars
    textxalign: "center",   // Center the text
    backgroundcolor: "FFFFFF",
    barcolor: "000000",
    padding: 4,             // Quiet zone padding (mm) for reliable scanning
  });

  // ── 2. Load and measure the barcode ──────────────────────────────
  const barcodeMeta = await sharp(barcodeBuffer).metadata();
  const barcodeWidth = barcodeMeta.width;
  const barcodeHeight = barcodeMeta.height;

  // ── 3. Load, resize, and prepare the logo ────────────────────────
  const logoMaxWidth = Math.min(160, barcodeWidth);  // Logo should not be wider than barcode
  const logoMaxHeight = 160;

  const logoResized = await sharp(LOGO_PATH)
    .resize({
      width: logoMaxWidth,
      height: logoMaxHeight,
      fit: "inside",         // Preserve aspect ratio, fit within bounds
      withoutEnlargement: true,
    })
    .flatten({ background: "#ffffff" })  // Remove transparency for email compatibility
    .png()
    .toBuffer();

  const logoMeta = await sharp(logoResized).metadata();
  const logoWidth = logoMeta.width;
  const logoHeight = logoMeta.height;

  // ── 4. Compose the final pass image ──────────────────────────────
  const gap = 20;  // Vertical gap between logo and barcode (px)
  const canvasWidth = Math.max(barcodeWidth, logoWidth);
  const canvasHeight = logoHeight + gap + barcodeHeight;

  // Center both elements horizontally on the canvas
  const logoLeft = Math.round((canvasWidth - logoWidth) / 2);
  const barcodeLeft = Math.round((canvasWidth - barcodeWidth) / 2);

  const compositeImage = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: logoResized,
        top: 0,
        left: logoLeft,
      },
      {
        input: barcodeBuffer,
        top: logoHeight + gap,
        left: barcodeLeft,
      },
    ])
    .png()
    .toBuffer();

  // ── 5. Return as a Base64 data URI ───────────────────────────────
  const base64 = compositeImage.toString("base64");
  return `data:image/png;base64,${base64}`;
}
