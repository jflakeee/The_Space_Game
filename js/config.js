// Ore Belt · config.js: 건물·적·임무 정의(DEF, EN, MISSIONS)와 레벨별 수치 계산(st)
"use strict";
const APP_VERSION = "1.1.1";
const REPO_URL = "https://github.com/jflakeee/The_Space_Game";
// ---------- config ----------
const W = 1800, H = 1200, ZMIN = 0.3, ZMAX = 2.5;
const RELAY = { core: 1, node: 1 };
const DEF = {
  core:    { name: "코어",   cost: 0,  hp: 600, r: 22, link: 160, build: 0, desc: "기지 본체. 에너지를 생산하며, 파괴되면 패배." },
  node:    { name: "중계기", cost: 15, hp: 80,  r: 8,  link: 150, build: 2, desc: "전력망을 확장. 소행성이 연결을 가립니다." },
  solar:   { name: "태양광", cost: 30, hp: 90,  r: 12, build: 4, gen: 1.6, desc: "에너지 생산." },
  battery: { name: "배터리", cost: 50, hp: 100, r: 11, build: 4, cap: 100, desc: "에너지 저장량 증가." },
  miner:   { name: "채굴기", cost: 40, hp: 110, r: 11, build: 5, use: 0.6, rate: 2.2, reach: 70, desc: "가까운 소행성에서 광석 채굴." },
  laser:   { name: "레이저", cost: 60, hp: 140, r: 12, build: 6, range: 150, dps: 25, use: 2.5, desc: "근거리 지속 피해. 사격 중 에너지 소모." },
  missile: { name: "미사일", cost: 90, hp: 150, r: 13, build: 8, range: 240, dmg: 45, splash: 45, reload: 2.2, ammo: 2, desc: "장거리 범위 피해. 발사당 광석 2." },
  slow:    { name: "감속탑", cost: 55, hp: 110, r: 12, build: 5, range: 110, slow: 0.5, use: 1.5, desc: "범위 내 적의 이동과 사격을 늦춤. 작동 중 에너지 소모." },
  arc:     { name: "아크 코일", cost: 80, hp: 130, r: 12, build: 6, range: 120, dmg: 28, chain: 3, jump: 85, reload: 1.1, shot: 4, desc: "전격이 적 사이를 튀며 여러 기를 동시에 타격. 발사마다 에너지 소모." },
  decoy:   { name: "미끼 신호기", cost: 25, hp: 260, r: 10, build: 2, taunt: 180, desc: "범위 안의 적이 우선 공격하는 값싼 고내구 신호기." },
  repair:  { name: "수리소", cost: 70, hp: 120, r: 12, build: 6, range: 130, heal: 12, use: 2, desc: "범위 내 건물 수리. 수리 중 에너지 소모." },
};
const ORDER = ["node", "solar", "battery", "miner", "laser", "missile", "slow", "arc", "decoy", "repair"];
const EN = {
  scout:  { hp: 40,  spd: 70, r: 7,  range: 80,  dmg: 5,  rof: 0.8, bounty: 4 },
  raider: { hp: 120, spd: 45, r: 10, range: 110, dmg: 12, rof: 1.2, bounty: 8 },
  heavy:  { hp: 420, spd: 28, r: 15, range: 140, dmg: 30, rof: 2.0, bounty: 20 },
  bomber: { hp: 60,  spd: 85, r: 8,  range: 0,   dmg: 45, rof: 0,   bounty: 6, blast: 45 },
  shield: { hp: 160, spd: 40, r: 12, range: 100, dmg: 8,  rof: 1.2, bounty: 12, aura: 95 },
  sniper: { hp: 70,  spd: 35, r: 9,  range: 220, dmg: 30, rof: 3.0, bounty: 10, bspd: 650 },
  splitter: { hp: 150, spd: 40, r: 12, range: 100, dmg: 10, rof: 1.2, bounty: 6 },
  dread:  { hp: 3800, spd: 14, r: 36, range: 220, dmg: 18, rof: 2.6, bounty: 300 },
  drone:  { hp: 25,  spd: 95, r: 5,  range: 60,  dmg: 3,  rof: 0.8, bounty: 2, fac: "glass" },
  harvester: { hp: 130, spd: 50, r: 10, range: 40, dmg: 3, rof: 1.0, bounty: 8, fac: "glass" },
  mender: { hp: 140, spd: 38, r: 11, range: 140, dmg: 4, rof: 1.5, bounty: 12, fac: "glass" },
  phaser: { hp: 90,  spd: 45, r: 9,  range: 90,  dmg: 14, rof: 1.3, bounty: 10, fac: "glass" },
  queen:  { hp: 2600, spd: 16, r: 32, range: 200, dmg: 16, rof: 1.6, bounty: 220, fac: "glass" },
  boss:   { hp: 1200, spd: 18, r: 30, range: 170, dmg: 25, rof: 0.7, bounty: 150 },
};
const MAXLV = 3;
function st(b, k) {
  const d = DEF[b.type], l = (b.lvl || 1) - 1;
  if (b.br === "rapid") switch (k) {
    case "dps": return 25 + 15 * l;
    case "range": return 125 + 10 * l;
    case "use": return 2.5 + 0.5 * l;
  }
  if (b.br === "lance") switch (k) {
    case "dmg": return 50 + 45 * l;
    case "range": return 180 + 40 * l;
    case "reload": return 1.5;
    case "shot": return 4 + 2 * l;
  }
  switch (k) {
    case "gen": return b.type === "core" ? 2 + 1.5 * l : d.gen * (1 + 0.5 * l);
    case "rate": case "dps": case "dmg": case "heal": return d[k] * (1 + 0.5 * l);
    case "use": return d.use * (1 + 0.25 * l);
    case "range": return d.range + (b.type === "missile" ? 20 : 15) * l;
    case "reload": return d.reload * (1 - 0.15 * l);
    case "cap": return d.cap * (1 + l);
    case "link": return d.link + 25 * l;
    case "hp": return Math.round(d.hp * (1 + 0.3 * l));
    case "slow": return Math.max(0.3, d.slow - 0.08 * l);
    case "chain": return d.chain + l;
    case "taunt": return d.taunt + 30 * l;
  }
  return d[k];
}
const upCost = (b, br = b.br) => Math.round((DEF[b.type].cost || 100) * (b.lvl === 1 ? 0.8 : 1.2) * (br === "lance" ? 1.6 : 1));
const BR = { rapid: () => L("속사", "Rapid"), lance: () => L("저격", "Lance") };
const BRD = { rapid: () => L("짧은 사거리, 높은 연속 피해. 사격 중 에너지 소모.", "Short range, high sustained damage. Uses energy while firing."), lance: () => L("긴 사거리. 범위 내 체력이 가장 높은 적에게 강한 단발. 발사마다 에너지 소모.", "Long range. Heavy single shots at the toughest target in range. Uses energy per shot.") };
const LINK_CAP = { core: 20, node: 8 }, capOf = b => LINK_CAP[b.type] || 2;
const refund = b => b.prog < 1 || b.type === "node" ? b.spent : Math.floor(b.spent * 0.5);
const DIFFS = [0.75, 1, 1.3];
let diffIdx = 1;
const ALL = null, NO_LASER = ["node", "solar", "battery", "miner", "missile", "slow", "arc", "decoy", "repair"], NO_SLOW = ["node", "solar", "battery", "miner", "laser", "missile", "decoy", "repair"];
const MISSIONS = [
  { name: "첫 채굴",      desc: "광석 300 채굴. 기본을 익히세요.",       goal: { ore: 300 },   firstWave: 90, gap: 60, diff: 0.6,  ore: 150, map: "scatter", allow: ["node", "solar", "miner", "laser"] },
  { name: "전력 부족",    desc: "광석 800 채굴. 배터리 해금.",           goal: { ore: 800 },   firstWave: 70, gap: 50, diff: 0.7,  ast: 22, map: "cluster", allow: ["node", "solar", "battery", "miner", "laser"] },
  { name: "버티기",       desc: "웨이브 6개 생존. 수리소 해금.",         goal: { waves: 6 },   firstWave: 60, gap: 42, diff: 0.8,  map: "ring",  allow: ["node", "solar", "battery", "miner", "laser", "repair"] },
  { name: "미사일 시험",  desc: "웨이브 8개 생존. 미사일·미끼 신호기 해금.",         goal: { waves: 8 },   firstWave: 55, gap: 40, diff: 0.9,  map: "scatter", allow: NO_SLOW },
  { name: "광맥 쟁탈",    desc: "광석 2000 채굴. 습격이 잦습니다.",      goal: { ore: 2000 },  firstWave: 45, gap: 35, diff: 0.9,  map: "cluster", allow: NO_SLOW },
  { name: "희박한 벨트",  desc: "광석 1500 채굴. 소행성이 적습니다.",    goal: { ore: 1500 },  firstWave: 50, gap: 38, diff: 1,    ast: 14, map: "scatter", allow: NO_SLOW },
  { name: "자폭 경보",    desc: "웨이브 10개 생존. 자폭선이 일찍 옵니다. 감속탑·아크 코일 해금.", goal: { waves: 10 }, firstWave: 55, gap: 38, diff: 1, w0: 1, map: "lanes", allow: ALL },
  { name: "실드 함대",    desc: "웨이브 12개 생존. 실드함 다수.",        goal: { waves: 12 },  firstWave: 60, gap: 36, diff: 1,    w0: 2, map: "ring", allow: ALL },
  { name: "고립 기지",    desc: "광석 2500 채굴. 적은 자금으로 시작.",   goal: { ore: 2500 },  firstWave: 40, gap: 30, diff: 1.1,  ore: 80, map: "cluster", allow: ALL },
  { name: "최후의 방어선", desc: "웨이브 15개 생존.",                    goal: { waves: 15 },  firstWave: 45, gap: 34, diff: 1.2,  map: "lanes", allow: ALL },
  { name: "보급선 차단",  desc: "적 120기 격파.",                       goal: { kills: 120 }, firstWave: 40, gap: 30, diff: 1.1,  map: "lanes", allow: ALL },
  { name: "레이저 금지",  desc: "웨이브 10개 생존. 레이저를 쓸 수 없습니다.", goal: { waves: 10 }, firstWave: 55, gap: 38, diff: 1, map: "scatter", allow: NO_LASER },
  { name: "어두운 성운",  desc: "광석 2500 채굴. 이온 성운이 태양광을 가리고 적을 늦춥니다.",     goal: { ore: 2500 },  firstWave: 50, gap: 36, diff: 1.1,  map: "ring", haz: { nebula: 4 }, allow: ALL },
  { name: "요새 공략",    desc: "6웨이브에 나타나는 요새함 격파.",        goal: { boss: "dread", at: 6, count: 1 }, firstWave: 45, gap: 36, diff: 1, map: "cluster", allow: ALL },
  { name: "쾌속 해적",    desc: "웨이브 12개 생존. 적 이동 +35%, 태양 플레어.",  goal: { waves: 12 },  firstWave: 50, gap: 36, diff: 1.1,  map: "cluster", mod: { spd: 1.35 }, haz: { flare: true }, allow: ALL },
  { name: "빈 벨트",      desc: "광석 2000 채굴. 소행성 10개뿐, 유성우.",         goal: { ore: 2000 },  firstWave: 50, gap: 36, diff: 1.1,  ast: 10, ore: 300, map: "scatter", haz: { meteor: true }, allow: ALL },
  { name: "섬멸전",       desc: "적 300기 격파. 웨이브 간격이 짧습니다.", goal: { kills: 300 }, firstWave: 35, gap: 24, diff: 1.15, map: "ring", allow: ALL },
  { name: "중장갑 함대",  desc: "웨이브 14개 생존. 적 체력 +20%.",       goal: { waves: 14 },  firstWave: 60, gap: 38, diff: 1.1, w0: 1, map: "lanes", mod: { hp: 1.2 }, allow: ALL },
  { name: "쌍둥이 요새",  desc: "8웨이브에 나타나는 요새함 2척 격파.",    goal: { boss: "dread", at: 8, count: 2 }, firstWave: 45, gap: 34, diff: 1.15, map: "ring", allow: ALL },
  { name: "벨트의 끝",    desc: "웨이브 20개 생존. 유성우와 이온 성운.",                     goal: { waves: 20 },  firstWave: 45, gap: 32, diff: 1.3,  map: "lanes", haz: { meteor: true, nebula: 3 }, allow: ALL },
  { name: "낯선 신호",    desc: "광석 1500 채굴. 새로운 적, 유리 군단.",    goal: { ore: 1500 },  firstWave: 55, gap: 40, diff: 0.9,  map: "scatter", faction: "glass", allow: ALL },
  { name: "광석 도둑",    desc: "광석 2500 채굴. 수확선이 채굴기의 광석을 훔칩니다.", goal: { ore: 2500 }, firstWave: 55, gap: 38, diff: 1, map: "cluster", faction: "glass", w0: 1, allow: ALL },
  { name: "위상 교란",    desc: "웨이브 12개 생존. 순간이동하는 위상선.",   goal: { waves: 12 },  firstWave: 55, gap: 38, diff: 1.05, map: "ring", faction: "glass", w0: 1, allow: ALL },
  { name: "두 개의 적",   desc: "웨이브 14개 생존. 두 해적단이 함께 옵니다.", goal: { waves: 14 }, firstWave: 50, gap: 36, diff: 1.1, map: "lanes", faction: "mixed", allow: ALL },
  { name: "수확 모체",    desc: "8웨이브에 나타나는 수확 모체 격파. 근처 전력을 빨아들입니다.", goal: { boss: "queen", at: 8, count: 1 }, firstWave: 55, gap: 36, diff: 1.15, map: "cluster", faction: "glass", allow: ALL },
  { name: "무한 벨트",    desc: "끝없는 웨이브. 8웨이브부터 유성우, 10웨이브부터 두 해적단.",       goal: null,           firstWave: 40, gap: 32, diff: 1.1,  haz: { meteor: true, from: 8 }, mixFrom: 10, allow: ALL },
];
const COL = { glass: "#c77dff", glassEdge: "#f0dcff", bg: "#0c1230", ore: "#e8a951", en: "#6fd6ec", grid: "92,143,224", hos: "#ff5a6e", heal: "#7ee0a0", slow: "#b79cff",
  struct: "#cfd8ec", fill: "#1b2450", rock: "#37364f", rockEdge: "#57557a", hosEdge: "#ffc2ca" };
// colour modes: deutan = red-green safe (Okabe-Ito based), contrast = high contrast
const PALETTES = {
  normal: { ...COL },
  deutan: { ...COL, hos: "#ff5fd2", hosEdge: "#ffd0f3", ore: "#f0e442", heal: "#ffffff", en: "#56b4e9", glass: "#a9a1ff", glassEdge: "#e4e0ff", slow: "#9fd8ff" },
  contrast: { ...COL, bg: "#000000", fill: "#101010", struct: "#ffffff", rock: "#3d3d3d", rockEdge: "#9a9a9a", grid: "140,190,255", hos: "#ff3040", hosEdge: "#ffffff", ore: "#ffcc00", en: "#00e5ff", heal: "#00ff88", glass: "#e070ff", glassEdge: "#ffffff" },
};
