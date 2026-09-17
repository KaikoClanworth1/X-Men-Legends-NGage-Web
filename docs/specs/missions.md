# X-Men Legends (N-Gage proto) — mission scripting framework

Binary: `6R54.app`, VA = 0x10000000 + file_off − 0x7C. All addresses below are VAs.
Confidence tags: **[C]** confirmed by reading the consumer code, **[L]** likely (consumer partly read + usage context), **[?]** unknown/guess.

Tools in this folder:
* `lift.py` — annotated disassembly per mission (`lift/<mission>.txt`), uses `names.txt`.
* `pseudo.py` — register-tracking "decompiler-lite" (`pseudo/<mission>.txt`): API calls with literal args, handler table, vtable slots, switch cases.
* `dlgdump.py` → `dlg/<file>.dlg.txt` (labels, lines, choices, END result codes).
* `mdddump.py` → `mdd/<file>.mdd.txt` (records: characters, zones, pickups, sounds).
* `names.txt` — address → API name map (single source of truth for names).

## 1. Architecture

```
Game --(per frame)--> ScriptMission (C++ object, one class per .mdd)
   ScriptMission::field0 = Api*            (the "api" object; every Api:: call gets r0 = this->api)
   Api --post message--> msg queue (0x1001bd40 serializer, same path as the network/replay layer)
       --> dispatcher 0x1001d004 (table 0x100f72bc, wire type → handler) --> Level/UI/Character objects
```
Every Api call is **asynchronous**: it serialises a message (post type T, sub-code S) which is executed at the start of the next game tick. Queries (FindEntityId, IsInParty, HasItem…) are synchronous.

### Mission registry
`0x1001a764` registers `name → factory` via `0x100500a8` for 62 names (`e01m01` → 0x10054ef0 … `tutorial` → 0x100a3288, `demo1..3`, cutscene maps `e01cXJ`, `e06cXJ`, `e12cMI`, `e16cMI`, `e22cMI`, `e25cMA`). When an .mdd is loaded the script whose name equals the mdd base name is instantiated.

Factory: `new(size)` → ctor (`Script::ctor 0x10027c34` then `this->vtable(+0xC4) = <mission vtable>`).

### ScriptMission layout / vtable (+0xC4)
| slot | base impl | meaning |
|---|---|---|
| [2] | 0x10027cbc | destructor |
| [3] | pure | **Init**: RegisterHandlers, LoadDialogueFile, LoadSoundBank, AddSaveVar, loot tables, timers, initial AI/team flags |
| [4] | 0x10027d58 (empty) | **OnStart**: called when the level becomes playable (first entry / after load). Usually camera set-up + `FadeIn(cb)` |
| [5] | 0x10027d5c = `FadeIn(null)` | **OnLoaded / OnResume** (rarely overridden) |

Fields: `+0x00 api`, `+0x04..0x0C handler table (cap, count, array of {name(20), ptmf})`, `+0x10..0x18 save-var list`, `+0x1C..0xBB 8 timers (20 bytes each)`, `+0xBC/+0xC0 two generic ints (Get/SetVarBC/C0)`, `+0xC4 vtable`, `+0xC8…` mission-specific state (`this.fXX` in pseudo).

### Handlers / events  [C]
`Script::RegisterHandler(name, ptmf)` (0x10027f20) binds a **record name from the .mdd** (zone, character, pickup, spawned entity, or the special name `"map"`) to a member function. `"NULL"` is registered first by every mission (dummy).
Game objects keep their handler index; events are delivered through `Script::DispatchEvent 0x10028078` as `handler(this, Event* evt)`:

```
struct Event { Entity* subject; Entity* other; int code; int a; int b; }
```
| code | source | meaning |
|---|---|---|
| 0 | zone 0x100136e8 / character proximity 0x1000c170 | party member **entered** zone / came within 200 units of an NPC |
| 2 | zone / NPC | **action button** pressed while inside (zones with the "…") — used for doors, `toXXX` transitions, talking to NPCs |
| 3 | zone / NPC | **left** zone / walked away |
| 4 | character 0x1000e7xx-e9xx | character **defeated** (HP reached 0; if `SetUnkillable` was set it is knocked to 1 HP instead but the event still fires) |
| 5 | character 0x1000e41c | **walk finished** (after `WalkToTile`/`WalkTo`) |
| 6 | map 0x10025ab4 (name `"map"`) | **breakable wall/tile destroyed**; `evt.a`,`evt.b` = tile x,y |
| 7 | character 0x100105e0 | **item picked up** (type-2 pickup record; subject = picker) |

Handlers usually test `strcmp(Entity::GetName(evt.subject), "name")` because one function is shared by several records.

### Timers  [C]
8 slots. `Script::SetTimerCallback(slot, cb)` 0x10028210 (once, in Init), `Script::StartTimer(slot, ms, repeat)` 0x10028270, `Script::StopTimer(slot)` 0x100282d8. Updated by `0x10027d70` each frame; callbacks `cb(this)`.

### Save state  [C]
`Script::ReserveSaveVars(n)` 0x1002811c, `Script::AddSaveVar(&this.fXX)` 0x100281b8 — the listed int fields (plus active timers) are written by `0x100283ac` / restored by `0x100284b8` into the save game / level-transition state. Everything a JS port must persist per mission = these fields.

### Callbacks (async sequencing)  [C]
`StartDialogue`, `FadeIn`, `FadeOut` take `(owner, member-function)`; the function is called when the dialogue ends (`cb(this, resultCode)`; result = END node code in the .dlg) or the fade completes (`cb(this)`). Cinematics are written as a **step counter + switch**: `step(){ switch(this.fN){case 0:… StartDialogue(…, next)} }` and `next(){ this.fN++; step(); }`.

## 2. API reference (r0 = api unless stated)

### Handlers, timers, save (Script::, r0 = mission)
| VA | name | notes |
|---|---|---|
| 0x10027e34 | ReserveHandlers(n) | [C] |
| 0x10027f20 | RegisterHandler(recordName, fn) | [C] |
| 0x10028078 | DispatchEvent(idx, Event*) | [C] engine → script |
| 0x1002811c / 0x100281b8 | ReserveSaveVars(n) / AddSaveVar(&field) | [C] |
| 0x10028210 / 0x10028270 / 0x100282d8 | SetTimerCallback(slot, fn) / StartTimer(slot, ms, repeat) / StopTimer(slot) | [C] |
| 0x10028360 | GetPartyMemberId(slot 0..3) → entity id or -1 | [C] |
| 0x10028314 | GetPartyMemberName(slot) → char* | [C] |
| 0x100285b8/c0/c8/d0 | Get/SetVarC0, Get/SetVarBC | [C] generic ints |

