// Save games (layout inspired by the .pdm format, docs/specs/ui.md §5): Autosave + Game1..Game4.
// Stored as JSON in localStorage (per browser).
const KEY = n => `xml-web-save-${n}`;
export const SLOTS = ['Autosave', 'Game1', 'Game2', 'Game3', 'Game4'];

export function snapshot(game) {
  return {
    version: 1,
    time: Date.now(),
    playMs: (game.playMs || 0),
    episode: game.episode ?? null,
    mission: game.missionName,
    spawn: game.lastSpawn || 1,
    lang: game.lang || 'en',
    leader: game.player ? game.player.key : null,
    party: game.party().map(a => ({ key: a.key, level: a.level, xp: a.xp, base: a.base, statPoints: a.statPoints || 0, skillPoints: a.skillPoints || 0, hp: a.hp, energy: a.energy, powerLevels: a.powerLevels || [1, 1, 1, 1], equipment: (a.equipment || []).map(it => (it ? it.code : 0)) })),
    inventory: [...game.inventory.counts.entries()],
    objectives: game.objectiveList || [],
    unlocked: [...(game.unlocked || [])],
    episodeVars: game.episodeVars || {},
    vars: game.missionScript && game.missionScript.saveVars ? game.missionScript.saveVars() : {},
  };
}

export function writeSave(slot, data) {
  try { localStorage.setItem(KEY(slot), JSON.stringify(data)); return true; } catch { return false; }
}
export function readSave(slot) {
  try { const s = localStorage.getItem(KEY(slot)); return s ? JSON.parse(s) : null; } catch { return null; }
}
export function slotLabel(slot) {
  const s = readSave(slot);
  if (!s) return `${SLOTS[slot]}  -----`;
  const secs = Math.floor((s.playMs || 0) / 1000);
  return `${s.mission.replace('.mdd', '')}   ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

export async function restore(game, data) {
  const keys = data.party.map(p => p.key);
  const leader = data.leader && keys.includes(data.leader) ? data.leader : keys[0];
  game.episode = data.episode ?? undefined;
  game.lang = data.lang;
  game.playMs = data.playMs || 0;
  game.objectiveList = data.objectives || [];
  game.inventory.counts = new Map(data.inventory);
  const item = code => (code ? game.assets.items.find(it => it.code === code) || null : null);
  game.actors = [];
  game.heroProgress = new Map(data.party.map(p => [p.key, {
    level: p.level, xp: p.xp, base: p.base, statPoints: p.statPoints || 0, skillPoints: p.skillPoints || 0,
    powerLevels: p.powerLevels || [1, 1, 1, 1], equipment: (p.equipment || [0, 0]).map(item),
  }]));
  game.unlocked = new Set(data.unlocked || []);
  game.episodeVars = data.episodeVars || {};
  game.loading = true;
  await game.loadMission(data.mission, leader, data.spawn || 1, [leader, ...keys.filter(k => k !== leader)], data.vars);
  game.loading = false;
  game.fadeLevel = 1; game.fadeTarget = 0;
}
