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
const progress = game => (game.episodeVars ||= {});

// Episode 20, New York streets (pseudo e18m01)
export class E18M01 extends BaseMission {
  init() {
    super.init();
    onEnter(this, zones(this, 'smellSomething'), async () => {
      if (!once(this, 'smell')) return;
      await this.dialogue('mission18', 'Wolverine-1');
      await this.objective(29, 0);
    });
    exit(this, ['toRooftops'], 'e18m02', 1, () => !progress(this.game).sabretoothDone);
  }
  async start() {
    if (!once(this, 'started')) return;
    if (this.game.lastSpawn === 2 && progress(this.game).sabretoothDone) {
      this.setControl(false);
      await this.objective(28, 2);
      await this.dialogue('mission18', 'Morlocks');
      await this.fadeOut();
      this.setControl(true);
      this.completeEpisode(1);
      return;
    }
    await this.dialogue('mission18', 'Intro-1');
    await this.objective(28, 0);
  }
}

// Episode 20, rooftops: Sabretooth (pseudo e18m02)
export class E18M02 extends BaseMission {
  init() {
    super.init();
    this.setUnkillable('sabretooth');
    this.rt.on('sabretooth', async e => {
      if (e.code === EVT.ENTER && once(this, 'meet')) { await this.dialogue('mission18', 'Sabretooth-1'); this.setEnemy('sabretooth'); }
      if (e.code === EVT.DEFEATED && once(this, 'down')) {
        this.setNeutral('sabretooth');
        await this.dialogue('mission18', 'Wolverine-3');
        await this.objective(29, 2);
        progress(this.game).sabretoothDone = true;
      }
    });
    exit(this, ['toStreets'], 'e18m01', 2);
  }
}

// Episode 21, Morlock healer and Marrow (pseudo e19m09)
export class E19M09 extends BaseMission {
  init() {
    super.init();
    this.setUnkillable('marrow');
    this.rt.on('healer', async e => {
      if (e.code !== EVT.ENTER) return;
      if (once(this, 'metHealer')) { await this.dialogue('e19m09', 'meethealer'); await this.objective(30, 0); }
      else if (progress(this.game).tunnelerDone && once(this, 'thanked')) {
        await this.dialogue('e19m09', 'healerthanks');
        await this.objective(30, 2);
        this.giveItem('super med pack'); this.giveItem('eye drops');
      }
    });
    this.rt.on('marrow', async e => {
      if (e.code !== EVT.ENTER || !progress(this.game).tunnelerDone || !once(this, 'marrowTalk')) return;
      const r = await this.dialogue('e19m09', 'meetmarrow');
      if (r === 1) { this.setEnemy('marrow'); return; }
      await this.dialogue('e19m09', 'wisechoicemarrow');
      await this.objective(32, 2);
      this.giveItem('Energy Gem');
      await this.fadeOut();
      this.completeEpisode(1);
    });
    this.rt.on('marrow', async e => {
      if (e.code !== EVT.DEFEATED || !once(this, 'marrowDown')) return;
      this.setNeutral('marrow');
      await this.objective(32, 2);
      await this.fadeOut();
      this.completeEpisode(1);
    });
    exit(this, ['nextlevel'], 'e19m10', 1);
  }
  async start() {
    if (this.game.lastSpawn === 3 && once(this, 'returned')) await this.objective(32, 0);
  }
}

// Episode 21, tunnels with the GRSO tunnelling machine (pseudo e19m10)
export class E19M10 extends BaseMission {
  init() {
    super.init();
    onEnter(this, zones(this, 'attack'), () => { for (const a of this.game.actors) if (/^attacker/i.test(a.name || '') && a.team !== 1) a.team = 1; });
    this.rt.on('tunnellingmachine', async e => {
      if (e.code === EVT.ENTER) this.setEnemy('tunnellingmachine');
      if (e.code !== EVT.DEFEATED || !once(this, 'down')) return;
      await this.dialogue('e19m09', 'Tunneler-3');
      await this.objective(31, 2);
      progress(this.game).tunnelerDone = true;
      await this.fadeOut();
      this.changeLevel('e19m09', 3);
    });
    exit(this, ['prevlevel'], 'e19m09', 2);
  }
  async start() {
    if (!once(this, 'started')) return;
    await this.dialogue('e19m09', 'init');
    await this.objective(31, 0);
  }
}

// Episode 22, Muir Island: Juggernaut (pseudo e20m12)
export class E20M12 extends BaseMission {
  init() {
    super.init();
    this.setUnkillable('juggernaut');
    onEnter(this, zones(this, 'TalkToJugg'), async () => {
      if (!once(this, 'fight')) return;
      this.setEnemy('juggernaut');
    });
    this.rt.on('juggernaut', async e => {
      if (e.code !== EVT.DEFEATED || !once(this, 'juggDown')) return;
      this.setNeutral('juggernaut');
      await this.dialogue('Mission20', 'JuggySansPSI');
      await this.objective(33, 2);
      await this.objective(37, 0);
    });
    this.rt.on('forge', async e => { if (e.code === EVT.ENTER && once(this, 'forge')) await this.dialogue('forge', 'all'); });
    onEnter(this, zones(this, 'Leave'), async () => {
      if (!this.juggDown || !once(this, 'leaving')) return;
      await this.objective(37, 2);
      await this.fadeOut();
      this.completeEpisode(1);
    });
  }
  async start() {
    if (!once(this, 'started')) return;
    await this.dialogue('Mission20', 'EnterJuggy');
    await this.objective(33, 0);
  }
}

// Episode 23, Sentinel briefing (pseudo e21m05)
export class E21M05 extends BaseMission {
  async start() {
    if (!once(this, 'started')) return;
    this.setControl(false);
    await this.dialogue('mission21', 'Sentinels');
    await this.fadeOut();
    this.setControl(true);
    this.completeEpisode(1);
  }
}

registerMission('e18m01', E18M01);
registerMission('e18m02', E18M02);
registerMission('e19m09', E19M09);
registerMission('e19m10', E19M10);
registerMission('e20m12', E20M12);
registerMission('e21m05', E21M05);
