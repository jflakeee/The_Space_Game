// Ore Belt · daily.js: 일일 도전: 날짜 시드, 변형 규칙
"use strict";
// ---------- daily challenge ----------
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const MODS = [
  { ko: "빠른 해적: 적 이동 +30%", en: "Fast pirates: enemy speed +30%", spd: 1.3 },
  { ko: "빈약한 광맥: 채굴 -30%", en: "Poor veins: mining -30%", mine: 0.7 },
  { ko: "희미한 별빛: 태양광 -30%", en: "Dim star: solar -30%", solar: 0.7 },
  { ko: "중장갑: 적 체력 +25%", en: "Heavy armor: enemy HP +25%", hp: 1.25 },
  { ko: "넉넉한 자금: 시작 광석 400", en: "Rich start: 400 starting ore", ore: 400 },
  { ko: "강행군: 웨이브 간격 -25%", en: "Rush: wave interval -25%", gap: 0.75 },
  { ko: "유성우", en: "Meteor showers", haz: ["meteor", true] },
  { ko: "이온 성운", en: "Ion nebulas", haz: ["nebula", 3] },
  { ko: "태양 플레어", en: "Solar flares", haz: ["flare", true] },
];
function todayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function dailyMission(key = todayKey()) {
  let seed = 7; for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  const r = mulberry32(seed), map = MAPS[(r() * MAPS.length) | 0];
  const i1 = (r() * MODS.length) | 0; let i2 = (r() * (MODS.length - 1)) | 0; if (i2 >= i1) i2++;
  const fr = r(), faction = fr < 0.3 ? "glass" : fr < 0.45 ? "mixed" : "red";
  const mods = [MODS[i1], MODS[i2]], prod = k => mods.reduce((a, m) => a * (m[k] || 1), 1);
  return { daily: key, seed, name: `${L("일일 도전", "Daily Challenge")} ${key}`, desc: [faction === "glass" ? L("유리 군단", "Glass Legion") : faction === "mixed" ? L("두 해적단", "Both bands") : L("붉은 무리", "Red Swarm"), ...mods.map(m => L(m.ko, m.en))].join(" / "), faction,
    goal: null, firstWave: 45, gap: Math.round(34 * prod("gap")), diff: 1.1, map, ore: (mods.find(m => m.ore) || {}).ore,
    mod: { spd: prod("spd"), mine: prod("mine"), solar: prod("solar"), hp: prod("hp") }, haz: Object.fromEntries(mods.filter(m => m.haz).map(m => m.haz)), allow: ALL };
}
function dailyBest() { try { const d = JSON.parse(store.get("orebelt.daily")); return d && d.key === todayKey() ? d.best : 0; } catch { return 0; } }
function seeded(seed, fn) { const orig = Math.random; Math.random = mulberry32(seed); try { return fn(); } finally { Math.random = orig; } }

// ---------- classic modes (training / mining time attack) ----------
// Inspired by the original's mode line-up (training, mining, survival); rules are Ore Belt's own.
function trainingMission() {
  return { mode: "training", name: L("훈련", "Training"), desc: L("코어가 파괴되지 않는 연습장. 적은 '웨이브 호출'로만 옵니다.", "Practice field: the core can't be destroyed and enemies only come when you call a wave."),
    goal: null, manual: true, firstWave: 1e9, gap: 1e9, diff: 0.8, ore: 1500, map: "scatter", allow: ALL };
}
function miningMission() {
  return { mode: "mining", name: L("채굴 타임어택", "Mining time attack"), desc: L("광석 3000을 최대한 빨리 채굴하세요. 해적은 가끔, 약하게 옵니다.", "Mine 3000 ore as fast as you can. Occasional light raids."),
    goal: { ore: 3000 }, firstWave: 70, gap: 55, diff: 0.7, ore: 150, map: MAPS[(Math.random() * MAPS.length) | 0], allow: ALL };
}
const miningBest = () => +(store.get("orebelt.mining") || 0);
const mmss = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
