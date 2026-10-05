"""Step 3 browser test, against the live backend and a real database.

Checks: hearts for Normal learners, paid hints with confirmation, the two
new exercise styles, Explain more, out-of-hearts recovery (review and
waiting), module-quest refill, server progress sync, and that the
Child/Parent child view is exactly as in Sprint 2.
"""
import asyncio, json, subprocess, urllib.request
from playwright.async_api import async_playwright

B = "http://localhost:4173"
API = "http://localhost:5000/api"
results = []


def ok(label, cond):
    results.append(bool(cond))
    print(("PASS " if cond else "FAIL ") + label)


def api(method, path, body=None, token=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def token_for(email, role):
    return api("POST", "/auth/login", {"email": email, "password": "demo123", "role": role})[1]["token"]


def exercises(module_id, which, mode):
    out = subprocess.run(["node", "tests-e2e/dump_exercises.mjs", module_id, str(which), mode], capture_output=True, text=True)
    return json.loads(out.stdout)


async def hearts(pg):
    return await pg.locator(".ln-hearts .full").count()


async def wait_hearts(pg, n, tries=20):
    for _ in range(tries):
        if await hearts(pg) == n:
            return True
        await pg.wait_for_timeout(150)
    return False


async def answer(pg, ex):
    """Answer one step correctly, the way a learner who knows it would."""
    kind = ex["kind"]
    if kind == "pair-up":
        for pair in ex["pairs"]:
            await pg.locator(".ln-pair-col .ln-pair", has_text=pair["np"]).first.click()
            await pg.locator(".ln-pair.meaning", has_text=pair["en"]).first.click()
            await pg.wait_for_timeout(120)
    elif kind in ("sentence-order", "scramble"):
        for piece in ex["order"]:
            await pg.locator(".ln-order-bank .ln-chip:not([disabled])", has_text=piece).first.click()
        await pg.click(".ln-order >> text=Check")
    elif kind == "typing":
        await pg.fill(".ln-input", ex["np"])
        await pg.click(".ln-type-row >> text=Check")
    elif kind == "echo":
        await pg.click("text=I said it out loud")
    else:  # choice cards: hear-find, matra, match, meaning, cloze
        want = ex["np"] if ex["show"] == "np" else ex["en"]
        cards = pg.locator(".ln-option-main .word")
        for i in range(await cards.count()):
            if (await cards.nth(i).inner_text()).strip() == want:
                await pg.locator(".ln-option-main").nth(i).click()
                break
    await pg.wait_for_timeout(250)


async def next_step(pg):
    await pg.click(".ln-feedback .btn")
    await pg.wait_for_timeout(250)


async def play(pg, steps, first_wrong=False):
    for i, ex in enumerate(steps):
        await answer(pg, ex)
        ok_now = await pg.locator(".ln-feedback .success").count() == 1
        if not ok_now:
            print("   (step did not solve)", ex["kind"], ex["np"])
        await next_step(pg)


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        ctx = await br.new_context(viewport={"width": 1280, "height": 900})
        pg = await ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))

        async def login(email, role):
            await pg.goto(B + "/")
            await pg.goto(B + "/login")
            await pg.wait_for_timeout(300)
            await pg.select_option(".role-select", label=role)
            await pg.fill("input[type=email]", email)
            await pg.fill("input[type=password]", "demo123")
            await pg.click("button[type=submit]")
            await pg.wait_for_timeout(1300)

        async def open_lesson(url):
            await pg.goto(B + url)
            await pg.wait_for_timeout(900)
            await pg.click("text=Start practising")
            await pg.wait_for_timeout(500)

        # ---------------- Normal learner ----------------
        await login("learner@demo.com", "Normal")
        steps = exercises("l1-1", 0, "normal")
        kinds = [e["kind"] for e in steps]
        await open_lesson("/learn/language/lesson/l1-1-l1")

        ok("Normal learner sees 7 hearts", await wait_hearts(pg, 7))
        ok(f"the lesson mixes several mechanics ({', '.join(kinds)})", len(set(kinds)) >= 4 and any(k in kinds for k in ("cloze", "sentence-order")))
        ok("'Explain more' is open by default", await pg.locator("details.ln-explain[open]").count() == 1)
        ok("the copy says wrong answers cost hearts", "costs one heart" in await pg.inner_text("body"))

        # step 1: one wrong card first
        first = steps[0]
        want = first["np"] if first["show"] == "np" else first["en"]
        cards = pg.locator(".ln-option-main .word")
        for i in range(await cards.count()):
            if (await cards.nth(i).inner_text()).strip() != want:
                await pg.locator(".ln-option-main").nth(i).click()
                break
        ok("a wrong answer costs a heart (7 -> 6)", await wait_hearts(pg, 6))
        ok("the feedback says so", "cost a heart" in await pg.inner_text(".ln-feedback"))
        await answer(pg, first)
        await next_step(pg)

        # step 2: hint needs a confirmation
        await pg.click("button:has-text('Hint')")
        await pg.wait_for_timeout(200)
        ok("a hint asks first", await pg.locator(".ln-confirm").count() == 1)
        await pg.click("text=No, keep my heart")
        await pg.wait_for_timeout(300)
        ok("saying no keeps the heart", await wait_hearts(pg, 6) and await pg.locator(".ln-confirm").count() == 0)
        await pg.click("button:has-text('Hint')")
        await pg.click("text=Yes, show the hint")
        ok("a confirmed hint costs a heart (6 -> 5)", await wait_hearts(pg, 5))
        ok("and the hint is shown", "Hint 1" in await pg.inner_text("body"))

        # the rest of the lesson, correctly
        for ex in steps[1:]:
            if ex["kind"] == "cloze":
                ok("cloze shows the sentence with a gap", "＿＿＿" in await pg.inner_text(".ln-sentence"))
            if ex["kind"] == "sentence-order":
                ok("word order shows word chips", await pg.locator(".ln-order-bank .ln-chip").count() == len(ex["order"]))
                ok("Explain more does NOT reveal the order before solving", await pg.locator(".ln-breakdown").count() == 0)
                await pg.screenshot(path="/tmp/s3-order.png")
            if ex["kind"] == "cloze":
                ok("Explain more does NOT reveal the missing word before solving", await pg.locator(".ln-breakdown").count() == 0)
            await answer(pg, ex)
            if ex["kind"] in ("cloze", "sentence-order"):
                ok(f"after solving '{ex['kind']}', the word-by-word breakdown appears", await pg.locator(".ln-breakdown").count() == 1)
            ok(f"step '{ex['kind']}' solved", await pg.locator(".ln-feedback .success").count() == 1)
            await next_step(pg)
        ok("lesson complete", "Lesson complete" in await pg.inner_text("body"))

        tok = token_for("learner@demo.com", "NormalUser")
        await pg.wait_for_timeout(1500)  # the background sync
        status, prog = api("GET", "/progress/me", token=tok)
        ok("the server has the finished lesson (background sync)", "l1-1-l1" in prog["data"]["completedLessons"])
        ok("the server has 5 lives", prog["data"]["livesInfo"]["lives"] == 5)

        # ---------------- out of hearts ----------------
        for _ in range(5):
            api("POST", "/progress/lives/lose", {"reason": "wrong"}, tok)
        await open_lesson("/learn/language/lesson/l1-1-l2")
        ok("at 0 hearts the exercise is replaced", await pg.locator(".ln-out-of-lives").count() == 1)
        body = await pg.inner_text(".ln-out-of-lives")
        ok("it shows a countdown to the next heart", "next heart arrives in" in body)
        ok("a review of an already-finished lesson is offered right away", "Start the review" in body)
        ok("while blocked, no hint or explanation clutter", await pg.locator("button:has-text('Hint')").count() == 0 and await pg.locator("details.ln-explain").count() == 0)
        await pg.screenshot(path="/tmp/s3-out.png")

        # ---------------- module quest refills ----------------
        quest = exercises("l1-1", "test", "normal")
        await pg.goto(B + "/learn/language/module/l1-1/quest")
        await pg.wait_for_timeout(900)
        ok("the quest still says 'no lives'", "no lives" in await pg.inner_text("body"))
        ok("the quest has no hearts bar", await pg.locator(".ln-hearts").count() == 0)
        for ex in quest:
            await answer(pg, ex)
            await next_step(pg)
        await pg.wait_for_timeout(800)
        text = await pg.inner_text("body")
        ok("quest complete", "Quest complete" in text)
        ok("the quest refilled the hearts to 7", "7 of 7" in text)

        # ---------------- review earns a heart ----------------
        for _ in range(7):
            api("POST", "/progress/lives/lose", {"reason": "wrong"}, tok)
        await open_lesson("/learn/language/lesson/l1-1-l2")
        ok("now a review option is offered", "Start the review" in await pg.inner_text(".ln-out-of-lives"))
        await pg.click("text=Start the review")
        await pg.wait_for_timeout(900)
        await pg.click("text=Start practising")
        await pg.wait_for_timeout(400)
        ok("review mode has no hearts bar", await pg.locator(".ln-hearts").count() == 0)
        await play(pg, exercises("l1-1", 0, "normal"))
        await pg.wait_for_timeout(700)
        ok("a perfect review earns a heart", "earned a heart back" in await pg.inner_text("body"))
        ok("server: 1 heart", api("GET", "/progress/me", token=tok)[1]["data"]["livesInfo"]["lives"] == 1)

        # ---------------- progress follows to another device ----------------
        other = await br.new_context()
        pg2 = await other.new_page()
        await pg2.goto(B + "/login")
        await pg2.wait_for_timeout(300)
        await pg2.select_option(".role-select", label="Normal")
        await pg2.fill("input[type=email]", "learner@demo.com")
        await pg2.fill("input[type=password]", "demo123")
        await pg2.click("button[type=submit]")
        await pg2.wait_for_timeout(2000)
        local = await pg2.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('rootbridge_learning_progress')).map(k=>localStorage.getItem(k)).join('')")
        ok("a new device gets the progress from the server", "l1-1-l1" in local and "l1-1" in local)
        await other.close()

        # ---------------- Child/Parent: exactly Sprint 2 ----------------
        await ctx.clear_cookies()
        await pg.evaluate("localStorage.clear()")
        await login("family@demo.com", "Child/Parent")
        await open_lesson("/learn/language/lesson/l1-1-l1")
        ok("child view: no hearts", await pg.locator(".ln-hearts").count() == 0)
        ok("child view: hints are free", "Hints never cost anything" in await pg.inner_text("body"))
        await pg.click("button:has-text('Hint')")
        await pg.wait_for_timeout(200)
        ok("child view: a hint opens at once, no confirmation", await pg.locator(".ln-confirm").count() == 0 and "Hint 1" in await pg.inner_text("body"))
        ok("child view: no 'Explain more'", await pg.locator("details.ln-explain").count() == 0)
        steps_child = exercises("l1-1", 0, "standard")
        ok("child view: no new exercise styles", all(e["kind"] not in ("cloze", "sentence-order") for e in steps_child))
        ftok = token_for("family@demo.com", "CombinedChildParent")
        ok("child view: the server reports lives off", api("GET", "/progress/me", token=ftok)[1]["data"]["livesInfo"] == {"enabled": False})

        print("ERRORS:", errs or "none")
        print(f"{sum(results)}/{len(results)} passed")
        await br.close()


if __name__ == "__main__":
    asyncio.run(main())
