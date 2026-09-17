import { SLOTS, snapshot, writeSave, readSave, slotLabel, restore } from './save.js';
import { STR, SPEED, BODY, FOCUS } from './combat.js';
import { availablePowers, powerItem } from './powers.js';
import { EPISODES, HEROES } from './progression.js';
import { settings, setVolume } from '../audio/audio.js';

// Pause menu and sub-screens (docs/specs/ui.md §3): Resume, Team, Stats, Skills, Equip, Save, Load, Options, Quit.
// Stats (StatMenu VA 0x1003f178): 1 point per +1 while stat < cap*10. Skills (0x1001034c): 1 skill point per level, max level 3,
// requires the slot's unlock level. Equip: slot 1 weapon gem / slot 2 armor gem from the party inventory.
export class PauseMenu {
  static async load(game) {
    const m = new PauseMenu();
    m.game = game;
    m.bg = await game.assets.sprite('pausemenu.spr');
    m.selector = await game.assets.sprite('selector.spr');
    m.statscr = await game.assets.sprite('statscr.spr');
    m.screen = null; m.cursor = 0; m.heroIndex = 0;
    return m;
  }
  get active() { return this.screen !== null; }
  open() { this.screen = 'main'; this.cursor = 0; this.game.sfx.menu('accept'); }
  close() { this.screen = null; this.fromHotkey = false; }
  go(screen) { this.screen = screen; this.cursor = 0; }
  fonts() { return this.game.frontend ? this.game.frontend.fonts : this.game.hud.fonts; }
  hero() { const party = this.game.party(); return party[this.heroIndex % Math.max(1, party.length)] || this.game.player; }
  heroName(h) { return h.def ? this.game.hud.names[h.def.nameId] || h.key : h.key; }

