// Ore Belt · ui.js: HUD, 건설 바, 정보 패널, 메뉴, 결과 화면
"use strict";
// ---------- UI ----------
let toastTimer = 0;
function placeToast() { const tip = $("tip"), ei = $("edinfo"); $("toast").style.top = (!ei.hidden ? ei.offsetTop + ei.offsetHeight + 8 : ($("hud").hidden ? 20 : $("hud").offsetHeight) + (tip.hidden ? 0 : tip.offsetHeight + 8)) + "px"; }
function toast(msg, sec = 2.2) { const t = $("toast"); placeToast(); t.textContent = msg; t.style.opacity = 1; toastTimer = sec; }
function buildBar() {
  const bar = $("bar"); bar.innerHTML = "";
  S.allow.forEach((k, i) => {
    const d = DEF[k], b = document.createElement("button");
    b.className = "bb"; b.dataset.k = k; b.title = `${d.desc} (${L("단축키", "key")} ${i + 1})`;
    b.innerHTML = `<span class="n">${d.name}</span><span class="c">${d.cost}</span>`;
    b.onclick = () => setBuild(S.build === k ? null : k);
    bar.appendChild(b);
  });
}
function setBuild(k) {
  if (!S || S.over || S.replay || (k && !S.allow.includes(k))) return;
  S.build = k; ghost = null; if (k) select(null);
  for (const b of $("bar").children) b.classList.toggle("on", b.dataset.k === k);
  if (k && touchUI && !store.get("orebelt.touchHint")) { store.set("orebelt.touchHint", "1"); toast(L("위치를 탭한 뒤 ✓로 설치하세요. 드래그는 화면 이동입니다.", "Tap a spot, then press ✓ to build. Dragging pans the view."), 5); }
  else if (k) toast(`${DEF[k].name}: ${DEF[k].desc}`, 3);
}
function statLine(b) {
  const f = (k, n = 1) => st(b, k).toFixed(n);
  switch (b.type) {
    case "core": case "solar": return L(`에너지 +${f("gen")}/s`, `Energy +${f("gen")}/s`);
    case "node": return L(`연결 거리 ${f("link", 0)}`, `Link range ${f("link", 0)}`);
    case "battery": return L(`저장량 +${f("cap", 0)}`, `Storage +${f("cap", 0)}`);
    case "miner": return L(`채굴 ${f("rate")}/s, 에너지 ${f("use")}/s`, `Mining ${f("rate")}/s, energy ${f("use")}/s`);
    case "laser": return b.br === "lance" ? L(`피해 ${f("dmg", 0)}, 사거리 ${f("range", 0)}, 재장전 ${f("reload")}s`, `Damage ${f("dmg", 0)}, range ${f("range", 0)}, reload ${f("reload")}s`)
      : L(`${f("dps", 0)} dps, 사거리 ${f("range", 0)}`, `${f("dps", 0)} dps, range ${f("range", 0)}`);
    case "missile": return L(`피해 ${f("dmg", 0)}, 사거리 ${f("range", 0)}, 재장전 ${f("reload")}s`, `Damage ${f("dmg", 0)}, range ${f("range", 0)}, reload ${f("reload")}s`);
    case "arc": return L(`피해 ${f("dmg", 0)}, 연쇄 ${f("chain", 0)}, 사거리 ${f("range", 0)}`, `Damage ${f("dmg", 0)}, chain ${f("chain", 0)}, range ${f("range", 0)}`);
    case "decoy": return L(`유인 범위 ${f("taunt", 0)}`, `Taunt radius ${f("taunt", 0)}`);
    case "slow": return L(`감속 ${Math.round((1 - st(b, "slow")) * 100)}%, 범위 ${f("range", 0)}`, `Slow ${Math.round((1 - st(b, "slow")) * 100)}%, range ${f("range", 0)}`);
    case "repair": return L(`수리 ${f("heal", 0)}/s, 범위 ${f("range", 0)}`, `Repair ${f("heal", 0)}/s, range ${f("range", 0)}`);
  }
  return "";
}
function upgrade(b, br) {
  if (!S || !b || b.dead || b.lvl >= MAXLV || b.prog < 1) return;
  if (b.type === "laser" && b.lvl === 1 && !br) { toast(L("정보 패널에서 속사/저격 중 하나를 고르세요", "Choose Rapid or Lance in the info panel")); return; }
  const c = upCost(b, br || b.br);
  if (S.ore < c) { toast(L("광석이 부족합니다", "Not enough ore")); return; }
  doAction({ k: "u", i: S.buildings.indexOf(b), br });
}
function select(b) {
  if (!S) return;
  S.sel = b;
  const box = $("info");
  if (!b) { box.hidden = true; return; }
  const d = DEF[b.type];
  box.innerHTML = `<button class="x" id="iClose" aria-label="close">✕</button><div class="t">${d.name}${b.br ? ` (${BR[b.br]()})` : ""} <span id="iL"></span></div><div id="iS"></div><div id="iH"></div><div id="iX"></div><div class="d">${b.br ? BRD[b.br]() : d.desc}</div>`;
  if (b.type === "laser" && b.lvl === 1) {
    box.insertAdjacentHTML("beforeend", `<div class="d" id="iBr">${L("속사: 짧은 사거리, 높은 연속 피해. 저격: 긴 사거리, 체력 높은 적에게 강한 단발.", "Rapid: short range, high sustained damage. Lance: long range, heavy single shots at the toughest target.")}</div>`);
    for (const br of ["rapid", "lance"]) { const x = document.createElement("button"); x.id = "iU_" + br; x.onclick = () => upgrade(S.sel, br); box.appendChild(x); }
  } else { const up = document.createElement("button"); up.id = "iU"; up.onclick = () => upgrade(S.sel); box.appendChild(up); }
  if (b.type !== "core") {
    const btn = document.createElement("button"); btn.id = "iSell";
    btn.onclick = () => {
      if (b.dead) return;
      doAction({ k: "s", i: S.buildings.indexOf(b) });
    };
    box.appendChild(btn);
  }
  const row = document.createElement("div"); row.className = "row";
  for (const x of [...box.querySelectorAll(":scope > button:not(.x)")]) row.appendChild(x);
  box.appendChild(row); $("iClose").onclick = () => select(null);
  box.hidden = false; updateInfo();
}
function updateInfo() {
  const b = S && S.sel; if (!b || !$("iS")) return;
  $("iL").textContent = `Lv ${b.lvl}`;
  $("iS").textContent = b.prog < 1 ? (b.powered ? L(`건설 중 ${Math.floor(b.prog * 100)}%`, `Building ${Math.floor(b.prog * 100)}%`) : L("전력 끊김, 건설 중단", "No power, construction halted")) : (b.powered ? L("가동 중", "Online") : L("전력 끊김", "No power"));
  $("iS").style.color = b.powered ? "" : COL.hos;
  $("iH").textContent = `${L("내구도", "HP")} ${Math.ceil(b.hp)} / ${b.maxHp}`;
  $("iX").textContent = statLine(b);
  const up = $("iU");
  if (!up) for (const br of ["rapid", "lance"]) { const x = $("iU_" + br); if (!x) continue; const c = upCost(b, br); x.textContent = `${BR[br]()} (${c})`; x.disabled = b.prog < 1 || S.ore < c; }
  else if (b.lvl >= MAXLV) { up.textContent = L("최대 레벨", "Max level"); up.disabled = true; }
  else { const c = upCost(b); up.textContent = `${L("업그레이드", "Upgrade")} (${c})`; up.disabled = b.prog < 1 || S.ore < c; }
  if (RELAY[b.type]) $("iX").textContent = statLine(b) + `, ${L("연결", "links")} ${S.deg?.get(b) || 0}/${capOf(b)}`;
  const sl = $("iSell"); if (sl) sl.textContent = `${L("판매", "Sell")} (+${refund(b)})`;
}
function updateCtl() {
  if (!S) return;
  $("spdBtn").textContent = S.speed ? S.speed + "×" : L("정지", "Stop");
  $("spdBtn").classList.toggle("stop", !S.speed);
  $("pauseBtn").textContent = L("일시정지", "Pause");
}
let hudT = 0;
function hudTick(dt) {
  if (toastTimer > 0 && (toastTimer -= dt) <= 0) $("toast").style.opacity = 0;
  if (!S || S.editor || (hudT += dt) < 0.12) return;
  if (!S.over && (S.saveT += hudT) > 10) { S.saveT = 0; saveGame(); saveStats(); }
  if ((S.achT = (S.achT || 0) + hudT) > 1) { S.achT = 0; checkAch(); }
  hudT = 0; tutTick(); if (!$("tip").hidden) $("tip").style.top = $("hud").offsetHeight + "px"; if (toastTimer > 0) placeToast();
  $("oreV").textContent = Math.floor(S.ore);
  $("enV").textContent = Math.floor(S.energy);
  $("enBar").firstElementChild.style.width = (S.energy / S.eCap * 100) + "%";
  const net = S.gen - S.useRate;
  $("enR").textContent = (net >= 0 ? "+" : "") + net.toFixed(1) + "/s";
  $("enBox").classList.toggle("starved", S.starved > 0 && S.energy < 5);
  const alive = S.enemies.length;
  $("waveV").innerHTML = wavesDone()
    ? L(`웨이브 <b>${S.wave}</b> 마지막`, `Wave <b>${S.wave}</b> final`) + (alive ? L(`, 남은 적 <b>${alive}</b>`, `, enemies <b>${alive}</b>`) : "")
    : L(`웨이브 <b>${S.wave}</b>, 다음 <b>${Math.ceil(S.waveT)}초</b>`, `Wave <b>${S.wave}</b>, next in <b>${Math.ceil(S.waveT)}s</b>`) + (alive ? L(`, 적 <b>${alive}</b>`, `, enemies <b>${alive}</b>`) : "");
  const g = S.m.goal;
  $("goalV").innerHTML = !g ? `${L("최고 기록", "Best")} <b>${S.m.daily ? dailyBest() : store.get("orebelt.best") || 0}</b>` :
    g.ore ? `${L("목표", "Goal")} <b>${Math.floor(S.oreMined)}</b> / ${g.ore}` : g.kills ? `${L("격파", "Kills")} <b>${S.kills}</b> / ${g.kills}`
    : g.boss ? (S.wave < g.at ? L(`${EINFO[g.boss].n()} <b>${g.at}</b>웨이브에 출현`, `${EINFO[g.boss].n()} on wave <b>${g.at}</b>`) : `${EINFO[g.boss].n()} ${L("격파", "down")} <b>${S.bossK || 0}</b> / ${g.count || 1}`)
    : `${L("목표", "Goal")} <b>${S.wave}</b> / ${g.waves}`;
  $("callBtn").disabled = wavesDone() || !!S.over;
  for (const b of $("bar").children) b.classList.toggle("poor", S.ore < DEF[b.dataset.k].cost);
  updateInfo();
}
$("callBtn").onclick = () => {
  if (!S || S.over || S.replay || wavesDone()) return;
  const bonus = doAction({ k: "c" });
  if (bonus > 0) toast(`${L("조기 호출 보너스", "Early call bonus")} +${bonus}`);
};
function setSpeed(v) { if (!S) return; if (v === 0 && S.speed) S.lastSpd = S.speed; S.speed = v; updateCtl(); if (v === 0) toast(L("정지: 건설과 업그레이드는 계속 가능", "Stopped: you can still build and upgrade")); }
const SPEEDS = [1, 2, 3, 0.5, 0];
$("spdBtn").onclick = () => setSpeed(SPEEDS[(SPEEDS.indexOf(S.speed) + 1) % SPEEDS.length]);
$("muteBtn").onclick = () => { auInit(); setSound((soundMode + 1) % 3); };
setSound(soundMode);
$("pauseBtn").onclick = () => setPause(true);

