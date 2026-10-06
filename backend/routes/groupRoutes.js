// Class routes. Mounted at /api/groups. Everything needs a login.
const express = require("express");
const ctrl = require("../controllers/groupController");
const { protect, requireRole } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { ROLES, LEARNER_ROLES } = require("../config/roles");

const router = express.Router();
router.use(protect);

const teacher = requireRole(ROLES.TEACHER);
const learner = requireRole(...LEARNER_ROLES);

// Learners (these come first so "join" is not read as a class id)
router.get("/directory", learner, ctrl.directory); // classes open to requests
router.get("/requests/mine", learner, ctrl.myRequests);
router.post("/:id/requests", learner, ctrl.askToJoin);
router.post("/join", learner, ctrl.join);
router.post("/leave", learner, ctrl.leave);
router.get("/mine", learner, ctrl.myClasses);

// Teachers
router.post("/", teacher, ctrl.createGroup);
router.get("/", teacher, ctrl.listMine);
router.get("/:id", teacher, ctrl.getGroup);
router.patch("/:id", teacher, ctrl.updateGroup);
router.delete("/:id", teacher, ctrl.deleteGroup);
router.delete("/:id/members/:userId", teacher, ctrl.removeMember);
router.get("/:id/requests", teacher, ctrl.listRequests);
router.post("/:id/requests/:rid/approve", teacher, ctrl.approveRequest);
router.post("/:id/requests/:rid/decline", teacher, ctrl.declineRequest);
router.post("/:id/assignments", teacher, ctrl.createAssignment);
router.delete("/:id/assignments/:aid", teacher, ctrl.deleteAssignment);
router.post("/:id/materials", teacher, upload.single("file"), ctrl.addMaterial);
router.delete("/:id/materials/:mid", teacher, ctrl.deleteMaterial);

module.exports = router;