  // --- list screens -----------------------------------------------------------------------------------------
  items() {
    const g = this.game, h = this.hero();
    switch (this.screen) {
      case 'main': return [
        { label: 'Resume', go: () => this.close() },
        { label: 'Team', go: () => this.go('team') },
        { label: 'Stats', go: () => this.go('stats') },
        { label: 'Skills', go: () => this.go('skills') },
        { label: 'Equip', go: () => this.go('equip') },
        { label: 'Save', go: () => this.go('save') },
        { label: 'Load', go: () => this.go('load') },
        { label: 'Options', go: () => this.go('options') },
        { label: 'Quit', go: () => { this.close(); if (g.frontend) { g.frontend.screen = 'main'; g.frontend.stack = []; } else location.reload(); } },
      ];
      case 'save': return SLOTS.slice(1).map((_, i) => ({ label: slotLabel(i + 1), go: () => { writeSave(i + 1, snapshot(g)); g.notify('Saved', 50); this.close(); } }));
      case 'load': return SLOTS.map((_, i) => ({ label: slotLabel(i), go: async () => { const d = readSave(i); if (!d) return; this.close(); await restore(g, d); } }));
      case 'skills': return h.def ? h.def.powers.map((slot, i) => {
        const lvl = (h.powerLevels || [1, 1, 1, 1])[i] || 1, item = slot.unlock === 99 ? null : powerItem(g, slot, lvl);
        if (!item) return { label: '-----', go: () => {} };
        const locked = slot.unlock > h.level;
        return { label: `${g.itemName(item)} ${locked ? `(Lv ${slot.unlock})` : '*'.repeat(lvl)}`, go: () => this.levelPower(h, i) };
      }) : [];
      case 'equip': return [0, 1].map(slot => {
        const cur = (h.equipment || [])[slot];
        return { label: `${slot === 0 ? 'Weapon' : 'Armor'}: ${cur ? g.itemName(cur) : '-----'}`, go: () => { this.equipSlot = slot; this.go('equipList'); } };
      });
      case 'equipList': {
        const slot = this.equipSlot, list = g.inventory.list(g.assets.items).filter(e => e.item.slot === slot + 1);
        return [{ label: '(none)', go: () => { this.unequip(h, slot); this.go('equip'); } },
          ...list.map(e => ({ label: `${g.itemName(e.item)} x${e.count}`, go: () => { this.unequip(h, slot); g.inventory.remove(e.item); h.equip(slot, e.item); this.go('equip'); } }))];
      }
      case 'team': return this.teamItems();
      case 'teamPick': return this.teamPickItems();
      case 'options': return ['music', 'sfx', 'voice'].map(k => ({
        label: `${k === 'sfx' ? 'Sound' : k[0].toUpperCase() + k.slice(1)}: ${'|'.repeat(Math.round(settings[k] * 10)).padEnd(10, '.')}`, adjust: d => setVolume(k, settings[k] + d * 0.1), go: () => {},
      }));
    }
    return [];
  }
  unequip(h, slot) {
    const cur = (h.equipment || [])[slot];
    if (cur) this.game.inventory.add(cur);
    h.equip(slot, null);
  }
  levelPower(h, i) {
    const slot = h.def.powers[i], lvl = (h.powerLevels ||= [1, 1, 1, 1])[i] || 1;
    if (slot.unlock === 99 || slot.unlock > h.level) { this.game.notify('Locked', 30); return; }
    if ((h.skillPoints || 0) <= 0) { this.game.notify('No skill points', 30); return; }
    if (lvl >= 3 || !powerItem(this.game, slot, lvl + 1)) { this.game.notify('Max level', 30); return; }
    h.skillPoints--; h.powerLevels[i] = lvl + 1;
    this.game.sfx.levelUp();
  }
  // Team: party slots; free-choice slots (11 in the episode table) can be swapped for unlocked heroes
  teamItems() {
    const g = this.game, ep = EPISODES[g.currentEpisode()] || null;
    return g.partyKeys.map((key, i) => {
      const forced = ep && ep.slots[i] !== 11 && ep.slots[i] !== 255;
      const def = g.assets.characters.get(key);
      return { label: `${def ? g.hud.names[def.nameId] : key}${forced ? ' (required)' : ''}`, go: () => { if (forced) { g.notify('Required for this mission', 40); return; } this.teamSlot = i; this.go('teamPick'); } };
    });
  }
  teamPickItems() {
    const g = this.game, ep = EPISODES[g.currentEpisode()] || null;
    const unlocked = new Set([...(g.unlocked || []), ...g.partyKeys]);
    return HEROES.filter(k => unlocked.has(k) && !g.partyKeys.includes(k) && !(ep && ep.lockMask >> HEROES.indexOf(k) & 1))
      .map(k => ({ label: g.hud.names[g.assets.characters.get(k).nameId] || k, go: () => this.swapHero(this.teamSlot, k) }));
  }
  async swapHero(slot, key) {
    const g = this.game;
    this.close();
    await g.swapPartyMember(g.partyKeys[slot], key);
  }

  update(input) {
    const g = this.game;
    if (!this.screen) { if ((input.wasPressed('menu') || input.wasPressed('back')) && g.playerControl && !(g.overlays && g.overlays.active)) this.open(); return false; }
    if (this.screen === 'stats') { this.updateStats(input); return true; }
    const items = this.items();
    const party = g.party();
    if (['skills', 'equip', 'stats'].includes(this.screen) && party.length) {
      if (input.wasPressed('left')) { this.heroIndex = (this.heroIndex + party.length - 1) % party.length; g.sfx.menu('scroll'); }
      if (input.wasPressed('right')) { this.heroIndex = (this.heroIndex + 1) % party.length; g.sfx.menu('scroll'); }
    }
    if (this.screen === 'options') {
      const it = items[this.cursor];
      if (input.wasPressed('left')) { it.adjust(-1); g.sfx.menu('scroll'); }
      if (input.wasPressed('right')) { it.adjust(1); g.sfx.menu('scroll'); }
    }
    if (items.length) {
      if (input.wasPressed('up')) { this.cursor = (this.cursor + items.length - 1) % items.length; g.sfx.menu('scroll'); }
      if (input.wasPressed('down')) { this.cursor = (this.cursor + 1) % items.length; g.sfx.menu('scroll'); }
      this.cursor = Math.min(this.cursor, items.length - 1);
      if (input.wasPressed('attack')) { const it = items[this.cursor]; if (it) { g.sfx.menu('accept'); it.go(); } }
    }
    if (input.wasPressed('back') || input.wasPressed('menu')) {
      g.sfx.menu('back');
      if (this.screen === 'main') this.close();
      else if (this.screen === 'equipList') this.go('equip');
      else if (this.screen === 'teamPick') this.go('team');
      else this.go('main');
    }
    return true;
  }
  updateStats(input) {
    const g = this.game, party = g.party(), h = this.hero();
    if (input.wasPressed('left')) this.heroIndex = (this.heroIndex + party.length - 1) % party.length;
    if (input.wasPressed('right')) this.heroIndex = (this.heroIndex + 1) % party.length;
    if (input.wasPressed('up')) this.cursor = (this.cursor + 3) % 4;
    if (input.wasPressed('down')) this.cursor = (this.cursor + 1) % 4;
    if (input.wasPressed('attack')) {
      const stat = [STR, SPEED, BODY, FOCUS][this.cursor];
      const cap = (h.def ? h.def.caps[stat] : 10) * 10;
      if ((h.statPoints || 0) > 0 && h.base[stat] < cap) {
        h.statPoints--; h.base[stat]++;
        const oldHP = h.maxHP, oldEP = h.maxEnergy;
        h.recalcBonuses();
        h.hp += h.maxHP - oldHP; h.energy += h.maxEnergy - oldEP;
        g.sfx.menu('accept');
      }
    }
    if (input.wasPressed('back') || input.wasPressed('menu')) { g.sfx.menu('back'); if (this.fromHotkey) this.close(); else this.go('main'); }
  }

