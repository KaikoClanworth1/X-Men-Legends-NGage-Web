import { audioContext, bus, makeBuffer } from './audio.js';

// Sound banks (.swb): "SW3\0", u16 count, u16, u32; 36-byte entries (char[24] name, u32 flags, u32 size, u32 offset from table end);
// samples are 8 kHz 8-bit A-law. Music is short looping clips: menu1.swb/loop_menu, game1.swb/loop_battle + loop_boss,
// and per-location loops (mansion, up_mansion, subbasement, g_mission01, g_mission02, g_muir).
function alaw(x) {
  x ^= 0x55;
  const sign = x & 0x80, exp = (x >> 4) & 7, mant = x & 15;
  const s = exp ? ((mant << 4) + 0x108) << (exp - 1) : (mant << 4) + 8;
  return (sign ? s : -s) / 32768;
}

export function parseBank(bytes) {
  const d = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), n = d.getUint16(4, true), base = 12 + 36 * n, clips = new Map();
  for (let i = 0; i < n; i++) {
    const o = 12 + 36 * i;
    let name = '';
    for (let j = 0; j < 24 && bytes[o + j]; j++) name += String.fromCharCode(bytes[o + j]);
    const size = d.getUint32(o + 28, true), off = d.getUint32(o + 32, true);
    clips.set(name.toLowerCase(), bytes.subarray(base + off, base + off + size));
  }
  return clips;
}

export class Music {
  constructor(assets) {
    this.assets = assets;
    this.buffers = new Map();
    this.current = null;
    this.volume = 0.6;
    this.want = null;
  }
  async buffer(bank, clip) {
    const key = `${bank}/${clip}`.toLowerCase();
    if (!this.buffers.has(key)) {
      this.buffers.set(key, (async () => {
        if (!this.assets.has(bank)) return null;
        const data = parseBank(await this.assets.bytes(bank)).get(clip.toLowerCase());
        if (!data) return null;
        const pcm = new Float32Array(data.length);
        for (let i = 0; i < data.length; i++) pcm[i] = alaw(data[i]);
        return makeBuffer(pcm, 8000, true);
      })());
    }
    return this.buffers.get(key);
  }
  // play a looping track; no-op if it is already playing
  async play(bank, clip) {
    const key = `${bank}/${clip}`.toLowerCase();
    this.want = key;
    if (this.current && this.current.key === key) return;
    const buf = await this.buffer(bank, clip);
    if (this.want !== key) return;
    this.stop();
    if (!buf) return;
    const ac = audioContext(), src = ac.createBufferSource(), gain = ac.createGain();
    const t = ac.currentTime;
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(1, t + 0.3);
    src.buffer = buf; src.loop = true;
    src.connect(gain).connect(bus('music'));
    src.start(t);
    this.current = { key, src, gain };
  }
  stop() {
    if (!this.current) return;
    const { src, gain } = this.current, t = audioContext().currentTime;
    try { gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(0, t + 0.25); src.stop(t + 0.3); } catch { /* already stopped */ }
    this.current = null;
  }
}

// Track choice by map (location loops) with the battle loop as default.
export function trackForMap(mapName) {
  const m = (mapName || '').toLowerCase();
  if (/_man_sub|subbase/.test(m)) return ['subbasement.swb', 'subbasement'];
  if (/_man_2/.test(m)) return ['up_mansion.swb', 'up_mansion'];
  if (/_man_1|_man_out|mansion/.test(m)) return ['mansion.swb', 'mansion'];
  if (/muir/.test(m)) return ['g_muir.swb', 'g_muir'];
  if (/nyc/.test(m)) return ['g_mission01.swb', 'g_mission01'];
  if (/haarp/.test(m)) return ['g_mission02.swb', 'g_mission02'];
  return ['game1.swb', 'loop_battle'];
}
