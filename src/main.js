import { Assets } from './engine/assets.js';
import { Input } from './engine/input.js';
import { Game } from './game/game.js';

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
  const game = new Game(assets, $('#screen'), new Input());
  window.game = game;
  const params = new URLSearchParams(location.search);
  const mission = params.get('mission') || 'e01m01.mdd', hero = params.get('hero') || 'wolverine';
  status(`Loading ${mission}…`);
  const party = params.get('party') ? params.get('party').split(',') : [hero, 'cyclops', 'phoenix', 'rogue'].filter((k, i, a) => a.indexOf(k) === i).slice(0, 4);
  await game.loadMission(mission, hero, 1, party);
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
