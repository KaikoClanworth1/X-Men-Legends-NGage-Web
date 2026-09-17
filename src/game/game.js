import { Level, worldToScreen } from '../engine/level.js';
import { parseMission } from '../formats/map.js';
import { Character, TICK_MS } from './character.js';

export const SCREEN_W = 176, SCREEN_H = 208;   // N-Gage display

export class Game {
  constructor(assets, canvas, input) {
    this.assets = assets;
    this.canvas = canvas;
    this.g = canvas.getContext('2d');
    this.g.imageSmoothingEnabled = false;
    this.input = input;
    this.actors = [];
    this.accum = 0;
    this.debug = { collision: false };
  }
  async loadMission(mddName, heroKey = 'wolverine') {
    const mission = parseMission(await this.assets.bytes(mddName));
    this.mission = mission;
    this.level = await Level.load(this.assets, mission.map);
    this.actors = [];
    const spawn = mission.records.find(r => r.type === 4 && /^spawn/i.test(r.name)) || mission.records.find(r => r.type === 4) || { x: 300, y: 300 };
    this.player = await Character.create(this.assets, heroKey, spawn.x + 50, spawn.y + 50);
    this.actors.push(this.player);
    for (const r of mission.records.filter(r => r.type === 0)) {
      if (!this.assets.characters.get(r.kind.toLowerCase())) continue;
      const npc = await Character.create(this.assets, r.kind, r.x, r.y);
      npc.name = r.name;
      this.actors.push(npc);
    }
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
    this.level.tick++;
    this.input.endFrame();
  }
  render() {
    const g = this.g;
    g.fillStyle = '#000';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    if (!this.level) return;
    const [px, py] = worldToScreen(this.player.x, this.player.y, this.player.z);
    const camX = Math.round(px - SCREEN_W / 2), camY = Math.round(py - SCREEN_H / 2 - 20);
    this.level.draw(g, camX, camY, SCREEN_W, SCREEN_H, this.actors);
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
