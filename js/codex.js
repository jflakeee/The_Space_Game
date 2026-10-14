// Ore Belt · codex.js: 도감, 첫 조우 안내, 아이콘 렌더
"use strict";
// ---------- codex ----------
const EINFO = {
  scout:  { n: () => L("정찰기", "Scout"),   d: () => L("빠르고 약합니다. 수가 많으니 속사 레이저로 정리하세요.", "Fast and fragile, but numerous. Rapid lasers clean them up.") },
  raider: { n: () => L("약탈선", "Raider"),  d: () => L("주력 전투함. 레이저 사거리 근처에서 교전합니다.", "The backbone of a raid. Fights near laser range.") },
  heavy:  { n: () => L("중형선", "Heavy"),   d: () => L("느리지만 단단하고 사거리가 깁니다. 저격 레이저나 미사일로 상대하세요.", "Slow, tough and long-ranged. Counter with Lance lasers or missiles.") },
  bomber: { n: () => L("자폭선", "Bomber"),  d: () => L("가장 가까운 건물로 돌진해 범위 폭발합니다. 감속탑과 외곽 레이저로 접근 전에 처치하세요.", "Rams the nearest building and explodes. Slow fields and outer lasers stop it early.") },
  shield: { n: () => L("실드함", "Shield Ship"), d: () => L("주변 아군이 받는 피해를 절반으로 줄입니다. 실드함 자신은 보호받지 못하니 먼저 노리세요.", "Halves damage taken by nearby allies, but not itself. Kill it first.") },
  sniper: { n: () => L("저격선", "Sniper"), d: () => L("레이저보다 긴 사거리에서 강한 한 발을 쏩니다. 저격 레이저나 미사일로 끌어내리세요.", "Outranges lasers with heavy shots. Bring it down with Lance lasers or missiles.") },
  splitter: { n: () => L("분열선", "Splitter"), d: () => L("파괴되면 정찰기 3기로 나뉩니다. 아크 코일이나 속사 레이저로 뒷정리하세요.", "Splits into 3 scouts when destroyed. Arc coils and Rapid lasers mop up.") },
  dread:  { n: () => L("요새함", "Dreadnought"), d: () => L("10웨이브마다 등장하는 최종 보스. 여러 건물에 동시 포격하고, 체력이 절반 이하가 되면 자폭선을 내보냅니다. 미끼 신호기로 포격을 분산하세요.", "Final boss every 10th wave. Shells several buildings at once and launches bombers below half HP. Spread its fire with decoys.") },
  boss:   { n: () => L("모함", "Mothership"), d: () => L("5웨이브마다 등장(10의 배수 제외). 체력이 매우 높고 정찰기를 계속 내보냅니다. 저격 레이저가 효과적입니다.", "Every 5th wave (except 10s). Huge HP, keeps launching scouts. Lance lasers excel.") },
};
function drawEnemyBody(e, t) {
  ctx.fillStyle = COL.hos; ctx.strokeStyle = "#ffc2ca"; ctx.lineWidth = 1.2;
  if (e.kind === "bomber") {
    const k = 0.5 + 0.5 * Math.sin(t * 12);
    poly(4, e.r * 1.25, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = `rgba(255,220,120,${0.35 + 0.65 * k})`; circle(0, 0, e.r * 0.45); ctx.fill();
  } else if (e.kind === "shield") {
    poly(6, e.r, 0); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#ffe0e5"; circle(0, 0, e.r * 0.3); ctx.fill();
  } else if (e.kind === "sniper") {
    ctx.beginPath(); ctx.moveTo(e.r * 1.8, 0); ctx.lineTo(-e.r * 0.6, -e.r * 0.6); ctx.lineTo(-e.r, 0); ctx.lineTo(-e.r * 0.6, e.r * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#ffe0e5"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(e.r * 2.4, 0); ctx.stroke();
  } else if (e.kind === "splitter") {
    for (const [ox, oy] of [[e.r * 0.4, 0], [-e.r * 0.4, -e.r * 0.5], [-e.r * 0.4, e.r * 0.5]]) { circle(ox, oy, e.r * 0.55); ctx.fill(); ctx.stroke(); }
  } else if (e.kind === "dread") {
    poly(6, e.r, 0); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = "#5a1a2a"; poly(6, e.r * 0.5, 0); ctx.fill();
    ctx.fillStyle = COL.hos; ctx.fillRect(-e.r * 0.6, -e.r * 1.25, e.r * 1.1, e.r * 0.35); ctx.fillRect(-e.r * 0.6, e.r * 0.9, e.r * 1.1, e.r * 0.35);
  } else if (e.kind === "boss") {
    ctx.beginPath(); ctx.moveTo(e.r * 1.2, 0); ctx.lineTo(e.r * 0.2, -e.r * 0.6); ctx.lineTo(-e.r, -e.r * 0.9); ctx.lineTo(-e.r * 0.7, 0);
    ctx.lineTo(-e.r, e.r * 0.9); ctx.lineTo(e.r * 0.2, e.r * 0.6); ctx.closePath();
    ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = "#5a1a2a"; circle(-e.r * 0.1, 0, e.r * 0.3); ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(e.r * 1.3, 0); ctx.lineTo(-e.r, -e.r * 0.85); ctx.lineTo(-e.r * 0.5, 0); ctx.lineTo(-e.r, e.r * 0.85); ctx.closePath();
    ctx.fill(); ctx.stroke();
    if (e.kind === "heavy") { ctx.fillStyle = "#5a1a2a"; circle(0, 0, e.r * 0.35); ctx.fill(); }
  }
}
function iconURL(fn, size = 56) {
  const c = document.createElement("canvas"); c.width = c.height = size * 2;
  const old = ctx; ctx = c.getContext("2d");
  try { ctx.setTransform(2, 0, 0, 2, size, size); fn(); } finally { ctx = old; }
  return c.toDataURL();
}
function bIcon(type, br) { const r = DEF[type].r, sc = Math.min(1.6, 20 / r); return iconURL(() => { ctx.scale(sc, sc); drawB({ type, x: 0, y: 0, r, ang: -Math.PI / 4, prog: 1, br, lvl: 1, powered: true, hp: 1, maxHp: 1 }, false); }); }
function eIcon(kind) { const r = EN[kind].r, sc = Math.min(1.8, 18 / r); return iconURL(() => { ctx.scale(sc, sc); ctx.rotate(-Math.PI / 2); drawEnemyBody({ kind, r }, 0.2); }); }
function showCodex(back) {
  const o = $("overlay"), row = (img, title, sub, body) => `<div class="cx"><img src="${img}" alt=""><div><b>${title}</b><small>${sub}</small><p>${body}</p></div></div>`;
  const bRows = ["core", ...ORDER].map(k => { const d = DEF[k];
    const stat = [d.cost ? `${L("비용", "Cost")} ${d.cost}` : "", `${L("내구도", "HP")} ${d.hp}`, d.range ? `${L("사거리", "Range")} ${d.range}` : "", d.link ? `${L("연결", "Links")} ${LINK_CAP[k]}` : ""].filter(Boolean).join(" · ");
    return row(bIcon(k), d.name, stat, d.desc); }).join("")
    + row(bIcon("laser", "rapid"), `${DEF.laser.name} (${BR.rapid()})`, "Lv 2+", BRD.rapid())
    + row(bIcon("laser", "lance"), `${DEF.laser.name} (${BR.lance()})`, "Lv 2+", BRD.lance());
  const eRows = Object.keys(EN).map(k => { const d = EN[k];
    const stat = [`${L("체력", "HP")} ${d.hp}`, `${L("속도", "Speed")} ${d.spd}`, d.range ? `${L("사거리", "Range")} ${d.range}` : L("근접 자폭", "Melee blast")].join(" · ");
    return row(eIcon(k), EINFO[k].n(), stat, EINFO[k].d()); }).join("");
  o.innerHTML = `<div class="card"><h1 style="font-size:36px">${L("도감", "Codex")}</h1>
    <h3>${L("건물", "Buildings")}</h3>${bRows}<h3>${L("적", "Enemies")}</h3>${eRows}
    <h3>${L("환경 위험", "Hazards")}</h3>
    ${row(iconURL(() => { ctx.strokeStyle = COL.hos; ctx.setLineDash([5, 4]); ctx.lineWidth = 2; circle(0, 0, 20); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = "#ffc882"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(18, -26); ctx.stroke(); circle(4, -6, 5); ctx.fillStyle = "#ffd9a0"; ctx.fill(); }), L("유성우", "Meteor shower"), L("피해 70 · 반경 38", "70 damage · radius 38"), L("붉은 점선 원이 표시되고 약 3초 뒤 충돌합니다. 건물과 적 모두 피해를 입습니다. 수리소와 여유 광석으로 대비하세요.", "Red dashed circles mark impacts about 3 seconds ahead. Hits buildings and enemies alike. Keep repair bays and spare ore."))}
    ${row(iconURL(() => { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 26); g.addColorStop(0, "rgba(150,110,255,.8)"); g.addColorStop(1, "rgba(110,80,220,0)"); ctx.fillStyle = g; circle(0, 0, 26); ctx.fill(); }), L("이온 성운", "Ion nebula"), L("태양광 ×0.4 · 적 속도 ×0.7", "Solar ×0.4 · enemy speed ×0.7"), L("성운 안의 태양광은 효율이 크게 떨어지지만, 성운을 지나는 적도 느려집니다. 성운 가장자리에 포탑을 두면 유리합니다.", "Solar panels inside barely work, but enemies crossing it slow down. Turrets at the edge benefit."))}
    ${row(iconURL(() => { ctx.fillStyle = "#ffb347"; circle(0, 0, 11); ctx.fill(); ctx.strokeStyle = "#ffb347"; ctx.lineWidth = 2.5; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 15, Math.sin(a) * 15); ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); ctx.stroke(); } }), L("태양 플레어", "Solar flare"), L("12초 · 태양광 ×2 · 적 속도 ×1.2", "12s · solar ×2 · enemy speed ×1.2"), L("화면이 주황빛으로 물드는 동안 에너지가 넘칩니다. 배터리를 채우고 에너지 소모가 큰 무기를 마음껏 쓰세요.", "While the screen glows orange, energy overflows. Fill batteries and fire energy-hungry weapons freely."))}
    <p class="help">${L("적 체력은 웨이브와 난이도에 따라 늘어납니다.", "Enemy HP scales with wave and difficulty.")}</p>
    <button class="ms" id="cxBack"><b>${L("돌아가기", "Back")}</b></button></div>`;
  o.hidden = false; o.scrollTop = 0;
  $("cxBack").onclick = back;
}
function seenHint(kind) {
  let seen = []; try { seen = JSON.parse(store.get("orebelt.seen")) || []; } catch {}
  if (seen.includes(kind)) return;
  seen.push(kind); store.set("orebelt.seen", JSON.stringify(seen));
  toast(`${L("새 적", "New enemy")}: ${EINFO[kind].n()}. ${EINFO[kind].d()}`, 6);
}
