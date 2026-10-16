// Ore Belt · settings.js: 설정 화면, 키보드 카메라
"use strict";
// ---------- settings ----------
const SET = (() => { let v = {}; try { v = JSON.parse(store.get("orebelt.settings")) || {}; } catch {}
  const rm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  return Object.assign({ shake: rm ? 0 : 1, ui: 0, bars: 0, instant: 0, brief: 1, music: "orch", fps: 0, saver: 0, pal: "normal", flash: rm ? 0 : 1 }, v); })();
function saveSet() { store.set("orebelt.settings", JSON.stringify(SET)); document.body.classList.toggle("big", !!SET.ui); applyPalette(); }
function applyPalette() {
  Object.assign(COL, PALETTES[SET.pal] || PALETTES.normal);
  const r = document.documentElement.style;
  for (const k of ["ore", "en", "hos", "heal", "glass", "bg"]) r.setProperty("--" + k, COL[k]);
  document.body.classList.toggle("hc", SET.pal === "contrast");
}
function showSettings(back) {
  const o = $("overlay");
  const opts = [
    ["lang", L("언어", "Language"), () => LANG === "en" ? "English" : "한국어", () => setLang(LANG === "en" ? "ko" : "en")],
    ["diff", L("난이도", "Difficulty"), () => [L("쉬움", "Easy"), L("보통", "Normal"), L("어려움", "Hard")][diffIdx], () => { diffIdx = (diffIdx + 1) % 3; store.set("orebelt.diff", String(diffIdx)); }],
    ["snd", L("소리", "Sound"), () => [L("전체 켬", "All on"), L("효과음만", "Effects only"), L("끔", "Off")][soundMode], () => { auInit(); setSound((soundMode + 1) % 3); }],
    ["shk", L("화면 흔들림", "Screen shake"), () => SET.shake ? L("켬", "On") : L("끔", "Off"), () => { SET.shake ^= 1; saveSet(); }],
    ["ui", L("UI 크기", "UI size"), () => SET.ui ? L("크게", "Large") : L("보통", "Normal"), () => { SET.ui ^= 1; saveSet(); }],
    ["bar", L("체력바", "Health bars"), () => SET.bars ? L("항상 표시", "Always") : L("피해 시", "When damaged"), () => { SET.bars ^= 1; saveSet(); }],
    ["brief", L("임무 브리핑", "Mission briefings"), () => SET.brief ? L("표시", "Show") : L("건너뛰기", "Skip"), () => { SET.brief ^= 1; saveSet(); }],
    ["mus", L("음악 스타일", "Music style"), () => SET.music === "amb" ? L("앰비언트", "Ambient") : L("오케스트라", "Orchestral"), () => { auInit(); SET.music = SET.music === "amb" ? "orch" : "amb"; saveSet(); }],
    ["fps", L("프레임 제한", "Frame limit"), () => SET.fps ? SET.fps + " fps" : L("화면에 맞춤", "Match display"), () => { SET.fps = SET.fps === 0 ? 60 : SET.fps === 60 ? 30 : 0; saveSet(); }],
    ["sav", L("절전 모드", "Battery saver"), () => SET.saver ? L("켬", "On") : L("끔", "Off"), () => { SET.saver ^= 1; saveSet(); resize(); }],
    ["pal", L("색상 모드", "Colour mode"), () => ({ normal: L("기본", "Default"), deutan: L("적록 색각 보정", "Red-green safe"), contrast: L("고대비", "High contrast") })[SET.pal], () => { const k = ["normal", "deutan", "contrast"]; SET.pal = k[(k.indexOf(SET.pal) + 1) % 3]; saveSet(); }],
    ["fl", L("섬광 효과", "Flash effects"), () => SET.flash ? L("켬", "On") : L("줄임", "Reduced"), () => { SET.flash ^= 1; saveSet(); }],
    ["inst", L("건설 방식", "Construction"), () => SET.instant ? L("즉시 (원작식)", "Instant (classic)") : L("시간 소요", "Timed"), () => { SET.instant ^= 1; saveSet(); }],
  ];
  o.innerHTML = `<div class="card"><h1 style="font-size:36px">${L("설정", "Settings")}</h1>
    ${opts.map(([id, label]) => `<div class="setrow"><span>${label}</span><button id="set_${id}"></button></div>`).join("")}
    <p class="help">${L("난이도 변경은 다음 판부터 적용됩니다. 즉시 건설은 원작처럼 건물이 바로 완성되며, 연결된 전력망은 여전히 필요합니다.", "Difficulty changes apply from the next game. Instant construction finishes buildings immediately like the original; they still need a grid link.")}</p>
    <button class="ms" id="setReset"><b>${L("진행 초기화", "Reset progress")}</b><span>${L("별, 기록, 업적, 통계, 저장된 판을 모두 지웁니다", "Clears stars, records, achievements, stats and saved game")}</span></button>
    <button class="ms" id="setBack"><b>${L("돌아가기", "Back")}</b></button></div>`;
  o.hidden = false;
  const refresh = () => opts.forEach(([id, , val]) => { $("set_" + id).textContent = val(); });
  opts.forEach(([id, , , act]) => { $("set_" + id).onclick = () => { act(); refresh(); }; });
  refresh();
  $("setReset").onclick = () => {
    if (!confirm(L("정말 모든 진행을 지울까요?", "Really erase all progress?"))) return;
    for (const k of ["orebelt.progress", "orebelt.best", "orebelt.daily", "orebelt.seen", "orebelt.ach", "orebelt.stats", SAVE_KEY]) try { localStorage.removeItem(k); } catch {}
    S = null; location.reload();
  };
  $("setBack").onclick = back;
}
const keys = new Set();
addEventListener("keydown", e => { if (/^(Arrow|[wasdWASD]$)/.test(e.key)) { keys.add(e.key.toLowerCase()); if (e.key.startsWith("Arrow")) e.preventDefault(); }
  else if ((e.key === "+" || e.key === "=" || e.key === "-") && S && $("overlay").hidden) { cam.z = clamp(cam.z * (e.key === "-" ? 0.85 : 1.18), ZMIN, ZMAX); } });
addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));
addEventListener("blur", () => keys.clear());
function keyPan(dt) {
  if (!S || !keys.size || !$("overlay").hidden) return;
  const h = (keys.has("d") || keys.has("arrowright")) - (keys.has("a") || keys.has("arrowleft"));
  const v = (keys.has("s") || keys.has("arrowdown")) - (keys.has("w") || keys.has("arrowup"));
  cam.x += h * 600 * dt / cam.z; cam.y += v * 600 * dt / cam.z; clampCam();
}
