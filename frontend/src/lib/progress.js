// Learner progress, saved in the browser (localStorage) AND on the server.
// Converted from storyteller-s-library.
//
// Sprint 3: "browser first, server synced".
//   * The page always reads and writes localStorage, so it is instant and
//     keeps working if the connection drops.
//   * A moment after each change, the new progress is sent to
//     PATCH /api/progress/me in the background (the UI never waits for it).
//   * After login, pullProgress() merges the server copy in, so progress
//     follows the learner to another device, and teachers can see it.
//
// How it works, step by step:
// 1. read() loads the saved progress object from localStorage (or the defaults).
// 2. useProgress() keeps that object in React state.
// 3. Every change is written back to localStorage AND announced with a
//    browser event, so other components on the page (like the KidNav XP chip)
//    update at the same time.

import { useCallback, useEffect, useState } from "react";
import { getModule, trackModules } from "../data/curriculum.js";
import { getProgress, syncProgress } from "../services/api.js";
import { tokenStore } from "../services/http.js";

const KEY_PREFIX = "rootbridge_learning_progress";
const SESSION_KEY = "rootbridge_session";

// Each account gets its own progress: "rootbridge_learning_progress:usr-202".
// We read the logged-in user id straight from the saved session.
function progressKey() {
  try {
    const session = JSON.parse(window.localStorage.getItem(SESSION_KEY));
    return session?.id ? `${KEY_PREFIX}:${session.id}` : `${KEY_PREFIX}:guest`;
  } catch {
    return `${KEY_PREFIX}:guest`;
  }
}
const EVENT = "rootbridge-progress-changed";

// "YYYY-MM-DD" in the learner's own time zone (not UTC), so a lesson at
// 00:30 counts for today, not yesterday.
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const defaultProgress = {
  name: "Explorer",
  romanization: true, // show latin spelling under Nepali words
  reducedMotion: false,
  xp: 0,
  completedLessons: [], // lesson ids
  masteredModules: [], // module ids (only set by finishing a module quest)
  rhythmDays: [], // "YYYY-MM-DD" days the learner practised (local time)
  lastLesson: null, // { trackId, lessonId } the lesson opened most recently
};

export function readProgress() {
  try {
    const raw = window.localStorage.getItem(progressKey());
    return raw ? { ...defaultProgress, ...JSON.parse(raw) } : { ...defaultProgress };
  } catch {
    return { ...defaultProgress };
  }
}

