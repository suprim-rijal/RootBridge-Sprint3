
const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Give the class a name."], trim: true, maxlength: 80 },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    code: { type: String, required: true, unique: true, match: /^\d{6}$/ },
    language: { type: String, enum: ["nepali", "finnish", "japanese", "twi"], default: "nepali" },
    meets: { type: String, default: "", trim: true, maxlength: 80 }, // e.g. "Saturdays, 10:00"
    liveClassUrl: { type: String, default: "" }, // Zoom / Teams / Meet link
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Listed in the class directory, so learners can find it and ask to
    // join without knowing the code.
    discoverable: { type: Boolean, default: false, index: true },
    about: { type: String, default: "", trim: true, maxlength: 300 },
  },
  { timestamps: true },
);

// A random 6-digit code that no other class uses.
// Learners ask "which classes am I in?" on every dashboard load.
groupSchema.index({ members: 1 });

groupSchema.statics.newCode = async function newCode() {
  for (let i = 0; i < 20; i += 1) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    // eslint-disable-next-line no-await-in-loop -- one check at a time
    if (!(await this.exists({ code }))) return code;
  }
  throw new Error("Could not find a free class code. Please try again.");
};

module.exports = mongoose.model("Group", groupSchema);
