// Episode progression (table @VA 0x100f8604, 28 x 24 bytes): mdd, 4 forced hero slots (11 = free choice), u16 level, u16 locked-hero mask.
// Hero indices (save file / party order): 0 Beast, 1 Colossus, 2 Cyclops, 3 Gambit, 4 Iceman, 5 Phoenix, 6 Magma, 7 Nightcrawler, 8 Rogue, 9 Storm, 10 Wolverine
export const HEROES = ['beast', 'colossus', 'cyclops', 'gambit', 'iceman', 'phoenix', 'magma', 'ncrawler', 'rogue', 'storm', 'wolverine'];

export const EPISODES = [
  ['tutorial', [10, 255, 255, 255], 2, 0], ['e01m01', [10, 2, 4, 8], 1, 0], ['e02m03', [6, 5, 9, 8], 6, 1183],
  ['e03m06', [11, 11, 11, 11], 6, 74], ['e04m11', [6, 11, 11, 11], 7, 159], ['e05m07', [11, 11, 11, 11], 7, 74],
  ['e06m12', [11, 11, 11, 11], 9, 66], ['e07m13', [5, 11, 11, 11], 11, 66], ['e08m11', [6, 10, 9, 2], 14, 0],
  ['e09m16', [11, 11, 11, 11], 14, 2], ['e10m12', [6, 11, 11, 11], 15, 6], ['e11m11', [6, 9, 5, 4], 15, 1423],
  ['e11m11', [5, 11, 11, 11], 15, 1], ['e11m05', [6, 9, 5, 4], 15, 1423], ['e12m18', [2, 10, 11, 11], 16, 0],
  ['e13m05', [2, 10, 11, 11], 19, 0], ['e14m05', [6, 4, 10, 9], 19, 0], ['e15m09', [11, 11, 11, 11], 19, 0],
  ['e16m21', [11, 11, 11, 11], 20, 0], ['e17m03', [6, 11, 11, 11], 21, 1581], ['e18m01', [11, 11, 11, 11], 21, 0],
  ['e19m09', [11, 11, 11, 11], 22, 0], ['e20m12', [11, 11, 11, 11], 24, 0], ['e21m05', [6, 9, 1, 8], 26, 0],
  ['e22m22', [11, 11, 11, 11], 26, 0], ['e23m05', [6, 11, 11, 11], 29, 1037], ['e24m24', [5, 6, 11, 11], 29, 0],
  ['e25cMA', [6, 10, 8, 3], 40, 0],
].map(([mdd, slots, level, lockMask]) => ({ mdd: mdd + '.mdd', slots, level, lockMask }));

// New game: episode 1, default party 10, 2, 5, 8 (save format defaults)
export const DEFAULT_PARTY = [10, 2, 5, 8];

// Resolve the party for an episode: forced slots win; free slots (11) keep the previous choice; 255 = empty.
export function partyForEpisode(ep, previous) {
  const used = new Set();
  const out = ep.slots.map(s => (s !== 11 && s !== 255 ? s : null));
  out.forEach(s => s !== null && used.add(s));
  for (let i = 0; i < 4; i++) {
    if (out[i] !== null || ep.slots[i] === 255) continue;
    const pick = (previous || DEFAULT_PARTY).find(h => h !== 255 && h !== null && !used.has(h) && !(ep.lockMask >> h & 1));
    if (pick !== undefined) { out[i] = pick; used.add(pick); }
  }
  return out.map(s => (s === null ? 255 : s)).filter(s => s !== 255).map(s => HEROES[s]);
}
