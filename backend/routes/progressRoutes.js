// Progress routes. Mounted at /api/progress. Learners only.
const express = require("express");
const { getMine, patchMine, loseLife, earnLife } = require("../controllers/progressController");
const { protect, requireRole } = require("../middleware/auth");
const { LEARNER_ROLES } = require("../config/roles");

const router = express.Router();
router.use(protect, requireRole(...LEARNER_ROLES));

router.get("/me", getMine);
router.patch("/me", patchMine);
router.post("/lives/lose", loseLife);
router.post("/lives/earn", earnLife);

module.exports = router;
