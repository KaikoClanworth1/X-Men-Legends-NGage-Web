import { ANIMS, ANIM } from '../formats/data.js';
import { worldToScreen } from '../engine/level.js';
import { moveWithCollision } from '../engine/collision.js';

export const TICK_MS = 45;          // game logic tick (emitters and animations run at 45 ms)

// Facing: 8 directions, 0 = +x world. Sprite sheets hold 5 direction rows; the other 3 are mirrored.
// PROVISIONAL mapping until the core-loop RE spec confirms it (see docs/ROADMAP.md).
export const DIR_TO_ROW = [0, 1, 2, 3, 4, 3, 2, 1];
export const DIR_MIRROR = [false, false, false, false, false, true, true, true];
const DIR_VECTORS = [...Array(8)].map((_, i) => [Math.cos(i * Math.PI / 4), Math.sin(i * Math.PI / 4)]);

export class Character {
  static async create(assets, key, x, y) {
    const def = assets.characters.get(key.toLowerCase());
    const c = new Character();
    c.key = key; c.def = def; c.x = x; c.y = y; c.z = 0;
    c.facing = 1; c.anim = ANIM.i01; c.frame = 0; c.frameTimer = 0;
    c.radius = 30;
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
  get moveSpeed() { return (this.def ? this.def.moveSpeed : 10) * 3; }   // PROVISIONAL world units per tick
  setAnim(id) {
    if (this.anim === id) return;
    if (!this.sheets[id]) return;
    this.anim = id; this.frame = 0; this.frameTimer = 0;
  }
  // input: {dx, dy} in -1..1 screen-relative directions already converted to world by the caller
  update(level, move) {
    if (move && (move[0] || move[1])) {
      const len = Math.hypot(move[0], move[1]);
      const vx = move[0] / len, vy = move[1] / len;
      let best = 0, bestDot = -2;
      DIR_VECTORS.forEach(([dx, dy], i) => { const d = dx * vx + dy * vy; if (d > bestDot) { bestDot = d; best = i; } });
      this.facing = best;
      [this.x, this.y] = moveWithCollision(level.map, this.x, this.y, vx * this.moveSpeed, vy * this.moveSpeed, this.radius);
      this.setAnim(this.sheets[ANIM.r01] ? ANIM.r01 : ANIM.w01);
    } else {
      this.setAnim(ANIM.i01);
    }
    const sheet = this.sheets[this.anim];
    if (sheet) {
      const ticks = Math.max(1, this.def ? this.def.animTicks[this.anim] || 1 : 1);
      if (++this.frameTimer >= ticks) { this.frameTimer = 0; this.frame = (this.frame + 1) % sheet.perRow; }
    }
  }
  draw(g, camX, camY) {
    const sheet = this.sheets[this.anim] || this.sheets[ANIM.i01];
    if (!sheet) return;
    const row = DIR_TO_ROW[this.facing], mirror = DIR_MIRROR[this.facing];
    const f = sheet.frames[row * sheet.perRow + (this.frame % sheet.perRow)];
    if (!f) return;
    const [sx, sy] = worldToScreen(this.x, this.y, this.z);
    const px = Math.round(sx - camX), py = Math.round(sy - camY);
    if (mirror) {
      g.save(); g.translate(px, py); g.scale(-1, 1);
      g.drawImage(f.canvas, -f.hx, -f.hy);
      g.restore();
    } else g.drawImage(f.canvas, px - f.hx, py - f.hy);
  }
}
