import { BaseMission, registerMission } from './index.js';
import { EVT } from '../script.js';

const zones = (script, ...prefixes) => script.rt.zones.map(z => z.rec.name).filter(n => prefixes.some(p => n.toLowerCase().startsWith(p.toLowerCase())));
const once = (script, key) => (script[key] ? false : (script[key] = true));
const exit = (script, prefixes, mdd, spawn) => script.rt.on(zones(script, ...prefixes), async e => {
  if (e.code === EVT.ENTER) script.game.notify('[5]', 25);
  if (e.code === EVT.ACTION) { await script.fadeOut(); script.changeLevel(mdd, spawn); }
});

// Episode 8 grounds (pseudo e08m11)
export class E08M11 extends BaseMission {
  init() { super.init(); exit(this, ['prevlevel'], 'e08m03', 1); }
  async start() {
    if (this.game.lastSpawn !== 1 || !once(this, 'started')) return;
    await this.dialogue('mission08', 'Dear Diary');
    await this.objective(5, 0);
  }
}

// Episode 8 mansion first floor (pseudo e08m03)
export class E08M03 extends BaseMission {
  init() {
    super.init();
    exit(this, ['toOutside'], 'e08m11', 2);
    exit(this, ['toSubBase'], 'e08m05', 1);
  }
}

// Episode 8 sub-basement (pseudo e08m05): Storm sends the team to the Danger Room; after it, codename + War Room
export class E08M05 extends BaseMission {
  init() {
    super.init();
    this.setNeutral('toad'); this.setNeutral('xavier');
    exit(this, ['toFloor'], 'e08m03', 2);
    this.rt.on(zones(this, 'nySim'), async e => {
      if (e.code !== EVT.ENTER || this.game.lastSpawn === 2 || !once(this, 'sim')) return;
      await this.dialogue('mission08', 'Storm-1');
      await this.objective(5, 2);
      await this.objective(16, 0);
      await this.fadeOut();
      this.changeLevel('e08m01', 1);
    });
    this.rt.on(zones(this, 'nextMission'), async e => {
      if (e.code !== EVT.ENTER || this.game.lastSpawn !== 2 || !once(this, 'ending')) return;
      this.setControl(false);
      await this.objective(2, 2);
      await this.dialogue('mission08', 'To War Room');
      await this.dialogue('mission08', 'Next Misison');
      await this.fadeOut();
      this.setControl(true);
      this.completeEpisode(1);
    });
  }
  async start() {
    if (this.game.lastSpawn !== 2 || !once(this, 'returned')) return;
    this.game.unlockHeroes(['magma']);
    await this.dialogue('mission08', 'Codename');
    await this.objective(16, 2);
    await this.objective(2, 0);
  }
}

// Episode 8 Danger Room simulation (pseudo e08m01): defeat the three villains, return to the sub-basement
export class E08M01 extends BaseMission {
  init() {
    super.init();
    this.down = new Set();
    for (const v of ['mystique', 'blob', 'avalanche']) { this.setUnkillable(v); this.setEnemy(v); }
    this.rt.on(['mystique', 'blob', 'avalanche'], async e => {
      if (e.code !== EVT.DEFEATED) return;
      this.down.add(e.subject.toLowerCase());
      this.setNeutral(e.subject);
      this.remove(e.subject);
      if (this.down.size === 3 && once(this, 'done')) {
        await this.dialogue('mission08', 'Test-7');
        await this.fadeOut();
        this.changeLevel('e08m05', 2);
      }
    });
  }
}

registerMission('e08m11', E08M11);
registerMission('e08m03', E08M03);
registerMission('e08m05', E08M05);
registerMission('e08m01', E08M01);
