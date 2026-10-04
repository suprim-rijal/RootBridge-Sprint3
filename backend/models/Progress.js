/*
FILE: backend/models/Progress.js
OWNER: Member 2 - Learning experience

WHAT THIS FILE DOES
One document per learner: what they finished, their XP, their streak days and their hearts.

BEFORE YOU WRITE ANY CODE HERE
  1. Read this file's chapter in docs/RootBridge-Course-Book.pdf.
  2. Check OWNERSHIP.md - if you are not the owner, open an issue instead
     of editing, or agree a hand-over in the group chat first.
  3. Create a branch named   feature/<area>-<short-task>   from develop.

WHEN YOU HAVE FINISHED
  - Run the checks for your side (backend: npm test, frontend: npm run build).
  - Commit in small steps with messages that say WHY, not just what.
  - Open a pull request into develop and ask one teammate to review.
*/
// =====================================================================
// Progress — the server copy of what frontend/src/lib/progress.js keeps
// in the browser. One document per user.
//
// The browser stays "first" (instant, works offline) and sends its
// progress here in the background. Having it on the server means:
//   * progress follows the learner to another device
//   * a teacher can see a student's progress (Step 6)
//   * lives can be trusted: only the server changes them
// =====================================================================
const mongoose = require("mongoose");

const MAX_LIVES = 7;

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    xp: { type: Number, default: 0, min: 0 },
    completedLessons: { type: [String], default: [] }, // lesson ids
    masteredModules: { type: [String], default: [] }, // module ids
    rhythmDays: { type: [String], default: [] }, // "YYYY-MM-DD"
    lastLesson: {
      trackId: { type: String, default: null },
      lessonId: { type: String, default: null },
    },

    // ---- Lives: NormalUser only (ignored for Child/Parent accounts) ----
    lives: { type: Number, default: MAX_LIVES, min: 0, max: MAX_LIVES },
    // The moment the regeneration clock counts from (see services/lives.js)
    livesClockAt: { type: Date, default: null },
    livesLastRefillAt: { type: Date, default: null },
    // Review lessons that already earned a heart today ("YYYY-MM-DD:lessonId")
    reviewRewards: { type: [String], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Progress", progressSchema);
module.exports.MAX_LIVES = MAX_LIVES;
