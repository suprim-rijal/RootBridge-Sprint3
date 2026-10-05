// =====================================================================
// All settings from .env, read in ONE place.
// If something important is missing, the server stops at start-up with
// a clear message, instead of crashing later in a confusing way.
// =====================================================================
const path = require("path");

// Always read backend/.env, whichever folder the app is started from
// (e.g. "npm start" in the top folder). Real environment variables, like
// the ones Render sets, still win over the file.
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  // If set, signing up as a Teacher requires this code (share it with
  // your teachers). Empty = anyone may sign up as a teacher.
  teacherSignupCode: process.env.TEACHER_SIGNUP_CODE || "",
  // If set, GET /api/contact/messages works with this token in the
  // "x-support-token" header, so someone can actually read the messages.
  supportToken: process.env.SUPPORT_TOKEN || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
};
env.isProduction = env.nodeEnv === "production";

function assertEnv() {
  const missing = [];
  if (!env.mongoUri) missing.push("MONGODB_URI");
  if (!env.jwtSecret) missing.push("JWT_SECRET");
  if (missing.length) {
    throw new Error(`Missing in .env: ${missing.join(", ")}. Copy .env.example to .env and fill it in.`);
  }
  if (env.isProduction && (env.jwtSecret === "change-me" || env.jwtSecret.length < 32)) {
    throw new Error("JWT_SECRET must be a long random string (32+ characters) in production.");
  }
}

module.exports = { env, assertEnv };
