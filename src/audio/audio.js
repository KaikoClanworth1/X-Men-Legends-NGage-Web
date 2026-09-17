// Audio output: MELP speech (.elp), A-law sound banks (.swb), G.726 movie audio.
// Mixer: master -> {music, sfx, voice} buses. Volumes persist in localStorage; ?mute=1 silences everything.
let ctx = null;
const buses = {};
const SETTINGS_KEY = 'xml-web-audio';
export const settings = (() => {
  let s = { master: 0.8, music: 0.5, sfx: 0.7, voice: 0.9, muted: false };
  try { s = { ...s, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; } catch { /* defaults */ }
  if (new URLSearchParams(location.search).has('mute')) s.muted = true;
  return s;
})();
export function saveAudioSettings() {
  try { const { muted, ...rest } = settings; localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest)); } catch { /* ignore */ }
}

export function audioContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    // output chain: the game's 8 kHz clips are band-limited to 3.6 kHz (removes the harsh resampling images), mixed with
    // headroom and run through a soft limiter so overlapping sounds never hard-clip
    buses.master = ctx.createGain();
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass'; lowpass.frequency.value = 3800; lowpass.Q.value = 0.5;
    const headroom = ctx.createGain();
    headroom.gain.value = 0.55;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12; limiter.knee.value = 12; limiter.ratio.value = 8; limiter.attack.value = 0.003; limiter.release.value = 0.15;
    buses.master.connect(lowpass).connect(headroom).connect(limiter).connect(ctx.destination);
    for (const name of ['music', 'sfx', 'voice']) { buses[name] = ctx.createGain(); buses[name].connect(buses.master); }
    applyVolumes();
  }
  if (ctx.state === 'suspended' && !settings.muted) ctx.resume();
  return ctx;
}
export function bus(name) { audioContext(); return buses[name] || buses.master; }
export function applyVolumes() {
  if (!ctx) return;
  buses.master.gain.value = settings.muted ? 0 : settings.master;
  for (const name of ['music', 'sfx', 'voice']) buses[name].gain.value = settings[name];
}
const listeners = new Set();
export function onVolumeChange(fn) { listeners.add(fn); }
export function setMuted(on) { settings.muted = !!on; applyVolumes(); if (!on && ctx && ctx.state === 'suspended') ctx.resume(); listeners.forEach(f => f()); }
export function setVolume(name, value) {
  settings[name] = Math.max(0, Math.min(1, value));
  applyVolumes();
  saveAudioSettings();
  listeners.forEach(f => f());
}

// MELP 2400 bps decoder (TI/DoD reference compiled to WebAssembly; see the asset viewer repo for the bit layout)
let melp = null;
async function melpModule() {
  if (melp) return melp;
  const bin = await (await fetch(new URL('./melp.wasm', import.meta.url))).arrayBuffer();
  const stub = new Proxy({}, { get: () => () => 0 });
  const { instance } = await WebAssembly.instantiate(bin, { wasi_snapshot_preview1: stub });
  if (instance.exports._initialize) instance.exports._initialize();
  return (melp = instance.exports);
}
export async function decodeMELP(bytes) {
  const m = await melpModule();
  m.elp_init();
  const frames = bytes.length / 7 | 0, out = new Float32Array(frames * 180);
  for (let i = 0; i < frames; i++) {
    new Uint8Array(m.memory.buffer, m.elp_in(), 7).set(bytes.subarray(i * 7, i * 7 + 7));
    m.elp_decode();
    const pcm = new Int16Array(m.memory.buffer, m.elp_pcm(), 180);
    for (let k = 0; k < 180; k++) out[i * 180 + k] = pcm[k] / 32768;
  }
  return out;
}

// Low-rate clips played directly get the browser's cheap linear resampling, which leaves loud aliasing ("crunch").
// Upsample 4x with a windowed-sinc filter (cutoff 3.6 kHz at 8 kHz input) before handing them to Web Audio.
const UP = 4, HALF = 24;
const KERNEL = (() => {
  const k = new Float32Array(HALF * 2 * UP + 1), fc = 0.45 / UP;
  for (let i = 0; i < k.length; i++) {
    const n = i - HALF * UP, w = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (k.length - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (k.length - 1));
    k[i] = (n === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * n) / (Math.PI * n)) * w * UP;
  }
  return k;
})();
export function upsample(input, loop = false) {
  const n = input.length, out = new Float32Array(n * UP), K = KERNEL, len = K.length, c = HALF * UP;
  for (let j = 0; j < out.length; j++) {
    let acc = 0;
    // input sample i sits at output index i*UP; kernel index = j - i*UP + c
    const iLo = Math.ceil((j - c) / UP), iHi = Math.floor((j + c) / UP);
    for (let i = iLo; i <= iHi; i++) {
      const s = i >= 0 && i < n ? input[i] : loop ? input[((i % n) + n) % n] : 0;
      acc += s * K[j - i * UP + c];
    }
    out[j] = acc;
  }
  return out;
}
export function makeBuffer(samples, rate = 8000, loop = false) {
  const ac = audioContext(), data = upsample(samples, loop);
  const buf = ac.createBuffer(1, Math.max(1, data.length), rate * UP);
  buf.copyToChannel(data, 0);
  return buf;
}

export function playPCM(samples, rate = 8000, volume = 1, busName = 'sfx') {
  const ac = audioContext();
  const buf = makeBuffer(samples, rate);
  const src = ac.createBufferSource();
  const gain = ac.createGain(), t = ac.currentTime;
  // short fades so clips don't click when they start or are cut off
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.004);
  src.buffer = buf;
  src.connect(gain).connect(bus(busName));
  src.start(t);
  const stop = src.stop.bind(src);
  src.stop = (when = 0) => {
    const now = ac.currentTime;
    try { gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(gain.gain.value, now); gain.gain.linearRampToValueAtTime(0, now + 0.02); } catch { /* ignore */ }
    stop(Math.max(when, now + 0.025));
  };
  return src;
}

export class Voice {
  constructor(assets) { this.assets = assets; this.current = null; this.cache = new Map(); }
  stop() { if (this.current) { try { this.current.stop(); } catch { /* already stopped */ } this.current = null; } }
  async play(id, volume = 1) {
    this.stop();
    if (!id) return;
    const name = id + '.elp';
    if (!this.assets.has(name)) return;
    if (!this.cache.has(name)) this.cache.set(name, decodeMELP(await this.assets.bytes(name)));
    const pcm = await this.cache.get(name);
    this.current = playPCM(pcm, 8000, volume, 'voice');
  }
}