  draw(g) {
    if (!this.screen) return;
    const F = this.fonts();
    if (this.screen === 'stats') return this.drawStats(g, F);
    const bg = this.bg && this.bg.frames[0];
    if (bg) g.drawImage(bg.canvas, 0, 0); else { g.fillStyle = 'rgba(0,0,0,0.8)'; g.fillRect(0, 0, 176, 208); }
    const items = this.items(), h = this.hero();
    const titles = { skills: `${this.heroName(h)}  SP ${h.skillPoints || 0}`, equip: this.heroName(h), equipList: 'Choose item', team: 'Team', teamPick: 'Choose hero', options: 'Options  (< >)' };
    if (titles[this.screen]) F.arial.draw(g, titles[this.screen], 88, 30, { align: 'center' });
    const top = Math.max(0, Math.min(this.cursor - 3, items.length - 7));
    items.slice(top, top + 7).forEach((it, k) => {
      const i = top + k, row = this.selector && this.selector.frames[i === this.cursor ? 0 : 1];
      if (row) g.drawImage(row.canvas, 0, 49 + 21 * k);
      (this.screen === 'main' ? F.menu || F.arial : F.small7).draw(g, it.label, 9, 53 + 21 * k);
    });
    if (['skills', 'equip'].includes(this.screen)) F.arial.draw(g, '< hero >', 88, 196, { align: 'center' });
  }
  drawStats(g, F) {
    const h = this.hero();
    const bg = this.statscr && this.statscr.frames[0];
    if (bg) g.drawImage(bg.canvas, 0, 0); else { g.fillStyle = '#012'; g.fillRect(0, 0, 176, 208); }
    const f = F.small7;
    f.draw(g, `${this.heroName(h)}  Lv ${h.level}`, 125, 12, { align: 'center' });
    f.draw(g, `${h.statPoints || 0}   Points`, 6, 28);
    const labels = ['Strength', 'Speed', 'Body', 'Intelligence'], idx = [STR, SPEED, BODY, FOCUS];
    labels.forEach((l, i) => {
      if (i === this.cursor) { g.fillStyle = 'rgba(0,60,190,0.8)'; g.fillRect(4, 13 * (i + 2) + 27, 118, 12); }
      f.draw(g, `${l}:${h.stat(idx[i])} (${h.bonus[idx[i]] >= 0 ? '+' : ''}${h.bonus[idx[i]]})`, 6, 13 * (i + 2) + 28);
    });
    f.draw(g, `HP:${h.hp}/${h.maxHP}`, 6, 13 * 7 + 28);
    f.draw(g, `EP:${h.energy}/${h.maxEnergy}`, 6, 13 * 8 + 28);
    f.draw(g, `XP:${h.xp}`, 6, 13 * 9 + 28);
    F.arial.draw(g, '< hero >   5: +1', 88, 196, { align: 'center' });
  }
}
