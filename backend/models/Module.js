// A module: its words (items) and its lessons. Same shape as the m()
// helper in frontend/src/data/language.js, including skills, mechanics,
// testTasks and note. Items always use np / rom / en, for every language.
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    np: { type: String, required: true }, // the word in the language's own script
    rom: { type: String, default: "" }, // romanisation
    en: { type: String, required: true }, // English meaning
    note: { type: String, default: "" },
  },
  { _id: false },
);

const lessonSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // "l1-1-l1"
    title: { type: String, required: true },
    // Language lessons: Encounter -> Notice -> Retrieve -> Use
    // Culture lessons:  Encounter -> Notice -> Compare  -> Create
    phase: {
      type: String,
      enum: ["Encounter", "Notice", "Retrieve", "Use", "Compare", "Create"],
      default: "Encounter",
    },
    minutes: { type: Number, default: 7 },
  },
  { _id: false },
);

const moduleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // "l1-1", "fi-l1-1"
    chapterId: { type: String, required: true, index: true },
    trackId: { type: String, required: true, index: true },
    language: { type: String, required: true, index: true },
    code: { type: String, required: true },
    title: { type: String, required: true },
    goal: { type: String, default: "" },
    xp: { type: Number, default: 100 },
    skills: { type: [String], default: [] },
    mechanics: { type: [String], default: [] },
    testTasks: { type: [String], default: [] },
    note: { type: String, default: "" },
    order: { type: Number, default: 0 },
    items: { type: [itemSchema], default: [] },
    lessons: { type: [lessonSchema], default: [] },
  },
  { timestamps: true },
);

// Finding a lesson by its id (lessons live inside modules).
moduleSchema.index({ "lessons.id": 1 });

module.exports = mongoose.model("Module", moduleSchema);
