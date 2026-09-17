import { BaseMission, registerMission } from './index.js';
import { EVT } from '../script.js';

const zones = (script, ...prefixes) => script.rt.zones.map(z => z.rec.name).filter(n => prefixes.some(p => n.toLowerCase().startsWith(p.toLowerCase())));
const once = (script, key) => (script[key] ? false : (script[key] = true));
const onEnter = (script, names, fn) => script.rt.on(names, e => { if (e.code === EVT.ENTER) fn(e); });

// Episode 6, Muir Island (pseudo e06m12): stop the Multiple Man clones, then talk to the real one and leave
export class E06M12 extends BaseMission {
  init() {
    super.init();
    this.setNeutral('RealMultipleMan');
    this.cloneNames = [...Array(22)].map((_, i) => `MultipleMan${String(i + 1).padStart(2, '0')}`);
    this.clonesLeft = this.cloneNames.filter(n => this.find(n)).length;
    this.rt.on(this.cloneNames, async e => {
      if (e.code !== EVT.DEFEATED) return;
      this.clonesLeft--;
      if (this.clonesLeft > 0 && this.clonesLeft <= 12) this.game.notify(`${this.clonesLeft}`, 30);
      if (this.clonesLeft <= 0 && once(this, 'clonesDone')) {
        await this.objective(13, 2);
        await this.objective(37, 0);
      }
    });
    onEnter(this, zones(this, 'fight'), () => { for (const n of this.cloneNames) this.setEnemy(n); });
    this.rt.on('RealMultipleMan', async e => {
      if (e.code !== EVT.ENTER) return;
      await this.dialogue('mission06', this.clonesDone ? 'MMan-2' : 'MMan-1');
    });
    this.rt.on('forge', async e => { if (e.code === EVT.ENTER) await this.dialogue('mission06', 'Forge-N'); });
    this.rt.on('moira', async e => { if (e.code === EVT.ENTER) await this.dialogue('mission06', 'Moira-N'); });
    onEnter(this, zones(this, 'endmission'), async () => {
      if (!this.clonesDone || !once(this, 'leaving')) return;
      await this.objective(37, 2);
      await this.dialogue('mission06', 'LetsGo');
      await this.fadeOut();
      this.changeLevel('e06cXJ', 1);
    });
  }
  async start() {
    if (this.game.lastSpawn !== 1 || !once(this, 'started')) return;
    await this.dialogue('mission06', 'Intro');
    await this.objective(13, 0);
  }
}

// Episode 6 X-Jet scene (pseudo e06cXJ)
export class E06CXJ extends BaseMission {
  async start() {
    this.setControl(false);
    await this.dialogue('mission06', 'InXJet');
    await this.fadeOut();
    this.game.nextMovie = 'mv_04';
    this.setControl(true);
    this.completeEpisode(1);
  }
}

// Episode 7, Asteroid M approach (pseudo e07m13): meet Blob, reach the next level
export class E07M13 extends BaseMission {
  init() {
    super.init();
    this.setNeutral('blob');
    onEnter(this, ['blob', ...zones(this, 'meetblob')], async () => { if (once(this, 'metBlob')) await this.dialogue('e07m13', 'meetblob'); });
    onEnter(this, zones(this, 'revelation'), async () => {
      if (!once(this, 'revealed')) return;
      await this.dialogue('e07m13', 'muir');
      await this.objective(14, 2);
      await this.objective(15, 0);
    });
    onEnter(this, zones(this, 'sent'), () => { for (const a of this.game.actors) if (a.key === 'senscout' && a.team === 2) a.team = 1; });
    this.rt.on(zones(this, 'nextlevel'), async e => {
      if (e.code === EVT.ENTER) this.game.notify('[5]', 25);
      if (e.code === EVT.ACTION) { await this.fadeOut(); this.changeLevel('e07m14', 1); }
    });
  }
  async start() {
    if (this.game.lastSpawn !== 1 || !once(this, 'started')) return;
    await this.dialogue('e07m13', 'init');
    await this.objective(14, 0);
  }
}

// Episode 7, Asteroid M interior (pseudo e07m14): forcefields and the elevator down
export class E07M14 extends BaseMission {
  init() {
    super.init();
    this.rt.on(zones(this, 'forcefield'), e => {
      if (e.code === EVT.ACTION) { this.rt.disableZone(e.subject); this.game.notify('[forcefield off]', 40); }
    });
    this.rt.on(zones(this, 'elevator'), async e => {
      if (e.code === EVT.ENTER) this.game.notify('[5]', 25);
      if (e.code !== EVT.ACTION || !once(this, 'down')) return;
      await this.fadeOut();
      await this.game.playMovie('mv_05');
      this.changeLevel('e07m15', 1);
    });
  }
}

// Episode 7, Asteroid M core (pseudo e07m15): Blob fight (unkillable), then the episode ends
export class E07M15 extends BaseMission {
  init() {
    super.init();
    this.setUnkillable('blob');
    onEnter(this, zones(this, 'meetblob', 'blobdoor'), async () => {
      if (!once(this, 'blobFight')) return;
      await this.dialogue('e07m14', 'meetblob');
      this.setEnemy('blob');
    });
    this.rt.on('blob', async e => {
      if (e.code !== EVT.DEFEATED || !once(this, 'blobDown')) return;
      this.setNeutral('blob');
      await this.dialogue('e07m14', 'defeatblob');
      await this.objective(15, 2);
      await this.fadeOut();
      this.game.nextMovie = 'mv_06';
      this.completeEpisode(1);
    });
    this.rt.on(zones(this, 'forcefield'), e => {
      if (e.code === EVT.ACTION) { this.rt.disableZone(e.subject); this.game.notify('[forcefield off]', 40); }
    });
  }
}

registerMission('e06m12', E06M12);
registerMission('e06cXJ', E06CXJ);
registerMission('e07m13', E07M13);
registerMission('e07m14', E07M14);
registerMission('e07m15', E07M15);
