// =====================================================================
// Step 4 tests: strict pronunciation grading.
//
// Google's servers are replaced by a tiny FAKE Gemini running on this
// computer, so we can test every situation: a good answer, an answer in
// code fences, garbage, a made-up verdict, an error, and a timeout.
// =====================================================================
const http = require("http");

// Settings must be in place before the app is loaded.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-0123456789abcdef0123456789";
process.env.LOG_REQUESTS = "0";
process.env.AUTH_RATE_LIMIT = "1000";
process.env.PRONUNCIATION_RATE_LIMIT = "1000";
process.env.BCRYPT_ROUNDS = "4";
process.env.GEMINI_API_KEY = "fake-key-for-tests";
process.env.GEMINI_TIMEOUT_MS = "400";

const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const TEST_URI = process.env.MONGODB_URI_TEST || "mongodb://127.0.0.1:27017/rootbridge_test";

// ---------------------------------------------------------------------
// The fake Gemini. `mode` decides how it answers the next request.
// ---------------------------------------------------------------------
let mode = "good";
let lastRequest = null;
const coachAnswer = {
  verdict: "needs_work",
  score: 38,
  matchedSounds: ["n", "a", "m", "a", "s"],
  mismatchedSounds: ["final -te replaced by -kar"],
  feedback: "You said “namaskar”. End with “-te”: na-mas-TE, and stress the last syllable.",
  encouragement: "Good start — the first two syllables were right.",
};
const fake = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    lastRequest = { url: req.url, body: JSON.parse(body || "{}") };
    const reply = (text, status = 200) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }));
    };
    if (mode === "good") return reply(JSON.stringify(coachAnswer));
    if (mode === "fenced") return reply("```json\n" + JSON.stringify({ ...coachAnswer, verdict: "close", score: 72 }) + "\n```");
    if (mode === "garbage") return reply("Sure! The learner did well, I think.");
    if (mode === "bad-verdict") return reply(JSON.stringify({ ...coachAnswer, verdict: "perfect" }));
    if (mode === "error") return reply("", 500);
    if (mode === "slow") return setTimeout(() => reply(JSON.stringify(coachAnswer)), 1500);
    return reply("{}");
  });
});

let server;
let base;
let dbReady = false;

test.before(async () => {
  await new Promise((r) => fake.listen(0, "127.0.0.1", r));
  process.env.GEMINI_BASE_URL = `http://127.0.0.1:${fake.address().port}`;
  try {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 3000 });
    dbReady = true;
  } catch {
    return;
  }
  await mongoose.connection.db.dropDatabase();
  const { seedUsers } = require("../scripts/seed");
  await seedUsers({ reset: true });
  const app = require("../app");
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

