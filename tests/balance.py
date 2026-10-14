"""Bot balance report: plays every mission N times with a heuristic bot (tests/bot.js).

Usage: python tests/balance.py [runs=3]
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
BOT = (ROOT / "tests" / "bot.js").read_text(encoding="utf-8")


def main():
    runs = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(locale="ko-KR")
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto((ROOT / "index.html").as_uri())
        names = page.evaluate("()=>window.__game.MISSIONS.map(m=>m.name)")
        print(f"{'#':>2} {'mission':14} win  results (outcome / time / wave / buildings lost)")
        for mi, name in enumerate(names):
            res = [page.evaluate(BOT, mi) for _ in range(runs)]
            wins = sum(r["over"] == "win" for r in res)
            detail = " | ".join(f"{r['over'][:4]} t{r['t']} w{r['wave']} lost{r['core']}" for r in res)
            print(f"{mi + 1:>2} {name:14} {wins}/{runs}  {detail}", flush=True)
        browser.close()
    if errors:
        print("page errors:", errors[:3])
        sys.exit(1)


if __name__ == "__main__":
    main()
