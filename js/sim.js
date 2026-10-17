// Ore Belt · sim.js: 전투 헬퍼, 환경 위험, 시뮬레이션 한 틱(update)
"use strict";
// ---------- combat helpers ----------
function nearestEnemy(p, range) {
  let best = null, bd = 1e9;
  for (const e of S.enemies) { if (e.dead) continue; const d = dist(e, p) - e.r; if (d <= range && d < bd) { bd = d; best = e; } }
  return best;
}
function nearestBuilding(p) {
  let best = null, bd = 1e9;
  for (const b of S.buildings) { if (b.dead || b.type !== "decoy" || b.prog < 1 || !b.powered) continue; const d = dist(b, p); if (d <= st(b, "taunt") && d < bd) { bd = d; best = b; } }
  if (best) return best;
  for (const b of S.buildings) { if (b.dead) continue; const d = dist(b, p); if (d < bd) { bd = d; best = b; } }
  return best;
}
function boom(x, y, r, col) { S.fx.push({ x, y, r, col, t: 0, max: 0.5 }); burst(x, y, Math.min(40, Math.round(r * 0.6)), col, r * 3.5, 0.7, 2); }
function hurt(e, a) {
  if (e.dead) return;
  e.hp -= e.shielded ? a * 0.5 : a;
  if (e.hp <= 0) {
    e.dead = true; S.ore += e.bounty + (e.loot || 0); S.kills++; if (e.kind === "queen") STATS.queen = (STATS.queen || 0) + 1; if (e.loot > 1) toast(L(`훔친 광석 ${Math.floor(e.loot)} 회수`, `Recovered ${Math.floor(e.loot)} stolen ore`)); if (S.m.goal && S.m.goal.boss === e.kind) S.bossK = (S.bossK || 0) + 1; STATS.kills++; if (e.kind === "boss") STATS.boss++; if (e.kind === "dread") STATS.dread++; boom(e.x, e.y, e.r * 2.5, COL.hos);
    if (EN[e.kind].fac === "glass") burst(e.x, e.y, 8, COL.glass, 120, 0.5, 2);
    if (e.kind === "boss" || e.kind === "dread" || e.kind === "queen") { shake(e.kind === "dread" ? 14 : 12); sfx("bigboom"); burst(e.x, e.y, e.kind === "dread" ? 90 : 60, COL.ore, 240, 1.3, 3); } else sfx("kill");
    if (e.kind === "splitter") for (let i = 0; i < 3; i++) S.enemies.push(mkE("scout", e.x + rand(-14, 14), e.y + rand(-14, 14), e.hpM));
  }
}
function damageB(b, a) {
  if (b.dead) return;
  if (b === S.core && S.m.mode === "training") { b.hp = Math.max(1, b.hp - a); b.flash = 0.12; return; }
  b.hp -= a; b.flash = 0.12; sfx("hit");
  if (b.hp <= 0) {
    b.dead = true; S.dirty = true; boom(b.x, b.y, b.r * 3, COL.ore); shake(b === S.core ? 14 : 5); sfx("boom"); if (b !== S.core) { S.lost++; STATS.lost++; }
    if (S.sel === b) select(null);
    if (b === S.core) endGame(false);
  }
}
function depleted(a) { a.dead = true; boom(a.x, a.y, a.r0 * 1.2, COL.rockEdge); S.dirty = true; }
function edgePoint() {
  const s = Math.random() * 4 | 0, m = 40;
  if (s === 0) return { x: rand(0, W), y: -m };
  if (s === 1) return { x: W + m, y: rand(0, H) };
  if (s === 2) return { x: rand(0, W), y: H + m };
  return { x: -m, y: rand(0, H) };
}
function mkE(k, x, y, hpM) {
  const d = EN[k];
  return { kind: k, x, y, r: d.r, hp: d.hp * hpM, maxHp: d.hp * hpM, hpM, cd: rand(0, 1), side: Math.random() < 0.5 ? -1 : 1,
    bounty: d.bounty, ang: 0, tgt: null, rt: 0, dead: false, spawnT: 6, vT: 2, shielded: false };
}
function spawnWave() {
  S.wave++;
  const w = S.wave, c = w + (S.m.w0 || 0), hpM = (1 + 0.07 * (w - 1)) * S.dm * S.mod.hp;
  const fac = S.m.mixFrom && w >= S.m.mixFrom ? "mixed" : S.m.faction || "red";
  const red = [], glass = [], put = (arr, k, n) => { for (let i = 0; i < n; i++) arr.push(k); };
  put(red, "scout", 2 + Math.floor(c * 0.8)); put(red, "raider", Math.floor(c * 0.5)); put(red, "heavy", Math.max(0, Math.floor((c - 2) / 3)));
  if (c >= 4) put(red, "bomber", Math.floor((c - 1) / 3));
  if (c >= 5) put(red, "shield", Math.floor((c - 2) / 3));
  if (c >= 3) put(red, "splitter", Math.floor((c - 1) / 4));
  if (c >= 6) put(red, "sniper", Math.floor((c - 4) / 4));
  put(glass, "drone", 3 + c);
  if (c >= 2) put(glass, "harvester", Math.floor(c * 0.4));
  if (c >= 3) put(glass, "mender", Math.floor((c - 1) / 3));
  if (c >= 4) put(glass, "phaser", Math.floor((c - 2) / 2));
  const thin = a => a.filter((_, i) => i % 5 !== 4 && i % 5 !== 2);
  const list = fac === "glass" ? glass : fac === "mixed" ? thin(red).concat(thin(glass)) : red;
  const boss = w % 5 === 0, bossKind = fac === "glass" ? "queen" : w % 10 === 0 ? "dread" : fac === "mixed" ? "queen" : "boss";
  const groups = c >= 6 ? 2 : 1, pts = Array.from({ length: groups }, edgePoint);
  list.forEach((k, i) => { const p = pts[i % groups]; S.enemies.push(mkE(k, p.x + rand(-60, 60), p.y + rand(-60, 60), hpM)); });
  const fresh = [...new Set(list.concat(boss ? [bossKind] : []))].find(k => { try { return !(JSON.parse(store.get("orebelt.seen")) || []).includes(k); } catch { return true; } });
  if (boss) S.enemies.push(mkE(bossKind, pts[0].x, pts[0].y, hpM));
  const gb = S.m.goal && S.m.goal.boss;
  if (gb && w === S.m.goal.at) for (let i = 0; i < (S.m.goal.count || 1); i++) { const p = edgePoint(); S.enemies.push(mkE(gb, p.x, p.y, hpM)); }
  sfx("alarm"); buzz(25);
  if (fresh) { seenHint(fresh); return; }
  toast(boss ? L(`웨이브 ${w}: ${EINFO[bossKind].n()} 출현!`, `Wave ${w}: ${EINFO[bossKind].n()} incoming!`) : L(`웨이브 ${w} 접근 중 (${list.length}기)`, `Wave ${w} incoming (${list.length} ships)`), boss ? 3 : 2.2);
}
function wavesDone() { return S.m.goal && S.m.goal.waves && S.wave >= S.m.goal.waves; }