function writeLocal(next) {
  try {
    window.localStorage.setItem(progressKey(), JSON.stringify(next));
  } catch {
    // Storage can be blocked (private mode). The session still works.
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

// ---- background sync to the server ----
// Only the fields the server stores. Lives are NOT here: only the server
// changes lives (see lib/lives.js).
const SYNC_FIELDS = ["xp", "completedLessons", "masteredModules", "rhythmDays", "lastLesson"];
const SYNC_DELAY_MS = 800;
let syncTimer = null;
const syncListeners = new Set();

// Whose progress this is. The key already contains the user id.
const currentOwner = () => progressKey();

export function cancelProgressSync() {
  clearTimeout(syncTimer);
}

function scheduleSync(progress) {
  if (!tokenStore.get()) return; // not logged in: nothing to sync
  clearTimeout(syncTimer);
  const owner = currentOwner();
  syncTimer = setTimeout(() => {
    // Logged out, or someone else logged in meanwhile: drop it.
    if (!tokenStore.get() || currentOwner() !== owner) return;
    const payload = Object.fromEntries(SYNC_FIELDS.map((k) => [k, progress[k]]));
    syncProgress(payload)
      .then((res) => syncListeners.forEach((fn) => fn(res.data)))
      .catch(() => {
        // Offline or server down: the browser copy is safe; the next
        // change (or the next login) sends everything again.
      });
  }, SYNC_DELAY_MS);
}

// Anyone who needs the server's answer after a sync (e.g. the lives
// refill after a module quest) can listen.
export function onProgressSynced(fn) {
  syncListeners.add(fn);
  return () => syncListeners.delete(fn);
}

// Send everything now (used right after a module quest).
export function flushProgressSync() {
  clearTimeout(syncTimer);
  if (!tokenStore.get()) return Promise.resolve(null);
  const progress = readProgress();
  const payload = Object.fromEntries(SYNC_FIELDS.map((k) => [k, progress[k]]));
  return syncProgress(payload)
    .then((res) => {
      syncListeners.forEach((fn) => fn(res.data));
      return res.data;
    })
    .catch(() => null);
}

function save(next) {
  writeLocal(next);
  scheduleSync(next);
}

// After login: combine the server copy with the browser copy, keep the
// union, save it locally, and send the combined result back.
export async function pullProgress() {
  if (!tokenStore.get()) return;
  try {
    const { data } = await getProgress();
    const local = readProgress();
    const union = (a = [], b = []) => [...new Set([...a, ...b])];
    const merged = {
      ...local,
      xp: Math.max(local.xp || 0, data.xp || 0),
      completedLessons: union(local.completedLessons, data.completedLessons),
      masteredModules: union(local.masteredModules, data.masteredModules),
      rhythmDays: union(local.rhythmDays, data.rhythmDays),
      lastLesson: local.lastLesson || data.lastLesson || null,
    };
    writeLocal(merged);
    scheduleSync(merged);
  } catch {
    // Server unreachable: keep working with the browser copy.
  }
}

export function useProgress() {
  // The function form runs once, on the first render.
  const [state, setState] = useState(() => readProgress());

  // Listen for changes made by other components.
  useEffect(() => {
    const sync = () => setState(readProgress());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync); // other browser tabs
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const change = useCallback((makeNext) => {
    const next = makeNext(readProgress());
    save(next);
    setState(next);
  }, []);

  const update = useCallback((patch) => change((prev) => ({ ...prev, ...patch })), [change]);

  const completeLesson = useCallback(
    (lessonId, xp) => {
      const today = dayKey();
      change((prev) => {
        const alreadyDone = prev.completedLessons.includes(lessonId);
        return {
          ...prev,
          // Repeating a lesson still gives a little XP.
          xp: prev.xp + (alreadyDone ? Math.round(xp * 0.2) : xp),
          completedLessons: alreadyDone ? prev.completedLessons : [...prev.completedLessons, lessonId],
          rhythmDays: prev.rhythmDays.includes(today) ? prev.rhythmDays : [...prev.rhythmDays, today],
        };
      });
    },
    [change],
  );

  const masterModule = useCallback(
    (moduleId, xp) => {
      change((prev) => {
        if (prev.masteredModules.includes(moduleId)) return prev;
        return { ...prev, xp: prev.xp + xp, masteredModules: [...prev.masteredModules, moduleId] };
      });
    },
    [change],
  );

  // Remember the lesson that was opened, for "Continue learning".
  const setLastLesson = useCallback(
    (trackId, lessonId) => change((prev) => ({ ...prev, lastLesson: { trackId, lessonId } })),
    [change],
  );

  const reset = useCallback(() => {
    save({ ...defaultProgress });
    setState({ ...defaultProgress });
  }, []);

  return { state, update, completeLesson, masterModule, setLastLesson, reset };
}

// "l1-1" -> "language", "c2-3" -> "culture"
// "language" or "culture". Works for every language: the part after the
// language prefix starts with l or c ("l1-1", "fi-l1-1", "ja-c2-3").
export function trackOf(moduleId) {
  const local = String(moduleId).replace(/^[a-z]{2}-(?=[lc]\d)/, "");
  if (local.startsWith("l")) return "language";
  if (local.startsWith("c")) return "culture";
  return undefined;
}

// Returns "locked" | "available" | "in-progress" | "mastered"
export function moduleStatus(state, moduleId) {
  const mod = getModule(moduleId);
  if (!mod) return "locked";
  if (state.masteredModules.includes(moduleId)) return "mastered";
  if (mod.lessons.some((l) => state.completedLessons.includes(l.id))) return "in-progress";

  const track = trackOf(moduleId);
  if (!track) return "available";
  const ordered = trackModules(track);
  const index = ordered.findIndex((x) => x.id === moduleId);
  if (index <= 0) return "available"; // the very first module is always open

  // A module opens when the one before it is mastered or all its lessons are done.
  const prev = ordered[index - 1];
  const prevDone =
    state.masteredModules.includes(prev.id) ||
    prev.lessons.every((l) => state.completedLessons.includes(l.id));
  return prevDone ? "available" : "locked";
}

export function moduleProgress(state, moduleId) {
  const mod = getModule(moduleId);
  if (!mod) return { done: 0, total: 0, pct: 0 };
  const done = mod.lessons.filter((l) => state.completedLessons.includes(l.id)).length;
  return { done, total: mod.lessons.length, pct: (done / mod.lessons.length) * 100 };
}

export function trackProgress(state, trackId) {
  const mods = trackModules(trackId);
  const lessons = mods.flatMap((m) => m.lessons);
  const doneLessons = lessons.filter((l) => state.completedLessons.includes(l.id)).length;
  return {
    modules: mods.length,
    mastered: mods.filter((m) => state.masteredModules.includes(m.id)).length,
    lessons: lessons.length,
    doneLessons,
    pct: lessons.length ? (doneLessons / lessons.length) * 100 : 0,
  };
}

export function levelFromXp(xp) {
  let level = 1;
  while (Math.round(100 * Math.pow(level + 1, 1.35)) <= xp) level += 1;
  return level;
}

// Call after login / logout so every mounted page reloads the right user's progress.
export function notifyProgressChanged() {
  window.dispatchEvent(new CustomEvent(EVENT));
}
