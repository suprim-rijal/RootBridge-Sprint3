import asyncio
from playwright.async_api import async_playwright
B="http://localhost:5000"
res=[]
def ok(l,c): res.append(bool(c)); print(("PASS " if c else "FAIL ")+l)
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(); pg=await br.new_page(viewport={"width":1280,"height":900})
        async def login():
            await pg.goto(B+"/"); await pg.evaluate("localStorage.clear()")
            await pg.goto(B+"/login"); await pg.wait_for_timeout(400)
            await pg.select_option(".role-select", label="Child/Parent")
            await pg.fill("input[type=email]","family@demo.com"); await pg.fill("input[type=password]","demo123")
            await pg.click("button[type=submit]"); await pg.wait_for_timeout(1500)
        await login()
        # direct entry with no PIN set
        await pg.goto(B+"/parent"); await pg.wait_for_timeout(800)
        ok("direct visit shows the unlock screen", await pg.locator(".unlock").count()==1)
        await pg.click("button:has-text('Open parent view')"); await pg.wait_for_timeout(900)
        ok("opens the parent view", pg.url.endswith("/parent") and await pg.locator(".unlock").count()==0)
        # switching back must land on the dashboard
        await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(300)
        await pg.locator(".view-switch").first.click(); await pg.wait_for_timeout(1200)
        ok("switching back goes to the dashboard", pg.url.endswith("/dashboard"))
        # and back into the parent view again
        await pg.locator(".view-switch").first.click(); await pg.wait_for_timeout(1200)
        ok("switching in again opens the parent view", pg.url.endswith("/parent"))
        # set a PIN, then repeat both directions
        await pg.fill(".pin-setup .pin-input","4321"); await pg.click(".pin-setup button:has-text('Set PIN')"); await pg.wait_for_timeout(1200)
        await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(300)
        await pg.locator(".view-switch").first.click(); await pg.wait_for_timeout(1200)
        ok("with a PIN set, leaving still goes to the dashboard", pg.url.endswith("/dashboard"))
        await pg.locator(".view-switch").first.click(); await pg.wait_for_timeout(800)
        ok("coming back asks for the PIN", await pg.locator(".pin-dialog[open]").count()==1)
        await pg.fill(".pin-input","4321"); await pg.click("text=Unlock"); await pg.wait_for_timeout(1000)
        ok("correct PIN opens it", pg.url.endswith("/parent"))
        # a fresh login + direct visit must ask for the PIN
        await login()
        await pg.goto(B+"/parent"); await pg.wait_for_timeout(900)
        ok("direct visit asks for the PIN", await pg.locator(".unlock .pin-input").count()==1)
        print(f"{sum(res)}/{len(res)} passed")
        await br.close()
asyncio.run(main())
