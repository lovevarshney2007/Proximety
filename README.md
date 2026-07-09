# 🚀 GDG Event Registration Backend

This is a robust, secure, and high-performance backend developed for managing participant registrations, payments, and entry attendance for the upcoming GDG (Google Developer Groups) event. 

The portal features a secure 2-step registration process (OTP Verification -> Registration), strict data validation, advanced IP-based auto-banning mechanisms for spammers, attendance tracking using QR codes, and automated professional email confirmations.

## ✨ Key Features

- **🔐 2-Step Secure Registration:** Users must verify their college email (`@akgec.ac.in`) via OTP before proceeding to final registration.
- **📝 Recruitment Drive Ready:** Registration captures required recruitment details including preferred domain, GitHub ID, and HackerRank ID.
- **🛡️ Advanced Security & Auto-Banning:** 
  - Implemented Google reCAPTCHA, Helmet (HTTP headers), HPP (HTTP Parameter Pollution prevention), and strict CORS policies.
  - Keeps track of malicious behaviors (spamming OTPs or Registration endpoints) in a `SuspiciousActivity` collection.
  - Automatically permanently blocks IPs by migrating them to a `BlockedIp` blacklist if they exceed threshold limits.
  - NoSQL Injection & XSS Protection via `express-mongo-sanitize` & `xss`.
  - Slowloris DoS attack mitigation via configured Node.js HTTP timeouts.
- **🚦 Smart Rate Limiting:** Custom rate limiters for Global routes, OTP generation (Auth), Registration endpoints, and Bot chatting.
- **👩‍💻 Admin Controls & Attendance Tracking:** 
  - Admin endpoints protected by custom `x-api-key` header authentication.
  - **Dynamic Attendance:** Day 1 and Day 2 Offline QR Code attendance tracking with duplicate prevention.
  - **Bulk Reminders:** Integrated mailing system to send event reminders/WhatsApp group links to all verified participants with rate-limiting protection.
  - **Real-time Dashboards:** Stats endpoint providing immediate insights into registration counts, verification status, and attendance rates.
  - Manual IP blocklist management for administrators.
  - Comprehensive `AuditLog` tracking for all administrative actions.
- **📧 Automated Professional Emails:** HTML-styled responsive emails for OTPs and Registration Confirmations (including auto-generated QR Code entry passes) using Nodemailer.
- **✅ Strict Data Validation:** Dual validation using **Joi** (Request level) and **Mongoose** (Database level).
- **📉 Capacity Management:** Hard registration limit enforced at both OTP and Order Creation levels to prevent over-capacity.

## 🛠️ Tech Stack

**Core Backend:**
- Node.js & Express.js (v5.x)
- Serverless Framework (for AWS Lambda/Vercel deployment)

**Database:**
- MongoDB Atlas (with Mongoose ODM 9.x)

**Security & Anti-Spam:**
- `helmet`, `cors`, `hpp`
- `express-rate-limit`
- `express-mongo-sanitize`, `xss`
- Google reCAPTCHA v2/v3

**Validation & Utilities:**
- `joi` & `validator`
- `nodemailer` (for sending emails)
- `axios` (for reCAPTCHA verification)

## 📡 API Endpoints

### 👤 Public / Registration Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Check server health and uptime |
| `POST` | `/api/v1/send-otp` | Generates & sends a 6-digit OTP to user's email |
| `POST` | `/api/v1/verify-otp` | Verifies the OTP entered by the user |
| `POST` | `/api/v1/register` | Final registration (Saves validated data) |

### 🛠️ Admin / Security Endpoints
> **Note:** All Admin routes strictly require the `x-api-key` header.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/stats` | **New:** Fetch event stats (Verified count, Attendance %, etc.) |
| `POST` | `/api/v1/admin/send-reminders` | **New:** Trigger bulk reminder emails to all verified users |
| `POST` | `/api/v1/admin/resend-reminder`| **New:** Resend reminder to a specific user via email/studentID |
| `POST` | `/api/v1/admin/mark-attendance`| Mark Day 1 or Day 2 attendance via QR scan |
| `GET` | `/api/v1/admin/users` | Fetch all registered students (sorted by newest) |
| `GET` | `/api/v1/admin/blocked-ips` | Fetch list of all blacklisted IP addresses |
| `POST` | `/api/v1/admin/block-ip` | Manually ban an IP Address |
| `POST` | `/api/v1/admin/unblock-ip` | Unban an IP Address |

## 🚦 Rate Limiting & IP Auto-Ban Rules

> IP blocking is enforced only on **public routes**. Admin routes are fully exempt.

### Global Rate Limiter
Applies to **all `/api/*` routes**.

| Window | Max Requests | Action on Exceed |
| :--- | :--- | :--- |
| 15 minutes | 50 requests | `429 Too Many Requests` |

---

### Auth Rate Limiter — `POST /send-otp` & `POST /verify-otp`

| Window | Max Requests | Action on Exceed |
| :--- | :--- | :--- |
| 30 minutes | 20 requests | `429` response + logged in `SuspiciousActivity` |

**Auto-Ban Trigger:** Exceeding auth limit **> 10 times** results in a **permanent IP block**.

---

### Registration Rate Limiter — `POST /register`

| Window | Max Requests | Action on Exceed |
| :--- | :--- | :--- |
| 60 minutes | 30 requests | `429` response + logged in `SuspiciousActivity` |

**Auto-Ban Trigger:** Exceeding registration limit **> 50 times** results in a **permanent IP block**.

---

### IP Blacklist Check
If the requesting IP exists in the `BlockedIp` collection, all public requests are rejected with `403 Access Denied`.

## ⚙️ Environment Variables (`.env`)

```env
PORT=8000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://...

# Email Service
EMAIL_USER=your_gdg_email@gmail.com
EMAIL_PASS=your_16_digit_app_password

# Google reCAPTCHA
RECAPTCHA_SECRET_KEY=...
RECAPTCHA_BYPASS=true 

# Admin Configuration
ADMIN_API_KEY=...
```

## 🚀 Running the Project

1. Install dependencies: `npm install`
2. Set up the `.env` file.
3. Run the development server: `npm run dev`
4. Server now listens on `http://localhost:8000`.