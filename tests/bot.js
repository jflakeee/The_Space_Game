(mi) => {
 const G = window.__game; G.newGame(mi); const S = G.S; S.tut = null;
 const D = G.DEF, allow = t => S.allow.includes(t);
 const count = t => S.buildings.filter(b => b.type === t).length;
 const relays = () => S.buildings.filter(b => (b.type === 'core' || b.type === 'node') && b.powered && b.prog >= 1);
 const place = (t, cands) => { for (const [x, y] of cands) if (G.checkPlace(t, x, y).ok) { G.setBuild(t); G.setGhostWorld(x, y); G.tryPlace(); G.setBuild(null); return true; } return false; };
 const ring = (cx, cy, r0, r1, n) => Array.from({ length: n }, () => { const a = Math.random() * 6.283, r = r0 + Math.random() * (r1 - r0); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
 const nearCore = (r0, r1) => ring(S.core.x, S.core.y, r0, r1, 60);
 const nearRelays = () => relays().flatMap(b => ring(b.x, b.y, 20, 140, 15));
 const dC = (x, y) => Math.hypot(x - S.core.x, y - S.core.y);
 const think = () => {
   const net = S.gen - S.useRate, lasers = count('laser'), miners = count('miner');
   const wantDef = 2 + Math.floor(S.wave * 1.2);
   const threat = S.enemies.some(e => dC(e.x, e.y) < 350);
   if (lasers < wantDef && S.ore >= D.laser.cost && (miners >= 2 || threat) && (threat || S.waveT < 25 || lasers < wantDef - 1)) { const L = S.buildings.filter(b => b.type === 'laser' || b.type === 'missile');
       const cov = b => L.filter(l => Math.hypot(l.x - b.x, l.y - b.y) < (l.type === 'laser' ? 110 : 200)).length;
       const tg = S.buildings.filter(b => b.type !== 'laser').sort((p, q) => cov(p) - cov(q) || dC(q.x, q.y) - dC(p.x, p.y))[0] || S.core;
       if (place('laser', ring(tg.x, tg.y, 22, 60, 40).concat(nearCore(40, 115)))) return; if (S.ore >= D.node.cost && place('node', nearRelays())) return; }
   if (net < 0.5 && S.energy < 60 && S.ore >= D.solar.cost) if (place('solar', nearRelays())) return;
   if (miners < 3 + Math.floor(S.t / 90) && S.ore >= D.miner.cost) {
     const c = []; for (const a of S.asteroids) for (let i = 0; i < 8; i++) { const g = Math.random() * 6.283; c.push([a.x + Math.cos(g) * (a.r + 16), a.y + Math.sin(g) * (a.r + 16)]); }
     c.sort((p, q) => dC(...p) - dC(...q)); while (c.length && dC(...c[c.length-1]) > 420) c.pop();
     if (place('miner', c)) return;
     if (S.ore >= D.node.cost) {
       const a = S.asteroids.filter(a => a.ore > 0 && !S.buildings.some(b => b.type === 'miner' && b.ast === a)).sort((p, q) => dC(p.x, p.y) - dC(q.x, q.y))[0];
       if (a) {
         const cands = relays().flatMap(r => { const g = Math.atan2(a.y - r.y, a.x - r.x); return [0, -0.4, 0.4, -0.8, 0.8].flatMap(dg => [130, 95].map(L => [r.x + Math.cos(g + dg) * L, r.y + Math.sin(g + dg) * L])); });
         cands.sort((p, q) => Math.hypot(p[0] - a.x, p[1] - a.y) - Math.hypot(q[0] - a.x, q[1] - a.y));
         if (place('node', cands)) return;
       }
     }
   }
   if (allow('battery') && count('battery') < Math.floor(lasers / 3) && S.ore >= D.battery.cost) if (place('battery', nearRelays())) return;
   if (allow('repair') && S.wave >= 3 && count('repair') < 1 + Math.floor(S.wave / 6) && S.ore >= D.repair.cost) if (place('repair', nearCore(30, 90))) return;
   if (allow('missile') && S.wave >= 3 && count('missile') < Math.floor(S.wave / 2) && S.ore >= D.missile.cost) if (place('missile', nearCore(50, 140))) return;
   if (S.ore > 250) { const b = S.buildings.filter(b => ['laser', 'missile', 'miner', 'solar'].includes(b.type) && b.lvl < 3 && b.prog >= 1).sort((p, q) => p.lvl - q.lvl)[0]; if (b) G.upgrade(b, b.type === 'laser' && b.lvl === 1 ? (Math.random() < 0.6 ? 'rapid' : 'lance') : undefined); }
 };
 let tick = 0;
 while (!S.over && S.t < 1500) { G.update(0.05); if ((tick++ % 10) === 0) think(); }
 return { mi, over: S.over || 'timeout', t: Math.round(S.t), wave: S.wave, core: S.lost, mined: Math.round(S.oreMined) };
}
