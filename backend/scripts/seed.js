// =====================================================================
// Seed the database.
//
//   npm run seed          replace ALL course content, keep users,
//                         add the demo accounts if they are missing
//   npm run seed:reset    also delete every user and start fresh
//   add  -- --no-demo     to skip the demo accounts (for a public site:
//                         their password is written in this file)
//
// Course content is REPLACED on every run (never "kept"), so the
// database always matches the curriculum files exactly.
//
// Content source: frontend/src/data/curriculum.js, which lists every
// language (Nepali from Sprint 2, plus Finnish, Japanese and Twi in
// frontend/src/data/languages/). The website and the database are
// always built from the SAME files, so they can never disagree.
// =====================================================================
const path = require("path");
const { pathToFileURL } = require("url");

const { assertEnv } = require("../config/env");
const { connectDB, disconnectDB, mongoose } = require("../config/db");
const { ROLES } = require("../config/roles");
const User = require("../models/User");
const Track = require("../models/Track");
const Chapter = require("../models/Chapter");
const Module = require("../models/Module");

const TRACK_COLORS = { language: "#332B5C", culture: "#C15B3C" };

// ---------------------------------------------------------------------
// Turn one language's curriculum (tracks -> chapters -> modules) into the
// three flat collections. Works for every language.
// ---------------------------------------------------------------------
function flatten(language, tracks) {
  const out = { tracks: [], chapters: [], modules: [] };
  tracks.forEach((track, trackIndex) => {
    const kind = track.kind || track.id; // "language" | "culture"
    const trackId = `${language}-${kind}`;
    out.tracks.push({
      id: trackId,
      language,
      kind,
      title: track.title,
      nativeTitle: track.nativeTitle ?? track.nepaliTitle ?? "",
      description: track.tagline ?? track.description ?? "",
      themeColor: TRACK_COLORS[kind] ?? "#332B5C",
      order: trackIndex,
    });
    track.chapters.forEach((chapter, chapterIndex) => {
      out.chapters.push({
        id: chapter.id,
        trackId,
        code: chapter.code,
        title: chapter.title,
        nativeTitle: chapter.nativeTitle ?? chapter.nepaliTitle ?? "",
        summary: chapter.summary ?? "",
        order: chapterIndex,
      });
      chapter.modules.forEach((mod, moduleIndex) => {
        out.modules.push({
          id: mod.id,
          chapterId: chapter.id,
          trackId,
          language,
          code: mod.code,
          title: mod.title,
          goal: mod.goal ?? "",
          xp: mod.xp ?? 100,
          skills: mod.skills ?? [],
          mechanics: mod.mechanics ?? [],
          testTasks: mod.testTasks ?? [],
          note: mod.note ?? "",
          order: chapterIndex * 100 + moduleIndex,
          items: mod.items.map(({ np, rom, en, note }) => ({ np, rom: rom ?? "", en, note: note ?? "" })),
          lessons: mod.lessons.map(({ id, title, phase, minutes }) => ({ id, title, phase, minutes })),
        });
      });
    });
  });
  return out;
}

// Every language we have content for.
async function loadAllContent() {
  const file = path.join(__dirname, "..", "..", "frontend", "src", "data", "curriculum.js");
  const { CURRICULA } = await import(pathToFileURL(file).href);
  const all = Object.values(CURRICULA).map((c) => flatten(c.language, c.tracks));

  return {
    tracks: all.flatMap((x) => x.tracks),
    chapters: all.flatMap((x) => x.chapters),
    modules: all.flatMap((x) => x.modules),
  };
}

// Stops the seed if the content has a mistake, before touching the database.
function checkContent({ tracks, chapters, modules }) {
  const problems = [];
  const dup = (list, label) => {
    const seen = new Set();
    for (const x of list) {
      if (seen.has(x)) problems.push(`duplicate ${label}: ${x}`);
      seen.add(x);
    }
  };
  dup(tracks.map((t) => t.id), "track id");
  dup(chapters.map((c) => c.id), "chapter id");
  dup(modules.map((m) => m.id), "module id");
  dup(modules.flatMap((m) => m.lessons.map((l) => l.id)), "lesson id");
  for (const m of modules) {
    if (!m.items.length) problems.push(`${m.id} has no words`);
    if (!m.lessons.length) problems.push(`${m.id} has no lessons`);
    for (const item of m.items) if (!item.np || !item.en) problems.push(`${m.id} has a word without np or en`);
  }
  return problems;
}

