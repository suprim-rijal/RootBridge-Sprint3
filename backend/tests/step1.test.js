// =====================================================================
// Step 1 tests: real MongoDB, bcrypt, JWT, same JSON as Sprint 2.
//
// These use a REAL database (a separate one called rootbridge_test), so
// they catch the problems a fake database would hide.
//   Local MongoDB:  just run  npm test
//   Atlas:          set MONGODB_URI_TEST to a test database first
// If no database is reachable the tests are skipped, not failed.
// =====================================================================
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-0123456789abcdef0123456789";
process.env.LOG_REQUESTS = "0";
process.env.AUTH_RATE_LIMIT = "1000";
process.env.BCRYPT_ROUNDS = "4";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { pathToFileURL } = require("url");
const mongoose = require("mongoose");

const TEST_URI = process.env.MONGODB_URI_TEST || "mongodb://127.0.0.1:27017/rootbridge_test";

let app;
let server;
let base;
let dbReady = false;

test.before(async () => {
  try {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 3000 });
    dbReady = true;
  } catch {
    console.warn(`No database at ${TEST_URI}; skipping database tests.`);
    return;
  }
  await mongoose.connection.db.dropDatabase();

  const { seedContent, seedUsers } = require("../scripts/seed");
  await seedContent();
  await require("../services/contentIndex").loadContentIndex();
  await seedUsers({ reset: true });

  app = require("../app");
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

test.after(async () => {
  server?.close();
  if (dbReady) await mongoose.disconnect();
});

