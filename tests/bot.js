// Heuristic balance bot v2: economy first, energy budgeting, coverage-based turret placement,
// faction-aware weapon mix (lasers vs Red Swarm, arc coils vs Glass Legion swarms), decoys, slow fields, missiles, repair.
(mi) => {
  const G = window.__game; G.newGame(mi); const S = G.S; S.tut = null;
  const D = G.DEF, allow = t => S.allow.includes(t);
  const all = () => S.buildings.filter(b => !b.dead);
  const count = t => S.buildings.filter(b => b.type === t).length;
  const dC = (x, y) => Math.hypot(x - S.core.x, y - S.core.y);
  const relays = () => S.buildings.filter(b => (b.type === "core" || b.type === "node") && b.powered && b.prog >= 1);
  const ring = (cx, cy, r0, r1, n) => Array.from({ length: n }, () => { const a = Math.random() * 6.283, r = r0 + Math.random() * (r1 - r0); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const nearRelays = (r0 = 25, r1 = 140) => relays().flatMap(b => ring(b.x, b.y, r0, r1, 12));
  const place = (t, cands) => { if (!allow(t) || S.ore < D[t].cost) return false; for (const [x, y] of cands) if (G.checkPlace(t, x, y).ok) { G.setBuild(t); G.setGhostWorld(x, y); G.tryPlace(); G.setBuild(null); return true; } return false; };
  const fac = S.m.faction || "red";
  const turrets = () => S.buildings.filter(b => ["laser", "arc", "missile"].includes(b.type));
  const cover = b => turrets().filter(t => Math.hypot(t.x - b.x, t.y - b.y) < 130).length;
  const weakest = () => all().filter(b => !["laser", "arc", "missile", "decoy"].includes(b.type)).sort((p, q) => cover(p) - cover(q) || dC(q.x, q.y) - dC(p.x, p.y))[0] || S.core;
  const nextWeapon = () => {
    const n = turrets().length, glassy = fac !== "red" || S.wave >= (S.m.mixFrom || 999);
    if (!allow("laser")) return n % 3 === 2 && allow("missile") ? "missile" : "arc";
    if (allow("missile") && S.wave >= 4 && count("missile") < Math.floor(n / 4)) return "missile";
    if (allow("arc") && (glassy ? n % 2 === 1 : n % 4 === 3)) return "arc";
    return "laser";
  };
  const outward = (b, d) => { const g = Math.atan2(b.y - S.core.y, b.x - S.core.x); return ring(b.x + Math.cos(g) * d, b.y + Math.sin(g) * d, 0, 30, 10); };
  const think = () => {
    const miners = count("miner"), T = turrets().length, threat = S.enemies.some(e => dC(e.x, e.y) < 380);
    const want = 2 + Math.floor(S.wave * 1.3) + (S.m.goal && S.m.goal.boss && S.wave >= S.m.goal.at - 2 ? 4 : 0);
    // 1. economy floor
    if (miners < 2 && !threat) { if (placeMiner()) return; }
    // 2. defense when needed
    if (T < want && (threat || S.waveT < 25 || miners >= 3)) { const w = nextWeapon(), tg = weakest(); if (place(w, ring(tg.x, tg.y, 20, 65, 30).concat(nearRelays(30, 120)))) return; if (S.ore >= D[w].cost && count("node") < 3 + count("miner") && place("node", nearRelays(60, 140))) return; }
    // 3. energy
    const lowE = (S.energy < S.eCap * 0.35 && S.useRate >= S.gen * 0.7) || S.gen < 2.5 + 0.6 * miners;
    if (lowE && place("solar", nearRelays().filter(([x, y]) => !(S.nebulas || []).some(n => Math.hypot(n.x - x, n.y - y) < n.r)))) return;
    if (count("battery") < Math.floor(T / 4) && place("battery", nearRelays(20, 90))) return;
    // 4. more miners
    if (miners < Math.min(10, 4 + Math.floor(S.t / 60)) && placeMiner()) return;
    // 5. support
    if (S.wave >= 4 && count("repair") < (S.wave >= 9 ? 2 : 1) && place("repair", ring(S.core.x, S.core.y, 30, 100, 40))) return;
    if (S.wave >= 4 && count("decoy") < Math.floor(T / 6) + 1) { const o = all().filter(b => b.type !== "decoy").sort((p, q) => dC(q.x, q.y) - dC(p.x, p.y))[(Math.random() * 3) | 0]; if (o && place("decoy", outward(o, 55))) return; }
    if (S.wave >= 4 && count("slow") < Math.floor(T / 5)) { const o = weakest(); if (place("slow", outward(o, 40))) return; }
    // 6. upgrades (keep a reserve while under attack)
    if (S.ore > (threat ? 160 : 110)) {
      const lances = S.buildings.filter(b => b.br === "lance").length, lasers = count("laser");
      const pri = b => (b.type === "miner" && !threat ? 0 : ["laser", "arc", "missile"].includes(b.type) ? 1 : 2) * 3 + b.lvl;
      const pick = S.buildings.filter(b => b.prog >= 1 && b.lvl < 3 && ["laser", "arc", "missile", "miner"].includes(b.type)).sort((p, q) => pri(p) - pri(q))[0];
      if (pick) G.upgrade(pick, pick.type === "laser" && pick.lvl === 1 ? (S.wave >= 6 && lances < lasers / 3 ? "lance" : "rapid") : undefined);
    }
  };
  const placeMiner = () => {
    const c = []; for (const a of S.asteroids) if (a.ore > 0) for (let i = 0; i < 8; i++) { const g = Math.random() * 6.283; c.push([a.x + Math.cos(g) * (a.r + 16), a.y + Math.sin(g) * (a.r + 16)]); }
    c.sort((p, q) => dC(...p) - dC(...q));
    if (place("miner", c.filter(p => dC(...p) < 700))) return true;
    if (count("node") >= 3 + count("miner")) return false;
    const a = S.asteroids.filter(a => a.ore > 0 && !S.buildings.some(b => b.type === "miner" && b.ast === a)).sort((p, q) => dC(p.x, p.y) - dC(q.x, q.y))[0];
    if (!a) return false;
    const cands = relays().flatMap(r => { const g = Math.atan2(a.y - r.y, a.x - r.x); return [0, -0.4, 0.4, -0.8, 0.8].flatMap(dg => [130, 95].map(L => [r.x + Math.cos(g + dg) * L, r.y + Math.sin(g + dg) * L])); });
    cands.sort((p, q) => Math.hypot(p[0] - a.x, p[1] - a.y) - Math.hypot(q[0] - a.x, q[1] - a.y));
    return place("node", cands);
  };
  let tick = 0;
  while (!S.over && S.t < 1500) { G.update(0.05); if ((tick++ % 10) === 0) think(); }
  return { mi, over: S.over || "timeout", t: Math.round(S.t), wave: S.wave, core: S.lost, mined: Math.round(S.oreMined) };
}
