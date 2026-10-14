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
  const mods = [MODS[i1], MODS[i2]], prod = k => mods.reduce((a, m) => a * (m[k] || 1), 1);
  return { daily: key, seed, name: `${L("일일 도전", "Daily Challenge")} ${key}`, desc: mods.map(m => L(m.ko, m.en)).join(" / "),
    goal: null, firstWave: 45, gap: Math.round(34 * prod("gap")), diff: 1.1, map, ore: (mods.find(m => m.ore) || {}).ore,
    mod: { spd: prod("spd"), mine: prod("mine"), solar: prod("solar"), hp: prod("hp") }, haz: Object.fromEntries(mods.filter(m => m.haz).map(m => m.haz)), allow: ALL };
}
function dailyBest() { try { const d = JSON.parse(store.get("orebelt.daily")); return d && d.key === todayKey() ? d.best : 0; } catch { return 0; } }
function seeded(seed, fn) { const orig = Math.random; Math.random = mulberry32(seed); try { return fn(); } finally { Math.random = orig; } }
