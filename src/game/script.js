// Mission script runtime (docs/specs/missions.md).
// Handlers are bound to .mdd record names (or "map"); event codes:
// 0 entered zone / came near, 2 action pressed inside, 3 left, 4 defeated, 5 walk finished, 6 breakable wall destroyed, 7 item picked up.
export const EVT = { ENTER: 0, ACTION: 2, LEAVE: 3, DEFEATED: 4, WALK_DONE: 5, WALL: 6, PICKUP: 7 };

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export class ScriptRuntime {
  constructor(game, mission) {
    this.game = game;
    this.mission = mission;
    this.handlers = new Map();          // lower-case name -> [fn]
    this.zones = mission.records.filter(r => r.type === 4 && r.poly && r.poly.length >= 3)
      .map(r => ({ rec: r, name: r.name.toLowerCase(), inside: false, triggers: 0, enabled: true, poly: r.poly.map(([dx, dy]) => [r.x + dx, r.y + dy]) }));
    this.timers = [];
    this.vars = {};
    this.objectives = [];
  }
  // --- registration -------------------------------------------------------
  on(names, fn) {
    for (const n of [].concat(names)) {
      const k = n.toLowerCase();
      if (!this.handlers.has(k)) this.handlers.set(k, []);
      this.handlers.get(k).push(fn);
    }
  }
  fire(name, code, data = {}) {
    const list = this.handlers.get(String(name).toLowerCase());
    if (!list) return;
    for (const fn of list) {
      try { fn({ subject: name, code, ...data }); } catch (e) { console.error('script handler', name, e); }
    }
  }
  disableZone(name) { for (const z of this.zones) if (z.name === name.toLowerCase()) z.enabled = false; }
  enableZone(name) { for (const z of this.zones) if (z.name === name.toLowerCase()) z.enabled = true; }
  // --- timers (8 slots in the original) -------------------------------------
  after(ms, fn, repeat = false) { const t = { left: ms, ms, fn, repeat }; this.timers.push(t); return t; }
  cancel(t) { this.timers = this.timers.filter(x => x !== t); }
  // --- per tick ---------------------------------------------------------------
  update(dtMs) {
    this.actionConsumed = false;
    const p = this.game.player;
    // never steal the attack button while an enemy is within striking distance
    const fighting = !!(p && p.alive && p.nearestEnemy(p.reach + 90));
    if (p && p.alive) {
      for (const z of this.zones) {
        if (!z.enabled) continue;
        const inside = pointInPoly(p.x, p.y, z.poly);
        if (inside && !z.inside) {
          if (z.rec.maxTriggers && z.triggers >= z.rec.maxTriggers) continue;
          z.triggers++;
          z.inside = true;
          this.fire(z.rec.name, EVT.ENTER, { zone: z, character: p });
        } else if (!inside && z.inside) {
          z.inside = false;
          this.fire(z.rec.name, EVT.LEAVE, { zone: z, character: p });
        }
        if (z.inside && !fighting && this.game.input.wasPressed('attack')) {
          this.fire(z.rec.name, EVT.ACTION, { zone: z, character: p });
          this.actionConsumed = true;
        }
      }
    }
    // characters with handlers fire enter/leave when the leader comes near (event 0 "came near an NPC")
    if (p && p.alive) for (const a of this.game.actors) {
      if (a === p || a.team === 0 && a.isHero || a.team === 1) continue;
      const key = (a.name || a.key).toLowerCase();
      if (!this.handlers.has(key) && !this.handlers.has(a.key.toLowerCase())) continue;
      const d = Math.hypot(a.x - p.x, a.y - p.y);
      if (!a.scriptNear && d < 150) { a.scriptNear = true; this.fire(this.handlers.has(key) ? key : a.key, EVT.ENTER, { character: a }); }
      else if (a.scriptNear && d > 200) { a.scriptNear = false; this.fire(this.handlers.has(key) ? key : a.key, EVT.LEAVE, { character: a }); }
      if (a.scriptNear && !fighting && this.game.input.wasPressed('attack') && d < 150) { this.fire(this.handlers.has(key) ? key : a.key, EVT.ACTION, { character: a }); this.actionConsumed = true; }
    }
    for (const t of [...this.timers]) {
      t.left -= dtMs;
      if (t.left <= 0) {
        if (t.repeat) t.left += t.ms; else this.cancel(t);
        try { t.fn(); } catch (e) { console.error('script timer', e); }
      }
    }
  }
}

// Base class for per-mission scripts: wraps the framework API calls (names follow docs/specs/missions.md)
export class MissionScript {
  constructor(game, rt) { this.game = game; this.rt = rt; }
  init() {}
  start() {}
  // entities
  find(name) { const n = name.toLowerCase(); return this.game.actors.find(a => (a.name || a.key).toLowerCase() === n || a.key.toLowerCase() === n) || null; }
  findAll(kind) { const n = kind.toLowerCase(); return this.game.actors.filter(a => a.key.toLowerCase() === n); }
  async spawn(name, key, x, y) { return this.game.spawnCharacter(key, x, y, name); }
  remove(name) { const a = this.find(name); if (a) this.game.removeActor(a); }
  setEnemy(name) { for (const a of this.matching(name)) { a.team = 1; } }
  setAlly(name) { for (const a of this.matching(name)) { a.team = 0; } }
  setNeutral(name) { for (const a of this.matching(name)) { a.team = 2; a.target = null; } }
  setUnkillable(name, on = true) { for (const a of this.matching(name)) a.unkillable = on; }
  setLevel(name, level) { for (const a of this.matching(name)) a.setLevel(level); }
  walkToTile(name, tx, ty) { const a = this.find(name); return a ? a.walkToTile(tx, ty).then(() => this.rt.fire(name, 5, { character: a })) : Promise.resolve(); }
  kill(name) { for (const a of this.matching(name)) { a.unkillable = false; if (a.alive) a.die(null); } }
  teleport(name, x, y) { const a = this.find(name); if (a) { a.x = x; a.y = y; } }
  matching(name) { const n = name.toLowerCase(); return this.game.actors.filter(a => (a.name || '').toLowerCase() === n || a.key.toLowerCase() === n); }
  // conversation / text
  dialogue(file, label) { return this.game.dialogue.start(file, label); }
  async objective(index, state = 0) { await this.game.setObjective(index, state); }
  message(index) { return this.game.scriptMessage(index); }
  // progression
  giveItem(name) { const it = this.game.assets.items.find(i => i.name.toLowerCase() === name.toLowerCase()); if (it) this.game.inventory.add(it); }
  hasItem(name) { const it = this.game.assets.items.find(i => i.name.toLowerCase() === name.toLowerCase()); return !!it && this.game.inventory.has(it); }
  questXP(n) { for (const a of this.game.party()) a.gainXP(n); }
  changeLevel(mdd, spawn = 1) { return this.game.changeLevel(mdd, spawn); }
  completeEpisode(spawn = 1) { return this.game.completeEpisode(spawn); }
  // presentation
  setControl(on) { this.game.playerControl = on; }
  fadeOut() { return this.game.fade(1); }
  fadeIn() { return this.game.fade(0); }
}
