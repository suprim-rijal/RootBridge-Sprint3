// A learning path, e.g. "nepali-language" or "finnish-culture".
const mongoose = require("mongoose");

const trackSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // "{language}-{kind}"
    language: { type: String, required: true, index: true }, // "nepali"
    kind: { type: String, enum: ["language", "culture"], required: true },
    title: { type: String, required: true },
    nativeTitle: { type: String, default: "" },
    description: { type: String, default: "" },
    themeColor: { type: String, default: "#332B5C" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Track", trackSchema);