// ---------- environmental hazards ----------
function genNebulas(n) {
  const out = [];
  for (let k = 0; out.length < n && k < 400; k++) {
    const x = rand(150, W - 150), y = rand(150, H - 150), r = rand(140, 220);
    if (Math.hypot(x - W / 2, y - H / 2) < r + 110) continue;
    if (out.some(o => Math.hypot(o.x - x, o.y - y) < o.r + r * 0.6)) continue;
    out.push({ x, y, r, ph: rand(0, 6.28) });
  }
  return out;
}
const inNeb = p => S.nebulas.some(n => Math.hypot(n.x - p.x, n.y - p.y) < n.r);
function hazTick(dt) {
  const H_ = S.haz;
  if (H_.meteor && S.wave >= (H_.from || 0)) {
    if ((S.metT -= dt) <= 0) {
      S.metT = rand(22, 34);
      const n = 3 + Math.min(5, S.wave >> 2);
      for (let i = 0; i < n; i++) {
        const b = S.buildings[(Math.random() * S.buildings.length) | 0] || S.core;
        S.meteors.push({ x: clamp(b.x + rand(-170, 170), 20, W - 20), y: clamp(b.y + rand(-170, 170), 20, H - 20), t: 2.6 + rand(0, 1.4), r: 38 });
      }
      toast(L("유성우 경보! 붉은 표시 지점에 충돌합니다", "Meteor shower! Impacts at the red markers"), 3); sfx("alarm");
    }
    for (const m of S.meteors) {
      if ((m.t -= dt) > 0 || m.done) continue;
      m.done = true; boom(m.x, m.y, m.r * 1.3, COL.ore); shake(5); sfx("boom");
      for (const b of S.buildings) if (!b.dead && Math.hypot(b.x - m.x, b.y - m.y) <= m.r + b.r) damageB(b, 70);
      for (const e of S.enemies) if (!e.dead && Math.hypot(e.x - m.x, e.y - m.y) <= m.r + e.r) hurt(e, 70);
    }
    S.meteors = S.meteors.filter(m => !m.done);
  }
  if (H_.flare) {
    if (S.flare > 0) S.flare -= dt;
    else if ((S.flareT -= dt) <= 0) { S.flareT = rand(45, 60); S.flare = 12; toast(L("태양 플레어: 12초간 태양광 2배, 적 속도 +20%", "Solar flare: 12s of double solar, enemies +20% speed"), 3); sfx("alarm"); }
  }
}
function drawHazardsUnder() {
  for (const n of S.nebulas) {
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    const a = 0.22 + 0.04 * Math.sin(S.t * 0.5 + n.ph);
    g.addColorStop(0, `rgba(150,110,255,${a})`); g.addColorStop(0.7, `rgba(120,90,230,${a * 0.6})`); g.addColorStop(1, "rgba(110,80,220,0)");
    ctx.fillStyle = g; circle(n.x, n.y, n.r); ctx.fill();
  }
}
function drawHazardsOver() {
  for (const m of S.meteors) {
    const k = 0.5 + 0.5 * Math.sin(S.t * 10);
    ctx.strokeStyle = `rgba(255,90,110,${0.4 + 0.5 * k})`; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    circle(m.x, m.y, m.r); ctx.stroke(); ctx.setLineDash([]);
    if (m.t < 0.7) {
      const f = m.t / 0.7, hx = m.x + 260 * f, hy = m.y - 420 * f;
      ctx.strokeStyle = "rgba(255,200,130,.9)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 40, hy - 64); ctx.stroke();
      circle(hx, hy, 7); ctx.fillStyle = "#ffd9a0"; ctx.fill();
    }
  }
}

