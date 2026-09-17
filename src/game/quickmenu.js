// Hold-to-show four-way pie menu (docs/specs/ui.md; widget VA 0x100c1194 / input 0x100c136c).
// Background centred at (88,104); slot offsets 0 up (2,-39), 1 right (42,1), 2 down (2,41), 3 left (-38,1). Disabled slots are dimmed.
const OFFSETS = [[2, -39], [42, 1], [2, 41], [-38, 1]];
const DIR_KEYS = ['up', 'right', 'down', 'left'];

export class QuickMenu {
  static async load(game) {
    const q = new QuickMenu();
    q.game = game;
    q.pie = await game.assets.sprite('xpie.spr');
    q.pickups = await game.assets.sprite('Pickups.spr');
    q.mode = null;
    return q;
  }
  get active() { return this.mode !== null; }
  slotsFor(mode) {
    const g = this.game, p = g.player;
    if (mode === 'specials') {
      // Special Abilities: slots from the hero's powers; icon frames 7,6,5,8 of <hero>.spr (VA 0x10030494)
      const powers = p.def ? p.def.powers : [];
      return [0, 1, 2, 3].map(i => {
        const avail = p.powers().find(x => x.i === i);
        return { label: avail ? g.itemName(avail.item) : '', icon: [7, 6, 5, 8][i], sprite: 'hero',
          enabled: !!avail && avail.item.cost <= p.energy && powers[i].unlock <= p.level,
          use: () => { p.selectedPower = p.powers().indexOf(avail); p.startPower(avail, p.nearestEnemy(Math.max(avail.item.range, 300))); } };
      });
    }
    if (mode === 'items') {
      const inv = g.inventory.list(g.assets.items).filter(e => e.item.cls & 8);   // consumables
      return [0, 1, 2, 3].map(i => {
        const e = inv[i];
        return { label: e ? `${g.itemName(e.item)} x${e.count}` : '', icon: e ? e.item.icon : null, sprite: 'items', enabled: !!e,
          use: () => this.useItem(e.item) };
      });
    }
    return [];
  }
  useItem(item) {
    const g = this.game;
    const downed = g.party().find(a => !a.alive);
    if ((item.cls & 4) && !downed) { g.notify('No one to revive', 40); return; }
    if (!g.inventory.remove(item)) return;
    if (item.cls & 4) { downed.revive(0.5); g.notify(g.itemName(item), 40); return; }
    const p = g.player;
    if (item.healTick > 0) p.hp = Math.min(p.maxHP, p.hp + item.healTick);
    if (item.energyTick > 0) p.energy = Math.min(p.maxEnergy, p.energy + item.energyTick);
    if (item.cure) for (const [name, bit] of Object.entries({ charm: 1, blind: 2, stun: 4, sleep: 8, confuse: 16, freeze: 32, burn: 64, poison: 128 })) if (item.cure & bit) p.statusTimers[name] = 0;
    if (item.duration > 0 && item.stats.some(Boolean)) p.addEffect(item, p);
    g.notify(g.itemName(item), 40);
  }
  update(input) {
    const held = ['specials', 'items'].find(k => input.isDown(k));
    if (!held) { this.mode = null; return false; }
    this.mode = held;
    const slots = this.slotsFor(held);
    for (let i = 0; i < 4; i++) {
      if (input.wasPressed(DIR_KEYS[i]) && slots[i] && slots[i].enabled) { slots[i].use(); this.mode = null; input.down.delete(held); break; }
    }
    return true;
  }
  draw(g) {
    if (!this.mode) return;
    const slots = this.slotsFor(this.mode), game = this.game;
    const bg = this.pie && this.pie.frames[0];
    if (bg) g.drawImage(bg.canvas, 88 - bg.hx, 104 - bg.hy);
    const heroSprite = game.hud.portraits.get(game.player.key);
    slots.forEach((s, i) => {
      const sheet = s.sprite === 'hero' ? heroSprite : game.itemIcons;
      const f = sheet && s.icon !== null && sheet.frames[s.icon];
      const [ox, oy] = OFFSETS[i];
      if (f) {
        g.save();
        if (!s.enabled) g.globalAlpha = 0.45;
        g.drawImage(f.canvas, 88 + ox - f.hx, 104 + oy - f.hy);
        g.restore();
      }
    });
    const title = this.mode === 'specials' ? game.hud.fonts.arial : game.hud.fonts.arial;
    title.draw(g, this.mode === 'specials' ? 'Special Abilities' : 'Item Select', 88, 40, { align: 'center' });
  }
}
