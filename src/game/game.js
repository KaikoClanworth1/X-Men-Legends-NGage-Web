import { Level, worldToScreen } from '../engine/level.js';
import { parseMission } from '../formats/map.js';
import { Character, TICK_MS, S } from './character.js';

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
  floatText(actor, text) {
    this.floaters.push({ x: actor.x, y: actor.y, z: 90, text, life: 18 });
  }
  // screen-relative d-pad -> world direction (screen up = world (-1,-1))
  readMove() {
    const i = this.input;
    const sx = (i.isDown('right') ? 1 : 0) - (i.isDown('left') ? 1 : 0);
    const sy = (i.isDown('down') ? 1 : 0) - (i.isDown('up') ? 1 : 0);
    if (!sx && !sy) return null;
    return [sx + sy, sy - sx];
  }
  update() {
    this.input.pollGamepad();
    const move = this.readMove();
    for (const a of this.actors) a.update(this.level, a === this.player ? move : null);
    for (const f of this.floaters) { f.life--; f.z += 3; }
    this.floaters = this.floaters.filter(f => f.life > 0);
    this.level.tick++;
    this.input.endFrame();
  }
  render() {
    const g = this.g;
    g.fillStyle = '#000';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    if (!this.level) return;
    const p = this.player;
    const [px, py] = worldToScreen(p.x, p.y, p.z);
    const camX = Math.round(px - SCREEN_W / 2), camY = Math.round(py - SCREEN_H / 2 - 20);
    this.level.draw(g, camX, camY, SCREEN_W, SCREEN_H, this.actors.filter(a => a.state !== S.DEAD));
    g.font = '7px monospace';
    g.textAlign = 'center';
    for (const f of this.floaters) {
      const [sx, sy] = worldToScreen(f.x, f.y, f.z);
      g.fillStyle = '#000'; g.fillText(f.text, sx - camX + 1, sy - camY + 1);
      g.fillStyle = '#ffd84a'; g.fillText(f.text, sx - camX, sy - camY);
    }
    // temporary HUD until the original HUD spec is implemented
    const bar = (y, v, max, color) => { g.fillStyle = '#000a'; g.fillRect(3, y, 62, 5); g.fillStyle = color; g.fillRect(4, y + 1, Math.round(60 * v / Math.max(1, max)), 3); };
    bar(3, p.hp, p.maxHP, '#d33'); bar(9, p.energy, p.maxEnergy, '#39f');
    g.textAlign = 'left'; g.fillStyle = '#fff'; g.fillText(`Lv${p.level}`, 68, 9);
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
