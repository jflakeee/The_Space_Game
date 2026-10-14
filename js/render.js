// Ore Belt · render.js: 월드 렌더링(draw)
"use strict";
// ---------- draw ----------
function poly(n, r, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) { const a = rot + i / n * Math.PI * 2; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  ctx.closePath();
}
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
function rangeOf(b) { const d = DEF[b.type]; return d.range ? st(b, "range") : d.link ? st(b, "link") : d.reach || 0; }

function drawB(b, ghostMode, ok) {
  const d = DEF[b.type];
  ctx.save(); ctx.translate(b.x, b.y);
  ctx.globalAlpha = ghostMode ? 0.7 : (b.prog < 1 ? 0.5 : 1);
  ctx.lineWidth = 1.6; ctx.strokeStyle = ghostMode && !ok ? COL.hos : COL.struct; ctx.fillStyle = COL.fill;
  switch (b.type) {
    case "core":
      poly(6, d.r, Math.PI / 6); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = COL.en; poly(6, d.r * 0.55, Math.PI / 6 + (S ? S.t : 0) * 0.4); ctx.stroke();
      circle(0, 0, 3); ctx.fillStyle = COL.en; ctx.fill(); break;
    case "node":
      poly(4, d.r, 0); ctx.fill(); ctx.strokeStyle = ghostMode && !ok ? COL.hos : `rgb(${COL.grid})`; ctx.stroke();
      circle(0, 0, 2); ctx.fillStyle = `rgb(${COL.grid})`; ctx.fill(); break;
    case "solar":
      ctx.fillRect(-d.r, -d.r * 0.75, d.r * 2, d.r * 1.5); ctx.strokeRect(-d.r, -d.r * 0.75, d.r * 2, d.r * 1.5);
      ctx.strokeStyle = COL.en; ctx.lineWidth = 1;
      ctx.beginPath(); for (let i = -1; i <= 1; i++) { ctx.moveTo(i * d.r * 0.5, -d.r * 0.75); ctx.lineTo(i * d.r * 0.5, d.r * 0.75); } ctx.moveTo(-d.r, 0); ctx.lineTo(d.r, 0); ctx.stroke(); break;
    case "battery": {
      ctx.fillRect(-d.r * 0.7, -d.r, d.r * 1.4, d.r * 2); ctx.strokeRect(-d.r * 0.7, -d.r, d.r * 1.4, d.r * 2);
      const f = S && S.eCap ? S.energy / S.eCap : 0.7;
      ctx.fillStyle = COL.en; ctx.fillRect(-d.r * 0.45, d.r * 0.8 - d.r * 1.6 * f, d.r * 0.9, d.r * 1.6 * f); break;
    }
    case "miner":
      circle(0, 0, d.r); ctx.fill(); ctx.stroke(); ctx.rotate(b.ang);
      ctx.beginPath(); ctx.moveTo(d.r + 6, 0); ctx.lineTo(d.r - 3, -5); ctx.lineTo(d.r - 3, 5); ctx.closePath(); ctx.fillStyle = COL.ore; ctx.fill(); break;
    case "laser":
      if (b.br === "lance") { poly(4, d.r * 1.1, 0); ctx.fill(); ctx.stroke(); } else { circle(0, 0, d.r); ctx.fill(); ctx.stroke(); }
      ctx.rotate(b.ang); ctx.strokeStyle = COL.en; ctx.beginPath();
      if (b.br === "rapid") { ctx.lineWidth = 2.5; ctx.moveTo(2, -3.5); ctx.lineTo(d.r + 5, -3.5); ctx.moveTo(2, 3.5); ctx.lineTo(d.r + 5, 3.5); }
      else if (b.br === "lance") { ctx.lineWidth = 2.5; ctx.moveTo(2, 0); ctx.lineTo(d.r + 14, 0); }
      else { ctx.lineWidth = 3.5; ctx.moveTo(2, 0); ctx.lineTo(d.r + 7, 0); }
      ctx.stroke(); break;
    case "missile":
      poly(8, d.r, Math.PI / 8); ctx.fill(); ctx.stroke(); ctx.rotate(b.ang);
      ctx.fillStyle = COL.ore; ctx.fillRect(-2, -7, d.r + 3, 4); ctx.fillRect(-2, 3, d.r + 3, 4); break;
    case "slow":
      circle(0, 0, d.r); ctx.fill(); ctx.stroke(); ctx.strokeStyle = COL.slow; ctx.lineWidth = 1.6;
      circle(0, 0, d.r * 0.55); ctx.stroke(); circle(0, 0, 2.5); ctx.fillStyle = COL.slow; ctx.fill(); break;
    case "arc":
      circle(0, 0, d.r); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "#bfe8ff"; ctx.lineWidth = 1.8; ctx.beginPath();
      ctx.moveTo(-5, -7); ctx.lineTo(1, -2); ctx.lineTo(-3, 1); ctx.lineTo(5, 7); ctx.stroke(); break;
    case "decoy": {
      poly(3, d.r * 1.2, -Math.PI / 2); ctx.fill(); ctx.stroke();
      const k = 0.5 + 0.5 * Math.sin((S ? S.t : 0) * 5); ctx.fillStyle = `rgba(232,169,81,${0.4 + 0.6 * k})`; circle(0, 1, 3); ctx.fill(); break;
    }
    case "repair":
      circle(0, 0, d.r); ctx.fill(); ctx.stroke();
      ctx.fillStyle = COL.heal; ctx.fillRect(-2, -7, 4, 14); ctx.fillRect(-7, -2, 14, 4); break;
  }
  ctx.restore();
  if (!ghostMode && b.flash > 0 && SET.flash) { ctx.globalAlpha = b.flash / 0.12 * 0.6; circle(b.x, b.y, d.r + 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.globalAlpha = 1; }
  if (ghostMode) return;
  for (let i = 1; i < (b.lvl || 1); i++) { circle(b.x - d.r + (i - 1) * 6, b.y - d.r - 5, 2); ctx.fillStyle = COL.ore; ctx.fill(); }
  if (b.prog < 1) {
    ctx.strokeStyle = COL.en; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(b.x, b.y, d.r + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * b.prog); ctx.stroke();
  }
  if (!b.powered) { circle(b.x + d.r * 0.8, b.y - d.r * 0.8, 3.5); ctx.fillStyle = COL.hos; ctx.fill(); }
  if ((SET.bars || b.hp < b.maxHp - 0.5) && b.prog >= 1 && b.maxHp > 1) bar(b.x, b.y + d.r + 6, d.r * 2, b.hp / b.maxHp, COL.heal);
}
function bar(x, y, w, f, col) {
  ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(x - w / 2, y, w, 3);
  ctx.fillStyle = col; ctx.fillRect(x - w / 2, y, w * clamp(f, 0, 1), 3);
}

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, cw, ch);
  const sk = S ? S.shake : 0, ox = rand(-sk, sk), oy = rand(-sk, sk);
  ctx.setTransform(dpr * cam.z, 0, 0, dpr * cam.z, dpr * (cw / 2 - cam.x * cam.z + ox), dpr * (ch / 2 - cam.y * cam.z + oy));
  for (const s of stars) { ctx.fillStyle = `rgba(200,215,255,${s.a})`; ctx.fillRect(s.x, s.y, s.s, s.s); }
  if (!S) return;
  const px = 1 / cam.z;
  ctx.strokeStyle = "rgba(120,150,220,.18)"; ctx.lineWidth = 2 * px; ctx.strokeRect(0, 0, W, H);

  // relay coverage in build mode
  if (S.build) {
    ctx.fillStyle = `rgba(${COL.grid},.06)`; ctx.strokeStyle = `rgba(${COL.grid},.2)`; ctx.lineWidth = px;
    for (const b of S.buildings) if (RELAY[b.type] && b.powered) { const f = (S.deg?.get(b) || 0) >= capOf(b); ctx.strokeStyle = f ? "rgba(255,90,110,.35)" : `rgba(${COL.grid},.2)`; ctx.fillStyle = f ? "rgba(255,90,110,.04)" : `rgba(${COL.grid},.06)`; circle(b.x, b.y, st(b, "link")); ctx.fill(); ctx.stroke(); }
  }

  drawHazardsUnder();
  // asteroids
  for (const a of S.asteroids) {
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot);
    ctx.beginPath();
    a.pts.forEach((k, i) => { const t = i / a.pts.length * Math.PI * 2, x = Math.cos(t) * a.r * k, y = Math.sin(t) * a.r * k; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.closePath(); ctx.fillStyle = COL.rock; ctx.fill(); ctx.strokeStyle = COL.rockEdge; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = COL.ore; ctx.globalAlpha = 0.3 + 0.55 * a.ore / a.ore0;
    for (const v of a.veins) { circle(v[0] * a.r, v[1] * a.r, v[2] * a.r); ctx.fill(); }
    ctx.restore();
  }

  // links
  ctx.lineWidth = 1.5 * px;
  for (const [a, b, ph] of S.links) {
    const live = a.powered && b.powered && (RELAY[a.type] ? a.prog >= 1 : true) && (RELAY[b.type] ? b.prog >= 1 : true);
    ctx.strokeStyle = `rgba(${COL.grid},${live ? 0.5 : 0.15})`;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    if (live) { const t = (S.t * 0.6 + ph) % 1; circle(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 1.8); ctx.fillStyle = COL.en; ctx.fill(); }
  }

  // beams
  for (const b of S.buildings) {
    if (!b.beam) continue;
    const t = b.beam;
    if (b.type === "miner") {
      const g = Math.atan2(t.y - b.y, t.x - b.x), ex = t.x - Math.cos(g) * t.r * 0.7, ey = t.y - Math.sin(g) * t.r * 0.7;
      ctx.strokeStyle = COL.ore; ctx.globalAlpha = SET.flash ? 0.4 + Math.random() * 0.5 : 0.7; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.globalAlpha = 1;
    } else if (b.type === "laser") {
      ctx.strokeStyle = "#e9fbff"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(t.x, t.y); ctx.stroke();
      ctx.strokeStyle = COL.en; ctx.globalAlpha = 0.35; ctx.lineWidth = 6; ctx.stroke(); ctx.globalAlpha = 1;
    } else if (b.type === "slow") {
      const R2 = st(b, "range");
      for (let i = 0; i < 2; i++) { const k = (S.t * 0.7 + i * 0.5) % 1; ctx.globalAlpha = 0.35 * (1 - k); ctx.strokeStyle = COL.slow; ctx.lineWidth = 2; circle(b.x, b.y, R2 * k); ctx.stroke(); }
      ctx.globalAlpha = 1;
    } else if (b.type === "repair") {
      ctx.strokeStyle = COL.heal; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.lineDashOffset = -S.t * 20;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(t.x, t.y); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  for (const b of S.buildings) if (b.arcT > 0 && b.arcs) {
    ctx.globalAlpha = b.arcT / 0.16; ctx.strokeStyle = "#e6f7ff"; ctx.lineWidth = 2; ctx.beginPath();
    b.arcs.forEach(([x, y], i) => {
      if (!i) { ctx.moveTo(x, y); return; }
      const [px, py] = b.arcs[i - 1];
      for (let k = 1; k < 4; k++) ctx.lineTo(px + (x - px) * k / 4 + rand(-6, 6), py + (y - py) * k / 4 + rand(-6, 6));
      ctx.lineTo(x, y);
    });
    ctx.stroke(); ctx.strokeStyle = "#7fd0ff"; ctx.lineWidth = 6; ctx.globalAlpha *= 0.3; ctx.stroke(); ctx.globalAlpha = 1;
  }
  for (const b of S.buildings) if (b.shotT > 0) {
    ctx.globalAlpha = b.shotT / 0.18 * (SET.flash ? 1 : 0.45); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    ctx.strokeStyle = COL.en; ctx.lineWidth = 10; ctx.globalAlpha *= 0.35; ctx.stroke(); ctx.globalAlpha = 1;
  }

  // selected range
  if (S.sel) {
    const r = rangeOf(S.sel);
    ctx.strokeStyle = "rgba(220,230,255,.35)"; ctx.lineWidth = px; ctx.setLineDash([6 * px, 6 * px]);
    if (r) { circle(S.sel.x, S.sel.y, r); ctx.stroke(); }
    ctx.setLineDash([]); ctx.strokeStyle = COL.en; ctx.lineWidth = 2 * px;
    circle(S.sel.x, S.sel.y, S.sel.r + 8); ctx.stroke();
  }

  for (const b of S.buildings) drawB(b, false);

  // enemies
  for (const e of S.enemies) {
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.ang);
    drawEnemyBody(e, S.t);
    ctx.restore();
    if (e.kind === "shield") { ctx.strokeStyle = "rgba(255,150,170,.2)"; ctx.lineWidth = 1 / cam.z; circle(e.x, e.y, EN.shield.aura); ctx.stroke(); }
    if (e.slowF < 1) { ctx.strokeStyle = COL.slow; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); circle(e.x, e.y, e.r + 7); ctx.stroke(); ctx.setLineDash([]); }
    if (e.shielded) { ctx.strokeStyle = "rgba(255,205,215,.75)"; ctx.lineWidth = 1.3; circle(e.x, e.y, e.r + 4); ctx.stroke(); }
    if (SET.bars || e.hp < e.maxHp) bar(e.x, e.y - e.r - 7, e.r * 2, e.hp / e.maxHp, COL.hos);
  }

  // shots
  for (const s of S.shots) {
    if (s.kind === "m") {
      ctx.strokeStyle = "rgba(232,169,81,.5)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.05, s.y - s.vy * 0.05); ctx.stroke();
      circle(s.x, s.y, 2.6); ctx.fillStyle = COL.ore; ctx.fill();
    } else if (s.snipe) { ctx.strokeStyle = "#ffd0d8"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - (s.tgt.x - s.x) * 0.08, s.y - (s.tgt.y - s.y) * 0.08); ctx.stroke(); }
    else { circle(s.x, s.y, s.big ? 3.5 : 2); ctx.fillStyle = s.big ? COL.hos : "#ffb0bb"; ctx.fill(); }
  }

  for (const e of S.enemies) {
    if (e.drain && e.tgt) { ctx.strokeStyle = COL.glass; ctx.globalAlpha = 0.4 + Math.random() * 0.4; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.kind === "queen" ? S.core.x : e.tgt.x, e.kind === "queen" ? S.core.y : e.tgt.y); ctx.stroke(); ctx.globalAlpha = 1; }
    if (e.kind === "mender" && e.heal && !e.heal.dead) { ctx.strokeStyle = "rgba(199,125,255,.5)"; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.heal.x, e.heal.y); ctx.stroke(); ctx.setLineDash([]); e.heal = null; }
  }
  drawHazardsOver();
  // fx
  for (const f of S.fx) {
    const k = f.t / f.max;
    ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.col; ctx.lineWidth = 2;
    circle(f.x, f.y, f.r * (0.3 + 0.7 * k)); ctx.stroke(); ctx.globalAlpha = 1;
  }
  for (const p of S.parts) { ctx.globalAlpha = 1 - p.t / p.max; ctx.fillStyle = p.col; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
  ctx.globalAlpha = 1;

  if (S.flare > 0) { ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = `rgba(255,170,60,${SET.flash ? 0.06 + 0.03 * Math.sin(S.t * 3) : 0.05})`; ctx.fillRect(0, 0, cw, ch); ctx.restore(); }
  // ghost
  let reason = "";
  if (S.build && ghost) {
    const c = checkPlace(S.build, ghost.x, ghost.y), r = rangeOf({ type: S.build });
    ctx.lineWidth = px * 1.5;
    for (const b of c.links) { ctx.strokeStyle = c.ok ? "rgba(126,224,160,.7)" : "rgba(255,90,110,.6)"; ctx.beginPath(); ctx.moveTo(ghost.x, ghost.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    if (r) { ctx.strokeStyle = c.ok ? "rgba(220,230,255,.4)" : "rgba(255,90,110,.4)"; ctx.setLineDash([6 * px, 6 * px]); circle(ghost.x, ghost.y, r); ctx.stroke(); ctx.setLineDash([]); }
    drawB({ type: S.build, x: ghost.x, y: ghost.y, r: DEF[S.build].r, ang: -Math.PI / 2, prog: 1 }, true, c.ok);
    if (!c.ok) reason = c.reason;
  }
  if (reason) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sx = (ghost.x - cam.x) * cam.z + cw / 2, sy = (ghost.y - cam.y) * cam.z + ch / 2;
    ctx.font = '12px "Chakra Petch", system-ui, sans-serif'; ctx.textAlign = "center";
    ctx.fillStyle = "rgba(14,20,52,.85)"; const w = ctx.measureText(reason).width + 12;
    const tx = clamp(sx, w / 2 + 6, cw - w / 2 - 6), ty = clamp(sy + 22, 6, ch - 110);
    ctx.fillRect(tx - w / 2, ty, w, 20); ctx.fillStyle = COL.hos; ctx.fillText(reason, tx, ty + 14);
  }
}
