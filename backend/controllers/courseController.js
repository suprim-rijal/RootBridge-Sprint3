const Track = require("../models/Track");
const Chapter = require("../models/Chapter");
const Module = require("../models/Module");
const Progress = require("../models/Progress");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { buildLessonPayload } = require("../utils/lessonPayload");

// "language" on its own still means the Nepali track (Sprint 2 links).
const normaliseTrackId = (id = "") =>
  String(id).includes("-") ? String(id) : `nepali-${id}`;

// Plain objects without Mongo's internal fields.
const clean = ({ _id, __v, createdAt, updatedAt, ...rest }) => rest;

// GET /api/tracks?language=nepali
const getTracks = asyncHandler(async (req, res) => {
  const language =
    req.query.language || req.user?.details?.onboarding?.language || "nepali";
  const tracks = await Track.find({ language }).sort({ order: 1 }).lean();

  // Count lessons per track, in plain JavaScript. (Not in a model getter,
  // so it can never crash when a query leaves fields out, and no special
  // database operators are needed.)
  const modules = await Module.find({ language })
    .select("trackId lessons.id")
    .lean();
  const progress = await Progress.findOne({ user: req.user._id })
    .select("completedLessons")
    .lean();
  const done = new Set(progress?.completedLessons ?? []);
  const lessonsPerTrack = {};
  const donePerTrack = {};
  for (const m of modules) {
    lessonsPerTrack[m.trackId] =
      (lessonsPerTrack[m.trackId] ?? 0) + m.lessons.length;
    donePerTrack[m.trackId] =
      (donePerTrack[m.trackId] ?? 0) +
      m.lessons.filter((l) => done.has(l.id)).length;
  }

  const data = tracks.map((t) => ({
    id: t.id,
    language: t.language,
    title: t.title,
    nepaliTitle: t.nativeTitle, // Sprint 2 field name, kept for the frontend
    nativeTitle: t.nativeTitle,
    description: t.description,
    totalLessons: lessonsPerTrack[t.id] ?? 0,
    completedLessons: donePerTrack[t.id] ?? 0,
    themeColor: t.themeColor,
  }));
  res.json({ success: true, data });
});

// GET /api/tracks/:trackId
const getTrackById = asyncHandler(async (req, res) => {
  const track = await Track.findOne({
    id: normaliseTrackId(req.params.trackId),
  }).lean();
  if (!track) throw new AppError("Track not found", 404);

  const chapters = await Chapter.find({ trackId: track.id })
    .sort({ order: 1 })
    .lean();
  const modules = await Module.find({ trackId: track.id })
    .select("id chapterId order")
    .sort({ order: 1 })
    .lean();

  res.json({
    success: true,
    data: {
      id: track.id,
      language: track.language,
      title: track.title,
      description: track.description,
      chapters: chapters.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        moduleIds: modules.filter((m) => m.chapterId === c.id).map((m) => m.id),
      })),
    },
  });
});

// GET /api/modules/:moduleId
const getModuleById = asyncHandler(async (req, res) => {
  const mod = await Module.findOne({ id: req.params.moduleId }).lean();
  if (!mod) throw new AppError("Module not found", 404);
  res.json({ success: true, data: clean(mod) });
});

// GET /api/lessons/:lessonId
const getLessonById = asyncHandler(async (req, res) => {
  const mod = await Module.findOne({
    "lessons.id": req.params.lessonId,
  }).lean();
  const lesson = mod?.lessons.find((l) => l.id === req.params.lessonId);
  if (!lesson) throw new AppError("Lesson not found", 404);
  res.json({ success: true, data: buildLessonPayload(mod, lesson) });
});

module.exports = { getTracks, getTrackById, getModuleById, getLessonById };
