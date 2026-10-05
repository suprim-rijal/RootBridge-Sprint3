// =====================================================================
// Step 3 tests: server-side progress and the lives rules.
// Uses a real database, like step1.test.js.
// =====================================================================
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-0123456789abcdef0123456789";
process.env.LOG_REQUESTS = "0";
process.env.AUTH_RATE_LIMIT = "1000";
process.env.BCRYPT_ROUNDS = "4";

const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const lives = require("../services/lives");

const TEST_URI = process.env.MONGODB_URI_TEST || "mongodb://127.0.0.1:27017/rootbridge_test";

// ---------------------------------------------------------------------
// 1. The rules on their own (no database, fixed clock times)
// ---------------------------------------------------------------------
const H = 60 * 60 * 1000;
const t0 = new Date("2026-09-21T08:00:00Z");
const at = (hours) => new Date(t0.getTime() + hours * H);
const fresh = () => ({ lives: 7, livesClockAt: null, livesLastRefillAt: null });

test("rules: start with 7, a lost heart starts the 4-hour clock", () => {
  const p = fresh();
  assert.equal(lives.loseLife(p, t0), true);
  assert.equal(p.lives, 6);
  assert.equal(p.livesClockAt.getTime(), t0.getTime());
});

test("rules: lives never go below zero", () => {
  const p = { ...fresh(), lives: 1 };
  assert.equal(lives.loseLife(p, t0), true);
  assert.equal(p.lives, 0);
  assert.equal(lives.loseLife(p, t0), false, "nothing left to lose");
  assert.equal(p.lives, 0);
});

test("rules: +1 heart every 4 hours, counted when progress is read", () => {
  const p = fresh();
  lives.loseLife(p, t0);
  lives.loseLife(p, t0);
  lives.loseLife(p, t0); // 4 left, clock at t0

  lives.applyRegen(p, at(3.9));
  assert.equal(p.lives, 4, "not yet 4 hours");
  lives.applyRegen(p, at(4));
  assert.equal(p.lives, 5, "one heart after 4 hours");
  lives.applyRegen(p, at(8.5));
  assert.equal(p.lives, 6, "another after 8 hours, and the leftover half hour is kept");
  lives.applyRegen(p, at(100));
  assert.equal(p.lives, 7, "never more than 7");
  assert.equal(p.livesClockAt, null, "the clock stops when full");
});

test("rules: the countdown to the next heart is exact", () => {
  const p = fresh();
  lives.loseLife(p, t0);
  const info = lives.livesInfo(p, true, at(1));
  assert.equal(info.lives, 6);
  assert.equal(info.nextHeartAt, at(4).toISOString());
});

test("rules: a finished module refills to 7", () => {
  const p = { ...fresh(), lives: 2, livesClockAt: t0 };
  lives.refill(p, at(1));
  assert.equal(p.lives, 7);
  assert.equal(p.livesClockAt, null);
});

test("rules: Child/Parent accounts see no lives at all", () => {
  assert.deepEqual(lives.livesInfo(fresh(), false), { enabled: false });
});

// ---------------------------------------------------------------------
// 2. Through the API, with a real database
// ---------------------------------------------------------------------
let server;
let base;
let dbReady = false;

test.before(async () => {
  try {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 3000 });
    dbReady = true;
  } catch {
    return;
  }
  await mongoose.connection.db.dropDatabase();
  const { seedContent, seedUsers } = require("../scripts/seed");
  await seedContent();
  await require("../services/contentIndex").loadContentIndex();
  await seedUsers({ reset: true });
  const app = require("../app");
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

test.after(async () => {
  server?.close();
  if (dbReady) await mongoose.disconnect();
});

async function call(method, url, { body, token } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}
const login = async (email, role, password = "demo123") =>
  (await call("POST", "/auth/login", { body: { email, password, role } })).body.token;
// No database: skip, unless REQUIRE_DB=1 (CI, final checks), then FAIL.
const it = (name, fn) =>
  test(name, async (t) => {
    if (dbReady) return fn(t);
    if (process.env.REQUIRE_DB === "1") throw new Error(`No database at ${TEST_URI} (REQUIRE_DB=1)`);
    return t.skip("no database");
  });

it("a Normal learner starts with 7 lives", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  const res = await call("GET", "/progress/me", { token });
  assert.equal(res.status, 200);
  assert.deepEqual(
    { enabled: res.body.data.livesInfo.enabled, lives: res.body.data.livesInfo.lives, max: res.body.data.livesInfo.max },
    { enabled: true, lives: 7, max: 7 },
  );
});

it("Child/Parent accounts have no lives and cannot lose one", async () => {
  const token = await login("family@demo.com", "CombinedChildParent");
  const res = await call("GET", "/progress/me", { token });
  assert.equal(res.body.data.livesInfo.enabled, false);
  assert.equal((await call("POST", "/progress/lives/lose", { token, body: { reason: "wrong" } })).status, 403);
});

it("wrong answers and hints each cost a heart, down to 0, then 409", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  let last;
  for (let i = 0; i < 7; i += 1) {
    last = await call("POST", "/progress/lives/lose", { token, body: { reason: i % 2 ? "hint" : "wrong" } });
    assert.equal(last.status, 200);
  }
  assert.equal(last.body.data.livesInfo.lives, 0);
  assert.ok(last.body.data.livesInfo.nextHeartAt, "a countdown to the next heart");

  const empty = await call("POST", "/progress/lives/lose", { token, body: { reason: "wrong" } });
  assert.equal(empty.status, 409);
  assert.match(empty.body.error, /No lives left/);
});

