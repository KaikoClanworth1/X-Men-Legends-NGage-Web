import { Assets } from './engine/assets.js';
import { Input } from './engine/input.js';
import { installTouchControls } from './engine/touch.js';
import { Game } from './game/game.js';
import { FrontEnd } from './game/frontend.js';
import { audioContext, settings, setVolume, setMuted, onVolumeChange } from './audio/audio.js';

// side volume slider (master volume + mute), kept in sync with the in-game Options
{
  const slider = document.querySelector('#volume-slider'), label = document.querySelector('#volume-value'), mute = document.querySelector('#volume-mute');
  const sync = () => {
    const v = Math.round(settings.master * 100);
    slider.value = v; label.textContent = settings.muted ? 'muted' : `${v}%`;
    mute.textContent = settings.muted || v === 0 ? '🔇' : v < 50 ? '🔉' : '🔊';
  };
  slider.addEventListener('input', () => { const v = slider.value / 100; if (settings.muted) setMuted(false); setVolume('master', v); try { audioContext(); } catch { /* no audio */ } });
  mute.addEventListener('click', () => { setMuted(!settings.muted); sync(); });
  // hand keyboard focus back to the game after using the controls
  slider.addEventListener('change', () => slider.blur());
  mute.addEventListener('mouseup', () => mute.blur());
  for (const el of [slider, mute]) el.addEventListener('keydown', e => e.stopPropagation());
  onVolumeChange(sync);
  sync();
}

// browsers only start audio after a user gesture
for (const ev of ['keydown', 'pointerdown']) window.addEventListener(ev, () => { try { audioContext(); if (window.game) window.game.updateMusic(true); } catch { /* no audio */ } }, { once: true });

const $ = s => document.querySelector(s);
const status = t => { $('#status').textContent = t; };

// Remember the user's assets.pkg between visits (browser-local only).
const DB = 'xml-web', STORE = 'files';
function idb(mode, fn) {
  return new Promise((ok, err) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => { const tx = req.result.transaction(STORE, mode); const r = fn(tx.objectStore(STORE)); tx.oncomplete = () => ok(r && r.result); tx.onerror = () => err(tx.error); };
    req.onerror = () => err(req.error);
  });
}

async function boot(buffer) {
  status('Loading game data…');
  const assets = new Assets(buffer);
  await assets.loadTables();
  const input = new Input();
  installTouchControls(input);
  const game = new Game(assets, $('#screen'), input);
  window.game = game;
  const params = new URLSearchParams(location.search);
  const mission = params.get('mission'), hero = params.get('hero') || 'wolverine';
  if (mission) {                              // dev shortcut: jump straight into a mission
    status(`Loading ${mission}…`);
    const party = params.get('party') ? params.get('party').split(',') : [hero, 'cyclops', 'phoenix', 'rogue'].filter((k, i, a) => a.indexOf(k) === i).slice(0, 4);
    await game.loadMission(mission, hero, 1, party);
  } else {
    game.frontend = await FrontEnd.load(game);
  }
  $('#setup').hidden = true;
  status('');
  game.start();
}

async function tryStored() {
  try {
    const buf = await idb('readonly', s => s.get('assets.pkg'));
    if (buf) return boot(buf);
  } catch (e) { console.warn(e); }
  try {
    const r = await fetch('assets.pkg');
    if (r.ok) return boot(await r.arrayBuffer());
  } catch { /* not served next to the game */ }
  status('Choose your assets.pkg (system/apps/6R54/assets.pkg) to start.');
}

$('#file').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  const buf = await f.arrayBuffer();
  try { await idb('readwrite', s => s.put(buf, 'assets.pkg')); } catch (err) { console.warn('could not cache assets', err); }
  boot(buf).catch(err => status('Error: ' + err.message));
});

tryStored().catch(err => status('Error: ' + err.message));
