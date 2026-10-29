# 🚀 GDG On Campus AKGEC — Event Registration & Admin Portal
### Byte Talks 2026 (Alumni Edition)

This is a robust, secure, and high-performance backend developed for managing participant registrations, attendance, and automated entry ticketing for GDG (Google Developer Groups) On Campus AKGEC events, currently powering **Byte Talks 2026 (Alumni Edition)**.

The system features a 2-step secure registration process (College Email OTP Verification &rarr; Detailed Profile Registration), strict data validation restricted to eligible batches, dynamic in-memory QR ticket generation, an advanced multi-tiered IP auto-banning firewall for spam prevention, admin attendance tracking, and automated dark-themed responsive emails.

---

## ✨ Key Features

- **🔐 2-Step Verified Registration:**
  - Enforces college email (`@akgec.ac.in`) verification with 6-digit OTPs before registration is unlocked.
  - Dual storage: Redis / Database-backed OTP caching with a 5-minute Time-To-Live (TTL).
  - Test mode support (`TEST_MODE=true`) for staging without consuming SMTP limits.

- **🎯 Strict Eligibility & Batch Validation:**
  - Student numbers strictly validated to **1st & 2nd year students** (regex: `^2[5-6][0-9]{5,6}$` starting with `25` or `26`).
  - Strict branch whitelist (`CSE`, `CSE(AIML)`, `CSE(DS)`, `CSE(H)`, `CS`, `IT`, `CSIT`, `AIML`, `ECE`, `EN`, `ME`, `Civil`).
  - Capture recruitment & participation metrics: Preferred Domain, GitHub profile, and HackerRank ID.

- **📧 Redesigned Responsive Emails & Embedded Student QR Codes:**
  - Custom email templates built with the brand color palette: **#097b59** (emerald green accent) and **#1d212c** (dark slate container base).
  - Event Timing: **10:00 AM to 12:30 PM** (30th October, 2026 · CSIT Seminar Hall).
  - Event Coordinator: **Shivansh (8115526688)**.
  - Three distinct email pipelines:
    1. **🔐 OTP Verification Email** — Clean one-time password card with 5-minute expiry notice.
    2. **🎉 Registration Confirmation Email** — Contains participant profile details, venue guidelines, and a high-contrast embedded entry QR code encoded with the participant's student number.
    3. **📢 Event Reminder Email** — Scheduled/admin-triggered reminders with embedded entry QR code.
  - **Direct Entry QR Generation:** Clean high-contrast QR code generated in-memory using qrcode with student number payload for instant check-in at the venue desk.

- **🖥️ Local Email Template Preview Server:**
  - Dedicated preview tool (`npm run email:preview` or `node test-email-preview.js`) accessible at `http://localhost:3333`.
  - Live preview all 3 emails with an interactive top toolbar.
  - Responsive preview toggles (Desktop 600px vs. Mobile 375px) and raw HTML inspect mode for testing with email client simulators.

- **🛡️ Enterprise-Grade Security & Auto-Ban Defense:**
  - **Auto-Ban Engine:** Automatically permanently bans IPs exceeding repeated rate-limit thresholds by migrating them to MongoDB `BlockedIp` blacklist and memory cache.
  - **reCAPTCHA Protection:** Bot prevention on public authentication routes with admin bypass capability.
  - **Layered Defense:** Helmet HTTP security headers, HPP parameter pollution protection, NoSQL injection sanitization (`express-mongo-sanitize`), and XSS body sanitization.
  - **Slowloris Mitigation:** Configured Node.js HTTP keep-alive and headers timeouts.

- **👩‍💻 Admin Hub & Event Operations:**
  - Secured via `x-api-key` header authentication.
  - **Attendance Tracking:** Mark participant arrival for Day 1 and Day 2 via QR code scans with duplicate scan prevention.
  - **Bulk Email Dispatcher:** Built-in rate-limited queueing with a 500ms throttle to prevent SMTP throttling.
  - **Real-time Analytics:** Stats endpoint tracking verified participant counts, department breakdowns, and attendance rates.
  - **Audit Logging:** Every administrative action is logged to the `AuditLog` collection.

---

## 🛠️ Tech Stack

- **Runtime & Framework:** Node.js (ES Modules), Express.js (v5.x)
- **Database:** MongoDB Atlas (Mongoose ODM v9.x), Redis (ioredis) for OTP caching
- **Graphics & Ticket Pipeline:** Sharp, QRCode, BWIP-JS
- **Email Delivery:** Nodemailer (SMTP / Gmail)
- **Validation:** Joi (request layer) + Mongoose Schema (database layer)
- **Security:** Helmet, CORS, Express-Rate-Limit, HPP, Express-Mongo-Sanitize, XSS, Google reCAPTCHA
- **Deployment:** Serverless / Vercel / AWS EC2 with PM2

---

## 📡 API Endpoints

### 👤 Public / Registration Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health check |
| `POST` | `/api/v1/send-otp` | Generates & emails a 6-digit verification OTP |
| `POST` | `/api/v1/verify-otp` | Verifies submitted OTP against cache/DB |
| `POST` | `/api/v1/register` | Completes registration & sends email with QR ticket pass |

