"""Finding a teacher without a code: directory, request, approve, decline."""
import asyncio, re, sys
from playwright.async_api import async_playwright
sys.path.insert(0, "tests-e2e")
from step3_browser import ok, results

B = "http://localhost:4173"

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={"width": 1280, "height": 950})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("dialog", lambda d: asyncio.ensure_future(d.accept("Sorry, this class is full this term.")))

        async def login(email, role, password="demo123"):
            await pg.goto(B + "/"); await pg.evaluate("localStorage.clear()")
            await pg.goto(B + "/login"); await pg.wait_for_timeout(400)
            await pg.select_option(".role-select", label=role)
            await pg.fill("input[type=email]", email); await pg.fill("input[type=password]", password)
            await pg.click("button[type=submit]"); await pg.wait_for_timeout(1400)

        # ---------- teacher creates a class and lists it ----------
        await login("teacher@demo.com", "Teacher")
        await pg.fill("input[placeholder^='Saturday Nepali']", "Saturday Nepali")
        await pg.fill("input[placeholder='Saturdays, 10:00']", "Saturdays, 10:00")
        await pg.click("button:has-text('Create class')"); await pg.wait_for_timeout(900)
        code = re.search(r"\b(\d{6})\b", await pg.inner_text(".pd-save-msg")).group(1)
        await pg.click(".t-class-card:has-text('Saturday Nepali')"); await pg.wait_for_timeout(900)
        ok("a new class is private by default", not await pg.locator("#t-settings ~ form input[type=checkbox]").is_checked())
        await pg.locator("#t-settings ~ form input[type=checkbox]").check()
        await pg.fill("#t-settings ~ form textarea", "Beginner Nepali for children, Saturdays in Espoo.")
        await pg.click("#t-settings ~ form button:has-text('Save')"); await pg.wait_for_timeout(1000)
        ok("the class can be listed for learners to find", "saved" in (await pg.inner_text(".pd-save-msg")).lower())

        # ---------- a learner with NO code finds it ----------
        await login("learner@demo.com", "Normal")
        await pg.goto(B + "/classes"); await pg.wait_for_timeout(1200)
        ok("learners get a 'Find a class' section", await pg.locator(".find-class").count() == 1)
        listing = await pg.inner_text(".find-class")
        ok("the teacher's class is listed with a description", "Saturday Nepali" in listing and "Espoo" in listing)
        ok("the teacher's name is shown", "Hari Gurung" in listing)
        ok("the join code is NOT shown", code not in listing)
        await pg.screenshot(path="/tmp/s9-find.png", full_page=True)

        await pg.click(".find-class button:has-text('Ask to join')"); await pg.wait_for_timeout(400)
        await pg.fill(".find-ask textarea", "Hello, I am learning Nepali on my own and would like to join.")
        await pg.click("button:has-text('Send request')"); await pg.wait_for_timeout(1300)
        ok("the request is sent to the teacher", "request was sent" in await pg.inner_text(".find-class"))
        ok("and it shows as waiting", "Waiting for the teacher" in await pg.inner_text(".find-class"))

        # ---------- a family also asks ----------
        await login("family@demo.com", "Child/Parent")
        await pg.goto(B + "/classes"); await pg.wait_for_timeout(1200)
        await pg.click(".find-class button:has-text('Ask to join')"); await pg.wait_for_timeout(400)
        await pg.fill(".find-ask textarea", "Could Aarav join? He is 8.")
        await pg.click("button:has-text('Send request')"); await pg.wait_for_timeout(1300)

        # ---------- the teacher answers ----------
        await login("teacher@demo.com", "Teacher")
        await pg.click(".t-class-card:has-text('Saturday Nepali')"); await pg.wait_for_timeout(1200)
        panel = await pg.inner_text("section[aria-labelledby=t-requests]")
        ok("the teacher sees both requests", "Priya Thapa" in panel and "Aarav" in panel)
        ok("with each learner's message", "learning Nepali on my own" in panel and "He is 8" in panel)
        await pg.screenshot(path="/tmp/s9-requests.png", full_page=True)

        await pg.click("li:has-text('Priya Thapa') button:has-text('Approve')"); await pg.wait_for_timeout(1400)
        roster = await pg.inner_text("section[aria-labelledby=t-students]")
        ok("approving puts the learner in the class", "Priya Thapa" in roster)
        await pg.click("li:has-text('Aarav') button:has-text('Decline')"); await pg.wait_for_timeout(1400)
        ok("declining removes the request", "Aarav" not in await pg.inner_text("section[aria-labelledby=t-requests]"))
        ok("and does not add them", "Aarav" not in await pg.inner_text("section[aria-labelledby=t-students]"))

        # ---------- what each learner sees now ----------
        await login("learner@demo.com", "Normal")
        await pg.goto(B + "/classes"); await pg.wait_for_timeout(1400)
        ok("the approved learner is now in the class", "Saturday Nepali" in await pg.inner_text(".class-card"))
        ok("and the directory says so", "You are in this class" in await pg.inner_text(".find-class"))

        await login("family@demo.com", "Child/Parent")
        await pg.goto(B + "/classes"); await pg.wait_for_timeout(1400)
        page = await pg.inner_text(".find-class")
        ok("the declined family sees the answer", "Not accepted" in page)
        ok("with the teacher's note", "full this term" in page)
        ok("and they are in no class", await pg.locator(".class-card").count() == 0)
        ok("they can ask again", await pg.locator(".find-class button:has-text('Ask to join')").count() == 1)

        print("ERRORS:", errs or "none")
        print(f"{sum(results)}/{len(results)} passed")
        await br.close()

asyncio.run(main())
