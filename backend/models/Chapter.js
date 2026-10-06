// A chapter inside a track, e.g. "L1 First sounds and social language".
const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // "l1", "fi-l1"
    trackId: { type: String, required: true, index: true },
    code: { type: String, required: true },
    title: { type: String, required: true },
    nativeTitle: { type: String, default: "" },
    summary: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Chapter", chapterSchema);
