import { Level, worldToScreen } from '../engine/level.js';
import { parseMission } from '../formats/map.js';
import { Character, TICK_MS, S } from './character.js';
import { Hud } from './hud.js';
import { Particles } from '../engine/particles.js';
import { Breakables } from './breakables.js';
import { Pickups, Inventory } from './pickups.js';
import { Dialogue } from './dialogue.js';
import { Voice } from '../audio/audio.js';
import { ScriptRuntime } from './script.js';
import { missionScriptFor } from './missions/index.js';
import './missions/e01m01.js';
import './missions/e01.js';
import './missions/e02.js';
import './missions/e03.js';
import './missions/e04.js';
import './missions/e05.js';
import './missions/e06e07.js';
import './missions/e08.js';
import './missions/e09e10.js';
import './missions/e11.js';
import './missions/e12e14.js';
import './missions/e15e17.js';
import './missions/e18e21.js';
import { EPISODES, partyForEpisode } from './progression.js';
import { QuickMenu } from './quickmenu.js';
import { PauseMenu } from './pausemenu.js';
import { snapshot, writeSave } from './save.js';
import { MoviePlayer } from './movie.js';

const randShake = k => Math.round((Math.random() * 2 - 1) * k);
export const SCREEN_W = 176, SCREEN_H = 208;   // N-Gage display

