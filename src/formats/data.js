import { dv, cstr } from './pkg.js';

export const ELEMENTS = ['physical', 'fire', 'cold', 'wind', 'electric', 'mental', 'energy'];
export const STATUS = ['charm', 'blind', 'stun', 'sleep', 'confuse', 'freeze', 'burn', 'poison'];
// animation suffixes, indexed by animation id (table @VA 0x100f6a18)
export const ANIMS = ['xxx', 'w01', 'r01', 'i01', 'm01', 'm02', 'x01', 'h01', 'd01', 's01', 's02', 's03', 's04', 'o01', 'o02', 'o04', 'o05', 'u01', 'f01', 'f02'];
export const ANIM = Object.fromEntries(ANIMS.map((a, i) => [a, i]));

export function parseStrings(bytes) {
  return new TextDecoder('utf-16le').decode(bytes).replace(/^﻿/, '').split(/\r?\n/);
}

// characters.cdt: 184-byte records (see FORMATS.md)
export function parseCharacters(bytes) {
  const d = dv(bytes), n = d.getUint32(4, true), base = 16 + 20 * n, out = new Map();
  for (let i = 0; i < n; i++) {
    const o = base + 184 * i, key = cstr(bytes, 16 + 20 * i, 20);
    const powers = [];
    for (let k = 0; k < 4; k++) powers.push({ ability: d.getInt16(o + 152 + k * 8, true), anim: d.getUint16(o + 154 + k * 8, true), unlock: bytes[o + 156 + k * 8] });
    out.set(key.toLowerCase(), {
      key, nameId: bytes[o + 1], level: bytes[o + 2], moveSpeed: bytes[o + 3], attackAnim: bytes[o + 4], role: bytes[o + 7],
      xp: d.getUint32(o + 8, true), flags: d.getUint32(o + 12, true), fov: d.getUint16(o + 16, true), sight: d.getUint16(o + 18, true), reach: d.getUint16(o + 20, true),
      caps: [...bytes.subarray(o + 54, o + 58)], stats: [...bytes.subarray(o + 58, o + 62)], immune: bytes[o + 62],
      taken: [...Array(7)].map((_, k) => d.getInt16(o + 64 + k * 2, true)),
      flat: [...bytes.subarray(o + 78, o + 85)], pct: [...bytes.subarray(o + 85, o + 92)],
      items: [...Array(4)].map((_, k) => d.getInt16(o + 92 + k * 2, true)).filter(x => x > 0),
      animMask: d.getUint32(o + 100, true), animTicks: [...bytes.subarray(o + 104, o + 128)], powers,
    });
  }
  return out;
}

// items.idf: 156-byte records (see FORMATS.md)
export function parseItems(bytes) {
  const d = dv(bytes), n = d.getUint32(0, true), list = [];
  for (let k = 0; k < n; k++) {
    const o = 28 + 156 * k, i16 = x => d.getInt16(o + x, true), i32 = x => d.getInt32(o + x, true);
    const code = i16(96);
    list.push({
      index: k, name: cstr(bytes, o + 132, 24), code, level: Math.floor(code / 100), stringIndex: code % 100,
      hpBonus: i32(0), energyBonus: i32(4), stats: [i32(8), i32(12), i32(16), i32(20)],
      taken: [...Array(7)].map((_, j) => i32(24 + j * 4)), flat: [...Array(7)].map((_, j) => d.getUint16(o + 52 + j * 2, true)), pct: [...Array(7)].map((_, j) => d.getUint16(o + 66 + j * 2, true)),
      immune: d.getUint32(o + 80, true), element: bytes[o + 84], inflict: bytes[o + 85], cure: bytes[o + 86], cls: bytes[o + 87], slot: bytes[o + 88], icon: bytes[o + 89],
      dmgMin: i16(92), dmgMax: i16(94), energyTick: i16(98), fxCast: i16(100), fxCaster: i16(102), fxImpact: i16(104), healTick: i16(106), dotTick: i16(108),
      cost: i16(110), range: i16(114), radius: i16(116), arc: i16(118), shake: i16(120), shakeMs: i16(122), duration: i32(124), tick: i32(128),
    });
  }
  return list;
}
