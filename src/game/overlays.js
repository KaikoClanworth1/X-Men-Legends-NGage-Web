import { worldToScreen } from '../engine/level.js';

// In-game hotkey screens: 2 Formation Select, 9 Objectives, 3 Map (0 Stats opens the pause menu's stats page).
// The original layouts are not traced (docs/specs/ui.md §7); these use the pause menu's fonts and backdrop.
export const FORMATIONS = [
  { name: 'Wedge', slots: [[-110, -90], [110, -90], [-220, -180], [220, -180]] },
  { name: 'Column', slots: [[0, -110], [0, -220], [0, -330], [0, -440]] },
  { name: 'Line', slots: [[-120, 0], [120, 0], [-240, 0], [240, 0]] },
  { name: 'Box', slots: [[-110, 0], [0, -110], [-110, -110], [-220, -110]] },
];
// AI stance (labels 53-56): how far teammates look for enemies and how far they stray from the leader
export const STANCES = [
  { name: 'Berserk', scan: 900, leash: 1100 },
  { name: 'Aggressive', scan: 650, leash: 800 },
  { name: 'Normal', scan: 500, leash: 700 },
  { name: 'Defensive', scan: 250, leash: 350 },
];

export function formationOffset(game, actor) {
  const mates = game.party().filter(a => a !== game.player);
  const idx = mates.indexOf(actor);                // escorts (not in the party) trail in the last slot
  const slot = FORMATIONS[game.formation || 0].slots[idx < 0 ? 3 : idx % 4];
  // slot = [sideways, forward] relative to the leader's facing (angle 0 = +x, 256 = -y)
  const ang = (game.player.facing / 1024) * Math.PI * 2;
  const c = Math.cos(ang), s = Math.sin(ang);
  return [c * slot[1] + s * slot[0], -s * slot[1] + c * slot[0]];
}

export class Overlays {
  constructor(game) { this.game = game; this.screen = null; this.cursor = 0; }
  get active() { return this.screen !== null; }
  update(input) {
    const g = this.game;
    if (!this.screen) {
      if (!g.playerControl) return false;
      if (input.wasPressed('formation')) { this.screen = 'formation'; this.cursor = 0; }
      else if (input.wasPressed('objectives')) this.screen = 'objectives';
      else if (input.wasPressed('map')) this.screen = 'map';
      else if (input.wasPressed('stats') && g.pause) { g.pause.open(); g.pause.go('stats'); g.pause.fromHotkey = true; return true; }
      else return false;
      g.sfx.menu('accept');
      return true;
    }
    const close = input.wasPressed('back') || input.wasPressed('menu') || input.wasPressed(this.screen);
    if (this.screen === 'formation') {
      if (input.wasPressed('up') || input.wasPressed('down')) { this.cursor ^= 1; g.sfx.menu('scroll'); }
      const d = input.wasPressed('left') ? -1 : input.wasPressed('right') || input.wasPressed('attack') ? 1 : 0;
      if (d) {
        if (this.cursor === 0) g.formation = ((g.formation || 0) + d + FORMATIONS.length) % FORMATIONS.length;
        else g.stance = ((g.stance ?? 2) + d + STANCES.length) % STANCES.length;
        g.sfx.menu('scroll');
      }
    } else if (input.wasPressed('attack')) { this.screen = null; g.sfx.menu('back'); return true; }
    if (close) { this.screen = null; g.sfx.menu('back'); }
    return true;
  }
  fonts() { const g = this.game; return g.frontend ? g.frontend.fonts : g.hud.fonts; }
  backdrop(g) {
    const bg = this.game.pause && this.game.pause.bg && this.game.pause.bg.frames[0];
    if (bg) g.drawImage(bg.canvas, 0, 0); else { g.fillStyle = 'rgba(0,0,0,0.8)'; g.fillRect(0, 0, 176, 208); }
  }
  draw(g) {
    if (!this.screen) return;
    const F = this.fonts(), game = this.game;
    if (this.screen === 'map') return this.drawMap(g, F);
    this.backdrop(g);
    if (this.screen === 'formation') {
      F.arial.draw(g, 'Formation Select', 88, 30, { align: 'center' });
      const rows = [`Formation: ${FORMATIONS[game.formation || 0].name}`, `AI Stance: ${STANCES[game.stance ?? 2].name}`];
      rows.forEach((t, i) => {
        const row = game.pause && game.pause.selector && game.pause.selector.frames[i === this.cursor ? 0 : 1];
        if (row) g.drawImage(row.canvas, 0, 49 + 21 * i);
        F.small7.draw(g, `< ${t} >`, 9, 53 + 21 * i);
      });
      // diagram: leader (yellow) and teammate slots, leader facing up
      const cx = 88, cy = 160, k = 0.12;
      g.fillStyle = '#f2c230'; g.fillRect(cx - 3, cy - 3, 6, 6);
      g.fillStyle = '#6cf';
      for (const [x, y] of FORMATIONS[game.formation || 0].slots) g.fillRect(cx + x * k - 2, cy - y * k - 2, 5, 5);
      return;
    }
    // objectives: active first, completed dimmed
    F.arial.draw(g, 'Objectives', 88, 30, { align: 'center' });
    const list = [...(game.objectiveList || [])].filter(o => game.objectiveText && game.objectiveText[o.index]).sort((a, b) => (a.state === 2) - (b.state === 2));
    let y = 50;
    if (!list.length) F.small7.draw(g, 'None', 88, y, { align: 'center' });
    for (const o of list.slice(-10)) {
      for (const line of F.small7.wrap((o.state === 2 ? '+ ' : '- ') + game.objectiveText[o.index], 160)) {
        if (y > 196) break;
        F.small7.draw(g, line, 8, y, { alpha: o.state === 2 ? 0.5 : 1 });
        y += 10;
      }
      y += 3;
    }
  }
  drawMap(g, F) {
    const game = this.game, map = game.level.map, p = game.player;
    g.fillStyle = 'rgba(0,0,0,0.85)'; g.fillRect(0, 0, 176, 208);
    F.arial.draw(g, 'Map', 88, 14, { align: 'center' });
    // isometric minimap of floor cells; scale to fit the screen
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const cells = [];
    for (let cy = 0; cy < map.H; cy++) for (let cx = 0; cx < map.W; cx++) {
      const i = cy * map.W + cx;
      if (!map.floor[i]) continue;
      const [sx, sy] = worldToScreen(cx * 100 + 50, cy * 100 + 50);
      cells.push([sx, sy, map.collision[i]]);
      minX = Math.min(minX, sx); maxX = Math.max(maxX, sx); minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
    }
    if (!cells.length) return;
    const k = Math.min(164 / (maxX - minX + 1), 176 / (maxY - minY + 1));
    const ox = 88 - (minX + maxX) / 2 * k, oy = 116 - (minY + maxY) / 2 * k;
    const sz = Math.max(1, 29 * k);
    for (const [sx, sy, col] of cells) {
      g.fillStyle = col ? '#3a4660' : '#7d8db0';
      g.fillRect(ox + sx * k - sz / 2, oy + sy * k - sz / 4, sz, Math.max(1, sz / 2));
    }
    const dot = (a, color) => { const [sx, sy] = worldToScreen(a.x, a.y); g.fillStyle = color; g.fillRect(ox + sx * k - 2, oy + sy * k - 2, 4, 4); };
    for (const a of game.actors) if (a.alive && a !== p && a.team === 1) dot(a, '#e33');
    for (const a of game.party()) if (a !== p) dot(a, '#6cf');
    if ((game.level.tick >> 3) & 1) dot(p, '#f2c230');
  }
}
