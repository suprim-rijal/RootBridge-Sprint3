/*
FILE: backend/services/lives.js
OWNER: Member 2 - Learning experience

WHAT THIS FILE DOES
All the hearts rules in one file, with no database and no HTTP - which is why they can be tested with fixed clock times.

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
// The lives rules (NormalUser only). All in one file, so they are easy
// to find and change.
//
//   * start with 7
//   * a wrong answer costs 1, a hint costs 1 (floor 0)
//   * finishing a module quest refills to 7
//   * +1 heart every 4 hours while below 7
//   * at 0, practising an already-mastered lesson (in no-fail review
//     mode) earns +1, once per lesson per day
//
// Why the last two rules: the brief only asks for "refill when a module
// is finished". But with 0 hearts halfway through a module, the learner
// could never reach the end of that module — they would be stuck for
// ever. The 4-hour regeneration guarantees a way back; the review reward
// turns waiting into useful practice. No money is involved anywhere.
//
// Regeneration is worked out "lazily": no timer runs on the server. Each
// time progress is read, we look at how much time has passed since
// livesClockAt and add the hearts that were earned meanwhile.
// =====================================================================
const { MAX_LIVES } = require("../models/Progress");

const REGEN_MS = 4 * 60 * 60 * 1000; // 4 hours

// Adds any hearts earned by waiting. Returns true if something changed.
function applyRegen(progress, now = new Date()) {
  if (progress.lives >= MAX_LIVES) {
    progress.livesClockAt = null;
    return false;
  }
  if (!progress.livesClockAt) {
    progress.livesClockAt = now;
    return true;
  }
  const passed = now.getTime() - new Date(progress.livesClockAt).getTime();
  const earned = Math.floor(passed / REGEN_MS);
  if (earned <= 0) return false;

  progress.lives = Math.min(MAX_LIVES, progress.lives + earned);
  progress.livesClockAt = progress.lives >= MAX_LIVES ? null : new Date(new Date(progress.livesClockAt).getTime() + earned * REGEN_MS);
  return true;
}

function loseLife(progress, now = new Date()) {
  applyRegen(progress, now);
  if (progress.lives <= 0) return false; // nothing left to lose
  const wasFull = progress.lives >= MAX_LIVES;
  progress.lives -= 1;
  if (wasFull) progress.livesClockAt = now; // the clock starts at the first lost heart
  return true;
}

function refill(progress, now = new Date()) {
  progress.lives = MAX_LIVES;
  progress.livesClockAt = null;
  progress.livesLastRefillAt = now;
}

// What the frontend needs to draw the hearts and the countdown.
function livesInfo(progress, enabled, now = new Date()) {
  if (!enabled) return { enabled: false };
  const nextHeartAt =
    progress.lives < MAX_LIVES && progress.livesClockAt
      ? new Date(new Date(progress.livesClockAt).getTime() + REGEN_MS).toISOString()
      : null;
  return { enabled: true, lives: progress.lives, max: MAX_LIVES, nextHeartAt, now: now.toISOString() };
}

module.exports = { MAX_LIVES, REGEN_MS, applyRegen, loseLife, refill, livesInfo };
