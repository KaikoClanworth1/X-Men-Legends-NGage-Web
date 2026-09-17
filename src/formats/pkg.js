// assets.pkg archive: "pkg\0", u32 0, u32 count @8, directory of 44-byte entries @0x30
// entry: char[24] name, u32 index, u32 size, u32 stored size, u32 offset; gzip when stored < size
export class Pkg {
  constructor(buffer) {
    const u8 = new Uint8Array(buffer), dv = new DataView(buffer);
    if (u8[0] !== 0x70 || u8[1] !== 0x6b || u8[2] !== 0x67) throw new Error('Not an X-Men Legends assets.pkg');
    this.buffer = buffer;
    this.entries = new Map();
    const count = dv.getUint32(8, true);
    for (let i = 0; i < count; i++) {
      const o = 0x30 + 44 * i;
      let name = '';
      for (let j = 0; j < 24 && u8[o + j]; j++) name += String.fromCharCode(u8[o + j]);
      this.entries.set(name.toLowerCase(), {
        name, size: dv.getUint32(o + 28, true), stored: dv.getUint32(o + 32, true), offset: dv.getUint32(o + 36, true),
      });
    }
    this.cache = new Map();
  }
  has(name) { return this.entries.has(name.toLowerCase()); }
  list(ext) { return [...this.entries.values()].map(e => e.name).filter(n => !ext || n.toLowerCase().endsWith(ext)); }
  async get(name) {
    const key = name.toLowerCase();
    if (this.cache.has(key)) return this.cache.get(key);
    const e = this.entries.get(key);
    if (!e) throw new Error('Missing asset: ' + name);
    const p = (async () => {
      let bytes = new Uint8Array(this.buffer, e.offset, e.stored);
      if (e.stored < e.size) {
        const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
        bytes = new Uint8Array(await new Response(stream).arrayBuffer());
      }
      return bytes;
    })();
    this.cache.set(key, p);
    return p;
  }
}

export const dv = b => new DataView(b.buffer, b.byteOffset, b.byteLength);
export function cstr(b, p, len = 1e9) {
  let s = '';
  for (let i = 0; i < len && p + i < b.length && b[p + i]; i++) s += String.fromCharCode(b[p + i]);
  return s;
}
export function findU32(b, value, from = 0) {
  const v = dv(b);
  for (let i = from; i + 4 <= b.length; i++) if (v.getUint32(i, true) === value) return i;
  return -1;
}
