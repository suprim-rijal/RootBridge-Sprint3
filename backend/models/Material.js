// A file or link a teacher shares with one class.
const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    title: { type: String, required: [true, "Give the material a title."], trim: true, maxlength: 120 },
    kind: { type: String, enum: ["file", "link"], required: true },
    url: { type: String, default: "" }, // for links
    fileId: { type: mongoose.Schema.Types.ObjectId, default: null, select: false },
    fileName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Material", materialSchema);
