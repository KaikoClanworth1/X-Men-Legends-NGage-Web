import { dv, cstr } from '../formats/pkg.js';

// Bitmap fonts (.fnt + same-named .spr). "ft2": 32-byte header; "fnt": 12-byte header.
// Draw routine VA 0x100c1d20: glyph = map[c] (map[0] when c >= count); advance = frame width + spacing;
// '\n' moves down by line height + 1. Word wrap (VA 0x100c054c) breaks after the last fitting space; pitch = height + 3.
export class Font {
  static async load(assets, name) {
    const bytes = await assets.bytes(name + '.fnt');
    const d = dv(bytes), f = new Font();
    const v2 = cstr(bytes, 0, 3) === 'ft2';
    f.count = d.getUint32(4, true);
    f.height = d.getUint32(8, true);
    const hs = v2 ? 32 : 12;
    f.map = [];
    for (let c = 0; c < f.count && hs + c * 2 + 2 <= bytes.length; c++) f.map.push(d.getUint16(hs + c * 2, true));
    f.sprite = await assets.sprite(name + '.spr');
    f.tints = new Map();
    return f;
  }
  glyph(ch) {
    const c = ch.charCodeAt(0);
    const idx = c < this.map.length ? this.map[c] : this.map[0];
    return this.sprite && this.sprite.frames[idx];     // map value is the frame index (VA 0x100c1d20)
  }
  width(text) {
    let w = 0;
    for (const ch of text) { const g = this.glyph(ch); w += g ? g.w : Math.ceil(this.height / 3); }
    return w;
  }
  // tinted copy of a glyph (colour as CSS string), cached
  tinted(g, color) {
    if (!color) return g.canvas;
    let m = this.tints.get(color);
    if (!m) this.tints.set(color, m = new Map());
    let c = m.get(g);
    if (!c) {
      c = new OffscreenCanvas(g.w, g.h);
      const x = c.getContext('2d');
      x.drawImage(g.canvas, 0, 0);
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = color;
      x.fillRect(0, 0, g.w, g.h);
      m.set(g, c);
    }
    return c;
  }
  // align: 'left' | 'center' | 'right'
  draw(ctx, text, x, y, { align = 'left', color = null, alpha = 1 } = {}) {
    const lines = String(text).split('\n');
    ctx.save();
    ctx.globalAlpha = alpha;
    lines.forEach((line, i) => {
      const w = this.width(line);
      let cx = align === 'center' ? Math.round(x - w / 2) : align === 'right' ? x - w : x;
      const cy = y + i * (this.height + 1);
      for (const ch of line) {
        const g = this.glyph(ch);
        if (!g) { cx += Math.ceil(this.height / 3); continue; }
        ctx.drawImage(this.tinted(g, color), cx, cy);
        cx += g.w;
      }
    });
    ctx.restore();
  }
  wrap(text, maxWidth) {
    const out = [];
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const test = line ? line + ' ' + word : word;
        if (this.width(test) <= maxWidth || !line) line = test;
        else { out.push(line); line = word; }
      }
      out.push(line);
    }
    return out;
  }
}