test.after(async () => {
  fake.close();
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
const login = async (email, role) =>
  (await call("POST", "/auth/login", { body: { email, password: "demo123", role } })).body.token;
// No database: skip, unless REQUIRE_DB=1 (CI, final checks), then FAIL.
const it = (name, fn) =>
  test(name, async (t) => {
    if (dbReady) return fn(t);
    if (process.env.REQUIRE_DB === "1") throw new Error(`No database at ${TEST_URI} (REQUIRE_DB=1)`);
    return t.skip("no database");
  });

const attempt = (text, confidence = 0.9, extra = {}) => ({
  language: "nepali",
  targetNative: "नमस्ते",
  targetRomanization: "namaste",
  targetMeaning: "hello / respectful greeting",
  transcripts: [{ text, confidence }],
  attemptNumber: 1,
  ...extra,
});

// ---------------------------------------------------------------------
// 1. The local check on its own (used when the coach is unavailable)
// ---------------------------------------------------------------------
const { localGrade } = require("../services/pronunciation");

test("local: the exact word is spot_on", () => {
  assert.equal(localGrade(attempt("नमस्ते")).verdict, "spot_on");
});

test("local: the romanised word counts too, accents ignored", () => {
  assert.equal(localGrade(attempt("Namaste")).verdict, "spot_on");
  assert.equal(localGrade({ ...attempt("namaskar"), targetNative: "नमस्कार", targetRomanization: "namaskār" }).verdict, "spot_on");
});

test("local: a different real word is needs_work (Sprint 2 was too kind here)", () => {
  const r = localGrade(attempt("नमस्कार"));
  assert.equal(r.verdict, "needs_work");
  assert.match(r.feedback, /नमस्ते/, "the model answer is shown");
});

test("local: short words need an exact match", () => {
  // Sprint 2 accepted one wrong letter even in a 2-letter word.
  const r = localGrade({ ...attempt("का", 0.99), targetNative: "के", targetRomanization: "ke" });
  assert.notEqual(r.verdict, "spot_on");
});

test("local: one letter off needs a confident recogniser for longer words", () => {
  const long = { targetNative: "धन्यवाद", targetRomanization: "dhanyavād" };
  assert.equal(localGrade({ ...attempt("धन्यवाड", 0.9), ...long }).verdict, "spot_on", "confident: fine");
  assert.equal(localGrade({ ...attempt("धन्यवाड", 0.4), ...long }).verdict, "close", "unsure: only close");
});

test("local: nothing heard is unclear", () => {
  assert.equal(localGrade({ ...attempt(""), transcripts: [] }).verdict, "unclear");
});

test("local: fallback feedback says so, honestly", () => {
  assert.match(localGrade(attempt("xyz")).feedback, /couldn't reach the pronunciation coach/);
});

// ---------------------------------------------------------------------
// 2. Through the API, with the fake coach
// ---------------------------------------------------------------------
it("the coach's verdict and tip come back, marked as from the coach", async () => {
  mode = "good";
  const token = await login("learner@demo.com", "NormalUser");
  const res = await call("POST", "/pronunciation/grade", { token, body: attempt("नमस्कार") });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.source, "coach");
  assert.equal(res.body.data.verdict, "needs_work");
  assert.match(res.body.data.feedback, /na-mas-TE/);
});

it("the strict system prompt and the attempt are what Gemini receives", async () => {
  mode = "good";
  const token = await login("learner@demo.com", "NormalUser");
  await call("POST", "/pronunciation/grade", { token, body: attempt("नमस्कार", 0.82, { attemptNumber: 2 }) });
  const system = lastRequest.body.systemInstruction.parts[0].text;
  assert.match(system, /strict, expert pronunciation coach for learners of Nepali/);
  assert.match(system, /Respond with ONLY valid JSON/);
  const sent = JSON.parse(lastRequest.body.contents[0].parts[0].text);
  assert.equal(sent.attemptNumber, 2, "later attempts are marked, so the tip varies");
  assert.equal(sent.transcripts[0].confidence, 0.82);
  assert.equal(lastRequest.body.generationConfig.responseMimeType, "application/json");
});

it("an answer wrapped in ```json fences is still read", async () => {
  mode = "fenced";
  const token = await login("learner@demo.com", "NormalUser");
  const res = await call("POST", "/pronunciation/grade", { token, body: attempt("नमस्ते") });
  assert.equal(res.body.data.source, "coach");
  assert.equal(res.body.data.verdict, "close");
});

for (const [label, m] of [
  ["garbage text", "garbage"],
  ["a made-up verdict", "bad-verdict"],
  ["a server error", "error"],
  ["no answer within 4 seconds", "slow"],
]) {
  it(`${label} falls back to the local check without breaking the lesson`, async () => {
    mode = m;
    const token = await login("learner@demo.com", "NormalUser");
    const started = Date.now();
    const res = await call("POST", "/pronunciation/grade", { token, body: attempt("नमस्ते") });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.source, "local");
    assert.equal(res.body.data.verdict, "spot_on", "the local check still grades it");
    if (m === "slow") assert.ok(Date.now() - started < 1400, "we did not wait for the slow coach");
  });
}

it("bad requests are refused", async () => {
  const token = await login("learner@demo.com", "NormalUser");
  assert.equal((await call("POST", "/pronunciation/grade", { token, body: { ...attempt("x"), language: "klingon" } })).status, 400);
  assert.equal((await call("POST", "/pronunciation/grade", { token, body: { ...attempt("x"), transcripts: "nope" } })).status, 400);
  assert.equal((await call("POST", "/pronunciation/grade", { token, body: { ...attempt("x"), targetNative: "" } })).status, 400);
});

it("only learners can use it", async () => {
  assert.equal((await call("POST", "/pronunciation/grade", { body: attempt("x") })).status, 401);
  const teacher = await login("teacher@demo.com", "Teacher");
  assert.equal((await call("POST", "/pronunciation/grade", { token: teacher, body: attempt("x") })).status, 403);
});
