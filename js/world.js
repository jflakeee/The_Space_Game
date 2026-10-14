// Ore Belt · world.js: 캔버스·카메라, 소행성 생성, 게임 상태(newGame), 전력망 계산·배치 판정
"use strict";
// ---------- canvas / camera ----------
const cv = $("c"); let ctx = cv.getContext("2d");
let cw, ch, dpr;
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cw = innerWidth; ch = innerHeight;
  cv.width = cw * dpr; cv.height = ch * dpr;
  cv.style.width = cw + "px"; cv.style.height = ch + "px";
}
addEventListener("resize", resize); resize();
const cam = { x: W / 2, y: H / 2, z: 1 };
const s2w = (x, y) => [(x - cw / 2) / cam.z + cam.x, (y - ch / 2) / cam.z + cam.y];
function clampCam() { cam.x = clamp(cam.x, 0, W); cam.y = clamp(cam.y, 0, H); }

const stars = Array.from({ length: 320 }, () => ({ x: rand(-300, W + 300), y: rand(-300, H + 300), s: rand(0.8, 2.2), a: rand(0.15, 0.7) }));

// ---------- world gen ----------
function makeAst(x, y, r) {
  const n = 9 + (Math.random() * 5 | 0);
  const ore = Math.round(r * r * 0.9);
  return { x, y, r, r0: r, ore, ore0: ore, rot: rand(0, 6.28),
    pts: Array.from({ length: n }, () => rand(0.8, 1.12)),
    veins: Array.from({ length: 3 + (Math.random() * 3 | 0) }, () => { const a = rand(0, 6.28), d = rand(0, 0.55); return [Math.cos(a) * d, Math.sin(a) * d, rand(0.08, 0.16)]; }) };
}
const MAPS = ["scatter", "ring", "cluster", "lanes"];
function genAsteroids(count = 30, layout = "scatter") {
  const A = [], cx = W / 2, cy = H / 2;
  const add = (x, y, r) => {
    if (x < r + 30 || x > W - r - 30 || y < r + 30 || y > H - r - 30) return;
    if (Math.hypot(x - cx, y - cy) < r + 90) return;
    for (const a of A) if (Math.hypot(a.x - x, a.y - y) < a.r + r + (layout === "scatter" ? 40 : 18)) return;
    A.push(makeAst(x, y, r));
  };
  const near = layout === "cluster" ? 2 : 4;
  for (let k = 0; A.length < near && k < 500; k++) { const g = rand(0, 6.28), d = rand(140, 230); add(cx + Math.cos(g) * d, cy + Math.sin(g) * d, rand(20, 30)); }
  const centers = [];
  for (let k = 0; centers.length < 4 && k < 200; k++) {
    const g = rand(0, 6.28), d = rand(380, 650), x = cx + Math.cos(g) * d * 1.2, y = cy + Math.sin(g) * d * 0.8;
    if (x > 150 && x < W - 150 && y > 150 && y < H - 150 && centers.every(c => Math.hypot(c[0] - x, c[1] - y) > 350)) centers.push([x, y]);
  }
  const lane = Math.random() < 0.5 ? 1 : -1;
  const pick = {
    scatter: () => [rand(0, W), rand(0, H)],
    ring: () => { const g = rand(0, 6.283), d = rand(300, 440); return [cx + Math.cos(g) * d * 1.45, cy + Math.sin(g) * d]; },
    cluster: () => { const c = centers[(Math.random() * centers.length) | 0], g = rand(0, 6.283), d = rand(0, 160); return [c[0] + Math.cos(g) * d, c[1] + Math.sin(g) * d]; },
    lanes: () => { const sgn = Math.random() < 0.5 ? 1 : -1, dx = 1, dy = sgn * lane * 0.6, n = Math.hypot(dx, dy), L = rand(-1000, 1000), off = rand(-60, 60);
      return [cx + dx / n * L - dy / n * off, cy + dy / n * L + dx / n * off]; },
  }[layout] || (() => [rand(0, W), rand(0, H)]);
  for (let k = 0; A.length < count && k < 6000; k++) add(...pick(), rand(16, 46));
  return A;
}

// ---------- state ----------
let S = null, uid = 1, ghost = null;
function mkB(type, x, y, built) {
  const d = DEF[type];
  return { id: uid++, type, x, y, r: d.r, maxHp: d.hp, hp: built ? d.hp : d.hp * 0.3, prog: built ? 1 : 0,
    lvl: 1, spent: d.cost, powered: false, cd: 0, ast: null, beam: null, ang: -Math.PI / 2, dead: false };
}
function newGame(mi, silent = false) {
  const m = mi === -1 ? dailyMission() : mi === -2 ? CUSTOM : MISSIONS[mi];
  S = { mi, m, t: 0, ore: m.ore ?? 120, allow: m.allow || ORDER, energy: 60, eCap: 150, oreMined: 0, wave: 0, waveT: m.firstWave, dm: m.diff * DIFFS[diffIdx], dIdx: diffIdx,
    asteroids: m.astList ? seeded(m.seed, () => m.astList.map(([x, y, r]) => makeAst(x, y, r))) : m.seed ? seeded(m.seed, () => genAsteroids(30, m.map)) : genAsteroids(m.ast || 30, m.map || MAPS[(Math.random() * MAPS.length) | 0]),
    mod: Object.assign({ spd: 1, mine: 1, solar: 1, hp: 1 }, m.mod), haz: Object.assign({}, m.haz), meteors: [], metT: 40, flare: 0, flareT: 50,
    nebulas: m.haz && m.haz.nebula ? (m.seed ? seeded(m.seed + 1, () => genNebulas(m.haz.nebula)) : genNebulas(m.haz.nebula)) : [], buildings: [], enemies: [], shots: [], fx: [], parts: [], shake: 0, links: [], lost: 0,
    dirty: true, speed: 1, paused: false, over: null, kills: 0, build: null, sel: null,
    gen: 0, usedAcc: 0, rateT: 0, useRate: 0, starved: 0 };
  S.core = mkB("core", W / 2, H / 2, true);
  S.buildings.push(S.core);
  cam.x = W / 2; cam.y = H / 2; cam.z = clamp(Math.min(cw / 560, ch / 640), 0.5, 1.4);
  ghost = null;
  $("overlay").hidden = true; $("hud").hidden = false; $("bar").hidden = false; $("info").hidden = true;
  S.tut = !silent && mi === 0 ? 0 : null; S.tutT = 0; S.saveT = 0;
  if (!silent) { clearSave(); STATS.games++; }
  buildBar(); updateCtl(); renderTip();
  if (!silent && mi !== 0) toast(`${m.goal && mi >= 0 ? mi + 1 + ". " : ""}${m.name}: ${m.desc}`, 5);
}

