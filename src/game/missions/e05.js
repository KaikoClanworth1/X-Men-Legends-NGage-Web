import { BaseMission, registerMission } from './index.js';
import { EVT } from '../script.js';

const zones = (script, ...prefixes) => script.rt.zones.map(z => z.rec.name).filter(n => prefixes.some(p => n.toLowerCase().startsWith(p.toLowerCase())));
const exit = (script, prefixes, mdd, spawn, guard = () => true) => script.rt.on(zones(script, ...prefixes), async e => {
  if (!guard()) return;
  if (e.code === EVT.ENTER) script.game.notify('[5]', 25);
  if (e.code === EVT.ACTION) { await script.fadeOut(); script.changeLevel(mdd, spawn); }
});
const once = (script, key) => (script[key] ? false : (script[key] = true));

// Episode 5, sewers entry (pseudo e05m07): opening conversation, ambush zones, exit to e05m08
export class E05M07 extends BaseMission {
  init() {
    super.init();
    this.rt.on(zones(this, 'attack'), e => {
      if (e.code !== EVT.ENTER) return;
      for (const a of this.game.actors) if (a.team === 2 && !a.isHero && !a.isNPC) a.team = 1;
    });
    exit(this, ['exit'], 'e05m08', 1);
  }
  async start() {
    if (this.game.lastSpawn !== 1 || !once(this, 'started')) return;
    await this.dialogue('e05m09', 'missionstart');
    await this.objective(6, 0);
  }
}

// Episode 5, sewer passages (pseudo e05m08): Gateway conversation at the locked doors
export class E05M08 extends BaseMission {
  init() {
    super.init();
    exit(this, ['nextlevel'], 'e05m09', 1);
    exit(this, ['prevlevel'], 'e05m07', 2);
    this.rt.on(zones(this, 'gatewaylockeddoor'), async e => {
      if (e.code === EVT.ENTER && once(this, 'gateway')) await this.dialogue('event', 'gatewayroom');
    });
  }
}

// Episode 5, Morlock tunnels (pseudo e05m09): meet Marrow, locked door opens, vendors trade quest
export class E05M09 extends BaseMission {
  init() {
    super.init();
    for (const n of ['marrow', 'healer', 'vendor1', 'vendor2', 'vendor3', 'vendor4', 'vendor5']) this.setNeutral(n);
    this.rt.on('marrow', async e => {
      if (e.code !== EVT.ENTER) return;
      if (once(this, 'metMarrow')) {
        await this.dialogue('e05m09', 'meetmarrow');
        this.rt.disableZone('lockeddoor2');
        await this.objective(6, 2);
        await this.objective(11, 0);
      } else await this.dialogue('e05m09', 'metmarrow');
    });
    // trading chain between vendors: pelts -> fruit -> ring/sword (simplified from the traced HasItem checks)
    this.rt.on('vendor1', async e => { if (e.code === EVT.ENTER && once(this, 'v1')) { await this.dialogue('e05m09', 'meetantique'); } });
    this.rt.on('vendor2', async e => {
      if (e.code !== EVT.ENTER) return;
      if (this.hasItem('large fur pelt') && once(this, 'v2')) { await this.dialogue('e05m09', 'antiquepelts'); this.giveItem('box of oranges'); }
    });
    this.rt.on('vendor3', async e => {
      if (e.code !== EVT.ENTER) return;
      if (this.hasItem('box of oranges') && once(this, 'v3')) { await this.dialogue('e05m09', 'antiquefruit'); this.giveItem('antique ring'); }
    });
    this.rt.on('vendor5', async e => {
      if (e.code !== EVT.ENTER || !once(this, 'v5')) return;
      await this.dialogue('e05m09', 'meetgroom');
      this.giveItem('large fur pelt');
    });
    this.rt.on(zones(this, 'lockeddoor'), async e => {
      if (e.code === EVT.ENTER && !this.metMarrow) await this.dialogue('e05m09', 'wontattack');
    });
    exit(this, ['nextlevel'], 'e05m10', 1, () => !!this.metMarrow);
    exit(this, ['prevlevel'], 'e05m08', 2);
  }
}

// Episode 5, Marrow's lair (pseudo e05m10): fight Marrow (unkillable), then the exit completes the episode
export class E05M10 extends BaseMission {
  init() {
    super.init();
    this.setUnkillable('marrow');
    for (const n of ['newchar1', 'newchar2', 'newchar3', 'newchar4', 'gambit', 'character32', 'character33']) this.setNeutral(n);
    this.rt.on(zones(this, 'cage'), e => {
      if (e.code !== EVT.ENTER || !once(this, 'fightStarted')) return;
      for (const n of ['marrow', 'character32', 'character33']) this.setEnemy(n);
    });
    this.rt.on('marrow', async e => {
      if (e.code !== EVT.DEFEATED || !once(this, 'marrowDown')) return;
      for (const n of ['marrow', 'character32', 'character33']) this.setNeutral(n);
      await this.dialogue('e05m10', 'marrowover');
      this.setLevel('gambit', this.game.player.level);
      this.setUnkillable('gambit');
      this.addToParty('gambit');
      await this.objective(11, 2);
      await this.objective(12, 0);
    });
    this.rt.on(zones(this, 'enddoor'), async e => {
      if (e.code === EVT.ENTER && !this.marrowDown) await this.dialogue('e05m10', 'doorlocked');
    });
    this.rt.on(zones(this, 'end').filter(n => /^end\d/i.test(n)), async e => {
      if (e.code !== EVT.ENTER || !this.marrowDown || !once(this, 'ending')) return;
      await this.objective(12, 2);
      await this.fadeOut();
      this.completeEpisode(1);
    });
    exit(this, ['prevlevel'], 'e05m09', 2);
  }
}

registerMission('e05m07', E05M07);
registerMission('e05m08', E05M08);
registerMission('e05m09', E05M09);
registerMission('e05m10', E05M10);
