// Audio output: MELP speech (.elp), A-law sound banks (.swb), G.726 movie audio.
// Mixer: master -> {music, sfx, voice} buses. Volumes persist in localStorage; ?mute=1 silences everything.
let ctx = null;
const buses = {};
const SETTINGS_KEY = 'xml-web-audio';
export const settings = (() => {
  let s = { master: 1, music: 0.6, sfx: 0.9, voice: 1, muted: false };
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
    buses.master = ctx.createGain();
    buses.master.connect(ctx.destination);
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
export function setVolume(name, value) {
  settings[name] = Math.max(0, Math.min(1, value));
  applyVolumes();
  saveAudioSettings();
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

export function playPCM(samples, rate = 8000, volume = 1, busName = 'sfx') {
  const ac = audioContext();
  const buf = ac.createBuffer(1, samples.length, rate);
  buf.copyToChannel(samples, 0);
  const src = ac.createBufferSource();
  const gain = ac.createGain();
  gain.gain.value = volume;
  src.buffer = buf;
  src.connect(gain).connect(bus(busName));
  src.start();
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