// ---------- grid ----------
function blocked(a, b) { for (const s of S.asteroids) if (segDist(s, a, b) < s.r * 0.8) return true; return false; }
function linkRange(a, b) {
  const ra = RELAY[a.type], rb = RELAY[b.type];
  if (!ra && !rb) return 0;
  if (ra && rb) return Math.max(st(a, "link"), st(b, "link"));
  return ra ? st(a, "link") : st(b, "link");
}
function canLink(a, b) { const R = linkRange(a, b); return R > 0 && dist(a, b) <= R && !blocked(a, b); }
function rebuildGrid() {
  if (S.core.dead) return;
  const B = S.buildings, adj = new Map(B.map(b => [b, []])), cand = [];
  S.links = [];
  for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
    const a = B[i], b = B[j];
    if (canLink(a, b)) cand.push([a, b, dist(a, b) + (RELAY[a.type] && RELAY[b.type] ? -1000 : 0)]);
  }
  cand.sort((p, q) => p[2] - q[2]);
  for (const [a, b] of cand) {
    if (adj.get(a).length >= capOf(a) || adj.get(b).length >= capOf(b)) continue;
    S.links.push([a, b, Math.random()]); adj.get(a).push(b); adj.get(b).push(a);
  }
  S.deg = new Map(B.map(b => [b, adj.get(b).length]));
  for (const b of B) b.powered = false;
  S.core.powered = true;
  const q = [S.core];
  while (q.length) {
    const n = q.shift();
    for (const m of adj.get(n)) if (!m.powered) { m.powered = true; if (RELAY[m.type] && m.prog >= 1) q.push(m); }
  }
  S.dirty = false;
}
function nearAst(p, reach = DEF.miner.reach) {
  let best = null, bd = 1e9;
  for (const a of S.asteroids) { if (a.ore <= 0) continue; const d = dist(a, p) - a.r; if (d <= reach && d < bd) { bd = d; best = a; } }
  return best;
}
function checkPlace(type, x, y) {
  const d = DEF[type], p = { type, x, y }, res = { ok: false, reason: "", links: [] };
  if (x < d.r + 10 || y < d.r + 10 || x > W - d.r - 10 || y > H - d.r - 10) { res.reason = L("맵 밖입니다", "Out of bounds"); return res; }
  for (const a of S.asteroids) if (dist(a, p) < a.r + d.r + 2) { res.reason = L("소행성 위에는 지을 수 없습니다", "Cannot build on an asteroid"); return res; }
  for (const b of S.buildings) if (dist(b, p) < b.r + d.r + 4) { res.reason = L("다른 건물과 겹칩니다", "Overlaps another building"); return res; }
  let any = false, full = false;
  for (const b of S.buildings) if (canLink(p, b)) {
    if ((S.deg?.get(b) || 0) >= capOf(b)) { if (RELAY[b.type] && b.powered) full = true; continue; }
    res.links.push(b); if (RELAY[b.type] && b.powered) any = true;
  }
  if (type === "miner" && !nearAst(p)) { res.reason = L("채굴기는 소행성 가까이에 지어야 합니다", "Miners must be next to an asteroid"); return res; }
  if (!any) { res.reason = full ? L("근처 중계기의 연결 슬롯이 가득 찼습니다", "Nearby relays have no free link slots") : L("전력망 범위 밖입니다", "Out of power grid range"); return res; }
  if (S.ore < d.cost) { res.reason = L("광석이 부족합니다", "Not enough ore"); return res; }
  res.ok = true; return res;
}
function tryPlace() {
  if (!S || !S.build || !ghost || S.over) return false;
  const c = checkPlace(S.build, ghost.x, ghost.y);
  if (!c.ok) { toast(c.reason); sfx("err"); buzz([30, 40, 30]); return false; }
  S.ore -= DEF[S.build].cost;
  const nb = mkB(S.build, ghost.x, ghost.y, !!SET.instant); S.buildings.push(nb); sfx(SET.instant ? "done" : "place"); if (SET.instant) burst(nb.x, nb.y, 10, COL.en, 70, 0.4); STATS.built++;
  S.dirty = true; buzz(15);
  if (touchUI) ghost = null;
  return true;
}
