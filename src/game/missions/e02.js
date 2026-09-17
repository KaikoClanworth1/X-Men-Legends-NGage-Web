import { BaseMission, registerMission } from './index.js';
import { EVT } from '../script.js';

const range = (prefix, n, from = 1) => [...Array(n)].map((_, i) => `${prefix}${i + from}`);
// every zone of the mission whose name starts with one of the prefixes (record names vary per map)
const zones = (script, ...prefixes) => script.rt.zones.map(z => z.rec.name).filter(n => prefixes.some(p => n.toLowerCase().startsWith(p.toLowerCase())));
const onAction = (script, names, fn) => script.rt.on(names, e => {
  if (e.code === EVT.ENTER) script.game.notify('[5]', 25);
  if (e.code === EVT.ACTION) fn(e);
});

// Episode 2, mansion first floor (docs/specs/missions/e02m03.md)
export class E02M03 extends BaseMission {
  init() {
    super.init();
    this.containerLoot = ['smelling salts', 'healing dose', 'concussion bomb', 'small med pack'];
    this.containerCap = 9; this.containerGuaranteed = true;
    const tourRoom = (names, label) => this.rt.on(names, async e => {
      if (e.code !== EVT.ENTER || this.seen?.[label]) return;
      (this.seen ||= {})[label] = true;
      await this.dialogue('mission02', label);
    });
    tourRoom(zones(this, 'library'), 'MeetLibrary');
    tourRoom(zones(this, 'diningRoom'), 'MeetDining');
    tourRoom(zones(this, 'sittingRoom'), 'MeetSitting');
    tourRoom(zones(this, 'dayRoom'), 'MeetDayroom');
    tourRoom(zones(this, 'Classroom'), 'MeetClassroom');
    tourRoom(zones(this, 'Elevator'), 'MeetElevator');
    this.rt.on('xavier', async e => {
      if (e.code !== EVT.ENTER || this.inXavierScene) return;
      this.inXavierScene = true;
      if (!this.metXavier) { await this.objective(7, 0); await this.objective(4, 2); }
      const result = await this.dialogue('mission02', this.metXavier ? 'ProfX-1' : 'MeetProfX');
      this.metXavier = true;
      if (result === 0) { await this.fadeOut(); this.changeLevel('e02m05', 1); return; }
      this.game.script.after(10000, () => { this.inXavierScene = false; });
    });
    onAction(this, zones(this, 'toLevel', 'toSubBase'), async () => { await this.fadeOut(); this.changeLevel('e02m04', 1); });
    onAction(this, zones(this, 'toOutside'), async () => { await this.fadeOut(); this.changeLevel('e02m11', 1); });
  }
  async start() {
    if (this.game.lastSpawn !== 1) return;
    this.game.unlockHeroes(['phoenix', 'storm', 'beast']);
    await this.dialogue('mission02', 'Start Tour');
    await this.objective(4, 0);
  }
}

// Episode 2, mansion second floor bedrooms (docs/specs/missions/e02m04.md)
export class E02M04 extends BaseMission {
  init() {
    super.init();
    this.visited = 0;
    const rooms = zones(this, 'jeansRoom', 'allisonsRoom', 'roguesRoom', 'cyclopsRoom', 'beastsRoom', 'colossusRoom', 'icemansRoom', 'wolverinesRoom', 'stormsRoom');
    this.rt.on(rooms, e => {
      if (e.code !== EVT.ENTER) return;
      this.visited |= 1 << rooms.indexOf(e.subject);
      if (this.visited === 0x1ff && !this.xpGiven) { this.xpGiven = true; this.questXP(200); this.message(120); }
    });
    onAction(this, zones(this, 'toFloor'), async () => { await this.fadeOut(); this.changeLevel('e02m03', 2); });
  }
}

// Episode 2, sub-basement (docs/specs/missions/e02m05.md)
export class E02M05 extends BaseMission {
  init() {
    super.init();
    const line = (names, label) => this.rt.on(names, async e => {
      if (e.code !== EVT.ENTER || !this.touring || this.said?.[label]) return;
      (this.said ||= {})[label] = true;
      await this.dialogue('mission02', label);
    });
    line(zones(this, 'medLab'), 'Medical'); line(zones(this, 'brig'), 'Brig'); line(zones(this, 'beastLab'), 'BeastLab');
    line(zones(this, 'hangar'), 'Hangar'); line(zones(this, 'controlRoom'), 'Controlroom');
    line(zones(this, 'transportTubes'), 'Transport'); line(zones(this, 'cerebro'), 'Cerebro');
    const ending = async () => {
      if (this.ending) return;
      this.ending = true;
      this.setControl(false);
      await this.dialogue('mission02', 'MeetWarroom');
      await this.objective(2, 2);
      await this.dialogue('mission02', 'NextMission');
      await this.dialogue('mission02', 'NextMission2');
      await this.fadeOut();
      this.setControl(true);
      this.completeEpisode(1);
    };
    this.rt.on(zones(this, 'warRoom'), e => { if (e.code === EVT.ENTER) ending(); });
    onAction(this, zones(this, 'toFloor'), ending);
  }
  async start() {
    this.addToParty('xavier');                      // Xavier leads the tour
    await this.dialogue('mission02', 'EnterSubbase');
    const tour = await this.dialogue('mission02', 'Start Tour 2');
    this.touring = tour === 1 || tour === 0;
    await this.objective(7, 2);
    await this.objective(2, 0);
  }
}

registerMission('e02m03', E02M03);
registerMission('e02m04', E02M04);
registerMission('e02m05', E02M05);
