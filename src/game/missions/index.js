import { MissionScript, EVT } from '../script.js';

// Generic behaviour shared by all missions: containers give loot on action, single use (docs/specs/pickups.md).
export class BaseMission extends MissionScript {
  init() {
    const containers = [...Array(31)].map((_, i) => `container${i + 1}`);
    this.containerCount = 0;
    this.rt.on(containers, e => {
      if (e.code === EVT.ENTER) this.game.notify('[5]', 25);
      if (e.code !== EVT.ACTION) return;
      const table = this.containerLoot || [];
      const r = Math.floor(Math.random() * 100);
      const pick = r >= 97 ? table[0] : r >= 92 ? table[1] : r >= 82 ? table[2] : r >= 67 ? table[3] : (this.containerGuaranteed ? table[3] : null);
      if (pick && this.containerCount <= (this.containerCap ?? 6)) { this.giveItem(pick); this.game.notify(this.game.itemNameByName(pick)); }
      else this.message(0x9f);
      this.containerCount++;
      this.rt.disableZone(e.subject);
    });
  }
}

const registry = new Map();
export function registerMission(name, cls) { registry.set(name.toLowerCase(), cls); }
export function missionScriptFor(mddName) {
  const key = mddName.replace(/\.mdd$/i, '').toLowerCase();
  return registry.get(key) || BaseMission;
}
