// Ore Belt · save.js: 자동 저장·이어하기, 일시정지 메뉴
"use strict";
// ---------- save / load ----------
const SAVE_KEY = "orebelt.save";
function saveGame() {
  if (!S || S.over || S.replay || S.editor || !S.core || S.core.dead) return;
  const data = { v: 3, mi: S.mi, code: S.m.custom || null, bossK: S.bossK || 0, t: S.t, ore: S.ore, energy: S.energy, oreMined: S.oreMined, wave: S.wave, waveT: S.waveT, kills: S.kills,
    ast: S.asteroids.map(a => [a.x, a.y, a.r, a.r0, a.ore, a.ore0, a.rot, a.pts, a.veins]),
    b: S.buildings.map(b => [b.type, b.x, b.y, b.hp, b.maxHp, b.prog, b.lvl, b.spent, b.cd, b.br || null]),
    e: S.enemies.map(e => [e.kind, e.x, e.y, e.hp, e.maxHp, e.hpM, e.cd, e.side, e.spawnT]), neb: S.nebulas,
    cam: [cam.x, cam.y, cam.z] };
  store.set(SAVE_KEY, JSON.stringify(data));
}
function readSave() { try { const d = JSON.parse(store.get(SAVE_KEY)); return d && d.v === 3 && (MISSIONS[d.mi] || d.mi === -1 || (d.mi === -2 && d.code && decodeMap(d.code))) ? d : null; } catch { return null; } }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch {} }
function loadGame() {
  const d = readSave(); if (!d) return;
  if (d.mi === -2) CUSTOM = customMission(decodeMap(d.code), d.code);
  newGame(d.mi, true);
  Object.assign(S, { t: d.t, ore: d.ore, energy: d.energy, oreMined: d.oreMined, wave: d.wave, waveT: d.waveT, kills: d.kills, bossK: d.bossK || 0 });
  S.asteroids = d.ast.map(([x, y, r, r0, ore, ore0, rot, pts, veins]) => ({ x, y, r, r0, ore, ore0, rot, pts, veins }));
  S.buildings = d.b.map(([type, x, y, hp, maxHp, prog, lvl, spent, cd, br]) => Object.assign(mkB(type, x, y, prog >= 1), { hp, maxHp, prog, lvl, spent, cd, br: br || null }));
  S.core = S.buildings.find(b => b.type === "core");
  if (!S.core) { clearSave(); newGame(d.mi); return; }
  if (d.neb) S.nebulas = d.neb;
  S.enemies = d.e.map(([k, x, y, hp, maxHp, hpM, cd, side, spawnT]) => Object.assign(mkE(k, x, y, hpM), { hp, maxHp, cd, side, spawnT }));
  S.dirty = true;
  [cam.x, cam.y, cam.z] = d.cam;
  toast(`${L("이어하기", "Continue")}: ${S.m.name}`);
}
addEventListener("pagehide", () => { saveGame(); saveStats(); });
document.addEventListener("visibilitychange", () => { if (document.hidden && S && !S.over) { saveGame(); if (!S.paused && $("overlay").hidden) setPause(true); } });

// ---------- pause ----------
function setPause(p) {
  if (!S || S.over) return;
  S.paused = p; updateCtl();
  const o = $("overlay");
  if (!p) { o.hidden = true; return; }
  saveGame(); toastTimer = 0; $("toast").style.opacity = 0;
  o.innerHTML = `<div class="card"><h1 style="font-size:36px">${L("일시정지", "Paused")}</h1><p>${S.m.goal && S.mi >= 0 ? S.mi + 1 + ". " : ""}${S.m.name}, ${L("웨이브", "wave")} ${S.wave}</p>
    <button class="ms" id="pResume"><b>${L("계속", "Resume")}</b></button><button class="ms" id="pRestart"><b>${L("다시 시작", "Restart")}</b></button><button class="ms" id="pCodex"><b>${L("도감", "Codex")}</b></button><button class="ms" id="pSet"><b>${L("설정", "Settings")}</b></button><button class="ms" id="pMenu"><b>${L("임무 선택", "Missions")}</b></button>
    <div class="help">${L("진행 상황은 자동 저장됩니다. 임무 선택 화면에서 이어할 수 있습니다.", "Progress is saved automatically. Continue from the mission screen.")}</div></div>`;
  o.hidden = false;
  $("pResume").onclick = () => setPause(false);
  $("pRestart").onclick = () => newGame(S.mi);
  $("pCodex").onclick = () => showCodex(() => setPause(true));
  $("pSet").onclick = () => showSettings(() => setPause(true));
  $("pMenu").onclick = () => { saveGame(); showMenu(); };
}
