import { BaseMission, registerMission } from './index.js';
import { EVT } from '../script.js';

const zones = (script, ...prefixes) => script.rt.zones.map(z => z.rec.name).filter(n => prefixes.some(p => n.toLowerCase().startsWith(p.toLowerCase())));

// Episode 3: HAARP facility (docs/specs/missions/e03m06.md)
// Receptionist briefs -> rescue 10 scientists (objectives 38..47 count down, then 8 done, 9 added) ->
// receptionist gives the garage key -> garage exits -> villain ambush -> defeat -> CompleteEpisode(1).
export class E03M06 extends BaseMission {
  init() {
    super.init();
    this.containerLoot = ['small e pack', 'contacts', 'slumber bomb', 'small med pack'];
    this.containerCap = 7; this.containerGuaranteed = true;
    this.rescued = 0;
    for (const v of ['toad', 'avalanche', 'pyro', 'mystique']) { this.setNeutral(v); this.setUnkillable(v); }

    this.rt.on('receptionist', async e => {
      if (e.code !== EVT.ENTER || this.talking) return;
      this.talking = true;
      if (!this.briefed) {
        this.briefed = true;
        await this.dialogue('mission03', 'MeetReceptionist');
        await this.objective(38, 0);
      } else if (this.rescued >= 10 && !this.hasKey) {
        this.hasKey = true;
        await this.objective(9, 2);
        await this.dialogue('mission03', 'GiveKey');
        this.giveItem('garage key');
      } else if (!this.hasKey) {
        await this.dialogue('mission03', 'RescueMoreScientists');
      }
      this.talking = false;
    });

    for (let i = 1; i <= 10; i++) {
      this.rt.on(`scientist${i}`, async e => {
        if (e.code !== EVT.ENTER) return;
        const s = e.character;
        if (!s || s.rescued) return;
        s.rescued = true;
        s.team = 0;
        await this.walkToTile(s.name, 0x46, 0x2e);
        this.game.removeActor(s);
        this.rescued++;
        await this.objective(37 + this.rescued, 1);           // "(n remaining)" line completed
        if (this.rescued < 10) await this.objective(38 + this.rescued, 0);
        else { await this.objective(8, 2); await this.objective(9, 0); }
      });
    }

    this.rt.on(zones(this, 'garageDoor', 'ExitGarage'), async e => {
      if (e.code !== EVT.ENTER) return;
      if (!this.hasItem('garage key')) { this.message(0x9e); return; }
      if (this.ambush) return;
      this.ambush = true;
      for (const n of zones(this, 'garageDoor', 'ExitGarage')) this.rt.disableZone(n);
      await this.dialogue('mission03', 'ToadCheers');
      for (const v of ['toad', 'pyro', 'avalanche']) this.setEnemy(v);
    });

    const villainDown = async e => {
      if (e.code !== EVT.DEFEATED) return;
      (this.down ||= new Set()).add(e.subject.toLowerCase());
      this.setNeutral(e.subject);
      if (e.subject.toLowerCase() !== 'toad') this.remove(e.subject);
      if (['toad', 'pyro', 'avalanche'].every(v => this.down.has(v)) && !this.done) {
        this.done = true;
        await this.dialogue('mission03', 'MeetToad');
        this.kill('toad');
        await this.fadeOut();
        this.game.nextMovie = 'mv_02';
        this.completeEpisode(1);
      }
    };
    for (const v of ['toad', 'pyro', 'avalanche']) this.rt.on(v, villainDown);

    this.rt.on(zones(this, 'forcefield'), e => {
      if (e.code === EVT.ACTION) { this.rt.disableZone(e.subject); this.game.notify('[forcefield off]', 40); }
    });
  }
}

registerMission('e03m06', E03M06);
