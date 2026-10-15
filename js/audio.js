// Ore Belt · audio.js: WebAudio 효과음·배경음 합성, 파티클, 화면 흔들림
"use strict";
// ---------- audio (WebAudio synth) ----------
const AU = { ctx: null, master: null, noise: null, muted: store.get("orebelt.mute") === "1", last: {} };
function auInit() {
  if (AU.ctx) { if (AU.ctx.state === "suspended") AU.ctx.resume(); return; }
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    AU.ctx = new C(); AU.master = AU.ctx.createGain(); AU.master.gain.value = AU.muted ? 0 : 0.35; AU.master.connect(AU.ctx.destination);
    const len = AU.ctx.sampleRate, buf = AU.ctx.createBuffer(1, len, AU.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    AU.noise = buf;
  } catch { AU.ctx = null; }
}
addEventListener("pointerdown", auInit); addEventListener("keydown", auInit);
function tone(type, f0, f1, dur, vol, delay = 0) {
  const c = AU.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(AU.master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, fq, delay = 0) {
  const c = AU.ctx, t = c.currentTime + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = AU.noise; f.type = "lowpass"; f.frequency.setValueAtTime(fq, t); f.frequency.exponentialRampToValueAtTime(80, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(AU.master); s.start(t); s.stop(t + dur);
}
const SFX_GAP = { zap: 0.08, laser: 0.12, hit: 0.1, boom: 0.07, launch: 0.08, kill: 0.05, done: 0.1 };
function sfx(n) {
  if (!AU.ctx || AU.muted || AU.ctx.state !== "running") return;
  const now = AU.ctx.currentTime;
  if (SFX_GAP[n] && now - (AU.last[n] || 0) < SFX_GAP[n]) return;
  AU.last[n] = now;
  switch (n) {
    case "laser": tone("sawtooth", 1400, 700, 0.07, 0.03); break;
    case "launch": noise(0.25, 0.1, 2500); tone("square", 300, 120, 0.2, 0.035); break;
    case "boom": noise(0.35, 0.28, 1200); tone("sine", 120, 40, 0.3, 0.18); break;
    case "bigboom": noise(0.9, 0.5, 900); tone("sine", 90, 25, 0.8, 0.35); break;
    case "kill": noise(0.15, 0.12, 3000); tone("square", 600, 150, 0.12, 0.04); break;
    case "hit": tone("square", 180, 90, 0.08, 0.05); break;
    case "place": tone("triangle", 520, 780, 0.08, 0.12); break;
    case "done": tone("sine", 660, 660, 0.07, 0.08); tone("sine", 990, 990, 0.1, 0.08, 0.07); break;
    case "up": [523, 659, 784].forEach((f, i) => tone("triangle", f, f, 0.12, 0.12, i * 0.07)); break;
    case "err": tone("square", 160, 120, 0.12, 0.07); break;
    case "zap": noise(0.12, 0.12, 7000); tone("square", 1200, 300, 0.1, 0.035); break;
    case "alarm": for (let i = 0; i < 2; i++) tone("square", 520, 380, 0.22, 0.06, i * 0.28); break;
    case "win": [523, 659, 784, 1046].forEach((f, i) => tone("triangle", f, f, 0.25, 0.14, i * 0.12)); break;
    case "lose": [392, 330, 262, 196].forEach((f, i) => tone("sawtooth", f, f * 0.98, 0.3, 0.07, i * 0.18)); break;
  }
}
function setSound(mode) {
  soundMode = mode; AU.muted = mode === 2; store.set("orebelt.sound", String(mode));
  if (AU.master) AU.master.gain.value = AU.muted ? 0 : 0.35;
  $("muteBtn").textContent = [L("소리 켜짐", "Sound on"), L("음악 꺼짐", "Music off"), L("소리 꺼짐", "Sound off")][mode];
}

// ---------- particles / shake ----------
function burst(x, y, n, col, spd = 120, life = 0.6, size = 2) {
  if (!S) return;
  for (let i = 0; i < n && S.parts.length < 700; i++) {
    const a = rand(0, 6.28), v = rand(0.2, 1) * spd;
    S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, max: rand(0.5, 1) * life, col, s: rand(0.6, 1.4) * size });
  }
}
function shake(a) { if (S && SET.shake) S.shake = Math.min(14, S.shake + a); }
function stepFx(dt) {
  for (const f of S.fx) f.t += dt;
  S.fx = S.fx.filter(f => f.t < f.max);
  const k = Math.max(0, 1 - 2 * dt);
  for (const p of S.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= k; p.vy *= k; }
  S.parts = S.parts.filter(p => p.t < p.max);
}

