import { Font } from '../engine/font.js';

// In-game HUD, positions from docs/specs/ui.md §2 (draw VAs 0x1004b070 / 0x1004b364 / 0x1004c250).
const argb4444 = v => `rgba(${((v >> 8) & 15) * 17},${((v >> 4) & 15) * 17},${(v & 15) * 17},${((v >> 12) & 15) / 15})`;

export class Hud {
  static async load(game) {
    const a = game.assets, h = new Hud();
    h.game = game;
    h.frame = await a.sprite('HUD.spr');
    h.enemyMeter = await a.sprite('enimeter.spr');
    h.fonts = {
      small6: await Font.load(a, 'small_6'),
      small7: await Font.load(a, 'small_7'),
      arial: await Font.load(a, 'Arial_8'),
      dmg9: await Font.load(a, 'damage_9'), dmg10: await Font.load(a, 'damage_10'), dmg11: await Font.load(a, 'damage_11'),
    };
    h.portraits = new Map();
    h.names = await a.text('characters.txt');
    h.numbers = [];          // damage numbers (pool of 16)
    h.enemy = null; h.enemyFlash = 0;
    return h;
  }
  // Display name for a character definition (characters.txt by nameId). The game's table calls the Sentinel units just
  // "Scout" / "Cyborg", and variant models (magmaB, juggyB, civmaleb, illyana01, colossus02...) have no entry, so fall
  // back to the base character's name.
  nameOf(def) {
    if (!def) return '';
    const chars = this.game.assets.characters;
    let name = this.names[def.nameId];
    if (!name) {
      const base = def.key.toLowerCase().replace(/(0\d|[bc])$/, '');
      const alias = { juggy: 'juggernaut', illyana: 'illyana' }[base] || base;
      const b = chars.get(alias);
      name = b && b !== def ? this.names[b.nameId] : '';
      if (!name) name = { illyana: 'Illyana' }[alias] || def.key;
    }
    if (/^sen/i.test(def.key) && !/sentinel/i.test(name)) name = `Sentinel ${name}`;
    return name;
  }
  async portrait(key) {
    if (!this.portraits.has(key)) this.portraits.set(key, await this.game.assets.sprite(key + '.spr'));
    return this.portraits.get(key);
  }
  // damage numbers: red for damage, green for heals; font by remaining life; fixed spot (10,2) for the hero, (165,188) otherwise
  damage(target, amount, heal = false) {
    this.numbers.push({ text: String(amount), heal, hero: target === this.game.player, life: 100, alpha: 255 });
    if (this.numbers.length > 16) this.numbers.shift();
    if (target !== this.game.player && !target.inParty && !heal) { this.enemy = target; this.enemyFlash = 4; }
  }
  update() {
    for (const n of this.numbers) { n.life--; n.alpha -= 8; }
    this.numbers = this.numbers.filter(n => n.alpha > 0);
    if (this.enemyFlash) this.enemyFlash--;
    if (this.enemy && (!this.enemy.alive || !this.game.actors.includes(this.enemy))) this.enemy = null;   // dead, or left behind on another level
  }
  draw(g) {
    const p = this.game.player;
    if (!p) return;
    // HP bar: w = min(hp*52/max, 52), red, (25,11)-(25+w,14); EP bar: w = min(ep*51/max, 51), blue, (30,16)-(30+w,19)
    const hpW = Math.min(Math.floor(p.hp * 52 / Math.max(1, p.maxHP)), 52), epW = Math.min(Math.floor(p.energy * 51 / Math.max(1, p.maxEnergy)), 51);
    g.fillStyle = argb4444(0xff00); g.fillRect(25, 11, hpW, 3);
    g.fillStyle = argb4444(0xf00f); g.fillRect(30, 16, epW, 3);
    const portrait = this.portraits.get(p.key);
    if (portrait === undefined) this.portrait(p.key);
    else if (portrait && portrait.frames[0]) { const f = portrait.frames[0]; g.drawImage(f.canvas, 12 - f.hx, 12 - f.hy); }
    const hud = this.frame && this.frame.frames[0];
    if (hud) g.drawImage(hud.canvas, 0 - hud.hx, 0 - hud.hy);
    const name = p.def ? this.nameOf(p.def) : p.key;
    this.fonts.small6.draw(g, name || '', 47, 1, { align: 'center' });

    // enemy meter bottom-right: w = hp*59/max, right-anchored at 154, y 200-206
    const e = this.enemy;
    if (e && this.enemyMeter) {
      const w = Math.floor(e.hp * 59 / Math.max(1, e.maxHP));
      g.fillStyle = argb4444(0xf600 | 0x0f00); g.fillRect(154 - w, 200, w, 6);
      const f0 = this.enemyMeter.frames[0], f1 = this.enemyMeter.frames[1];
      if (f0) g.drawImage(f0.canvas, 135 - f0.hx, 196 - f0.hy);
      if (f1 && this.enemyFlash) g.drawImage(f1.canvas, 165 - f1.hx, 196 - f1.hy);
      const en = e.def ? this.nameOf(e.def) : e.key;
      this.fonts.arial.draw(g, en || '', 125, 187 - 8, { align: 'center' });
    }
    for (const n of this.numbers) {
      const t = Math.floor(n.life / 9) * 9;
      const font = n.life > 90 ? this.fonts.dmg9 : n.life > 70 ? this.fonts.dmg10 : this.fonts.dmg11;
      const [x, y] = n.hero ? [10, 2 + 30] : [165, 188 - 30];
      font.draw(g, n.text, x, y, { align: n.hero ? 'left' : 'right', color: n.heal ? 'rgb(100,255,100)' : 'rgb(255,100,100)', alpha: n.alpha / 255 });
      void t;
    }
  }
}
