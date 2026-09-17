# Pickups, drops, breakables and containers

Reverse-engineered from 6R54.app. VAs are addresses in the executable.

## RNG
`seed = (seed*15737 + 15149) & 0xFFFF` (state at `[Tls+0x10]`); percent rolls use `seed % 100`.

## Drop tables (mission script API)
Stored on the world object W: `W+0x6c` count, `W+0x70` array of `{u16 item code (items.idf +96), u16 weight}`.
- `0x1002ae40 AddDrop(script, itemName, pct)`: pct is capped at 100.
- `0x10025730` normalise: `w *= 0xFFFF / max(sum,100)`. Weights act as plain percentages; the remainder means "no drop".
- `0x100257ec` Roll: takes a u16 from the RNG and walks the running total → item code or 0.
- `0x1002ae98 → 0x100255c8 AssignToObject(odtName)`: rolls once per placed instance of that objects.odt type (stored at instance +0xe), then clears the table.
- `0x1002aeb0 → 0x100256ac AssignToCharacter(charName)`: rolls once per character with that name (stored at char +0x102), then clears the table.
- Mission 1 example (`0x100559d4`): mutpol small med pack 25 / smelling salts 10; barrel muscle relaxant 25 / air horn 25 / small med pack 15; wooden crate muscle relaxant 25 / antidote 25 / small med pack 15; metal crate eye drops 25 / small med pack 15 / smelling salts 5; lamppost muscle relaxant 25 / small med pack 15 / air horn 25; metal chair muscle relaxant 25 / ice pick 25 / small med pack 15; fire hydrant fire extinguisher 25 / small med pack 15; traffic cone small med pack 15 added twice (30).

## Enemy death drop
- The drop is pre-rolled when the table is assigned; nothing is rolled at death.
- When the death animation ends (`0x1000dbb4`, non-revivable): `0x100085f8 DropItem` reads +0x102. If non-zero it spawns a pickup at the character's position via `0x1000a478(level, code, x, y, z)` with flags=1 (pop up).
- Death also notifies the script callback `[char+0x40]` with event 4.

## Pickup entity (`ITEM_%i`, type 2, constructor 0x100220e8, 0xa8 bytes)
- Spawn flags: 1 = pop velocity (0,0,100); 2 = magnet to the attacker (+0xa0); 4 = 22-tick hold before moving (+0x88).
- Bounce factor 0x7fff/65536 (≈0.5); homing speed 10 (30 once homing); collision box ±20.
- Drawn with items.spr, frame = item record +0x59 (icon frame).
- Tick `0x100221f0`: while the hold is >0 it counts down and does nothing else. With an owner and z ≤ 4, if 1 ≤ distance ≤ 299: velocity = direction × speed, clamped to ±50. Gravity: vz -= 10 every tick. On hitting the ground: z = 0, vz reversed, velocity scaled by the bounce factor (horizontal not damped while homing).
- No despawn timer was found.
- Pickup on touch (`0x1001053c`). The character must be on a valid team, have +0x8c bit0 set and have an inventory.
  - Inventory full: 22-tick cooldown at +0x13c and message 0xa9; the item stays on the ground.
  - Otherwise: script event 7, the item is added to the inventory (category 0xd), and the entity is destroyed.
- No heal on pickup was found; items go into the inventory.

## Breakables (objects.odt)
Instances (`0x10024af4`, 24 bytes): +0 hit count, +1/+2 tile x/y, +3 flags (bit0 breakable when weight ≠ 0, bit1 explosion pending), +4 flash timer, +8 explosion time, +0xc node, +0xe drop code, +0x10 attacker, +0x14 record.

On hit (`0x100252bc`):
- The hit count goes up by 1.
- While hits < **weight class** (record +0x16 = hits to break): flash for 6 ticks and play the hit emitter (+0x1e).
- On break:
  1. Clear bit0 and set explode time = now + record +0x1a (**explosion delay in ms**; FORMATS.md calls this "hazard radius").
  2. If hazard damage (+0x18) is non-zero, set bit1 and store the attacker.
  3. If there is a drop, spawn the pickup with flags 5 (|2 if there is an attacker).
  4. Play the break emitter (+0x1c), hide the object, and show rubble.spr frame +0x17 (debris frame).

Explosion (`0x10024fc0`), once now > explode time:
- Hits the 3×3 surrounding tiles (`0x100ab39c`, probably chain breaks).
- If the attacker is a character: area damage at the tile centre with radius 400, damage min = max = **low byte** of +0x18, hostile. Fuel tank 300 → 44 (likely a bug; replicate for fidelity). No attacker means no area damage.

## containerN zones
- `container1..31` are registered per mission with `0x10027f20`.
- Handler events: 0 enter → highlight + prompt 0x9e; 3 leave → remove both; 2 use → roll.
- Use flow:
  1. If the per-mission counter ≤ cap, roll `seed%100` and pick an item by threshold (table below).
  2. Give it directly to the inventory (`0x10029f3c`); no world pickup is spawned.
  3. The counter goes up by 1.
  4. "Nothing" or over the cap → text 0x9f.
  5. The container is disabled (single use).

| Roll | Chance | Item |
|---|---|---|
| 97–99 | 3% | A |
| 92–96 | 5% | B |
| 82–91 | 10% | C |
| 67–81 | 15% | D |
| ≤ 66 | 67% | nothing |