// ---------------------------------------------------------------------
// Demo accounts (bcrypt-hashed like any other account).
// ---------------------------------------------------------------------
const DEMO_PASSWORD = "demo123";
const demoUsers = [
  {
    name: "Sita Sharma",
    email: "family@demo.com",
    role: ROLES.CHILD_PARENT,
    details: { onboarding: { language: "nepali", completed: true }, parentSettings: { childName: "Aarav" } },
  },
  {
    name: "Priya Thapa",
    email: "learner@demo.com",
    role: ROLES.NORMAL,
    details: { onboarding: { language: "nepali", completed: true } },
  },
  {
    name: "Hari Gurung",
    email: "teacher@demo.com",
    role: ROLES.TEACHER,
    details: { onboarding: { language: "nepali", completed: true } },
  },
];

async function seedContent() {
  const content = await loadAllContent();
  const problems = checkContent(content);
  if (problems.length) {
    throw new Error(`Content has ${problems.length} problem(s):\n  ${problems.slice(0, 20).join("\n  ")}`);
  }

  // Replace everything, so nothing old is left behind.
  await Promise.all([Track.deleteMany({}), Chapter.deleteMany({}), Module.deleteMany({})]);
  await Track.insertMany(content.tracks);
  await Chapter.insertMany(content.chapters);
  await Module.insertMany(content.modules);

  const byLanguage = {};
  for (const m of content.modules) {
    byLanguage[m.language] ??= { modules: 0, lessons: 0 };
    byLanguage[m.language].modules += 1;
    byLanguage[m.language].lessons += m.lessons.length;
  }
  return { ...content, byLanguage };
}

async function seedUsers({ reset, demo = true }) {
  if (reset) {
    // A clean slate: without this, classes, homework, files and progress
    // of the deleted accounts would stay behind as orphans.
    const models = ["Group", "Assignment", "Material", "JoinRequest", "Progress", "Message"];
    await Promise.all(models.map((name) => require(`../models/${name}`).deleteMany({})));
    await mongoose.connection.db.collection("materials.files").deleteMany({}).catch(() => {});
    await mongoose.connection.db.collection("materials.chunks").deleteMany({}).catch(() => {});
    await User.deleteMany({});
  }
  if (!demo) return [];
  const created = [];
  for (const info of demoUsers) {
    if (await User.exists({ email: info.email })) continue;
    await User.create({ ...info, password: DEMO_PASSWORD });
    created.push(info.email);
  }
  return created;
}

async function run() {
  const reset = process.argv.includes("--reset");
  const demo = !process.argv.includes("--no-demo");
  assertEnv();
  await connectDB();

  const content = await seedContent();
  await require("../services/contentIndex").loadContentIndex();
  // Sync indexes after the content is in, so unique ids are enforced.
  await Promise.all([User.syncIndexes(), Track.syncIndexes(), Chapter.syncIndexes(), Module.syncIndexes()]);
  const created = await seedUsers({ reset, demo });

  console.log("\nSeed finished");
  for (const [language, n] of Object.entries(content.byLanguage)) {
    console.log(`  ${language.padEnd(10)} ${n.modules} modules, ${n.lessons} lessons`);
  }
  console.log(`  tracks ${content.tracks.length}, chapters ${content.chapters.length}, modules ${content.modules.length}`);
  console.log(
    !demo
      ? "  demo accounts skipped (--no-demo)"
      : created.length
        ? `  demo accounts created: ${created.join(", ")} (password ${DEMO_PASSWORD})`
        : "  demo accounts already existed",
  );
  if (reset) console.log("  --reset: all previous users were deleted");

  await disconnectDB();
}

if (require.main === module) {
  run().catch(async (err) => {
    console.error(`Seed failed: ${err.message}`);
    await disconnectDB().catch(() => {});
    process.exit(1);
  });
}

module.exports = { flatten, loadAllContent, checkContent, seedContent, seedUsers, demoUsers, DEMO_PASSWORD };
