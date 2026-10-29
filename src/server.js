import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";

import connectDB from "./config/db.js";
import requestId from "./middlewares/requestId.js";
import  errorMiddleware  from "./middlewares/errorMiddleware.js";
import registrationRoutes from "./Routes/registrationRoutes.js";
import { globalLimiter } from "./middlewares/securityLimiters.js";
import mongoSanitize from "express-mongo-sanitize";



const app = express();

// Prevent server from crashing on unhandled errors
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
});

await connectDB();

app.set("trust proxy", 1);

import morgan from "morgan";

// middlewares
app.use(requestId);
app.use(express.json({limit : "10kb"}));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(morgan("combined"));

// security
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:8080",
        "https://gdg-registration-portal-git-main-nvneets-projects.vercel.app",
        "https://gdg-portal.vercel.app",
        "https://gdg-registration-portal.vercel.app",
        "https://registration.gdgakgec.org",
        "https://register.gdgakgec.org",
        "https://registration.gdgakgec.in",
        "https://register.gdgakgec.in",
        "https://id-preview--1700c912-24a1-4274-bc47-72f8467d96d0.lovable.app",
        "https://gdg-admin-hub.vercel.app",
        "https://gdg-admin-hub-eta.vercel.app",
      ];
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.includes("localhost")) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  hpp({
    whitelist: ["filter", "sort"], 
  })
);

// Data Sanitization against NoSQL query injection
app.use((req, res, next) => {
  ['body', 'params', 'headers', 'query'].forEach((key) => {
    if (req[key]) {
      mongoSanitize.sanitize(req[key]);
    }
  });
  next();
});

import xss from "xss";

const sanitizeObject = (obj, depth = 0) => {
  if (!obj || depth > 10) return;
  for (let key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = xss(obj[key]);
    } else if (typeof obj[key] === "object") {
      sanitizeObject(obj[key], depth + 1);
    }
  }
};

app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
});

app.use("/api", globalLimiter);

app.get("/",(req,res) => {
    res.send(" Backend is Running Well - CI/CD Active! 🚀");
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/test", async (req, res,next) => {
  try {
    const fakeData = { user: "Love", role: "developer" };
    res.status(200).json({
      success: true,
      data: fakeData,
      message: "Test Route working"
    });
  } catch (error) {
    
    next(error); 
  }
});

app.use("/api/v1", registrationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);

// Vercel handles port binding itself — only listen on localhost/EC2
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 8000;
  const server = app.listen(PORT, () => {
    console.log(`Server is running on Port : ${PORT}`);
  });

  server.keepAliveTimeout = 120000;
  server.headersTimeout = 124000;
}

export default app;

