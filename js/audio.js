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

// ---------- music (procedural ambient) ----------
const MUS = { nodes: null, step: 0, next: 0 };
const CHORDS = [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7], [164.8, 207.7, 246.9]];
let soundMode = +(store.get("orebelt.sound") ?? (store.get("orebelt.mute") === "1" ? 2 : 0));
function musicTick() {
  if (!AU.ctx || AU.ctx.state !== "running") return;
  const c = AU.ctx;
  if (!MUS.nodes) {
    const g = c.createGain(), f = c.createBiquadFilter();
    g.gain.value = 0; f.type = "lowpass"; f.frequency.value = 600; f.Q.value = 0.7;
    f.connect(g).connect(AU.master); MUS.nodes = { g, f };
  }
  const { g, f } = MUS.nodes, playing = S && !S.paused && !S.over;
  const target = soundMode !== 0 ? 0 : playing ? 0.22 : 0.1;
  g.gain.setTargetAtTime(target, c.currentTime, 0.8);
  const inten = playing ? Math.min(1, S.enemies.length / 15) : 0;
  f.frequency.setTargetAtTime(500 + 1800 * inten, c.currentTime, 1.5);
  if (target === 0 || c.currentTime + 0.15 < MUS.next) return;
  const t = Math.max(c.currentTime + 0.05, MUS.next), bar = 4, ch = CHORDS[MUS.step % 4];
  for (const fr of ch) for (const det of [-5, 5]) {
    const o = c.createOscillator(), e = c.createGain();
    o.type = "sawtooth"; o.frequency.value = fr / 2; o.detune.value = det;
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.045, t + 1.2); e.gain.linearRampToValueAtTime(0, t + bar + 0.6);
    o.connect(e).connect(f); o.start(t); o.stop(t + bar + 0.7);
  }
  if (inten > 0.1) for (let i = 0; i < 8; i++) {
    const fr = ch[i % 3] * (i % 2 ? 2 : 1), o = c.createOscillator(), e = c.createGain(), tt = t + i * bar / 8;
    o.type = "triangle"; o.frequency.value = fr;
    e.gain.setValueAtTime(0.0001, tt); e.gain.exponentialRampToValueAtTime(0.01 + 0.04 * inten, tt + 0.02); e.gain.exponentialRampToValueAtTime(0.0001, tt + 0.4);
    o.connect(e).connect(f); o.start(tt); o.stop(tt + 0.45);
  }
  MUS.step++; MUS.next = t + bar;
}