function loadProg() { try { const p = JSON.parse(store.get("orebelt.progress")); return p && p.stars ? p : { stars: [] }; } catch { return { stars: [] }; } }
function saveStars(i, n) { const p = loadProg(); p.stars[i] = Math.max(p.stars[i] || 0, n); store.set("orebelt.progress", JSON.stringify(p)); }
const ENDLESS_UNLOCK = 4;
function unlocked(i, p) { return i === 0 || (MISSIONS[i].goal ? (p.stars[i - 1] || 0) > 0 : (p.stars[ENDLESS_UNLOCK] || 0) > 0); }
const starStr = n => "★".repeat(n) + "☆".repeat(3 - n);
function showMenu() {
  if (S) S.paused = true;
  toastTimer = 0; $("toast").style.opacity = 0; $("tip").hidden = true;
  $("hud").hidden = true; $("bar").hidden = true; $("info").hidden = true; $("edbar").hidden = true; $("edinfo").hidden = true;
  const seenVer = store.get("orebelt.ver"), showNews = !!seenVer && seenVer !== APP_VERSION || (!seenVer && !!store.get("orebelt.progress"));
  if (!showNews) store.set("orebelt.ver", APP_VERSION);
  const p = loadProg(), best = store.get("orebelt.best"), sv = readSave(), dm = dailyMission(), dbest = dailyBest();
  const total = p.stars.reduce((a, b) => a + (b || 0), 0), maxStars = MISSIONS.filter(m => m.goal).length * 3;
  const o = $("overlay");
  o.innerHTML = `<div class="card"><h1>Ore Belt</h1>
    ${showNews ? `<div class="shared news"><b>${L(`v${APP_VERSION} 새 소식`, `What's new in v${APP_VERSION}`)}</b><span>${L("중반 난이도를 완화했습니다: 저격선 사거리 축소, 모함 체력 감소, 유리 군단 초반 드론 약화. 이전 버전 리플레이는 결과가 다를 수 있습니다.", "Mid-game difficulty eased: shorter sniper range, weaker mothership, softer early Glass Legion drones. Replays from earlier versions may differ.")}</span>
      <div class="row"><a class="btnlink" href="${REPO_URL}/blob/main/CHANGELOG.md" target="_blank" rel="noopener">${L("변경 로그", "Changelog")}</a><button id="newsOk">${L("확인", "OK")}</button></div></div>` : ""}
    ${SHARED_REPLAY ? `<div class="shared"><b>${L("공유된 리플레이", "Shared replay")}</b><span>${SHARED_REPLAY.name} · ${SHARED_REPLAY.res === "win" ? L("승리", "Victory") : L("패배", "Defeat")} · ${L("웨이브", "wave")} ${SHARED_REPLAY.wave}</span>
      <div class="row"><button id="shRp">${L("보기", "Watch")}</button></div></div>` : ""}
    ${SHARED ? (() => { const e = decodeMap(SHARED); return `<div class="shared"><b>${L("공유된 맵", "Shared map")}</b><span>${L("소행성", "Asteroids")} ${e.asts.length} · ${[goalText(e), ...modText(e)].join(" / ")}</span>
      <div class="row"><button id="shPlay">${L("플레이", "Play")}</button><button id="shEdit">${L("편집", "Edit")}</button></div></div>`; })() : ""}
    <p>${L("소행성대 한가운데 기지를 세우세요. 전력망을 깔고, 광석을 캐고, 몰려오는 해적을 막아내야 합니다.", "Build a base in the middle of an asteroid belt. Lay a power grid, mine ore, and hold off the pirates.")}</p>
    <div class="prog">${L("획득한 별", "Stars")} <b>${total}</b> / ${maxStars} <button id="diffBtn" class="lang">${[L("쉬움", "Easy"), L("보통", "Normal"), L("어려움", "Hard")][diffIdx]}</button><button id="setBtn" class="lang">${L("설정", "Settings")}</button></div>
    ${sv ? `<button class="ms resume" id="resume"><b>${L("이어하기", "Continue")}</b><span>${sv.mi >= 0 && MISSIONS[sv.mi].goal ? sv.mi + 1 + ". " : ""}${sv.mi === -1 ? L("일일 도전", "Daily Challenge") : sv.mi === -2 ? L("커스텀 맵", "Custom map") : MISSIONS[sv.mi].name}, ${L("웨이브", "wave")} ${sv.wave}, ${Math.floor(sv.t / 60)}:${String(Math.floor(sv.t % 60)).padStart(2, "0")}</span></button>` : ""}
    <div class="grid">${MISSIONS.map((m, i) => {
      const ok = unlocked(i, p), n = p.stars[i] || 0;
      if (!m.goal) return `<button class="ms wide" data-i="${i}" ${ok ? "" : "disabled"}><b>${m.name}</b><span>${ok ? m.desc + (best ? ` ${L("최고 웨이브", "Best wave")} ${best}` : "") : L(`${ENDLESS_UNLOCK + 1}번 임무를 완료하면 열립니다`, `Unlocks after mission ${ENDLESS_UNLOCK + 1}`)}</span></button>`;
      return (i === 10 ? `<h3 class="span">${L("확장 임무", "Expansion")}</h3>` : i === 20 ? `<h3 class="span">${L("유리 군단", "Glass Legion")}</h3>` : "") + `<button class="ms" data-i="${i}" ${ok ? "" : "disabled"}><b>${i + 1}. ${m.name}</b><span>${ok ? m.desc : L("잠김", "Locked")}</span><em>${starStr(n)}</em></button>`;
    }).join("")}
    <button class="ms wide daily" id="daily" ${unlocked(MISSIONS.length - 1, p) ? "" : "disabled"}><b>${dm.name}</b><span>${unlocked(MISSIONS.length - 1, p) ? dm.desc + (dbest ? ` ${L("오늘 최고 웨이브", "Today's best wave")} ${dbest}` : "") : L(`${ENDLESS_UNLOCK + 1}번 임무를 완료하면 열립니다`, `Unlocks after mission ${ENDLESS_UNLOCK + 1}`)}</span></button></div>
    <button class="ms" id="rpBtn"><b>${L("리플레이", "Replays")}</b><span>${L("최근 5판 다시 보기와 공유", "Watch and share your last 5 games")}</span></button>
    <button class="ms" id="edBtn"><b>${L("맵 에디터", "Map editor")}</b><span>${L("나만의 맵을 만들고 링크로 공유", "Build your own map and share it as a link")}</span></button>
    <button class="ms" id="achBtn"><b>${L("업적·통계", "Achievements & stats")}</b><span>${ACH_GOT.size} / ${ACH.length}</span></button>
    <button class="ms" id="cxBtn"><b>${L("도감", "Codex")}</b><span>${L("건물과 적 정보, 상대법", "Buildings, enemies and counters")}</span></button>
    <div class="help">${L(`드래그로 이동, 휠 또는 두 손가락으로 확대.<br>
    건설 버튼을 고른 뒤 맵을 누르면 건설됩니다. 터치는 위치를 탭한 뒤 ✓ 버튼으로 설치하고, 드래그는 화면 이동.<br>
    건물은 중계기나 코어의 연결선이 닿아야 작동합니다. 소행성은 연결선을 가립니다.<br>
    건물을 누르면 업그레이드(최대 Lv 3)와 판매를 할 수 있습니다.<br>
    별점은 잃은 건물 수로 정해집니다(3개 이하 ★3, 10개 이하 ★2, 쉬움은 최대 ★2). 짓는 중인 건물과 중계기는 판매 시 전액 환불.<br>
    레이저는 Lv 2에서 속사/저격으로 갈라집니다. 중계기는 8개, 코어는 20개까지 연결됩니다.<br>
    단축키: 숫자 건설, U 업그레이드(R/L 레이저 분기), Space 정지(정지 중에도 건설 가능), Esc 취소/메뉴, WASD·방향키 이동, +/- 확대.`, `Drag to pan; scroll wheel or pinch to zoom.<br>
    Pick a building, then click the map to build. On touch, tap a spot and press ✓; dragging pans the view.<br>
    Buildings only work when linked to a relay or the core. Asteroids block links.<br>
    Tap a building to upgrade it (up to Lv 3) or sell it.<br>
    Stars depend on buildings lost (3 or fewer ★3, 10 or fewer ★2; Easy caps at ★2). Unfinished buildings and relays sell for a full refund.<br>
    Lasers branch into Rapid or Lance at Lv 2. Relays hold 8 links, the core 20.<br>
    Keys: numbers build, U upgrade (R/L laser branch), Space stop (you can still build), Esc cancel/menu, WASD/arrows pan, +/- zoom.`)}</div>
    <p class="ver">Ore Belt v${APP_VERSION} · <a href="${REPO_URL}/blob/main/CHANGELOG.md" target="_blank" rel="noopener">${L("변경 로그", "Changelog")}</a> · <a href="${REPO_URL}" target="_blank" rel="noopener">GitHub</a></p></div>`;
  o.hidden = false;
  o.querySelectorAll(".grid .ms[data-i]").forEach(b => b.onclick = () => startMission(+b.dataset.i));
  if (sv) $("resume").onclick = loadGame;
  if (!$("daily").disabled) $("daily").onclick = () => newGame(-1);
  $("cxBtn").onclick = () => showCodex(showMenu);
  $("edBtn").onclick = () => openEditor();
  if (showNews) $("newsOk").onclick = () => { store.set("orebelt.ver", APP_VERSION); showMenu(); };
  $("rpBtn").onclick = () => showReplays(showMenu);
  if (SHARED_REPLAY) $("shRp").onclick = () => startReplay(SHARED_REPLAY);
  if (SHARED) { $("shPlay").onclick = () => { CUSTOM = customMission(decodeMap(SHARED), SHARED); newGame(-2); }; $("shEdit").onclick = () => openEditor(SHARED); }
  $("achBtn").onclick = () => showAch(showMenu);
  $("diffBtn").onclick = () => { diffIdx = (diffIdx + 1) % 3; store.set("orebelt.diff", String(diffIdx)); showMenu(); };
  $("setBtn").onclick = () => showSettings(showMenu);
}
function endGame(win) {
  if (S.over) return;
  if (S.replay) { S.over = win ? "win" : "lose"; setTimeout(endReplay, 900); return; }
  S.over = win ? "win" : "lose"; S.build = null; ghost = null; clearSave(); renderTip(); sfx(win ? "win" : "lose");
  const coreF = Math.max(0, S.core.hp / S.core.maxHp);
  let stars = 0;
  if (win) { STATS.wins++; if (S.m.goal && S.m.goal.waves && S.lost === 0 && S.mi >= 0) ach("flawless"); if (S.mi === 9 && S.dIdx === 2) ach("hard"); }
  if (win && S.m.goal && S.mi >= 0) { stars = S.lost <= 3 && coreF >= 0.5 ? 3 : S.lost <= 10 ? 2 : 1; if (S.dIdx === 0) stars = Math.min(2, stars); saveStars(S.mi, stars); }
  if (S.m.daily) { if (S.wave > dailyBest()) store.set("orebelt.daily", JSON.stringify({ key: todayKey(), best: S.wave })); }
  else if (!S.m.goal && !S.m.custom) { const best = +(store.get("orebelt.best") || 0); if (S.wave > best) store.set("orebelt.best", S.wave); }
  saveStats(); checkAch(); const replay = saveReplayFromGame();
  const mm = Math.floor(S.t / 60), ss = String(Math.floor(S.t % 60)).padStart(2, "0");
  const next = S.mi + 1, hasNext = win && MISSIONS[next] && MISSIONS[next].goal;
  setTimeout(() => {
    const o = $("overlay");
    const title = win ? L("임무 완료", "Mission complete") : (S.m.goal ? L("코어가 파괴되었습니다", "Core destroyed") : L(`웨이브 ${S.wave}까지 버텼습니다`, `Survived to wave ${S.wave}`));
    o.innerHTML = `<div class="card"><h1 style="font-size:36px">${title}</h1>
      ${stars ? `<div class="stars">${starStr(stars)}</div>` : ""}
      ${S.newAch && S.newAch.length ? `<p class="newach">${L("새 업적", "New achievements")}: ${S.newAch.join(", ")}</p>` : ""}
      <p>${S.m.goal && S.mi >= 0 ? S.mi + 1 + ". " : ""}${S.m.name}</p>
      ${win && S.mi >= 0 && STORY[S.mi] ? `<div class="msg"><i class="av">S</i><div><b>${L("관제관 세라", "Controller Sera")}</b><p>${L(STORY[S.mi][5], STORY[S.mi][6])}</p></div></div>` : ""}
      <dl class="stats"><dt>${L("시간", "Time")}</dt><dd>${mm}:${ss}</dd><dt>${L("코어 내구도", "Core HP")}</dt><dd>${Math.round(coreF * 100)}%</dd><dt>${L("잃은 건물", "Buildings lost")}</dt><dd>${S.lost}</dd>
      <dt>${L("채굴한 광석", "Ore mined")}</dt><dd>${Math.floor(S.oreMined)}</dd><dt>${L("격파", "Kills")}</dt><dd>${S.kills}</dd><dt>${L("웨이브", "Waves")}</dt><dd>${S.wave}</dd></dl>
      ${hasNext ? `<button class="ms" id="next"><b>${L("다음 임무", "Next mission")}: ${MISSIONS[next].name}</b></button>` : ""}
      ${S.m.custom ? `<button class="ms" id="toEd"><b>${L("에디터로", "Back to editor")}</b></button>` : ""}<button class="ms" id="again"><b>${L("다시 하기", "Retry")}</b></button>${replay ? `<button class="ms" id="watch"><b>${L("리플레이 보기", "Watch replay")}</b></button>` : ""}<button class="ms" id="tomenu"><b>${L("임무 선택", "Missions")}</b></button></div>`;
    o.hidden = false; $("info").hidden = true; toastTimer = 0; $("toast").style.opacity = 0;
    if (hasNext) $("next").onclick = () => startMission(next);
    $("again").onclick = () => newGame(S.mi); $("tomenu").onclick = showMenu;
    if ($("watch")) $("watch").onclick = () => startReplay(replay);
    if ($("toEd")) $("toEd").onclick = () => openEditor(S.m.custom);
  }, 900);
}
