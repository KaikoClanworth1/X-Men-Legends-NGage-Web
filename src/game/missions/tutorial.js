import { BaseMission, registerMission } from './index.js';
import { EVT } from '../script.js';

const once = (script, key) => (script[key] ? false : (script[key] = true));

// Danger Room tutorial (docs/specs/missions/tutorial.md). The start room has a row of terminals
// (tut1d, tut2a, tut3a, tut4c, tut5c); stepping on one asks to run that program, and accepting teleports
// the party into the program's room. Finishing a program returns the party to its terminal (fn_100a3e58).
// Objectives: 48 select program, 50 next room, 51/52 dummies, 53 wall, 54 forcefield, 55/56 items,
// 57/58 specials, 59/60 switching heroes.
const PROGRAMS = [
  { zone: 'tut1d', label: 'battle', to: [650, 4450] },
  { zone: 'tut2a', label: 'switchingcharacters', to: [2550, 4450], cyclops: [2350, 4250] },
  { zone: 'tut3a', label: 'Barriers', to: [4450, 4450] },
  { zone: 'tut4c', label: 'Items', to: [3650, 750] },
  { zone: 'tut5c', label: 'Specials', to: [6450, 4450], cyclops: [6250, 2850] },
];
const TERMINAL_RETURN = k => [680 + 300 * k, 580];

export class Tutorial extends BaseMission {
  init() {
    super.init();
    const g = this.game;
    for (const a of g.party()) a.unkillable = true;
    for (const n of ['brawler1', 'brawler2', 'brawler3', 'brawler4']) this.setNeutral(n);
    this.setAlly('cyclops');
    this.running = -1;
    this.rt.after(200, () => this.checkItemUsed(), true);

    PROGRAMS.forEach((p, k) => this.rt.on(p.zone, async e => {
      if (e.code !== EVT.ENTER || this.running !== -1 || this.busy) return;
      this.busy = true;
      try {
        const yes = await this.dialogue('tutorial', p.label);
        if (yes > 0) await this.runProgram(k);
      } finally { this.busy = false; }
    }));

    // 1: combat, two dummies
    this.dummies = new Set();
    this.rt.on(['brawler1', 'brawler2'], async e => {
      if (e.code !== EVT.DEFEATED || this.running !== 0) return;
      this.dummies.add(e.subject.toLowerCase());
      await this.objective(this.dummies.size === 1 ? 51 : 52, 2);
      if (this.dummies.size === 2) { await this.dialogue('tutorial', 'battleconcluded'); await this.finishProgram(); }
    });

    // 2: switching heroes; switch doors open only for the right leader
    this.rt.on(['switchdoor1', 'switchdoor2'], async e => {
      if (e.code !== EVT.ENTER || this.running !== 1) return;
      if (g.player.key !== 'cyclops') { if (!this.hinting) { this.hinting = true; await this.dialogue('tutorial', 'switchfail2'); this.hinting = false; } return; }
      if (!once(this, 'switch1')) return;
      g.level.openDoorsNear(g.player.x, g.player.y);
      await this.objective(59, 2); await this.objective(60, 0);
      await this.dialogue('tutorial', 'switch3');
    });
    this.rt.on(['switchbackdoor1', 'switchbackdoor2', 'switchbackdoor3'], async e => {
      if (e.code !== EVT.ENTER || this.running !== 1 || !this.switch1) return;
      if (g.player.key !== 'wolverine') { if (!this.hinting) { this.hinting = true; await this.dialogue('tutorial', 'switchfail2'); this.hinting = false; } return; }
      if (!once(this, 'switch2')) return;
      g.level.openDoorsNear(g.player.x, g.player.y);
      await this.objective(60, 2);
      await this.dialogue('tutorial', 'switch4');
      await this.finishProgram();
    });

    // 3: barriers, breakable wall then forcefield
    this.rt.on('map', async e => {
      if (e.code !== EVT.WALL || this.running !== 2 || !once(this, 'wallDone')) return;
      await this.objective(53, 2); await this.objective(54, 0);
    });
    this.rt.on(['forcefield1a', 'forcefield1b', 'forcefield1c', 'forcefield1d'], async e => {
      if (e.code === EVT.ENTER && this.running === 2 && !this.fieldDone) g.notify('[5]', 25);
      if (e.code !== EVT.ACTION || this.running !== 2 || !this.wallDone || !once(this, 'fieldDone')) return;
      for (const n of ['forcefield1a', 'forcefield1b', 'forcefield1c', 'forcefield1d']) this.rt.disableZone(n);
      g.level.openDoorsNear(g.player.x, g.player.y, 400);
      await this.objective(54, 2);
      await this.dialogue('tutorial', 'barriersfinal');
      await this.finishProgram();
    });

    // 4: items, pick up the med pack then use it (hold 6)
    for (const hero of ['wolverine', 'cyclops']) this.rt.on(hero, async e => {
      if (e.code !== EVT.PICKUP || this.running !== 3 || !once(this, 'pickedUp')) return;
      await this.objective(55, 2); await this.objective(56, 0);
      this.hpBeforeUse = g.player.hp;
    });

    // 5: specials, defeat the last dummies
    this.rt.on(['brawler3', 'brawler4'], async e => {
      if (e.code !== EVT.DEFEATED || this.running !== 4) return;
      await this.objective(e.subject.toLowerCase() === 'brawler3' ? 57 : 58, 2);
      if (this.find('brawler3')?.alive || this.find('brawler4')?.alive) return;
      await this.dialogue('tutorial', 'specialsend');
      await this.finishProgram();
    });

    // exit terminal: back to the main menu
    this.rt.on('exit2', async e => {
      if (e.code !== EVT.ENTER || this.running !== -1 || this.busy) return;
      this.busy = true;
      const yes = await this.dialogue('tutorial', 'exittutorial');
      if (yes > 0) {
        await this.fadeOut();
        if (g.frontend) { g.frontend.screen = 'main'; g.frontend.stack = []; } else location.reload();
      }
      this.busy = false;
    });
  }

