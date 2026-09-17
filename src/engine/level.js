import { parseMap } from '../formats/map.js';

// Isometric projection used by the game (100 world units per cell, 58x30 diamond tiles)
export const TILE_W = 29, TILE_H = 15;
export const worldToScreen = (x, y, z = 0) => [(x - y) * TILE_W / 100, (x + y - z) * TILE_H / 100];
export const screenToWorld = (sx, sy) => {
  const a = sx * 100 / TILE_W, b = sy * 100 / TILE_H;
  return [(a + b) / 2, (b - a) / 2];
};

export class Level {
  static async load(assets, mapName) {
    const lvl = new Level();
    lvl.name = mapName;
    lvl.map = parseMap(await assets.bytes(mapName));
    lvl.tilesets = {};
    for (const [id, name] of Object.entries(lvl.map.sets)) lvl.tilesets[id] = await assets.tileset(name);
    lvl.objectSprites = await Promise.all(lvl.map.objectSprites.map(n => assets.sprite(n)));
    // bucket static objects per cell for the game's draw order
    lvl.cellObjects = new Map();
    for (const o of lvl.map.objects) lvl.addToCell(o);
    lvl.tick = 0;
    lvl.findDoors();
    return lvl;
  }
  get W() { return this.map.W; }
  get H() { return this.map.H; }
  addToCell(o) {
    const k = Math.floor(o.y / 100) * this.W + Math.floor(o.x / 100);
    if (!this.cellObjects.has(k)) this.cellObjects.set(k, []);
    this.cellObjects.get(k).push(o);
  }
  // Doors (tileset types 2 proximity / 4 scripted; state machine VA 0x100d5494): closed cells collide (63),
  // opening plays the frame list forward, stays open ~22 ticks after everyone leaves, then closes.
  findDoors() {
    this.doors = new Map();
    for (let cy = 0; cy < this.H; cy++) for (let cx = 0; cx < this.W; cx++) {
      const tile = this.tileAt(this.map.walls, cx, cy);
      if (!tile || (tile.t.type !== 2 && tile.t.type !== 4) || tile.t.frames.length < 2) continue;
      const k = cy * this.W + cx;
      this.doors.set(k, { cx, cy, type: tile.t.type, frame: 0, open: false, hold: 0, collision: this.map.collision[k] || 63 });
      this.map.collision[k] = this.map.collision[k] || 63;
    }
  }
  updateDoors(actors, onSound) {
    if (!this.doors || !this.doors.size) return;
    const heroCells = actors.filter(a => a.alive && a.team === 0).map(a => [Math.floor(a.x / 100), Math.floor(a.y / 100)]);
    for (const [k, d] of this.doors) {
      const near = d.type === 2 && heroCells.some(([x, y]) => Math.abs(x - d.cx) <= 1 && Math.abs(y - d.cy) <= 1);
      if (d.forceOpen || near) {
        if (!d.open) { d.open = true; onSound && onSound(true); }
        d.hold = 22;
      } else if (d.open && --d.hold <= 0 && !heroCells.some(([x, y]) => x === d.cx && y === d.cy)) {
        d.open = false; onSound && onSound(false);
      }
      const frames = this.tileAt(this.map.walls, d.cx, d.cy).t.frames.length;
      if (d.open && d.frame < frames - 1) d.frame++;
      if (!d.open && d.frame > 0) d.frame--;
      this.map.collision[k] = d.open && d.frame >= frames - 2 ? 0 : d.collision;
    }
  }
  openDoorsNear(x, y, radius = 300) {
    for (const d of (this.doors || new Map()).values()) if (Math.hypot(d.cx * 100 + 50 - x, d.cy * 100 + 50 - y) <= radius) d.forceOpen = true;
  }
  tileAt(layer, cx, cy) {
    const e = this.map.lut.get(layer[cy * this.W + cx]);
    if (!e) return null;
    const ts = this.tilesets[e.set];
    const t = ts && ts.tiles[e.tile];
    return t ? { t, image: ts.image } : null;
  }
  drawTile(g, layer, cx, cy, camX, camY) {
    const tile = this.tileAt(layer, cx, cy);
    if (!tile || !tile.image) return;
    const { t, image } = tile;
    const door = layer === this.map.walls && this.doors && this.doors.get(cy * this.W + cx);
    const frameIndex = door ? t.frames[door.frame] : t.type === 1 ? t.frames[Math.floor(this.tick / 2) % t.frames.length] : t.frames[0];
    const f = image.frames[frameIndex];
    if (!f) return;
    g.drawImage(f.canvas, Math.round((cx - cy) * TILE_W + t.xoff - f.hx - camX), Math.round((cx + cy) * TILE_H + 29 + t.yoff - f.hy - camY));
  }
  // Draw order from the game (VA 0x100c7224): floor by diagonals, then per cell: wall tile then that cell's objects/actors by depth.
  draw(g, camX, camY, viewW, viewH, actors) {
    const margin = 160;
    const cellRange = (sx, sy) => [((sx / TILE_W) + (sy / TILE_H)) / 2, ((sy / TILE_H) - (sx / TILE_W)) / 2];
    const corners = [[camX - margin, camY - margin], [camX + viewW + margin, camY - margin], [camX - margin, camY + viewH + margin * 2], [camX + viewW + margin, camY + viewH + margin * 2]].map(([x, y]) => cellRange(x, y));
    const minX = Math.max(0, Math.floor(Math.min(...corners.map(c => c[0])))), maxX = Math.min(this.W - 1, Math.ceil(Math.max(...corners.map(c => c[0]))));
    const minY = Math.max(0, Math.floor(Math.min(...corners.map(c => c[1])))), maxY = Math.min(this.H - 1, Math.ceil(Math.max(...corners.map(c => c[1]))));
    for (let s = minX + minY; s <= maxX + maxY; s++)
      for (let cy = minY; cy <= maxY; cy++) { const cx = s - cy; if (cx >= minX && cx <= maxX) this.drawTile(g, this.map.floor, cx, cy, camX, camY); }
    // dynamic actors bucketed by cell for this frame
    const dyn = new Map();
    for (const a of actors) {
      const k = Math.floor(a.y / 100) * this.W + Math.floor(a.x / 100);
      if (!dyn.has(k)) dyn.set(k, []);
      dyn.get(k).push(a);
    }
    for (let s = minX + minY; s <= maxX + maxY; s++)
      for (let cy = minY; cy <= maxY; cy++) {
        const cx = s - cy;
        if (cx < minX || cx > maxX) continue;
        this.drawTile(g, this.map.walls, cx, cy, camX, camY);
        const k = cy * this.W + cx, list = [...(this.cellObjects.get(k) || []), ...(dyn.get(k) || [])];
        if (!list.length) continue;
        list.sort((a, b) => (a.x + a.y) - (b.x + b.y));
        for (const o of list) {
          if (o.draw) { o.draw(g, camX, camY); continue; }
          const spr = this.objectSprites[o.sprite], f = o.hidden ? o.debrisFrame : spr && spr.frames[o.frame];
          if (!f) continue;
          const [sx, sy] = worldToScreen(o.x, o.y, o.z);
          const flash = o.breakable && o.breakable.flash & 1;
          if (flash) { g.save(); g.filter = 'brightness(2.2)'; }
          g.drawImage(f.canvas, Math.round(sx + (o.hidden ? 0 : o.dx) - f.hx - camX), Math.round(sy + (o.hidden ? 0 : o.dy) - f.hy - camY));
          if (flash) g.restore();
        }
      }
  }
}
