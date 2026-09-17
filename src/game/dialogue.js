import { parseDialogue } from '../formats/dlg.js';

// Dialogue box (docs/specs/ui.md §4, VA 0x10049518):
// box (-2,108,180,100) 50% black; speaker small_7 yellow at (4,110); text small_7 white (4,123,168,79), 5 lines;
// portrait <portrait>.spr frame 0 at (142,94) with st_items.spr frame 18 at (140,92); choices list at (16,112,156,92).
const LANGS = { en: '', fr: '_fr', gr: '_gr', it: '_it', sp: '_sp' };

export class Dialogue {
  static async load(game) {
    const d = new Dialogue();
    d.game = game;
    d.files = new Map();
    d.frame = await game.assets.sprite('st_items.spr');
    d.portraits = new Map();
    d.active = null;
    return d;
  }
  async file(name) {
    const lang = LANGS[this.game.lang || 'en'] || '';
    const key = (name.replace(/\.dlg$/i, '') + lang + '.dlg').toLowerCase();
    if (!this.files.has(key)) this.files.set(key, this.game.assets.has(key) ? parseDialogue(await this.game.assets.bytes(key)) : null);
    return this.files.get(key);
  }
  async portrait(name) {
    if (!name) return null;
    if (!this.portraits.has(name)) this.portraits.set(name, await this.game.assets.sprite(name + '.spr'));
    return this.portraits.get(name);
  }
  // start a conversation; resolves with the end result code
  async start(fileName, label) {
    const gen = this.game.loadGen;
    const dlg = await this.file(fileName);
    if (gen !== this.game.loadGen) return new Promise(() => {});   // the level changed while loading
    if (!dlg) return -1;
    const start = dlg.labels.get(label.toLowerCase());
    if (start === undefined) return -1;
    return new Promise(resolve => {
      this.active = { dlg, node: start, resolve, page: 0, choice: 0 };
      this.enter(start);
    });
  }
  async enter(index) {
    const a = this.active, dlg = a.dlg, n = dlg.nodes[index];
    if (!n) return this.finish(0);
    a.node = index; a.page = 0; a.choice = 0;
    if (n.kind === 2) {                               // goto label
      const target = dlg.labels.get(n.jump.toLowerCase());
      return target === undefined ? this.finish(0) : this.enter(target);
    }
    if (n.kind === 3) return this.finish(n.result);
    if (n.kind === 1) {                               // a choice list is the sibling chain starting here
      a.choices = [];
      for (let c = index; c !== -1 && dlg.nodes[c]; c = dlg.nodes[c].sibling) a.choices.push(c);
      a.lines = null;
      return;
    }
    // spoken line: "(Player)" is replaced by the leader's name/portrait
    const leader = this.game.player;
    const isPlayer = n.speaker === '(Player)';
    a.speaker = isPlayer ? (this.game.hud && leader.def ? this.game.hud.names[leader.def.nameId] : leader.key) : n.speaker;
    a.portraitSprite = await this.portrait(isPlayer ? leader.key : n.portrait);
    a.lines = this.game.hud.fonts.small7.wrap(n.text, 168);
    a.choices = null;
    this.game.voice.play(n.voice);
  }
  finish(result) {
    const a = this.active;
    this.active = null;
    this.game.voice.stop();
    if (a) a.resolve(result);
  }
  update(input) {
    const a = this.active;
    if (!a) return;
    const n = a.dlg.nodes[a.node];
    if (a.choices) {
      if (input.wasPressed('up')) a.choice = (a.choice + a.choices.length - 1) % a.choices.length;
      if (input.wasPressed('down')) a.choice = (a.choice + 1) % a.choices.length;
      if (input.wasPressed('attack') || input.wasPressed('menu')) {
        const picked = a.dlg.nodes[a.choices[a.choice]];
        this.enter(picked.child);
      }
      return;
    }
    if (!a.lines) return;                             // line still loading its portrait
    if (input.wasPressed('attack') || input.wasPressed('menu')) {
      if ((a.page + 1) * 5 < a.lines.length) { a.page++; return; }
      this.advance(n);
    }
  }
  advance(n) {
    if (n.child !== -1) return this.enter(n.child);
    if (n.sibling !== -1) return this.enter(n.sibling);
    return this.finish(0);
  }
  draw(g) {
    const a = this.active;
    if (!a) return;
    const f7 = this.game.hud.fonts.small7;
    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.fillRect(-2, 108, 180, 100);
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.strokeRect(-1.5, 108.5, 179, 99);
    if (a.choices) {
      a.choices.forEach((c, i) => {
        const y = 116 + i * 14;
        if (i === a.choice) { g.fillStyle = 'rgba(0,0,136,0.9)'; g.fillRect(12, y - 2, 156, 13); }
        f7.draw(g, a.dlg.nodes[c].text, 16, y);
      });
      return;
    }
    const pf = a.portraitSprite && a.portraitSprite.frames[0];
    const frame = this.frame && this.frame.frames[18];
    if (pf) g.drawImage(pf.canvas, 142 - pf.hx, 94 - pf.hy);
    if (frame) g.drawImage(frame.canvas, 140 - frame.hx, 92 - frame.hy);
    f7.draw(g, a.speaker || '', 4, 110, { color: '#ffff00' });
    (a.lines || []).slice(a.page * 5, a.page * 5 + 5).forEach((line, i) => f7.draw(g, line, 4, 127 + i * (f7.height + 3)));
  }
}
