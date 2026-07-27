/**
 * Smoke test — verifies the full ticket rendering pipeline without sending email.
 * Run: node test-ticket.mjs
 * Outputs: ticket-test-output.png in the project root (for visual verification).
 */

import { renderTicket } from "./src/ticket/renderTicket.js";
import fs from "fs/promises";

const mockStudent = {
  _id: { toString: () => "6876abc123def456789abcde" },
  name: "Aditi Sharma",
  studentNumber: "2400270270270",
  email: "test@akgec.ac.in",
  branch: "CSE",
};

console.log("🎟️  Generating ticket for:", mockStudent.name);
console.time("renderTicket");

try {
  const dataUri = await renderTicket(mockStudent);
  console.timeEnd("renderTicket");

  // Strip the data URI prefix to get raw base64
  const base64 = dataUri.replace("data:image/png;base64,", "");
  const buffer  = Buffer.from(base64, "base64");

  await fs.writeFile("ticket-test-output.png", buffer);
  console.log("✅ Ticket rendered successfully!");
  console.log("📁 Saved to: ticket-test-output.png");
  console.log(`📏 File size: ${(buffer.length / 1024).toFixed(1)} KB`);
  console.log("🔍 Open ticket-test-output.png to visually inspect the design.");
} catch (err) {
  console.error("❌ Ticket generation failed:", err);
  process.exit(1);
}
