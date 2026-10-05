import asyncio, re, sys
sys.path.insert(0, "tests-e2e")
from step3_browser import answer as answer_step, next_step, exercises
from playwright.async_api import async_playwright
B="http://localhost:4173"
results=[]
def ok(label, cond):
    results.append(bool(cond)); print(("PASS " if cond else "FAIL ")+label)
async def play_lesson(pg, module_id="l1-1", lesson_index=0, mode="standard"):
    """Play a whole lesson correctly, using the app's own exercise builder
    as the answer key (lessons now mix several mechanics)."""
    if await pg.locator("text=Start practising").count():
        await pg.click("text=Start practising")
        await pg.wait_for_timeout(400)
    for ex in exercises(module_id, lesson_index, mode):
        await answer_step(pg, ex)
        await next_step(pg)
    return "Lesson complete" in await pg.inner_text("body")

async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(); pg=await br.new_page(viewport={"width":1280,"height":900})
        errs=[]
        pg.on("pageerror", lambda e: errs.append(f"{pg.url}: {e}"))
        pg.on("console", lambda m: m.type=="error" and "403" not in m.text and errs.append(f"{pg.url}: {m.text}"))
        async def go(path, wait=500):
            await pg.goto(B+path); await pg.wait_for_timeout(wait)
        path=lambda: pg.url.replace(B,"").split("?")[0]
        async def nav_labels():
            return [t.strip() for t in await pg.locator(".main-nav .nav-links a").all_inner_texts()]
        async def top():
            await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(250)
        async def login(email, role_label):
            await go("/login")
            await pg.select_option(".role-select", label=role_label)
            await pg.fill("input[type=email]", email); await pg.fill("input[type=password]","demo123")
            await pg.click("button[type=submit]"); await pg.wait_for_timeout(900)
        async def logout():
            await top(); await pg.click(".main-nav >> text=Log out"); await pg.wait_for_timeout(400)

        # 1. guards
        for u in ["/dashboard","/learn/language","/passport","/parent","/profile","/teacher"]:
            await go(u); ok(f"logged out {u} -> /login", path()=="/login")

        # 2. login page: roles + forgot password
        await go("/login")
        opts=await pg.eval_on_selector_all(".role-select option","o=>o.map(x=>x.textContent)")
        ok(f"login role menu has no Admin {opts}", opts==["Child/Parent","Normal","Teacher"])
        await pg.click("text=Forgot password?"); await pg.wait_for_timeout(400)
        ok("forgot link -> /forgot-password", path()=="/forgot-password")
        await pg.fill("input[type=email]","nope"); await pg.click("button[type=submit]"); await pg.wait_for_timeout(500)
        ok("forgot: invalid email error", "valid email" in await pg.inner_text("body"))
        await pg.fill("input[type=email]","someone@x.com"); await pg.click("button[type=submit]"); await pg.wait_for_timeout(600)
        ok("forgot: generic sent message", "Check your email" in await pg.inner_text("body"))
        await pg.screenshot(path="/tmp/u-forgot.png")

        # 3. role mismatch + teacher/admin
        await login("family@demo.com","Teacher")
        ok("role mismatch refused", "registered as \"Child/Parent\"" in await pg.inner_text("body") and path()=="/login")
        await login("teacher@demo.com","Teacher")
        ok("teacher -> /teacher", path()=="/teacher")
        ok("teacher nav", await nav_labels()==["My classes","Profile"])
        ok("no view switch for teacher", await pg.locator(".view-switch").count()==0)
        for u in ["/dashboard","/learn/language","/passport","/parent","/profile"]:
            await go(u); ok(f"teacher {u} -> /teacher", path()=="/teacher")
        await go("/teacher/profile"); ok("teacher profile, no stamps", await pg.locator(".stamps").count()==0 and "Teacher" in await pg.inner_text(".acct"))
        ok("teacher profile has no language section", await pg.locator("#acct-language").count()==0)
        await logout(); ok("logout -> home", path()=="/")
        # real passwords now: a wrong one must fail (it did not in Sprint 2)
        await go("/login")
        await pg.select_option(".role-select", label="Normal")
        await pg.fill("input[type=email]","learner@demo.com"); await pg.fill("input[type=password]","WRONG-password")
        await pg.click("button[type=submit]"); await pg.wait_for_timeout(900)
        ok("wrong password refused", path()=="/login" and "not correct" in await pg.inner_text("body"))
        await go("/admin"); ok("/admin no longer exists", "404" in await pg.inner_text("body") or "not" in (await pg.inner_text("body")).lower())

        # 4. signup Normal
        await go("/signup")
        sopts=await pg.eval_on_selector_all(".role-select option","o=>o.map(x=>x.textContent)")
        ok("signup role menu has no Admin", sopts==["Child/Parent","Normal","Teacher"])
        await pg.select_option(".role-select", label="Normal")
        ok("normal: no child name field", await pg.locator("text=Child's first name").count()==0)
        await pg.fill("input[type=text]","Priya Rai"); await pg.fill("input[type=email]","priya@x.com"); await pg.fill("input[type=password]","secret1")
        await pg.click("button[type=submit]"); await pg.wait_for_timeout(700)
        ok("normal signup -> Language Hub", path()=="/choose-language")
        await pg.click(".hub-card:has-text('Nepali')"); await pg.click(".hub-continue"); await pg.wait_for_timeout(900)
        ok("normal: after picking Nepali -> /welcome", path()=="/welcome")
        await pg.wait_for_timeout(300); await pg.screenshot(path="/tmp/u-welcome1.png")
        ok("welcome names user", "Priya" in await pg.inner_text(".welcome-final", timeout=4000))
        await pg.wait_for_timeout(4500)
        ok("welcome auto-continues -> /dashboard", path()=="/dashboard")
        await go("/welcome"); ok("welcome only once", path()=="/dashboard")
        ok("exactly 5 widgets", await pg.locator(".widget").count()==5)
        titles=[t.strip() for t in await pg.locator(".widget-title").all_inner_texts()]
        ok(f"widget titles {titles}", titles==["Continue learning","Streak","Word of the day","Cultural fact","Overall progress"])
        ok("no class widget on dashboard", await pg.locator(".join-class").count()==0)
        ok("normal nav", await nav_labels()==["Dashboard","Language","Culture","Classes","Profile"])
        ok("normal: no view switch", await pg.locator(".view-switch").count()==0)
        for u in ["/passport","/parent"]:
            await go(u); ok(f"normal {u} -> /dashboard", path()=="/dashboard")
        await go("/profile"); ok("normal profile: standard, language select", await pg.locator("#acct-language").count()==1 and await pg.locator(".stamps").count()==0)
        await logout()

        # 5. signup Child/Parent
        await go("/signup")
        tx=pg.locator("input[type=text]")
        await tx.nth(0).fill("Maya Rai"); await pg.fill("input[type=email]","maya@x.com"); await pg.fill("input[type=password]","secret1")
        await pg.click("button[type=submit]"); await pg.wait_for_timeout(600)
        ok("child name required", "Fill in every field" in await pg.inner_text("body"))
        await tx.nth(1).fill("Nima"); await pg.click("button[type=submit]"); await pg.wait_for_timeout(700)
        ok("family signup -> Language Hub", path()=="/choose-language")
        await pg.click(".hub-card:has-text('Nepali')"); await pg.click(".hub-continue"); await pg.wait_for_timeout(900)
        ok("family: after picking Nepali -> /welcome", path()=="/welcome")
        await pg.click("text=Continue"); await pg.wait_for_timeout(900)
        ok("continue button -> /dashboard", path()=="/dashboard")
        ok("greets child", "Hi, Nima" in await pg.inner_text(".dash-head"))
        ok("family child nav", await nav_labels()==["Dashboard","Language","Culture","Classes","Passport"])
        ok("streak 0", (await pg.inner_text(".streak-number")).strip()=="0")
        await pg.screenshot(path="/tmp/u-dash0.png", full_page=True)

        # 6. learning paths
        await pg.click(".main-nav >> text=Language"); await pg.wait_for_timeout(500)
        ok("/learn/language", path()=="/learn/language")
        ok("learn has own bar, no site navbar", await pg.locator(".learn-bar").count()==1 and await pg.locator(".main-nav").count()==0)
        ok("language = trail layout", await pg.locator(".trail").count()==1 and await pg.locator(".atlas").count()==0)
        await pg.screenshot(path="/tmp/u-lang.png", full_page=True)
        await pg.click(".learn-tab:has-text('Culture path')"); await pg.wait_for_timeout(400)
        ok("culture = atlas layout", path()=="/learn/culture" and await pg.locator(".atlas").count()==1)
        await pg.screenshot(path="/tmp/u-culture.png", full_page=True)
        await go("/learn"); ok("/learn -> /learn/language", path()=="/learn/language")
        await pg.click("a.module-tile:has-text('L1.1')"); await pg.wait_for_timeout(400)
        ok("module page", path()=="/learn/language/module/l1-1")
        ok("locked module not a link", await pg.locator("a.module-tile:has-text('L1.2')").count()==0)
        await go("/learn/culture/module/l1-1"); ok("wrong track module url fixed", path()=="/learn/language/module/l1-1")
        await go("/learn/culture/lesson/l1-1-l1"); ok("wrong track lesson url fixed", path()=="/learn/language/lesson/l1-1-l1")
        ok("lesson done", await play_lesson(pg))
        await pg.click("text=Back to the module"); await pg.wait_for_timeout(400)
        ok("back to module page", path()=="/learn/language/module/l1-1")
        ok("lesson ticked", await pg.locator("[aria-label='Done']").count()==1)
        await pg.click(".learn-exit"); await pg.wait_for_timeout(500)
        ok("exit -> dashboard", path()=="/dashboard")
        ok("continue: next lesson", "Choose the greeting by context" in await pg.inner_text(".widget-continue") and "Start lesson" in await pg.inner_text(".widget-continue"))
        ok("streak 1", (await pg.inner_text(".streak-number")).strip()=="1")
        ok("overall 1/368", "1 / 368" in await pg.inner_text(".widget-progress"))
        # resume: open culture lesson, leave
        await go("/learn/culture/lesson/c1-1-l1"); await go("/dashboard")
        cont=await pg.inner_text(".widget-continue")
        ok("resume last opened lesson", "Resume lesson" in cont and "Discover Nepal" in cont)

        # 7. passport
        await go("/passport")
        ok("passport shows stamps", await pg.locator(".stamps").count()==1)
        ok("no mode switch", await pg.locator("button[role=switch]").count()==0)
        ok("classes card in passport", await pg.locator(".join-class").count()==1)
        # (joining a real class is tested in Step 6, when teachers can create them)
        ok("first-step stamp earned", await pg.locator(".stamp-item.earned").count()>=1)
        await pg.set_input_files("input[type=file]","/tmp/face.png"); await pg.wait_for_timeout(400)
        await pg.click("text=Save photo"); await pg.wait_for_timeout(500)
        ok("child photo saved", "Photo saved" in await pg.inner_text(".photo-msg"))
        await pg.screenshot(path="/tmp/u-passport.png", full_page=True)

        # 8. parent view
        await top()
        await pg.click("text=Switch to Parent View"); await pg.wait_for_timeout(500)
        ok("switch -> /parent", path()=="/parent")
        ok("parent nav", await nav_labels()==["Parent overview","Profile"])
        ok("parent overview shows progress", "1 / 192" in await pg.inner_text(".pd-table"))
        await pg.screenshot(path="/tmp/u-parent.png", full_page=True)
        for u in ["/passport","/dashboard","/learn/language"]:
            await go(u); ok(f"parent view {u} -> /parent", path()=="/parent")
        await go("/parent/profile")
        ok("parent profile: no passport/stamps", await pg.locator(".stamps, .passport").count()==0)
        ok("parent photo separate (empty)", await pg.locator(".acct-avatar img").count()==0)
        ok("nav avatar is parent's (none)", await pg.locator(".nav-avatar img").count()==0)
        await pg.screenshot(path="/tmp/u-pprofile.png", full_page=True)
        # parent rules
        await go("/parent")
        await pg.click(".pd-switch:has-text('Discover Nepal')")
        # a PIN is created in the "Protect the parent view" card
        await pg.fill(".pin-setup .pin-input","4321")
        await pg.click(".pin-setup button:has-text('Set PIN')"); await pg.wait_for_timeout(900)
        ok("PIN set from the card", "PIN set" in await pg.inner_text("body"))
        await pg.click("text=Save settings"); await pg.wait_for_timeout(700)
        ok("settings saved", "Settings saved" in await pg.inner_text("body"))
        await top(); await pg.click(".main-nav >> text=Switch to Child View"); await pg.wait_for_timeout(500)
        ok("back to child -> /dashboard", path()=="/dashboard")
        ok("culture link hidden", await nav_labels()==["Dashboard","Language","Classes","Passport"])
        ok("continue ignores off track", "Nepali Language" in await pg.inner_text(".widget-continue"))
        await go("/learn/culture"); ok("culture path off", "turned off" in await pg.inner_text("body"))
        ok("learn bar hides culture tab", await pg.locator(".learn-tab").count()==1)
        await go("/dashboard"); await top()
        await pg.click("text=Switch to Parent View"); await pg.wait_for_timeout(300)
        ok("PIN asked", await pg.locator(".pin-dialog[open]").count()==1)
        # last attempt's bug: a wrong PIN logged the parent out entirely
        await pg.fill(".pin-input","0000"); await pg.click("text=Unlock"); await pg.wait_for_timeout(700)
        ok("wrong PIN refused, dialog stays open", await pg.locator(".pin-dialog[open]").count()==1 and "not right" in await pg.inner_text(".pin-dialog"))
        ok("wrong PIN does NOT log the parent out", await pg.evaluate("Boolean(localStorage.getItem('rootbridge_token'))"))
        await pg.fill(".pin-input","4321"); await pg.click("text=Unlock"); await pg.wait_for_timeout(700)
        ok("PIN ok (checked on the server) -> /parent", path()=="/parent")
        ok("the PIN never reaches the browser", "4321" not in await pg.evaluate("localStorage.getItem('rootbridge_session') || ''"))
        # refresh: the session comes back from GET /api/auth/me
        await pg.reload(); await pg.wait_for_timeout(1200)
        ok("refresh keeps you logged in", path()=="/parent" and await pg.locator(".main-nav").count()==1)

        # 9. mobile
        m=await br.new_page(viewport={"width":390,"height":844})
        m.on("pageerror", lambda e: errs.append(f"mobile: {e}"))
        await m.goto(B+"/login"); await m.wait_for_timeout(400)
        await m.select_option(".role-select", label="Child/Parent"); await m.fill("input[type=email]","family@demo.com"); await m.fill("input[type=password]","demo123")
        await m.click("button[type=submit]"); await m.wait_for_timeout(900)
        await m.screenshot(path="/tmp/u-m-dash.png", full_page=True)
        await m.goto(B+"/learn/language"); await m.wait_for_timeout(500); await m.screenshot(path="/tmp/u-m-lang.png")
        print("ERRORS:", errs or "none")
        print(f"{sum(results)}/{len(results)} passed")
        await br.close()
asyncio.run(main())
