
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