it("an unknown reason is refused", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  assert.equal((await call("POST", "/progress/lives/lose", { token, body: { reason: "cheat" } })).status, 400);
});

it("the browser cannot set lives through PATCH", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  const res = await call("PATCH", "/progress/me", { token, body: { lives: 7, xp: 10 } });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.livesInfo.lives, 0, "still 0: lives are not a client field");
});

it("a review only earns a heart for a lesson you already finished", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  const notDone = await call("POST", "/progress/lives/earn", { token, body: { lessonId: "l1-1-l1" } });
  assert.equal(notDone.status, 400);
  assert.match(notDone.body.error, /already finished/);
});

it("finishing a module quest refills the hearts to 7", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  const res = await call("PATCH", "/progress/me", { token, body: { masteredModules: ["l1-1"], xp: 110 } });
  assert.equal(res.body.data.livesInfo.lives, 7);
});

it("a finished lesson in review earns +1, once per lesson per day", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  // finish two lessons first (any finished lesson can be reviewed)
  await call("PATCH", "/progress/me", { token, body: { completedLessons: ["l1-1-l2", "l1-1-l3"] } });
  await call("POST", "/progress/lives/lose", { token, body: { reason: "wrong" } }); // 6
  const first = await call("POST", "/progress/lives/earn", { token, body: { lessonId: "l1-1-l2" } });
  assert.equal(first.status, 200);
  assert.equal(first.body.data.livesInfo.lives, 7);

  await call("POST", "/progress/lives/lose", { token, body: { reason: "wrong" } }); // 6
  const again = await call("POST", "/progress/lives/earn", { token, body: { lessonId: "l1-1-l2" } });
  assert.equal(again.status, 409, "the same lesson cannot be farmed");
  const other = await call("POST", "/progress/lives/earn", { token, body: { lessonId: "l1-1-l3" } });
  assert.equal(other.status, 200, "a different finished lesson still works");
});

it("progress from two devices is merged, never lost", async () => {
  const token = await login("family@demo.com", "CombinedChildParent");
  await call("PATCH", "/progress/me", { token, body: { completedLessons: ["l1-1-l1"], rhythmDays: ["2026-09-20"], xp: 20 } });
  const res = await call("PATCH", "/progress/me", {
    token,
    body: { completedLessons: ["l1-1-l2"], rhythmDays: ["2026-09-21"], xp: 15, lastLesson: { trackId: "language", lessonId: "l1-1-l2" } },
  });
  assert.deepEqual(res.body.data.completedLessons.sort(), ["l1-1-l1", "l1-1-l2"]);
  assert.deepEqual(res.body.data.rhythmDays.sort(), ["2026-09-20", "2026-09-21"]);
  assert.equal(res.body.data.xp, 40, "XP is worked out by the server: 2 lessons x 20");
  assert.equal(res.body.data.lastLesson.lessonId, "l1-1-l2");
});

it("made-up lessons, modules and huge payloads are ignored", async () => {
  const token = await login("family@demo.com", "CombinedChildParent");
  const before = (await call("GET", "/progress/me", { token })).body.data;

  const cheat = await call("PATCH", "/progress/me", {
    token,
    body: {
      completedLessons: ["not-a-lesson", "l9-9-l9", ...Array.from({ length: 500 }, (_, i) => `fake-${i}`)],
      masteredModules: ["not-a-module"],
      rhythmDays: ["yesterday"],
      xp: 999999,
    },
  });
  assert.equal(cheat.status, 200);
  assert.deepEqual(cheat.body.data.completedLessons, before.completedLessons, "no invented lessons are stored");
  assert.deepEqual(cheat.body.data.masteredModules, before.masteredModules);
  assert.equal(cheat.body.data.rhythmDays.includes("yesterday"), false);
  assert.equal(cheat.body.data.xp, before.xp, "XP cannot be set from the browser");
});

it("only a few real lessons may be added per request", async () => {
  // A separate account, so this bulk write does not disturb other tests.
  await call("POST", "/auth/signup", { body: { name: "Bulk", email: "bulk@x.com", password: "secret1", role: "NormalUser" } });
  const token = await login("bulk@x.com", "NormalUser", "secret1");
  const many = (await call("GET", "/tracks/nepali-language", { token })).body.data;
  const ids = many.chapters.flatMap((c) => c.moduleIds).slice(0, 30).map((m) => `${m}-l1`);
  const res = await call("PATCH", "/progress/me", { token, body: { completedLessons: ids } });
  assert.ok(res.body.data.completedLessons.length <= 22, "at most 20 added in one request");
});

it("progress that is not a list is refused", async () => {
  const token = await login("family@demo.com", "CombinedChildParent");
  assert.equal((await call("PATCH", "/progress/me", { token, body: { completedLessons: "l1-1-l1" } })).status, 400);
  // xp in the body is simply ignored now (the server works it out), so it is not an error.
  assert.equal((await call("PATCH", "/progress/me", { token, body: { xp: -5 } })).status, 200);
});

it("the track list now counts completed lessons", async () => {
  const token = await login("family@demo.com", "CombinedChildParent");
  const res = await call("GET", "/tracks", { token });
  const language = res.body.data.find((t) => t.id === "nepali-language");
  assert.equal(language.completedLessons, 2);
});

it("teachers have no learner progress", async () => {
  const token = await login("teacher@demo.com", "Teacher");
  assert.equal((await call("GET", "/progress/me", { token })).status, 403);
});
