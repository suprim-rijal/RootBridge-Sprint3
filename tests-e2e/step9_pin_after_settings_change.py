import asyncio
from playwright.async_api import async_playwright
B="http://localhost:5000"
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(); pg=await br.new_page(viewport={"width":1280,"height":900})
        pg.on("response", lambda r: print("   API", r.status, r.url.split("/api")[-1]) if "/api/" in r.url and r.request.method!="GET" else None)
        await pg.goto(B+"/login"); await pg.wait_for_timeout(400)
        await pg.select_option(".role-select", label="Child/Parent")
        await pg.fill("input[type=email]","family@demo.com"); await pg.fill("input[type=password]","demo123")
        await pg.click("button[type=submit]"); await pg.wait_for_timeout(1500)
        print("1. open parent view + set PIN")
        await pg.goto(B+"/parent"); await pg.wait_for_timeout(800)
        await pg.click("button:has-text('Open parent view')"); await pg.wait_for_timeout(1000)
        await pg.fill(".pin-setup .pin-input","4321"); await pg.click(".pin-setup button:has-text('Set PIN')"); await pg.wait_for_timeout(1200)
        print("2. change the language in the parent profile")
        await pg.goto(B+"/parent/profile"); await pg.wait_for_timeout(1000)
        sel = pg.locator("section[aria-labelledby=acct-language] select")
        print("   language selects found:", await sel.count())
        if await sel.count():
            await sel.first.select_option("finnish"); await pg.wait_for_timeout(1500)
        print("3. switch to child, then back to parent")
        await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(300)
        await pg.locator(".view-switch").first.click(); await pg.wait_for_timeout(1200)
        print("   url:", pg.url)
        await pg.locator(".view-switch").first.click(); await pg.wait_for_timeout(900)
        print("   PIN dialog:", await pg.locator(".pin-dialog[open]").count())
        await pg.fill(".pin-input","4321"); await pg.click("text=Unlock"); await pg.wait_for_timeout(1200)
        print("4. after entering 4321 ->", pg.url)
        print("   dialog text:", (await pg.inner_text(".pin-dialog")).replace("\n"," / ")[:120] if await pg.locator(".pin-dialog[open]").count() else "(closed)")
        await br.close()
asyncio.run(main())
