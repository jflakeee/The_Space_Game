// Ore Belt · main.js: 메인 루프와 부팅, 테스트용 window.__game
"use strict";
// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (S && !S.paused && !S.over) { let t = dt * S.speed; while (t > 1e-6) { const s = Math.min(t, 0.025); update(s); t -= s; if (S.over) break; } }
  else if (S && S.over) stepFx(dt);
  keyPan(dt);
  if (S && S.shake > 0) S.shake = Math.max(0, S.shake - dt * 30);
  draw(); hudTick(dt); musicTick(); placeUI();
  requestAnimationFrame(frame);
}
applyStaticText(); saveSet();
showMenu();
requestAnimationFrame(frame);
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
window.__game = { get S() { return S; }, newGame, update, setBuild, tryPlace, checkPlace, upgrade, DEF, MISSIONS, setGhostWorld(x, y) { ghost = { x, y }; } };
