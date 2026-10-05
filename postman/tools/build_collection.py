"""Builds postman/RootBridge.postman_collection.json.

Run:  python postman/tools/build_collection.py
Each step of Sprint 3 adds its folder here, so the collection never drifts.
"""
import json, os

def req(name, method, path, body=None, status=None, extra=(), auth="token", desc=""):
    r = {"name": name, "request": {"method": method, "header": [], "url": {
        "raw": "{{baseUrl}}" + path, "host": ["{{baseUrl}}"],
        "path": [p for p in path.split("?")[0].strip("/").split("/")]}}}
    if "?" in path:
        r["request"]["url"]["query"] = [{"key": kv.split("=")[0], "value": kv.split("=")[1]} for kv in path.split("?")[1].split("&")]
    if desc:
        r["request"]["description"] = desc
    if auth:
        r["request"]["auth"] = {"type": "bearer", "bearer": [{"key": "token", "value": "{{" + auth + "}}"}]}
    if body is not None:
        r["request"]["header"].append({"key": "Content-Type", "value": "application/json"})
        r["request"]["body"] = {"mode": "raw", "raw": json.dumps(body, indent=2, ensure_ascii=False),
                                "options": {"raw": {"language": "json"}}}
    checks = ([f"pm.test('Status is {status}', () => pm.response.to.have.status({status}));",
               "pm.test('success is false', () => pm.expect(pm.response.json().success).to.eql(false));"]
              if status else
              ["pm.test('Status is 2xx', () => pm.response.to.be.success);",
               "pm.test('success is true', () => pm.expect(pm.response.json().success).to.eql(true));"])
    r["event"] = [{"listen": "test", "script": {"type": "text/javascript", "exec": checks + list(extra)}}]
    return r

def save(var):
    return [f"const b = pm.response.json(); if (b.token) pm.collectionVariables.set('{var}', b.token);"]

def login(name, email, role, var):
    return req(name, "POST", "/auth/login", {"email": email, "password": "demo123", "role": role},
               auth=None, extra=save(var))

