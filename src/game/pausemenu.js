import { SLOTS, snapshot, writeSave, readSave, slotLabel, restore } from './save.js';
import { maxHP, maxEnergy, STR, SPEED, BODY, FOCUS } from './combat.js';

// Pause menu and sub-screens (docs/specs/ui.md §3): Resume, Save, Load, Stats, Quit.
// Stats screen rules (StatMenu, VA 0x1003f178): spend 1 point per +1 while stat < cap*10; Body/Focus raise HP/EP.
export class PauseMenu {
  static async load(game) {
    const m = new PauseMenu();
    m.game = game;
    m.bg = await game.assets.sprite('pausemenu.spr');
    m.selector = await game.assets.sprite('selector.spr');
    m.statscr = await game.assets.sprite('statscr.spr');
    m.screen = null; m.cursor = 0;
    return m;
  }
  get active() { return this.screen !== null; }
  open() { this.screen = 'main'; this.cursor = 0; }
  close() { this.screen = null; }
  fonts() { return this.game.frontend ? this.game.frontend.fonts : this.game.hud.fonts; }
  items() {
    const g = this.game;
    if (this.screen === 'main') return [
      { label: 'Resume', go: () => this.close() },
      { label: 'Save', go: () => { this.screen = 'save'; this.cursor = 0; } },
      { label: 'Load', go: () => { this.screen = 'load'; this.cursor = 0; } },
      { label: 'Stats', go: () => { this.screen = 'stats'; this.cursor = 0; this.hero = g.player; } },
      { label: 'Quit', go: () => { this.close(); if (g.frontend) { g.frontend.screen = 'main'; } } },
    ];
    if (this.screen === 'save') return SLOTS.slice(1).map((_, i) => ({ label: slotLabel(i + 1), go: () => { writeSave(i + 1, snapshot(g)); g.notify('Saved', 50); this.close(); } }));
    if (this.screen === 'load') return SLOTS.map((_, i) => ({ label: slotLabel(i), go: async () => { const d = readSave(i); if (!d) return; this.close(); await restore(g, d); } }));
    return [];
  }
  update(input) {
    if (!this.screen) { if (input.wasPressed('menu') && this.game.playerControl) this.open(); return false; }
    if (this.screen === 'stats') return this.updateStats(input), true;
    const items = this.items();
    if (input.wasPressed('up')) this.cursor = (this.cursor + items.length - 1) % items.length;
    if (input.wasPressed('down')) this.cursor = (this.cursor + 1) % items.length;
    if (input.wasPressed('attack')) { const it = items[this.cursor]; if (it) it.go(); }
    if (input.wasPressed('back') || input.wasPressed('menu')) { if (this.screen === 'main') this.close(); else { this.screen = 'main'; this.cursor = 0; } }
    return true;
  }
  updateStats(input) {
    const party = this.game.party();
    const h = this.hero || this.game.player;
    if (input.wasPressed('left')) this.hero = party[(party.indexOf(h) + party.length - 1) % party.length];
    if (input.wasPressed('right')) this.hero = party[(party.indexOf(h) + 1) % party.length];
    if (input.wasPressed('up')) this.cursor = (this.cursor + 3) % 4;
    if (input.wasPressed('down')) this.cursor = (this.cursor + 1) % 4;
    if (input.wasPressed('attack')) {
      const stat = [STR, SPEED, BODY, FOCUS][this.cursor];
      const cap = (h.def ? h.def.caps[stat] : 10) * 10;
      if ((h.statPoints || 0) > 0 && h.base[stat] < cap) {
        h.statPoints--; h.base[stat]++;
        const oldHP = h.maxHP, oldEP = h.maxEnergy;
        h.maxHP = maxHP(h); h.maxEnergy = maxEnergy(h);
        h.hp += h.maxHP - oldHP; h.energy += h.maxEnergy - oldEP;
      }
    }
    if (input.wasPressed('back') || input.wasPressed('menu')) { this.screen = 'main'; this.cursor = 3; }
  }
  draw(g) {
    if (!this.screen) return;
    const F = this.fonts();
    if (this.screen === 'stats') return this.drawStats(g, F);
    const bg = this.bg && this.bg.frames[0];
    if (bg) g.drawImage(bg.canvas, 0, 0); else { g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(0, 0, 176, 208); }
    const items = this.items();
    items.forEach((it, i) => {
      const row = this.selector && this.selector.frames[i === this.cursor ? 0 : 1];
      if (row) g.drawImage(row.canvas, 0, 49 + 21 * i);
      F.menu ? F.menu.draw(g, it.label, 9, 53 + 21 * i) : F.arial.draw(g, it.label, 9, 53 + 21 * i);
    });
  }
  drawStats(g, F) {
    const h = this.hero || this.game.player, names = this.game.hud.names;
    const bg = this.statscr && this.statscr.frames[0];
    if (bg) g.drawImage(bg.canvas, 0, 0); else { g.fillStyle = '#012'; g.fillRect(0, 0, 176, 208); }
    const f = F.small7;
    f.draw(g, (h.def ? names[h.def.nameId] : h.key) + `  Lv ${h.level}`, 125, 12, { align: 'center' });
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