### Entities
| VA | name | notes |
|---|---|---|
| 0x10028c00 | FindEntityId(name) → id / -1 | [C] mdd lookup 0x10024784 |
| 0x100296ac | GetEntity(id) → Entity* | [C] |
| 0x10013360 / 0x10013368 / 0x10013370 / 0x10013378 / 0x10013380 | Entity::GetId / GetType (0 char, 2 pickup, 3 emitter, 4 zone, 5 sound) / GetName / GetTypeKey / GetPos(&x,&y,&z) | [C] |
| 0x10028c24 | SpawnEntity(name, key, recordType, x, y, z, dir) → id | [C] post 3 → 0x1001d378: creates mdd record (type 0 = character with `key` from characters.cdt, 2 = item pickup `key` = item name) and places it |
| 0x10028e28 | SpawnEmitter(name, emitterName, x, y, z, duration) | [L] post 4 → 0x1001d4a8, type-3 record from emitters.cfg |
| 0x10028c98 / 0x10028cbc | RemoveEntity(name) / RemoveEntityId(id) | [C] post 6; also disables the record (flag 0x20) |
| 0x1002a4f8 / 0x1002a4a4 | Teleport(name, x, y, dir) / TeleportId | [C] sub 0x18 → 0x100276d0 (world units; tiles ×100) |
| 0x1002a220 / 0x1002a1a8 | WalkToTile(name, tx, ty, finalDir) / Id | [C] sub 0x0B → 0x10027740: path-walk to tile centre (tx*100, ty*100), fires event 5 on arrival; dir −1 = keep |
| 0x1002a2d8 / 0x1002a270 | WalkTo(name, x, y, finalDir) / Id | [C] same, world coords |
| 0x10029fa8 / 0x10029fd4 | SetFacing(name, dir 0..7) / Id | [C] sub 0x0C (walk to own position with facing) |
| 0x1002a050, 0x1002a090, 0x1002a0c0, 0x1002a0ec | FaceEntity(name, target) (+ id variants) | [C] atan2 0x100a9cac → 8-way dir |
| 0x1002a3c0 / 0x1002a384 | SetAlly(name) / Id | [L] post 0xF sub 0: flags |= 2 (player team), clears 0x4000 |
| 0x1002a424 / 0x1002a3e4 | SetNeutral(name) / Id | [L] sub 1: flags |= 0x4000 (non-combatant, ignores/ignored, no damage), clears 2 |
| 0x1002a480 / 0x1002a448 | SetEnemy(name) / Id | [L] sub 2: clears both (normal hostile AI) |
| 0x1002a654 / 0x1002a61c | SetBossFlag(name) | [L] sub 3: flags |= 0x40 (used on named villains; affects level/XP stats) |
| 0x1002a578 / 0x1002a540 | SetUnkillable(name, on) | [C] sub 4: flag 0x8000 — at 0 HP stays at 1 HP (event 4 still fires) |
| 0x1002a5e8 / 0x1002a5a4 | SetHealth(name, hp) | [C] sub 5 → 0x1000e170 |
| 0x1002a6b8 / 0x1002a680 | SetFieldF0(name, v) | [?] sub 6: char+0xF0 |
| 0x1002a71c / 0x1002a6e4 | SetFlag400(name, on) | [?] sub 7: flag 0x400, AI related (set on patrol grunts `mp1..` and scripted spawns) |
| 0x1002a888 / 0x1002a8b4 | SetActionPrompt(name, on) | [L] sub 8: counter +0x100; scripts call it with the zone subject on enter(1)/exit(0) so the action button fires event 2 |
| 0x10029c88 / 0x10029c38 | SetEntityLevel(name, level, refill) | [C] sub 9/10 → 0x1000e578 (max 45) (+ full HP/EP if refill) |
| 0x10029bf8 | SetCharTypeLevel(charKey, level, refill) | [C] sub 8/9 → 0x10027418: all characters with that key |
| 0x1002a360 / 0x1002a328 | MakePartyTarget(name) | [L] sub 0x0E → 0x10027834: party AI engages that entity |
| 0x1002a780 / 0x1002a748 | PushAIGoal(name, goal) | [?] sub 0x0F → char AI stack 0x100081bc |
| 0x1002a7ec / 0x1002a7ac | PushAIGoal2(name, a, b) | [?] sub 0x10 → 0x10008268 |
| 0x1002a864 / 0x1002a82c | Kill(name) | [C] sub 0x11: HP 0, mortal, death anim |
| 0x10029a00 / 0x10029940 | ReviveIfDead(name) | [L] |
| 0x10028eec…0x100291cc | SpriteFxHide/Show, SetTint(r,g,b), SetTintAlpha(r,g,b,a), ClearTint | [L] post 8 → sprite colour/visibility (0x1000af18…ad74) |

