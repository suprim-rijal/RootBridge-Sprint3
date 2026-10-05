// Pronunciation route. Mounted at /api/pronunciation. Learners only,
// and rate-limited so the free Gemini quota is not used up.
const express = require("express");
const rateLimit = require("express-rate-limit");
const { gradePronunciation } = require("../controllers/pronunciationController");
const { protect, requireRole } = require("../middleware/auth");
const { LEARNER_ROLES } = require("../config/roles");

const router = express.Router();
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.PRONUNCIATION_RATE_LIMIT) || 30,
  keyGenerator: (req) => String(req.user?._id ?? req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Lots of practice! Wait a minute, then try again." },
});

router.post("/grade", protect, requireRole(...LEARNER_ROLES), limiter, gradePronunciation);

module.exports = router;
