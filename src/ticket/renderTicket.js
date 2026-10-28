/**
 * renderTicket.js
 *
 * Responsible for: Orchestrating the ticket rendering pipeline.
 *
 * Pipeline for each registration:
 *   1. Load static assets (GDG logo, Spider-Man art, spider-web texture) as
 *      Base64 data URIs so SVG <image> tags work without filesystem paths.
 *   2. Generate participant QR code via generateQRCode.js.
 *   3. Inject participant data + QR + asset URIs into the SVG template.
 *   4. Rasterise the SVG to a PNG Buffer using Sharp.
 *   5. Return the PNG as a Base64 data URI suitable for embedding in emails.
 *
 * Everything runs entirely in memory — no temporary files are created.
 *
 * To modify the ticket design, edit template.js.
 * To change QR options, edit generateQRCode.js.
 * This file should only change if the pipeline itself changes.
 */

import path from "path";
import fs   from "fs/promises";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { generateQRCode } from "./generateQRCode.js";
import { buildTicketSVG }  from "./template.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Asset paths ───────────────────────────────────────────────────────────────
// Resolve from the project root's /assets directory.
const ASSETS_DIR = path.resolve(__dirname, "..", "..", "assets");


const PATHS = {
  gdgLogo:   path.join(ASSETS_DIR, "logos",    "gdg-logo-Photoroom_2.png"),
  spiderMan: path.join(ASSETS_DIR, "graphics", "spiderman.jpg"),
  spiderWeb: path.join(ASSETS_DIR, "graphics", "spiderweb.jpg"),
};

// ── Lazy-cached asset buffers (loaded once per process lifetime) ──────────────
const _cache = {};

async function loadAssetAsDataUri(filePath, mimeType) {
  if (_cache[filePath]) return _cache[filePath];
  try {
    const buffer = await fs.readFile(filePath);
    const uri = `data:${mimeType};base64,${buffer.toString("base64")}`;
    _cache[filePath] = uri;
    return uri;
  } catch {
    // Asset missing — template renders gracefully without it
    console.warn(`[renderTicket] Asset not found, skipping: ${filePath}`);
    return null;
  }
}

/**
 * Generic white-background removal using Sharp pixel manipulation.
 * Any pixel where R, G, and B are all above threshold becomes transparent.
 *
 * @param {string} filePath  - Path to image file (JPEG or PNG).
 * @param {number} threshold - Pixels brighter than this (0–255) become transparent. Default 228.
 * @returns {Promise<string|null>} PNG data URI with white removed, or null on error.
 */
async function removeWhiteBackground(filePath, threshold = 228) {
  const cacheKey = `${filePath}::nobg:${threshold}`;
  if (_cache[cacheKey]) return _cache[cacheKey];
  try {
    const raw = await fs.readFile(filePath);
    const { data, info } = await sharp(raw)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    const pixels = data;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      if (r > threshold && g > threshold && b > threshold) {
        pixels[i + 3] = 0;
      }
    }

    const pngBuffer = await sharp(pixels, {
      raw: { width, height, channels },
    })
      .png({ compressionLevel: 7 })
      .toBuffer();

    const uri = `data:image/png;base64,${pngBuffer.toString("base64")}`;
    _cache[cacheKey] = uri;
    return uri;
  } catch (err) {
    console.warn(`[renderTicket] removeWhiteBackground failed for ${filePath}: ${err.message}`);
    return null;
  }
}

/**
 * Event constants.
 * Update these values here when event details change.
 * They are injected into every ticket at render time.
 */
const EVENT_INFO = {
  venue: "CSIT Seminar Hall",
  date:  "30 October 2026 (Friday)",
  time:  "10:00 AM – 12:30 PM",
};

/**
 * Renders a complete ticket PNG for a single participant.
 *
 * @param {object} student - Mongoose Registration document (or plain object).
 * @param {string} student._id          - MongoDB ObjectId (used as QR payload).
 * @param {string} student.studentNumber - Student ID (fallback QR payload + display).
 * @param {string} student.name          - Participant full name.
 *
 * @returns {Promise<string>} Base64 PNG data URI — embed directly in email HTML
 *                            as <img src="..."> or as an inline attachment.
 */
export async function renderTicket(student) {
  // ── 1. Resolve QR payload (preserve original logic exactly) ──────────────
  //    The original passGenerator.js used:
  //      student._id?.toString() ?? student.studentNumber
  //    We preserve this exactly so existing QR scanner logic is unaffected.
  const qrPayload = student._id
    ? student._id.toString()
    : student.studentNumber;

  if (!qrPayload) {
    throw new Error("[renderTicket] Cannot determine QR payload: student has no _id or studentNumber.");
  }

  // ── 2. Generate QR code buffer ────────────────────────────────────────────
  const qrBuffer   = await generateQRCode(qrPayload);
  const qrDataUri  = `data:image/png;base64,${qrBuffer.toString("base64")}`;

  // ── 3. Load static assets ─────────────────────────────────────────────────
  const [gdgLogoUri, spiderManUri, spiderWebUri] = await Promise.all([
    removeWhiteBackground(PATHS.gdgLogo,   228),  // Remove logo white BG
    removeWhiteBackground(PATHS.spiderMan, 225),  // Remove Spider-Man white BG
    loadAssetAsDataUri(PATHS.spiderWeb, "image/jpeg"),
  ]);

  // ── 4. Build SVG document ─────────────────────────────────────────────────
  const svgString = buildTicketSVG({
    name:          student.name          || "Participant",
    studentNumber: student.studentNumber || "—",
    venue:         EVENT_INFO.venue,
    date:          EVENT_INFO.date,
    time:          EVENT_INFO.time,
    qrDataUri,
    gdgLogoUri,
    spiderManUri,
    spiderWebUri,
  });

  // ── 5. Rasterise SVG → PNG using Sharp ───────────────────────────────────
  //    Sharp accepts raw SVG buffer; density controls the render resolution.
  const svgBuffer = Buffer.from(svgString, "utf-8");

  const pngBuffer = await sharp(svgBuffer, { density: 144 })
    .png({ quality: 95, compressionLevel: 6 })
    .toBuffer();

  // ── 6. Return as Base64 data URI ──────────────────────────────────────────
  return `data:image/png;base64,${pngBuffer.toString("base64")}`;
}