// Small helper: call the API, return { status, body }.
async function call(method, url, { body, token } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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

// ---------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------
it("health reports a connected database", async () => {
  const res = await call("GET", "/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.database, "connected");
});

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------
it("signup stores a bcrypt hash, never the password", async () => {
  const res = await call("POST", "/auth/signup", {
    body: { name: "Ana Rai", email: "Ana@Example.com", password: "secret1", role: "NormalUser" },
  });
  assert.equal(res.status, 201);
  assert.ok(res.body.token, "a token comes back");
  assert.equal(res.body.user.email, "ana@example.com");
  assert.equal(res.body.user.password, undefined, "the password never leaves the server");

  const raw = await mongoose.connection.db.collection("users").findOne({ email: "ana@example.com" });
  assert.match(raw.password, /^\$2[aby]\$/, "stored as a bcrypt hash");
  assert.notEqual(raw.password, "secret1");
});

it("a wrong password FAILS to log in (it did not in Sprint 2)", async () => {
  const res = await call("POST", "/auth/login", {
    body: { email: "learner@demo.com", password: "not-the-password", role: "NormalUser" },
  });
  assert.equal(res.status, 401);
});

it("unknown email and wrong password give the same message", async () => {
  const wrong = await call("POST", "/auth/login", { body: { email: "learner@demo.com", password: "nope", role: "NormalUser" } });
  const ghost = await call("POST", "/auth/login", { body: { email: "ghost@x.com", password: "nope", role: "NormalUser" } });
  assert.equal(wrong.body.error, ghost.body.error);
});

it("the wrong role is refused with 403 after a correct password", async () => {
  const res = await call("POST", "/auth/login", { body: { email: "learner@demo.com", password: "demo123", role: "Teacher" } });
  assert.equal(res.status, 403);
  assert.match(res.body.error, /registered as "Normal"/);
});

it("the Admin role no longer exists", async () => {
  const res = await call("POST", "/auth/signup", {
    body: { name: "X", email: "adm@x.com", password: "secret1", role: "Admin" },
  });
  assert.equal(res.status, 400);
});

it("a Child/Parent signup needs the child's name", async () => {
  const res = await call("POST", "/auth/signup", {
    body: { name: "Maya", email: "m1@x.com", password: "secret1", role: "CombinedChildParent" },
  });
  assert.equal(res.status, 400);
});

it("the same email cannot sign up twice, whatever the capitals", async () => {
  const res = await call("POST", "/auth/signup", {
    body: { name: "Copy", email: "ANA@example.com", password: "secret1", role: "NormalUser" },
  });
  assert.equal(res.status, 409);
  assert.match(res.body.error, /already has an account/);
});

it("GET /auth/me rebuilds the session from the token", async () => {
  const token = await login("family@demo.com", "CombinedChildParent");
  const res = await call("GET", "/auth/me", { token });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, "family@demo.com");
  assert.equal(res.body.user.details.parentSettings.childName, "Aarav");
  assert.equal(res.body.user.details.onboarding.completed, true);
});

it("a missing or broken token is refused", async () => {
  assert.equal((await call("GET", "/auth/me")).status, 401);
  assert.equal((await call("GET", "/auth/me", { token: "abc.def.ghi" })).status, 401);
});

// ---------------------------------------------------------------------
// Users + PIN
// ---------------------------------------------------------------------
it("the PIN is hashed and never sent back", async () => {
  const token = await login("family@demo.com", "CombinedChildParent");
  const res = await call("POST", "/users/update", {
    token,
    body: {
      details: {
        parentSettings: {
          childName: "Aarav",
          dailyMinutes: 20,
          weeklyGoalDays: 4,
          allowedTracks: { language: true, culture: true },
          allowSpeaking: true,
          requirePin: true,
          pin: "4321",
        },
      },
    },
  });
  assert.equal(res.status, 200);
  const settings = res.body.user.details.parentSettings;
  assert.equal(settings.hasPin, true);
  assert.equal(settings.pin, undefined, "the PIN is never returned");
  assert.equal(settings.pinHash, undefined, "nor its hash");

  assert.equal((await call("POST", "/users/verify-pin", { token, body: { pin: "0000" } })).status, 401);
  assert.equal((await call("POST", "/users/verify-pin", { token, body: { pin: "4321" } })).status, 200);
});

it("login and /auth/me also report hasPin (not only the save response)", async () => {
  const token = await login("family@demo.com", "CombinedChildParent");
  const me = await call("GET", "/auth/me", { token });
  assert.equal(me.body.user.details.parentSettings.hasPin, true);
  const again = await call("POST", "/auth/login", {
    body: { email: "family@demo.com", password: "demo123", role: "CombinedChildParent" },
  });
  assert.equal(again.body.user.details.parentSettings.hasPin, true);
});

it("changing ANY other detail keeps the PIN (the language, a photo, the name)", async () => {
  const token = await login("family@demo.com", "CombinedChildParent");
  // The PIN hash is hidden from normal queries; saving other details used
  // to write it away, so the right PIN was then refused.
  await call("POST", "/users/update", { token, body: { details: { onboarding: { language: "finnish", completed: true } } } });
  assert.equal((await call("POST", "/users/verify-pin", { token, body: { pin: "4321" } })).status, 200, "after a language change");

  await call("POST", "/users/update", { token, body: { name: "Sita S." } });
  assert.equal((await call("POST", "/users/verify-pin", { token, body: { pin: "4321" } })).status, 200, "after a name change");

  await call("POST", "/users/update", { token, body: { details: { avatar: null } } });
  assert.equal((await call("POST", "/users/verify-pin", { token, body: { pin: "4321" } })).status, 200, "after a photo change");

  const me = await call("GET", "/auth/me", { token });
  assert.equal(me.body.user.details.parentSettings.hasPin, true, "and it still says a PIN is set");
  // put it back for the tests that follow
  await call("POST", "/users/update", {
    token,
    body: { name: "Sita Sharma", details: { onboarding: { language: "nepali", completed: true } } },
  });
});

it("changing other settings keeps the PIN", async () => {
  const token = await login("family@demo.com", "CombinedChildParent");
  await call("POST", "/users/update", {
    token,
    body: { details: { parentSettings: { childName: "Aarav", dailyMinutes: 30, requirePin: true } } },
  });
  assert.equal((await call("POST", "/users/verify-pin", { token, body: { pin: "4321" } })).status, 200);
});

it("a forgotten PIN can be reset with the account password", async () => {
  const token = await login("family@demo.com", "CombinedChildParent");
  // a wrong password changes nothing
  const wrong = await call("POST", "/users/pin/reset", { token, body: { password: "not-my-password", newPin: "1111" } });
  assert.equal(wrong.status, 401);
  assert.equal((await call("POST", "/users/verify-pin", { token, body: { pin: "4321" } })).status, 200, "the old PIN still works");

  // the right password sets a new one
  const set = await call("POST", "/users/pin/reset", { token, body: { password: "demo123", newPin: "8765" } });
  assert.equal(set.status, 200);
  assert.equal(set.body.user.details.parentSettings.hasPin, true);
  assert.equal((await call("POST", "/users/verify-pin", { token, body: { pin: "4321" } })).status, 401, "the old PIN is gone");
  assert.equal((await call("POST", "/users/verify-pin", { token, body: { pin: "8765" } })).status, 200);
});

it("the PIN can also be removed completely", async () => {
  const token = await login("family@demo.com", "CombinedChildParent");
  const res = await call("POST", "/users/pin/reset", { token, body: { password: "demo123" } });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.details.parentSettings.hasPin, false);
  assert.equal(res.body.user.details.parentSettings.requirePin, false, "and the lock is switched off");
  assert.match(res.body.message, /removed/);
  // put it back for the tests that follow
  await call("POST", "/users/pin/reset", { token, body: { password: "demo123", newPin: "4321" } });
});

