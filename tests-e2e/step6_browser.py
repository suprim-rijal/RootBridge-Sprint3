"""Step 6 browser test: teacher classes, join codes, live link, homework, materials."""
import asyncio, sys, re
from playwright.async_api import async_playwright
sys.path.insert(0, "tests-e2e")
from step3_browser import api, ok, results

B = "http://localhost:4173"

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        ctx = await br.new_context(viewport={"width": 1280, "height": 900}, accept_downloads=True)
        pg = await ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("dialog", lambda d: asyncio.ensure_future(d.accept()))  # confirm() prompts
        path = lambda: pg.url.replace(B, "").split("?")[0]

        async def login(email, role, password="demo123"):
            await pg.evaluate("localStorage.clear()") if pg.url.startswith(B) else None
            await pg.goto(B + "/"); await pg.goto(B + "/login"); await pg.wait_for_timeout(300)
            await pg.select_option(".role-select", label=role)
            await pg.fill("input[type=email]", email); await pg.fill("input[type=password]", password)
            await pg.click("button[type=submit]"); await pg.wait_for_timeout(1300)

        # ---------------- teacher creates a class ----------------
        await login("teacher@demo.com", "Teacher")
        ok("teacher lands on the teacher dashboard", path() == "/teacher" and "My classes" in await pg.inner_text("body"))
        ok("no classes yet", "No classes yet" in await pg.inner_text("body"))
        await pg.fill("input[placeholder^='Saturday Nepali']", "Saturday Nepali")
        await pg.fill("input[placeholder='Saturdays, 10:00']", "Saturdays, 10:00")
        await pg.fill("input[placeholder^='https://zoom']", "https://zoom.us/j/123456789")
        await pg.click("button:has-text('Create class')"); await pg.wait_for_timeout(900)
        msg = await pg.inner_text(".pd-save-msg")
        code = re.search(r"\b(\d{6})\b", msg).group(1)
        ok(f"the class is created with a 6-digit code ({code})", bool(code))
        await pg.click(".t-class-card:has-text('Saturday Nepali')"); await pg.wait_for_timeout(900)
        ok("the class page shows the code", code in await pg.inner_text(".t-code-box"))

        # an unsafe live link is refused, with a clear message
        # (the browser's own URL box would block this; switch it to plain
        #  text to prove the SERVER refuses it too)
        await pg.evaluate("document.querySelector('#t-settings ~ form input[type=url]').type='text'")
        link = pg.locator("#t-settings ~ form input[placeholder^='https://zoom']")
        await link.fill("javascript:alert(1)")
        await pg.click("#t-settings ~ form button:has-text('Save')"); await pg.wait_for_timeout(700)
        ok("a javascript: link is refused", "https://" in await pg.inner_text(".form-error"))
        await link.fill("https://zoom.us/j/123456789")
        await pg.click("#t-settings ~ form button:has-text('Save')"); await pg.wait_for_timeout(700)

        # homework linked to module L1.1
        await pg.fill("#t-homework ~ form input[maxlength='120']", "Practise greetings")
        await pg.fill("#t-homework ~ form input[type=date]", "2026-10-01")
        await pg.select_option("#t-homework ~ form select", label="Nepali Language · L1.1 Namaste world")
        await pg.fill("#t-homework ~ form textarea", "Finish all four lessons of Namaste world.")
        await pg.click("button:has-text('Post homework')"); await pg.wait_for_timeout(800)
        ok("homework posted", "Practise greetings" in await pg.inner_text("#t-homework ~ ul, section[aria-labelledby=t-homework]"))

        # a real file upload, and a link
        await pg.fill("#t-materials ~ form input[maxlength='120']", "Greetings worksheet")
        await pg.set_input_files("#t-materials ~ form input[type=file]", "tests-e2e/worksheet.txt")
        await pg.click("button:has-text('Share')"); await pg.wait_for_timeout(900)
        await pg.click("text=A link")
        await pg.fill("#t-materials ~ form input[maxlength='120']", "Alphabet video")
        await pg.fill("#t-materials ~ form input[type=url]", "https://example.com/alphabet")
        await pg.click("button:has-text('Share')"); await pg.wait_for_timeout(900)
        mats = await pg.inner_text("section[aria-labelledby=t-materials]")
        ok("the uploaded file is listed with its size", "worksheet.txt" in mats and "KB" in mats)
        ok("the link is listed", "Alphabet video" in mats)
        await pg.screenshot(path="/tmp/s6-teacher.png", full_page=True)

        # ---------------- a Normal learner joins ----------------
        await login("learner@demo.com", "Normal")
        ok("learners have a Classes link", await pg.locator(".main-nav a:has-text('Classes')").count() == 1)
        ok("no live banner before joining", await pg.locator(".live-banner").count() == 0)
        await pg.goto(B + "/classes"); await pg.wait_for_timeout(700)
        await pg.fill("#class-code", code); await pg.click(".join-form button"); await pg.wait_for_timeout(1200)
        ok("joined with the code", "Saturday Nepali" in await pg.inner_text(".join-status"))
        body = await pg.inner_text("body")
        ok("the class card shows teacher and time", "Hari Gurung" in body and "Saturdays, 10:00" in body)
        live = pg.locator(".class-card a:has-text('Join live class')")
        ok("'Join live class' opens the Zoom link", await live.get_attribute("href") == "https://zoom.us/j/123456789")
        ok("it opens safely in a new tab", "noopener" in (await live.get_attribute("rel")))
        ok("homework is listed, not done yet", "Practise greetings" in body and "· done" not in body)
        async with pg.expect_download() as info:
            await pg.click(".class-card button:has-text('Download')")
        dl = await info.value
        content = open(await dl.path()).read()
        ok("the teacher's file downloads with its name and content", dl.suggested_filename == "worksheet.txt" and "Namaste worksheet" in content)
        await pg.screenshot(path="/tmp/s6-learner.png", full_page=True)
        await pg.goto(B + "/dashboard"); await pg.wait_for_timeout(1000)
        ok("the dashboard shows a live class banner", await pg.locator(".live-banner a:has-text('Join live class')").count() == 1)
        ok("the dashboard still has exactly 5 widgets", await pg.locator(".widget").count() == 5)

        # ---------------- a family (child view) joins and does the homework ----------------
        await login("family@demo.com", "Child/Parent")
        await pg.goto(B + "/classes"); await pg.wait_for_timeout(700)
        await pg.fill("#class-code", code); await pg.click(".join-form button"); await pg.wait_for_timeout(1200)
        s, r = api("POST", "/auth/login", {"email": "family@demo.com", "password": "demo123", "role": "CombinedChildParent"})
        api("PATCH", "/progress/me", {"completedLessons": ["l1-1-l1", "l1-1-l2", "l1-1-l3", "l1-1-l4"], "xp": 80, "rhythmDays": ["2026-09-21"]}, r["token"])
        await pg.reload(); await pg.wait_for_timeout(1200)
        ok("finishing the module's lessons marks the homework done", "· done" in await pg.inner_text(".class-card"))
        # the parent view lists the class (Sprint 2 section)
        await pg.click("text=Switch to Parent View"); await pg.wait_for_timeout(900)
        ok("the parent view lists the class", "Saturday Nepali" in await pg.inner_text("#pd-classes"))

        # ---------------- the teacher sees progress ----------------
        await login("teacher@demo.com", "Teacher")
        await pg.click(".t-class-card:has-text('Saturday Nepali')"); await pg.wait_for_timeout(1000)
        roster = await pg.inner_text("section[aria-labelledby=t-students]")
        ok("the roster lists both students", "Priya Thapa" in roster and "Aarav" in roster)
        ok("a family is shown by the child's name", "family account: Sita Sharma" in roster)
        row = await pg.inner_text("tr:has-text('Aarav')")
        ok("with the child's real progress (4 lessons, 80 XP)", "\t4\t" in row and "80" in row)
        await pg.click("tr:has-text('Priya Thapa') button:has-text('Remove')"); await pg.wait_for_timeout(900)
        ok("a student can be removed", "Priya Thapa" not in await pg.inner_text("section[aria-labelledby=t-students]"))

        # ---------------- delete the class ----------------
        await pg.click("button:has-text('Delete class')"); await pg.wait_for_timeout(1000)
        ok("after deleting, back to the list", path() == "/teacher" and "No classes yet" in await pg.inner_text("body"))
        s, r = api("POST", "/auth/login", {"email": "family@demo.com", "password": "demo123", "role": "CombinedChildParent"})
        ok("the class is gone from the student's account", r["user"]["details"]["classes"] == [])

        print("ERRORS:", errs or "none")
        print(f"{sum(results)}/{len(results)} passed")
        await br.close()

asyncio.run(main())