export class Game {
  constructor(assets, canvas, input) {
    this.assets = assets;
    this.canvas = canvas;
    this.g = canvas.getContext('2d');
    this.g.imageSmoothingEnabled = false;
    this.input = input;
    this.actors = [];
    this.floaters = [];
    this.accum = 0;
    this.movie = new MoviePlayer(this);
  }
  async playMovie(id) {
    this.loading = true;
    try { await this.movie.play(id); } finally { this.loading = false; }
  }
  async loadMission(mddName, heroKey = 'wolverine', spawnN = 1, partyKeys = null) {
    this.missionName = mddName;
    this.lastSpawn = spawnN;
    const mission = parseMission(await this.assets.bytes(mddName));
    this.mission = mission;
    this.level = await Level.load(this.assets, mission.map);
    this.actors = [];
    this.floaters = [];
    this.cam = null; this.camK = 0x1000; this.lead = null;
    if (!this.hud) this.hud = await Hud.load(this);
    if (!this.particles) this.particles = await Particles.load(this.assets);
    this.particles.active = [];
    if (!this.breakables) this.breakables = await Breakables.load(this);
    this.breakables.attach(this.level);
    this.pickups = new Pickups(this);
    if (!this.inventory) this.inventory = new Inventory();
    if (!this.itemIcons) this.itemIcons = await this.assets.sprite('items.spr');
    if (!this.itemNames) { this.itemNames = await this.assets.text('items.txt'); this.abilityNames = await this.assets.text('abilities.txt'); }
    this.notices = [];
    if (!this.dialogue) { this.dialogue = await Dialogue.load(this); this.voice = new Voice(this.assets); }
    if (!this.quick) this.quick = await QuickMenu.load(this);
    if (!this.pause) this.pause = await PauseMenu.load(this);
    this.time = 0;
    const spawn = mission.records.find(r => r.type === 4 && r.name.toLowerCase() === `spawn${spawnN}`) || mission.records.find(r => r.type === 4 && /^spawn/i.test(r.name)) || mission.records.find(r => r.type === 4) || { x: 300, y: 300 };
    const keys = partyKeys || this.partyKeys || [heroKey];
    this.partyKeys = [heroKey, ...keys.filter(k => k !== heroKey)].slice(0, 4);
    const offsets = [[50, 50], [-30, 90], [90, -30], [-40, -40]];
    for (let i = 0; i < this.partyKeys.length; i++) {
      const hero = await Character.create(this, this.partyKeys[i], spawn.x + offsets[i][0], spawn.y + offsets[i][1]);
      hero.team = 0; hero.name = this.partyKeys[i]; hero.isHero = true;
      this.actors.push(hero);
      if (i === 0) this.player = hero;
    }
    for (const r of mission.records.filter(r => r.type === 0)) {
      if (!this.assets.characters.get(r.kind.toLowerCase())) continue;
      if (this.partyKeys.includes(r.kind.toLowerCase())) continue;          // party members replace their placed copies
      const npc = await Character.create(this, r.kind, r.x, r.y);
      npc.name = r.name;
      this.actors.push(npc);
    }
    this.playerControl = true;
    this.fadeLevel = 0;
    this.objectiveList = this.objectiveList || [];
    if (!this.objectiveText) { this.objectiveText = await this.assets.text('objectives.txt'); this.scriptText = await this.assets.text('scripts.txt'); }
    this.script = new ScriptRuntime(this, mission);
    const Cls = missionScriptFor(mddName);
    this.missionScript = new Cls(this, this.script);
    this.missionScript.init();
    Promise.resolve().then(() => this.missionScript.start()).catch(e => console.error('mission start', e));
  }
  async spawnCharacter(key, x, y, name) {
    const c = await Character.create(this, key, x, y);
    c.name = name || key;
    this.actors.push(c);
    return c;
  }
  unlockHeroes(keys) { this.unlocked = new Set([...(this.unlocked || []), ...keys]); }
  removeActor(a) { this.actors = this.actors.filter(x => x !== a); }
  party() { return this.actors.filter(a => a.team === 0 && a.isHero); }
  async setObjective(index, state) {
    const existing = this.objectiveList.find(o => o.index === index);
    if (existing) existing.state = state; else this.objectiveList.push({ index, state });
    const text = this.objectiveText[index];
    if (text) this.notify(text, 90);
  }
  scriptMessage(index) { const t = this.scriptText && this.scriptText[index]; if (t) this.notify(t, 70); }
  itemNameByName(name) { const it = this.assets.items.find(i => i.name.toLowerCase() === name.toLowerCase()); return it ? this.itemName(it) : name; }
  fade(target) {
    return new Promise(res => { this.fadeTarget = target; this.fadeDone = res; });
  }
  async changeLevel(mdd, spawnN = 1) {
    const hero = this.player ? this.player.key : 'wolverine';
    this.loading = true;
    await this.loadMission(mdd.endsWith('.mdd') ? mdd : mdd + '.mdd', hero, spawnN);
    this.loading = false;
    writeSave(0, snapshot(this));
    this.notify('Auto-saved.', 40);
    this.fadeLevel = 1; this.fadeTarget = 0;
  }
  // CompleteEpisode (VA 0x10029d74): store party, advance the episode table, load its map at spawnN
  async completeEpisode(spawnN = 1) {
    // current episode: explicit, else by episode prefix of the current map (e01m02 -> table row starting e01)
    const cur = this.episode ?? EPISODES.findIndex(e => e.mdd.slice(0, 3).toLowerCase() === (this.missionName || '').slice(0, 3).toLowerCase());
    this.episode = Math.min(EPISODES.length - 1, Math.max(0, cur) + 1);
    const ep = EPISODES[this.episode];
    if (this.nextMovie) { const m = this.nextMovie; this.nextMovie = null; await this.playMovie(m); }
    const prevIdx = this.partyKeys.map(k => ['beast', 'colossus', 'cyclops', 'gambit', 'iceman', 'phoenix', 'magma', 'ncrawler', 'rogue', 'storm', 'wolverine'].indexOf(k));
    const keys = partyForEpisode(ep, prevIdx);
    this.loading = true;
    await this.loadMission(ep.mdd, keys[0], spawnN, keys);
    this.loading = false;
    writeSave(0, snapshot(this));
    this.fadeLevel = 1; this.fadeTarget = 0;
  }
  // switch controlled hero to the next living party member (SetActiveHero VA 0x10047c5c)
  switchHero() {
    const party = this.party().filter(a => a.alive);
    if (party.length < 2) return;
    const i = party.indexOf(this.player);
    this.player = party[(i + 1) % party.length];
    this.lead = null;
    const names = this.hud && this.player.def ? this.hud.names[this.player.def.nameId] : this.player.key;
    this.notify(names, 40);
  }
  itemName(item) {
    return (item.level ? this.abilityNames : this.itemNames)[item.stringIndex] || item.name;
  }
  notify(text, life = 60) { this.notices.unshift({ text, life }); this.notices.length = Math.min(this.notices.length, 3); }
  floatText(actor, text) {
    if (/^\d+$/.test(text) && this.hud) { this.hud.damage(actor, text); return; }
    this.floaters.push({ x: actor.x, y: actor.y, z: 90, text, life: 18 });
  }
  // D-pad -> facing angle, in the game's test order (VA 0x10012be8): diagonals first. Direction index * 0x80 = angle.
  readMove() {
    const i = this.input, U = i.isDown('up'), D = i.isDown('down'), L = i.isDown('left'), R = i.isDown('right');
    const dir = D && R ? 0 : U && R ? 2 : U && L ? 4 : D && L ? 6 : R ? 1 : U ? 3 : L ? 5 : D ? 7 : -1;
    return dir < 0 ? null : dir * 0x80;
  }
  // Camera (VA 0x1002ef48): lead offset by facing while moving, eased follow; snap on level start or far jumps
  updateCamera() {
    const p = this.player;
    const LEAD = [[60, 30], [60, 0], [60, -60], [0, -60], [-60, -60], [-60, 0], [-60, 30], [0, 30]];
    const moving = p.state === S.RUN || p.state === S.WALK;
    const lt = moving ? LEAD[(p.facing >> 7) & 7] : [0, -20];
    const lerp = (t, a, b) => b + (((a - b) * t) >> 12) + (a > b ? 1 : 0);
    this.lead = this.lead || [0, -20];
    this.lead = [lerp(0xff, lt[0], this.lead[0]), lerp(0xff, lt[1], this.lead[1])];
    const [sx, sy] = worldToScreen(p.x, p.y, p.z);
    const target = [Math.trunc(sx) + this.lead[0], Math.trunc(sy) + this.lead[1]];
    if (!this.cam || this.camK === 0x1000 || (target[0] - this.cam[0]) ** 2 + (target[1] - this.cam[1]) ** 2 > 400000) { this.cam = target; this.camK = 0x2ff; }
    else this.cam = [lerp(this.camK, target[0], this.cam[0]), lerp(this.camK, target[1], this.cam[1])];
  }
  update() {
    this.input.pollGamepad();
    if (this.frontend && this.frontend.active) { this.frontend.update(this.input); this.input.endFrame(); return; }
    if (this.dialogue && this.dialogue.active) {           // conversations pause the world
      this.dialogue.update(this.input);
      this.input.endFrame();
      return;
    }
    if (this.loading) { this.input.endFrame(); return; }
    if (this.pause && this.pause.update(this.input)) { this.input.endFrame(); return; }
    this.playMs = (this.playMs || 0) + TICK_MS;
    if (this.fadeTarget !== undefined && this.fadeTarget !== null) {
      this.fadeLevel += this.fadeTarget > this.fadeLevel ? 0.1 : -0.1;
      if (Math.abs(this.fadeLevel - this.fadeTarget) < 0.05) { this.fadeLevel = this.fadeTarget; this.fadeTarget = null; if (this.fadeDone) { const d = this.fadeDone; this.fadeDone = null; d(); } }
    }
    if (this.script) this.script.update(TICK_MS);
    if (this.playerControl && this.input.wasPressed('characters')) this.switchHero();
    const menuOpen = this.quick && this.playerControl && this.quick.update(this.input);
    if (menuOpen && this.hud) for (const a of this.party()) this.hud.portrait(a.key);
    const move = this.playerControl && !menuOpen ? this.readMove() : null;
    for (const a of this.actors) a.update(this.level, a === this.player ? move : null);
    for (const f of this.floaters) { f.life--; f.z += 3; }
    this.floaters = this.floaters.filter(f => f.life > 0);
    if (this.hud) this.hud.update();
    if (this.particles) this.particles.update(TICK_MS);
    this.time += TICK_MS;
    if (this.breakables) this.breakables.update();
    if (this.pickups) this.pickups.update();
    for (const n of this.notices || []) n.life--;
    if (this.notices) this.notices = this.notices.filter(n => n.life > 0);
    this.updateCamera();
    this.level.tick++;
    this.input.endFrame();
  }
  render() {
    const g = this.g;
    g.fillStyle = '#000';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    if (this.frontend && this.frontend.active) { this.frontend.draw(g); return; }
    if (!this.level) return;
    const p = this.player;
    if (!this.cam) this.updateCamera();
    let camX = this.cam[0] - SCREEN_W / 2, camY = this.cam[1] - SCREEN_H / 2;
    if (this.shake && performance.now() < this.shake.until) { camX += randShake(this.shake.strength); camY += randShake(this.shake.strength); }
    this.level.draw(g, camX, camY, SCREEN_W, SCREEN_H, [...this.actors.filter(a => a.state !== S.DEAD), ...(this.pickups ? this.pickups.list : [])]);
    if (this.particles) this.particles.draw(g, camX, camY);
    g.font = '7px monospace';
    g.textAlign = 'center';
    for (const f of this.floaters) {
      const [sx, sy] = worldToScreen(f.x, f.y, f.z);
      g.fillStyle = '#000'; g.fillText(f.text, sx - camX + 1, sy - camY + 1);
      g.fillStyle = '#ffd84a'; g.fillText(f.text, sx - camX, sy - camY);
    }
    if (this.hud) {
      this.hud.draw(g);
      if (this.quick) this.quick.draw(g);
      if (this.pause) this.pause.draw(g);
      if (this.fadeLevel > 0) { g.fillStyle = `rgba(0,0,0,${this.fadeLevel})`; g.fillRect(0, 0, SCREEN_W, SCREEN_H); }
      if (this.dialogue) this.dialogue.draw(g);
      (this.notices || []).forEach((n, i) => this.hud.fonts.arial.draw(g, n.text, SCREEN_W / 2, 150 - i * 11, { align: 'center', alpha: Math.min(1, n.life / 10) }));
    }
    if (!p.alive) { g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = '10px monospace'; g.fillText('DEFEATED', SCREEN_W / 2, SCREEN_H / 2); }
  }
  start() {
    let last = performance.now();
    const frame = now => {
      this.accum += Math.min(250, now - last);
      last = now;
      while (this.accum >= TICK_MS) { this.update(); this.accum -= TICK_MS; }
      this.render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}
