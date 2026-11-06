"""Accessibility audit with axe-core on the main screens (menu, settings, codex, game HUD, pause, result).

Usage:
    npm i axe-core@4.10.0          # provides node_modules/axe-core/axe.min.js
    python tests/a11y.py           # fails on serious/critical violations, lists the rest
"""
import os
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
AXE_PATHS = [ROOT / "node_modules/axe-core/axe.min.js", pathlib.Path(os.environ.get("AXE_PATH", "/nonexistent"))]


def audit(page, axe):
    page.add_script_tag(content=axe)
    return page.evaluate("""async()=>{const r=await axe.run(document,{resultTypes:['violations']});
      return r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,help:v.help,target:v.nodes[0].target.join(' ')}))}""")


def main():
    axe_file = next((p for p in AXE_PATHS if p.exists()), None)
    if not axe_file:
        print("axe-core not found: run `npm i axe-core@4.10.0` first")
        sys.exit(2)
    axe = axe_file.read_text(encoding="utf-8")
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch()
        for lang in ["ko-KR", "en-US"]:
            page = b.new_page(viewport={"width": 390, "height": 780}, locale=lang)
            page.goto((ROOT / "index.html").as_uri())
            page.evaluate("()=>localStorage.setItem('orebelt.settings',JSON.stringify({brief:0}))")
            page.reload()
            page.wait_for_timeout(300)
            screens = {
                "menu": lambda: None,
                "settings": lambda: page.click("#setBtn"),
                "codex": lambda: (page.click("#setBack"), page.click("#cxBtn")),
                "game": lambda: (page.click("#cxBack"), page.click(".ms[data-i='0']"), page.evaluate("()=>{window.__game.S.paused=true}")),
                "pause": lambda: (page.evaluate("()=>{window.__game.S.paused=false}"), page.click("#pauseBtn")),
                "result": lambda: (page.click("#pResume"), page.evaluate("()=>{const G=window.__game;G.S.oreMined=300;G.update(0.05)}"), page.wait_for_timeout(1200)),
            }
            for name, go in screens.items():
                go()
                page.wait_for_timeout(250)
                for v in audit(page, axe):
                    severe = v["impact"] in ("serious", "critical")
                    bad += severe
                    print(f"{'FAIL' if severe else 'note'} {lang} {name}: [{v['impact']}] {v['id']} x{v['n']} — {v['help']} ({v['target']})")
                    if severe and os.environ.get("GITHUB_ACTIONS"):
                        print(f"::error title=a11y {lang} {name} {v['id']}::{v['help']} ({v['target']})")
            page.close()
        b.close()
    print(f"\n{'OK' if not bad else f'{bad} serious/critical violation(s)'}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
