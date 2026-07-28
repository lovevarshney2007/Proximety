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

// ==========================================
// 1. GDG OTP EMAIL
// ==========================================
export const sendOtpEmail = async (email, name, otp) => {
  if (process.env.TEST_MODE === "true") {
    console.log(`🧪 [TEST_MODE] Simulated sending OTP ${otp} to ${email}`);
    return;
  }
  try {
    const mailOptions = {
      from: `"GDG Event Team" <${process.env.EMAIL_USER || process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: "Action Required: Your OTP for GDG Event Registration",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f2f2f2;">
            <h1 style="color: #4285F4; margin: 0;">GDG Event 2026</h1>
          </div>
          <div style="padding: 20px 0;">
            <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>
            <p style="font-size: 16px; color: #555;">Thank you for starting your registration. To proceed, please use the One-Time Password (OTP) below to verify your email address:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0F9D58; background-color: #e6f4ea; padding: 15px 30px; border-radius: 8px;">
                ${otp}
              </span>
            </div>
            
            <p style="font-size: 14px; color: #777;">This OTP is valid for a short duration. Please do not share this code with anyone.</p>
          </div>
          <div style="text-align: center; padding-top: 20px; border-top: 2px solid #f2f2f2; font-size: 12px; color: #999;">
            <p>If you didn't request this, please ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} GDG Event Team. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP Email sent successfully to ${email}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email. Please try again later.");
  }
};


// ==========================================
// 2. GDG REGISTRATION SUCCESS EMAIL + QR TICKET PASS
// ==========================================
export const sendRegisterationEmail = async (student) => {
  try {
    const passDataUri = await renderTicket(student);

    const mailOptions = {
      from: `"GDG Event Team" <${process.env.EMAIL_USER || process.env.EMAIL_USERNAME}>`,
      to: student.email,
      subject: "🎉 Registration Confirmed! Your Entry Pass Inside - GDG Event",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.06);">
          
          <div style="background-color: #f8faff; text-align: center; border-bottom: 4px solid #4285F4; padding-top: 35px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeT5WipoI_LHakY6xsGOShL3OiX9xyiwZXOw&s" alt="Event Logo" style="max-height: 80px; width: auto; margin: 0 auto; display: block;" />
            <div style="padding: 20px 20px 25px 20px;">
              <h1 style="color: #4285F4; margin: 0; font-size: 30px; font-weight: 800; letter-spacing: 0.5px;">Proximity 6.0 🚀</h1>
            </div>
          </div>

          <div style="padding: 35px 25px;">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="display: inline-block; background-color: #e6f4ea; color: #0F9D58; padding: 10px 24px; border-radius: 50px; font-size: 18px; font-weight: bold; border: 1px solid #ceead6;">
                Registration Confirmed! 🎉
              </span>
            </div>

            <p style="font-size: 16px; color: #333;">Hi <strong>${student.name || "Participant"}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">Congratulations! Your registration for the upcoming GDG Event has been successfully completed. We are thrilled to have you onboard.</p>

            <div style="background-color: #f4f8ff; padding: 24px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4285F4; border: 1px solid #e1e9fa;">
              <h3 style="color: #4285F4; margin-top: 0; font-size: 18px;">📍 Event Details</h3>
              <p style="margin: 8px 0; color: #333; font-size: 15px;"><strong>Date:</strong> 30th July, 2026</p>
              <p style="margin: 8px 0; color: #333; font-size: 15px;"><strong>Venue:</strong> CS/IT Block</p>
              <div style="margin-top: 15px; padding-left: 14px; border-left: 2px solid #aecbfa;">
                <p style="margin: 6px 0; color: #555; font-size: 14px;"><strong>Time:</strong> 4:00 PM – 7:00 PM</p>
              </div>
            </div>

            <div style="background-color: #fafafa; padding: 24px; border-radius: 10px; margin: 25px 0; border: 1px solid #eaeaea;">
              <h3 style="color: #333; margin-top: 0; font-size: 18px;">📋 Your Details</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <tr>
                  <td style="padding: 12px 0; color: #666; border-bottom: 1px solid #f0f0f0;"><strong>Name:</strong></td>
                  <td style="padding: 12px 0; color: #222; font-weight: 600; border-bottom: 1px solid #f0f0f0; text-align: right;">${student.name || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666; border-bottom: 1px solid #f0f0f0;"><strong>Branch:</strong></td>
                  <td style="padding: 12px 0; color: #222; font-weight: 600; border-bottom: 1px solid #f0f0f0; text-align: right;">${student.branch}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666;"><strong>Student ID:</strong></td>
                  <td style="padding: 12px 0; color: #222; font-weight: 600; text-align: right;">${student.studentNumber}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 40px 0; padding: 30px 20px; border: 2px dashed #4285F4; border-radius: 12px; background-color: #f8faff;">
              <span style="background-color: #4285F4; color: #ffffff; padding: 6px 18px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Official Entry Pass</span>
              <div style="margin-top: 25px;">
                <img src="cid:gdg-ticket-pass" alt="Entry QR Ticket Pass" style="max-width: 560px; width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" />
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 20px; line-height: 1.5;"><strong>Note:</strong> Please present this QR code at the registration desk for a seamless check-in.</p>
            </div>

            <div style="background-color: #fffdf5; padding: 24px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #F4B400; border: 1px solid #fce8b2;">
              <h3 style="color: #d9a000; margin-top: 0; font-size: 18px;">⚠️ Important Instructions</h3>
              <ul style="color: #555; font-size: 15px; padding-left: 20px; margin-bottom: 0; line-height: 1.7;">
                <li style="margin-bottom: 8px;">Please ensure your <strong>mobile phones are kept on silent mode</strong> during the event.</li>
                <li style="margin-bottom: 8px;">Carry your physical <strong>college ID card</strong> for verification.</li>
                <li>Reach the venue at least <strong>15 minutes early</strong> to avoid queues.</li>
              </ul>
            </div>

            <div style="background-color: #fff9f9; padding: 24px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #EA4335; border: 1px solid #fad2cf;">
              <h3 style="color: #d93025; margin-top: 0; font-size: 18px;">⚖️ Discipline & Decorum</h3>
              <ul style="color: #555; font-size: 15px; padding-left: 20px; margin-bottom: 0; line-height: 1.7;">
                <li style="margin-bottom: 8px;">Any kind of cheating attempt will result in immediate disqualification.</li>
                <li style="margin-bottom: 8px;">Bring your own pen, paper will be provided.</li>
                <li>Smart watches and other such devices need to be submitted before the start of the drive.</li>
              </ul>
            </div>

            <div style="background-color: #f4fcf7; padding: 24px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #0F9D58; border: 1px solid #ceead6;">
              <h3 style="color: #0d8a4d; margin-top: 0; font-size: 18px;">📞 Need Help? Contact Us</h3>
              <p style="color: #444; font-size: 15px; margin: 10px 0;"><strong>Naman Srivastava:</strong> 7275573139</p>
              <p style="color: #444; font-size: 15px; margin: 0;"><strong>Trisha Singh:</strong> 9687979387</p>
            </div>
            
          </div>

          <div style="background-color: #f8f9fa; text-align: center; padding: 24px; border-top: 1px solid #eeeeee; font-size: 13px; color: #888;">
            <p style="margin: 0 0 10px 0;">Keep Building,<br><strong style="color: #555;">Team GDG On Campus AKGEC</strong></p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} GDG Event Team. All rights reserved.</p>
          </div>

        </div>
      `,
      attachments: [
        {
          filename: `GDG-Ticket-${student.studentNumber || "2026"}.png`,
          path: passDataUri,
          cid: "gdg-ticket-pass",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Registration Success Email (with QR ticket) sent to ${student.email}`);
  } catch (error) {
    console.error("❌ Error sending registration email:", error);
  }
};


// ==========================================
// 3. EVENT REMINDER EMAIL
// ==========================================
export const sendReminderEmail = async (student) => {
  try {
    const passDataUri = await renderTicket(student);

    const mailOptions = {
      from: `"GDG Event Team" <${process.env.EMAIL_USER || process.env.EMAIL_USERNAME}>`,
      to: student.email,
      subject: "📢 Important: Event Reminder for Proximity 6.0 - GDG Event",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.06);">
          
          <div style="background-color: #f8faff; text-align: center; border-bottom: 4px solid #4285F4; padding-top: 35px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeT5WipoI_LHakY6xsGOShL3OiX9xyiwZXOw&s" alt="Event Logo" style="max-height: 80px; width: auto; margin: 0 auto; display: block;" />
            <div style="padding: 20px 20px 25px 20px;">
              <h1 style="color: #4285F4; margin: 0; font-size: 30px; font-weight: 800; letter-spacing: 0.5px;">Reminder for Proximity 6.0 🚀</h1>
            </div>
          </div>

          <div style="padding: 35px 25px;">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="display: inline-block; background-color: #fff4e5; color: #ff9800; padding: 10px 24px; border-radius: 50px; font-size: 18px; font-weight: bold; border: 1px solid #ffe5cc;">
                Event Reminder! ⏳
              </span>
            </div>

            <p style="font-size: 16px; color: #333;">Hi <strong>${student.name || "Participant"}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
This is a reminder for the upcoming event. We are excited to see you there! 
</p>

            <div style="background-color: #f4f8ff; padding: 24px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4285F4; border: 1px solid #e1e9fa;">
              <h3 style="color: #4285F4; margin-top: 0; font-size: 18px;">📍 Event Details</h3>
              <p style="margin: 8px 0; color: #333; font-size: 15px;"><strong>Date:</strong> 30th July, 2026</p>
              <p style="margin: 8px 0; color: #333; font-size: 15px;"><strong>Venue:</strong> CS/IT Block</p>
              <div style="margin-top: 15px; padding-left: 14px; border-left: 2px solid #aecbfa;">
                <p style="margin: 6px 0; color: #555; font-size: 14px;"><strong>Time:</strong> 4:00 PM – 7:00 PM</p>
              </div>
            </div>

            <div style="background-color: #fafafa; padding: 24px; border-radius: 10px; margin: 25px 0; border: 1px solid #eaeaea;">
              <h3 style="color: #333; margin-top: 0; font-size: 18px;">📋 Your Details</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <tr>
                  <td style="padding: 12px 0; color: #666; border-bottom: 1px solid #f0f0f0;"><strong>Name:</strong></td>
                  <td style="padding: 12px 0; color: #222; font-weight: 600; border-bottom: 1px solid #f0f0f0; text-align: right;">${student.name || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666; border-bottom: 1px solid #f0f0f0;"><strong>Branch:</strong></td>
                  <td style="padding: 12px 0; color: #222; font-weight: 600; border-bottom: 1px solid #f0f0f0; text-align: right;">${student.branch}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666;"><strong>Student ID:</strong></td>
                  <td style="padding: 12px 0; color: #222; font-weight: 600; text-align: right;">${student.studentNumber}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 40px 0; padding: 30px 20px; border: 2px dashed #4285F4; border-radius: 12px; background-color: #f8faff;">
              <span style="background-color: #4285F4; color: #ffffff; padding: 6px 18px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Official Entry Pass</span>
              <div style="margin-top: 25px;">
                <img src="cid:gdg-ticket-pass" alt="Entry QR Ticket Pass" style="max-width: 560px; width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" />
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 20px; line-height: 1.5;"><strong>Note:</strong> Please present this QR code at the registration desk for a seamless check-in.</p>
            </div>

            <div style="background-color: #f4fcf7; padding: 24px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #0F9D58; border: 1px solid #ceead6;">
              <h3 style="color: #0d8a4d; margin-top: 0; font-size: 18px;">📞 Need Help? Contact Us</h3>
              <p style="color: #444; font-size: 15px; margin: 10px 0;"><strong>Naman Srivastava:</strong> 7275573139</p>
              <p style="color: #444; font-size: 15px; margin: 0;"><strong>Trisha Singh:</strong> 9687979387</p>
            </div>
            
          </div>

          <div style="background-color: #f8f9fa; text-align: center; padding: 24px; border-top: 1px solid #eeeeee; font-size: 13px; color: #888;">
            <p style="margin: 0 0 10px 0;">Keep Building,<br><strong style="color: #555;">Team GDG On Campus AKGEC</strong></p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} GDG Event Team. All rights reserved.</p>
          </div>

        </div>
      `,
      attachments: [
        {
          filename: `GDG-Ticket-${student.studentNumber || "2026"}.png`,
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