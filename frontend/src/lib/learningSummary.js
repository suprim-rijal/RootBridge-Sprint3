// Turns saved progress (lib/progress.js) into numbers and lists for the
// dashboards. Pure functions: easy to test, no React inside.

import { curriculumFor, getActiveLanguage, getLesson, getTrack, trackModules } from "../data/curriculum.js";
import { dayKey, levelFromXp, moduleStatus, trackProgress } from "./progress.js";

// The last 7 days, oldest first: { date: "YYYY-MM-DD", weekday: 0-6 (Monday = 0) }
export function lastSevenDays() {
  const out = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push({ date: dayKey(d), weekday: (d.getDay() + 6) % 7 });
  }
  return out;
}

export const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// Days in a row with at least one lesson. The streak stays alive until
// the end of today, so "learned yesterday, not yet today" still counts.
export function currentStreak(rhythmDays) {
  const days = new Set(rhythmDays);
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function longestStreak(rhythmDays) {
  const sorted = [...new Set(rhythmDays)].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const key of sorted) {
    const date = new Date(`${key}T12:00:00`);
    const expected = prev ? new Date(prev.getTime() + 86_400_000) : null;
    run = expected && dayKey(expected) === key ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}

export function summarize(state) {
  const week = lastSevenDays();
  return {
    xp: state.xp,
    level: levelFromXp(state.xp),
    lessonsDone: state.completedLessons.length,
    modulesMastered: state.masteredModules.length,
    daysThisWeek: week.filter((d) => state.rhythmDays.includes(d.date)).length,
    streak: currentStreak(state.rhythmDays),
    bestStreak: longestStreak(state.rhythmDays),
    learnedToday: state.rhythmDays.includes(dayKey()),
    week,
    tracks: {
      language: trackProgress(state, "language"),
      culture: trackProgress(state, "culture"),
    },
  };
}

// First lesson not done yet, in the first open module of a track.
export function nextLessonFor(state, trackId) {
  const modules = trackModules(trackId);
  const mod =
    modules.find((m) => moduleStatus(state, m.id) !== "mastered" && moduleStatus(state, m.id) !== "locked") ??
    modules[0];
  const lesson = mod.lessons.find((l) => !state.completedLessons.includes(l.id)) ?? mod.lessons[0];
  return { track: getTrack(trackId), module: mod, lesson };
}

// "Continue learning": the last opened lesson if it is not finished,
// otherwise the next lesson on that path. Falls back to the first
// allowed path. Returns null when no path is allowed.
export function continueLearning(state, allowedTracks) {
  const allowed = ["language", "culture"].filter((id) => allowedTracks[id]);
  if (!allowed.length) return null;
  const last = state.lastLesson;
  if (last && allowed.includes(last.trackId)) {
    const found = getLesson(last.lessonId);
    if (found && !state.completedLessons.includes(last.lessonId)) {
      return { track: getTrack(last.trackId), module: found.module, lesson: found.lesson, resuming: true };
    }
    return { ...nextLessonFor(state, last.trackId), resuming: false };
  }
  return { ...nextLessonFor(state, allowed[0]), resuming: false };
}

// Both paths together, for "Overall progress".
export function overallProgress(state) {
  const s = summarize(state);
  const lessons = s.tracks.language.lessons + s.tracks.culture.lessons;
  const done = s.tracks.language.doneLessons + s.tracks.culture.doneLessons;
  const modules = s.tracks.language.modules + s.tracks.culture.modules;
  return {
    lessons,
    done,
    modules,
    mastered: s.modulesMastered,
    pct: lessons ? (done / lessons) * 100 : 0,
    tracks: s.tracks,
  };
}

// Most recent lessons first (completedLessons is saved in order).
export function recentLessons(state, count = 5) {
  return state.completedLessons
    .slice(-count)
    .reverse()
    .map((id) => getLesson(id))
    .filter(Boolean);
}

// A simple everyday word, the same all day.
// Short single words from the learner's language track.
function simpleWords(language = getActiveLanguage()) {
  return (curriculumFor(language).tracks.find((t) => t.id === "language")?.chapters ?? [])
    .flatMap((c) => c.modules)
    .flatMap((m) => m.items)
    .filter((w) => !w.np.includes("_") && !w.np.includes(" ") && w.np.length <= 10);
}

export function wordOfTheDay(date = new Date(), language = getActiveLanguage()) {
  const words = simpleWords(language);
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  return words[dayNumber % words.length];
}

// A culture fact from the learner's language, the same all day.
export function factOfTheDay(date = new Date(), language = getActiveLanguage()) {
  const facts = curriculumFor(language).facts ?? [];
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  return facts[dayNumber % facts.length];
}

// Cultural Passport stamps, earned from real progress.
export function passportStamps(state) {
  const s = summarize(state);
  return [
    { id: "first-step", label: "First step", np: "पहिलो पाइला", earned: s.lessonsDone >= 1, rule: "Finish 1 lesson" },
    { id: "five-lessons", label: "Five lessons", np: "पाँच पाठ", earned: s.lessonsDone >= 5, rule: "Finish 5 lessons" },
    { id: "first-module", label: "Module master", np: "मोड्युल", earned: s.modulesMastered >= 1, rule: "Finish a module quest" },
    {
      id: "culture-explorer",
      label: "Culture explorer",
      np: "संस्कृति",
      earned: s.tracks.culture.doneLessons >= 1,
      rule: "Finish a culture lesson",
    },
    { id: "steady-week", label: "Steady week", np: "हप्ता", earned: s.daysThisWeek >= 3, rule: "Learn on 3 days in a week" },
    { id: "rising-star", label: "Rising star", np: "तारा", earned: s.xp >= 200, rule: "Collect 200 XP" },
  ];
}
