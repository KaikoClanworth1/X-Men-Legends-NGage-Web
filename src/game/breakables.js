import { dv, cstr } from '../formats/pkg.js';
import { randInt } from './combat.js';

// objects.odt (docs/specs/pickups.md): 36-byte header, 36-byte records
// name[20], u16 id, u8 hits to break, u8 debris frame, u16 hazard damage, u16 explosion delay ms, u16 break emitter, u16 hit emitter, u32 flag
export function parseObjectDefs(bytes) {
  const d = dv(bytes), n = d.getUint32(4, true), byId = new Map();
  const sprite = cstr(bytes, 16, 20);
  for (let i = 0; i < n; i++) {
    const o = 36 + 36 * i;
    const r = { name: cstr(bytes, o, 20), id: d.getUint16(o + 20, true), hits: bytes[o + 22], debris: bytes[o + 23], damage: d.getUint16(o + 24, true), delay: d.getUint16(o + 26, true), breakFx: d.getUint16(o + 28, true), hitFx: d.getUint16(o + 30, true) };
    byId.set(r.id, r);
  }
  return { sprite, byId };
}

export class Breakables {
  static async load(game) {
    const b = new Breakables();
    b.game = game;
    const defs = parseObjectDefs(await game.assets.bytes('objects.odt'));
    b.defs = defs.byId;
    b.rubble = await game.assets.sprite(defs.sprite);
    b.list = [];
    return b;
  }
  attach(level) {
    this.list = [];
    for (const o of level.map.objects) {
      const def = this.defs.get(o.def);
      if (!o.def || !def || !def.hits) continue;
      o.breakable = { def, hits: 0, broken: false, flash: 0, explodeAt: 0, attacker: null, drop: 0 };
      this.list.push(o);
    }
  }
  // melee reach test against objects in front of the attacker
  tryHit(attacker, reach) {
    let best = null, bestD = Infinity;
    for (const o of this.list) {
      if (o.breakable.broken) continue;
      const d = Math.hypot(o.x - attacker.x, o.y - attacker.y);
      if (d <= reach + 50 && d < bestD) { best = o; bestD = d; }
    }
    if (best) this.hit(best, attacker);
    return !!best;
  }
  // hit handling (VA 0x100252bc)
  hit(o, attacker) {
    const b = o.breakable, def = b.def, P = this.game.particles;
    b.hits++;
    if (b.hits < def.hits) {
      b.flash = 6;
      if (P && def.hitFx) P.spawn(def.hitFx, o.x, o.y, 0);
      return;
    }
    b.broken = true;
    if (def.damage) { b.explodeAt = this.game.time + def.delay; b.attacker = attacker; }
    if (b.drop && this.game.pickups) this.game.pickups.spawn(b.drop, o.x, o.y, attacker);
    if (P && def.breakFx) P.spawn(def.breakFx, o.x, o.y, 0);
    const f = this.rubble && this.rubble.frames[def.debris];
    if (f) { o.debrisFrame = f; }
    o.hidden = true;
    const script = this.game.script;
    if (script) script.fire(o.name || '', 6, { object: o, x: Math.floor(o.x / 100), y: Math.floor(o.y / 100) });
  }
  update() {
    for (const o of this.list) {
      const b = o.breakable;
      if (b.flash) b.flash--;
      if (b.explodeAt && this.game.time >= b.explodeAt) {
        b.explodeAt = 0;
        // explosion (VA 0x10024fc0): chain-hit neighbours, area damage radius 400 with low byte of hazard damage
        for (const n of this.list) if (n !== o && !n.breakable.broken && Math.abs(n.x - o.x) < 150 && Math.abs(n.y - o.y) < 150) this.hit(n, b.attacker);
        if (b.attacker) {
          const dmg = b.def.damage & 0xff;
          for (const a of this.game.actors) if (a.alive && a !== b.attacker && b.attacker.isEnemyOf(a) && Math.hypot(a.x - o.x, a.y - o.y) <= 400) a.takeDamage(b.attacker, dmg);
        }
        if (this.game.particles) this.game.particles.spawn(801, o.x, o.y, 0);
      }
    }
  }
  randomDrop(table) {
    const r = randInt(100);
    let acc = 0;
    for (const [item, pct] of table) { acc += pct; if (r < acc) return item; }
    return 0;
  }
}
