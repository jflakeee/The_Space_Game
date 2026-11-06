"""Mobile layout & touch-flow audit on emulated phones/tablets (Playwright device profiles).

Usage: python tests/mobile.py [--browser chromium|webkit]
Checks per device: no horizontal overflow, tap targets >= 32px, tap-to-preview + check-button build,
info sheet stays inside the viewport, menu and pause overlays fit.
"""
import argparse
import os
import pathlib
import sys
import traceback

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEVICES = ["iPhone SE", "iPhone 13", "Pixel 7", "iPad Mini", "Galaxy S9+"]

AUDIT = """()=>{const vw=innerWidth,vh=innerHeight,bad=[];
  if(document.documentElement.scrollWidth>vw+1)bad.push('horizontal overflow '+document.documentElement.scrollWidth+'>'+vw);
  for(const b of document.querySelectorAll('button')){const r=b.getBoundingClientRect();if(!r.width||!b.offsetParent)continue;
    if(getComputedStyle(b).visibility==='hidden')continue;if(r.height<32||r.width<32)bad.push('small target '+(b.id||b.textContent.trim().slice(0,12))+' '+Math.round(r.width)+'x'+Math.round(r.height));}
  return bad}"""


def run_device(p, browser, name):
    dev = p.devices[name]
    ctx = browser.new_context(**dev, locale="ko-KR")
    page = ctx.new_page()
    page.set_default_timeout(20000)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto((ROOT / "index.html").as_uri())
    page.wait_for_timeout(400)
    problems = [f"menu: {x}" for x in page.evaluate(AUDIT)]
    page.evaluate("()=>localStorage.setItem('orebelt.settings',JSON.stringify({brief:0}))")
    page.reload()
    page.wait_for_timeout(300)
    page.tap(".ms[data-i='0']")
    page.wait_for_timeout(300)
    page.evaluate("()=>{const S=window.__game.S;S.paused=true;S.tut=null;S.ore=500;renderTip()}")
    page.tap(".bb[data-k='laser']")
    vw, vh = page.evaluate("()=>[innerWidth,innerHeight]")
    n0 = page.evaluate("()=>window.__game.S.buildings.length")
    placed = False
    for dx, dy in [(70, 0), (-70, 0), (0, 70), (0, -70), (60, 60), (-60, -60)]:
        page.touchscreen.tap(vw / 2 + dx, vh / 2 + dy)
        page.wait_for_timeout(150)
        if page.is_visible("#place") and not page.eval_on_selector("#plOk", "e=>e.disabled"):
            page.tap("#plOk")
            page.wait_for_timeout(150)
            placed = page.evaluate("()=>window.__game.S.buildings.length") == n0 + 1
            if placed:
                break
    if not placed:
        problems.append("could not build with tap + check button")
    problems += [f"game: {x}" for x in page.evaluate(AUDIT)]
    # info sheet
    page.evaluate("()=>{const G=window.__game;G.setBuild(null);for(let i=0;i<300;i++)G.simStep();select(G.S.buildings[G.S.buildings.length-1])}")
    page.wait_for_timeout(200)
    r = page.evaluate("()=>{const r=document.getElementById('info').getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]}")
    if r[0] < 0 or r[1] < 0 or r[2] > vw + 1 or r[3] > vh + 1:
        problems.append(f"info sheet outside viewport {r}")
    page.tap("#iClose")
    page.tap("#pauseBtn")
    page.wait_for_timeout(200)
    problems += [f"pause: {x}" for x in page.evaluate(AUDIT)]
    shot = ROOT / "tests" / "out" / f"{name.replace(' ', '_')}.png"
    shot.parent.mkdir(exist_ok=True)
    page.screenshot(path=str(shot))
    if errors:
        problems.append(f"page errors: {errors[:2]}")
    ctx.close()
    return problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--browser", default="chromium", choices=["chromium", "webkit"])
    args = ap.parse_args()
    failed = 0
    with sync_playwright() as p:
        browser = getattr(p, args.browser).launch()
        for name in DEVICES:
            try:
                probs = run_device(p, browser, name)
            except Exception:
                probs = [traceback.format_exc().strip().splitlines()[-1]]
            status = "PASS" if not probs else "FAIL"
            failed += bool(probs)
            print(f"{status} {name}" + "".join(f"\n   - {x}" for x in probs))
            if probs and os.environ.get("GITHUB_ACTIONS"):
                print(f"::error title=mobile {args.browser} {name}::{'; '.join(probs)[:900]}")
        browser.close()
    print(f"\n{len(DEVICES) - failed}/{len(DEVICES)} devices passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
