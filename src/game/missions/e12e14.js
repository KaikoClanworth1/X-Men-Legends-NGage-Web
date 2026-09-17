import { BaseMission, registerMission } from './index.js';
import { EVT } from '../script.js';

const zones = (script, ...prefixes) => script.rt.zones.map(z => z.rec.name).filter(n => prefixes.some(p => n.toLowerCase().startsWith(p.toLowerCase())));
const once = (script, key) => (script[key] ? false : (script[key] = true));
const onEnter = (script, names, fn) => script.rt.on(names, e => { if (e.code === EVT.ENTER) fn(e); });
const exit = (script, prefixes, mdd, spawn) => script.rt.on(zones(script, ...prefixes), async e => {
  if (e.code === EVT.ENTER) script.game.notify('[5]', 25);
  if (e.code === EVT.ACTION) { await script.fadeOut(); script.changeLevel(mdd, spawn); }
});

// Episode 14, base entrance with Havok (pseudo e12m18)
export class E12M18 extends BaseMission {
  init() {
    super.init();
    this.setUnkillable('havok'); this.setAlly('havok');
    onEnter(this, zones(this, 'LookAround'), async () => { if (once(this, 'look')) await this.dialogue('Mission12', 'WhatHappened'); });
    onEnter(this, zones(this, 'OhLookAnElevator'), async () => { if (once(this, 'elevator')) await this.dialogue('Mission12', 'SecretElevator'); });
    exit(this, ['NextMap'], 'e12m19', 1);
  }
  async start() {
    if (this.game.lastSpawn !== 1 || !once(this, 'started')) return;
    await this.dialogue('Mission12', 'EnterWolverine');
    await this.objective(21, 0);
  }
}

// Episode 14, descent (pseudo e12m19)
export class E12M19 extends BaseMission {
  init() {
    super.init();
    this.setUnkillable('havok'); this.setAlly('havok');
    exit(this, ['GoBack'], 'e12m18', 2);
    exit(this, ['GoDown'], 'e12m20', 1);
  }
}

// Episode 14, prison level (pseudo e12m20): free prisoners, Havok and Sabretooth turn on the team
export class E12M20 extends BaseMission {
  init() {
    super.init();
    this.setUnkillable('havok'); this.setUnkillable('stooth'); this.setAlly('havok');
    this.freed = new Set();
    this.rt.on(zones(this, 'FreePrisoner'), e => {
      if (e.code === EVT.ENTER && !this.freed.has(e.subject)) this.game.notify('[5]', 25);
      if (e.code !== EVT.ACTION || this.freed.has(e.subject)) return;
      this.freed.add(e.subject);
      this.game.notify(`${this.freed.size}/10`, 40);
    });
    onEnter(this, zones(this, 'EnterBigRoom'), async () => {
      if (!once(this, 'betrayal')) return;
      await this.dialogue('Mission12', 'SabSpeak');
      this.setEnemy('havok'); this.setEnemy('stooth');
    });
    this.down = new Set();
    this.rt.on(['havok', 'stooth'], async e => {
      if (e.code !== EVT.DEFEATED) return;
      this.down.add(e.subject.toLowerCase());
      this.setNeutral(e.subject);
      if (this.down.size === 2 && once(this, 'ending')) {
        await this.objective(21, 2);
        await this.fadeOut();
        this.completeEpisode(1);
      }
    });
    exit(this, ['GoBack'], 'e12m19', 2);
  }
  async start() {
    if (this.game.lastSpawn !== 1 || !once(this, 'started')) return;
    await this.dialogue('Mission12', 'HavoksMission');
  }
}

// Episode 15, Magneto's message (pseudo e13m05)
export class E13M05 extends BaseMission {
  async start() {
    if (!once(this, 'started')) return;
    await this.dialogue('e13m05', 'magneto');
    await this.objective(22, 0);
    await this.fadeOut();
    this.changeLevel('e13m11', 1);
  }
}

// Episode 15, Sentinel attack with Magneto and Havok (pseudo e13m11)
export class E13M11 extends BaseMission {
  init() {
    super.init();
    for (const n of ['magneto', 'toad', 'havok']) this.setUnkillable(n);
    this.setAlly('magneto'); this.setAlly('havok');
  }
  async start() {
    if (!once(this, 'started')) return;
    await this.dialogue('e13m11', 'ceaseanddesist');
    await this.objective(22, 2);
    await this.objective(23, 0);
    const sentinels = this.game.actors.filter(a => /^sent/i.test(a.name || ''));
    for (const s of sentinels) s.team = 1;
    this.left = sentinels.length;
    const down = async e => {
      if (e.code !== EVT.DEFEATED) return;
      if (--this.left > 0 || !once(this, 'ending')) return;
      await this.dialogue('e13m11', 'violence');
      await this.objective(23, 2);
      await this.dialogue('e13m11', 'withdraw');
      await this.fadeOut();
      this.completeEpisode(1);
    };
    for (const s of sentinels) this.rt.on(s.name, down);
  }
}

// Episode 16, discussion (pseudo e14m05)
export class E14M05 extends BaseMission {
  async start() {
    if (!once(this, 'started')) return;
    this.setControl(false);
    await this.dialogue('mission14', 'Discussion');
    await this.fadeOut();
    this.setControl(true);
    this.completeEpisode(1);
  }
}

registerMission('e12m18', E12M18);
registerMission('e12m19', E12M19);
registerMission('e12m20', E12M20);
registerMission('e13m05', E13M05);
registerMission('e13m11', E13M11);
registerMission('e14m05', E14M05);
