import { audioContext, bus } from './audio.js';
import { parseBank } from './music.js';

// Sound effects from the sound banks in the player's assets.pkg (8 kHz A-law clips).
function alaw(x) {
  x ^= 0x55;
  const sign = x & 0x80, exp = (x >> 4) & 7, mant = x & 15;
  const s = exp ? ((mant << 4) + 0x108) << (exp - 1) : (mant << 4) + 8;
  return (sign ? s : -s) / 32768;
}

export class Sfx {
  constructor(assets) {
    this.assets = assets;
    this.banks = new Map();      // bank -> Promise<Map(clip -> AudioBuffer)>
    this.lastPlayed = new Map(); // clip -> time, to avoid stacking the same clip every tick
  }
  bank(name) {
    const key = name.toLowerCase();
    if (!this.banks.has(key)) {
      this.banks.set(key, (async () => {
        const file = this.assets.pkg.list('.swb').find(n => n.toLowerCase() === key);
        if (!file) return new Map();
        const clips = parseBank(await this.assets.bytes(file)), out = new Map(), ac = audioContext();
        for (const [clip, data] of clips) {
          if (/^loop_/.test(clip)) continue;
          const buf = ac.createBuffer(1, Math.max(1, data.length), 8000), ch = buf.getChannelData(0);
          for (let i = 0; i < data.length; i++) ch[i] = alaw(data[i]);
          out.set(clip, buf);
        }
        return out;
      })());
    }
    return this.banks.get(key);
  }
  // play a clip; clip may be a name, an array (random pick) or a RegExp over the bank's clip names
  async play(bankName, clip, volume = 1) {
    const clips = await this.bank(bankName);
    if (!clips.size) return;
    let name = clip;
    if (clip instanceof RegExp) { const all = [...clips.keys()].filter(k => clip.test(k)); name = all[Math.floor(Math.random() * all.length)]; }
    else if (Array.isArray(clip)) name = clip[Math.floor(Math.random() * clip.length)];
    const buf = name && clips.get(String(name).toLowerCase());
    if (!buf) return;
    const now = performance.now(), key = bankName + '/' + name;
    if (now - (this.lastPlayed.get(key) || 0) < 60) return;
    this.lastPlayed.set(key, now);
    const ac = audioContext(), src = ac.createBufferSource(), gain = ac.createGain();
    gain.gain.value = volume;
    src.buffer = buf;
    src.connect(gain).connect(bus('sfx'));
    src.start();
  }
  // named game events
  swing(hit) { this.play('game1.swb', hit ? ['punch_impact_01', 'punch_impact_03'] : ['swing_miss_01', 'swing_miss_03']); }
  pain(ch) {
    const female = ch.def && ch.def.flags & 0x100, big = ch.def && ch.def.flags & 0x40, machine = /sen|mmold|grsotnl|tunnel/.test(ch.key);
    const set = machine ? 'im' : big ? 'bm' : female ? 'hf' : 'hm';
    this.play('game1.swb', [`${set}_pain_01`, `${set}_pain_03`], 0.8);
  }
  power(ch) {
    const bank = ch.key[0].toUpperCase() + ch.key.slice(1) + '_specials.swb';
    this.play(bank, /^special/);
  }
  pickup() { this.play('pick_up.swb', 'pick_up'); }
  levelUp() { this.play('level_up.swb', 'level_up'); }
  explosion() { this.play('Explosions_bank_1.swb', ['explosion_01', 'explosion_02']); }
  debris() { this.play('debris.swb', /^debris_fall/); }
  menu(kind) { this.play('game1.swb', kind === 'accept' ? 'menu_accept' : kind === 'back' ? 'menu_back' : 'menu_scroll', 0.8); }
  status(name) { this.play('States.swb', `state_${name}`); }
  door(open, material = 'metal') { this.play(`${material[0].toUpperCase() + material.slice(1)}_doors.swb`, new RegExp(`${material}_door_${open ? 'open' : 'close'}`)); }
}
