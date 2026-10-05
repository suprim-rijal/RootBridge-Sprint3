import asyncio, json, urllib.request
from playwright.async_api import async_playwright
B="http://localhost:5000"
def api(m,p,b=None,t=None):
    r=urllib.request.Request(B+"/api"+p,method=m,data=json.dumps(b).encode() if b is not None else None); r.add_header("Content-Type","application/json")
    if t: r.add_header("Authorization","Bearer "+t)
    return json.loads(urllib.request.urlopen(r).read())
async def main():
    t=api("POST","/auth/login",{"email":"teacher@demo.com","password":"demo123","role":"Teacher"})["token"]
    g=api("POST","/groups",{"name":"Saturday Nepali","meets":"Saturdays, 10:00","liveClassUrl":"https://zoom.us/j/123456789"},t)["data"]
    api("POST",f"/groups/{g['id']}/assignments",{"title":"Practise greetings","lessonIds":["l1-1-l1"]},t)
    l=api("POST","/auth/login",{"email":"learner@demo.com","password":"demo123","role":"NormalUser"})["token"]
    api("POST","/groups/join",{"code":g["code"]},l)
    async with async_playwright() as p:
        br=await p.chromium.launch(); problems=[]
        async def check(pg,name):
            # Does the page REALLY scroll sideways? (documentElement.scrollWidth
            # can report a clipped table, which is not a layout problem.)
            w=await pg.evaluate("(() => { window.scrollTo(9999,0); const x=window.scrollX; window.scrollTo(0,0); return window.innerWidth + x; })()"); 
            if w>391: problems.append(f"{name}: page is {w}px wide on a 390px phone")
            # every button/link has a readable name
            unnamed=await pg.evaluate("""[...document.querySelectorAll('button,a[href],input,select,textarea')].filter(e=>{
              const r=e.getBoundingClientRect(); if(!r.width) return false;
              const lab=e.getAttribute('aria-label')||e.textContent.trim()||e.getAttribute('title')||e.getAttribute('placeholder')||(e.labels&&e.labels[0]&&e.labels[0].textContent.trim())||e.getAttribute('aria-labelledby');
              return !lab && e.type!=='hidden' && e.type!=='file';}).map(e=>e.outerHTML.slice(0,80))""")
            if unnamed: problems.append(f"{name}: unlabelled controls {unnamed[:3]}")
            await pg.screenshot(path=f"/tmp/m-{name}.png", full_page=True)
        pg=await br.new_page(viewport={"width":390,"height":844})
        async def login(email,role):
            await pg.goto(B+"/login"); await pg.wait_for_timeout(300)
            await pg.select_option(".role-select",label=role); await pg.fill("input[type=email]",email); await pg.fill("input[type=password]","demo123")
            await pg.click("button[type=submit]"); await pg.wait_for_timeout(1300)
        await login("learner@demo.com","Normal")
        for path,name in [("/dashboard","dashboard"),("/classes","classes"),("/learn/language/lesson/l1-1-l1","lesson")]:
            await pg.goto(B+path); await pg.wait_for_timeout(1000)
            if name=="lesson": await pg.click("text=Start practising"); await pg.wait_for_timeout(400)
            await check(pg,name)
        await pg.evaluate("localStorage.clear()")
        await login("teacher@demo.com","Teacher")
        await check(pg,"teacher")
        await pg.goto(B+f"/teacher/classes/{g['id']}"); await pg.wait_for_timeout(1000); await check(pg,"class")
        await pg.evaluate("localStorage.clear()")
        await pg.goto(B+"/signup"); await pg.wait_for_timeout(300)
        await pg.select_option(".role-select",label="Normal"); await pg.locator("input[type=text]").nth(0).fill("Mia")
        await pg.fill("input[type=email]","mia@x.com"); await pg.fill("input[type=password]","secret1"); await pg.click("button[type=submit]"); await pg.wait_for_timeout(1400)
        await check(pg,"hub")
        print("\n".join(problems) or "no problems: no sideways scrolling, every control has a name")
        await br.close()
asyncio.run(main())
