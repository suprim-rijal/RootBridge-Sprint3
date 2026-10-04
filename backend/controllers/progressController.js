// =====================================================================
// Progress controller
//   GET   /api/progress/me               my progress + lives
//   PATCH /api/progress/me               merge progress from the browser
//   POST  /api/progress/lives/lose       { reason: "wrong" | "hint" | "speech" }
//   POST  /api/progress/lives/earn       { lessonId }  review of a mastered lesson
//
// Merging, not overwriting: lessons, modules and days are combined, so
// progress made on two devices is never lost. The browser can NEVER set
// the number of lives; only the lives endpoints (and the module-quest
// refill) change them.
// =====================================================================
const Progress = require("../models/Progress");
const Module = require("../models/Module");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const lives = require("../services/lives");
const content = require("../services/contentIndex");
const { ROLES } = require("../config/roles");

const usesLives = (user) => user.role === ROLES.NORMAL;

async function progressFor(user) {
  let progress = await Progress.findOne({ user: user._id });
  if (!progress) progress = await Progress.create({ user: user._id });
  return progress;
}

// The JSON the frontend receives: the same fields as lib/progress.js,
// plus a "livesInfo" block.
function toClient(progress, user) {
  return {
    xp: progress.xp,
    completedLessons: progress.completedLessons,
    masteredModules: progress.masteredModules,
    rhythmDays: progress.rhythmDays,
    lastLesson: progress.lastLesson?.lessonId ? progress.lastLesson : null,
    livesInfo: lives.livesInfo(progress, usesLives(user)),
  };
}

const union = (a = [], b = []) => [...new Set([...a, ...b])];
const isStringList = (v) => Array.isArray(v) && v.every((x) => typeof x === "string");

// How much progress one request may add. A real lesson adds one id; this
// only stops someone pasting thousands at once.
const MAX_PER_REQUEST = 20;
const MAX_LESSONS = 5000;
const MAX_DAYS = 400; // about a year of streak history
const XP_PER_LESSON = 20;
const XP_PER_MODULE = 100;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

// XP is worked out from what was actually finished, never taken from the
// browser: otherwise anyone could award themselves any number.
const earnedXp = (progress) =>
  progress.completedLessons.length * XP_PER_LESSON + progress.masteredModules.length * XP_PER_MODULE;

// GET /api/progress/me
const getMine = asyncHandler(async (req, res) => {
  const progress = await progressFor(req.user);
  if (usesLives(req.user) && lives.applyRegen(progress)) await progress.save();
  res.json({ success: true, data: toClient(progress, req.user) });
});

// PATCH /api/progress/me   body: any of { xp, completedLessons, masteredModules, rhythmDays, lastLesson }
const patchMine = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const progress = await progressFor(req.user);
  const masteredBefore = progress.masteredModules.length;

  // Only ids that really exist are accepted, and only a few per request.
  const accept = (key, allowed) => {
    if (body[key] === undefined) return;
    if (!isStringList(body[key])) throw new AppError(`${key} must be a list of strings.`, 400);
    const real = content.isReady() ? body[key].filter(allowed) : body[key];
    progress[key] = union(progress[key], real.slice(0, MAX_PER_REQUEST));
  };
  accept("completedLessons", content.isLesson);
  accept("masteredModules", content.isModule);
  accept("rhythmDays", (d) => DAY.test(d));

  progress.completedLessons = progress.completedLessons.slice(0, MAX_LESSONS);
  progress.masteredModules = progress.masteredModules.slice(0, MAX_LESSONS);
  progress.rhythmDays = progress.rhythmDays.sort().slice(-MAX_DAYS);
  // body.xp is ignored on purpose (see earnedXp above).
  progress.xp = earnedXp(progress);

  if (body.lastLesson?.lessonId && content.isLesson(String(body.lastLesson.lessonId))) {
    progress.lastLesson = { trackId: String(body.lastLesson.trackId || "").slice(0, 40), lessonId: String(body.lastLesson.lessonId) };
  }

  // A newly mastered module (the quest was finished) refills the hearts.
  if (usesLives(req.user) && progress.masteredModules.length > masteredBefore) lives.refill(progress);
  if (usesLives(req.user)) lives.applyRegen(progress);

  await progress.save();
  res.json({ success: true, data: toClient(progress, req.user) });
});

// POST /api/progress/lives/lose   body: { reason }
const loseLife = asyncHandler(async (req, res) => {
  if (!usesLives(req.user)) throw new AppError("Only Normal learners use lives.", 403);
  const reason = req.body?.reason;
  if (!["wrong", "hint", "speech"].includes(reason)) throw new AppError('reason must be "wrong", "hint" or "speech".', 400);

  const progress = await progressFor(req.user);
  if (!lives.loseLife(progress)) {
    await progress.save();
    return res.status(409).json({ success: false, error: "No lives left.", data: toClient(progress, req.user) });
  }
  await progress.save();
  res.json({ success: true, data: toClient(progress, req.user) });
});

// POST /api/progress/lives/earn   body: { lessonId }
// Finishing a no-fail review of a lesson from an ALREADY MASTERED module
// earns one heart, once per lesson per day.
const earnLife = asyncHandler(async (req, res) => {
  if (!usesLives(req.user)) throw new AppError("Only Normal learners use lives.", 403);
  const { lessonId } = req.body || {};
  if (!lessonId) throw new AppError("Send the lessonId you reviewed.", 400);

  const mod = await Module.findOne({ "lessons.id": String(lessonId) }).select("id").lean();
  if (!mod) throw new AppError("Lesson not found", 404);

  const progress = await progressFor(req.user);
  lives.applyRegen(progress);
  // Any lesson the learner has already finished can be practised for a
  // heart. (It used to need a whole mastered module, which left a new
  // learner with no way back at all.)
  if (!progress.completedLessons.includes(String(lessonId))) {
    throw new AppError("Practise a lesson you have already finished to earn a heart.", 400);
  }
  if (progress.lives >= lives.MAX_LIVES) {
    return res.json({ success: true, message: "Your hearts are already full.", data: toClient(progress, req.user) });
  }

  const today = new Date().toISOString().slice(0, 10);
  const stamp = `${today}:${lessonId}`;
  if (progress.reviewRewards.includes(stamp)) {
    throw new AppError("This lesson already earned a heart today. Try another mastered lesson.", 409);
  }

  progress.lives += 1;
  if (progress.lives >= lives.MAX_LIVES) progress.livesClockAt = null;
  // Keep the list short: only today's rewards matter.
  progress.reviewRewards = [...progress.reviewRewards.filter((s) => s.startsWith(today)), stamp];
  await progress.save();
  res.json({ success: true, message: "You earned a heart back.", data: toClient(progress, req.user) });
});

module.exports = { getMine, patchMine, loseLife, earnLife };
