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


def t_editor_share(page):
    page.click("#edBtn")
    code = page.evaluate("()=>{ED.asts=ED.asts.slice(0,12);ED.gi=0;edRefresh();return encodeMap(ED)}")
    page.goto(page.url.split("#")[0] + "#map=" + code)
    page.reload()
    page.click("#shPlay")
    n = page.evaluate("()=>window.__game.S.asteroids.length")
    assert n == 12, n
    sim(page, 30)


def t_hazards(page):
    r = page.evaluate("""()=>{const G=window.__game;G.newGame(19);const S=G.S;S.tut=null;G.update(0.01);
      S.metT=0.01;S.haz.flare=true;S.flareT=0.01;G.update(0.05);const m=S.meteors.length,f=S.flare>0,n=S.nebulas.length;
      for(let i=0;i<120;i++)G.update(0.05);return [m>0,f,n>0,S.meteors.length]}""")
    assert r[:3] == [True, True, True], r


def t_briefing(page):
    page.click(".ms[data-i='0']")
    page.wait_for_selector("#brGo")
    page.click("#brGo")
    assert page.evaluate("()=>window.__game.S.mi") == 0
    page.evaluate("()=>{const G=window.__game;G.S.tut=null;G.S.oreMined=300;G.update(0.05)}")
    page.wait_for_selector("#next", timeout=3000)
    page.click("#next")
    page.wait_for_selector("#brGo")


def t_replay_deterministic(page):
    r = page.evaluate("""()=>{const G=window.__game;G.newGame(3);const S=G.S;S.paused=true;
      const H=()=>{const s=G.S;return [s.tick,Math.round(s.ore*100),s.kills,s.wave,s.buildings.length,s.enemies.length,Math.round(s.enemies.reduce((a,e)=>a+e.x+e.y+e.hp,0)),s.lost].join(',')};
      const place=t=>{for(let i=0;i<200;i++){const a=Math.random()*6.283,d=40+Math.random()*140,x=900+Math.cos(a)*d,y=600+Math.sin(a)*d;if(G.checkPlace(t,x,y).ok){G.setBuild(t);G.setGhostWorld(x,y);G.tryPlace();G.setBuild(null);return}}};
      const plan=['laser','solar','laser','arc','repair','decoy'];
      for(let k=0;k<4000&&!S.over;k++){if(k%300===0&&plan.length)place(plan.shift());if(k===1000)G.doAction({k:'c'});if(k===2000){const l=S.buildings.find(b=>b.type==='laser'&&b.prog>=1);if(l)G.upgrade(l,'lance');}G.simStep();}
      const h1=H(),rec={v:1,mi:S.mi,m:null,name:S.m.name,seed:S.seed,dIdx:S.dIdx,inst:0,tut0:S.tut0,ticks:S.tick,res:'x',wave:S.wave,t:0,kills:0,a:S.rec.slice()};
      G.startReplay(replayFromCode(replayCode(rec)));const R=G.S;R.paused=true;while(R.tick<rec.ticks&&!R.over)G.simStep();
      return [h1,H(),rec.a.length]}""")
    assert r[0] == r[1] and r[2] > 0, r


def t_touch_drag_preview(page):
    r = page.evaluate("""()=>{const G=window.__game;G.newGame(3);const S=G.S;S.paused=true;S.tut=null;G.update(0.01);G.setBuild('laser');
      const c=document.getElementById('c'),ev=(t,x,y)=>c.dispatchEvent(new PointerEvent(t,{pointerId:7,pointerType:'touch',clientX:x,clientY:y,bubbles:true}));
      const w=innerWidth/2,h=innerHeight/2;
      ev('pointerdown',w+60,h);ev('pointerup',w+60,h);const g0={...G.S===S&&window.__ghost?window.__ghost:{}};
      const p0=JSON.stringify(__ghostPos());
      ev('pointerdown',w+60,h);for(let i=1;i<=6;i++)ev('pointermove',w+60+i*8,h+i*5);ev('pointerup',w+108,h+30);
      const p1=__ghostPos();
      const cam0=__camPos();ev('pointerdown',w-120,h-150);for(let i=1;i<=6;i++)ev('pointermove',w-120+i*10,h-150);ev('pointerup',w-60,h-150);
      return [JSON.parse(p0),p1,cam0,__camPos()]}""")
    (g0, g1, c0, c1) = r
    assert abs((g1[0] - g0[0]) * 1) > 10 and abs(g1[1] - g0[1]) > 5, r
    assert c0 != c1, r


def t_music_layers(page):
    r = page.evaluate("()=>{const base=clamp(Math.min(cw/560,ch/640),0.5,1.4);return [0.5,1,1.6].map(k=>{cam.z=base*k;const l=musicLayers();return [Math.round(l.low),Math.round(l.mid),Math.round(l.high)]})}")
    assert r == [[1, 0, 0], [1, 1, 0], [1, 1, 1]], r


def t_build_info(page):
    r = page.evaluate("""()=>{BUILD={time:new Date(Date.now()-3*3600e3).toISOString(),sha:'abc1234',run:5};showMenu();
      const el=document.getElementById('buildInfo');return [el.textContent, !!el.querySelector('a[href$=abc1234]')]}""")
    assert ("3" in r[0]) and ("abc1234" in r[0]) and r[1], r


def t_end_and_menu(page):
    page.evaluate("()=>{const G=window.__game;G.newGame(0);G.S.tut=null;G.S.oreMined=300;G.update(0.05)}")
    page.wait_for_selector("#tomenu", timeout=3000)
    page.click("#tomenu")
    for btn, back in [("#achBtn", "#achBack"), ("#cxBtn", "#cxBack"), ("#setBtn", "#setBack")]:
        page.click(btn)
        page.click(back)
    assert page.is_visible(".ms[data-i='0']")


TESTS = [t_boot, t_all_missions_run, t_build_upgrade_sell, t_grid_link_cap, t_instant_build, t_save_load, t_daily_deterministic, t_editor_share, t_hazards, t_briefing, t_replay_deterministic, t_touch_drag_preview, t_music_layers, t_build_info, t_end_and_menu]


def check_version_sync():
    cfg = (ROOT / "js" / "config.js").read_text(encoding="utf-8")
    sw = (ROOT / "sw.js").read_text(encoding="utf-8")
    import re
    v = re.search(r'APP_VERSION = "([^"]+)"', cfg).group(1)
    assert f'"orebelt-{v}"' in sw, f"sw.js CACHE must be orebelt-{v}"
    assert f"## [{v}]" in (ROOT / "CHANGELOG.md").read_text(encoding="utf-8"), f"CHANGELOG.md has no entry for {v}"
    log = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
    for ref in re.findall(r"^\[(\d+\.\d+\.\d+)\]: https", log, flags=re.M):
        assert f"## [{ref}]" in log, f"CHANGELOG.md link [{ref}] has no matching heading"
    assert not re.search(r"^ - \d{4}-", log, flags=re.M), "CHANGELOG.md has a heading without a version"
    print(f"PASS version sync v{v}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=(ROOT / "index.html").as_uri())
    ap.add_argument("--lang", default="ko-KR")
    args = ap.parse_args()
    failed = 0
    try:
        check_version_sync()
    except AssertionError as e:
        failed += 1
        print(f"FAIL version sync: {e}")
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
