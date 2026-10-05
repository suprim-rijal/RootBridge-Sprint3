// Auth routes. Mounted at /api/auth.
const express = require("express");
const rateLimit = require("express-rate-limit");
const { signup, login, forgotPassword, me } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Slows down password guessing: 20 tries per 15 minutes per address.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many attempts. Please wait a few minutes and try again." },
});

router.post("/signup", limiter, signup);
router.post("/login", limiter, login);
router.post("/forgot-password", limiter, forgotPassword);
router.get("/me", protect, me);

module.exports = router;
