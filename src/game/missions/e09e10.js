import { BaseMission, registerMission } from './index.js';
import { EVT } from '../script.js';

const zones = (script, ...prefixes) => script.rt.zones.map(z => z.rec.name).filter(n => prefixes.some(p => n.toLowerCase().startsWith(p.toLowerCase())));
const once = (script, key) => (script[key] ? false : (script[key] = true));
const exit = (script, prefixes, mdd, spawnFn) => script.rt.on(zones(script, ...prefixes), async e => {
  if (e.code === EVT.ENTER) script.game.notify('[5]', 25);
  if (e.code === EVT.ACTION) { await script.fadeOut(); script.changeLevel(mdd, typeof spawnFn === 'function' ? spawnFn() : spawnFn); }
});

// Episode 9 progress shared between the plant maps (the original keeps it in a cross-level script variable)
const progress = game => (game.episodeVars ||= {});

// Episode 9, nuclear plant (docs/specs/missions/e09m16.md)
export class E09M16 extends BaseMission {
  init() {
    super.init();
    for (const n of ['colossus', 'Technician', 'Tech2']) this.setNeutral(n);
    const P = progress(this.game);
    this.rt.on('Technician', async e => {
      if (e.code !== EVT.ENTER || !once(this, 'tech')) return;
      await this.dialogue('Mission09', 'meettech');
      await this.objective(18, 0);
    });
    this.rt.on('colossus', async e => {
      if (e.code !== EVT.ENTER || P.metColossus) return;
      P.metColossus = true;
      await this.dialogue('Mission09', 'MeetCollossus');
      await this.objective(18, 2);
      await this.objective(63, 0);
    });
    this.rt.on(zones(this, 'mainvalve'), async e => {
      if (e.code !== EVT.ENTER || !P.valvesDone || !once(this, 'ending')) return;
      this.setControl(false);
      await this.dialogue('Mission09', 'EndConv');
      this.setAlly('colossus');
      this.game.unlockHeroes(['colossus']);
      await this.objective(66, 2);
      await this.fadeOut();
      this.setControl(true);
      this.completeEpisode(1);
    });
    exit(this, ['goto17'], 'e09m17', 1);
  }
  async start() {
    if (this.game.lastSpawn !== 1 || !once(this, 'started')) return;
    await this.dialogue('Mission09', 'TechConv');
  }
}

// Episode 9, coolant valves (docs/specs/missions/e09m17.md)
export class E09M17 extends BaseMission {
  init() {
    super.init();
    const P = progress(this.game);
    this.valves = new Set();
    this.rt.on(zones(this, 'forcefield'), e => {
      if (e.code === EVT.ACTION) { this.rt.disableZone(e.subject); this.forcefieldOff = true; this.game.notify('[forcefield off]', 40); }
    });
    this.rt.on(zones(this, 'valve'), async e => {
      if (e.code === EVT.ENTER && !this.valves.has(e.subject)) this.game.notify('[5]', 25);
      if (e.code !== EVT.ACTION || this.valves.has(e.subject)) return;
      this.valves.add(e.subject);
      this.game.notify(`${this.valves.size}/4`, 40);
      if (this.valves.size === 4 && !P.valvesDone) {
        P.valvesDone = true;
        await this.objective(63, 2);
        await this.objective(66, 0);
      }
    });
    exit(this, ['GoBack'], 'e09m16', () => (P.valvesDone ? 3 : 2));
  }
}

// Episode 10, Muir Island hub (docs/specs/missions/e10m12.md)
export class E10M12 extends BaseMission {
  init() {
    super.init();
    this.game.unlockHeroes(['colossus']);
    for (const n of ['mulman', 'colossus', 'moira', 'forge']) this.setAlly(n);
    this.rt.on('forge', async e => { if (e.code === EVT.ENTER && once(this, 'forgeTalk')) await this.dialogue('forge', 'all'); });
    this.rt.on('moira', async e => { if (e.code === EVT.ENTER) await this.dialogue('mission10', 'Moira-N'); });
    this.rt.on(zones(this, 'seecyclops'), async e => { if (e.code === EVT.ENTER && once(this, 'cyclopsScene')) await this.dialogue('mission10', 'Cyclops'); });
    this.rt.on(zones(this, 'timeToLeave', 'TimeToLeave'), async e => {
      if (e.code !== EVT.ENTER || !once(this, 'leaving')) return;
      const r = await this.dialogue('mission10', 'GoHome');
      if (r === 1) { this.leaving = false; return; }
      await this.objective(19, 2);
      await this.fadeOut();
      this.game.nextMovie = 'mv_02';
      this.completeEpisode(1);
    });
  }
  async start() {
    if (!once(this, 'started')) return;
    await this.dialogue('mission10', 'Intro');
    await this.objective(19, 0);
  }
}

registerMission('e09m16', E09M16);
registerMission('e09m17', E09M17);
registerMission('e10m12', E10M12);
