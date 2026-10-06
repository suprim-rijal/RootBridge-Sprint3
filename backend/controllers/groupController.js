// =====================================================================
// Classes (Step 6)
// ---------------------------------------------------------------------
// Teacher:
//   POST   /api/groups                        create a class (6-digit code)
//   GET    /api/groups                        my classes
//   GET    /api/groups/:id                    one class: roster + progress,
//                                             assignments, materials
//   PATCH  /api/groups/:id                    name, meeting time, live link
//   DELETE /api/groups/:id                    delete the class
//   DELETE /api/groups/:id/members/:userId    remove a student
//   POST   /api/groups/:id/assignments        post homework
//   DELETE /api/groups/:id/assignments/:aid
//   POST   /api/groups/:id/materials          upload a file or share a link
//   DELETE /api/groups/:id/materials/:mid
// Learner:
//   POST   /api/groups/join     { code }      join with the teacher's code
//   POST   /api/groups/leave    { code }
//   GET    /api/groups/mine                   my classes, with the live
//                                             link, homework and materials
// Both:
//   GET    /api/materials/:id/file            download (class members only)
// =====================================================================
const Group = require("../models/Group");
const Assignment = require("../models/Assignment");
const Material = require("../models/Material");
const JoinRequest = require("../models/JoinRequest");
const Progress = require("../models/Progress");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { ROLES } = require("../config/roles");
const fileStore = require("../services/fileStore");

// ---------- helpers ----------

// Only real web links: blocks "javascript:" and other tricks.
function cleanUrl(value, label = "The link") {
  const text = String(value ?? "").trim();
  if (!text) return "";
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new AppError(`${label} must be a full web address, starting with https://`, 400);
  }
  if (url.protocol !== "https:") throw new AppError(`${label} must start with https://`, 400);
  return url.toString();
}

// Loads a class and checks the logged-in teacher owns it.
async function ownGroup(req) {
  const group = await Group.findById(req.params.id);
  if (!group) throw new AppError("Class not found.", 404);
  if (String(group.teacher) !== String(req.user._id)) throw new AppError("This is another teacher's class.", 403);
  return group;
}

const classCard = (group, teacherName) => ({
  id: String(group._id),
  name: group.name,
  code: group.code,
  language: group.language,
  meets: group.meets,
  liveClassUrl: group.liveClassUrl,
  teacher: teacherName,
  discoverable: group.discoverable,
  about: group.about,
});

const assignmentJson = (a) => ({
  id: String(a._id),
  title: a.title,
  instructions: a.instructions,
  dueDate: a.dueDate,
  lessonIds: a.lessonIds,
  createdAt: a.createdAt,
});

const materialJson = (m) => ({
  id: String(m._id),
  title: m.title,
  kind: m.kind,
  url: m.kind === "link" ? m.url : "",
  fileName: m.fileName,
  mimeType: m.mimeType,
  size: m.size,
  createdAt: m.createdAt,
});

// The entry kept in user.details.classes (same shape as Sprint 2).
const classEntry = (group, teacherName) => ({
  groupId: String(group._id),
  code: group.code,
  name: group.name,
  teacher: teacherName,
  meets: group.meets,
  joinedAt: new Date().toISOString(),
});

// Changes the class entry in every student's details.classes.
// Done in plain JavaScript (load, change, save) rather than with special
// database operators, so it behaves the same on any MongoDB-compatible
// database. A class only has a handful of students, so this is cheap.
async function updateStudentEntries(groupId, change) {
  const id = String(groupId);
  const users = await User.find({ "details.classes.groupId": id });
  await Promise.all(
    users.map((u) => {
      u.details.classes = change(u.details.classes ?? [], id);
      u.markModified("details.classes");
      return u.save();
    }),
  );
}
const withoutGroup = (classes, id) => classes.filter((c) => c.groupId !== id);

function removeFile(material) {
  if (material?.fileId) return fileStore.deleteFile(material.fileId);
  return Promise.resolve();
}

// ---------- teacher ----------

const createGroup = asyncHandler(async (req, res) => {
  const { name, meets = "", language = "nepali", liveClassUrl = "" } = req.body || {};
  const group = await Group.create({
    name,
    meets,
    language,
    liveClassUrl: cleanUrl(liveClassUrl, "The live class link"),
    teacher: req.user._id,
    code: await Group.newCode(),
  });
  res.status(201).json({ success: true, message: "Class created", data: { ...classCard(group, req.user.name), memberCount: 0 } });
});

const listMine = asyncHandler(async (req, res) => {
  const groups = await Group.find({ teacher: req.user._id }).sort({ createdAt: -1 });
  res.json({
    success: true,
    data: groups.map((g) => ({ ...classCard(g, req.user.name), memberCount: g.members.length, createdAt: g.createdAt })),
  });
});

