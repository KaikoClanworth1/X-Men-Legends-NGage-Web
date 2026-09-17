import { BaseMission, registerMission } from './index.js';
import { EVT } from '../script.js';

const zones = (script, ...prefixes) => script.rt.zones.map(z => z.rec.name).filter(n => prefixes.some(p => n.toLowerCase().startsWith(p.toLowerCase())));
const exit = (script, prefixes, mdd, spawn) => script.rt.on(zones(script, ...prefixes), async e => {
  if (e.code === EVT.ENTER) script.game.notify('[5]', 25);
  if (e.code === EVT.ACTION) { await script.fadeOut(); script.changeLevel(mdd, spawn); }
});

// Episode 4, mansion grounds (docs/specs/missions/e04m11.md)
export class E04M11 extends BaseMission {
  init() {
    super.init();
    this.containerLoot = ['small e pack', 'caffeine dose', 'gas bomb', 'small med pack'];
    this.containerCap = 2;
    exit(this, ['spawn2', 'toInside', 'toMansion'], 'e04m03', 1);
  }
  async start() {
    if (this.game.lastSpawn !== 1) return;
    await this.dialogue('mission04', 'Dear Diary');
    await this.objective(5, 0);
  }
}

// Episode 4, mansion first floor (docs/specs/missions/e04m03.md)
export class E04M03 extends BaseMission {
  init() {
    super.init();
    this.game.unlockHeroes(['ncrawler']);
    exit(this, ['toOutside'], 'e04m11', 2);
    exit(this, ['toSubBase'], 'e04m05', 1);
    this.rt.on('nightcrawler', async e => {
      if (e.code !== EVT.ENTER || this.metKurt) return;
      this.metKurt = true;
      await this.dialogue('mission04', 'Nightcrawler-1');
    });
  }
}

// Episode 4, sub-basement: Xavier, then the War Room briefing ends the episode (docs/specs/missions/e04m05.md)
export class E04M05 extends BaseMission {
  init() {
    super.init();
    this.setNeutral('toad');
    exit(this, ['toFloor'], 'e04m03', 2);
    this.rt.on('convToad', async e => { if (e.code === EVT.ENTER) await this.dialogue('mission04', 'Toad-N'); });
    this.rt.on('xavier', async e => {
      if (e.code !== EVT.ENTER || this.talkedXavier) return;
      this.talkedXavier = true;
      await this.objective(5, 2);
      this.game.nextMovie = 'mv_03';
      await this.game.playMovie('mv_03');
      this.game.nextMovie = null;
    });
    this.rt.on('warRoom', async e => {
      if (e.code !== EVT.ENTER || !this.talkedXavier || this.ending) return;
      this.ending = true;
      this.setControl(false);
      await this.dialogue('mission04', 'NextMission-1');
      await this.objective(2, 2);
      await this.dialogue('mission04', 'NextMission-3');
      await this.fadeOut();
      this.setControl(true);
      this.completeEpisode(1);
    });
  }
  async start() {
    if (this.game.lastSpawn !== 1) return;
    await this.dialogue('mission04', 'Xavier-5');
    await this.objective(2, 0);
  }
}

registerMission('e04m11', E04M11);
registerMission('e04m03', E04M03);
registerMission('e04m05', E04M05);
