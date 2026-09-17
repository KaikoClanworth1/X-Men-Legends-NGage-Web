import { ANIMS, ANIM } from '../formats/data.js';
import { worldToScreen } from '../engine/level.js';
import { moveWithCollision } from '../engine/collision.js';
import { maxHP, maxEnergy, rollMelee, meleeDamage, knockback, isDisabled, randInt, killXP, XP_TABLE } from './combat.js';

export const TICK_MS = 45;          // game logic tick (emitters and animations run at 45 ms)

// Facing: 8 directions, 0 = +x world. Sprite sheets hold 5 direction rows; the other 3 are mirrored.
// PROVISIONAL mapping until the core-loop RE spec confirms it (see docs/ROADMAP.md).
export const DIR_TO_ROW = [0, 1, 2, 3, 4, 3, 2, 1];
export const DIR_MIRROR = [false, false, false, false, false, true, true, true];
const DIR_VECTORS = [...Array(8)].map((_, i) => [Math.cos(i * Math.PI / 4), Math.sin(i * Math.PI / 4)]);
const dirTowards = (dx, dy) => {
  let best = 0, bestDot = -2;
  const len = Math.hypot(dx, dy) || 1;
  DIR_VECTORS.forEach(([vx, vy], i) => { const d = (vx * dx + vy * dy) / len; if (d > bestDot) { bestDot = d; best = i; } });
  return best;
};

// Character states (AI state table @VA 0x100f660c)
export const S = { WALK: 1, RUN: 2, IDLE: 4, MELEE: 7, SPECIAL: 8, DAMAGE: 11, DIE: 13, DEAD: 99 };

export class Character {
  static async create(game, key, x, y) {
    const assets = game.assets, def = assets.characters.get(key.toLowerCase());
    const c = new Character();
    Object.assign(c, { game, key, def, x, y, z: 0, facing: 1, anim: ANIM.i01, frame: 0, frameTimer: 0, animDone: false, radius: 30 });
    c.level = def ? Math.max(1, def.level) : 1;
    c.xp = def ? def.xp : 0;
    c.base = def ? def.stats.slice() : [3, 3, 3, 3];
    c.bonus = [0, 0, 0, 0];
    c.statusTimers = { charm: 0, blind: 0, stun: 0, sleep: 0, confuse: 0, freeze: 0, burn: 0, poison: 0 };
    c.isHero = !!(def && def.flags & 1);
    c.isNPC = !!(def && def.flags & 0x4000);
    c.team = c.isHero ? 0 : c.isNPC ? 2 : 1;
    c.maxHP = maxHP(c); c.hp = c.maxHP;
    c.maxEnergy = maxEnergy(c); c.energy = c.maxEnergy;
    c.state = S.IDLE; c.cooldown = 0; c.scanTimer = randInt(9); c.target = null; c.busy = 0;
    c.sheets = {};
    if (def) {
      for (let i = 0; i < 24; i++) {
        if (!(def.animMask >> i & 1) || !ANIMS[i] || ANIMS[i] === 'xxx') continue;
        const spr = await assets.sprite(`${key}_${ANIMS[i]}.spr`);
        if (spr) c.sheets[i] = spr;
      }
    }
    if (!c.sheets[ANIM.i01]) c.sheets[ANIM.i01] = await assets.sprite(`${key}_i01.spr`);
    return c;
  }
  stat(i) { return this.base[i] + this.bonus[i]; }
  taken(el) { return this.def ? this.def.taken[el] : 100; }
  bonusFlat(el) { return this.def ? this.def.flat[el] : 0; }
  bonusPct(el) { return this.def ? this.def.pct[el] : 0; }
  get alive() { return this.state !== S.DIE && this.state !== S.DEAD; }
  get reach() { return this.def ? this.def.reach : 130; }
  get sight() { return this.def ? this.def.sight : 500; }
  get moveStep() { return (this.def ? this.def.moveSpeed : 10) * 3; }   // PROVISIONAL world units per tick (run = walk * 2 per spec)

