import { Font } from '../engine/font.js';
import { EPISODES, DEFAULT_PARTY, HEROES, partyForEpisode } from './progression.js';
import { SLOTS, readSave, slotLabel, restore } from './save.js';

// Front end (docs/specs/ui.md §1): title screen, generic list menus.
// List menu: background at (0,0); selector.spr frame 1 per row at (0, 49+21*i), frame 0 highlight; items menu.fnt x=9, pitch 21, 7 visible;
// soft key labels in Arial_8: "Select" at (3, 209-h), "Back" right-aligned at 173.
export class FrontEnd {
  static async load(game) {
    const f = new FrontEnd(), a = game.assets;
    f.game = game;
    f.title = await a.sprite('title.spr');
    f.bg = await a.sprite('mainmenu.spr');
    f.selector = await a.sprite('selector.spr');
    f.fonts = { menu: await Font.load(a, 'menu'), small6: await Font.load(a, 'small_6'), small7: await Font.load(a, 'small_7'), arial: await Font.load(a, 'Arial_8') };
    f.text = await a.text('menus.txt');
    f.screen = 'title';
    f.cursor = 0; f.scroll = 0; f.hl = 49; f.tick = 0;
    f.stack = [];
    return f;
  }
  t(index, fallback) { return (this.text && this.text[index]) || fallback; }
  menus() {
    return {
      main: [
        { label: this.t(0, 'Single-Player'), go: () => this.open('single') },
        { label: 'Tutorial', go: () => this.startMission('tutorial.mdd', 0) },
        { label: this.t(3, 'Options'), go: () => this.open('options') },
      ],
      single: [
        { label: 'New Game', go: async () => { this.screen = 'loading'; await this.game.playMovie('mv_01'); this.startMission(EPISODES[1].mdd, 1); } },
        { label: 'Load', go: () => this.open('load') },
        { label: 'Level Select', go: () => this.open('levels') },
      ],
      load: SLOTS.map((_, i) => ({ label: slotLabel(i), go: async () => { const d = readSave(i); if (!d) return; this.screen = 'loading'; await restore(this.game, d); this.screen = null; } })),
      levels: this.game.assets.pkg.list('.mdd').sort().map(name => ({ label: name.replace('.mdd', ''), go: () => this.startMission(name, EPISODES.findIndex(e => e.mdd.toLowerCase() === name.toLowerCase())) })),
      options: [
        { label: 'Language: ' + (this.game.lang || 'en'), go: () => { const langs = ['en', 'fr', 'gr', 'it', 'sp']; this.game.lang = langs[(langs.indexOf(this.game.lang || 'en') + 1) % langs.length]; } },
      ],
    };
  }
  open(name) { this.stack.push([this.screen, this.cursor, this.scroll]); this.screen = name; this.cursor = 0; this.scroll = 0; }
  back() { const s = this.stack.pop(); if (s) [this.screen, this.cursor, this.scroll] = s; else this.screen = 'title'; }
  async startMission(mdd, episodeIndex) {
    this.screen = 'loading';
    const ep = EPISODES[episodeIndex];
    const party = ep ? partyForEpisode(ep, DEFAULT_PARTY) : [HEROES[10], HEROES[2], HEROES[5], HEROES[8]];
    this.game.episode = episodeIndex >= 0 ? episodeIndex : undefined;
    this.game.loading = true;
    await this.game.loadMission(mdd, party[0], 1, party);
    this.game.loading = false;
    this.game.fadeLevel = 1; this.game.fadeTarget = 0;
    this.screen = null;
  }
  get active() { return this.screen !== null; }
  update(input) {
    this.tick++;
    if (this.screen === 'title') {
      if (input.pressed.size) this.screen = 'main';
      return;
    }
    if (this.screen === 'loading') return;
    const items = this.menus()[this.screen] || [];
    if (input.wasPressed('up')) this.cursor = (this.cursor + items.length - 1) % items.length;
    if (input.wasPressed('down')) this.cursor = (this.cursor + 1) % items.length;
    if (this.cursor < this.scroll) this.scroll = this.cursor;
    if (this.cursor >= this.scroll + 7) this.scroll = this.cursor - 6;
    if (input.wasPressed('attack') || input.wasPressed('menu')) { const it = items[this.cursor]; if (it) it.go(); }
    if (input.wasPressed('back')) this.back();
  }
  draw(g) {
    g.fillStyle = '#000';
    g.fillRect(0, 0, 176, 208);
    if (this.screen === 'title') {
      const f = this.title && this.title.frames[0];
      if (f) g.drawImage(f.canvas, Math.round((176 - f.w) / 2), Math.round((208 - f.h) / 4));
      if ((this.tick >> 4) & 1) this.fonts.small7.draw(g, this.t(157, 'Press any key to continue'), 88, 146, { align: 'center' });
      return;
    }
    if (this.screen === 'loading') { this.fonts.menu.draw(g, 'Loading…', 88, 96, { align: 'center' }); return; }
    const bg = this.bg && this.bg.frames[(this.tick >> 1) % Math.max(1, this.bg.frames.length)];
    if (bg) g.drawImage(bg.canvas, 0, 0);
    const items = this.menus()[this.screen] || [];
    const targetY = 49 + 21 * (this.cursor - this.scroll);
    this.hl += (targetY - this.hl) * 0.35;
    const row = this.selector && this.selector.frames[1], hi = this.selector && this.selector.frames[0];
    items.slice(this.scroll, this.scroll + 7).forEach((it, i) => {
      if (row) g.drawImage(row.canvas, 0, 49 + 21 * i);
    });
    if (hi) g.drawImage(hi.canvas, 0, Math.round(this.hl));
    items.slice(this.scroll, this.scroll + 7).forEach((it, i) => this.fonts.menu.draw(g, it.label, 9, 49 + 21 * i + 4));
    const sel = this.t(107, 'Select'), back = this.t(108, 'Back');
    this.fonts.arial.draw(g, sel, 3, 209 - this.fonts.arial.height - 2);
    this.fonts.arial.draw(g, back, 173 - this.fonts.arial.width(back), 209 - this.fonts.arial.height - 2);
  }
}
