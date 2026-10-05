"""Step 5 browser test: Language Hub, and learning in Japanese, Finnish and Twi."""
import asyncio, sys
from playwright.async_api import async_playwright
sys.path.insert(0, "tests-e2e")
from step3_browser import answer, next_step, exercises, token_for, api, ok, results

B = "http://localhost:4173"

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={"width": 1280, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        path = lambda: pg.url.replace(B, "").split("?")[0]

        async def signup(role_label, name, email, child=None):
            await pg.goto(B + "/"); await pg.goto(B + "/signup"); await pg.wait_for_timeout(400)
            await pg.select_option(".role-select", label=role_label)
            texts = pg.locator("input[type=text]")
            await texts.nth(0).fill(name)
            if child:
                await texts.nth(1).fill(child)
            await pg.fill("input[type=email]", email); await pg.fill("input[type=password]", "secret1")
            await pg.click("button[type=submit]"); await pg.wait_for_timeout(1500)

        async def through_welcome():
            await pg.wait_for_timeout(600)
            if await pg.locator("text=Continue").count():
                await pg.click("text=Continue")
            await pg.wait_for_timeout(1200)

        # ---------------- new Normal learner: the hub ----------------
        await signup("Normal", "Kenji Sato", "kenji@example.com")
        ok("signup goes to the Language Hub first", path() == "/choose-language")
        cards = await pg.locator(".hub-card").all_inner_texts()
        ok("four languages to choose from", len(cards) == 4)
        ok("each card shows both tracks and their size", all("modules" in c and "lessons" in c for c in cards))
        ok("the other languages are listed as coming soon", "Coming soon" in await pg.inner_text(".hub-soon"))
        ok("Continue is disabled until a language is picked", await pg.locator(".hub-continue").is_disabled())
        await pg.screenshot(path="/tmp/s5-hub.png")
        await pg.goto(B + "/dashboard"); await pg.wait_for_timeout(500)
        ok("the dashboard is closed until a language is picked", path() == "/choose-language")

        await pg.click(".hub-card:has-text('Japanese')")
        await pg.click(".hub-continue"); await pg.wait_for_timeout(900)
        ok("after picking, the welcome animation", path() == "/welcome")
        await through_welcome()
        ok("then the dashboard", path() == "/dashboard")
        dash = await pg.inner_text("body")
        ok("the word of the day is Japanese", any(w in dash for w in ["ichi", "san", "go", "hai", "aka", "ao", "mizu", "kyō", "yuki", "ni", "roku", "hachi", "kyū", "jū", "nana", "yon", "iie", "shiro", "kuro"]))
        ok("the dashboard greets in Japanese", "こんにちは" in dash and "नमस्ते" not in dash)
        ok("the cultural fact is about Japan", any(w in dash for w in ["Japan", "hanami", "genkan", "Fuji", "koinobori", "itadakimasu", "kanji"]))
        await pg.screenshot(path="/tmp/s5-dash.png", full_page=True)

        await pg.goto(B + "/learn/language"); await pg.wait_for_timeout(700)
        ok("the language path is Japanese", "Japanese Language" in await pg.inner_text("body"))
        await pg.goto(B + "/learn/culture"); await pg.wait_for_timeout(700)
        ok("the culture path is Discover Japan", "Discover Japan" in await pg.inner_text("body"))
        await pg.screenshot(path="/tmp/s5-culture.png")

        # play a whole Japanese lesson (Normal mode)
        steps = exercises("ja-l1-1", 0, "normal")
        await pg.goto(B + "/learn/language/lesson/ja-l1-1-l1"); await pg.wait_for_timeout(900)
        await pg.click("text=Start practising"); await pg.wait_for_timeout(400)
        body = await pg.inner_text("body")
        ok("lesson texts name Japanese, not Nepali", "Nepali" not in body)
        ok("Japanese words are marked lang=ja", await pg.locator("[lang=ja]").count() > 0)
        for ex in steps:
            await answer(pg, ex)
            if await pg.locator(".ln-feedback .success").count() != 1:
                print("   (not solved)", ex["kind"], ex["np"])
            await next_step(pg)
        ok("a Japanese lesson can be completed", "Lesson complete" in await pg.inner_text("body"))
        await pg.wait_for_timeout(1500)
        tok = token_for("kenji@example.com", "NormalUser") if False else None
        status, res = api("POST", "/auth/login", {"email": "kenji@example.com", "password": "secret1", "role": "NormalUser"})
        prog = api("GET", "/progress/me", token=res["token"])[1]["data"]
        ok("the server saved the Japanese lesson", "ja-l1-1-l1" in prog["completedLessons"])

        # switch language in the profile
        await pg.goto(B + "/profile"); await pg.wait_for_timeout(700)
        await pg.select_option("section[aria-labelledby=acct-language] select", "finnish"); await pg.wait_for_timeout(1200)
        await pg.goto(B + "/learn/language"); await pg.wait_for_timeout(700)
        ok("after switching in the profile, the path is Finnish", "Finnish Language" in await pg.inner_text("body"))
        await pg.goto(B + "/learn/language/lesson/fi-l1-3-l1"); await pg.wait_for_timeout(900)
        ok("a Finnish lesson opens", "Short and long sounds" in await pg.inner_text("body"))

        # ---------------- family: the hub speaks about the child ----------------
        await pg.evaluate("localStorage.clear()")
        await signup("Child/Parent", "Ama Mensah", "ama@example.com", child="Kofi")
        ok("family signup also goes to the hub", path() == "/choose-language")
        ok("the hub asks about the child", "Which language will Kofi learn?" in await pg.inner_text("body"))
        await pg.click(".hub-card:has-text('Twi')"); await pg.click(".hub-continue"); await pg.wait_for_timeout(900)
        await through_welcome()
        await pg.goto(B + "/learn/language"); await pg.wait_for_timeout(700)
        ok("the child's path is Twi", "Twi Language" in await pg.inner_text("body"))
        await pg.goto(B + "/learn/language/lesson/tw-l1-3-l1"); await pg.wait_for_timeout(900)
        await pg.click("text=Start practising"); await pg.wait_for_timeout(400)
        ok("child view of a Twi lesson: no hearts", await pg.locator(".ln-hearts").count() == 0)
        twi_text = await pg.inner_text("body")
        ok("Twi's special letters show", any(ch in twi_text for ch in "ɛɔ"))

        # ---------------- demo accounts skip the hub ----------------
        await pg.evaluate("localStorage.clear()")
        await pg.goto(B + "/"); await pg.goto(B + "/login"); await pg.wait_for_timeout(300)
        await pg.select_option(".role-select", label="Child/Parent")
        await pg.fill("input[type=email]", "family@demo.com"); await pg.fill("input[type=password]", "demo123")
        await pg.click("button[type=submit]"); await pg.wait_for_timeout(1300)
        ok("the demo family skips the hub", path() == "/dashboard")
        await pg.goto(B + "/learn/language"); await pg.wait_for_timeout(700)
        ok("and still learns Nepali", "Nepali Language" in await pg.inner_text("body"))

        print("ERRORS:", errs or "none")
        print(f"{sum(results)}/{len(results)} passed")
        await br.close()

asyncio.run(main())
