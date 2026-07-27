// Uniqueness verification test
import { renderTicket } from "./src/ticket/renderTicket.js";
import { generateQRCode } from "./src/ticket/generateQRCode.js";
import fs from "fs/promises";

const student1 = { _id: { toString: () => "aaa111bbb222ccc333ddd444" }, name: "Rahul Gupta",  studentNumber: "2500100100100" };
const student2 = { _id: { toString: () => "zzz999yyy888xxx777www666" }, name: "Priya Singh",  studentNumber: "2500200200200" };

console.log("🔬 Testing 2 unique tickets for uniqueness...");
const [t1, t2] = await Promise.all([renderTicket(student1), renderTicket(student2)]);

const qr1 = await generateQRCode("aaa111bbb222ccc333ddd444");
const qr2 = await generateQRCode("zzz999yyy888xxx777www666");

const qrUnique     = qr1.toString("base64") !== qr2.toString("base64");
const ticketUnique = t1 !== t2;

console.log(`QR codes unique: ${qrUnique}    (expected: true)`);
console.log(`Tickets unique:  ${ticketUnique}    (expected: true)`);

if (!qrUnique || !ticketUnique) {
  console.error("❌ UNIQUENESS FAILURE");
  process.exit(1);
}

const base64 = t2.replace("data:image/png;base64,", "");
await fs.writeFile("ticket-test-student2.png", Buffer.from(base64, "base64"));
console.log("✅ All checks passed. ticket-test-student2.png saved.");