it("a Normal learner has no PIN to reset", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  assert.equal((await call("POST", "/users/pin/reset", { token, body: { password: "demo123" } })).status, 403);
});

it("you cannot change someone else's account", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  const res = await call("POST", "/users/update", { token, body: { userId: "507f1f77bcf86cd799439011", name: "Hacker" } });
  assert.equal(res.status, 403);
});

// ---------------------------------------------------------------------
// Courses: all content, same JSON as Sprint 2
// ---------------------------------------------------------------------
it("all 368 Nepali lessons are in the database", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  const res = await call("GET", "/tracks", { token });
  assert.equal(res.status, 200);
  const byId = Object.fromEntries(res.body.data.map((t) => [t.id, t.totalLessons]));
  assert.deepEqual(byId, { "nepali-language": 192, "nepali-culture": 176 });
});

it("seeding again keeps exactly the same content (no duplicates, nothing stale)", async () => {
  const { seedContent } = require("../scripts/seed");
  await seedContent();
  await seedContent();
  const db = mongoose.connection.db;
  // 4 languages since Step 5: Nepali 92 modules + 3 x 14
  assert.equal(await db.collection("modules").countDocuments(), 134);
  assert.equal(await db.collection("chapters").countDocuments(), 37);
  assert.equal(await db.collection("tracks").countDocuments(), 8);
});

it("lesson JSON is identical to the Sprint 2 mock, for every lesson", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  const curriculum = await import(pathToFileURL(path.join(__dirname, "../../frontend/src/data/curriculum.js")).href);
  const { buildLessonPayload } = require("../utils/lessonPayload");

  let checked = 0;
  for (const mod of curriculum.allModules) {
    const lesson = mod.lessons[0];
    const res = await call("GET", `/lessons/${lesson.id}`, { token });
    assert.equal(res.status, 200, lesson.id);
    assert.deepEqual(res.body.data, buildLessonPayload(mod, lesson), `${lesson.id} differs from Sprint 2`);
    checked += 1;
  }
  assert.equal(checked, 134, "all modules of all four languages"); // 92 Nepali since Sprint 2, + 42 new
});

it("track, module and lesson shapes match Sprint 2", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  const track = (await call("GET", "/tracks/language", { token })).body.data; // short id still works
  assert.equal(track.id, "nepali-language");
  assert.ok(track.chapters[0].moduleIds.includes("l1-1"));

  const mod = (await call("GET", "/modules/l1-1", { token })).body.data;
  for (const key of ["id", "code", "title", "goal", "items", "lessons", "skills", "mechanics", "testTasks", "note"]) {
    assert.ok(key in mod, `module has ${key}`);
  }
  assert.equal(mod._id, undefined, "no Mongo internals leak out");
  assert.deepEqual(Object.keys(mod.items[0]).sort(), ["en", "note", "np", "rom"]);
});

it("teachers cannot open learner content", async () => {
  const token = await login("teacher@demo.com", "Teacher");
  assert.equal((await call("GET", "/tracks", { token })).status, 403);
});

it("a wrong CLIENT_ORIGIN can never blank the website", async () => {
  // Browsers sometimes send an Origin header for same-site requests. If
  // that blocked static files, the whole site would go blank when
  // CLIENT_ORIGIN is set slightly wrong on the hosting service.
  const host = new URL(base).host;
  const page = await fetch(base.replace("/api", "/"), { headers: { Origin: `http://${host}` } });
  assert.notEqual(page.status, 403, "the website itself is always served");

  // Same-origin API calls are fine too...
  const health = await fetch(`${base}/health`, { headers: { Origin: `http://${host}` } });
  assert.equal(health.status, 200);

  // ...but another website still cannot call the API from a browser.
  const stranger = await fetch(`${base}/health`, { headers: { Origin: "http://evil.example.com" } });
  assert.equal(stranger.status, 403);
});

it("broken JSON and unknown routes get clean errors", async () => {
  const res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"email": "broken',
  });
  assert.equal(res.status, 400);
  assert.equal((await call("GET", "/nope")).status, 404);
});