#### Sample Request: Send OTP (`POST /api/v1/send-otp`)
```json
{
  "name": "Peter Parker",
  "email": "peter25153023@akgec.ac.in",
  "studentNumber": "25153023",
  "captchaToken": "optional_or_bypass_key"
}
```

#### Sample Request: Verify OTP (`POST /api/v1/verify-otp`)
```json
{
  "email": "peter25153023@akgec.ac.in",
  "otp": "482910"
}
```

#### Sample Request: Final Registration (`POST /api/v1/register`)
```json
{
  "name": "Peter Parker",
  "email": "peter25153023@akgec.ac.in",
  "studentNumber": "25153023",
  "gender": "Male",
  "branch": "CSE(AIML)",
  "phone": "9876543210",
  "residence": "Hosteller",
  "domain": "backend development",
  "hackerrankId": "peterparker_hr",
  "githubId": "peterparker",
  "unstopId": "peterparker"
}
```

---

### 🛠️ Admin / Operations Endpoints
> **Note:** All Admin routes require the `x-api-key: <ADMIN_API_KEY>` header.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/stats` | Live event stats (Registration count, verification %, attendance) |
| `GET` | `/api/v1/admin/users` | List registered students (supports sorting & pagination) |
| `POST` | `/api/v1/admin/mark-attendance` | Scan & mark Day 1 / Day 2 attendance via QR payload |
| `POST` | `/api/v1/admin/send-reminders` | Trigger throttled bulk reminder emails to all verified students |
| `POST` | `/api/v1/admin/resend-reminder` | Resend reminder email + QR ticket to a specific student |
| `GET` | `/api/v1/admin/blocked-ips` | View all blocked IP addresses |
| `POST` | `/api/v1/admin/block-ip` | Manually ban an IP address |
| `POST` | `/api/v1/admin/unblock-ip` | Remove an IP address from blacklist |
| `DELETE`| `/api/v1/admin/clear-all-blocked-ips` | Unban all IPs and clear blacklist |

---

## 🚦 Rate Limiting & Auto-Ban Thresholds

IP blocking is enforced exclusively on public routes. Admin routes are whitelisted.

| Route / Limiter | Window | Limit | Auto-Ban / Protection Action |
| :--- | :--- | :--- | :--- |
| **Global (`/api/*`)** | 15 mins | 1000 requests | `429 Too Many Requests` (tuned for shared campus Wi-Fi) |
| **Send OTP (`/send-otp`)** | 15 mins | 50 requests | Auto-blocked if > 30 rapid spam attempts within 10-min window |
| **Verify OTP (`/verify-otp`)** | 15 mins | 100 requests | `429 Too Many Requests` (Plus max 5 failed tries per email) |
| **Registration (`/register`)** | 15 mins | 80 requests | Auto-blocked if > 50 rapid spam attempts within 10-min window |
| **OTP Resend Cooldown** | 60 secs | 1 request per email | Returns remaining seconds until unlocked |
| **OTP Expiration (TTL)** | 5 mins | Auto-expired | Purged from DB (`expires: 300`) and checked at runtime |
| **Blacklisted IP Check** | Instant | 0 requests | `403 Access Denied` for blacklisted IPs |

---

## 🧪 Developer Tools & Testing

### 1. 📧 Email Template Previewer (Interactive UI)
Preview all 3 emails locally in your browser with real-time rendered ticket passes:
```bash
npm run email:preview
# or: node test-email-preview.js
```
Open **`http://localhost:3333`** in your browser.
- **`/?type=registration`** &rarr; Registration Confirmation email with live ticket pass.
- **`/?type=otp`** &rarr; OTP Verification email.
- **`/?type=reminder`** &rarr; Event Reminder email.
- **`/?raw=true`** &rarr; View raw HTML output (useful for email client testing).
- Switch between **Desktop (600px)** and **Mobile (375px)** viewport widths with a single click.

### 2. 🎟️ Ticket Generation Test
Renders a ticket directly to disk (`ticket-test-output.png`) to test SVG styling, fonts, and Sharp rasterization:
```bash
node test-ticket.mjs
```

### 3. 🌐 End-to-End Live Registration Flow
Runs a complete integration test against a local or deployed backend (Health check &rarr; Send OTP &rarr; Retrieve OTP &rarr; Verify OTP &rarr; Register student &rarr; Verify Admin stats):
```bash
node test-live-registration.mjs
```

---

## ⚙️ Environment Variables (`.env`)

```env
PORT=8000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/proximity?retryWrites=true&w=majority
REDIS_URL=redis://default:<password>@<host>:<port>

# Email Service
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_digit_app_password
TEST_MODE=false

# Google reCAPTCHA
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
RECAPTCHA_BYPASS=true

# Admin Authentication
ADMIN_API_KEY=your_secure_admin_api_key
```

---

## 🚀 Running the Project

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment:**
   Create `.env` using the template above or copy from `.env.example`.
3. **Start in development mode (with nodemon):**
   ```bash
   npm run dev
   ```
4. **Start email previewer:**
   ```bash
   npm run email:preview
   ```
5. **Start in production with PM2:**
   ```bash
   npm run pm2:start
   ```

---

*Maintained by GDG On Campus AKGEC.*

