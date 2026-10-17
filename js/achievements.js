// Ore Belt · achievements.js: 업적과 누적 통계
"use strict";
// ---------- achievements & stats ----------
const STATS = (() => { let v = {}; try { v = JSON.parse(store.get("orebelt.stats")) || {}; } catch {}
  return Object.assign({ games: 0, wins: 0, ore: 0, kills: 0, built: 0, upgrades: 0, lost: 0, time: 0, boss: 0, dread: 0 }, v); })();
const saveStats = () => { if (S && S.replay) return; store.set("orebelt.stats", JSON.stringify(STATS)); };
const ACH_GOT = new Set((() => { try { return JSON.parse(store.get("orebelt.ach")) || []; } catch { return []; } })());
const totalStars = () => loadProg().stars.reduce((a, b) => a + (b || 0), 0);
const ACH = [
  ["first", "첫 걸음", "First Steps", "1번 임무 완료", "Complete mission 1", () => (loadProg().stars[0] || 0) > 0],
  ["ore1", "광부", "Miner", "누적 광석 5,000 채굴", "Mine 5,000 ore in total", () => STATS.ore >= 5000],
  ["ore2", "광산왕", "Ore Baron", "누적 광석 50,000 채굴", "Mine 50,000 ore in total", () => STATS.ore >= 50000],
  ["kill1", "사냥꾼", "Hunter", "누적 500기 격파", "Destroy 500 ships in total", () => STATS.kills >= 500],
  ["kill2", "함대 학살자", "Fleet Breaker", "누적 5,000기 격파", "Destroy 5,000 ships in total", () => STATS.kills >= 5000],
  ["boss", "모함 격추", "Mothership Down", "모함 격파", "Destroy a mothership", () => STATS.boss > 0],
  ["dread", "요새 함락", "Fortress Fallen", "요새함 격파", "Destroy a dreadnought", () => STATS.dread > 0],
  ["camp", "캠페인 완주", "Campaign Clear", "10번 임무 완료", "Complete mission 10", () => (loadProg().stars[9] || 0) > 0],
  ["camp2", "벨트의 끝", "Belt's End", "20번 임무 완료", "Complete mission 20", () => (loadProg().stars[19] || 0) > 0],
  ["queen", "모체 사냥", "Queen Slayer", "수확 모체 격파", "Destroy a Harvest Queen", () => (STATS.queen || 0) > 0],
  ["glass", "유리 깨기", "Glass Breaker", "25번 임무 완료", "Complete mission 25", () => (loadProg().stars[24] || 0) > 0],
  ["stars", "완벽주의자", "Perfectionist", "모든 임무 별 3개", "Three stars on every mission", () => totalStars() >= MISSIONS.filter(m => m.goal).length * 3],
  ["flawless", "무손실 방어", "Flawless Defense", "건물을 하나도 잃지 않고 웨이브 임무 완료", "Win a wave mission without losing a building", null],
  ["maxlv", "최대 출력", "Full Power", "건물 하나를 Lv 3까지 업그레이드", "Upgrade a building to Lv 3", null],
  ["big", "거대 기지", "Megabase", "한 판에서 건물 40개 동시 운용", "Run 40 buildings at once", () => S && !S.over && S.buildings.length >= 40],
  ["chain", "연쇄 반응", "Chain Reaction", "아크 코일 한 번에 5기 타격", "Hit 5 ships with one arc", null],
  ["endless", "생존 전문가", "Survivor", "무한 벨트 15웨이브 도달", "Reach wave 15 in Endless Belt", () => S && !S.m.goal && !S.m.daily && !S.m.custom && !S.m.mode && S.wave >= 15],
  ["miner", "채굴왕", "Ore Rush", "채굴 타임어택 5분 이내", "Finish the mining time attack within 5 minutes", () => miningBest() > 0 && miningBest() <= 300],
  ["daily", "오늘의 도전자", "Daily Contender", "일일 도전 10웨이브 도달", "Reach wave 10 in a Daily Challenge", () => S && S.m.daily && S.wave >= 10],
  ["hard", "강철 의지", "Iron Will", "어려움으로 10번 임무 완료", "Complete mission 10 on Hard", null],
];
function ach(id) {
  if (ACH_GOT.has(id) || (S && S.replay)) return;
  const a = ACH.find(x => x[0] === id); if (!a) return;
  ACH_GOT.add(id); store.set("orebelt.ach", JSON.stringify([...ACH_GOT]));
  if (S) (S.newAch = S.newAch || []).push(L(a[1], a[2]));
  toast(`${L("업적 달성", "Achievement")}: ${L(a[1], a[2])}`, 4); sfx("up");
}
function checkAch() { for (const a of ACH) if (a[5] && !ACH_GOT.has(a[0]) && a[5]()) ach(a[0]); }
function showAch(back) {
  const o = $("overlay"), fmtT = t => `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, "0")}`;
  const n = v => Math.floor(v).toLocaleString(LANG === "en" ? "en-US" : "ko-KR");
  const st = [[L("플레이", "Games"), n(STATS.games)], [L("승리", "Wins"), n(STATS.wins)], [L("플레이 시간", "Play time"), fmtT(STATS.time)], [L("채굴한 광석", "Ore mined"), n(STATS.ore)],
    [L("격파", "Kills"), n(STATS.kills)], [L("보스 격파", "Bosses"), n(STATS.boss + STATS.dread)], [L("건설", "Built"), n(STATS.built)], [L("업그레이드", "Upgrades"), n(STATS.upgrades)], [L("잃은 건물", "Buildings lost"), n(STATS.lost)]];
  o.innerHTML = `<div class="card"><h1 style="font-size:36px">${L("업적", "Achievements")} <small class="cnt">${ACH_GOT.size} / ${ACH.length}</small></h1>
    ${ACH.map(a => { const got = ACH_GOT.has(a[0]); return `<div class="ach ${got ? "got" : ""}"><i>${got ? "★" : "☆"}</i><div><b>${L(a[1], a[2])}</b><small>${L(a[3], a[4])}</small></div></div>`; }).join("")}
    <h3>${L("통계", "Stats")}</h3><dl class="stats">${st.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
    <button class="ms" id="achBack"><b>${L("돌아가기", "Back")}</b></button></div>`;
  o.hidden = false; o.scrollTop = 0;
  $("achBack").onclick = back;
}

function placeUI() {
  $("sndHint").hidden = soundMode === 2 || !!(AU.ctx && AU.ctx.state === "running");
  if (!$("sndHint").hidden) $("sndHint").style.bottom = $("bar").hidden ? "" : ($("bar").offsetHeight + 8) + "px";
  const pl = $("place"), show = S && !S.over && S.build && ghost && touchUI && $("overlay").hidden;
  pl.hidden = !show;
  if (show) {
    const sx = (ghost.x - cam.x) * cam.z + cw / 2, sy = (ghost.y - cam.y) * cam.z + ch / 2, c = checkPlace(S.build, ghost.x, ghost.y);
    pl.style.left = clamp(sx, 60, cw - 60) + "px"; pl.style.top = clamp(sy + 48, 60, ch - 140) + "px";
    $("plOk").disabled = !c.ok; $("plOk").textContent = `✓ ${DEF[S.build].name} ${DEF[S.build].cost}`;
  }
  $("homeBtn").hidden = !S || !!S.over || !$("overlay").hidden || !$("info").hidden || !!S.build;
}
$("plOk").onclick = () => { tryPlace(); };
$("plNo").onclick = () => { ghost = null; setBuild(null); };
$("homeBtn").onclick = () => { if (S) { cam.x = S.core.x; cam.y = S.core.y; } };
