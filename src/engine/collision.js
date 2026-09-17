// Collision polygons referenced by the map's collision layer.
// Table @VA 0x10100f60 in 6R54.app: 28-byte entries, u32 point count + 6 x (i16 x, i16 y) in 0..100 cell units.
export const COLLISION_SHAPES = [[],[[0,0],[0,100],[100,100],[100,0]],[[0,0],[0,100],[100,100]],[[0,100],[100,100],[100,0]],[[0,0],[0,100],[100,0]],[[0,0],[100,100],[100,0]],[[0,50],[0,100],[50,100]],[[50,100],[100,100],[100,50]],[[50,0],[100,50],[100,0]],[[0,0],[0,50],[50,0]],[[0,0],[0,50],[100,50],[100,0]],[[0,50],[0,100],[100,100],[100,50]],[[0,0],[0,100],[50,100],[50,0]],[[50,0],[50,100],[100,100],[100,0]],[[0,0],[0,100],[100,100],[100,50]],[[0,0],[0,100],[100,50],[100,0]],[[0,50],[0,100],[100,100],[100,0]],[[0,0],[0,50],[100,100],[100,0]],[[0,0],[0,100],[100,100],[50,0]],[[0,100],[100,100],[100,0],[50,0]],[[0,0],[50,100],[100,100],[100,0]],[[0,0],[0,100],[50,100],[100,0]],[[50,0],[50,50],[100,50],[100,0]],[[0,0],[0,50],[50,50],[50,0]],[[0,50],[0,100],[50,100],[50,50]],[[50,50],[50,100],[100,100],[100,50]],[[30,60],[30,100],[70,100],[70,60]],[[30,0],[30,40],[70,40],[70,0]],[[0,30],[0,70],[40,70],[40,30]],[[60,30],[60,70],[100,70],[100,30]],[[0,30],[0,70],[100,70],[100,30]],[[30,0],[30,100],[70,100],[70,0]],[[0,30],[0,70],[100,100],[100,0]],[[0,0],[0,100],[100,70],[100,30]],[[30,0],[0,100],[100,100],[70,0]],[[0,0],[30,100],[70,100],[100,0]],[[10,10],[10,90],[90,90],[90,10]],[[20,20],[20,80],[80,80],[80,20]],[[30,30],[30,70],[70,70],[70,30]],[[40,40],[40,60],[60,60],[60,40]],[[0,0],[0,100],[100,100],[100,50],[50,0]],[[0,50],[0,100],[100,100],[100,0],[50,0]],[[0,0],[0,50],[50,100],[100,100],[100,0]],[[0,0],[0,100],[50,100],[100,50],[100,0]],[[0,0],[0,70],[30,100],[70,100],[100,70],[100,0]],[[30,0],[0,30],[0,100],[100,100],[100,30],[70,0]],[[30,0],[0,30],[0,70],[30,100],[100,100],[100,0]],[[0,0],[0,100],[70,100],[100,70],[100,30],[70,0]],[[0,50],[0,100],[50,100],[100,50],[100,0],[50,0]],[[0,0],[0,50],[50,100],[100,100],[100,50],[50,0]],[[0,0],[0,100],[50,100]],[[100,0],[50,100],[100,100]],[[50,0],[100,100],[100,0]],[[0,0],[0,100],[50,0]],[[0,50],[0,100],[100,100]],[[0,100],[100,100],[100,50]],[[0,0],[0,50],[100,0]],[[0,0],[100,50],[100,0]],[],[],[],[],[],[[0,0],[0,100],[100,100],[100,0]]];

// Character collision quad relative to position (VA 0x1000ab50)
export const CHAR_QUAD = [[-50, -50], [-50, 10], [10, 10], [10, -50]];

// Separating-axis test for two convex polygons (all collision shapes are convex)
function overlaps(a, b) {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
      const nx = y2 - y1, ny = x1 - x2;
      let aMin = Infinity, aMax = -Infinity, bMin = Infinity, bMax = -Infinity;
      for (const [x, y] of a) { const v = x * nx + y * ny; if (v < aMin) aMin = v; if (v > aMax) aMax = v; }
      for (const [x, y] of b) { const v = x * nx + y * ny; if (v < bMin) bMin = v; if (v > bMax) bMax = v; }
      if (aMax <= bMin || bMax <= aMin) return false;
    }
  }
  return true;
}

// Does the quad at (x, y) hit any collision polygon in the 3x3 cells around it? (VA 0x100c6a1c)
export function hits(map, x, y, quad = CHAR_QUAD) {
  const cx = Math.floor(x / 100), cy = Math.floor(y / 100);
  const q = quad.map(([qx, qy]) => [x + qx, y + qy]);
  for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
    const tx = cx + ox, ty = cy + oy;
    if (tx < 0 || ty < 0 || tx >= map.W || ty >= map.H) continue;
    const v = map.collision[ty * map.W + tx];
    if (!v) continue;
    const shape = COLLISION_SHAPES[v];
    if (!shape || !shape.length) continue;
    if (overlaps(q, shape.map(([px, py]) => [tx * 100 + px, ty * 100 + py]))) return true;
  }
  return false;
}

// Movement resolver (VA 0x100c6080), mode 2 = slide against walls, mode 1 = always accept
export function resolveMove(map, x, y, dx, dy, mode = 2) {
  if (!dx && !dy) return [x, y];
  const c0 = [x + dx, y + dy];
  if (mode === 1) return c0;
  let c1, c2;
  if (dx === 0) { c1 = [x + (dy >> 2), y + (dy >> 2)]; c2 = [x - (dy >> 2), y + (dy >> 2)]; }
  else if (dy === 0) { c1 = [x + (dx >> 2), y + (dx >> 2)]; c2 = [x + (dx >> 2), y - (dx >> 2)]; }
  else { c1 = [x + dx, y]; c2 = [x, y + dy]; }
  for (const [cx, cy] of [c0, c1, c2]) {
    const tx = Math.trunc(cx / 100), ty = Math.trunc(cy / 100);
    if (cx < 0 || cy < 0 || tx >= map.W || ty >= map.H) continue;
    if (!hits(map, cx - (dx < 0 ? 3 : 0), cy - (dy < 0 ? 3 : 0))) return [cx, cy];
  }
  return [x, y];
}

// Kept for callers that still pass a radius (knockback): uses the exact resolver
export function moveWithCollision(map, x, y, dx, dy) {
  return resolveMove(map, x, y, Math.trunc(dx), Math.trunc(dy), 2);
}
