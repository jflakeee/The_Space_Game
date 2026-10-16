// Ore Belt · main.js: 메인 루프와 부팅, 테스트용 window.__game
"use strict";
// ---------- loop ----------
let last = performance.now(), frames = 0;
// Frame pacing: optional 30/60 fps cap, and the menu / paused screens redraw at ~15 fps to save battery.
function frameBudget() {
  const idle = !S || S.paused || S.over || !$("overlay").hidden;
  const cap = SET.fps ? 1000 / SET.fps : 0;
  return Math.max(cap, idle ? 1000 / 15 : 0);
}
function frame(now) {
  requestAnimationFrame(frame);
  if (now - last < frameBudget() - 2) return;
  frames++;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (S && !S.paused && !S.over) { S.acc = Math.min((S.acc || 0) + dt * S.speed, STEP * 40); while (S.acc >= STEP && S && !S.over) { simStep(); S.acc -= STEP; } }
  else if (S && S.over) stepFx(dt);
  keyPan(dt);
  if (S && S.shake > 0) S.shake = Math.max(0, S.shake - dt * 30);
  draw(); hudTick(dt); rpTick(); musicTick(); placeUI();
}
applyStaticText(); saveSet();
showMenu();
loadBuildInfo();
auInit(); // succeeds right away where the browser allows autoplay; otherwise the first tap/click unlocks audio
requestAnimationFrame(frame);
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
window.__game = { get S() { return S; }, newGame, update, simStep, startReplay, doAction, setBuild, tryPlace, checkPlace, upgrade, DEF, MISSIONS, setGhostWorld(x, y) { ghost = { x, y }; } };
// test helpers
window.__ghostPos = () => ghost ? [ghost.x, ghost.y] : null;
window.__camPos = () => [cam.x, cam.y];
window.__frames = () => frames;
