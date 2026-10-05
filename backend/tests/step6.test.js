// =====================================================================
// Step 6 tests: teacher classes, join codes, live link, homework,
// materials (real file uploads), and who may see what.
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

async function call(method, url, { body, token, form } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: { ...(form ? {} : { "Content-Type": "application/json" }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  const type = res.headers.get("content-type") || "";
  return { status: res.status, body: type.includes("json") ? await res.json() : await res.text(), headers: res.headers };
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

const state = {};

it("a teacher creates a class and gets a 6-digit code", async () => {
  state.teacher = await login("teacher@demo.com", "Teacher");
  const res = await call("POST", "/groups", {
    token: state.teacher,
    body: { name: "Saturday Nepali", meets: "Saturdays, 10:00", language: "nepali", liveClassUrl: "https://zoom.us/j/123456789" },
  });
  assert.equal(res.status, 201);
  assert.match(res.body.data.code, /^\d{6}$/);
  assert.equal(res.body.data.liveClassUrl, "https://zoom.us/j/123456789");
  state.group = res.body.data;
});

it("learners cannot create classes, teachers cannot join them", async () => {
  state.learner = await login("learner@demo.com", "NormalUser");
  assert.equal((await call("POST", "/groups", { token: state.learner, body: { name: "x" } })).status, 403);
  assert.equal((await call("POST", "/groups/join", { token: state.teacher, body: { code: state.group.code } })).status, 403);
});

it("only real https links are accepted for the live class", async () => {
  for (const bad of ["javascript:alert(1)", "http://zoom.us/j/1", "zoom.us/j/1"]) {
    const res = await call("PATCH", `/groups/${state.group.id}`, { token: state.teacher, body: { liveClassUrl: bad } });
    assert.equal(res.status, 400, bad);
  }
});

it("a Normal learner joins with the code; the Sprint 2 class shape is kept", async () => {
  const res = await call("POST", "/groups/join", { token: state.learner, body: { code: state.group.code } });
  assert.equal(res.status, 200);
  const entry = res.body.user.details.classes[0];
  assert.equal(entry.code, state.group.code);
  assert.equal(entry.name, "Saturday Nepali");
  assert.equal(entry.teacher, "Hari Gurung");
  assert.equal(entry.meets, "Saturdays, 10:00");
  assert.ok(entry.joinedAt);
});

it("joining twice, a wrong code, or a malformed code is refused", async () => {
  assert.equal((await call("POST", "/groups/join", { token: state.learner, body: { code: state.group.code } })).status, 409);
  assert.equal((await call("POST", "/groups/join", { token: state.learner, body: { code: "000000" } })).status, 404);
  assert.equal((await call("POST", "/groups/join", { token: state.learner, body: { code: "12ab" } })).status, 400);
});

it("the teacher sees each student's real progress; a family shows the child's name", async () => {
  state.family = await login("family@demo.com", "CombinedChildParent");
  await call("POST", "/groups/join", { token: state.family, body: { code: state.group.code } });
  await call("PATCH", "/progress/me", {
    token: state.family,
    body: { completedLessons: ["l1-1-l1", "l1-1-l2"], masteredModules: [], xp: 40, rhythmDays: ["2026-09-21"] },
  });

  const res = await call("GET", `/groups/${state.group.id}`, { token: state.teacher });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.memberCount, 2);
  const aarav = res.body.data.students.find((s) => s.name === "Aarav");
  assert.ok(aarav, "the family account is listed under the child's name");
  assert.equal(aarav.account, "Sita Sharma");
  assert.equal(aarav.lessonsDone, 2);
  assert.equal(aarav.xp, 40);
  assert.equal(aarav.lastActive, "2026-09-21");
});

it("another teacher cannot see or change this class", async () => {
  await call("POST", "/auth/signup", { body: { name: "Other Teacher", email: "other@t.com", password: "secret1", role: "Teacher" } });
  const other = await login("other@t.com", "Teacher", "secret1");
  assert.equal((await call("GET", `/groups/${state.group.id}`, { token: other })).status, 403);
  assert.equal((await call("PATCH", `/groups/${state.group.id}`, { token: other, body: { name: "Mine now" } })).status, 403);
  assert.equal((await call("GET", "/groups", { token: other })).body.data.length, 0);
});

it("renaming the class updates the students' copy too", async () => {
  await call("PATCH", `/groups/${state.group.id}`, {
    token: state.teacher,
    body: { name: "Saturday Nepali (Beginners)", meets: "Saturdays, 11:00" },
  });
  const me = await call("GET", "/auth/me", { token: state.learner });
  const entry = me.body.user.details.classes.find((c) => c.code === state.group.code);
  assert.equal(entry.name, "Saturday Nepali (Beginners)");
  assert.equal(entry.meets, "Saturdays, 11:00");
});

it("homework: posted by the teacher, marked done when its lessons are finished", async () => {
  const posted = await call("POST", `/groups/${state.group.id}/assignments`, {
    token: state.teacher,
    body: { title: "Greetings practice", instructions: "Do the first two lessons.", dueDate: "2026-10-01", lessonIds: ["l1-1-l1", "l1-1-l2"] },
  });
  assert.equal(posted.status, 201);
  state.assignment = posted.body.data;

  const learnerView = await call("GET", "/groups/mine", { token: state.learner });
  assert.equal(learnerView.body.data[0].assignments[0].done, false, "the learner has not done the lessons");
  const familyView = await call("GET", "/groups/mine", { token: state.family });
  assert.equal(familyView.body.data[0].assignments[0].done, true, "the child finished both lessons");
  assert.equal(familyView.body.data[0].liveClassUrl, "https://zoom.us/j/123456789", "students get the live link");
});

it("materials: a link, and a real file upload that only the class can download", async () => {
  const link = await call("POST", `/groups/${state.group.id}/materials`, {
    token: state.teacher,
    body: { title: "Nepali alphabet video", url: "https://example.com/alphabet" },
  });
  assert.equal(link.status, 201);
  assert.equal(link.body.data.kind, "link");

  const form = new FormData();
  form.append("title", "Greetings worksheet");
  form.append("file", new Blob(["Namaste worksheet"], { type: "text/plain" }), "worksheet.txt");
  const file = await call("POST", `/groups/${state.group.id}/materials`, { token: state.teacher, form });
  assert.equal(file.status, 201);
  assert.equal(file.body.data.fileName, "worksheet.txt");
  assert.equal(file.body.data.fileId, undefined, "the storage id is never shown");
  const stored = await mongoose.connection.db.collection("materials.files").countDocuments();
  assert.equal(stored, 1, "the file is stored in MongoDB (GridFS), so it survives redeploys");
  state.file = file.body.data;

  const byMember = await call("GET", `/materials/${state.file.id}/file`, { token: state.learner });
  assert.equal(byMember.status, 200);
  assert.equal(byMember.body, "Namaste worksheet");
  assert.match(byMember.headers.get("content-disposition"), /worksheet\.txt/);

  const byTeacher = await call("GET", `/materials/${state.file.id}/file`, { token: state.teacher });
  assert.equal(byTeacher.status, 200);

  await call("POST", "/auth/signup", { body: { name: "Stranger", email: "stranger@x.com", password: "secret1", role: "NormalUser" } });
  const stranger = await login("stranger@x.com", "NormalUser", "secret1");
  assert.equal((await call("GET", `/materials/${state.file.id}/file`, { token: stranger })).status, 403, "non-members cannot download");
  assert.equal((await call("GET", `/materials/${state.file.id}/file`)).status, 401, "nobody logged out can");
});

it("unsafe file types are refused", async () => {
  const form = new FormData();
  form.append("title", "Program");
  form.append("file", new Blob(["MZ..."], { type: "application/x-msdownload" }), "virus.exe");
  const res = await call("POST", `/groups/${state.group.id}/materials`, { token: state.teacher, form });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /not allowed/);
});

it("files over 10 MB are refused", async () => {
  const form = new FormData();
  form.append("file", new Blob([Buffer.alloc(10 * 1024 * 1024 + 1)], { type: "application/pdf" }), "big.pdf");
  const res = await call("POST", `/groups/${state.group.id}/materials`, { token: state.teacher, form });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /10 MB/);
});

