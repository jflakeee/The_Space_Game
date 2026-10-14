// Ore Belt · input.js: 마우스·터치·키보드 입력, 모바일 설치 확인
"use strict";
// ---------- input ----------
const ptrs = new Map();
let gest = null, touchUI = false;
addEventListener("pointerdown", e => { touchUI = e.pointerType !== "mouse"; }, true);
function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch {} }
function setGhost(sx, sy) { const [x, y] = s2w(sx, sy); ghost = { x, y }; }
function tap(sx, sy, touch) {
  if (!S || S.over) return;
  const [x, y] = s2w(sx, sy);
  let hit = null, bd = 1e9;
  for (const b of S.buildings) { const d = Math.hypot(b.x - x, b.y - y); if (d <= b.r + (touch ? 24 : 10) / cam.z && d < bd) { bd = d; hit = b; } }
  select(hit);
}
cv.addEventListener("pointerdown", e => {
  try { cv.setPointerCapture(e.pointerId); } catch {}
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  touchUI = e.pointerType !== "mouse";
  if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()];
    gest = { mode: "pinch", d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: cam.z, m0: s2w((a.x + b.x) / 2, (a.y + b.y) / 2) };
    return;
  }
  if (ptrs.size > 2) return;
  const panBtn = e.button === 1 || e.button === 2;
  // mouse: click places directly.
  // touch: tap sets the preview, dragging the preview moves it, dragging elsewhere pans, the check button confirms
  let mode = S && S.build && !panBtn && !touchUI ? "ghost" : "pan", off = null;
  if (S && S.build && touchUI && ghost) {
    const gx = (ghost.x - cam.x) * cam.z + cw / 2, gy = (ghost.y - cam.y) * cam.z + ch / 2;
    if (Math.hypot(e.clientX - gx, e.clientY - gy) <= Math.max(44, (DEF[S.build].r + 18) * cam.z)) { mode = "gdrag"; off = [gx - e.clientX, gy - e.clientY]; }
  }
  gest = { mode, off, sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, moved: false, touch: touchUI };
  if (mode === "ghost") setGhost(e.clientX, e.clientY);
});
cv.addEventListener("pointermove", e => {
  if (!ptrs.has(e.pointerId)) { if (e.pointerType === "mouse" && S && S.build) { touchUI = false; setGhost(e.clientX, e.clientY); } return; }
  const p = ptrs.get(e.pointerId); p.x = e.clientX; p.y = e.clientY;
  if (!gest) return;
  if (gest.mode === "pinch") {
    if (ptrs.size < 2) return;
    const [a, b] = [...ptrs.values()];
    cam.z = clamp(gest.z0 * Math.hypot(a.x - b.x, a.y - b.y) / gest.d0, ZMIN, ZMAX);
    cam.x = gest.m0[0] - ((a.x + b.x) / 2 - cw / 2) / cam.z;
    cam.y = gest.m0[1] - ((a.y + b.y) / 2 - ch / 2) / cam.z;
    clampCam(); return;
  }
  if (Math.hypot(e.clientX - gest.sx, e.clientY - gest.sy) > (gest.touch ? 10 : 6)) gest.moved = true;
  if (gest.mode === "pan") { if (gest.moved) { cam.x -= (e.clientX - gest.lx) / cam.z; cam.y -= (e.clientY - gest.ly) / cam.z; clampCam(); } }
  else if (gest.mode === "gdrag") setGhost(e.clientX + gest.off[0], e.clientY + gest.off[1]);
  else setGhost(e.clientX, e.clientY);
  gest.lx = e.clientX; gest.ly = e.clientY;
});
function endPtr(e) {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (!gest) return;
  if (gest.mode === "pinch") { if (ptrs.size === 0) gest = null; return; }
  if (e.type === "pointerup") {
    if (gest.mode === "ghost") tryPlace();
    else if (gest.mode === "gdrag") { if (gest.moved) buzz(8); }
    else if (!gest.moved) {
      if (S && S.editor) edTap(e.clientX, e.clientY);
      else if (S && S.build && gest.touch) { setGhost(e.clientX, e.clientY); buzz(8); }
      else tap(e.clientX, e.clientY, gest.touch);
    }
  }
  gest = null;
}
cv.addEventListener("pointerup", endPtr);
cv.addEventListener("pointercancel", endPtr);
cv.addEventListener("pointerleave", e => { if (e.pointerType === "mouse" && !ptrs.size) ghost = null; });
cv.addEventListener("contextmenu", e => e.preventDefault());
cv.addEventListener("wheel", e => {
  e.preventDefault();
  const [wx, wy] = s2w(e.clientX, e.clientY);
  cam.z = clamp(cam.z * Math.exp(-e.deltaY * 0.0015), ZMIN, ZMAX);
  cam.x = wx - (e.clientX - cw / 2) / cam.z; cam.y = wy - (e.clientY - ch / 2) / cam.z; clampCam();
}, { passive: false });
addEventListener("keydown", e => {
  if (!S || S.over || S.editor || S.replay) return;
  if (S.paused && $("pResume") && !$("overlay").hidden) {
    if (e.key === " " || e.key === "Escape") { e.preventDefault(); setPause(false); }
    return;
  }
  if (!$("overlay").hidden) return;
  if (/^[0-9]$/.test(e.key) && S.allow[(+e.key + 9) % 10]) { const k = S.allow[(+e.key + 9) % 10]; setBuild(S.build === k ? null : k); }
  else if (e.key === "u" || e.key === "U") upgrade(S.sel);
  else if ((e.key === "r" || e.key === "R") && S.sel && S.sel.type === "laser" && S.sel.lvl === 1) upgrade(S.sel, "rapid");
  else if ((e.key === "l" || e.key === "L") && S.sel && S.sel.type === "laser" && S.sel.lvl === 1) upgrade(S.sel, "lance");
  else if (e.key === "Escape") { if (S.build || S.sel) { setBuild(null); select(null); } else setPause(true); }
  else if (e.key === " ") { e.preventDefault(); setSpeed(S.speed ? 0 : (S.lastSpd || 1)); }
});
