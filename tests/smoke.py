"""Ore Belt smoke tests (headless Chromium via Playwright).

Usage:
    pip install playwright && playwright install chromium
    python tests/smoke.py                 # tests ../index.html
    python tests/smoke.py --url https://jflakeee.github.io/The_Space_Game/
"""
import argparse
import pathlib
import sys
import traceback

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
UNLOCK_ALL = "()=>{localStorage.setItem('orebelt.progress',JSON.stringify({stars:[3,3,3,3,3,3,3,3,3,3]}))}"

# Helper injected into the page: place a building at world coords and report success.
PLACE = """([t,x,y])=>{const G=window.__game,S=G.S,n=S.buildings.length;
  G.setBuild(t);G.setGhostWorld(x,y);G.tryPlace();G.setBuild(null);G.update(0.01);return S.buildings.length>n}"""


def sim(page, seconds, dt=0.05):
    page.evaluate(f"()=>{{const G=window.__game;for(let i=0;i<{int(seconds / dt)}&&!G.S.over;i++)G.update({dt})}}")


def t_boot(page):
    assert page.is_visible(".ms[data-i='0']"), "mission menu not shown"


def t_all_missions_run(page):
    page.evaluate(UNLOCK_ALL)
    n = page.evaluate("()=>window.__game.MISSIONS.length")
    for mi in list(range(n)) + [-1]:
        page.evaluate(f"()=>{{window.__game.newGame({mi});window.__game.S.tut=null}}")
        sim(page, 120)
        assert page.evaluate("()=>window.__game.S.asteroids.length") > 5


def t_build_upgrade_sell(page):
    page.evaluate("()=>{const G=window.__game;G.newGame(10);G.S.tut=null;G.S.ore=99999;G.update(0.01)}")
    for t in ["laser", "solar", "battery", "missile", "slow", "arc", "decoy", "repair", "node"]:
        ok = page.evaluate("""(t)=>{const G=window.__game,S=G.S;for(let i=0;i<200;i++){const a=Math.random()*6.283,d=40+Math.random()*110,x=900+Math.cos(a)*d,y=600+Math.sin(a)*d;
          if(G.checkPlace(t,x,y).ok){G.setBuild(t);G.setGhostWorld(x,y);G.tryPlace();G.setBuild(null);G.update(0.01);return true}}return false}""", t)
        assert ok, f"could not place {t}"
    sim(page, 20)
    r = page.evaluate("""()=>{const G=window.__game,S=G.S,l=S.buildings.find(b=>b.type==='laser');
      G.upgrade(l,'lance');G.upgrade(l);return [l.lvl,l.br,S.buildings.every(b=>b.prog>=1)]}""")
    assert r == [3, "lance", True], r


def t_grid_link_cap(page):
    page.evaluate("()=>{const G=window.__game;G.newGame(10);G.S.tut=null;G.S.ore=99999;G.update(0.01)}")
    page.evaluate("""()=>{for(let i=0;i<40;i++){const a=i/40*6.283,d=50+(i%4)*25;const G=window.__game;
      G.setBuild('decoy');G.setGhostWorld(900+Math.cos(a)*d,600+Math.sin(a)*d);G.tryPlace();G.update(0.01)}window.__game.setBuild(null)}""")
    deg = page.evaluate("()=>{const S=window.__game.S;return S.deg.get(S.core)}")
    assert deg <= 20, deg


def t_instant_build(page):
    page.evaluate("()=>{SET.instant=1;const G=window.__game;G.newGame(10);G.S.tut=null;G.S.ore=999;G.update(0.01)}")
    r = page.evaluate("""()=>{const G=window.__game,S=G.S;for(let i=0;i<200;i++){const a=Math.random()*6.283,d=40+Math.random()*110,x=900+Math.cos(a)*d,y=600+Math.sin(a)*d;
      if(G.checkPlace('laser',x,y).ok){G.setBuild('laser');G.setGhostWorld(x,y);G.tryPlace();G.setBuild(null);return S.buildings[S.buildings.length-1].prog}}return -1}""")
    page.evaluate("()=>{SET.instant=0}")
    assert r == 1, r


def t_save_load(page):
    page.evaluate("()=>{const G=window.__game;G.newGame(2);G.S.tut=null;G.S.ore=999;G.update(0.01)}")
    page.evaluate(PLACE, ["laser", 960, 600])
    sim(page, 15)
    before = page.evaluate("()=>{const S=window.__game.S;saveGame();return [S.buildings.length,Math.floor(S.ore),S.mi]}")
    page.reload()
    page.click("#resume")
    after = page.evaluate("()=>{const S=window.__game.S;return [S.buildings.length,Math.floor(S.ore),S.mi]}")
    assert before == after, (before, after)


def t_daily_deterministic(page):
    a = page.evaluate("()=>{window.__game.newGame(-1);return window.__game.S.asteroids.map(a=>a.x|0).join()}")
    b = page.evaluate("()=>{window.__game.newGame(-1);return window.__game.S.asteroids.map(a=>a.x|0).join()}")
    assert a == b


def t_end_and_menu(page):
    page.evaluate("()=>{const G=window.__game;G.newGame(0);G.S.tut=null;G.S.oreMined=300;G.update(0.05)}")
    page.wait_for_selector("#tomenu", timeout=3000)
    page.click("#tomenu")
    for btn, back in [("#achBtn", "#achBack"), ("#cxBtn", "#cxBack"), ("#setBtn", "#setBack")]:
        page.click(btn)
        page.click(back)
    assert page.is_visible(".ms[data-i='0']")


TESTS = [t_boot, t_all_missions_run, t_build_upgrade_sell, t_grid_link_cap, t_instant_build, t_save_load, t_daily_deterministic, t_end_and_menu]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=(ROOT / "index.html").as_uri())
    ap.add_argument("--lang", default="ko-KR")
    args = ap.parse_args()
    failed = 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for lang in [args.lang, "en-US"]:
            for test in TESTS:
                ctx = browser.new_context(locale=lang, viewport={"width": 390, "height": 780})
                page = ctx.new_page()
                errors = []
                page.on("pageerror", lambda e: errors.append(str(e)))
                page.on("dialog", lambda d: d.accept())
                page.goto(args.url)
                page.wait_for_timeout(300)
                try:
                    test(page)
                    assert not errors, errors
                    print(f"PASS {lang:5} {test.__name__}")
                except Exception:
                    failed += 1
                    print(f"FAIL {lang:5} {test.__name__}\n{traceback.format_exc()}")
                ctx.close()
        browser.close()
    print(f"\n{len(TESTS) * 2 - failed}/{len(TESTS) * 2} passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
