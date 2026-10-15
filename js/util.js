// Ore Belt · util.js: 공용 헬퍼, localStorage 래퍼, 다국어(L, 영어 데이터)
"use strict";
// ---------- utils ----------
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function segDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
  const t = l ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / l, 0, 1) : 0;
  return Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y);
}
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

// ---------- i18n ----------
const LANG = store.get("orebelt.lang") || ((navigator.language || "").toLowerCase().startsWith("ko") ? "ko" : "en");
const L = (ko, en) => LANG === "en" ? en : ko;
diffIdx = +(store.get("orebelt.diff") ?? 1);
if (LANG === "en") {
  const EN_B = {
    core: ["Core", "Base core. Produces energy; you lose if it is destroyed."],
    node: ["Relay", "Extends the power grid. Asteroids block links."],
    solar: ["Solar", "Generates energy."],
    battery: ["Battery", "Increases energy storage."],
    miner: ["Miner", "Mines ore from a nearby asteroid."],
    laser: ["Laser", "Short-range continuous damage. Uses energy while firing."],
    missile: ["Missile", "Long-range splash damage. Costs 2 ore per shot."],
    slow: ["Slow Field", "Slows enemy movement and fire in range. Uses energy while active."],
    repair: ["Repair Bay", "Repairs buildings in range. Uses energy while repairing."],
    arc: ["Arc Coil", "Lightning jumps between enemies, hitting several at once. Uses energy per shot."],
    decoy: ["Decoy Beacon", "Cheap, sturdy beacon that nearby enemies attack first."],
  };
  for (const k in EN_B) [DEF[k].name, DEF[k].desc] = EN_B[k];
  const EN_M = [
    ["First Dig", "Mine 300 ore. Learn the basics."],
    ["Power Shortage", "Mine 800 ore. Battery unlocked."],
    ["Hold Out", "Survive 6 waves. Repair Bay unlocked."],
    ["Missile Trial", "Survive 8 waves. Missile and Decoy unlocked."],
    ["Vein Rush", "Mine 2000 ore. Frequent raids."],
    ["Thin Belt", "Mine 1500 ore. Few asteroids."],
    ["Bomber Alert", "Survive 10 waves. Bombers arrive early. Slow Field and Arc Coil unlocked."],
    ["Shield Fleet", "Survive 12 waves. Many shield ships."],
    ["Isolated Base", "Mine 2500 ore. Low starting funds."],
    ["Last Line", "Survive 15 waves."],
    ["Cut the Supply", "Destroy 120 ships."],
    ["No Lasers", "Survive 10 waves. Lasers are unavailable."],
    ["Dark Nebula", "Mine 2500 ore. Ion nebulas dim solar panels and slow enemies."],
    ["Siege Breaker", "Destroy the dreadnought that arrives on wave 6."],
    ["Fast Raiders", "Survive 12 waves. Enemy speed +35%, solar flares."],
    ["Empty Belt", "Mine 2000 ore. Only 10 asteroids, meteor showers."],
    ["Annihilation", "Destroy 300 ships. Short wave intervals."],
    ["Armored Armada", "Survive 14 waves. Enemy HP +20%."],
    ["Twin Fortresses", "Destroy the two dreadnoughts that arrive on wave 8."],
    ["End of the Belt", "Survive 20 waves. Meteor showers and ion nebulas."],
    ["Strange Signal", "Mine 1500 ore. A new foe: the Glass Legion."],
    ["Ore Thieves", "Mine 2500 ore. Harvesters steal ore from your miners."],
    ["Phase Disruption", "Survive 12 waves. Phasers teleport forward."],
    ["Two Foes", "Survive 14 waves. Both pirate bands attack together."],
    ["Harvest Queen", "Destroy the Harvest Queen arriving on wave 8. It drains nearby power."],
    ["Endless Belt", "Endless waves. Meteor showers from wave 8, both bands from wave 10."],
  ];
  MISSIONS.forEach((m, i) => { [m.name, m.desc] = EN_M[i]; });
}
function applyStaticText() {
  document.documentElement.lang = LANG;
  $("sndHint").textContent = L("화면을 한 번 누르면 소리가 켜집니다", "Tap or click anywhere to turn on sound");
  $("homeBtn").textContent = L("기지로", "To base");
  $("oreBox").querySelector("small").textContent = L("광석", "ore");
  $("callBtn").textContent = L("웨이브 호출", "Call wave");
  $("callBtn").title = L("다음 웨이브를 바로 부르고 남은 시간만큼 광석 보너스", "Call the next wave now for an ore bonus");
  $("muteBtn").title = L("효과음", "Sound effects");
  $("spdBtn").title = L("게임 속도", "Game speed");
  $("pauseBtn").title = L("일시정지 (Space)", "Pause (Space)");
}
function setLang(l) { saveGame(); store.set("orebelt.lang", l); location.reload(); }