it("joining and leaving a class keeps the family's PIN", async () => {
  // Saving a user writes their details; the PIN hash is hidden from normal
  // queries, so this checks it is never written away by accident.
  await call("POST", "/users/update", {
    token: state.family,
    body: { details: { parentSettings: { childName: "Aarav", requirePin: true, pin: "1234" } } },
  });
  assert.equal((await call("POST", "/users/verify-pin", { token: state.family, body: { pin: "1234" } })).status, 200);

  await call("POST", "/groups/leave", { token: state.family, body: { code: state.group.code } });
  assert.equal((await call("POST", "/users/verify-pin", { token: state.family, body: { pin: "1234" } })).status, 200, "after leaving");

  await call("POST", "/groups/join", { token: state.family, body: { code: state.group.code } });
  assert.equal((await call("POST", "/users/verify-pin", { token: state.family, body: { pin: "1234" } })).status, 200, "after joining");
});

it("a teacher can remove a student; a learner can leave", async () => {
  const detail = await call("GET", `/groups/${state.group.id}`, { token: state.teacher });
  const priya = detail.body.data.students.find((s) => s.account === "Priya Thapa");
  const removed = await call("DELETE", `/groups/${state.group.id}/members/${priya.id}`, { token: state.teacher });
  assert.equal(removed.status, 200);
  const me = await call("GET", "/auth/me", { token: state.learner });
  assert.equal(me.body.user.details.classes.length, 0, "the class is gone from the student's list");

  const left = await call("POST", "/groups/leave", { token: state.family, body: { code: state.group.code } });
  assert.equal(left.body.user.details.classes.length, 0);
  const after = await call("GET", `/groups/${state.group.id}`, { token: state.teacher });
  assert.equal(after.body.data.memberCount, 0);
});

it("deleting a class removes its homework, materials and stored files", async () => {
  await call("POST", "/groups/join", { token: state.family, body: { code: state.group.code } });
  const res = await call("DELETE", `/groups/${state.group.id}`, { token: state.teacher });
  assert.equal(res.status, 200);
  const db = mongoose.connection.db;
  assert.equal(await db.collection("assignments").countDocuments(), 0);
  assert.equal(await db.collection("materials").countDocuments(), 0);
  assert.equal(await db.collection("materials.files").countDocuments(), 0, "the stored file is deleted too");
  assert.equal(await db.collection("materials.chunks").countDocuments(), 0);
  const me = await call("GET", "/auth/me", { token: state.family });
  assert.equal(me.body.user.details.classes.length, 0);
});
