import { dv } from './pkg.js';

// .spr sprite sheet. Header = 16 x u32:
// [1] version [2] frame count [3] format flags (0x200 8-bit pal, 0x20 4-bit pal, else ARGB4444) [6] rows [7] frames per row [9] transparent key
// Frame table (16 bytes): u16 w, h, sheetX, sheetY, hotX, hotY, u32 pixel offset
export class Sprite {
  constructor(bytes, name = '') {
    const d = dv(bytes), h = i => d.getUint32(i * 4, true);
    this.name = name;
    this.version = h(1);
    this.count = h(2);
    const flags = h(3);
    this.rows = Math.max(1, h(6));
    this.perRow = Math.max(1, h(7));
    this.key = h(9);
    let p = 0x40, palSize = 0;
    this.bpp = 16;
    if (flags & 0x200) { this.bpp = 8; palSize = 256; } else if (flags & 0x20) { this.bpp = 4; palSize = 16; }
    const pal = [];
    for (let i = 0; i < palSize; i++) pal.push(d.getUint16(p + i * 2, true));
    p += palSize * 2;
    const frames = [];
    for (let i = 0; i < this.count; i++) {
      const o = p + i * 16;
      frames.push({ w: d.getUint16(o, true), h: d.getUint16(o + 2, true), hx: d.getUint16(o + 8, true), hy: d.getUint16(o + 10, true), off: d.getUint32(o + 12, true) });
    }
    const base = p + this.count * 16;
    let hasAlpha = false;
    if (this.bpp === 16) for (let i = base + 1; i < bytes.length; i += 2) if (bytes[i] & 0xf0) { hasAlpha = true; break; }
    // decode every frame to a canvas once
    this.frames = frames.map(f => {
      if (!f.w || !f.h) return null;
      const img = new ImageData(f.w, f.h), px = img.data;
      for (let i = 0; i < f.w * f.h; i++) {
        let c, a = 255;
        if (this.bpp === 16) {
          c = d.getUint16(base + (f.off + i) * 2, true);
          if (hasAlpha) a = ((c >> 12) & 15) * 17;
          else if ((c & 0xfff) === (this.key & 0xfff)) a = 0;
        } else {
          const idx = this.bpp === 8 ? bytes[base + f.off + i] : (i & 1 ? bytes[base + f.off + (i >> 1)] >> 4 : bytes[base + f.off + (i >> 1)] & 15);
          c = pal[idx];
          if (idx === this.key) a = 0;
        }
        const j = i * 4;
        px[j] = ((c >> 8) & 15) * 17; px[j + 1] = ((c >> 4) & 15) * 17; px[j + 2] = (c & 15) * 17; px[j + 3] = a;
      }
      const canvas = new OffscreenCanvas(f.w, f.h);
      canvas.getContext('2d').putImageData(img, 0, 0);
      return { canvas, w: f.w, h: f.h, hx: f.hx, hy: f.hy };
    });
  }
}