// One row per student: who they are and how they are doing.
async function roster(group) {
  const members = await User.find({ _id: { $in: group.members } });
  const progress = await Progress.find({ user: { $in: group.members } }).lean();
  return members.map((m) => {
    const p = progress.find((x) => String(x.user) === String(m._id));
    const days = [...(p?.rhythmDays ?? [])].sort();
    return {
      id: String(m._id),
      // Family accounts learn as the child, so show the child's name.
      name: m.role === ROLES.CHILD_PARENT && m.details?.parentSettings?.childName ? m.details.parentSettings.childName : m.name,
      account: m.name,
      role: m.role,
      language: m.details?.onboarding?.language ?? null,
      lessonsDone: p?.completedLessons.length ?? 0,
      modulesMastered: p?.masteredModules.length ?? 0,
      xp: p?.xp ?? 0,
      lastActive: days.at(-1) ?? null,
    };
  });
}

const getGroup = asyncHandler(async (req, res) => {
  const group = await ownGroup(req);
  const [students, assignments, materials] = await Promise.all([
    roster(group),
    Assignment.find({ group: group._id }).sort({ createdAt: -1 }),
    Material.find({ group: group._id }).sort({ createdAt: -1 }),
  ]);
  res.json({
    success: true,
    data: {
      ...classCard(group, req.user.name),
      memberCount: students.length,
      students,
      assignments: assignments.map(assignmentJson),
      materials: materials.map(materialJson),
    },
  });
});

const updateGroup = asyncHandler(async (req, res) => {
  const group = await ownGroup(req);
  const { name, meets, liveClassUrl, discoverable, about } = req.body || {};
  if (name !== undefined) group.name = name;
  if (meets !== undefined) group.meets = meets;
  if (liveClassUrl !== undefined) group.liveClassUrl = cleanUrl(liveClassUrl, "The live class link");
  if (discoverable !== undefined) group.discoverable = Boolean(discoverable);
  if (about !== undefined) group.about = String(about).slice(0, 300);
  await group.save();

  // Keep the students' copy of the class name and time up to date.
  await updateStudentEntries(group._id, (classes, id) =>
    classes.map((c) => (c.groupId === id ? { ...c, name: group.name, meets: group.meets } : c)),
  );
  res.json({ success: true, message: "Class updated", data: classCard(group, req.user.name) });
});

const deleteGroup = asyncHandler(async (req, res) => {
  const group = await ownGroup(req);
  const materials = await Material.find({ group: group._id }).select("+fileId");
  await Promise.all(materials.map(removeFile));
  await Promise.all([
    Assignment.deleteMany({ group: group._id }),
    Material.deleteMany({ group: group._id }),
    updateStudentEntries(group._id, withoutGroup),
    JoinRequest.deleteMany({ group: group._id }),
  ]);
  await group.deleteOne();
  res.json({ success: true, message: "Class deleted" });
});

const removeMember = asyncHandler(async (req, res) => {
  const group = await ownGroup(req);
  group.members = group.members.filter((m) => String(m) !== String(req.params.userId));
  await group.save();
  const student = await User.findById(req.params.userId);
  if (student) {
    student.details.classes = withoutGroup(student.details.classes ?? [], String(group._id));
    student.markModified("details.classes");
    await student.save();
  }
  res.json({ success: true, message: "Student removed from the class" });
});

const createAssignment = asyncHandler(async (req, res) => {
  const group = await ownGroup(req);
  const { title, instructions = "", dueDate = null, lessonIds = [] } = req.body || {};
  if (dueDate && Number.isNaN(new Date(dueDate).getTime())) throw new AppError("The due date is not a valid date.", 400);
  const assignment = await Assignment.create({
    group: group._id,
    title,
    instructions,
    dueDate: dueDate ? new Date(dueDate) : null,
    lessonIds: Array.isArray(lessonIds) ? lessonIds.map(String).slice(0, 20) : [],
  });
  res.status(201).json({ success: true, message: "Assignment posted", data: assignmentJson(assignment) });
});

const deleteAssignment = asyncHandler(async (req, res) => {
  const group = await ownGroup(req);
  const gone = await Assignment.findOneAndDelete({ _id: req.params.aid, group: group._id });
  if (!gone) throw new AppError("Assignment not found.", 404);
  res.json({ success: true, message: "Assignment removed" });
});