folders = [
    {"name": "0. Health", "item": [
        req("Health check", "GET", "/health", auth=None,
            extra=["pm.test('database connected', () => pm.expect(pm.response.json().database).to.eql('connected'));"]),
    ]},
    {"name": "1. Auth (bcrypt + JWT)", "item": [
        login("Login Normal (saves token)", "learner@demo.com", "NormalUser", "token"),
        login("Login Child/Parent (saves familyToken)", "family@demo.com", "CombinedChildParent", "familyToken"),
        login("Login Teacher (saves teacherToken)", "teacher@demo.com", "Teacher", "teacherToken"),
        req("Login: wrong password (401)", "POST", "/auth/login",
            {"email": "learner@demo.com", "password": "wrong-password", "role": "NormalUser"}, status=401, auth=None,
            desc="Sprint 2 accepted any password. Sprint 3 must refuse it."),
        req("Login: wrong role (403)", "POST", "/auth/login",
            {"email": "learner@demo.com", "password": "demo123", "role": "Teacher"}, status=403, auth=None),
        req("Login: missing role (400)", "POST", "/auth/login",
            {"email": "learner@demo.com", "password": "demo123"}, status=400, auth=None),
        req("Signup Normal", "POST", "/auth/signup",
            {"name": "Test Learner", "email": "test.{{$timestamp}}@example.com", "password": "secret1", "role": "NormalUser"},
            auth=None, extra=["pm.test('password never returned', () => pm.expect(pm.response.json().user.password).to.be.undefined);"]),
        req("Signup Child/Parent", "POST", "/auth/signup",
            {"name": "Maya Rai", "childName": "Nima", "email": "family.{{$timestamp}}@example.com", "password": "secret1", "role": "CombinedChildParent"},
            auth=None),
        req("Signup: Admin role no longer exists (400)", "POST", "/auth/signup",
            {"name": "X", "email": "adm.{{$timestamp}}@example.com", "password": "secret1", "role": "Admin"}, status=400, auth=None),
        req("Signup: duplicate email (409)", "POST", "/auth/signup",
            {"name": "Copy", "email": "learner@demo.com", "password": "secret1", "role": "NormalUser"}, status=409, auth=None),
        req("Me (session from token)", "GET", "/auth/me",
            extra=["pm.test('is the demo learner', () => pm.expect(pm.response.json().user.email).to.eql('learner@demo.com'));"]),
        req("Me without a token (401)", "GET", "/auth/me", status=401, auth=None),
        req("Me with a garbage token (401)", "GET", "/auth/me", status=401, auth="garbageToken"),
        req("Forgot password", "POST", "/auth/forgot-password", {"email": "learner@demo.com"}, auth=None),
    ]},
    {"name": "2. Users + parent PIN", "item": [
        req("Change my name", "POST", "/users/update", {"name": "Priya T."}),
        req("Change it back", "POST", "/users/update", {"name": "Priya Thapa"}),
        req("Parent settings with a PIN (family)", "POST", "/users/update",
            {"details": {"parentSettings": {"childName": "Aarav", "dailyMinutes": 20, "weeklyGoalDays": 4,
                                            "allowedTracks": {"language": True, "culture": True},
                                            "allowSpeaking": True, "requirePin": True, "pin": "1234"}}},
            auth="familyToken",
            extra=["const s = pm.response.json().user.details.parentSettings;",
                   "pm.test('only hasPin comes back', () => { pm.expect(s.hasPin).to.eql(true); pm.expect(s.pin).to.be.undefined; });"]),
        req("Verify PIN: wrong (401)", "POST", "/users/verify-pin", {"pin": "0000"}, status=401, auth="familyToken"),
        req("Verify PIN: right", "POST", "/users/verify-pin", {"pin": "1234"}, auth="familyToken"),
        req("Verify PIN as a Normal user (403)", "POST", "/users/verify-pin", {"pin": "1234"}, status=403),
        req("Forgotten PIN: wrong account password (401)", "POST", "/users/pin/reset",
            {"password": "not-the-password", "newPin": "5555"}, status=401, auth="familyToken"),
        req("Forgotten PIN: set a new one with the account password", "POST", "/users/pin/reset",
            {"password": "demo123", "newPin": "5555"}, auth="familyToken",
            extra=["pm.test('a PIN is set', () => pm.expect(pm.response.json().user.details.parentSettings.hasPin).to.eql(true));"]),
        req("The new PIN works", "POST", "/users/verify-pin", {"pin": "5555"}, auth="familyToken"),
        req("Remove the PIN completely", "POST", "/users/pin/reset", {"password": "demo123"}, auth="familyToken",
            extra=["const s = pm.response.json().user.details.parentSettings;",
                   "pm.test('no PIN, no lock', () => { pm.expect(s.hasPin).to.eql(false); pm.expect(s.requirePin).to.eql(false); });"]),
    ]},
    {"name": "3. Courses", "item": [
        req("Tracks (Nepali)", "GET", "/tracks?language=nepali",
            extra=["const t = pm.response.json().data;",
                   "pm.test('all 368 Nepali lessons', () => pm.expect(t.reduce((s, x) => s + x.totalLessons, 0)).to.eql(368));"]),
        req("One track", "GET", "/tracks/nepali-language"),
        req("One module", "GET", "/modules/l1-1"),
        req("One lesson", "GET", "/lessons/l1-1-l1"),
        req("Missing lesson (404)", "GET", "/lessons/nope", status=404),
        req("Tracks without a token (401)", "GET", "/tracks", status=401, auth=None),
        req("Tracks as a Teacher (403)", "GET", "/tracks", status=403, auth="teacherToken"),
    ]},
    {"name": "5. Progress + lives (NormalUser)", "item": [
        req("My progress (7 lives to start)", "GET", "/progress/me",
            extra=["pm.test('lives are on', () => pm.expect(pm.response.json().data.livesInfo.enabled).to.eql(true));"]),
        req("Sync progress from the browser", "PATCH", "/progress/me",
            {"completedLessons": ["l1-1-l1"], "rhythmDays": ["2026-09-21"], "xp": 20,
             "lastLesson": {"trackId": "language", "lessonId": "l1-1-l1"}},
            extra=["pm.test('lesson merged', () => pm.expect(pm.response.json().data.completedLessons).to.include('l1-1-l1'));"]),
        req("Made-up lessons are ignored", "PATCH", "/progress/me",
            {"completedLessons": ["not-a-lesson", "l9-9-l9"], "masteredModules": ["nope"], "xp": 999999},
            extra=["const d = pm.response.json().data;",
                   "pm.test('invented lessons are not stored', () => pm.expect(d.completedLessons).to.not.include('not-a-lesson'));",
                   "pm.test('XP is worked out by the server', () => pm.expect(d.xp).to.be.at.most(d.completedLessons.length * 20 + d.masteredModules.length * 100));"]),
        req("Class membership cannot be faked", "POST", "/users/update",
            {"details": {"classes": [{"code": "999999", "name": "Fake class", "teacher": "Nobody"}]}},
            extra=["pm.test('classes unchanged', () => pm.expect(pm.response.json().user.details.classes.length).to.eql(0));"]),
        req("A photo must be a real image (400)", "POST", "/users/update",
            {"details": {"avatar": "not-an-image"}}, status=400),
        req("The browser cannot set lives", "PATCH", "/progress/me", {"lives": 99},
            extra=["pm.test('lives unchanged', () => pm.expect(pm.response.json().data.livesInfo.lives).to.be.at.most(7));"]),
        req("Wrong answer: lose a heart", "POST", "/progress/lives/lose", {"reason": "wrong"}),
        req("Hint: lose a heart", "POST", "/progress/lives/lose", {"reason": "hint"}),
        req("Unknown reason (400)", "POST", "/progress/lives/lose", {"reason": "cheat"}, status=400),
        req("Review of a lesson you have not finished (400)", "POST", "/progress/lives/earn",
            {"lessonId": "l2-1-l1"}, status=400,
            desc="A heart can only be earned by practising a lesson you already finished."),
        req("Finish the module quest: refill to 7", "PATCH", "/progress/me", {"masteredModules": ["l1-1"]},
            extra=["pm.test('7 hearts', () => pm.expect(pm.response.json().data.livesInfo.lives).to.eql(7));"]),
        req("Lose one, then earn it back with a review", "POST", "/progress/lives/lose", {"reason": "wrong"}),
        req("Review a finished lesson: +1 heart", "POST", "/progress/lives/earn", {"lessonId": "l1-1-l1"},
            extra=["pm.test('back to 7', () => pm.expect(pm.response.json().data.livesInfo.lives).to.eql(7));"]),
        req("Child/Parent: no lives (403)", "POST", "/progress/lives/lose", {"reason": "wrong"},
            status=403, auth="familyToken"),
        req("Teacher: no learner progress (403)", "GET", "/progress/me", status=403, auth="teacherToken"),
    ]},
    {"name": "6. Pronunciation grading", "item": [
        req("Correct word: spot_on", "POST", "/pronunciation/grade",
            {"language": "nepali", "targetNative": "नमस्ते", "targetRomanization": "namaste",
             "targetMeaning": "hello", "transcripts": [{"text": "नमस्ते", "confidence": 0.93}], "attemptNumber": 1},
            extra=["pm.test('spot_on', () => pm.expect(pm.response.json().data.verdict).to.eql('spot_on'));",
                   "pm.test('says where the grade came from', () => pm.expect(['coach','local']).to.include(pm.response.json().data.source));"]),
        req("A different word: needs_work", "POST", "/pronunciation/grade",
            {"language": "nepali", "targetNative": "नमस्ते", "targetRomanization": "namaste",
             "targetMeaning": "hello", "transcripts": [{"text": "नमस्कार", "confidence": 0.88}], "attemptNumber": 1},
            desc="With GEMINI_API_KEY set, the AI coach grades it; without it, the strict local check does.",
            extra=["pm.test('not spot_on', () => pm.expect(pm.response.json().data.verdict).to.not.eql('spot_on'));",
                   "pm.test('has a tip', () => pm.expect(pm.response.json().data.feedback).to.be.a('string').and.not.empty);"]),
        req("Nothing heard: unclear", "POST", "/pronunciation/grade",
            {"language": "nepali", "targetNative": "नमस्ते", "transcripts": []},
            extra=["pm.test('unclear', () => pm.expect(pm.response.json().data.verdict).to.eql('unclear'));"]),
        req("Unknown language (400)", "POST", "/pronunciation/grade",
            {"language": "klingon", "targetNative": "x", "transcripts": []}, status=400),
        req("Teacher cannot use it (403)", "POST", "/pronunciation/grade",
            {"language": "nepali", "targetNative": "x", "transcripts": []}, status=403, auth="teacherToken"),
    ]},
    {"name": "7. Languages (Step 5)", "item": [
        req("Finnish tracks", "GET", "/tracks?language=finnish",
            extra=["const t = pm.response.json().data;",
                   "pm.test('language + culture', () => pm.expect(t.map(x => x.id).sort()).to.eql(['finnish-culture','finnish-language']));"]),
        req("Japanese language track", "GET", "/tracks/japanese-language",
            extra=["pm.test('3 chapters', () => pm.expect(pm.response.json().data.chapters.length).to.eql(3));"]),
        req("Japanese module: long vowels", "GET", "/modules/ja-l1-3"),
        req("Twi lesson", "GET", "/lessons/tw-l1-1-l1"),
        req("Pick a language (the Language Hub)", "POST", "/users/update",
            {"details": {"onboarding": {"language": "japanese", "completed": True}}},
            extra=["pm.test('saved', () => pm.expect(pm.response.json().user.details.onboarding.language).to.eql('japanese'));"]),
        req("Tracks now default to Japanese", "GET", "/tracks",
            extra=["pm.test('japanese', () => pm.expect(pm.response.json().data[0].language).to.eql('japanese'));"]),
        req("Unknown language is refused (400)", "POST", "/users/update",
            {"details": {"onboarding": {"language": "klingon", "completed": True}}}, status=400),
        req("Back to Nepali", "POST", "/users/update",
            {"details": {"onboarding": {"language": "nepali", "completed": True}}}),
    ]},
    {"name": "8. Classes (Step 6)", "item": [
        req("Teacher: create a class (saves classId + classCode)", "POST", "/groups",
            {"name": "Saturday Nepali", "meets": "Saturdays, 10:00", "language": "nepali", "liveClassUrl": "https://zoom.us/j/123456789"},
            auth="teacherToken",
            extra=["const d = pm.response.json().data;",
                   "pm.collectionVariables.set('classId', d.id); pm.collectionVariables.set('classCode', d.code);",
                   "pm.test('6-digit code', () => pm.expect(d.code).to.match(/^\\d{6}$/));"]),
        req("Teacher: my classes", "GET", "/groups", auth="teacherToken"),
        req("Teacher: unsafe live link refused (400)", "PATCH", "/groups/{{classId}}",
            {"liveClassUrl": "javascript:alert(1)"}, status=400, auth="teacherToken"),
        req("Learner: join with the code", "POST", "/groups/join", {"code": "{{classCode}}"},
            extra=["pm.test('class in my account', () => pm.expect(pm.response.json().user.details.classes[0].code).to.eql(pm.collectionVariables.get('classCode')));"]),
        req("Learner: join again (409)", "POST", "/groups/join", {"code": "{{classCode}}"}, status=409),
        req("Learner: wrong code (404)", "POST", "/groups/join", {"code": "000000"}, status=404),
        req("Child/Parent: join too", "POST", "/groups/join", {"code": "{{classCode}}"}, auth="familyToken"),
        req("Teacher: post homework", "POST", "/groups/{{classId}}/assignments",
            {"title": "Practise greetings", "instructions": "Finish Namaste world.", "dueDate": "2026-10-01",
             "lessonIds": ["l1-1-l1", "l1-1-l2", "l1-1-l3", "l1-1-l4"]}, auth="teacherToken"),
        req("Teacher: share a link", "POST", "/groups/{{classId}}/materials",
            {"title": "Alphabet video", "url": "https://example.com/alphabet"}, auth="teacherToken"),
        req("Teacher: class with roster + progress", "GET", "/groups/{{classId}}", auth="teacherToken",
            extra=["pm.test('2 students', () => pm.expect(pm.response.json().data.students.length).to.eql(2));",
                   "pm.test('family shows the child name', () => pm.expect(pm.response.json().data.students.map(s => s.name)).to.include('Aarav'));"]),
        req("Learner: my classes (live link, homework, materials)", "GET", "/groups/mine",
            extra=["const c = pm.response.json().data[0];",
                   "pm.test('live link', () => pm.expect(c.liveClassUrl).to.eql('https://zoom.us/j/123456789'));",
                   "pm.test('homework', () => pm.expect(c.assignments.length).to.eql(1));"]),
        req("Learner cannot create classes (403)", "POST", "/groups", {"name": "x"}, status=403),
        req("Learner: leave", "POST", "/groups/leave", {"code": "{{classCode}}"}),
        req("Teacher: list the class in the directory", "PATCH", "/groups/{{classId}}",
            {"discoverable": True, "about": "Beginner Nepali for children, Saturdays in Espoo."}, auth="teacherToken"),
        req("Learner: find classes without a code", "GET", "/groups/directory?language=nepali",
            extra=["const c = pm.response.json().data[0];",
                   "pm.test('the class is listed', () => pm.expect(c.name).to.eql('Saturday Nepali'));",
                   "pm.test('the join code is never listed', () => pm.expect(c.code).to.be.undefined);",
                   "pm.collectionVariables.set('dirClassId', c.id);"]),
        req("Learner: ask to join", "POST", "/groups/{{dirClassId}}/requests",
            {"message": "Hello, I am learning Nepali on my own and would like to join."}),
        req("Learner: ask twice (409)", "POST", "/groups/{{dirClassId}}/requests", {"message": "again"}, status=409),
        req("Learner: my requests", "GET", "/groups/requests/mine",
            extra=["pm.test('pending', () => pm.expect(pm.response.json().data[0].status).to.eql('pending'));"]),
        req("Teacher: see the requests (saves requestId)", "GET", "/groups/{{classId}}/requests", auth="teacherToken",
            extra=["const r = pm.response.json().data[0];",
                   "pm.collectionVariables.set('requestId', r.id);",
                   "pm.test('the learner message is there', () => pm.expect(r.message).to.contain('learning Nepali'));"]),
        req("Learner cannot read requests (403)", "GET", "/groups/{{classId}}/requests", status=403),
        req("Teacher: approve the request", "POST", "/groups/{{classId}}/requests/{{requestId}}/approve", None, auth="teacherToken"),
        req("Learner: now in the class", "GET", "/groups/mine",
            extra=["pm.test('one class', () => pm.expect(pm.response.json().data.length).to.be.at.least(1));"]),
        req("Teacher: delete the class", "DELETE", "/groups/{{classId}}", auth="teacherToken"),
    ]},
    {"name": "4. Contact", "item": [
        req("Send a message", "POST", "/contact",
            {"name": "Sita Sharma", "email": "family@demo.com", "subject": "Question", "message": "When is the next live class?"}, auth=None),
        req("Missing message (400)", "POST", "/contact", {"name": "X", "email": "x@example.com"}, status=400, auth=None),
    ]},
]

collection = {
    "info": {
        "name": "RootBridge Sprint 3 API",
        "description": "Start the backend (npm run dev) after npm run seed. Run the folders top to bottom: "
                       "the login requests save tokens for the later requests.\n\n"
                       "Demo accounts (password demo123): family@demo.com (Child/Parent), learner@demo.com (Normal), teacher@demo.com (Teacher).",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    "variable": [
        {"key": "baseUrl", "value": "http://localhost:5000/api"},
        {"key": "token", "value": ""},
        {"key": "familyToken", "value": ""},
        {"key": "teacherToken", "value": ""},
        {"key": "garbageToken", "value": "not.a.real.token"},
        {"key": "classId", "value": ""},
        {"key": "classCode", "value": ""},
        {"key": "dirClassId", "value": ""},
        {"key": "requestId", "value": ""},
    ],
    "item": folders,
}

out = os.path.join(os.path.dirname(__file__), "..", "RootBridge.postman_collection.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(collection, f, indent=2, ensure_ascii=False)
print("requests:", sum(len(x["item"]) for x in folders))