- Seven-tier variant: adds 62–66 → E, 61 → F, 41–60 → G, ≤ 40 nothing.
- Guaranteed variant: the roll is clamped so it never gives nothing; it falls back to D.

Per-handler tables:

| Handler | Cap | A / B / C / D (/ E, F, G) |
|---|---|---|
| 0x10057720 | 6 | medium med pack / small e pack / air horn / small med pack |
| 0x1005b3c0 | 9 | smelling salts / healing dose / concussion bomb / small med pack (guaranteed, first-use tutorial) |
| 0x1005f254 | 7 | small e pack / contacts / slumber bomb / small med pack (guaranteed) |
| 0x10065430 | 8 | speed enhancer / small e pack / hypnobomb / small med pack |
| 0x1006694c | 2 | small e pack / caffeine dose / gas bomb / small med pack |
| 0x1006dff0 | 6 | energy dose / medium e pack / slumber bomb / medium med pack |
| 0x1006fbb0 | 6 | healing dose / energy dose / concussion bomb / gas bomb |
| 0x1007407c | 14 | int enhancer / energy dose / slumber bomb / medium med pack |
| 0x10075870 | 2 | medium e pack / fireproof suit / antidote / medium med pack |
| 0x10077580 | 2 | large med pack / medium e pack / speed enhancer / medium med pack |
| 0x10079bcc | 6 | large med pack / healing dose / medium e pack / hypnobomb |
| 0x1007dce0 | 8 | body enhancer / healing dose / gas bomb / large med pack |
| 0x1007edf4 | 2 | medium e pack / healing dose / energy dose / medium med pack |
| 0x10082898 | 9 | large med pack / energy dose / small e pack / medium med pack; E healing dose, F super med pack, G muscle relaxant |
| 0x10083d24 | 9 | as 0x10082898, but C concussion bomb and G slumber bomb |
| 0x1008e724 | 9 | super med pack / ribbon / strength enhancer / concussion bomb |
| 0x1008f538 | 2 | super med pack / large e pack / large med pack / concussion bomb |
| 0x1009095c, 0x10095c20 | 6 | super med pack / large e pack / large med pack / healing dose |
| 0x10099f38 | 2 | super med pack / large e pack / large med pack / gas bomb |
| 0x1009bd50 | 9 | super med pack / healing dose / medium e pack / large med pack; E riot gear, F Shield Generator, G energy dose |

Fixed-reward containers:

| Handler | Reward |
|---|---|
| 0x10063280 | Ice Gem / Gem of Insulation |
| 0x1006770c | Combat Shield |
| 0x100682f8 | large med pack |
| 0x100790ac | Gem of the Clouds |
| 0x1008675c | Genome Analyzer |
| 0x10099768 | Stasis Machine |
| 0x1009fa08 | Flare Gem |
| 0x100a1a20 | gem of the heavens |

## objects.odt fields (corrected)

| Object | id | Hits to break | Debris | Damage | Delay ms | Break fx | Hit fx | Flag |
|---|---|---|---|---|---|---|---|---|
| default | 1 | 0 | – | – | – | – | – | – |
| explosive barrel | 2 | 1 | 4 | 100 | 300 | 801 | 1005 | 1 |
| barrel | 3 | 1 | 2 | 0 | 0 | 1002 | 1005 | 2 |
| wooden crate | 4 | 1 | 0 | 0 | 0 | 1003 | 1005 | 1 |
| metal crate | 5 | 2 | 2 | 0 | 0 | 1002 | 1005 | 1 |
| plastic crate | 6 | 2 | 2 | 0 | 0 | 1002 | 1005 | 1 |
| lamppost | 7 | 3 | 3 | 5 | 200 | 1002 | 1005 | 1 |
| wooden chair | 8 | 1 | 1 | 0 | 0 | 1003 | 1005 | 1 |
| metal chair | 9 | 2 | 2 | 0 | 0 | 1002 | 1005 | 1 |
| side table | 10 | 1 | 2 | 0 | 0 | 1003 | 1005 | 2 |
| comp terminal | 11 | 3 | 3 | 20 | 500 | 1003 | 1005 | 2 |
| rock | 12 | 3 | 5 | 0 | 0 | 1001 | 1005 | 2 |
| fence | 13 | 2 | 1 | 0 | 0 | 1002 | 1005 | 2 |
| sewers pillar | 14 | 3 | 6 | 0 | 0 | 1001 | 1005 | 2 |
| fire hydrant | 15 | 2 | 2 | 5 | 200 | 1000 | 1005 | 2 |
| plant | 16 | 1 | 1 | 0 | 0 | 158 | 1005 | 2 |
| fuel tank | 17 | 2 | 4 | 300 | 300 | 158 | 1005 | 1 |
| pottery | 18 | 1 | 1 | 0 | 0 | 1001 | 1005 | 0 |
| traffic cone | 19 | 2 | 7 | 0 | 0 | 159 | 1005 | 1 |

## Unknowns
- Which .mdd each container handler belongs to (the script RE will map it).
- Whether world items ever despawn.
- The meaning of char +0x8c bit0.
- The exact 3×3 tile effect (`0x100ab39c`).
- The meaning of the objects.odt u32 flag.
- The consumer of inventory category 0xd.