// A file (multipart form, field "file") or a link (JSON { title, url }).
const addMaterial = asyncHandler(async (req, res) => {
  const group = await ownGroup(req);
  const title = String(req.body?.title ?? "").trim();
  let material;
  if (req.file) {
    const fileId = await fileStore.saveFile(req.file.buffer, {
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    material = await Material.create({
      group: group._id,
      title: title || req.file.originalname,
      kind: "file",
      fileId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } else {
    if (!req.body?.url) throw new AppError("Attach a file or paste a link.", 400);
    material = await Material.create({ group: group._id, title, kind: "link", url: cleanUrl(req.body.url) });
  }
  res.status(201).json({ success: true, message: "Material shared", data: materialJson(material) });
});

const deleteMaterial = asyncHandler(async (req, res) => {
  const group = await ownGroup(req);
  const material = await Material.findOneAndDelete({ _id: req.params.mid, group: group._id }).select("+fileId");
  if (!material) throw new AppError("Material not found.", 404);
  await removeFile(material);
  res.json({ success: true, message: "Material removed" });
});

// ---------- learner ----------

// Adds a learner to a class and writes their copy of it. Used by the code
// path (join) and by a teacher approving a request.
async function addMember(group, learner, teacherName) {
  if (!group.members.some((m) => String(m) === String(learner._id))) {
    group.members.push(learner._id);
    await group.save();
  }
  const already = (learner.details.classes ?? []).some((c) => c.groupId === String(group._id));
  if (!already) {
    learner.details.classes = [...(learner.details.classes ?? []), classEntry(group, teacherName)];
    learner.markModified("details.classes");
    await learner.save();
  }
}

// ---------- finding a class without a code ----------

// GET /api/groups/directory?language=
// Classes their teacher chose to list. The join code is NEVER included.
const directory = asyncHandler(async (req, res) => {
  const filter = { discoverable: true };
  if (req.query.language) filter.language = String(req.query.language);
  const found = await Group.find(filter).populate("teacher", "name").sort({ createdAt: -1 }).limit(100);
  // Skip classes whose teacher account is gone: a learner could never
  // reach anyone there.
  const groups = found.filter((g) => g.teacher);
  const requests = await JoinRequest.find({ learner: req.user._id }).lean();

  res.json({
    success: true,
    data: groups.map((g) => ({
      id: String(g._id),
      name: g.name,
      language: g.language,
      meets: g.meets,
      about: g.about,
      teacher: g.teacher?.name ?? "",
      learners: g.members.length,
      isMember: g.members.some((m) => String(m) === String(req.user._id)),
      requestStatus: requests.find((r) => String(r.group) === String(g._id))?.status ?? null,
    })),
  });
});

// POST /api/groups/:id/requests   { message }
const askToJoin = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id).populate("teacher", "name");
  if (!group || !group.discoverable) throw new AppError("That class is not open for requests.", 404);
  if (group.members.some((m) => String(m) === String(req.user._id))) {
    throw new AppError(`You are already in ${group.name}.`, 409);
  }
  const existing = await JoinRequest.findOne({ group: group._id, learner: req.user._id });
  if (existing?.status === "pending") throw new AppError("You have already asked to join this class.", 409);

  const message = String(req.body?.message ?? "").slice(0, 500);
  if (existing) {
    existing.status = "pending";
    existing.message = message;
    existing.teacherNote = "";
    await existing.save();
  } else {
    await JoinRequest.create({ group: group._id, learner: req.user._id, message });
  }
  res.status(201).json({ success: true, message: `Your request was sent to ${group.teacher?.name ?? "the teacher"}.` });
});

// GET /api/groups/requests/mine   (learner)
const myRequests = asyncHandler(async (req, res) => {
  const requests = await JoinRequest.find({ learner: req.user._id })
    .populate({ path: "group", select: "name language teacher", populate: { path: "teacher", select: "name" } })
    .sort({ updatedAt: -1 })
    .limit(50);
  res.json({
    success: true,
    data: requests
      .filter((r) => r.group)
      .map((r) => ({
        id: String(r._id),
        className: r.group.name,
        teacher: r.group.teacher?.name ?? "",
        status: r.status,
        message: r.message,
        teacherNote: r.teacherNote,
        sentAt: r.createdAt,
      })),
  });
});

// GET /api/groups/:id/requests   (teacher)
const listRequests = asyncHandler(async (req, res) => {
  const group = await ownGroup(req);
  const requests = await JoinRequest.find({ group: group._id, status: "pending" })
    .populate("learner", "name role details.parentSettings.childName details.onboarding.language")
    .sort({ createdAt: 1 });
  res.json({
    success: true,
    data: requests.map((r) => ({
      id: String(r._id),
      learnerId: String(r.learner?._id ?? ""),
      // Family accounts learn as the child.
      name:
        r.learner?.role === ROLES.CHILD_PARENT && r.learner?.details?.parentSettings?.childName
          ? r.learner.details.parentSettings.childName
          : (r.learner?.name ?? "A learner"),
      account: r.learner?.name ?? "",
      language: r.learner?.details?.onboarding?.language ?? null,
      message: r.message,
      sentAt: r.createdAt,
    })),
  });
});

// POST /api/groups/:id/requests/:rid/approve   (teacher)
const approveRequest = asyncHandler(async (req, res) => {
  const group = await ownGroup(req);
  const request = await JoinRequest.findOne({ _id: req.params.rid, group: group._id });
  if (!request) throw new AppError("Request not found.", 404);
  const learner = await User.findById(request.learner);
  if (!learner) throw new AppError("That learner no longer has an account.", 404);

  await addMember(group, learner, req.user.name);
  request.status = "approved";
  await request.save();
  res.json({ success: true, message: `${learner.name} joined ${group.name}.` });
});

// POST /api/groups/:id/requests/:rid/decline   (teacher)   { note }
const declineRequest = asyncHandler(async (req, res) => {
  const group = await ownGroup(req);
  const request = await JoinRequest.findOne({ _id: req.params.rid, group: group._id });
  if (!request) throw new AppError("Request not found.", 404);
  request.status = "declined";
  request.teacherNote = String(req.body?.note ?? "").slice(0, 300);
  await request.save();
  res.json({ success: true, message: "Request declined." });
});

const join = asyncHandler(async (req, res) => {
  const code = String(req.body?.code ?? "").replace(/\D/g, "");
  if (!/^\d{6}$/.test(code)) throw new AppError("A class code has 6 digits.", 400);

  const group = await Group.findOne({ code }).populate("teacher", "name");
  if (!group) throw new AppError("No class uses that code. Check it with your teacher.", 404);
  if (group.members.some((m) => String(m) === String(req.user._id))) {
    throw new AppError(`You are already in ${group.name}.`, 409);
  }

  await addMember(group, req.user, group.teacher?.name ?? "");
  res.json({ success: true, message: `You joined ${group.name}.`, user: req.user });
});

const leave = asyncHandler(async (req, res) => {
  const code = String(req.body?.code ?? "").replace(/\D/g, "");
  const group = await Group.findOne({ code });
  if (group) {
    group.members = group.members.filter((m) => String(m) !== String(req.user._id));
    await group.save();
  }
  req.user.details.classes = (req.user.details.classes ?? []).filter((c) => c.code !== code);
  req.user.markModified("details.classes");
  await req.user.save();
  res.json({ success: true, message: "You left the class.", user: req.user });
});

const myClasses = asyncHandler(async (req, res) => {
  const groups = await Group.find({ members: req.user._id }).populate("teacher", "name").sort({ createdAt: 1 });
  const ids = groups.map((g) => g._id);
  const [assignments, materials, progress] = await Promise.all([
    Assignment.find({ group: { $in: ids } }).sort({ dueDate: 1, createdAt: -1 }),
    Material.find({ group: { $in: ids } }).sort({ createdAt: -1 }),
    Progress.findOne({ user: req.user._id }).lean(),
  ]);
  const done = new Set(progress?.completedLessons ?? []);

  res.json({
    success: true,
    data: groups.map((g) => ({
      ...classCard(g, g.teacher?.name ?? ""),
      assignments: assignments
        .filter((a) => String(a.group) === String(g._id))
        .map((a) => ({
          ...assignmentJson(a),
          // Done when every linked lesson is finished.
          done: a.lessonIds.length > 0 && a.lessonIds.every((id) => done.has(id)),
        })),
      materials: materials.filter((m) => String(m.group) === String(g._id)).map(materialJson),
    })),
  });
});

// ---------- download a file (teacher of the class, or a member) ----------
const downloadMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id).select("+fileId");
  if (!material || material.kind !== "file") throw new AppError("File not found.", 404);
  const group = await Group.findById(material.group);
  const isTeacher = group && String(group.teacher) === String(req.user._id);
  const isMember = group?.members.some((m) => String(m) === String(req.user._id));
  if (!isTeacher && !isMember) throw new AppError("Only this class can open its files.", 403);

  const file = await fileStore.openFile(material.fileId);
  if (!file) throw new AppError("This file is no longer on the server. Ask your teacher to upload it again.", 404);
  res.set({
    "Content-Type": material.mimeType || "application/octet-stream",
    "Content-Length": String(file.size),
    // attachment: the browser saves it rather than opening it in the page
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(material.fileName)}`,
    "X-Content-Type-Options": "nosniff",
  });
  file.stream.on("error", (err) => res.destroy(err)).pipe(res);
});

module.exports = {
  directory,
  askToJoin,
  myRequests,
  listRequests,
  approveRequest,
  declineRequest,
  createGroup,
  listMine,
  getGroup,
  updateGroup,
  deleteGroup,
  removeMember,
  createAssignment,
  deleteAssignment,
  addMaterial,
  deleteMaterial,
  join,
  leave,
  myClasses,
  downloadMaterial,
  cleanUrl,
};
