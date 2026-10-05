import asyncio, json, urllib.request
from playwright.async_api import async_playwright
B="http://localhost:5000"
def api(m,p,b=None,t=None):
    r=urllib.request.Request(B+"/api"+p,method=m,data=json.dumps(b).encode() if b is not None else None)
    r.add_header("Content-Type","application/json")
    if t: r.add_header("Authorization","Bearer "+t)
    return json.loads(urllib.request.urlopen(r).read())
async def main():
    t=api("POST","/auth/login",{"email":"teacher@demo.com","password":"demo123","role":"Teacher"})["token"]
    g=api("POST","/groups",{"name":"Saturday Nepali","meets":"Saturdays, 10:00"},t)["data"]
    api("PATCH",f"/groups/{g['id']}",{"discoverable":True,"about":"Beginner Nepali for children in Espoo."},t)
    problems=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(); pg=await br.new_page(viewport={"width":390,"height":844})
        async def check(name):
            # Does the page REALLY scroll sideways? (documentElement.scrollWidth
            # can report a clipped table, which is not a layout problem.)
            w=await pg.evaluate("(() => { window.scrollTo(9999,0); const x=window.scrollX; window.scrollTo(0,0); return window.innerWidth + x; })()")
            if w>391: problems.append(f"{name}: {w}px wide")
            await pg.screenshot(path=f"/tmp/m2-{name}.png", full_page=True)
        async def login(email, role):
            await pg.goto(B+"/"); await pg.evaluate("localStorage.clear()")
            await pg.goto(B+"/login"); await pg.wait_for_timeout(400)
            await pg.select_option(".role-select", label=role)
            await pg.fill("input[type=email]",email); await pg.fill("input[type=password]","demo123")
            await pg.click("button[type=submit]"); await pg.wait_for_timeout(1500)
        await login("learner@demo.com","Normal")
        await pg.goto(B+"/classes"); await pg.wait_for_timeout(1500); await check("find-class")
        await login("family@demo.com","Child/Parent")
        await pg.goto(B+"/parent"); await pg.wait_for_timeout(1000); await check("unlock")
        await pg.click("button:has-text('Open parent view')"); await pg.wait_for_timeout(1200); await check("parent-pin")
        print("\n".join(problems) or "no sideways scrolling on any new screen")
        await br.close()
asyncio.run(main())
