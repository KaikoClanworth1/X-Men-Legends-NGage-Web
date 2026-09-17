// Combat rules re-implemented from docs/specs/combat.md (VAs refer to 6R54.app).

// Game PRNG (seed*15737 + 15149) & 0xFFFF
let seed = 1;
export const rand16 = () => (seed = (seed * 15737 + 15149) & 0xffff);
export const randInt = n => (n > 0 ? rand16() % n : 0);

export const STATUS_BIT = { charm: 1, blind: 2, stun: 4, sleep: 8, confuse: 16, freeze: 32, burn: 64, poison: 128 };
export const STR = 0, BODY = 1, FOCUS = 2, SPEED = 3;

// max HP = (Body*7 + level*5) * (2 if elite flag 0x40); max energy = (Focus + level)*4 * (2 if elite)  (VA 0x10010934 / 0x100108f0)
export const maxHP = c => (c.stat(BODY) * 7 + c.level * 5) * (c.def && c.def.flags & 0x40 ? 2 : 1);
export const maxEnergy = c => (c.stat(FOCUS) + c.level) * 4 * (c.def && c.def.flags & 0x40 ? 2 : 1);

export const isDisabled = c => (c.statusTimers.stun > 0 || c.statusTimers.sleep > 0 || c.statusTimers.freeze > 0);

// Hit roll (VA 0x10011898). Returns 3 hit, 2 block, 1 dodge, 0 miss.
export function rollMelee(att, def) {
  if (att.statusTimers.blind > 0) return 0;
  if (isDisabled(def)) return 3;
  const spd = def.stat(SPEED), body = def.stat(BODY);
  let mode = 0;                                           // 0 none, 1 dodge chance, 2 block chance
  const tryDodge = () => (randInt(100) <= spd ? 1 : 0), tryBlock = () => (randInt(100) <= body ? 2 : 0);
  mode = spd >= body ? (tryDodge() || tryBlock()) : (tryBlock() || tryDodge());
  const A = att.stat(SPEED) + att.stat(STR);
  const D = mode === 1 ? 2 * spd + body : mode === 2 ? spd + 2 * body : spd + body;
  const chance = Math.floor(100 * A / Math.max(1, A + D));
  if (randInt(100) < chance) return 3;
  return mode === 2 ? 2 : mode === 1 ? 1 : 0;
}

// Per-element attacker bonuses then defender modifiers (VA 0x10010ef0 / 0x10011680)
export function applyElements(dmg, att, def, element) {
  const flat = att.bonusFlat(element), pct = att.bonusPct(element);
  if (flat) dmg += 1 + randInt(flat);
  if (pct) dmg = Math.floor(dmg * (100 + pct) / 100);
  return Math.floor(dmg * def.taken(element) / 100);
}

export function meleeDamage(att, def) {
  const s = att.stat(STR), half = s >> 1;
  let dmg = half + randInt(s - half);
  dmg = applyElements(dmg, att, def, 0);
  return Math.max(dmg, 0);
}

// Hit reaction: knockback k = ((dmg*128)/maxHP)*100 >> 7, displacement (D-A)*k/(dist+1)  (VA 0x1000eaa8)
export function knockback(att, def, dmg) {
  if (def.isHero || isDisabled(def) || def === def.game.player) return [0, 0];
  const k = (((dmg * 128) / Math.max(1, def.maxHP)) * 100) >> 7;
  const dx = def.x - att.x, dy = def.y - att.y, dist = Math.hypot(dx, dy);
  return [dx * k / (dist + 1), dy * k / (dist + 1)];
}

// Kill XP by victim level (table @VA 0x100f68a8, first entries); extended linearly as a placeholder beyond known values.
const KILL_XP = [0, 10, 13, 17, 22, 29];
export const killXP = level => (level < KILL_XP.length ? KILL_XP[level] : Math.round(29 * Math.pow(1.3, level - 5)));
// XP needed per level (table @VA 0x100f67f0, known prefix)
export const XP_TABLE = [0, 0, 100, 247, 460, 768, 1210, 1841, 2739, 4010, 5804, 8329, 11872];
