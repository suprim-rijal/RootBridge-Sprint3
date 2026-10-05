// =====================================================================
// Class directory and join requests: how a learner finds a teacher when
// nobody has given them a 6-digit code.
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
const it = (name, fn) =>
  test(name, async (t) => {
    if (dbReady) return fn(t);
    if (process.env.REQUIRE_DB === "1") throw new Error(`No database at ${TEST_URI} (REQUIRE_DB=1)`);
    return t.skip("no database");
  });

const state = {};

it("a class is private until the teacher lists it", async () => {
  state.teacher = await login("teacher@demo.com", "Teacher");
  state.learner = await login("learner@demo.com", "NormalUser");
  const made = await call("POST", "/groups", {
    token: state.teacher,
    body: { name: "Saturday Nepali", meets: "Saturdays, 10:00", language: "nepali" },
  });
  state.group = made.body.data;
  assert.equal(state.group.discoverable, false, "not listed by default");

  const empty = await call("GET", "/groups/directory", { token: state.learner });
  assert.equal(empty.status, 200);
  assert.equal(empty.body.data.length, 0, "nothing to find yet");
  assert.equal((await call("POST", `/groups/${state.group.id}/requests`, { token: state.learner, body: {} })).status, 404);
});

it("once listed, learners can find it — but never its join code", async () => {
  await call("PATCH", `/groups/${state.group.id}`, {
    token: state.teacher,
    body: { discoverable: true, about: "Beginner Nepali for children, Saturdays in Espoo." },
  });
  const res = await call("GET", "/groups/directory", { token: state.learner });
  assert.equal(res.body.data.length, 1);
  const listed = res.body.data[0];
  assert.equal(listed.name, "Saturday Nepali");
  assert.equal(listed.teacher, "Hari Gurung");
  assert.match(listed.about, /Beginner Nepali/);
  assert.equal(listed.code, undefined, "the join code is never in the directory");
  assert.equal(listed.isMember, false);
  assert.equal(listed.requestStatus, null);
});

it("the directory can be filtered by language", async () => {
  const other = await call("GET", "/groups/directory?language=finnish", { token: state.learner });
  assert.equal(other.body.data.length, 0);
  const same = await call("GET", "/groups/directory?language=nepali", { token: state.learner });
  assert.equal(same.body.data.length, 1);
});

it("a learner asks to join with a short message", async () => {
  const res = await call("POST", `/groups/${state.group.id}/requests`, {
    token: state.learner,
    body: { message: "Hello, I am learning Nepali on my own and would like to join." },
  });
  assert.equal(res.status, 201);
  assert.match(res.body.message, /Hari Gurung/);

  const again = await call("POST", `/groups/${state.group.id}/requests`, { token: state.learner, body: {} });
  assert.equal(again.status, 409, "one live request per class");

  const mine = await call("GET", "/groups/requests/mine", { token: state.learner });
  assert.equal(mine.body.data[0].status, "pending");
  assert.equal(mine.body.data[0].className, "Saturday Nepali");

  const listed = (await call("GET", "/groups/directory", { token: state.learner })).body.data[0];
  assert.equal(listed.requestStatus, "pending", "the learner sees that they already asked");
});

it("the teacher sees the request, with the learner's message", async () => {
  const res = await call("GET", `/groups/${state.group.id}/requests`, { token: state.teacher });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.length, 1);
  state.request = res.body.data[0];
  assert.equal(state.request.name, "Priya Thapa");
  assert.match(state.request.message, /learning Nepali on my own/);
});

it("another teacher cannot see or answer those requests", async () => {
  await call("POST", "/auth/signup", { body: { name: "Other", email: "other2@t.com", password: "secret1", role: "Teacher" } });
  const other = await login("other2@t.com", "Teacher", "secret1");
  assert.equal((await call("GET", `/groups/${state.group.id}/requests`, { token: other })).status, 403);
  assert.equal(
    (await call("POST", `/groups/${state.group.id}/requests/${state.request.id}/approve`, { token: other })).status,
    403,
  );
});