// ---------- music: layered orchestral score that follows the camera zoom ----------
// One 8-bar piece in A minor (Am F C G | Am F G E), 84 BPM. Three layers always play in sync;
// only their volumes change with zoom so they always sound like one song:
//   zoomed out  -> low  (cello/bass + low pad)
//   default     -> low + mid (strings pad + harp arpeggio)
//   zoomed in   -> low + mid + high (flute melody + glockenspiel)
const MUS = { bus: null, filt: null, layer: null, step: 0, next: 0 };
const BPM = 84, SIXTEENTH = 60 / BPM / 4;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const SONG = [ // [bass root, mid chord voicing, melody [step, midi, len16ths]...]
  [45, [57, 60, 64], [[0, 76, 4], [4, 74, 2], [6, 72, 2], [8, 71, 4], [12, 72, 4]]],
  [41, [53, 57, 60], [[0, 69, 8], [8, 72, 4], [12, 77, 4]]],
  [48, [55, 60, 64], [[0, 76, 4], [4, 79, 4], [8, 76, 4], [12, 74, 4]]],
  [43, [55, 59, 62], [[0, 74, 8], [8, 71, 4], [12, 67, 4]]],
  [45, [57, 60, 64], [[0, 72, 4], [4, 76, 4], [8, 81, 8]]],
  [41, [53, 57, 60], [[0, 81, 4], [4, 79, 2], [6, 77, 2], [8, 76, 8]]],
  [43, [55, 59, 62], [[0, 74, 4], [4, 71, 4], [8, 74, 4], [12, 79, 4]]],
  [40, [56, 59, 64], [[0, 76, 8], [8, 71, 4], [12, 68, 4]]],
];
let soundMode = +(store.get("orebelt.sound") ?? (store.get("orebelt.mute") === "1" ? 2 : 0));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function zoomRel() { const base = clamp(Math.min(cw / 560, ch / 640), 0.5, 1.4); return cam.z / base; }
function musicLayers() { const r = zoomRel(); return { low: 1, mid: smooth(0.65, 0.85, r), high: smooth(1.15, 1.35, r) }; }
function voice(dest, { type = "sine", f, t, dur, vol, a = 0.02, rel = 0.25, det = [0], vib = 0, cut = 0 }) {
  const c = AU.ctx, e = c.createGain(); let out = e;
  if (cut) { const fl = c.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = cut; e.connect(fl); out = fl; }
  out.connect(dest);
  e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(vol, t + a);
  e.gain.setValueAtTime(vol, t + Math.max(a, dur - rel)); e.gain.linearRampToValueAtTime(0.0001, t + dur + rel);
  for (const d of det) {
    const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = d;
    if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.2; lg.gain.value = f * vib; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur + rel + 0.05); }
    o.connect(e); o.start(t); o.stop(t + dur + rel + 0.05);
  }
}
function scheduleStep(step, t) {
  const bar = Math.floor(step / 16) % SONG.length, s = step % 16, [root, chord, mel] = SONG[bar], L = MUS.layer;
  // LOW: cello/bass line + sustained low pad
  if (s === 0) voice(L.low, { type: "sawtooth", f: mtof(root), t, dur: SIXTEENTH * 7, vol: 0.11, a: 0.04, rel: 0.2, cut: 420 });
  if (s === 8) voice(L.low, { type: "sawtooth", f: mtof(root + 7), t, dur: SIXTEENTH * 3.5, vol: 0.09, a: 0.03, rel: 0.15, cut: 420 });
  if (s === 12) voice(L.low, { type: "sawtooth", f: mtof(root + 12), t, dur: SIXTEENTH * 3.5, vol: 0.08, a: 0.03, rel: 0.15, cut: 480 });
  if (s === 0) for (const m of [root + 12, root + 19]) voice(L.low, { type: "triangle", f: mtof(m), t, dur: SIXTEENTH * 16, vol: 0.035, a: 0.6, rel: 0.6 });
  // MID: string pad (chord) + harp arpeggio in eighths
  if (s === 0) for (const m of chord) voice(L.mid, { type: "sawtooth", f: mtof(m), t, dur: SIXTEENTH * 16, vol: 0.022, a: 0.5, rel: 0.6, det: [-6, 6], cut: 1400 });
  if (s % 2 === 0) { const order = [0, 1, 2, 1, 0, 1, 2, 1], m = chord[order[s / 2]] + (s >= 8 ? 12 : 0); voice(L.mid, { type: "triangle", f: mtof(m), t, dur: SIXTEENTH * 1.6, vol: 0.05, a: 0.005, rel: 0.35 }); }
  // HIGH: flute melody with vibrato + glockenspiel accent on beat 1 and 3
  for (const [st, m, len] of mel) if (st === s) voice(L.high, { type: "triangle", f: mtof(m), t, dur: SIXTEENTH * len * 0.92, vol: 0.06, a: 0.04, rel: 0.18, vib: 0.006 });
  if (s === 0 || s === 8) voice(L.high, { type: "sine", f: mtof(chord[s === 0 ? 2 : 0] + 24), t, dur: 0.05, vol: 0.035, a: 0.003, rel: 0.6 });
}
// ---- ambient style: slow, airy D-dorian piece (Dm9 Bbmaj7 Fmaj7 Cadd9), 60 BPM, long reverb ----
// Written for Ore Belt as a nod to the "atmospheric, calming" mood players described in the original; it is not a copy of any track.
const EIGHTH = 0.5;
const AMB = [ // [bass root, pad chord, bell notes [step, midi]]
  [38, [53, 57, 60, 64], [[2, 81], [5, 77]]],
  [34, [50, 53, 57, 62], [[3, 86], [6, 77]]],
  [41, [53, 57, 60, 64], [[1, 84], [6, 81]]],
  [36, [52, 55, 60, 62], [[2, 79], [5, 86]]],
];
function scheduleAmb(step, t) {
  const bar = Math.floor(step / 8) % AMB.length, s = step % 8, [root, chord, bells] = AMB[bar], L = MUS.layer;
  // LOW: deep sine drone with a soft octave and a fifth that blooms mid-bar
  if (s === 0) { voice(L.low, { f: mtof(root), t, dur: EIGHTH * 8, vol: 0.13, a: 1.2, rel: 1.6 }); voice(L.low, { type: "triangle", f: mtof(root + 12), t, dur: EIGHTH * 8, vol: 0.04, a: 1.5, rel: 1.6 }); }
  if (s === 4) voice(L.low, { type: "triangle", f: mtof(root + 19), t, dur: EIGHTH * 4, vol: 0.025, a: 1, rel: 1.4 });
  // MID: slow-swelling pad + sparse plucks
  if (s === 0) for (const m of chord) voice(L.mid, { type: "sawtooth", f: mtof(m), t, dur: EIGHTH * 8, vol: 0.016, a: 1.8, rel: 2.2, det: [-8, 8], cut: 900 });
  if (s === 1 || s === 3 || s === 6) voice(L.mid, { type: "triangle", f: mtof(chord[[1, 3, 0][[1, 3, 6].indexOf(s)]] + 12), t, dur: 0.5, vol: 0.03, a: 0.01, rel: 1.4 });
  // HIGH: glassy pentatonic bells with a quiet octave shimmer
  for (const [st, m] of bells) if (st === s) { voice(L.high, { f: mtof(m), t, dur: 0.08, vol: 0.045, a: 0.004, rel: 2.6 }); voice(L.high, { f: mtof(m + 12), t: t + 0.02, dur: 0.05, vol: 0.012, a: 0.004, rel: 2 }); }
}
function buildMusicGraph(c, dest) {
  const g = { bus: c.createGain(), filt: c.createBiquadFilter(), wet: c.createGain(), verb: c.createConvolver(), layer: {} };
  g.bus.gain.value = 0; g.filt.type = "lowpass"; g.filt.frequency.value = 6000; g.wet.gain.value = 0.12;
  const len = Math.floor(c.sampleRate * 3.2), ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  g.verb.buffer = ir;
  g.filt.connect(g.bus); g.filt.connect(g.wet).connect(g.verb).connect(g.bus); g.bus.connect(dest);
  for (const k of ["low", "mid", "high"]) { const l = c.createGain(); l.gain.value = 0; l.connect(g.filt); g.layer[k] = l; }
  return g;
}
const musicStyle = () => (typeof SET !== "undefined" && SET.music === "amb" ? "amb" : "orch");
function musicTick() {
  if (!AU.ctx || AU.ctx.state !== "running") return;
  const c = AU.ctx, now = c.currentTime;
  if (!MUS.bus) Object.assign(MUS, buildMusicGraph(c, AU.master));
  const style = musicStyle();
  if (MUS.style !== style) { MUS.style = style; MUS.step = 0; MUS.next = 0; MUS.wet.gain.setTargetAtTime(style === "amb" ? 0.55 : 0.12, now, 0.5); }
  const playing = S && !S.paused && !S.over && !S.editor;
  const target = soundMode !== 0 ? 0 : (playing ? 0.32 : 0.16) * (style === "amb" ? 1.25 : 1);
  MUS.bus.gain.setTargetAtTime(target, now, 0.6);
  const lv = musicLayers();
  for (const k in lv) MUS.layer[k].gain.setTargetAtTime(lv[k], now, 0.35);
  const inten = playing ? Math.min(1, S.enemies.length / 15) : 0;
  MUS.filt.frequency.setTargetAtTime(3000 + 5000 * inten, now, 1.2);
  if (target === 0) { MUS.next = 0; return; }
  if (MUS.next < now) MUS.next = now + 0.05;
  const amb = style === "amb", dur = amb ? EIGHTH : SIXTEENTH;
  while (MUS.next < now + 0.35) { (amb ? scheduleAmb : scheduleStep)(MUS.step, MUS.next); MUS.step++; MUS.next += dur; }
}
