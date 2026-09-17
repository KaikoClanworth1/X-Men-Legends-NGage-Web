import { dv, cstr, findU32 } from './pkg.js';

// .tst tileset: u32 version, u32 len + sprite name, u32 count, 32-byte records
// +0 type (0 static, 1 loop anim, 2 proximity door, 3 static+alt, 4 scripted door), +1 frame count, +4 alt frame,
// +5 frame list (static: u16), +0x14/+0x16 i16 draw offset, +0x1a/+0x1c door open/close sound
export function parseTileset(bytes) {
  const d = dv(bytes), nameLen = d.getUint32(4, true);
  const sprite = cstr(bytes, 8, nameLen);
  let p = 8 + nameLen;
  const n = d.getUint32(p, true); p += 4;
  const tiles = [];
  for (let i = 0; i < n; i++) {
    const o = p + 32 * i, cnt = bytes[o + 1];
    tiles.push({
      type: bytes[o], frames: cnt > 1 ? [...bytes.subarray(o + 5, o + 5 + cnt)] : [d.getUint16(o + 5, true)],
      alt: bytes[o + 4], xoff: d.getInt16(o + 0x14, true), yoff: d.getInt16(o + 0x16, true),
    });
  }
  return { sprite, tiles };
}

// .btm map (loader VA 0x100b60d0)
export function parseMap(bytes) {
  const d = dv(bytes);
  const sets = {}, objectSprites = [];
  let p = findU32(bytes, 0xfeedf00d) + 4;
  const endSets = findU32(bytes, 0xfeedfada), grid = findU32(bytes, 0xfeedbeef);
  while (p < endSets) { const id = bytes[p], l = bytes[p + 1]; sets[id] = cstr(bytes, p + 2, l); p += 2 + l; }
  p = endSets + 4;
  while (p < grid) { const l = bytes[p]; objectSprites.push(cstr(bytes, p + 1, l)); p += 1 + l; }
  p = grid + 5;
  const W = d.getUint32(p, true), H = d.getUint32(p + 4, true), N = d.getUint32(p + 12, true);
  p += 16;
  const lut = new Map();
  for (let k = 0; k < N; k++) lut.set(bytes[p + k], { tile: bytes[p + N + k], set: bytes[p + 2 * N + k] });
  p += 3 * N;
  const collision = bytes.slice(p, p + W * H), floor = bytes.slice(p + W * H, p + 2 * W * H), walls = bytes.slice(p + 2 * W * H, p + 3 * W * H);
  p += 3 * W * H;
  const nObj = d.getUint32(p, true), objects = [];
  for (let i = 0; i < nObj; i++) {
    const o = p + 4 + 12 * i;
    objects.push({ sprite: bytes[o], frame: bytes[o + 1], def: bytes[o + 3], x: d.getUint16(o + 4, true), y: d.getUint16(o + 6, true), z: d.getUint16(o + 8, true), dx: d.getInt8(o + 10), dy: d.getInt8(o + 11) });
  }
  return { W, H, sets, objectSprites, lut, collision, floor, walls, objects };
}

// .mdd mission (loader VA 0x10023744)
export function parseMission(bytes) {
  const d = dv(bytes), map = cstr(bytes, 12, 40), n = d.getUint16(0x34, true), inventory = [];
  for (let i = 0; i < n; i++) inventory.push({ item: d.getUint32(0x44 + i * 32, true), count: d.getUint32(0x48 + i * 32, true) });
  const records = [];
  let p = findU32(bytes, 0xe71dfade);
  while (p >= 0 && p + 32 <= bytes.length && d.getUint32(p, true) === 0xe71dfade) {
    const size = d.getUint32(p + 4, true), type = d.getUint32(p + 8, true), q = p + 32;
    const r = { type, name: cstr(bytes, p + 12, 20) };
    if (type === 0) Object.assign(r, { kind: cstr(bytes, q, 20), x: d.getInt32(q + 20, true), y: d.getInt32(q + 24, true), z: d.getInt32(q + 28, true) });
    else if (type === 4 || type === 5) {
      Object.assign(r, { x: d.getInt32(q, true), y: d.getInt32(q + 4, true), z: d.getInt32(q + 8, true) });
      if (type === 4) {
        const cnt = Math.min(6, d.getUint32(q + 12, true));
        r.poly = [];
        for (let k = 0; k < cnt; k++) r.poly.push([d.getInt16(q + 16 + k * 4, true), d.getInt16(q + 18 + k * 4, true)]);
        r.maxTriggers = d.getUint32(q + 40, true);
      } else {
        Object.assign(r, { bank: d.getUint16(q + 12, true), sound: d.getUint16(q + 14, true), volume: d.getUint16(q + 16, true), radius: d.getUint16(q + 18, true), flags: d.getUint32(q + 20, true) });
      }
    }
    records.push(r);
    p = q + size;
  }
  return { map, inventory, records };
}