### Party / inventory / progression
| VA | name | notes |
|---|---|---|
| 0x10029698 | GetPlayerEntity() → leader | [C] |
| 0x100296bc | IsInParty(charName) → bool | [C] |
| 0x100297c8 | AddToParty(entity) | [L] post 0xD sub 0 |
| 0x10029910 / 0x10029868 | RemoveFromParty(name) / Id | [L] sub 1 |
| 0x10029f3c | GiveItem(itemName) | [C] sub 0x0D → party inventory +1 |
| 0x10029e5c | RemoveItem(itemName) | [L] post 0xD sub 3 |
| 0x10029eec | HasItem(itemName) → bool | [C] |
| 0x10029f14 | HasItemCount(itemName, n) → bool | [L] |
| 0x10029ba4 | GiveQuestXP(xp) | [C] post 0xD sub 8 (pair with ShowPopupText(119..124 "…")) |
| 0x10029b6c | UnlockHero(heroIdx) | [C] sub 7 → campaign.availableHeroes |= 1<<idx; heroes: 0 Beast,1 Colossus,2 Cyclops,3 Gambit,4 Iceman,5 Phoenix(Jean),6 Magma,7 Nightcrawler,8 Rogue,9 Storm,10 Wolverine |
| 0x1002ad70 | RegisterQuestItem(itemName) | [?] sub 0x21 → campaign 4-slot list |
| 0x1002ace8 | AddObjective(objIdx, popup) | [C] sub 0x1C state 1; popup → ShowPopupText(117 "…") |
| 0x1002ac94 | SetObjective(objIdx, state, popup) | [C] state 2 = completed; popup → ShowPopupText(118 "…") |
| 0x1002ad34 | RemoveObjective(objIdx) | [C] |
| 0x10029cc0 | **ChangeLevel(mddBaseName, spawnN)** | [C] post 2 → 0x10027538: loads `<name>.mdd`, party placed at zone record `spawn<N>` (N=0 → default), autosave flag set |
| 0x10029d74 | **CompleteEpisode(spawnN)** | [C] sub 0x0A → 0x10027674 → main loop 0x1002ebd0: stores party into campaign record (0x1002d930), **episode index++**, loads `EpisodeTable[idx].mdd` at `spawn<N>`, plays pending movie, autosaves ("Autosave") |
| 0x10029d04 | SetNextMovie("mv_NN") | [C] sub 0x19 → campaign+0x40, played on the next level transition |
| 0x10029d3c | PlayMovieNow("mv_NN") | [L] sub 0x1A → UI 0x10030558 |

### Dialogue / text / HUD
| VA | name | notes |
|---|---|---|
| 0x10028820 | LoadDialogueFile(name, slot) | [C] sub 0 → loads `<name>.dlg` (language suffix added) into slot 0..2 |
| 0x100288dc | **StartDialogue(label, owner, cb, slot)** | [C] finds label in slot's dlg (0x10049c20); on end calls `cb(owner, result)` (0x10028998) |
| 0x10028878 / 0x10028858 | SetDialogueSpeakerEntity(entity) / Name | [L] sets "…" speaker to the given party member |
| 0x10028a14 | ShowPopupText(scriptsIdx) | [C] sub 2: centre popup, `scripts.txt` line |
| 0x10028a4c | ShowMessage(scriptsIdx, on) | [C] sub 0x1D: on=1 adds line to the 4-slot HUD message list (e.g. 0 "…", 158 container prompt), on=0 removes it |
| 0x10028a84 | ClearMessages() | [C] |
| 0x10028ab8 / 0x10028b04 / 0x10028b48 / 0x10028b80 | StartCountdown(sec) / AddCountdownTime(sec) / SetTimerDisplay3 / HideCountdown | [L] HUD timer 0x10032a64 |
| 0x1002a8ec | SetHudVisible(on) | [L] level+0x80 |
| 0x10028780 | SetCinematicMode(on, force) | [L] level+0x81 (0/1/2) — letterbox/HUD-off while on |
| 0x10029660 | SetPlayerControl(enabled) | [C] sub 6 → 0x100273d0 (player input + leader flag 0x20000) |
| 0x100287e8 | SetUIFlag27(on) | [?] |

