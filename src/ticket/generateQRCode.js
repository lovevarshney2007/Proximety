/**
 * generateQRCode.js
 *
 * Responsible for: QR code generation only.
 *
 * Generates a local QR code PNG using the `qrcode` npm package.
 * Error correction level H (High) is used for maximum scan reliability
 * even if part of the code is obscured.
 *
 * This module intentionally has no knowledge of ticket layout, student data,
 * or email logic — it only converts a string payload into a QR PNG buffer.
 */

import QRCode from "qrcode";

/**
 * Generates a QR code PNG buffer for the given payload.
 *
 * @param {string} payload - The unique string to encode (e.g., MongoDB _id or studentNumber).
 * @returns {Promise<Buffer>} A raw PNG Buffer ready for compositing into the ticket template.
 */
export async function generateQRCode(payload) {
  if (!payload || typeof payload !== "string") {
    throw new Error("[generateQRCode] payload must be a non-empty string.");
  }

  const qrBuffer = await QRCode.toBuffer(payload, {
    errorCorrectionLevel: "H",   // High error correction — up to 30% of data can be restored
    type: "png",
    width: 200,                  // px — sized to fit the ticket's QR placeholder
    margin: 1,                   // quiet zone in modules (minimum safe value for scanners)
    color: {
      dark: "#000000",           // QR modules — black
      light: "#FFFFFF",          // Background — white for maximum contrast
    },
  });

  return qrBuffer;
}
