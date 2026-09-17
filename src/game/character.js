import { ANIMS, ANIM } from '../formats/data.js';
import { worldToScreen } from '../engine/level.js';
import { moveWithCollision, resolveMove } from '../engine/collision.js';
import { maxHP, maxEnergy, rollMelee, meleeDamage, knockback, isDisabled, randInt, killXP, XP_TABLE } from './combat.js';
import { availablePowers, castPower, resolvePower } from './powers.js';

export const TICK_MS = 40;          // fixed 40 ms game tick (CPeriodic, docs/specs/core.md)

// Facing is an angle, 1024 per turn, snapped to 8 directions (multiples of 0x80). Angle 0 = screen down-right.
export const angleTowards = (dx, dy) => (Math.round(Math.atan2(-dy, dx) / (2 * Math.PI) * 8) * 0x80 + 1024) & 0x3ff;
// Sprite row / mirror (VA 0x100b3904)
export function rowForAngle(angle) {
  const d = ((angle & 0x3ff) + 0x40) >> 7;
  let row = 7 - d, mirror = false;
  if (row > 4) { mirror = true; row = 8 - row; }
  return [row, mirror];
}
// World step for an angle (VA 0x1000cd28): d = trunc(2s/3)
export function stepForAngle(angle, s) {
  const d = Math.trunc(2 * s / 3);
  return [[s, 0], [d, -d], [0, -s], [-d, -d], [-s, 0], [-d, d], [0, s], [d, d]][((angle & 0x3ff) >> 7) & 7];
}
const dirTowards = (dx, dy) => angleTowards(dx, dy);

// Character states (AI state table @VA 0x100f660c)
export const S = { WALK: 1, RUN: 2, IDLE: 4, MELEE: 7, SPECIAL: 8, DAMAGE: 11, DIE: 13, DEAD: 99 };

