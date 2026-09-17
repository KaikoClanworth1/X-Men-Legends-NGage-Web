import { worldToScreen } from '../engine/level.js';

// Pickup entity (docs/specs/pickups.md, constructor VA 0x100220e8, tick VA 0x100221f0)
// pop velocity (0,0,100), gravity vz -= 10/tick, ground bounce x0.5, 22-tick hold, magnet to owner within 1..299 units.
class Pickup {
  constructor(game, item, x, y, owner) {
    Object.assign(this, { game, item, x, y, z: 0, vx: 0, vy: 0, vz: 100, owner, hold: owner ? 22 : 0, speed: 10, gone: false });
  }
  update() {
    if (this.hold > 0) { this.hold--; return; }
    if (this.owner && this.owner.alive && this.z <= 4) {
      const dx = this.owner.x - this.x, dy = this.owner.y - this.y, d = Math.hypot(dx, dy);
      if (d >= 1 && d <= 299) {
        this.vx = Math.max(-50, Math.min(50, dx / d * this.speed));
        this.vy = Math.max(-50, Math.min(50, dy / d * this.speed));
        this.speed = 30;
      }
    }
    this.vz -= 10;
    this.x += this.vx; this.y += this.vy; this.z += this.vz / 4;
    if (this.z <= 0) { this.z = 0; this.vz = -this.vz * 0.5; if (!this.owner) { this.vx *= 0.5; this.vy *= 0.5; } if (Math.abs(this.vz) < 12) this.vz = 0; }
    // touch pickup: +-20 box overlap with a hero's collision quad
    for (const a of this.game.actors) {
      if (!a.alive || !a.isHero || a.team !== 0) continue;
      if (Math.abs(a.x - 20 - this.x) <= 50 && Math.abs(a.y - 20 - this.y) <= 50) {
        if (this.game.inventory.add(this.item)) {
          this.gone = true;
          this.game.sfx.pickup();
          this.game.notify(this.game.itemName(this.item));
          if (this.game.script) this.game.script.fire(a.name || a.key, 7, { item: this.item, character: a });
        }
        return;
      }
    }
  }
  draw(g, camX, camY) {
    const icons = this.game.itemIcons, f = icons && icons.frames[this.item.icon];
    if (!f) return;
    const [sx, sy] = worldToScreen(this.x, this.y, this.z);
    g.drawImage(f.canvas, Math.round(sx - camX - f.w / 2), Math.round(sy - camY - f.h));
  }
}

export class Pickups {
  constructor(game) { this.game = game; this.list = []; }
  spawn(itemOrCode, x, y, owner = null) {
    const item = typeof itemOrCode === 'object' ? itemOrCode : this.game.assets.items.find(it => it.code === itemOrCode);
    if (!item) return null;
    const p = new Pickup(this.game, item, x, y, owner);
    this.list.push(p);
    return p;
  }
  update() {
    for (const p of this.list) p.update();
    this.list = this.list.filter(p => !p.gone);
  }
}

// Shared party inventory: item code -> count
export class Inventory {
  constructor(capacity = 99) { this.counts = new Map(); this.capacity = capacity; }
  add(item, n = 1) {
    const cur = this.counts.get(item.code) || 0;
    if (cur + n > this.capacity) return false;
    this.counts.set(item.code, cur + n);
    return true;
  }
  has(item) { return (this.counts.get(item.code) || 0) > 0; }
  remove(item, n = 1) {
    const cur = this.counts.get(item.code) || 0;
    if (cur < n) return false;
    if (cur === n) this.counts.delete(item.code); else this.counts.set(item.code, cur - n);
    return true;
  }
  list(items) { return [...this.counts.entries()].map(([code, count]) => ({ item: items.find(i => i.code === code), count })).filter(e => e.item); }
}
