// Homework a teacher posts to one class.
const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    title: { type: String, required: [true, "Give the assignment a title."], trim: true, maxlength: 120 },
    instructions: { type: String, default: "", maxlength: 2000 },
    dueDate: { type: Date, default: null },
    // Optional: lessons to do, e.g. ["l1-1-l1", "l1-1-l2"]
    lessonIds: { type: [String], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Assignment", assignmentSchema);
