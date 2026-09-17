import { BaseMission, registerMission } from './index.js';
import { EVT } from '../script.js';

// Episode 1, map 1: New York streets (docs/specs/missions/e01m01.md, class vtable 0x1011d354)
export class E01M01 extends BaseMission {
  init() {
    super.init();
    this.containerLoot = ['medium med pack', 'small e pack', 'air horn', 'small med pack'];
    this.containerCap = 6;
    this.defeated = 0;          // bit per villain (f_e8)
    this.canLeave = false;      // f_e0
    const rt = this.rt;
    this.setNeutral('sergeant');
    for (const n of ['character14', 'character15', 'character16']) this.setNeutral(n);
    for (const v of ['mystique', 'blob', 'avalanche']) { this.setNeutral(v); this.setUnkillable(v); }

    rt.on(['sergeantFight1', 'sergeantFight2', 'sergeantFight3'], async e => {
      if (e.code !== EVT.ENTER || this.sergeantDone) return;
      this.sergeantDone = true;
      await this.dialogue('mission01', 'Seargent');
      this.setEnemy('sergeant');
      for (const n of ['character14', 'character15', 'character16']) this.setEnemy(n);
    });
    rt.on([...Array(7)].map((_, i) => `prebosscinematic${i + 1}`), async e => {
      if (e.code !== EVT.ENTER || this.bossStarted) return;
      this.bossStarted = true;
      await this.dialogue('mission01', 'Mystique-2');
      await this.objective(0, 1);
      await this.objective(3, 0);
      for (const v of ['mystique', 'blob', 'avalanche']) this.setEnemy(v);
    });
    const villain = bit => async e => {
      if (e.code !== EVT.DEFEATED) return;
      this.defeated |= bit;
      this.setNeutral(e.subject);
      if (this.defeated === 7 && !this.canLeave) {
        await this.dialogue('mission01', 'Cyclops-1');
        await this.objective(3, 1);
        await this.objective(1, 0);
        this.canLeave = true;
      }
    };
    rt.on('blob', villain(1));
    rt.on('mystique', villain(2));
    rt.on('avalanche', villain(4));
    rt.on(['toRooftops1', 'toRooftops2', 'toRooftops3', 'toRooftops4'], async e => {
      if (!this.canLeave) return;
      if (e.code === EVT.ENTER) this.game.notify('[5]', 25);
      if (e.code === EVT.ACTION) { await this.fadeOut(); this.changeLevel('e01m02', 1); }
    });
  }
  async start() {
    await this.dialogue('mission01', 'TakeCare');
    await this.objective(0, 0);
  }
}
registerMission('e01m01', E01M01);
