// Ore Belt · replay.js: 결정적 시뮬레이션 기록·재생(리플레이), 공유 링크(#replay=)
"use strict";
// ---------- replay ----------
// The sim runs at a fixed step with a seeded RNG, so a replay is just: mission + seed + settings + timed player actions.
const STEP = 1 / 40, REPLAY_V = 1, REPLAY_KEY = "orebelt.replays";
let REPLAY_BACKUP = null, SHARED_REPLAY = null;

function doAction(a) {
  if (!S || S.over) return false;
  if (S.replay && !a._r) return false;
  if (S.rec && !S.replay) { const { _r, ...rest } = a; S.rec.push({ ...rest, tk: S.tick }); }
  const o = Math.random; if (S.rng) Math.random = S.rng;
  try { return execAction(a); } finally { Math.random = o; }
}
function execAction(a) {
  switch (a.k) {
    case "p": {
      const nb = mkB(a.t, a.x, a.y, !!SET.instant);
      S.ore -= DEF[a.t].cost; S.buildings.push(nb); S.dirty = true;
      if (SET.instant) burst(nb.x, nb.y, 10, COL.en, 70, 0.4);
      if (!S.replay) STATS.built++;
      return true;
    }
    case "u": {
      const b = S.buildings[a.i]; if (!b) return false;
      const c = upCost(b, a.br || b.br);
      S.ore -= c; b.spent += c; b.lvl++; if (!S.replay) { STATS.upgrades++; if (b.lvl >= 3) ach("maxlv"); }
      const newBr = a.br && !b.br; if (a.br) b.br = a.br;
      const nh = st(b, "hp"); b.hp += nh - b.maxHp; b.maxHp = nh;
      if (RELAY[b.type]) S.dirty = true;
      boom(b.x, b.y, b.r * 2.2, COL.en); sfx("up");
      if (S.sel === b) { if (newBr) select(b); else updateInfo(); }
      return true;
    }
    case "s": {
      const b = S.buildings[a.i]; if (!b) return false;
      b.dead = true; S.ore += refund(b); S.buildings = S.buildings.filter(x => x !== b); S.dirty = true;
      if (S.sel === b) select(null);
      return true;
    }
    case "c": { const bonus = Math.floor(S.waveT * 0.5); S.ore += bonus; spawnWave(); S.waveT = S.m.gap; return bonus; }
    case "tut": S.tut = a.v; return true;
  }
  return false;
}
function simStep() {
  const R = S.replay;
  if (R) while (R.i < R.rec.a.length && R.rec.a[R.i].tk <= S.tick) { doAction({ ...R.rec.a[R.i], _r: true }); R.i++; }
  update(STEP);
  if (R && !S.over && S.tick > R.rec.ticks + 200) endReplay();
}

