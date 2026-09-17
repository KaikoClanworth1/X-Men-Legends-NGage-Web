import { Level, worldToScreen } from '../engine/level.js';
import { parseMission } from '../formats/map.js';
import { Character, TICK_MS, S } from './character.js';
import { Hud } from './hud.js';
import { Particles } from '../engine/particles.js';
import { Breakables } from './breakables.js';
import { Pickups, Inventory } from './pickups.js';
import { Dialogue } from './dialogue.js';
import { Voice } from '../audio/audio.js';

const randShake = k => Math.round((Math.random() * 2 - 1) * k);
export const SCREEN_W = 176, SCREEN_H = 208;   // N-Gage display

export class Game {
  constructor(assets, canvas, input) {
    this.assets = assets;
    this.canvas = canvas;
    this.g = canvas.getContext('2d');
    this.g.imageSmoothingEnabled = false;
    this.input = input;
    this.actors = [];
    this.floaters = [];
    this.accum = 0;
  }
  async loadMission(mddName, heroKey = 'wolverine') {
    const mission = parseMission(await this.assets.bytes(mddName));
    this.mission = mission;
    this.level = await Level.load(this.assets, mission.map);
    this.actors = [];
    this.floaters = [];
    this.cam = null; this.camK = 0x1000; this.lead = null;
    if (!this.hud) this.hud = await Hud.load(this);
    if (!this.particles) this.particles = await Particles.load(this.assets);
    this.particles.active = [];
    if (!this.breakables) this.breakables = await Breakables.load(this);
    this.breakables.attach(this.level);
    this.pickups = new Pickups(this);
    if (!this.inventory) this.inventory = new Inventory();
    if (!this.itemIcons) this.itemIcons = await this.assets.sprite('items.spr');
    if (!this.itemNames) { this.itemNames = await this.assets.text('items.txt'); this.abilityNames = await this.assets.text('abilities.txt'); }
    this.notices = [];
    if (!this.dialogue) { this.dialogue = await Dialogue.load(this); this.voice = new Voice(this.assets); }
    this.time = 0;
    const spawn = mission.records.find(r => r.type === 4 && /^spawn/i.test(r.name)) || mission.records.find(r => r.type === 4) || { x: 300, y: 300 };
    this.player = await Character.create(this, heroKey, spawn.x + 50, spawn.y + 50);
    this.player.team = 0;
    this.actors.push(this.player);
    for (const r of mission.records.filter(r => r.type === 0)) {
      if (!this.assets.characters.get(r.kind.toLowerCase())) continue;
      const npc = await Character.create(this, r.kind, r.x, r.y);
      npc.name = r.name;
      this.actors.push(npc);
    }
  }
  itemName(item) {
    return (item.level ? this.abilityNames : this.itemNames)[item.stringIndex] || item.name;
  }
  notify(text, life = 60) { this.notices.unshift({ text, life }); this.notices.length = Math.min(this.notices.length, 3); }
  floatText(actor, text) {
    if (/^\d+$/.test(text) && this.hud) { this.hud.damage(actor, text); return; }
    this.floaters.push({ x: actor.x, y: actor.y, z: 90, text, life: 18 });
  }
  // D-pad -> facing angle, in the game's test order (VA 0x10012be8): diagonals first. Direction index * 0x80 = angle.
  readMove() {
    const i = this.input, U = i.isDown('up'), D = i.isDown('down'), L = i.isDown('left'), R = i.isDown('right');
    const dir = D && R ? 0 : U && R ? 2 : U && L ? 4 : D && L ? 6 : R ? 1 : U ? 3 : L ? 5 : D ? 7 : -1;
    return dir < 0 ? null : dir * 0x80;
  }
  // Camera (VA 0x1002ef48): lead offset by facing while moving, eased follow; snap on level start or far jumps
  updateCamera() {
    const p = this.player;
    const LEAD = [[60, 30], [60, 0], [60, -60], [0, -60], [-60, -60], [-60, 0], [-60, 30], [0, 30]];
    const moving = p.state === S.RUN || p.state === S.WALK;
    const lt = moving ? LEAD[(p.facing >> 7) & 7] : [0, -20];
    const lerp = (t, a, b) => b + (((a - b) * t) >> 12) + (a > b ? 1 : 0);
    this.lead = this.lead || [0, -20];
    this.lead = [lerp(0xff, lt[0], this.lead[0]), lerp(0xff, lt[1], this.lead[1])];
    const [sx, sy] = worldToScreen(p.x, p.y, p.z);
    const target = [Math.trunc(sx) + this.lead[0], Math.trunc(sy) + this.lead[1]];
    if (!this.cam || this.camK === 0x1000 || (target[0] - this.cam[0]) ** 2 + (target[1] - this.cam[1]) ** 2 > 400000) { this.cam = target; this.camK = 0x2ff; }
    else this.cam = [lerp(this.camK, target[0], this.cam[0]), lerp(this.camK, target[1], this.cam[1])];
  }
  update() {
    this.input.pollGamepad();
    if (this.dialogue && this.dialogue.active) {           // conversations pause the world
      this.dialogue.update(this.input);
      this.input.endFrame();
      return;
    }
    const move = this.readMove();
    for (const a of this.actors) a.update(this.level, a === this.player ? move : null);
    for (const f of this.floaters) { f.life--; f.z += 3; }
    this.floaters = this.floaters.filter(f => f.life > 0);
    if (this.hud) this.hud.update();
    if (this.particles) this.particles.update(TICK_MS);
    this.time += TICK_MS;
    if (this.breakables) this.breakables.update();
    if (this.pickups) this.pickups.update();
    for (const n of this.notices || []) n.life--;
    if (this.notices) this.notices = this.notices.filter(n => n.life > 0);
    this.updateCamera();
    this.level.tick++;
    this.input.endFrame();
  }
  render() {
    const g = this.g;
    g.fillStyle = '#000';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    if (!this.level) return;
    const p = this.player;
    if (!this.cam) this.updateCamera();
    let camX = this.cam[0] - SCREEN_W / 2, camY = this.cam[1] - SCREEN_H / 2;
    if (this.shake && performance.now() < this.shake.until) { camX += randShake(this.shake.strength); camY += randShake(this.shake.strength); }
    this.level.draw(g, camX, camY, SCREEN_W, SCREEN_H, [...this.actors.filter(a => a.state !== S.DEAD), ...(this.pickups ? this.pickups.list : [])]);
    if (this.particles) this.particles.draw(g, camX, camY);
    g.font = '7px monospace';
    g.textAlign = 'center';
    for (const f of this.floaters) {
      const [sx, sy] = worldToScreen(f.x, f.y, f.z);
      g.fillStyle = '#000'; g.fillText(f.text, sx - camX + 1, sy - camY + 1);
      g.fillStyle = '#ffd84a'; g.fillText(f.text, sx - camX, sy - camY);
    }
    if (this.hud) {
      this.hud.draw(g);
      if (this.dialogue) this.dialogue.draw(g);
      (this.notices || []).forEach((n, i) => this.hud.fonts.arial.draw(g, n.text, SCREEN_W / 2, 150 - i * 11, { align: 'center', alpha: Math.min(1, n.life / 10) }));
    }
    if (!p.alive) { g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = '10px monospace'; g.fillText('DEFEATED', SCREEN_W / 2, SCREEN_H / 2); }
  }
  start() {
    let last = performance.now();
    const frame = now => {
      this.accum += Math.min(250, now - last);
      last = now;
      while (this.accum >= TICK_MS) { this.update(); this.accum -= TICK_MS; }
      this.render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}