it("approving adds the learner to the class, exactly like the code would", async () => {
  const res = await call("POST", `/groups/${state.group.id}/requests/${state.request.id}/approve`, { token: state.teacher });
  assert.equal(res.status, 200);

  const me = await call("GET", "/auth/me", { token: state.learner });
  const entry = me.body.user.details.classes[0];
  assert.equal(entry.name, "Saturday Nepali");
  assert.equal(entry.teacher, "Hari Gurung");
  assert.equal(entry.code, state.group.code, "and now they have the code too");

  const classes = await call("GET", "/groups/mine", { token: state.learner });
  assert.equal(classes.body.data.length, 1);

  const left = await call("GET", `/groups/${state.group.id}/requests`, { token: state.teacher });
  assert.equal(left.body.data.length, 0, "the request is no longer pending");

  const mine = await call("GET", "/groups/requests/mine", { token: state.learner });
  assert.equal(mine.body.data[0].status, "approved");
});

it("declining says so, with the teacher's note, and adds nobody", async () => {
  const family = await login("family@demo.com", "CombinedChildParent");
  await call("POST", `/groups/${state.group.id}/requests`, { token: family, body: { message: "Can Aarav join?" } });
  const pending = (await call("GET", `/groups/${state.group.id}/requests`, { token: state.teacher })).body.data[0];
  assert.equal(pending.name, "Aarav", "a family shows the child's name");

  const res = await call("POST", `/groups/${state.group.id}/requests/${pending.id}/decline`, {
    token: state.teacher,
    body: { note: "Sorry, this class is full. Try the Sunday one." },
  });
  assert.equal(res.status, 200);

  const mine = await call("GET", "/groups/requests/mine", { token: family });
  assert.equal(mine.body.data[0].status, "declined");
  assert.match(mine.body.data[0].teacherNote, /this class is full/);
  const me = await call("GET", "/auth/me", { token: family });
  assert.equal(me.body.user.details.classes.length, 0, "declining adds nobody");

  // After a decline, they may ask again (perhaps with a better message).
  const retry = await call("POST", `/groups/${state.group.id}/requests`, { token: family, body: { message: "Next term?" } });
  assert.equal(retry.status, 201);
});

it("teachers cannot use the learner side, learners cannot use the teacher side", async () => {
  assert.equal((await call("GET", "/groups/directory", { token: state.teacher })).status, 403);
  assert.equal((await call("GET", "/groups/requests/mine", { token: state.teacher })).status, 403);
  assert.equal((await call("GET", `/groups/${state.group.id}/requests`, { token: state.learner })).status, 403);
});

it("a class whose teacher account is gone is not listed", async () => {
  // Make a class, then delete its teacher's account straight from the
  // database (as "seed --reset" or an account removal would).
  await call("POST", "/auth/signup", { body: { name: "Leaving", email: "leaving@t.com", password: "secret1", role: "Teacher" } });
  const leaving = await login("leaving@t.com", "Teacher", "secret1");
  const made = await call("POST", "/groups", { token: leaving, body: { name: "Orphan class", language: "nepali" } });
  await call("PATCH", `/groups/${made.body.data.id}`, { token: leaving, body: { discoverable: true } });

  const before = await call("GET", "/groups/directory", { token: state.learner });
  assert.ok(before.body.data.some((c) => c.name === "Orphan class"), "listed while the teacher exists");

  await mongoose.connection.db.collection("users").deleteOne({ email: "leaving@t.com" });
  const after = await call("GET", "/groups/directory", { token: state.learner });
  assert.equal(after.body.data.some((c) => c.name === "Orphan class"), false, "not listed once the teacher is gone");
});

it("seed --reset leaves no classes or requests behind", async () => {
  const { seedUsers } = require("../scripts/seed");
  await seedUsers({ reset: true });
  const db = mongoose.connection.db;
  for (const name of ["groups", "assignments", "materials", "joinrequests", "progresses"]) {
    assert.equal(await db.collection(name).countDocuments(), 0, `${name} cleared`);
  }
});

it("deleting a class removes its requests", async () => {
  await call("DELETE", `/groups/${state.group.id}`, { token: state.teacher });
  assert.equal(await mongoose.connection.db.collection("joinrequests").countDocuments(), 0);
});
