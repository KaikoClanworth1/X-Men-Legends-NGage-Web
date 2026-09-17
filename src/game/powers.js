import { applyElements, randInt, STATUS_BIT, FOCUS, SPEED, STR, BODY } from './combat.js';

// Powers (docs/specs/combat.md §3 + Addendum B)
// Character power slot: ability = abilities.txt line + 100; item code = level*100 + line, so level 1 code == ability id.

export function powerItem(game, slot, level = 1) {
  const code = level * 100 + ((slot.ability - 100) % 100);
  return game.assets.items.find(it => it.code === code) || null;
}

export function availablePowers(ch) {
  if (!ch.def) return [];
  return ch.def.powers.map((slot, i) => ({ slot, i, item: slot.unlock === 99 ? null : powerItem(ch.game, slot, ch.powerLevels ? ch.powerLevels[i] || 1 : 1) }))
    .filter(p => p.item && p.slot.unlock <= ch.level);
}

// status duration = item duration + ((100 - resisting stat)/20)*1000 (VA 0x1000f028)
const RESIST_STAT = { charm: FOCUS, blind: SPEED, stun: STR, sleep: STR, confuse: FOCUS, freeze: BODY, burn: BODY, poison: BODY };
function applyStatuses(target, item) {
  for (const [name, bit] of Object.entries(STATUS_BIT)) {
    if (!(item.inflict & bit)) continue;
    if (target.def && target.def.immune & bit) continue;
    target.statusTimers[name] = Math.max(target.statusTimers[name], item.duration + Math.floor((100 - target.stat(RESIST_STAT[name])) / 20) * 1000);
  }
}

// angle between facing and target within arc/2 (arc in 1024ths of a turn)
function inArc(caster, t, arc) {
  if (!arc || arc >= 1024) return true;
  const ang = (Math.round(Math.atan2(-(t.y - caster.y), t.x - caster.x) / (2 * Math.PI) * 1024) + 1024) & 0x3ff;
  const diff = Math.abs(((ang - caster.facing + 512 + 1024) & 0x3ff) - 512);
  return diff <= arc / 2;
}

export function castPower(caster, power, target) {
  const { item, slot } = power;
  const game = caster.game;
  if (item.cost > caster.energy) { game.floatText(caster, 'No energy'); return false; }
  caster.energy -= item.cost;                                         // subtracted at cast (VA 0x100053cc)
  if (target) caster.face(target);
  caster.play(slot.anim, true);
  game.sfx.power(caster);
  const P = game.particles;
  if (P && item.fxCast > 0) P.spawn(item.fxCast, caster.x, caster.y, 0, caster.facing);
  if (P && item.fxCaster > 0 && !(item.cls & 0x10)) P.spawn(item.fxCaster, caster.x, caster.y, 0, caster.facing);
  // hit delay: distance / (emitter speed / 22) when speed > 21, plus emitter start delay (VA 0x1000471c)
  let delay = 0;
  const dist = target ? caster.distTo(target) : 0;
  const spd = P ? P.speedOf(item.fxCast) : 0;
  if (spd > 21) delay = Math.round(dist / (spd / 22));
  if (P) delay += P.delayOf(item.fxCast);
  caster.pendingPower = { item, target, timer: Math.max(1, Math.round(delay / 40)) + 4 };
  if (item.shake) game.shake = { strength: item.shake, until: performance.now() + item.shakeMs };
  return true;
}

// resolve area/arc effect (VA 0x10011e04)
export function resolvePower(caster, pending) {
  const { item, target } = pending, game = caster.game;
  const hostile = !!(item.cls & 2);
  const centre = target && item.range > 1 && item.radius <= 1 ? target : caster;
  const radius = item.radius > 1 ? item.radius : (item.range > 1 ? item.range : 130);
  const victims = game.actors.filter(a => a.alive && (hostile ? caster.isEnemyOf(a) : (a.team === caster.team)) &&
    Math.hypot(a.x - centre.x, a.y - centre.y) <= radius + 30 && (centre !== caster || inArc(caster, a, item.arc)));
  const list = target && !item.radius ? victims.filter(v => v === target) : victims;
  for (const v of (list.length ? list : (target && target.alive ? [target] : []))) {
    if (hostile) {
      let dmg = item.dmgMax > item.dmgMin ? item.dmgMin + randInt(item.dmgMax - item.dmgMin) : item.dmgMin;
      dmg = applyElements(dmg, caster, v, item.element);
      if (dmg > 0) v.takeDamage(caster, dmg);
    }
    applyStatuses(v, item);
    if (item.healTick > 0 && !item.tick) { v.hp = Math.min(v.maxHP, v.hp + item.healTick); game.floatText(v, '+' + item.healTick); }
    if (item.duration > 0 && (item.tick > 0 || item.stats.some(Boolean))) v.addEffect(item, caster);
    if (game.particles && item.fxImpact > 0) game.particles.spawn(item.fxImpact, v.x, v.y, 0);
  }
}
