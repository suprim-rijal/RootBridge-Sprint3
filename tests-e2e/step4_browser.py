"""Step 4 browser test: strict pronunciation grading (Normal) vs Sprint 2 check (child)."""
import asyncio, json, subprocess, sys, urllib.request
from playwright.async_api import async_playwright
sys.path.insert(0, "tests-e2e")
from step3_browser import answer, next_step, exercises, token_for, api, ok, results, wait_hearts, hearts  # reuse helpers

B = "http://localhost:4173"
MODE = sys.argv[1] if len(sys.argv) > 1 else "local"

FAKE_RECOGNISER = """
window.__speech = [{ text: "", confidence: 0.9 }];
class FakeRecognition {
  start() {
    setTimeout(() => {
      const alts = window.__speech.map((a) => ({ transcript: a.text, confidence: a.confidence }));
      this.onresult && this.onresult({ results: [alts] });
      this.onend && this.onend();
    }, 80);
  }
  stop() {} abort() {}
}
window.SpeechRecognition = FakeRecognition;
window.webkitSpeechRecognition = FakeRecognition;
"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={"width": 1280, "height": 900})
        await pg.add_init_script(FAKE_RECOGNISER)
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        graded = []
        pg.on("request", lambda r: graded.append(r.url) if "/pronunciation/grade" in r.url else None)

        async def login(email, role):
            await pg.goto(B + "/"); await pg.goto(B + "/login"); await pg.wait_for_timeout(300)
            await pg.select_option(".role-select", label=role)
            await pg.fill("input[type=email]", email); await pg.fill("input[type=password]", "demo123")
            await pg.click("button[type=submit]"); await pg.wait_for_timeout(1300)

        async def reach_echo(steps, lesson_id="l1-1-l4"):
            # Speaking ("echo") is part of the "Use" lesson, the fourth one.
            await pg.goto(B + f"/learn/language/lesson/{lesson_id}"); await pg.wait_for_timeout(900)
            await pg.click("text=Start practising"); await pg.wait_for_timeout(400)
            for ex in steps:
                if ex["kind"] == "echo":
                    return ex
                await answer(pg, ex); await next_step(pg)

        async def say(text, confidence=0.9):
            await pg.evaluate(f"window.__speech = [{{ text: {json.dumps(text)}, confidence: {confidence} }}]")
            await pg.click(".ln-mic .btn-green")
            await pg.wait_for_timeout(1200)

        # ---------------- Normal learner: strict ----------------
        await login("learner@demo.com", "Normal")
        echo = await reach_echo(exercises("l1-1", 3, "normal"))
        ok(f"reached the speaking step ({echo['np']})", echo is not None)
        start = await hearts(pg)
        # What the learner "says" is derived from the real target, so this
        # test keeps working when lesson content changes.
        target = echo["np"].replace("___", "").replace("  ", " ").strip()
        wrong_word = "नमस्कार" if target != "नमस्कार" else "नमस्ते"
        near_miss = target[:-1] + ("ा" if not target.endswith("ा") else "े")

        if MODE == "coach":
            await say(echo["np"].split(" ")[0])
            box = await pg.inner_text(".ln-coach")
            ok("the coach's verdict is shown", "Needs work" in box)
            ok("with its specific tip", "me-ro NĀM" in box)
            ok("and what it heard", "We heard" in box)
            ok("needs_work costs a heart", await wait_hearts(pg, start - 1))
            await pg.screenshot(path="/tmp/s4-coach.png")
        else:
            await say(wrong_word)  # a different real word
            box = await pg.inner_text(".ln-coach")
            ok("a wrong word is graded 'Needs work' (server check)", "Needs work" in box)
            ok("the model answer is shown", target.split(" ")[0] in box)
            ok("needs_work costs a heart", await wait_hearts(pg, start - 1))
            await say(near_miss, 0.4)  # one letter off, unsure recogniser
            ok("a near miss is 'Very close'", "Very close" in await pg.inner_text(".ln-coach"))
            ok("'close' costs NO heart", await wait_hearts(pg, start - 1))
            await say(target, 0.92)  # correct
            ok("the right phrase is 'Spot on'", "Spot on" in await pg.inner_text(".ln-coach"))
            ok("and the step is solved", await pg.locator(".ln-feedback .success").count() == 1)
            ok("Normal learners' attempts go to the server", len(graded) == 3)
            await pg.screenshot(path="/tmp/s4-local.png")

            # ---------------- child: Sprint 2 check, unchanged ----------------
            await pg.evaluate("localStorage.clear()")
            graded.clear()
            await login("family@demo.com", "Child/Parent")
            echo = await reach_echo(exercises("l1-1", 3, "standard"))
            await say("नमस्कार" if echo["np"] != "नमस्कार" else "नमस्ते")
            ok("child view: no coach box", await pg.locator(".ln-coach").count() == 0)
            ok("child view: the Sprint 2 message", "Not quite yet" in await pg.inner_text(".ln-mic"))
            ok("child view: nothing is sent to the server", len(graded) == 0)
            await say(echo["np"].replace("___", "").replace("  ", " ").strip())
            ok("child view: the right word still passes", await pg.locator(".ln-feedback .success").count() == 1)

        print("ERRORS:", errs or "none")
        print(f"{sum(results)}/{len(results)} passed")
        await br.close()

asyncio.run(main())
