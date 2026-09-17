import { BaseMission, registerMission } from './index.js';
import { EVT } from '../script.js';

const zones = (script, ...prefixes) => script.rt.zones.map(z => z.rec.name).filter(n => prefixes.some(p => n.toLowerCase().startsWith(p.toLowerCase())));
const once = (script, key) => (script[key] ? false : (script[key] = true));
const onEnter = (script, names, fn) => script.rt.on(names, e => { if (e.code === EVT.ENTER) fn(e); });
const exit = (script, prefixes, mdd, spawn, guard = () => true) => script.rt.on(zones(script, ...prefixes), async e => {
  if (!guard()) return;
  if (e.code === EVT.ENTER) script.game.notify('[5]', 25);
  if (e.code === EVT.ACTION) { await script.fadeOut(); script.changeLevel(mdd, spawn); }
});
const hostile = (script, re) => { for (const a of script.game.actors) if (re.test(a.name || '') && a.team !== 1) a.team = 1; };
const progress = game => (game.episodeVars ||= {});

// Episode 24, Sentinel factory (pseudo e22m22)
export class E22M22 extends BaseMission {
  init() {
    super.init();
    onEnter(this, zones(this, 'attack', 'factory', 'grso'), () => hostile(this, /^attacker/i));
    this.rt.on('scientist', async e => { if (e.code === EVT.ENTER && once(this, 'sci')) await this.dialogue('e22m22', 'metscientist'); });
    this.rt.on('cyborg', async e => {
      if (e.code === EVT.ENTER && once(this, 'seeCyborg')) { await this.dialogue('e22m22', 'seecyborg'); this.setEnemy('cyborg'); }
      if (e.code === EVT.DEFEATED && once(this, 'cyborgDown')) await this.dialogue('e22m22', 'deadcyborg');
    });
    exit(this, ['nextlevel'], 'e22m23', 1);
  }
  async start() {
    if (this.game.lastSpawn !== 1 || !once(this, 'started')) return;
    await this.dialogue('e22m22', 'init');
    await this.objective(34, 0);
  }
}

// Episode 24, factory core: navigation controller, then the Muir Island epilogue (pseudo e22m23)
export class E22M23 extends BaseMission {
  init() {
    super.init();
    onEnter(this, zones(this, 'seecyborg', 'killingsent'), () => hostile(this, /^killingsent/i));
    this.rt.on(zones(this, 'desk', 'office'), async e => {
      if (e.code === EVT.ENTER && !this.gotNav) this.game.notify('[5]', 25);
      if (e.code !== EVT.ACTION || !once(this, 'gotNav')) return;
      await this.dialogue('e22m22', 'gotnavcont');
      this.giveItem('Nav System');
      await this.objective(34, 2);
    });
    onEnter(this, zones(this, 'coredoorlocked', 'prisondoor'), async () => { if (!this.gotNav) await this.dialogue('e22m22', 'lockeddoor'); });
    this.rt.on(zones(this, 'prevlevel'), async e => {
      if (e.code === EVT.ENTER) this.game.notify('[5]', 25);
      if (e.code !== EVT.ACTION) return;
      await this.fadeOut();
      this.changeLevel(this.gotNav ? 'e22cMI' : 'e22m22', this.gotNav ? 1 : 2);
    });
  }
}

// Episode 24 epilogue (pseudo e22cMI)
export class E22CMI extends BaseMission {
  async start() {
    if (!once(this, 'started')) return;
    this.setControl(false);
    await this.dialogue('e22m22', 'Illyana-6');
    await this.fadeOut();
    this.setControl(true);
    this.completeEpisode(1);
  }
}

// Episode 25, War Room: prepare for Asteroid M (pseudo e23m05)
export class E23M05 extends BaseMission {
  init() {
    super.init();
    onEnter(this, zones(this, 'warRoom'), async () => {
      if (!once(this, 'briefing')) return;
      this.setControl(false);
      await this.objective(2, 2);
      await this.dialogue('Mission23', 'PrepareAstM');
      const nav = this.game.assets.items.find(i => i.name.toLowerCase() === 'nav system');
      if (nav) this.game.inventory.remove(nav);
      await this.fadeOut();
      this.game.nextMovie = 'mv_11';
      this.setControl(true);
      this.completeEpisode(1);
    });
  }
  async start() {
    if (!once(this, 'started')) return;
    await this.dialogue('Mission23', 'PA');
    await this.objective(2, 0);
  }
}

