// =====================================================================
// A learner asking a teacher to join their class.
// ---------------------------------------------------------------------
// Before this, a learner could only join if they already knew the 6-digit
// code, which they had no way of getting. Now a teacher can list a class
// in the directory, and learners ask to join with a short message.
// =====================================================================
const mongoose = require("mongoose");

const joinRequestSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    learner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // A few words from the learner: who they are, what they want to learn.
    message: { type: String, default: "", maxlength: 500 },
    status: { type: String, enum: ["pending", "approved", "declined"], default: "pending" },
    // An optional reply from the teacher when declining.
    teacherNote: { type: String, default: "", maxlength: 300 },
  },
  { timestamps: true },
);

// One live request per learner per class.
joinRequestSchema.index({ group: 1, learner: 1 }, { unique: true });

module.exports = mongoose.model("JoinRequest", joinRequestSchema);
