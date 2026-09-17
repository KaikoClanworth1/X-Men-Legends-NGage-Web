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
    return lvl;
  }
  get W() { return this.map.W; }
  get H() { return this.map.H; }
  addToCell(o) {
    const k = Math.floor(o.y / 100) * this.W + Math.floor(o.x / 100);
    if (!this.cellObjects.has(k)) this.cellObjects.set(k, []);
    this.cellObjects.get(k).push(o);
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
    const frameIndex = t.type === 1 ? t.frames[Math.floor(this.tick / 2) % t.frames.length] : t.frames[0];
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
          const spr = this.objectSprites[o.sprite], f = spr && spr.frames[o.frame];
          if (!f) continue;
          const [sx, sy] = worldToScreen(o.x, o.y, o.z);
          g.drawImage(f.canvas, Math.round(sx + o.dx - f.hx - camX), Math.round(sy + o.dy - f.hy - camY));
        }
      }
  }
}
