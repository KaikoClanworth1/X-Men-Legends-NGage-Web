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
// attack zones turn every character whose record name starts with "attacker" hostile
const attackZones = script => onEnter(script, zones(script, 'attack'), () => {
  for (const a of script.game.actors) if (/^attacker/i.test(a.name || '') && a.team !== 1) a.team = 1;
});

// Episode 17, Morlock tunnels hub (pseudo e15m09)
export class E15M09 extends BaseMission {
  init() {
    super.init();
    this.rt.on('thief', async e => {
      if (e.code !== EVT.ENTER || !once(this, 'thiefTalk')) return;
      await this.dialogue('e15m09', 'thieftalking');
      await this.objective(24, 2);
      await this.objective(25, 0);
      if (!this.hasItem('genome analyzer')) this.giveItem('genome analyzer');
    });
    exit(this, ['nextlevel'], 'e15m10', 1);
    exit(this, ['prevlevel'], 'e15m08', 1);
  }
  async start() {
    if (this.game.lastSpawn !== 1 || !once(this, 'started')) return;
    this.setNeutral('thief');
    await this.dialogue('e15m09', 'init');
    await this.objective(24, 0);
  }
}

// Episode 17, healer's tunnels (pseudo e15m10)
export class E15M10 extends BaseMission {
  init() {
    super.init();
    attackZones(this);
    this.rt.on(['healer', ...zones(this, 'healer')], async e => {
      if (e.code !== EVT.ENTER || !this.hasItem('genome analyzer') || !once(this, 'healed')) return;
      await this.dialogue('e15m09', 'healerfungus');
      await this.objective(25, 2);
      await this.objective(26, 0);
      if (!this.hasItem('gateway room key')) this.giveItem('gateway room key');
    });
    exit(this, ['prevlevel'], 'e15m09', 2);
  }
}

// Episode 17, gateway chamber (pseudo e15m08): the key opens the gateway, which ends the episode
export class E15M08 extends BaseMission {
  init() {
    super.init();
    attackZones(this);
    onEnter(this, zones(this, 'gatewaylocked', 'doorlocked'), () => { if (!this.hasItem('gateway room key')) this.message(0x34); });
    onEnter(this, zones(this, 'gateway').filter(n => !/locked/i.test(n)), async () => {
      if (!this.hasItem('gateway room key') || !once(this, 'through')) return;
      await this.objective(26, 2);
      await this.dialogue('e15m09', 'throughgateway');
      await this.fadeOut();
      this.completeEpisode(1);
    });
    exit(this, ['prevlevel'], 'e15m09', 1);
  }
}

// Episode 18, Muir Island assault (pseudo e16m21)
export class E16M21 extends BaseMission {
  init() {
    super.init();
    this.setUnkillable('pyro');
    onEnter(this, zones(this, 'intro'), async () => {
      if (!once(this, 'intro')) return;
      await this.dialogue('e16m21', 'intro');
      await this.objective(27, 0);
      for (const n of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) this.setEnemy(`attackerstart${n}`);
    });
    attackZones(this);
    this.rt.on('pyro', async e => {
      if (e.code === EVT.ENTER && once(this, 'pyroTalk')) { await this.dialogue('e16m21', 'pyro'); this.setEnemy('pyro'); }
      if (e.code === EVT.DEFEATED) { this.pyroDown = true; this.setNeutral('pyro'); }
    });
    onEnter(this, zones(this, 'end'), async () => {
      if (!once(this, 'ending')) return;
      await this.objective(27, 2);
      await this.fadeOut();
      this.changeLevel('e16cMI', 1);
    });
  }
}

// Episode 18 epilogue on Muir Island (pseudo e16cMI)
export class E16CMI extends BaseMission {
  async start() {
    if (!once(this, 'started')) return;
    this.setControl(false);
    await this.dialogue('e16m21', 'Illyana-2');
    await this.fadeOut();
    this.game.nextMovie = 'mv_09';
    this.setControl(true);
    this.completeEpisode(1);
  }
}

// Episode 19, mansion (pseudo e17m03)
export class E17M03 extends BaseMission {
  init() {
    super.init();
    exit(this, ['Elevator', 'elevator'], 'e17m05', 1);
  }
  async start() {
    if (this.game.lastSpawn !== 1 || !once(this, 'started')) return;
    await this.dialogue('Mission17', 'Dear Diary');
    await this.dialogue('Mission17', 'Meet in War Room');
    await this.objective(2, 0);
  }
}

// Episode 19, War Room (pseudo e17m05)
export class E17M05 extends BaseMission {
  init() {
    super.init();
    exit(this, ['elevator'], 'e17m03', 2);
    onEnter(this, zones(this, 'warRoom', 'WarRoom'), async () => {
      if (!once(this, 'briefing')) return;
      this.setControl(false);
      await this.objective(2, 2);
      await this.dialogue('Mission17', 'juggernaut');
      await this.fadeOut();
      this.setControl(true);
      this.completeEpisode(1);
    });
  }
}

registerMission('e15m09', E15M09);
registerMission('e15m10', E15M10);
registerMission('e15m08', E15M08);
registerMission('e16m21', E16M21);
registerMission('e16cMI', E16CMI);
registerMission('e17m03', E17M03);
registerMission('e17m05', E17M05);
