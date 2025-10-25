// Simple sound utilities using Web Audio API (no assets)
// Discrete UI sounds with tiny envelopes. Persist enabled flag in localStorage.

let audioCtx = null;
let enabled = true;

const LS_KEY = 'blw_sound_enabled';

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  // On iOS, resume on user interaction
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setEnabled(v) {
  enabled = !!v;
  try { localStorage.setItem(LS_KEY, enabled ? '1' : '0'); } catch {}
}

export function isEnabled() {
  // Lazy load from LS on first call
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === '0') enabled = false;
  } catch {}
  return enabled;
}

function envGain(duration = 0.08, peak = 0.09) {
  const ctx = getAudioContext();
  if (!ctx) return null;
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  gain.connect(ctx.destination);
  return { ctx, now, gain };
}

function blip(freq = 200, duration = 0.08, type = 'sine', peak = 0.09) {
  if (!isEnabled()) return;
  const e = envGain(duration, peak);
  if (!e) return;
  const { ctx, now, gain } = e;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + duration);
}

function clickFx() {
  // A quick high blip then lower blip for a subtle click
  blip(2200, 0.025, 'square', 0.06);
  setTimeout(() => blip(1200, 0.03, 'square', 0.05), 10);
}

function successFx() {
  // Short up-chirp
  if (!isEnabled()) return;
  const e = envGain(0.14, 0.09);
  if (!e) return;
  const { ctx, now, gain } = e;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.14);
}

function errorFx() {
  // Short down-chirp
  if (!isEnabled()) return;
  const e = envGain(0.16, 0.1);
  if (!e) return;
  const { ctx, now, gain } = e;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.16);
}

export function playClick() { clickFx(); }
export function playSuccess() { successFx(); }
export function playError() { errorFx(); }

// Ensure first user gesture resumes context
export function prime() { getAudioContext(); }
