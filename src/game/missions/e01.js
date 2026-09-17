import { BaseMission, registerMission } from './index.js';
import { EVT } from '../script.js';

const range = (prefix, n) => [...Array(n)].map((_, i) => `${prefix}${i + 1}`);

// Episode 1, map 2: rooftops (docs/specs/missions/e01m02.md)
export class E01M02 extends BaseMission {
  init() {
    super.init();
    this.game.unlockHeroes(['storm', 'rogue', 'wolverine', 'cyclops', 'iceman']);
    this.rt.on(range('endLevel', 9), async e => {
      if (e.code !== EVT.ENTER || this.ending) return;
      this.ending = true;
      await this.objective(1, 2);
      await this.dialogue('mission01', 'Cyclops-2');
      await this.fadeOut();
      for (const a of this.game.party()) a.hp = a.maxHP;
      this.changeLevel('e01cXJ', 1);
    });
    this.rt.on(range('toStreets', 4), async e => {
      if (e.code === EVT.ENTER) this.game.notify('[5]', 25);
      if (e.code === EVT.ACTION) { await this.fadeOut(); this.changeLevel('e01m01', 2); }
    });
  }
  start() {
    for (const k of ['bhbrawler', 'bhpsionic']) this.setLevel(k, 3);
  }
}

// Episode 1 X-Jet cutscene map (docs/specs/missions/e01cXJ.md)
export class E01CXJ extends BaseMission {
  async start() {
    this.setControl(false);
    await this.dialogue('mission01', 'InXJet');
    await this.fadeOut();
    this.game.nextMovie = 'mv_02';
    this.setControl(true);
    this.completeEpisode(1);
  }
}

registerMission('e01m02', E01M02);
registerMission('e01cXJ', E01CXJ);
