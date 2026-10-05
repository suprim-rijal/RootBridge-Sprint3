// =====================================================================
// Step 5 tests: four languages in the database, and the Language Hub.
// =====================================================================
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-0123456789abcdef0123456789";
process.env.LOG_REQUESTS = "0";
process.env.AUTH_RATE_LIMIT = "1000";
process.env.BCRYPT_ROUNDS = "4";

const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const TEST_URI = process.env.MONGODB_URI_TEST || "mongodb://127.0.0.1:27017/rootbridge_test";
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

const EXPECTED = {
  nepali: { language: 192, culture: 176 },
  finnish: { language: 36, culture: 20 },
  japanese: { language: 36, culture: 20 },
  twi: { language: 36, culture: 20 },
};

it("every language has a language track and a culture track, with lessons", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  for (const [language, counts] of Object.entries(EXPECTED)) {
    const res = await call("GET", `/tracks?language=${language}`, { token });
    assert.equal(res.status, 200, language);
    const byKind = Object.fromEntries(res.body.data.map((t) => [t.id.replace(`${language}-`, ""), t.totalLessons]));
    assert.deepEqual(byKind, counts, `${language} lesson counts`);
    assert.ok(res.body.data.every((t) => t.language === language));
  }
});

it("a new language's track, module and lesson load like Nepali ones", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  const track = (await call("GET", "/tracks/japanese-language", { token })).body.data;
  assert.equal(track.chapters.length, 3);
  assert.ok(track.chapters[0].moduleIds.includes("ja-l1-3"));

  const mod = (await call("GET", "/modules/ja-l1-3", { token })).body.data;
  assert.equal(mod.language, "japanese");
  assert.ok(mod.items.some((i) => i.np === "おばあさん" && i.rom === "obāsan"));

  const lesson = (await call("GET", "/lessons/tw-l1-1-l1", { token })).body.data;
  assert.equal(lesson.moduleId, "tw-l1-1");
  assert.ok(lesson.prompts.length >= 3);
  for (const p of lesson.prompts) assert.equal(p.options[p.correctAnswer] !== undefined, true);
});

it("the track list follows the learner's own language by default", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  await call("POST", "/users/update", { token, body: { details: { onboarding: { language: "finnish", completed: true } } } });
  const res = await call("GET", "/tracks", { token });
  assert.deepEqual(res.body.data.map((t) => t.id).sort(), ["finnish-culture", "finnish-language"]);
});

it("a new signup has NO language yet, so the Language Hub is shown", async () => {
  const res = await call("POST", "/auth/signup", {
    body: { name: "New Learner", email: "hub@example.com", password: "secret1", role: "NormalUser" },
  });
  assert.equal(res.body.user.details.onboarding.language, null);
  assert.equal(res.body.user.details.onboarding.completed, false);
});

it("choosing a language saves it; an unknown language is refused", async () => {
  const token = await login("hub@example.com", "NormalUser", "secret1");
  const ok = await call("POST", "/users/update", { token, body: { details: { onboarding: { language: "twi", completed: false } } } });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.user.details.onboarding.language, "twi");
  const bad = await call("POST", "/users/update", { token, body: { details: { onboarding: { language: "klingon", completed: false } } } });
  assert.equal(bad.status, 400);
});

it("the demo accounts already have a language, so they skip the hub", async () => {
  const token = await login("family@demo.com", "CombinedChildParent");
  const me = await call("GET", "/auth/me", { token });
  assert.equal(me.body.user.details.onboarding.language, "nepali");
});
