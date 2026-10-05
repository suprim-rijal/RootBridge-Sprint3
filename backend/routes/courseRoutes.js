// Course routes. Mounted at /api. Learners only.
const express = require("express");
const { getTracks, getTrackById, getModuleById, getLessonById } = require("../controllers/courseController");
const { protect, requireRole } = require("../middleware/auth");
const { LEARNER_ROLES } = require("../config/roles");

const router = express.Router();
const learnerOnly = [protect, requireRole(...LEARNER_ROLES)];

router.get("/tracks", ...learnerOnly, getTracks);
router.get("/tracks/:trackId", ...learnerOnly, getTrackById);
router.get("/modules/:moduleId", ...learnerOnly, getModuleById);
router.get("/lessons/:lessonId", ...learnerOnly, getLessonById);

module.exports = router;