### Camera / screen / audio
| VA | name | notes |
|---|---|---|
| 0x10029520 | CameraPanTo(x, y, speed) | [C] sub 0x13 → 0x10027270 (speed 0x2ff typical, 0x1000 = instant) |
| 0x100295a8 | CameraFollowPlayer(speed) | [C] sub 0x16 |
| 0x100295e8 / 0x1002961c | CameraFollowEntity(name, speed) / Id | [C] sub 0x15 |
| 0x10029560 | CameraShake(intensity, durationMs) | [C] sub 0x14 → 0x100273a0 (18-step offset table 0x100f7744) |
| 0x100292ac / 0x10029230 | FadeIn(owner, cb) / FadeOut(owner, cb) | [L] post 0x10 sub 1/0 |
| 0x100293b4 / 0x1002932c | FadeInColor / FadeOutColor(r,g,b, owner, cb) | [L] |
| 0x10029440 / 0x100294ec | ScreenFx2 / CameraReset | [?] post 0x10 sub 2/3 |
| 0x10028df0 | LoadSoundBank("x.swb") | [C] sub 0x1B |
| 0x10028d80 | PlaySound(soundName, a, b) | [?] sub 5 (name looked up in level sound list) |
| 0x1002add8 | SetZoneTriggerLimit(zoneName, max, reset) | [C] sub 0x1F → zone+0x8C |

### Loot tables
`AddLootEntry(item, chancePct)` 0x1002ae40 accumulates; `ApplyLootToObjectType(objectsOdtName)` 0x1002ae98 or `ApplyLootToEntity(charKey)` 0x1002aeb0 assigns the accumulated list and clears it. [C]

### Map tiles (post 0x11 → 0x1001e664 → map 0x100ab***)  [?]
`MapSet0(x,y,v)` 0x1002a9c0, `MapSet1(x,y,v)` 0x1002ab78, `MapSet3(x,y)` 0x1002abc0, `MapSet4/5/6/7/8` — tile/collision edits used after walls break or doors/force-fields open (e.g. e01m01 "map" handler: MapSet3(tile) + MapSet0 on the wall tiles). `MapGetTile(x,y)` 0x1002aa1c, `MapQuery_ab304` 0x1002a958 are synchronous reads.

## 3. Episode progression table (0x100f8604, 28 × 24 bytes)

`{char* mdd; u32 heroSlot[4] (11 = free choice); u8 minLevel?; u8 ?; u16 lockedHeroMask}` — `CompleteEpisode` does `idx++` and loads `table[idx].mdd`; team-select uses the 4 forced slots and the mask (bit = hero index, set = not selectable). New game starts at idx 1 (`e01m01`, spawn 1, movie `mv_01`); idx 0 = `tutorial.mdd` (Danger Room).