// Episode 26, Asteroid M docks: Toad holds the elevator key (pseudo e24m24)
export class E24M24 extends BaseMission {
  init() {
    super.init();
    this.setUnkillable('toad');
    onEnter(this, zones(this, 'fight', 'ToadInPlace', 'trigger'), async () => {
      hostile(this, /^patrol/i);
      if (!once(this, 'toadFight')) return;
      await this.dialogue('mission24', 'MeetToad');
      this.setEnemy('toad');
    });
    this.rt.on('toad', async e => {
      if (e.code !== EVT.DEFEATED || !once(this, 'toadDown')) return;
      this.setNeutral('toad');
      await this.dialogue('mission24', 'AfterKOToad');
      await this.objective(35, 2);
      await this.objective(36, 0);
      this.giveItem('Elevator Key');
    });
    exit(this, ['ToLevel'], 'e24m25', 1, () => this.hasItem('Elevator Key'));
  }
  async start() {
    if (this.game.lastSpawn !== 1 || !once(this, 'started')) return;
    await this.objective(35, 0);
  }
}

// Episode 26, Asteroid M interior: Mystique and Avalanche, then Master Mold after Magneto (pseudo e24m25)
export class E24M25 extends BaseMission {
  init() {
    super.init();
    this.setAlly('havok');
    this.setUnkillable('mystique'); this.setUnkillable('avalanche'); this.setUnkillable('mmold');
    const P = progress(this.game);
    onEnter(this, zones(this, 'fight'), () => hostile(this, /^(scout|cyborg|mb|mp)/i));
    onEnter(this, zones(this, 'mystiqueFight'), () => { if (once(this, 'mysFight')) { this.setEnemy('mystique'); this.setEnemy('avalanche'); } });
    this.villains = new Set();
    this.rt.on(['mystique', 'avalanche'], e => {
      if (e.code !== EVT.DEFEATED) return;
      this.villains.add(e.subject.toLowerCase());
      this.setNeutral(e.subject);
      if (this.villains.size === 2) P.brotherhoodDone = true;
    });
    this.rt.on('mmold', async e => {
      if (e.code === EVT.ENTER && P.magnetoDone && once(this, 'moldFight')) this.setEnemy('mmold');
      if (e.code !== EVT.DEFEATED || !once(this, 'moldDown')) return;
      this.setNeutral('mmold');
      await this.objective(36, 2);
      await this.fadeOut();
      this.completeEpisode(1);
    });
    exit(this, ['ToLevel'], 'e24m26', 1, () => !P.magnetoDone);
  }
}

// Episode 26, cells: Magneto (pseudo e24m26)
export class E24M26 extends BaseMission {
  init() {
    super.init();
    this.setUnkillable('magneto'); this.setAlly('havok');
    const P = progress(this.game);
    onEnter(this, zones(this, 'fight', 'cellFight'), () => hostile(this, /^(mb|cb|pb|mp)/i));
    this.rt.on('magneto', async e => {
      if (e.code === EVT.ENTER && once(this, 'magFight')) this.setEnemy('magneto');
      if (e.code !== EVT.DEFEATED || !once(this, 'magDown')) return;
      this.setNeutral('magneto');
      P.magnetoDone = true;
      await this.fadeOut();
      this.changeLevel('e24m25', 2);
    });
    exit(this, ['ToLevel'], 'e24m25', 2);
  }
  async start() {
    if (!once(this, 'started')) return;
    await this.dialogue('mission24', 'FindMagneto');
  }
}

// Episode 27, finale (pseudo e25cMA): closing scene, final movie, back to the title screen
export class E25CMA extends BaseMission {
  async start() {
    if (!once(this, 'started')) return;
    this.setControl(false);
    await this.dialogue('mission24', 'Xavier-2');
    await this.fadeOut();
    await this.game.playMovie('mv_15');
    this.setControl(true);
    this.game.notify('THE END', 200);
    if (this.game.frontend) { this.game.frontend.screen = 'title'; this.game.frontend.stack = []; }
  }
}

registerMission('e22m22', E22M22);
registerMission('e22m23', E22M23);
registerMission('e22cMI', E22CMI);
registerMission('e23m05', E23M05);
registerMission('e24m24', E24M24);
registerMission('e24m25', E24M25);
registerMission('e24m26', E24M26);
registerMission('e25cMA', E25CMA);