  play(id, once = false) {
    const sheetId = this.sheets[id] ? id : ANIM.i01;
    if (this.anim === sheetId && !once) return;
    this.anim = sheetId; this.frame = 0; this.frameTimer = 0; this.animDone = false; this.once = once;
  }
  face(other) { this.facing = dirTowards(other.x - this.x, other.y - this.y); }
  distTo(o) { return Math.hypot(o.x - this.x, o.y - this.y); }
  isEnemyOf(o) { return o.team !== this.team && o.team !== 2 && this.team !== 2; }

  // --- actions -------------------------------------------------------------
  startMelee(target) {
    if (!this.alive || this.state === S.MELEE || isDisabled(this)) return;
    if (target) this.face(target);
    this.state = S.MELEE;
    // damage is resolved at the start of the swing, before the animation (VA 0x100042cc)
    const [dx, dy] = DIR_VECTORS[this.facing];
    const hit = target && this.distTo(target) <= this.reach + target.radius ? target
      : this.game.actors.find(a => a !== this && a.alive && this.isEnemyOf(a) && Math.hypot(a.x - (this.x + dx * this.reach / 2), a.y - (this.y + dy * this.reach / 2)) <= this.reach);
    if (hit) this.resolveMelee(hit);
    this.play(this.def ? this.def.attackAnim : ANIM.m01, true);
  }
  resolveMelee(def) {
    const result = rollMelee(this, def);
    if (result !== 3) { this.game.floatText(def, result === 2 ? 'block' : result === 1 ? 'dodge' : 'miss'); return; }
    const dmg = meleeDamage(this, def);
    def.takeDamage(this, dmg);
  }
  takeDamage(attacker, dmg) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - dmg);
    this.game.floatText(this, String(dmg));
    this.flash = 3;
    if (this.statusTimers.sleep > 0) this.statusTimers.sleep = 1;
    if (this.statusTimers.freeze > 0) this.statusTimers.freeze = 1;
    const [kx, ky] = knockback(attacker, this, dmg);
    if (kx || ky) [this.x, this.y] = moveWithCollision(this.game.level.map, this.x, this.y, kx, ky, this.radius);
    if (!this.target && attacker) this.target = attacker;
    if (this.hp <= 0) this.die(attacker);
  }
  die(killer) {
    this.state = S.DIE;
    this.play(ANIM.d01, true);
    this.busy = Math.round(2000 / TICK_MS);
    if (killer && killer.isHero) killer.gainXP(killXP(this.level));
  }
  gainXP(n) {
    this.xp += n;
    while (this.level <= 39 && this.xp >= (XP_TABLE[this.level + 1] ?? Infinity)) {
      this.level++;
      this.maxHP = maxHP(this); this.maxEnergy = maxEnergy(this);
      this.hp = this.maxHP; this.energy = this.maxEnergy;
      this.game.floatText(this, 'LEVEL UP');
    }
  }

  // --- per tick ------------------------------------------------------------
  update(level, move) {
    for (const k in this.statusTimers) if (this.statusTimers[k] > 0) this.statusTimers[k] = Math.max(0, this.statusTimers[k] - TICK_MS);
    if (this.flash) this.flash--;
    if (this.cooldown > 0) this.cooldown -= TICK_MS;

    if (this.state === S.DIE) {
      this.advanceAnim();
      if (this.animDone && --this.busy <= 0) this.state = this.isHero ? S.DIE : S.DEAD;
      return;
    }
    if (this.state === S.DEAD) return;

    if (this.state === S.MELEE) {
      this.advanceAnim();
      if (this.animDone) { this.state = S.IDLE; this.play(ANIM.i01); }
      return;
    }
    if (isDisabled(this)) { this.play(ANIM.i01); this.advanceAnim(); return; }

    if (this === this.game.player) this.updatePlayer(level, move);
    else if (this.team === 1) this.updateEnemyAI(level);
    else this.play(ANIM.i01);
    this.advanceAnim();
  }
  walk(level, vx, vy, run = true) {
    const len = Math.hypot(vx, vy);
    if (!len) return;
    this.facing = dirTowards(vx, vy);
    const step = this.moveStep * (run ? 2 : 1) / 2;
    [this.x, this.y] = moveWithCollision(level.map, this.x, this.y, vx / len * step, vy / len * step, this.radius);
    this.play(run && this.sheets[ANIM.r01] ? ANIM.r01 : this.sheets[ANIM.w01] ? ANIM.w01 : ANIM.r01);
  }
  updatePlayer(level, move) {
    const input = this.game.input;
    if (input.wasPressed('attack')) {
      const target = this.game.actors.filter(a => a !== this && a.alive && this.isEnemyOf(a) && this.distTo(a) <= this.reach + 60)
        .sort((a, b) => this.distTo(a) - this.distTo(b))[0];
      this.startMelee(target);
      return;
    }
    if (move) this.walk(level, move[0], move[1]);
    else { this.state = S.IDLE; this.play(ANIM.i01); }
  }
  // Enemy AI (docs/specs/combat.md §5): scan every 9 ticks within sight, chase, melee with cooldown 2000-4550 ms
  updateEnemyAI(level) {
    const hero = this.game.player;
    if (!this.target || !this.target.alive) {
      this.target = null;
      if (--this.scanTimer <= 0) {
        this.scanTimer = 9;
        const cands = this.game.actors.filter(a => a.alive && this.isEnemyOf(a) && Math.abs(a.x - this.x) < 800 && Math.abs(a.y - this.y) < 800);
        for (const a of cands) {
          const d = this.distTo(a);
          const inFov = (() => { const ang = Math.atan2(a.y - this.y, a.x - this.x), face = this.facing * Math.PI / 4; let diff = Math.abs(((ang - face) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI); return diff <= (this.def ? this.def.fov : 1024) / 1024 * Math.PI; })();
          if ((d <= this.sight && inFov) || d <= this.sight / 2) { this.target = a; break; }
        }
      }
    }
    const t = this.target;
    if (!t) { this.state = S.IDLE; this.play(ANIM.i01); return; }
    if (this.distTo(t) > this.sight * 3) { this.target = null; return; }
    const d = this.distTo(t);
    if (d <= this.reach + t.radius - 10) {
      this.face(t);
      if (this.cooldown <= 0) {
        this.startMelee(t);
        this.cooldown = ((randInt(256)) + 200) * 10;
      } else { this.state = S.IDLE; this.play(ANIM.i01); }
    } else {
      this.state = S.RUN;
      this.walk(level, t.x - this.x, t.y - this.y, d > 300);
    }
    void hero;
  }
  advanceAnim() {
    const sheet = this.sheets[this.anim];
    if (!sheet) return;
    const ticks = Math.max(1, this.def ? this.def.animTicks[this.anim] || 1 : 1);
    if (++this.frameTimer < ticks) return;
    this.frameTimer = 0;
    if (this.frame + 1 >= sheet.perRow) {
      if (this.once) { this.animDone = true; return; }
      this.frame = 0;
    } else this.frame++;
  }
  draw(g, camX, camY) {
    if (this.state === S.DEAD) return;
    const sheet = this.sheets[this.anim] || this.sheets[ANIM.i01];
    if (!sheet) return;
    const row = DIR_TO_ROW[this.facing], mirror = DIR_MIRROR[this.facing];
    const f = sheet.frames[row * sheet.perRow + Math.min(this.frame, sheet.perRow - 1)];
    if (!f) return;
    const [sx, sy] = worldToScreen(this.x, this.y, this.z);
    const px = Math.round(sx - camX), py = Math.round(sy - camY);
    g.save();
    if (this.flash) g.filter = 'sepia(1) saturate(6) hue-rotate(-50deg)';
    if (mirror) { g.translate(px, py); g.scale(-1, 1); g.drawImage(f.canvas, -f.hx, -f.hy); }
    else g.drawImage(f.canvas, px - f.hx, py - f.hy);
    g.restore();
  }
}