  movePartyTo(x, y) {
    const g = this.game;
    g.party().forEach((a, i) => { a.x = x + (i ? (i % 2 ? -80 : 80) : 0); a.y = y + (i ? 80 * Math.ceil(i / 2) : 0); a.target = null; });
    g.camK = 0x1000;
  }

  async runProgram(k) {
    const g = this.game, p = PROGRAMS[k];
    this.running = k;
    await this.objective(48, 2);
    await this.fadeOut();
    this.movePartyTo(...p.to);
    if (p.cyclops) this.teleport('cyclops', ...p.cyclops);
    await this.fadeIn();
    if (k === 0) {
      await this.dialogue('tutorial', 'battle1');
      await this.objective(51, 0); await this.objective(52, 0);
      this.setEnemy('brawler1'); this.setEnemy('brawler2');
    } else if (k === 1) {
      await this.objective(59, 0);
    } else if (k === 2) {
      await this.objective(53, 0);
    } else if (k === 3) {
      await this.objective(55, 0);
      g.player.hp = Math.max(1, Math.floor(g.player.maxHP / 2));
      const med = g.assets.items.find(i => /small med pack/i.test(i.name));
      if (med && g.pickups) g.pickups.spawn(med, 3683, 557);
    } else if (k === 4) {
      await this.dialogue('tutorial', 'specials2');
      await this.objective(57, 0); await this.objective(58, 0);
      this.setEnemy('brawler3'); this.setEnemy('brawler4');
    }
  }

  async finishProgram() {
    const k = this.running;
    if (k < 0) return;
    await this.fadeOut();
    this.movePartyTo(...TERMINAL_RETURN(k));
    for (const a of this.game.party()) { a.hp = a.maxHP; a.energy = a.maxEnergy; }
    this.running = -1;
    await this.fadeIn();
    await this.objective(48, 0);
  }

  checkItemUsed() {
    // 4: using the med pack completes the items program
    const g = this.game;
    if (this.running === 3 && this.pickedUp && !this.usedItem && g.player.hp > this.hpBeforeUse) {
      this.usedItem = true;
      (async () => { await this.objective(56, 2); await this.dialogue('tutorial', 'items4'); await this.finishProgram(); })();
    }
  }

  async start() {
    if (!once(this, 'started')) return;
    await this.dialogue('tutorial', 'introreturn');
    await this.objective(48, 0);
  }
}

registerMission('tutorial', Tutorial);
