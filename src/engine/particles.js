import { dv, cstr } from '../formats/pkg.js';
import { worldToScreen } from './level.js';

// emitters.cfg ("PE2"), simulation traced from VA 0x1004ce54 (setup) / 0x1004d578 (tick). One emitter tick = 45 ms.
export function parseEmitters(bytes) {
  const d = dv(bytes), n = d.getUint16(4, true), byId = new Map();
  for (let i = 0; i < n; i++) {
    const o = 12 + i * 104;
    const r = {
      name: cstr(bytes, o, 16), sprite: cstr(bytes, o + 16, 16), gravity: d.getInt32(o + 32, true), speed: d.getInt16(o + 36, true),
      spread: d.getInt16(o + 40, true), bounce: d.getInt32(o + 44, true), life: d.getInt32(o + 48, true), duration: d.getInt32(o + 52, true),
      lifeRand: d.getInt32(o + 56, true), flags: d.getUint32(o + 64, true), count: d.getInt8(o + 68), f0: bytes[o + 69], fEnd: bytes[o + 71],
      fade: bytes[o + 72], blend: bytes[o + 74], jx: d.getInt16(o + 76, true), jy: d.getInt16(o + 78, true),
      ox: d.getInt16(o + 80, true), oy: d.getInt16(o + 82, true), oz: d.getInt16(o + 84, true), delay: d.getUint16(o + 86, true),
      yaw: d.getInt16(o + 88, true), pitch: d.getInt16(o + 90, true), id: d.getUint32(o + 96, true),
    };
    byId.set(r.id, r);
  }
  return byId;
}

let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) >>> 16) & 255;
const T = 45;

class Emitter {
  constructor(def, sprite, x, y, z, yaw) {
    Object.assign(this, { def, sprite, x, y, z });
    this.yaw = (yaw ?? def.yaw) & 0x3ff;
    this.parts = []; this.tick = 0; this.ctr = 0; this.delay = def.delay;
    this.duration = def.duration < 0 ? Infinity : def.duration;
    this.done = false;
    this.fpr = sprite ? sprite.perRow : 1; this.rows = sprite ? sprite.rows : 1;
  }
  bit(k) { return (this.def.flags >> k & 1) === 1; }
  dir(yaw, pitch) { const a = yaw / 1024 * 2 * Math.PI, p = pitch / 1024 * 2 * Math.PI; return [Math.cos(a) * Math.cos(p), -Math.sin(a) * Math.cos(p), Math.sin(p)]; }
  step() {
    const r = this.def;
    if (this.delay > 0) { this.delay -= T; return; }
    this.duration -= T;
    let n = r.count >= 0 ? r.count : (this.ctr === -r.count ? (this.ctr = 0, 1) : (this.ctr++, 0));
    if (this.duration < 0 || (this.bit(4) && this.tick > 0)) n = 0;
    const base = this.dir(this.yaw, r.pitch), endFrame = r.fEnd === 255 ? this.fpr : r.fEnd;
    const cos = Math.cos(this.yaw / 1024 * 2 * Math.PI), sin = Math.sin(this.yaw / 1024 * 2 * Math.PI);
    for (let k = 0; k < n; k++) {
      const p = { life: r.life + (rnd() * r.lifeRand >> 8), age: 0, loop: this.bit(7), end: endFrame, alpha: this.bit(18) ? 0 : 15, variant: 0,
        x: this.x + r.ox * cos + r.oy * sin, y: this.y - r.ox * sin + r.oy * cos, z: this.z + r.oz };
      let d = base;
      if (r.spread) d = this.dir(this.yaw + ((rnd() - 128) * r.spread >> 8), 0);
      if (this.bit(11)) { p.x += (rnd() & 1 ? 1 : -1) * (rnd() * r.jx >> 8); p.y += (rnd() & 1 ? 1 : -1) * (rnd() * r.jy >> 8); }
      else if (this.bit(6)) d = this.dir(rnd() * rnd() >> 6, rnd() * rnd() >> 6);
      else if (this.bit(12)) d = this.dir(rnd() * rnd() >> 6, 0);
      p.vx = d[0] * r.speed; p.vy = d[1] * r.speed; p.vz = d[2] * r.speed;
      if (this.bit(13)) p.variant = (rnd() * this.rows >> 8) * this.fpr;
      this.parts.push(p);
    }
    const fadeWin = r.fade ? 720 / r.fade : 0;
    for (const p of this.parts) {
      p.life -= T;
      if (p.life <= 0) { if (this.bit(9) && this.bit(2) && p.loop) { p.life = this.fpr * T; p.loop = false; p.end = this.fpr; } else continue; }
      if (this.bit(10) && p.life <= fadeWin) p.alpha = Math.max(p.alpha - r.fade, 0);
      if (this.bit(18) && p.life > r.life - fadeWin) p.alpha = Math.min(p.alpha + r.fade, 15);
      p.x += p.vx * T / 1024; p.y += p.vy * T / 1024; p.z += p.vz * T / 1024;
      if (this.bit(2)) { p.age++; if (p.age >= p.end) { if (this.bit(19)) { if (p.age >= this.fpr) p.age = p.end; } else { p.age = 0; if (!p.loop) p.life = 0; } } }
      if (r.gravity) { p.vz += r.gravity; if (p.z < 0) { p.vz = Math.abs(p.vz) * r.bounce / 1024; p.z = 0; if (this.bit(8)) { p.loop = false; p.end = this.fpr; } } }
    }
    this.parts = this.parts.filter(p => p.life > 0);
    this.tick++;
    if (!this.parts.length && this.duration < 0 && this.tick > 1) this.done = true;
  }
  draw(g, camX, camY) {
    if (!this.sprite) return;
    const r = this.def, frame0 = this.bit(3) ? (7 - ((this.yaw + 64) >> 7)) & 7 : r.f0;
    g.save();
    g.globalCompositeOperation = r.blend === 1 ? 'lighter' : r.blend === 2 ? 'difference' : r.blend === 4 ? 'multiply' : 'source-over';
    for (const p of this.parts) {
      const f = this.sprite.frames[(this.bit(2) ? p.age : frame0) + p.variant] || this.sprite.frames[frame0];
      if (!f) continue;
      const [sx, sy] = worldToScreen(p.x, p.y, p.z);
      g.globalAlpha = p.alpha / 15;
      g.drawImage(f.canvas, Math.round(sx - camX - f.hx), Math.round(sy - camY - f.hy));
    }
    g.restore();
  }
}

export class Particles {
  static async load(assets) {
    const p = new Particles();
    p.assets = assets;
    p.defs = parseEmitters(await assets.bytes('emitters.cfg'));
    p.active = [];
    p.acc = 0;
    return p;
  }
  async spawn(id, x, y, z = 0, yaw) {
    const def = this.defs.get(id);
    if (!def) return null;
    const sprite = await this.assets.sprite(def.sprite);
    const e = new Emitter(def, sprite, x, y, z, yaw);
    this.active.push(e);
    return e;
  }
  speedOf(id) { const d = this.defs.get(id); return d ? d.speed : 0; }
  delayOf(id) { const d = this.defs.get(id); return d ? d.delay : 0; }
  update(dtMs) {
    this.acc += dtMs;
    while (this.acc >= T) { this.acc -= T; for (const e of this.active) e.step(); }
    this.active = this.active.filter(e => !e.done);
  }
  draw(g, camX, camY) { for (const e of this.active) e.draw(g, camX, camY); }
}
