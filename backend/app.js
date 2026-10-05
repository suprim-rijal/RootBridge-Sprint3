// =====================================================================
// The Express app: middleware, routes, errors.
// server.js connects to MongoDB and starts it; tests import it directly.
// =====================================================================
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

const { env } = require("./config/env");
const { dbState } = require("./config/db");
const logger = require("./middleware/logger");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const AppError = require("./utils/AppError");

const app = express();
app.set("trust proxy", 1); // correct visitor address behind a host's proxy

// ---- Middleware: runs before every route ----
// Security headers. The Content Security Policy lists exactly what the
// website may load: its own files, Google Fonts (index.css uses them),
// photos stored as data: URLs, and downloads made from blob: URLs.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:", "blob:"],
        "media-src": ["'self'", "data:", "blob:"],
        "connect-src": ["'self'", ...env.clientOrigins],
        "frame-ancestors": ["'none'"],
        "object-src": ["'none'"],
        "upgrade-insecure-requests": env.isProduction ? [] : null,
      },
    },
  }),
);
app.use(compression()); // gzip: smaller, faster responses
// Who may call the API from a browser. Applied to /api only (below), so a
// wrong CLIENT_ORIGIN can never stop the website's own files from loading.
const corsRules = cors({
  origin(origin, done) {
    if (!origin || env.clientOrigins.includes(origin)) return done(null, true);
    return done(new AppError(`This website may not call the API: ${origin}`, 403));
  },
});

// Requests coming from the very address this app is served on are always
// fine: that is the one-service deployment, whatever CLIENT_ORIGIN says.
const sameOrigin = (req) => {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
};

const apiCors = (req, res, next) => (sameOrigin(req) ? cors()(req, res, next) : corsRules(req, res, next));
app.use(express.json({ limit: "1mb" }));
if (process.env.LOG_REQUESTS !== "0") app.use(logger);

// ---- Routes ----
app.use("/api", apiCors);

app.get("/api/health", (req, res) => {
  const database = dbState();
  res.status(database === "connected" ? 200 : 503).json({
    success: database === "connected",
    status: database === "connected" ? "ok" : "database not ready",
    database,
    time: new Date().toISOString(),
  });
});
app.use("/api", require("./routes/courseRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/progress", require("./routes/progressRoutes"));
app.use("/api/pronunciation", require("./routes/pronunciationRoutes"));
app.use("/api/groups", require("./routes/groupRoutes"));
// Class files: only the class's teacher and members can download them.
app.get("/api/materials/:id/file", require("./middleware/auth").protect, require("./controllers/groupController").downloadMaterial);

// ---- The website (one-service deployment) ----
// If the frontend has been built (frontend/dist), serve it too. Then ONE
// web service answers both the API and the pages, on one address, and
// there is nothing to configure for CORS.
const WEB_DIR = process.env.WEB_DIR || path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(path.join(WEB_DIR, "index.html"))) {
  // Built files have content hashes in their names, so they can be cached for long.
  app.use(express.static(WEB_DIR, { index: false, maxAge: "7d" }));
  // Every other page address gets index.html; React Router then shows the
  // right page (e.g. someone opening /dashboard directly, or refreshing).
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.set("Cache-Control", "no-cache");
    res.sendFile(path.join(WEB_DIR, "index.html"));
  });
}

// ---- Errors: must come after the routes ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
