import { BaseMission, registerMission } from './index.js';
import { EVT } from '../script.js';

const zones = (script, ...prefixes) => script.rt.zones.map(z => z.rec.name).filter(n => prefixes.some(p => n.toLowerCase().startsWith(p.toLowerCase())));
const once = (script, key) => (script[key] ? false : (script[key] = true));
const exit = (script, prefixes, fn) => script.rt.on(zones(script, ...prefixes), async e => {
  if (e.code === EVT.ENTER) script.game.notify('[5]', 25);
  if (e.code === EVT.ACTION) fn(e);
});
// Episode table rows 11/12/13 all use these maps; the original tracks the visit in a cross-level variable (VarC0).
const visit = game => ({ 11: 1, 12: 2, 13: 3 })[game.episode] || 1;

// Episode 11-12, mansion grounds (docs/specs/missions/e11m11.md)
export class E11M11 extends BaseMission {
  init() {
    super.init();
    exit(this, ['door'], async () => { if (visit(this.game) === 1) { await this.fadeOut(); this.changeLevel('e11m03', 1); } });
  }
  async start() {
    if (!once(this, 'started')) return;
    if (visit(this.game) === 1) {
      await this.dialogue('e11m04', 'missionstart');
      await this.objective(20, 0);
      await this.objective(61, 0);
      return;
    }
    // second visit: GRSO soldiers attack in waves; the last kill ends the episode
    const soldiers = this.game.actors.filter(a => /^grso/.test(a.key));
    for (const s of soldiers) s.team = 1;
    this.left = soldiers.length;
    const onDown = async e => {
      if (e.code !== EVT.DEFEATED) return;
      this.left--;
      if (this.left <= 0 && once(this, 'ending')) {
        await this.objective(62, 2);
        await this.dialogue('e11m04', 'missionend');
        await this.fadeOut();
        this.completeEpisode(2);
      }
    };
    for (const s of soldiers) this.rt.on(s.name || s.key, onDown);
    if (!soldiers.length) { await this.fadeOut(); this.completeEpisode(2); }
  }
}

// Episode 11/13, Xavier's Mansion (docs/specs/missions/e11m03.md)
export class E11M03 extends BaseMission {
  init() {
    super.init();
    exit(this, ['elevator'], async () => { await this.fadeOut(); this.changeLevel('e11m05', 1); });
    exit(this, ['door'], async () => { if (visit(this.game) === 1) { await this.fadeOut(); this.changeLevel('e11m11', 2); } });
    this.rt.on('nightcrawler', async e => { if (e.code === EVT.ENTER && once(this, 'kurt')) await this.dialogue('e11m04', 'meetnightcrawler'); });
    this.rt.on(['rogue', ...zones(this, 'meetrogue')], async e => { if (e.code === EVT.ENTER && once(this, 'rogue')) await this.dialogue('e11m04', 'meetrogue'); });
  }
  async start() {
    if (visit(this.game) !== 3 || !once(this, 'cyclopsScene')) return;
    this.setControl(false);
    await this.dialogue('e11m04', 'cyclopsleavingxavier');
    await this.fadeOut();
    this.setControl(true);
    this.completeEpisode(1);
  }
}

// Episode 11/13, sub-basement War Room (docs/specs/missions/e11m05.md)
export class E11M05 extends BaseMission {
  init() {
    super.init();
    exit(this, ['elevator'], async () => {
      if (visit(this.game) === 1 && this.briefed && once(this, 'leaving')) { await this.fadeOut(); this.completeEpisode(2); }
      else if (visit(this.game) !== 1) { await this.fadeOut(); this.changeLevel('e11m03', 2); }
    });
  }
  async start() {
    if (!once(this, 'started')) return;
    if (visit(this.game) === 1) {
      await this.dialogue('e11m04', 'missionbriefing');
      await this.objective(61, 2);
      await this.objective(20, 0);
      this.briefed = true;
    } else {
      this.setControl(false);
      await this.objective(62, 2);
      await this.dialogue('e11m04', 'missiondebrief3');
      await this.fadeOut();
      this.setControl(true);
      this.changeLevel('e11m03', 2);
    }
  }
}

registerMission('e11m11', E11M11);
registerMission('e11m03', E11M03);
registerMission('e11m05', E11M05);
