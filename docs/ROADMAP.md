# Roadmap

Legend: ✅ done · 🚧 in progress · ⬜ todo

## M1 — Walk around a level
- ✅ assets.pkg loading (user supplied, cached in IndexedDB)
- ✅ Sprite, tileset, map and mission decoders
- ✅ Level renderer at 176×208 using the game's draw order (floor, then wall + objects per cell)
- ✅ Collision against the executable's polygon table, with axis sliding
- ✅ Hero spawned at the mission spawn zone, 8-way movement, idle/run animations, mission characters placed
- ⬜ Exact tick rate, move speed, facing → sprite row and mirroring (spec: core loop RE)
- ⬜ Camera behaviour matching the original
- ⬜ Animated tiles, doors (proximity open/close, collision 63/0, sounds)

## M2 — Combat
- ⬜ Character state machine (idle, run, melee combo m01/m02, hit h01, death d01, power s01–s04)
- ⬜ Melee hit detection and damage formulas (FORMATS.md)
- ⬜ Powers: energy, projectiles, emitter effects, area/arc targeting, DoT, buffs
- ⬜ Status effects
- ⬜ Enemy AI (sight/FOV, chase, attack, power use)
- ⬜ Particle system (emitters.cfg, traced simulation)
- ⬜ XP, level-ups, stat and skill points
- ⬜ Pickups, breakable objects (objects.odt), containers

## M3 — Missions
- ⬜ Zone triggers (enter/inside/exit)
- ⬜ Mission script framework (spawn, dialogue, objectives, doors, level transitions)
- ⬜ Per-mission scripts, tutorial → e25
- ⬜ Dialogue UI with MELP voice playback
- ⬜ Cutscene movies (XviD via ffmpeg.wasm or pre-converted), G.726 audio
- ⬜ Party of heroes, switching, AI teammates

## M4 — Front end & persistence
- ⬜ Title, main menu, options, credits (menus.txt, fonts)
- ⬜ HUD: health/energy, portraits, powers, damage numbers, notifications
- ⬜ Pause menus: stats, items/equipment, powers
- ⬜ Save/load (localStorage/IndexedDB), autosave
- ⬜ Localisation (_fr _gr _it _sp)

## M5 — Audio & polish
- ⬜ Sound banks (A-law) with positional mixing, sound sources
- ⬜ Music
- ⬜ Touch controls for mobile, scaling options