export class Character {
  static async create(game, key, x, y) {
    const assets = game.assets, def = assets.characters.get(key.toLowerCase());
    const c = new Character();
    Object.assign(c, { game, key, def, x, y, z: 0, facing: 0x380, anim: ANIM.i01, frame: 0, frameTimer: 0, animDone: false, radius: 30 });
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
    c.effects = []; c.selectedPower = 0; c.pendingPower = null;
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
  walkToTile(tx, ty) {
    return new Promise(done => { this.scriptWalk = { x: tx * 100 + 50, y: ty * 100 + 50, done }; });
  }
  // bring a knocked-out hero back (revive items / level change)
  revive(hpFraction = 0.5) {
    if (this.alive) return;
    this.knockedOut = false; this.state = S.IDLE; this.animDone = false;
    this.hp = Math.max(1, Math.round(this.maxHP * hpFraction));
    this.play(ANIM.i01);
    this.game.sfx.status('revived');
  }
  setLevel(n) { this.level = n; this.maxHP = maxHP(this); this.maxEnergy = maxEnergy(this); this.hp = this.maxHP; this.energy = this.maxEnergy; }
  taken(el) { return this.def ? this.def.taken[el] : 100; }
  bonusFlat(el) { return this.def ? this.def.flat[el] : 0; }
  bonusPct(el) { return this.def ? this.def.pct[el] : 0; }
  get alive() { return this.state !== S.DIE && this.state !== S.DEAD; }
  get reach() { return this.def ? this.def.reach : 130; }
  get sight() { return this.def ? this.def.sight : 500; }
  get moveSpeed() { return this.def ? this.def.moveSpeed : 10; }

  play(id, once = false) {
    const sheetId = this.sheets[id] ? id : ANIM.i01;
    if (this.anim === sheetId && !once) return;
    this.anim = sheetId; this.frame = 0; this.frameTimer = 0; this.animDone = false; this.once = once;
  }
  face(other) { this.facing = dirTowards(other.x - this.x, other.y - this.y); }
  distTo(o) { return Math.hypot(o.x - this.x, o.y - this.y); }
  nearestEnemy(range) {
    return this.game.actors.filter(a => a !== this && a.alive && this.isEnemyOf(a) && this.distTo(a) <= range).sort((a, b) => this.distTo(a) - this.distTo(b))[0] || null;
  }
  isEnemyOf(o) { return o.team !== this.team && o.team !== 2 && this.team !== 2; }

  // --- actions -------------------------------------------------------------
  startMelee(target) {
    if (!this.alive || this.state === S.MELEE || isDisabled(this)) return;
    if (target) this.face(target);
    this.state = S.MELEE;
    // damage is resolved at the start of the swing, before the animation (VA 0x100042cc)
    const [dx, dy] = stepForAngle(this.facing, 1).map(v => Math.sign(v));
    const hitTarget = target && target.alive && this.distTo(target) <= this.reach + 60 ? target
      : this.game.actors.find(a => a !== this && a.alive && this.isEnemyOf(a) && Math.hypot(a.x - (this.x + dx * this.reach / 2), a.y - (this.y + dy * this.reach / 2)) <= this.reach);
    const hit = hitTarget;
    if (hit) this.resolveMelee(hit);
    else if (!(this.isHero && this.game.breakables && this.game.breakables.tryHit(this, this.reach))) this.game.sfx.swing(false);
    this.play(this.def ? this.def.attackAnim : ANIM.m01, true);
  }
  resolveMelee(def) {
    const result = rollMelee(this, def);
    this.game.sfx.swing(result === 3);
    if (result !== 3) { this.game.floatText(def, result === 2 ? 'block' : result === 1 ? 'dodge' : 'miss'); return; }
    const dmg = meleeDamage(this, def);
    def.takeDamage(this, dmg);
  }
  takeDamage(attacker, dmg) {
    if (!this.alive) return;
    this.hp = Math.max(this.unkillable ? 1 : 0, this.hp - dmg);
    if (Math.random() < 0.5 || this.hp <= 0) this.game.sfx.pain(this);
    if (this.unkillable && this.hp <= 1) {
      if (!this.defeatedFired) { this.defeatedFired = true; this.target = null; if (this.game.script) this.game.script.fire(this.name || this.key, 4, { character: this }); }
      return;
    }
    this.game.floatText(this, String(dmg));
    this.flash = 3;
    if (this.statusTimers.sleep > 0) this.statusTimers.sleep = 1;
    if (this.statusTimers.freeze > 0) this.statusTimers.freeze = 1;
    const [kx, ky] = knockback(attacker, this, dmg);
    if (kx || ky) [this.x, this.y] = moveWithCollision(this.game.level.map, this.x, this.y, kx, ky, this.radius);
    if (!this.target && attacker) this.target = attacker;
    if (this.hp <= 0) { this.die(attacker); return; }
    // hit reaction: h01 for non-controlled characters that aren't mid-action (damage state, anim length)
    if (this !== this.game.player && this.state !== S.MELEE && this.state !== S.SPECIAL && this.sheets[ANIM.h01]) {
      this.state = S.DAMAGE;
      this.play(ANIM.h01, true);
    }
  }
  die(killer) {
    this.state = S.DIE;
    if (this.isHero && this.team === 0) this.knockedOut = true;
    if (this.game.script) this.game.script.fire(this.name || this.key, 4, { character: this, killer });
    this.play(ANIM.d01, true);
    this.busy = Math.round(2000 / TICK_MS);
    if (killer && killer.isHero) killer.gainXP(killXP(this.level));
  }
  gainXP(n) {
    this.xp += n;
    while (this.level <= 39 && this.xp >= (XP_TABLE[this.level + 1] ?? Infinity)) {
      const prev = this.level;
      this.level++;
      // level-up (VA 0x1000f898): +2 stat points; +1 skill point when bit 2 of the level changes (not at 7 and 15)
      this.statPoints = (this.statPoints || 0) + 2;
      if (((prev ^ this.level) & 4) && this.level !== 7 && this.level !== 15) this.skillPoints = (this.skillPoints || 0) + 1;
      if (this.def) [[0x4, 0], [0x8, 3], [0x10, 2], [0x20, 1]].forEach(([bit, stat]) => {
        if (!(this.def.flags & bit)) return;
        if (this.base[stat] < this.def.caps[stat] * 10) this.base[stat]++; else this.statPoints++;
      });
      this.maxHP = maxHP(this); this.maxEnergy = maxEnergy(this);
      this.hp = this.maxHP; this.energy = this.maxEnergy;
      this.game.floatText(this, 'LEVEL UP');
      this.game.sfx.levelUp();
    }
  }

  // timed item/power effect instances: tick every item.tick ms, expire after item.duration; duplicates rejected (VA 0x1000bd7c)
  addEffect(item, source) {
    if (this.effects.some(e => e.item === item)) return;
    this.effects.push({ item, source, next: item.tick || Infinity, left: item.duration });
    this.recalcBonuses();
  }
  recalcBonuses() {
    this.bonus = [0, 0, 0, 0];
    for (const e of this.effects) e.item.stats.forEach((v, i) => { this.bonus[i] += v; });
  }
  updateEffects() {
    let changed = false;
    for (const e of this.effects) {
      e.left -= TICK_MS; e.next -= TICK_MS;
      if (e.next <= 0) {
        e.next += e.item.tick;
        if (e.item.energyTick) this.energy = Math.max(0, Math.min(this.maxEnergy, this.energy + e.item.energyTick));
        if (e.item.healTick) this.hp = Math.min(this.maxHP, this.hp + e.item.healTick);
        if (e.item.dotTick && this.alive) this.takeDamage(e.source, e.item.dotTick);
      }
    }
    const before = this.effects.length;
    this.effects = this.effects.filter(e => e.left > 0);
    if (this.effects.length !== before) changed = true;
    if (changed) this.recalcBonuses();
  }
  powers() { return availablePowers(this); }
  startPower(power, target) {
    if (!this.alive || isDisabled(this) || this.state === S.SPECIAL || this.state === S.MELEE) return false;
    if (!castPower(this, power, target)) return false;
    this.state = S.SPECIAL;
    return true;
  }

  // --- per tick ------------------------------------------------------------
  update(level, move) {
    for (const k in this.statusTimers) if (this.statusTimers[k] > 0) this.statusTimers[k] = Math.max(0, this.statusTimers[k] - TICK_MS);
    if (this.flash) this.flash--;
    if (this.cooldown > 0) this.cooldown -= TICK_MS;
    if (this.alive && this.energy < this.maxEnergy && (this.regenTick = (this.regenTick || 0) + 1) >= 20) { this.regenTick = 0; this.energy++; }
    if (this.effects.length) this.updateEffects();
    if (this.pendingPower && --this.pendingPower.timer <= 0) { const pp = this.pendingPower; this.pendingPower = null; resolvePower(this, pp); }

    if (this.state === S.DIE) {
      this.advanceAnim();
      if (this.animDone && --this.busy <= 0) {
        this.state = this.isHero ? S.DIE : S.DEAD;
        // pre-rolled drop spawns when the death animation ends (VA 0x100085f8)
        if (this.state === S.DEAD && this.dropItem && this.game.pickups) this.game.pickups.spawn(this.dropItem, this.x, this.y);
      }
      return;
    }
    if (this.state === S.DEAD) return;

    if (this.state === S.MELEE || this.state === S.SPECIAL || this.state === S.DAMAGE) {
      this.advanceAnim();
      if (this.animDone) { this.state = S.IDLE; this.play(ANIM.i01); }
      return;
    }
    if (isDisabled(this)) { this.play(ANIM.i01); this.advanceAnim(); return; }

    if (this.scriptWalk) {                           // WalkToTile (VA 0x1002a220): walk to the tile centre, then event 5
      const w = this.scriptWalk, dx = w.x - this.x, dy = w.y - this.y;
      if (Math.hypot(dx, dy) <= 40) { this.scriptWalk = null; this.state = S.IDLE; this.play(ANIM.i01); w.done(); }
      else { this.state = S.WALK; this.moveTowardFree(dx, dy); }
      this.advanceAnim();
      return;
    }
    if (this === this.game.player) this.updatePlayer(level, move);
    else if (this.team === 1) this.updateEnemyAI(level);
    else if (this.team === 0 && this.isHero) this.updateTeammateAI(level);
    else this.play(ANIM.i01);
    this.advanceAnim();
  }
  // Turn toward the desired angle by 0x80 per tick; move when within 0x80 (VA 0x100083a4 / 0x10002f14). Run = 2x walk step.
  moveToward(level, desired, run = true) {
    const diff = (desired - this.facing + 1024) & 0x3ff;
    if (diff) this.facing = (this.facing + (diff <= 0x200 ? 0x80 : -0x80) + 1024) & 0x3ff;
    const animId = run && this.sheets[ANIM.r01] ? ANIM.r01 : this.sheets[ANIM.w01] ? ANIM.w01 : ANIM.i01;
    if (diff > 0x80 && diff < 1024 - 0x80) { this.play(animId); return; }
    const wasAnim = this.anim;
    this.play(animId);
    if (wasAnim !== animId || animId === ANIM.i01) return;       // move only once the animation already matches
    let [dx, dy] = stepForAngle(this.facing, this.moveSpeed);
    if (animId === ANIM.r01) { dx *= 2; dy *= 2; }
    [this.x, this.y] = resolveMove(level.map, this.x, this.y, dx, dy, this === this.game.player ? 2 : 2);
  }
  walk(level, vx, vy, run = true) {
    if (!vx && !vy) return;
    this.moveToward(level, angleTowards(vx, vy), run);
  }
  updatePlayer(level, move) {
    const input = this.game.input;
    if (input.wasPressed('attack') && !(this.game.script && this.game.script.actionConsumed)) {
      const target = this.game.actors.filter(a => a !== this && a.alive && this.isEnemyOf(a) && this.distTo(a) <= this.reach + 60)
        .sort((a, b) => this.distTo(a) - this.distTo(b))[0];
      this.startMelee(target);
      return;
    }
    if (input.isDown('power')) this.aiming = true;
    else if (this.aiming) {
      this.aiming = false;
      const list = this.powers(), power = list[this.selectedPower % Math.max(1, list.length)];
      const target = this.nearestEnemy(power ? Math.max(power.item.range, 300) : 300);
      if (power) { this.startPower(power, target); return; }
    }
    if (move !== null) { this.state = S.RUN; this.moveToward(level, move, true); }
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
        const opts = this.powers().filter(p => (p.item.cls & 2) && p.item.cost <= this.energy && d <= Math.max(p.item.range, p.item.radius, this.reach) + 40);
        if (opts.length && (randInt(256) & 7) < opts.length) this.startPower(opts[randInt(opts.length)], t);
        else this.startMelee(t);
        this.cooldown = ((randInt(256)) + 200) * 10;
      } else { this.state = S.IDLE; this.play(ANIM.i01); }
    } else {
      this.state = S.RUN;
      this.walk(level, t.x - this.x, t.y - this.y, d > 300);
    }
    void hero;
  }
  // AI teammates: attack enemies near the leader, otherwise follow; they ignore walls (collision mode 1, docs/specs/core.md)
  updateTeammateAI(level) {
    const leader = this.game.player;
    if (this.target && (!this.target.alive || !this.isEnemyOf(this.target) || this.target.distTo(leader) > 700)) this.target = null;
    if (!this.target && --this.scanTimer <= 0) { this.scanTimer = 9; this.target = leader.nearestEnemy(500); }
    const t = this.target;
    if (t) {
      const d = this.distTo(t);
      if (d <= this.reach + 20) {
        this.face(t);
        if (this.cooldown <= 0) { this.startMelee(t); this.cooldown = 900 + randInt(600); } else { this.state = S.IDLE; this.play(ANIM.i01); }
      } else { this.state = S.RUN; this.moveTowardFree(t.x - this.x, t.y - this.y); }
      return;
    }
    const d = this.distTo(leader);
    if (d > 180) { this.state = S.RUN; this.moveTowardFree(leader.x - this.x, leader.y - this.y); }
    else { this.state = S.IDLE; this.play(ANIM.i01); }
  }
  moveTowardFree(vx, vy) {
    const desired = angleTowards(vx, vy), diff = (desired - this.facing + 1024) & 0x3ff;
    if (diff) this.facing = (this.facing + (diff <= 0x200 ? 0x80 : -0x80) + 1024) & 0x3ff;
    this.play(this.sheets[ANIM.r01] ? ANIM.r01 : ANIM.w01);
    if (diff > 0x80 && diff < 1024 - 0x80) return;
    const [dx, dy] = stepForAngle(this.facing, this.moveSpeed);
    this.x += dx * 2; this.y += dy * 2;
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
    const [row, mirror] = rowForAngle(this.facing);
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
