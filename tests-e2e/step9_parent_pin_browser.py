import asyncio
from playwright.async_api import async_playwright
B="http://localhost:4173"
ok_=[]
def ok(l,c): ok_.append(bool(c)); print(("PASS " if c else "FAIL ")+l)
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(); pg=await br.new_page(viewport={"width":1200,"height":900})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        async def login():
            await pg.goto(B+"/login"); await pg.wait_for_timeout(400)
            await pg.select_option(".role-select", label="Child/Parent")
            await pg.fill("input[type=email]","family@demo.com"); await pg.fill("input[type=password]","demo123")
            await pg.click("button[type=submit]"); await pg.wait_for_timeout(1500)
        await login()
        # 1. direct visit to /parent from the child view now offers unlock
        await pg.goto(B+"/parent"); await pg.wait_for_timeout(900)
        ok("direct /parent shows the unlock screen", await pg.locator(".unlock").count()==1)
        await pg.click("button:has-text('Open parent view')"); await pg.wait_for_timeout(900)
        ok("no PIN set yet: it opens straight away", pg.url.endswith("/parent") and await pg.locator(".unlock").count()==0)
        # 2. the PIN card is right there
        ok("a 'Protect the parent view' card is shown", await pg.locator(".pin-setup").count()==1)
        await pg.fill(".pin-setup .pin-input","4321")
        await pg.click(".pin-setup button:has-text('Set PIN')"); await pg.wait_for_timeout(1200)
        ok("PIN set message", "PIN set" in await pg.inner_text("body"))
        await pg.reload(); await pg.wait_for_timeout(1200)
        ok("the card disappears once a PIN exists", await pg.locator(".pin-setup").count()==0)
        await pg.screenshot(path="/tmp/pin-card.png", full_page=True)
        # 3. switch to child, then back: the PIN is asked
        await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(300)
        await pg.locator(".view-switch-text", has_text="Switch to Child View").first.click(); await pg.wait_for_timeout(1200)
        await pg.locator(".view-switch-text", has_text="Switch to Parent View").first.click(); await pg.wait_for_timeout(900)
        ok("switching asks for the PIN", await pg.locator(".pin-dialog[open]").count()==1)
        await pg.fill(".pin-input","4321"); await pg.click("text=Unlock"); await pg.wait_for_timeout(1000)
        ok("correct PIN opens the parent view", pg.url.endswith("/parent"))
        # 4. after logging in again, a direct visit asks for the PIN on the unlock page
        await pg.evaluate("localStorage.clear(); sessionStorage.clear()")
        await login()
        await pg.goto(B+"/parent"); await pg.wait_for_timeout(900)
        await pg.wait_for_timeout(600)
        ok("unlock screen asks for the PIN", await pg.locator(".unlock .pin-input").count()==1)
        await pg.fill(".pin-input","0000"); await pg.click("button:has-text('Open parent view')"); await pg.wait_for_timeout(900)
        ok("a wrong PIN is refused there too", "not right" in await pg.inner_text(".unlock"))
        await pg.fill(".pin-input","4321"); await pg.click("button:has-text('Open parent view')"); await pg.wait_for_timeout(1000)
        ok("the right PIN opens the parent view", pg.url.endswith("/parent"))
        await pg.screenshot(path="/tmp/unlock.png")
        print("errors:", errs or "none"); print(f"{sum(ok_)}/{len(ok_)} passed")
        await br.close()
asyncio.run(main())
