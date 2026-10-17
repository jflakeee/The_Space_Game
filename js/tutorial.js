// Ore Belt · tutorial.js: 1번 임무 튜토리얼
"use strict";
// ---------- tutorial ----------
const has = k => S.buildings.some(b => b.type === k);
const TUT = [
  { text: L("아래에서 <b>채굴기</b>를 고르세요.", "Pick the <b>Miner</b> below."), hint: "miner", done: () => S.build === "miner" || has("miner") },
  { text: L("광석 반점이 있는 소행성 옆, 코어의 파란 범위 안에 놓으세요.", "Place it next to an ore-speckled asteroid, inside the core's blue range."), hint: "miner", done: () => has("miner") },
  { text: L("<b>태양광</b>으로 에너지를 늘리세요. 채굴기와 포탑은 에너지를 씁니다.", "Build <b>Solar</b> for more energy. Miners and turrets consume it."), hint: "solar", done: () => has("solar") },
  { text: L("<b>중계기</b>로 전력망을 넓히면 먼 소행성에도 닿습니다. 소행성은 연결선을 가립니다.", "<b>Relays</b> extend the grid to distant asteroids. Asteroids block links."), hint: "node", done: () => has("node") },
  { text: L("곧 해적이 옵니다. <b>레이저</b>를 코어 근처에 지으세요.", "Pirates are coming. Build a <b>Laser</b> near the core."), hint: "laser", done: () => has("laser") },
  { get text() { return S && S.m.mode === "training" ? L("건물을 누르면 업그레이드와 판매를 할 수 있습니다. 준비되면 '웨이브 호출'로 적을 불러 방어를 연습하세요.", "Tap a building to upgrade or sell it. When ready, press 'Call wave' to practise defending.") : L("건물을 누르면 업그레이드와 판매를 할 수 있습니다. 목표는 광석 300입니다.", "Tap a building to upgrade or sell it. Goal: mine 300 ore."); }, hint: null, done: () => S.t - S.tutT > 8 },
];
function renderTip() {
  const tip = $("tip"), step = S && S.tut != null && !S.over ? TUT[S.tut] : null;
  for (const b of $("bar").children) b.classList.toggle("hint", !!step && b.dataset.k === step.hint);
  if (!step) { tip.hidden = true; return; }
  tip.innerHTML = `<span>${S.tut + 1}/${TUT.length}</span><div>${step.text}</div><button id="tipSkip">${L("건너뛰기", "Skip")}</button>`;
  tip.style.top = $("hud").offsetHeight + "px"; tip.hidden = false;
  $("tipSkip").onclick = () => { doAction({ k: "tut", v: null }); renderTip(); };
}
function tutTick() {
  if (!S || S.tut == null || S.over) return;
  if (S.replay) return;
  if (TUT[S.tut].done()) { const nv = S.tut + 1 >= TUT.length ? null : S.tut + 1; doAction({ k: "tut", v: nv }); S.tutT = S.t; if (nv != null) sfx("done"); renderTip(); }
}
