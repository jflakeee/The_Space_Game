// Ore Belt · main.js: 메인 루프와 부팅, 테스트용 window.__game
"use strict";
// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (S && !S.paused && !S.over) { S.acc = Math.min((S.acc || 0) + dt * S.speed, STEP * 40); while (S.acc >= STEP && S && !S.over) { simStep(); S.acc -= STEP; } }
  else if (S && S.over) stepFx(dt);
  keyPan(dt);
  if (S && S.shake > 0) S.shake = Math.max(0, S.shake - dt * 30);
  draw(); hudTick(dt); rpTick(); musicTick(); placeUI();
  requestAnimationFrame(frame);
}
applyStaticText(); saveSet();
showMenu();
requestAnimationFrame(frame);
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
window.__game = { get S() { return S; }, newGame, update, simStep, startReplay, doAction, setBuild, tryPlace, checkPlace, upgrade, DEF, MISSIONS, setGhostWorld(x, y) { ghost = { x, y }; } };
// test helpers
window.__ghostPos = () => ghost ? [ghost.x, ghost.y] : null;
window.__camPos = () => [cam.x, cam.y];