// ---------- storage ----------
function loadReplays() { try { return JSON.parse(store.get(REPLAY_KEY)) || []; } catch { return []; } }
function saveReplayFromGame() {
  if (!S || !S.rec || S.replay) return null;
  const rec = { v: REPLAY_V, ver: APP_VERSION, date: Date.now(), mi: S.mi, m: S.mi < 0 ? S.m : null, name: S.m.name, seed: S.seed, dIdx: S.dIdx, inst: SET.instant ? 1 : 0,
    tut0: S.tut0, ticks: S.tick, res: S.over, wave: S.wave, t: Math.round(S.t), kills: S.kills, a: S.rec };
  const list = loadReplays(); list.unshift(rec);
  while (list.length) { try { store.set(REPLAY_KEY, JSON.stringify(list.slice(0, 5))); break; } catch { list.pop(); } }
  return rec;
}
const b64e = str => btoa(String.fromCharCode(...new TextEncoder().encode(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64d = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)));
function replayCode(rec) {
  const short = { ...rec, a: rec.a.map(x => [x.tk, x.k, x.t ?? null, x.x ?? null, x.y ?? null, x.i ?? null, x.br ?? null, x.v ?? null]) };
  return b64e(JSON.stringify(short));
}
function replayFromCode(code) {
  try {
    const r = JSON.parse(b64d(code));
    if (!r || r.v !== REPLAY_V || !Array.isArray(r.a)) return null;
    r.a = r.a.map(([tk, k, t, x, y, i, br, v]) => { const o = { tk, k }; if (t != null) o.t = t; if (x != null) o.x = x; if (y != null) o.y = y; if (i != null) o.i = i; if (br != null) o.br = br; if (k === "tut") o.v = v; return o; });
    return r;
  } catch { return null; }
}
async function shareReplay(rec) {
  const url = location.href.split("#")[0] + "#replay=" + replayCode(rec);
  if (url.length > 30000) { toast(L("리플레이가 너무 길어 링크로 공유할 수 없습니다", "Replay is too long to share as a link"), 3); return; }
  try { if (navigator.share) { await navigator.share({ title: "Ore Belt replay", url }); return; } } catch (err) { if (err && err.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(url); toast(L("리플레이 링크를 복사했습니다", "Replay link copied"), 3); } catch { prompt(L("이 링크를 복사하세요", "Copy this link"), url); }
}

// ---------- viewer ----------
function startReplay(rec) {
  if (!REPLAY_BACKUP) REPLAY_BACKUP = { stats: JSON.stringify(STATS), inst: SET.instant, diff: diffIdx };
  SET.instant = rec.inst; diffIdx = rec.dIdx;
  if (rec.mi < 0) CUSTOM = rec.m;
  if (rec.ver && rec.ver !== APP_VERSION) toast(L(`v${rec.ver}에서 기록된 리플레이라 결과가 어긋날 수 있습니다`, `Recorded on v${rec.ver}; playback may differ`), 4);
  if (rec.mi >= 0 && !MISSIONS[rec.mi]) { toast(L("이 버전에 없는 임무입니다", "Mission not found in this version")); return; }
  newGame(rec.mi < 0 ? -2 : rec.mi, true, rec.seed);
  diffIdx = REPLAY_BACKUP.diff;
  S.tut = rec.tut0 ?? null; S.rec = null; S.replay = { rec, i: 0 }; S.speed = 1;
  document.body.classList.add("replaying");
  $("bar").hidden = true; $("tip").hidden = true; $("rpbar").hidden = false; $("rpinfo").hidden = false;
  renderRpBar();
}
function renderRpBar() {
  const B = [
    ["pp", () => S.paused ? L("재생", "Play") : L("일시정지", "Pause"), () => { S.paused = !S.paused; renderRpBar(); }],
    ["sp", () => S.speed + "×", () => { const v = [1, 2, 4, 8]; S.speed = v[(v.indexOf(S.speed) + 1) % v.length]; renderRpBar(); }],
    ["rs", () => L("처음부터", "Restart"), () => startReplay(S.replay.rec)],
    ["ex", () => L("나가기", "Exit"), exitReplay],
  ];
  const bar = $("rpbar"); bar.innerHTML = "";
  for (const [, label, fn] of B) { const b = document.createElement("button"); b.className = "bb"; b.innerHTML = `<span class="n">${label()}</span>`; b.onclick = fn; bar.appendChild(b); }
}
function rpTick() {
  if (!S || !S.replay) return;
  const R = S.replay, f = Math.min(1, S.tick / Math.max(1, R.rec.ticks));
  $("rpinfo").style.top = ($("hud").offsetHeight + 4) + "px";
  $("rpinfo").innerHTML = `<b>${L("리플레이", "Replay")}</b> · ${R.rec.name} · <i style="display:inline-block;width:${Math.round(f * 100)}px;max-width:100px;height:4px;background:var(--en);vertical-align:middle"></i> ${Math.round(f * 100)}%`;
}
function endReplay() {
  if (!S || !S.replay) return;
  S.over = S.over || "end"; S.paused = true;
  const rec = S.replay.rec, o = $("overlay");
  o.innerHTML = `<div class="card"><h1 style="font-size:34px">${L("리플레이 종료", "Replay finished")}</h1>
    <p>${rec.name} · ${rec.res === "win" ? L("승리", "Victory") : L("패배", "Defeat")} · ${L("웨이브", "wave")} ${rec.wave}</p>
    <button class="ms" id="rpAgain"><b>${L("다시 보기", "Watch again")}</b></button><button class="ms" id="rpList"><b>${L("리플레이 목록", "Replay list")}</b></button></div>`;
  o.hidden = false; $("rpbar").hidden = true;
  $("rpAgain").onclick = () => startReplay(rec);
  $("rpList").onclick = () => { exitReplay(true); showReplays(showMenu); };
}
function exitReplay(quiet) {
  if (REPLAY_BACKUP) { Object.assign(STATS, JSON.parse(REPLAY_BACKUP.stats)); SET.instant = REPLAY_BACKUP.inst; REPLAY_BACKUP = null; }
  document.body.classList.remove("replaying");
  $("rpbar").hidden = true; $("rpinfo").hidden = true;
  S = null; if (!quiet) showMenu();
}
function showReplays(back) {
  const o = $("overlay"), list = loadReplays();
  $("hud").hidden = true; $("bar").hidden = true; $("info").hidden = true; $("rpbar").hidden = true; $("rpinfo").hidden = true;
  const fmt = r => { const d = new Date(r.date); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
  o.innerHTML = `<div class="card"><h1 style="font-size:36px">${L("리플레이", "Replays")}</h1>
    <p class="help">${L("최근 5판이 자동 저장됩니다. 같은 버전의 게임에서만 정확히 재생됩니다.", "Your last 5 games are saved automatically. Replays are exact only on the same game version.")}</p>
    ${list.length ? list.map((r, i) => `<div class="rp"><div><b>${r.name}</b><small>${r.ver && r.ver !== APP_VERSION ? `v${r.ver} · ` : ""}${r.res === "win" ? L("승리", "Victory") : L("패배", "Defeat")} · ${L("웨이브", "wave")} ${r.wave} · ${Math.floor(r.t / 60)}:${String(r.t % 60).padStart(2, "0")} · ${fmt(r)}</small></div>
      <div class="row"><button data-w="${i}">${L("보기", "Watch")}</button><button data-s="${i}">${L("공유", "Share")}</button><button data-d="${i}" aria-label="delete">✕</button></div></div>`).join("")
      : `<p>${L("아직 리플레이가 없습니다. 한 판을 끝내면 자동으로 저장됩니다.", "No replays yet. Finish a game and it is saved automatically.")}</p>`}
    <button class="ms" id="rpBack"><b>${L("돌아가기", "Back")}</b></button></div>`;
  o.hidden = false; o.scrollTop = 0;
  o.querySelectorAll("[data-w]").forEach(b => b.onclick = () => startReplay(list[+b.dataset.w]));
  o.querySelectorAll("[data-s]").forEach(b => b.onclick = () => shareReplay(list[+b.dataset.s]));
  o.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { list.splice(+b.dataset.d, 1); store.set(REPLAY_KEY, JSON.stringify(list)); showReplays(back); });
  $("rpBack").onclick = back;
}
if (location.hash.startsWith("#replay=")) SHARED_REPLAY = replayFromCode(location.hash.slice(8));