| idx | mdd | forced heroes | byte14 | locked mask |
|---|---|---|---|---|
| 0 | tutorial | Wolverine, –, –, – | 2 | 0 |
| 1 | e01m01 | Wolverine, Cyclops, Iceman, Rogue | 1 | 0 |
| 2 | e02m03 | Magma, Phoenix, Storm, Rogue | 6 | 0x49F |
| 3 | e03m06 | free | 6 | 0x04A |
| 4 | e04m11 | Magma + 3 free | 7 | 0x09F |
| 5 | e05m07 | free | 7 | 0x04A |
| 6 | e06m12 | free | 9 | 0x042 |
| 7 | e07m13 | Phoenix + 3 free | 11 | 0x042 |
| 8 | e08m11 | Magma, Wolverine, Storm, Cyclops | 14 | 0 |
| 9 | e09m16 | free | 14 | 0x002 |
| 10 | e10m12 | Magma + 3 free | 15 | 0x006 |
| 11 | e11m11 | Magma, Storm, Phoenix, Iceman | 15 | 0x58F |
| 12 | e11m11 | Phoenix + 3 free | 15 | 0x001 |
| 13 | e11m05 | Magma, Storm, Phoenix, Iceman | 15 | 0x58F |
| 14 | e12m18 | Cyclops, Wolverine, free, free | 16 | 0 |
| 15 | e13m05 | Cyclops, Wolverine, free, free | 19 | 0 |
| 16 | e14m05 | Magma, Iceman, Wolverine, Storm | 19 | 0 |
| 17 | e15m09 | free | 19 | 0 |
| 18 | e16m21 | free | 20 | 0 |
| 19 | e17m03 | Magma + 3 free | 21 | 0x62D |
| 20 | e18m01 | free | 21 | 0 |
| 21 | e19m09 | free | 22 | 0 |
| 22 | e20m12 | free | 24 | 0 |
| 23 | e21m05 | Magma, Storm, Colossus, Rogue | 26 | 0 |
| 24 | e22m22 | free | 26 | 0 |
| 25 | e23m05 | Magma + 3 free | 29 | 0x40D |
| 26 | e24m24 | Phoenix, Magma, free, free | 29 | 0 |
| 27 | e25cMA | Magma, Wolverine, Rogue, Gambit | 40 | 0 |

(byte14 is returned by 0x10052868 to the team-select screen; it grows 1→40 and is most likely the recommended/auto-level for recruits — [?].)

## 4. Level graph (from ChangeLevel / CompleteEpisode calls)
- tutorial (Danger Room, idx 0).
- E1: e01m01 -(toRooftops, spawn1)-> e01m02 (rooftops; back ->e01m01 spawn2; unlocks Storm, Rogue, Wolverine, Cyclops, Iceman) -> e01cXJ (X-Jet cutscene, dlg InXJet) -> CompleteEpisode, movie mv_02.
- E2: e02m03 (mansion hub) <-> e02m04 (spawn1/2), e02m11 (spawn1); e02m03 -> e02m05 -> CompleteEpisode. Unlocks Phoenix, Storm.
- E3: e03m06 -> mv_02, complete.  E4: e04m03 <-> e04m11, e04m05 -> mv_03, complete (unlock Nightcrawler).
- E5: e05m07 <-> e05m08 <-> e05m09 <-> e05m10 -> complete (unlock Gambit).  E6: e06m12 -> e06cXJ -> mv_04, complete.
- E7: e07m13 -> e07m14 (mv_05) -> e07m15 -> mv_06, complete.  E8: e08m03 <-> e08m11, e08m03 <-> e08m05 <-> e08m01 -> complete (unlock Magma).
- E9: e09m16 <-> e09m17 (spawn2/3) -> complete.  E10: e10m12 (Forge) -> mv_02, complete (unlock Colossus).
- E11: e11m03 <-> e11m05, e11m11 -> e11m03; CompleteEpisode(1|2).  E12: e12m18 <-> e12m19 <-> e12m20 -> e12cMI -> complete.
- E13: e13m05 -> e13m11 -> complete.  E14: e14m05.  E15: e15m08 <-> e15m09 <-> e15m10.  E16: e16m21 -> e16cMI -> mv_09.
- E17: e17m03 -> e17m05.  E18: e18m01 <-> e18m02.  E19: e19m09 <-> e19m10 (spawn2/3).  E20: e20m12 (mv_02).  E21: e21m05.
- E22: e22m22 <-> e22m23 -> e22cMI.  E23: e23m05 -> mv_11.  E24: e24m24 <-> e24m25 (mv_13/mv_14 reloads spawn4/5) <-> e24m26 (mv_12) -> mv_02, complete -> E25: e25cMA (mv_15, final).
Transition rules: `to*`/`nextlevel`-style zones fire event 2 (action) -> FadeOut -> ChangeLevel(mdd, spawnN); the party appears at zone record `spawn<N>` of the target mdd. CompleteEpisode(N) advances the episode table (section 3) and uses spawn N; pending movie (SetNextMovie) plays during the transition; autosave is written.
