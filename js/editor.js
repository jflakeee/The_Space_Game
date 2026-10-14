// Ore Belt · editor.js: 맵 에디터와 URL 공유(#map=)
"use strict";
// ---------- custom maps: editor & share links ----------
const GOALS = [["waves", 5], ["waves", 10], ["waves", 15], ["waves", 20], ["ore", 1000], ["ore", 2000], ["ore", 3000], ["kills", 100], ["kills", 200], ["endless", 0]];
const ORES = [80, 120, 200, 400], EDIFF = [0.8, 1, 1.2, 1.4], SIZES = [18, 28, 40];
const EMODS = [["spd", 1.3, "적 속도 +30%", "Enemy speed +30%"], ["hp", 1.25, "적 체력 +25%", "Enemy HP +25%"], ["solar", 0.5, "태양광 -50%", "Solar -50%"], ["mine", 0.7, "채굴 -30%", "Mining -30%"],
  ["haz:meteor", true, "유성우", "Meteor showers"], ["haz:nebula", 3, "이온 성운", "Ion nebulas"], ["haz:flare", true, "태양 플레어", "Solar flares"]];
const mapName = k => ({ scatter: L("산개", "Scatter"), ring: L("고리", "Ring"), cluster: L("군집", "Cluster"), lanes: L("교차", "Lanes") })[k];
let ED = null, CUSTOM = null, SHARED = null, edTool = "add", edSize = 1, edMap = 0;
function encodeMap(e) {
  const b = [2, e.gi, e.oi, e.di, e.mods, e.fac || 0, e.asts.length];
  for (const [x, y, r] of e.asts) b.push(Math.round(x / 8), Math.round(y / 8), Math.round(r));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeMap(c) {
  try {
    const b = [...atob(c.replace(/-/g, "+").replace(/_/g, "/"))].map(ch => ch.charCodeAt(0));
    const v = b[0], h = v === 2 ? 7 : 6, n = b[h - 1];
    if ((v !== 1 && v !== 2) || b.length !== h + n * 3) return null;
    const asts = [];
    for (let i = 0; i < n; i++) { const k = h + i * 3; asts.push([b[k] * 8, b[k + 1] * 8, clamp(b[k + 2], 12, 50)]); }
    return { gi: clamp(b[1], 0, GOALS.length - 1), oi: clamp(b[2], 0, 3), di: clamp(b[3], 0, 3), mods: b[4] & 127, fac: v === 2 ? clamp(b[5], 0, 2) : 0, asts };
  } catch { return null; }
}
const goalText = e => { const [t, v] = GOALS[e.gi]; return t === "waves" ? L(`웨이브 ${v}개 생존`, `Survive ${v} waves`) : t === "ore" ? L(`광석 ${v} 채굴`, `Mine ${v} ore`) : t === "kills" ? L(`적 ${v}기 격파`, `Destroy ${v} ships`) : L("무한", "Endless"); };
const facText = e => [L("붉은 무리", "Red Swarm"), L("유리 군단", "Glass Legion"), L("두 해적단", "Both bands")][e.fac || 0];
const modText = e => EMODS.filter((m, i) => e.mods >> i & 1).map(m => L(m[2], m[3]));
function customMission(e, code) {
  let seed = 7; for (const ch of code) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  const [t, v] = GOALS[e.gi], mod = {};
  const haz = {}; EMODS.forEach(([k, val], i) => { if (e.mods >> i & 1) { if (k.startsWith("haz:")) haz[k.slice(4)] = val; else mod[k] = val; } });
  return { custom: code, seed, name: L("커스텀 맵", "Custom map"), desc: [goalText(e), facText(e), ...modText(e)].join(" / "),
    faction: ["red", "glass", "mixed"][e.fac || 0], goal: t === "endless" ? null : { [t]: v }, firstWave: 50, gap: 36, diff: EDIFF[e.di], ore: ORES[e.oi], astList: e.asts, mod, haz, allow: ALL };
}
function shareURL(code) { return location.href.split("#")[0] + "#map=" + code; }
async function shareMap(code) {
  const url = shareURL(code);
  try { if (navigator.share) { await navigator.share({ title: "Ore Belt", text: L("내가 만든 Ore Belt 맵", "My Ore Belt map"), url }); return; } } catch (err) { if (err && err.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(url); toast(L("공유 링크를 복사했습니다", "Share link copied"), 3); }
  catch { prompt(L("이 링크를 복사하세요", "Copy this link"), url); }
}
function edRefresh(resetCam) {
  const code = encodeMap(ED); store.set("orebelt.editor", code); CUSTOM = customMission(ED, code);
  const c0 = { x: cam.x, y: cam.y, z: cam.z };
  newGame(-2, true); S.editor = true; S.paused = true; rebuildGrid();
  if (!resetCam) Object.assign(cam, c0);
  $("hud").hidden = true; $("bar").hidden = true; $("tip").hidden = true; $("edbar").hidden = false; $("edinfo").hidden = false;
  $("edinfo").innerHTML = `<b>${L("맵 에디터", "Map editor")}</b> · ${L("소행성", "Asteroids")} ${ED.asts.length}/60 · ${CUSTOM.desc}<br><small>${edTool === "add" ? L("빈 곳을 탭하면 소행성 추가", "Tap empty space to add an asteroid") : L("소행성을 탭하면 삭제", "Tap an asteroid to delete it")} · ${L("드래그로 이동", "Drag to pan")}</small>`;
  renderEdBar();
}
function renderEdBar() {
  const B = [
    ["add", `${L("추가", "Add")} ${["S", "M", "L"][edSize]}`, () => { if (edTool === "add") edSize = (edSize + 1) % 3; edTool = "add"; edRefresh(); }],
    ["del", L("삭제", "Delete"), () => { edTool = "del"; edRefresh(); }],
    ["rnd", `${L("무작위", "Random")}: ${mapName(MAPS[edMap])}`, () => { edMap = (edMap + 1) % MAPS.length; ED.asts = genAsteroids(30, MAPS[edMap]).map(a => [Math.round(a.x / 8) * 8, Math.round(a.y / 8) * 8, Math.round(a.r0)]); edRefresh(); }],
    ["clr", L("비우기", "Clear"), () => { ED.asts = []; edRefresh(); }],
    ["set", L("규칙", "Rules"), showEdSettings],
    ["play", L("테스트", "Play"), () => { $("edbar").hidden = true; $("edinfo").hidden = true; newGame(-2); }],
    ["share", L("공유", "Share"), () => shareMap(encodeMap(ED))],
    ["exit", L("나가기", "Exit"), () => { S = null; showMenu(); }],
  ];
  const bar = $("edbar"), sl = bar.scrollLeft; bar.innerHTML = "";
  for (const [id, label, fn] of B) { const b = document.createElement("button"); b.className = "bb" + (id === edTool ? " on" : ""); b.innerHTML = `<span class="n">${label}</span>`; b.onclick = fn; bar.appendChild(b); }
  bar.scrollLeft = sl;
}
function edTap(sx, sy) {
  const [x, y] = s2w(sx, sy);
  if (edTool === "del") {
    const i = ED.asts.findIndex(([ax, ay, r]) => Math.hypot(ax - x, ay - y) <= r + 10 / cam.z);
    if (i >= 0) { ED.asts.splice(i, 1); edRefresh(); sfx("place"); }
    return;
  }
  const r = SIZES[edSize], qx = Math.round(x / 8) * 8, qy = Math.round(y / 8) * 8;
  let why = "";
  if (ED.asts.length >= 60) why = L("소행성은 60개까지입니다", "Up to 60 asteroids");
  else if (qx < r + 30 || qy < r + 30 || qx > W - r - 30 || qy > H - r - 30) why = L("맵 밖입니다", "Out of bounds");
  else if (Math.hypot(qx - W / 2, qy - H / 2) < r + 90) why = L("코어에 너무 가깝습니다", "Too close to the core");
  else if (ED.asts.some(([ax, ay, ar]) => Math.hypot(ax - qx, ay - qy) < ar + r + 6)) why = L("다른 소행성과 겹칩니다", "Overlaps another asteroid");
  if (why) { toast(why); sfx("err"); return; }
  ED.asts.push([qx, qy, r]); edRefresh(); sfx("place");
}
function openEditor(code) {
  ED = (code && decodeMap(code)) || decodeMap(store.get("orebelt.editor") || "") || { gi: 1, oi: 1, di: 1, mods: 0, asts: [] };
  if (!ED.asts.length && !code) ED.asts = genAsteroids(30, "scatter").map(a => [Math.round(a.x / 8) * 8, Math.round(a.y / 8) * 8, Math.round(a.r0)]);
  edTool = "add"; edRefresh(true);
}
function showEdSettings() {
  const o = $("overlay");
  const rows = [
    ["g", L("목표", "Goal"), () => goalText(ED), () => { ED.gi = (ED.gi + 1) % GOALS.length; }],
    ["o", L("시작 광석", "Starting ore"), () => ORES[ED.oi], () => { ED.oi = (ED.oi + 1) % ORES.length; }],
    ["f", L("적 진영", "Enemy faction"), () => facText(ED), () => { ED.fac = ((ED.fac || 0) + 1) % 3; }],
    ["d", L("적 강도", "Enemy strength"), () => "×" + EDIFF[ED.di], () => { ED.di = (ED.di + 1) % EDIFF.length; }],
    ...EMODS.map((m, i) => ["m" + i, L(m[2], m[3]), () => ED.mods >> i & 1 ? L("켬", "On") : L("끔", "Off"), () => { ED.mods ^= 1 << i; }]),
  ];
  o.innerHTML = `<div class="card"><h1 style="font-size:36px">${L("맵 규칙", "Map rules")}</h1>
    ${rows.map(([id, label]) => `<div class="setrow"><span>${label}</span><button id="ed_${id}"></button></div>`).join("")}
    <button class="ms" id="edBack"><b>${L("완료", "Done")}</b></button></div>`;
  o.hidden = false; $("edbar").hidden = true;
  const refresh = () => rows.forEach(([id, , val]) => { $("ed_" + id).textContent = val(); });
  rows.forEach(([id, , , act]) => { $("ed_" + id).onclick = () => { act(); refresh(); }; });
  refresh();
  $("edBack").onclick = () => { o.hidden = true; edRefresh(); };
}
if (location.hash.startsWith("#map=")) { const c = location.hash.slice(5); if (decodeMap(c)) SHARED = c; }
