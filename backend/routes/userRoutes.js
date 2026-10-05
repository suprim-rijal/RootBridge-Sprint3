// User routes. Mounted at /api/users. Everything needs a login.
const express = require("express");
const { updateUser, verifyPin, resetPin } = require("../controllers/userController");
const { protect, requireRole } = require("../middleware/auth");
const { ROLES } = require("../config/roles");

const router = express.Router();

router.post("/update", protect, updateUser);
router.post("/verify-pin", protect, requireRole(ROLES.CHILD_PARENT), verifyPin);
router.post("/pin/reset", protect, requireRole(ROLES.CHILD_PARENT), resetPin);

module.exports = router;