// ---------- update ----------
function update(dt) {
  const o = Math.random; if (S.rng) Math.random = S.rng;
  try { updateCore(dt); } finally { Math.random = o; }
  S.tick = (S.tick || 0) + 1;
}
function updateCore(dt) {
  S.t += dt; STATS.time += dt;
  if (S.dirty) rebuildGrid();
  const use = a => { if (S.energy >= a) { S.energy -= a; S.usedAcc += a; return true; } S.starved = 1; return false; };

  let gen = st(S.core, "gen"), cap = 150; S.energy += gen * dt;
  for (const b of S.buildings) {
    b.beam = null; if (b.shotT > 0) b.shotT -= dt;
    if (!b.powered) continue;
    const d = DEF[b.type];
    if (b.prog < 1) {
      b.prog = Math.min(1, b.prog + dt / d.build);
      b.hp = Math.min(b.maxHp, b.hp + b.maxHp * 0.7 * dt / d.build);
      if (b.prog >= 1) { burst(b.x, b.y, 12, COL.en, 70, 0.5); sfx("done"); if (RELAY[b.type]) S.dirty = true; }
      continue;
    }
    if (b.type === "solar") { const g = st(b, "gen") * S.mod.solar * (S.flare > 0 ? 2 : 1) * (S.nebulas.length && inNeb(b) ? 0.4 : 1); S.energy += g * dt; gen += g; }
    else if (b.type === "battery") cap += st(b, "cap");
  }
  S.gen = gen; S.eCap = cap;
  for (const e of S.enemies) e.slowF = 1;
  S.energy = Math.min(S.eCap, S.energy);

  for (const b of S.buildings) {
    if (!b.powered || b.prog < 1) continue;
    const d = DEF[b.type];
    if (b.type === "miner") {
      if (!b.ast || b.ast.ore <= 0 || b.ast.dead) b.ast = nearAst(b);
      if (b.ast) {
        b.ang = Math.atan2(b.ast.y - b.y, b.ast.x - b.x);
        if (use(st(b, "use") * dt)) {
          const m = Math.min(b.ast.ore, st(b, "rate") * S.mod.mine * dt);
          b.ast.ore -= m; S.ore += m; S.oreMined += m; STATS.ore += m; b.beam = b.ast;
          if (Math.random() < dt * 5) { const g = b.ang + Math.PI; burst(b.ast.x + Math.cos(g) * b.ast.r * 0.7, b.ast.y + Math.sin(g) * b.ast.r * 0.7, 2, COL.ore, 50, 0.4, 1.5); }
          b.ast.r = b.ast.r0 * (0.45 + 0.55 * b.ast.ore / b.ast.ore0);
          if (b.ast.ore <= 0) depleted(b.ast);
        }
      }
    } else if (b.type === "arc") {
      b.cd -= dt;
      const e0 = b.cd <= 0 ? nearestEnemy(b, st(b, "range")) : null;
      if (e0 && use(st(b, "shot"))) {
        b.cd = st(b, "reload"); const hit = [e0], pts = [[b.x, b.y], [e0.x, e0.y]]; let dmg = st(b, "dmg"), cur = e0;
        hurt(e0, dmg);
        for (let i = 1; i < st(b, "chain"); i++) {
          let nx = null, nd = 1e9;
          for (const x of S.enemies) if (!x.dead && !hit.includes(x)) { const dd = dist(x, cur); if (dd <= DEF.arc.jump && dd < nd) { nd = dd; nx = x; } }
          if (!nx) break;
          dmg *= 0.85; hurt(nx, dmg); hit.push(nx); pts.push([nx.x, nx.y]); cur = nx;
        }
        b.arcs = pts; b.arcT = 0.16; if (hit.length >= 5) ach("chain"); sfx("zap");
      }
      if (b.arcT > 0) b.arcT -= dt;
    } else if (b.type === "laser" && b.br === "lance") {
      b.cd -= dt;
      let e = null;
      for (const x of S.enemies) if (!x.dead && dist(x, b) - x.r <= st(b, "range") && (!e || x.hp > e.hp)) e = x;
      if (e) {
        b.ang = Math.atan2(e.y - b.y, e.x - b.x);
        if (b.cd <= 0 && use(st(b, "shot"))) { b.cd = st(b, "reload"); hurt(e, st(b, "dmg")); b.shotT = 0.18; b.sx = e.x; b.sy = e.y; sfx("launch"); burst(e.x, e.y, 6, "#e9fbff", 120, 0.35, 2); }
      }
    } else if (b.type === "laser") {
      const e = nearestEnemy(b, st(b, "range"));
      if (e) { b.ang = Math.atan2(e.y - b.y, e.x - b.x); if (use(st(b, "use") * dt)) { hurt(e, st(b, "dps") * dt); b.beam = e; sfx("laser"); if (Math.random() < dt * 12) burst(e.x, e.y, 1, "#e9fbff", 90, 0.3, 1.5); } }
    } else if (b.type === "missile") {
      b.cd -= dt;
      const e = nearestEnemy(b, st(b, "range"));
      if (e) {
        b.ang = Math.atan2(e.y - b.y, e.x - b.x);
        if (b.cd <= 0 && S.ore >= d.ammo) {
          S.ore -= d.ammo; b.cd = st(b, "reload"); sfx("launch");
          S.shots.push({ kind: "m", x: b.x, y: b.y, vx: Math.cos(b.ang) * 90, vy: Math.sin(b.ang) * 90, spd: 110, tgt: e, dmg: st(b, "dmg"), splash: d.splash, life: 4 });
        }
      }
    } else if (b.type === "slow") {
      const R2 = st(b, "range"), f = st(b, "slow"), inR = S.enemies.filter(e => !e.dead && dist(e, b) - e.r <= R2);
      if (inR.length && use(st(b, "use") * dt)) { for (const e of inR) e.slowF = Math.min(e.slowF, f); b.beam = b; }
    } else if (b.type === "repair") {
      let t = null, worst = 0.999;
      for (const o of S.buildings) {
        if (o === b || o.prog < 1 || o.dead) continue;
        const f = o.hp / o.maxHp;
        if (f < worst && dist(o, b) <= st(b, "range")) { worst = f; t = o; }
      }
      if (t && use(st(b, "use") * dt)) { t.hp = Math.min(t.maxHp, t.hp + st(b, "heal") * dt); b.beam = t; }
    }
  }
  S.rateT += dt;
  if (S.rateT >= 1) { S.useRate = S.usedAcc / S.rateT; S.usedAcc = 0; S.rateT = 0; S.starved = Math.max(0, S.starved - 0.5); }

  // enemies (sim)
  for (const e of S.enemies) e.shielded = false;
  for (const sh of S.enemies) if (sh.kind === "shield" && !sh.dead)
    for (const e of S.enemies) if (e !== sh && Math.hypot(e.x - sh.x, e.y - sh.y) <= EN.shield.aura) e.shielded = true;
  for (const e of S.enemies) {
    if (e.dead) continue;
    const d = EN[e.kind];
    if (!e.tgt || e.tgt.dead || (e.rt -= dt) <= 0) {
      e.rt = 1.5; e.tgt = null;
      if (e.kind === "harvester") { let bd = 1e9; for (const b of S.buildings) if (!b.dead && b.type === "miner") { const q = dist(b, e); if (q < bd) { bd = q; e.tgt = b; } } }
      if (!e.tgt) e.tgt = nearestBuilding(e);
    }
    if (!e.tgt) continue;
    const dx = e.tgt.x - e.x, dy = e.tgt.y - e.y, dd = Math.hypot(dx, dy) || 1;
    e.ang = Math.atan2(dy, dx);
    const sp = d.spd * (e.slowF || 1) * S.mod.spd * (S.flare > 0 ? 1.2 : 1) * (S.nebulas.length && inNeb(e) ? 0.7 : 1);
    if (e.kind === "bomber") {
      e.x += dx / dd * sp * dt; e.y += dy / dd * sp * dt;
      if (dd <= e.r + e.tgt.r + 2) {
        e.dead = true; boom(e.x, e.y, d.blast, COL.hos); shake(4); sfx("boom");
        for (const b of S.buildings) if (Math.hypot(b.x - e.x, b.y - e.y) <= d.blast + b.r) damageB(b, d.dmg * S.dm);
      }
      continue;
    }
    if (e.kind === "dread") {
      if ((e.vT -= dt) <= 0) {
        e.vT = 3;
        const near = S.buildings.filter(b => !b.dead && dist(b, e) <= d.range + 60).sort(() => Math.random() - 0.5).slice(0, 4);
        for (const b of near) S.shots.push({ kind: "e", x: e.x, y: e.y, vx: 0, vy: 0, spd: 220, tgt: b, dmg: 20 * S.dm, life: 4, big: true });
        if (near.length) sfx("launch");
      }
      if (e.hp < e.maxHp * 0.5 && (e.spawnT -= dt) <= 0) { e.spawnT = 10; for (let i = 0; i < 2; i++) S.enemies.push(mkE("bomber", e.x + rand(-40, 40), e.y + rand(-40, 40), e.hpM)); }
    }
    e.drain = false;
    if (e.kind === "harvester" && e.tgt.type === "miner" && dd <= d.range + e.tgt.r + 4) {
      const take = Math.min(S.ore, 4 * dt); S.ore -= take; e.loot = (e.loot || 0) + take; e.drain = true;
    }
    if (e.kind === "mender") for (const o of S.enemies) if (!o.dead && o !== e && o.hp < o.maxHp && Math.hypot(o.x - e.x, o.y - e.y) <= 100) { o.hp = Math.min(o.maxHp, o.hp + 10 * e.hpM * dt); e.heal = o; }
    if (e.kind === "phaser" && (e.blinkT = (e.blinkT ?? 3) - dt) <= 0 && dd > d.range) {
      e.blinkT = 4; const j = Math.min(110, dd - d.range * 0.8);
      burst(e.x, e.y, 6, COL.glass, 60, 0.4, 2); e.x += dx / dd * j; e.y += dy / dd * j; burst(e.x, e.y, 6, COL.glass, 60, 0.4, 2);
    }
    if (e.kind === "queen") {
      if ((e.spawnT -= dt) <= 0) { e.spawnT = 6; for (let i = 0; i < 4; i++) S.enemies.push(mkE("drone", e.x + rand(-40, 40), e.y + rand(-40, 40), e.hpM)); }
      if (S.buildings.some(b => !b.dead && dist(b, e) < 300)) { S.energy = Math.max(0, S.energy - 4 * dt); e.drain = true; }
    }
    if (e.kind === "boss" && (e.spawnT -= dt) <= 0) {
      e.spawnT = 8;
      for (let i = 0; i < 2; i++) S.enemies.push(mkE("scout", e.x + rand(-30, 30), e.y + rand(-30, 30), e.hpM));
    }
    if (dd > d.range * 0.85) { e.x += dx / dd * sp * dt; e.y += dy / dd * sp * dt; }
    else { e.x += -dy / dd * sp * 0.3 * dt * e.side; e.y += dx / dd * sp * 0.3 * dt * e.side; }
    e.cd -= dt * (0.4 + 0.6 * (e.slowF || 1));
    if (dd <= d.range && e.cd <= 0) {
      e.cd = d.rof;
      S.shots.push({ kind: "e", x: e.x, y: e.y, vx: 0, vy: 0, spd: d.bspd || 300, tgt: e.tgt, dmg: d.dmg * S.dm, life: 3, snipe: e.kind === "sniper" });
    }
  }

  // projectiles
  for (const s of S.shots) {
    if (s.dead) continue;
    if (s.tgt.dead) {
      const e = s.kind === "m" ? nearestEnemy(s, 220) : null;
      if (e) s.tgt = e; else { s.dead = true; continue; }
    }
    const dx = s.tgt.x - s.x, dy = s.tgt.y - s.y, dd = Math.hypot(dx, dy) || 1;
    if (s.kind === "m") s.spd = Math.min(340, s.spd + 400 * dt);
    if (dd <= s.spd * dt + s.tgt.r) {
      s.dead = true;
      if (s.kind === "m") {
        boom(s.tgt.x, s.tgt.y, s.splash, COL.ore); sfx("boom");
        const cx = s.tgt.x, cy = s.tgt.y, main = s.tgt;
        for (const e of S.enemies) if (!e.dead && Math.hypot(e.x - cx, e.y - cy) <= s.splash + e.r) hurt(e, e === main ? s.dmg : s.dmg * 0.6);
      } else damageB(s.tgt, s.dmg);
      continue;
    }
    const k = Math.min(1, dt * 8);
    s.vx += (dx / dd * s.spd - s.vx) * k; s.vy += (dy / dd * s.spd - s.vy) * k;
    if (s.kind === "e") { s.vx = dx / dd * s.spd; s.vy = dy / dd * s.spd; }
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.kind === "m" && Math.random() < 0.6 && S.parts.length < 700) S.parts.push({ x: s.x, y: s.y, vx: rand(-15, 15), vy: rand(-15, 15), t: 0, max: 0.45, col: "#8d93ad", s: 2 });
    if ((s.life -= dt) <= 0) s.dead = true;
  }

  stepFx(dt);
  for (const b of S.buildings) if (b.flash > 0) b.flash -= dt;
  S.enemies = S.enemies.filter(e => !e.dead);
  S.shots = S.shots.filter(s => !s.dead);
  if (S.buildings.some(b => b.dead)) S.buildings = S.buildings.filter(b => !b.dead);
  if (S.asteroids.some(a => a.dead)) S.asteroids = S.asteroids.filter(a => !a.dead);
  if (S.over) return;

  hazTick(dt);
  // waves
  if (!wavesDone() && !S.m.manual && !(S.tut != null && S.tut < 4)) { S.waveT -= dt; if (S.waveT <= 0) { spawnWave(); S.waveT = S.m.gap; } }

  const g = S.m.goal;
  if (g && g.ore && S.oreMined >= g.ore) endGame(true);
  if (g && g.waves && wavesDone() && S.enemies.length === 0) endGame(true);
  if (g && g.kills && S.kills >= g.kills) endGame(true);
  if (g && g.boss && (S.bossK || 0) >= (g.count || 1)) endGame(true);
}
