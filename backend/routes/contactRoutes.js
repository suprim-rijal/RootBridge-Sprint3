// Contact route. Mounted at /api/contact. Public, but rate-limited.
const express = require("express");
const rateLimit = require("express-rate-limit");
const { createMessage, listMessages } = require("../controllers/contactController");

const router = express.Router();
const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

router.post("/", limiter, createMessage);
router.get("/messages", listMessages); // needs the x-support-token header

module.exports = router;
