import { BaseMission, registerMission } from './index.js';
import { EVT } from '../script.js';

const zones = (script, ...prefixes) => script.rt.zones.map(z => z.rec.name).filter(n => prefixes.some(p => n.toLowerCase().startsWith(p.toLowerCase())));
const once = (script, key) => (script[key] ? false : (script[key] = true));
const onEnter = (script, names, fn) => script.rt.on(names, e => { if (e.code === EVT.ENTER) fn(e); });

// Danger Room tutorial (pseudo tutorial): combat, switching heroes, barriers, items, specials, exit.
// Objectives: 48 select program, 50 next room, 51/52 training dummies, 53 breakable wall, 54 forcefield,
// 55 pick up item, 56 use item, 57/58 specials, 59/60 switching heroes.
export class Tutorial extends BaseMission {
  init() {
    super.init();
    for (const a of this.game.party()) a.unkillable = true;
    for (const n of ['brawler1', 'brawler2', 'brawler3', 'brawler4']) this.setNeutral(n);
    this.setAlly('cyclops');
    const g = this.game;

    // combat room: two dummies
    onEnter(this, zones(this, 'court', 'tut1'), async () => {
      if (!once(this, 'battle')) return;
      await this.dialogue('tutorial', 'battle');
      await this.objective(51, 0); await this.objective(52, 0);
      this.setEnemy('brawler1'); this.setEnemy('brawler2');
    });
    this.dummies = new Set();
    this.rt.on(['brawler1', 'brawler2'], async e => {
      if (e.code !== EVT.DEFEATED) return;
      this.dummies.add(e.subject.toLowerCase());
      await this.objective(this.dummies.size === 1 ? 51 : 52, 2);
      if (this.dummies.size === 2 && once(this, 'battleDone')) await this.dialogue('tutorial', 'battleconcluded');
    });

    // switching heroes: switch doors open only for the right leader
    onEnter(this, zones(this, 'tut2'), async () => {
      if (!once(this, 'switching')) return;
      await this.dialogue('tutorial', 'switchingcharacters');
      await this.objective(59, 0);
    });
    onEnter(this, zones(this, 'switchdoor'), async () => {
      if (g.player.key !== 'cyclops') { if (once(this, 'switchHint')) await this.dialogue('tutorial', 'switchfail2'); return; }
      if (!once(this, 'switch1')) return;
      g.level.openDoorsNear(g.player.x, g.player.y);
      await this.objective(59, 2); await this.objective(60, 0);
      await this.dialogue('tutorial', 'switch3');
    });
    onEnter(this, zones(this, 'switchbackdoor'), async () => {
      if (g.player.key !== 'wolverine' || !this.switch1 || !once(this, 'switch2')) return;
      g.level.openDoorsNear(g.player.x, g.player.y);
      await this.objective(60, 2);
      await this.dialogue('tutorial', 'switch4');
    });

    // barriers: breakable wall, then forcefield
    onEnter(this, zones(this, 'tut3', 'barrierroom'), async () => {
      if (!once(this, 'barriers')) return;
      await this.dialogue('tutorial', 'Barriers');
      await this.objective(53, 0);
    });
    this.rt.on('map', async e => {
      if (e.code !== EVT.WALL || !once(this, 'wallDone')) return;
      await this.objective(53, 2); await this.objective(54, 0);
    });
    this.rt.on(zones(this, 'forcefield'), async e => {
      if (e.code === EVT.ENTER && !this.fieldDone) g.notify('[5]', 25);
      if (e.code !== EVT.ACTION || !once(this, 'fieldDone')) return;
      for (const n of zones(this, 'forcefield')) this.rt.disableZone(n);
      g.level.openDoorsNear(g.player.x, g.player.y, 400);
      await this.objective(54, 2);
      await this.dialogue('tutorial', 'barriersfinal');
    });

    // items: pick up and use
    onEnter(this, zones(this, 'tut4'), async () => {
      if (!once(this, 'items')) return;
      await this.dialogue('tutorial', 'Items');
      await this.objective(55, 0);
      const med = g.assets.items.find(i => /small med pack/i.test(i.name));
      if (med && g.pickups) g.pickups.spawn(med, g.player.x + 150, g.player.y + 150);
    });
    for (const hero of ['wolverine', 'cyclops']) this.rt.on(hero, async e => {
      if (e.code !== EVT.PICKUP || !this.items || !once(this, 'pickedUp')) return;
      await this.objective(55, 2); await this.objective(56, 0);
      g.player.hp = Math.max(1, Math.floor(g.player.maxHP / 2));
    });

    // specials room: defeat the last dummies
    onEnter(this, zones(this, 'tut5', 'specialroom'), async () => {
      if (!once(this, 'specials')) return;
      if (this.pickedUp) await this.objective(56, 2);
      await this.objective(57, 0); await this.objective(58, 0);
      this.setEnemy('brawler3'); this.setEnemy('brawler4');
    });
    this.rt.on(['brawler3', 'brawler4'], async e => {
      if (e.code !== EVT.DEFEATED) return;
      await this.objective(e.subject.toLowerCase() === 'brawler3' ? 57 : 58, 2);
    });

    // exit back to the main menu
    this.rt.on(zones(this, 'exit'), async e => {
      if (e.code === EVT.ENTER) g.notify('[5]', 25);
      if (e.code !== EVT.ACTION || !once(this, 'leaving')) return;
      await this.dialogue('tutorial', 'exittutorial');
      await this.fadeOut();
      if (g.frontend) { g.frontend.screen = 'main'; g.frontend.stack = []; } else location.reload();
    });
  }
  async start() {
    if (!once(this, 'started')) return;
    await this.dialogue('tutorial', 'introreturn');
    await this.objective(48, 0);
  }
}

registerMission('tutorial', Tutorial);
