# X-Men Legends (N-Gage proto) – combat / powers / status / AI / drops spec

All VAs are in 6R54.app. "CONF" = confirmed from disassembly. "INF" = inferred. "UNKNOWN" = not traced.
Objects: CHAR = character (anim player at +0x74), BRAIN = AI controller (BRAIN+0x54 = CHAR). Layouts: `re_combat/CONTEXT.txt`.
RNG (used everywhere, e.g. 0x10011900): `seed = (seed*15737 + 15149) & 0xFFFF` (`rsb/add … add r3,#0x3b00; add #0x2d; lsl16/lsr16`); callers usually take `seed % 100`.

## 1. State machine
BRAIN tick 0x1000275c: time: `+0x10 = now − old +0x0c` (dt, ms). Order: HP/energy cheats (flags 4/0x100) → level-up emitter (0x10001a8c) → drop spawn if CHAR+0x8c&2 (0x100085f8) → status/aura emitters (0x10008668) → command intake 0x100021c0 → perception 0x10001ee8 → death check → 0x10001d7c (stun gate) → state handler from the member-function table at 0x100f660c (`ldr r4,[0x100f6610+12*state]; bx r4`). The new state is written to BRAIN+4 and mirrored to CHAR+0xec (0x10002c94).

| id | name (strings @0x100f655c) | handler | animation |
|---|---|---|---|
|1|AI_WALKING|0x10002d50|w01 (1) if it exists, else i01; step 0x1000dc84|
|2|AI_RUNNING|0x10002e18|r01 (2), falls back to w01, then i01; step 0x1000de48 moves **2× the walk step** (`lsl r1,#1`)|
|3|AI_TURN|0x10002f14|turns ±0x80 per tick (0x1000df84/0x1000df90); finishes when the angle difference is ≤0x80|
|4|AI_IDLE|0x10003020|i01 (3) via 0x1000df3c|
|5|AI_GOTO|0x10003384|walk/run toward the command point; arrival when \|dx\|,\|dy\| ≤ 0x31 (0x1000334c)|
|6|AI_PATROL|0x10003608|walk|
|7|AI_MELEE|0x100042cc|CHAR+0x110 (basic attack anim: m01=4 or m02=5), mode 3 = play once|
|8|AI_SPECIAL|0x10004fbc|power slot anim (s01–s04 = 9..12) with mode 3, or mode 8 when command sub==0xd|
|9|AI_THROW|0x10008cb0|UNKNOWN detail|
|10|AI_TELEPORT_FRENZY|0x10005980|entered from SPECIAL for ability string index 76 (0x1000540c `cmp r2,#0x4c0000`)|
|11|AI_DAMAGE|0x10005d98|h01 (7) played once (`mov r1,#7; mov r2,#3; bl 0x1000dae4`); stays while the anim is 7, then leaves via 0x10008484|
|12|AI_RETREAT|0x10005df0|walk away (see §5)|
|13|AI_DIE|0x10006184|d01 (8) (`mov r1,#8; bl 0x1000d9d4`); clears all status emitters (0x100088cc) and item instances (0x1000bfc0); sets timeout +0x14 = now+2000 ms. If HP>0 it goes back to IDLE (4)|
|14|AI_SCRIPT_GOTO|0x10006214|scripted move; also used by wander (0x10003cc8, cmd 0xe)|

Commands are 24-byte records {state, sub, a, b, c, d} (BRAIN+0x5c current, +0x74 queued). A forced state comes from CHAR+0xe8 (0x100024d8): 4 = interrupt, 0xb = damage, 0xd = die. The request is ignored when HP ≤1 and the revive flag 0x8000 is set.
- Hit reaction 0x1000e614(char, hitResult): if the forced state ≠ DIE: result 3/4 → flag 0x800 when result is 4. Otherwise, if result is 1 or 2 (dodge/block) and the state ≠ DAMAGE → force state 4 (interrupt). CONF.
- Player control gate: "player-controlled" = `CHAR+0x88 bit17 && !charm && !confuse` (repeated inline, e.g. 0x10007f70). While a player-controlled character is walking, running or turning, BRAIN+0x18 = now+2000 ms (0x10002da0).
- Stun gate 0x10001dc0: if the stun (+0xc0), sleep (+0xc4) or freeze (+0xcc) timer is nonzero and the state ≠ DAMAGE → play i01 (0x1000df3c) and drop the queued command.
- **Hit timing:** melee damage is resolved **when the swing starts**, in the same tick the m01/m02 animation begins (0x1000444c `bl 0x10010e00`, before `bl 0x1000dae4`), not on a particular frame. Power damage is resolved when the travel-time countdown BRAIN+0x2c reaches 0 (0x10005860-0x100058bc).
- **Combo:** the melee state ends only when the anim is neither CHAR+0x110 nor 5 (0x100044c4/0x100044d4 `cmp r0,#5`). m02 therefore counts as a continuation of the attack. Who starts m02 (anim player chaining vs. input) is UNKNOWN.
- **Invulnerability:** flag 0x4000 (0x1000e0f0). 0x1000e76c skips damage when it is set. It is set on death (0x1000e0dc sets 0x4000 and clears bit1) and cleared by the scripted pair 0x1000e018/0x1000e02c (mission code 0x1001ded0). No i-frames on hit were found.

## 2. Melee
AI_MELEE 0x100042cc:
1. Target = command field b (+0x68). If it is dead (HP 0) or flagged by 0x10013368, go to idle.
2. Reach check 0x100041f8: `dist² ≤ reach²` with reach = CHAR+0x10c (`mul r3,r2,r2; cmp r0,r3`). If there is no target, find the nearest enemy within reach (0x10007d98, opposite team). If out of reach → approach with 0x10004914(point, reach).
3. If the swing flag (BRAIN+8 bit 4) is clear: face the target (0x1000e46c with angle 0x100a9cac) → `0x10010e00(ctx, attacker, target, slot 0)` → 0x10010cd0 (range/arc precheck) → 0x10011898 → play anim CHAR+0x110 once → set bit 4.
4. When the anim ends: clear bit 4 → idle decision 0x10003944 (another MELEE if targets remain).
- No arc check for melee beyond facing (INF); 0x10010cd0 is the shared precheck.

Hit resolution 0x10011898(ctx, att, def) (Str=+8, Body=+0xc, Spd=+0x14; base block +0x140 plus bonus block +0x194):
- Defender reaction roll: if `Spd ≥ Body`: `roll%100 ≤ Spd` → dodge, else second roll `≤ Body` → block. Otherwise Body is tested first, then Spd.
- `A = att.Spd + att.Str`. `D = dodge ? 2·Spd+Body : block ? Spd+2·Body : Spd+Body` (defender).
- `chance = 100·A/(A+D)` (0x10011c10). **Blind attacker → chance 0** (0x10011c34). **Defender stunned/asleep/frozen → chance 100** (0x10011c68).
- If `roll%100 ≤ chance` → HIT: `dmg = Str/2 + rand % (Str − Str/2)`, then attacker bonuses 0x10010ef0(weapon slot CHAR+0x108), then defender 0x10011680. Result code 3.
- Otherwise the result is 2 = blocked, 1 = dodged, 0 = miss. The result goes to ctx+4 and the damage to ctx+8. Then `0x1000a790(world, att, def, def.HP − dmg, dmg, result)` posts the hit, which shows the number and applies the damage (0x1000eaa8 path).
Damage application 0x1000eaa8 → 0x1000e76c:
- `HP = max(0, HP−dmg)`, event 8 posted (0x1000ae84).
- On HP ≤ 0: if flag 0x8000 (revivable party member) → force IDLE with HP=1 and mark dead (0x4000) = knocked out. Otherwise post a death event (type 8/0xd, or 0xc by name "senscout").
- Sleep/freeze are broken by a later hit (0x1000ee64): on the first hit the flag 0x8000000 is cleared; on later hits the sleep and freeze timers are set to 1 ms.
- Grunt sounds 0x1000e688(kind 0 attack / 1 hit / 2 death).
- Knockback: 0x1000ec90 computes a displacement `(pos−src)·k/dist` and moves with 0x1001339c. Result 2 on a player-uncontrolled character plays variant 0x1000d9c0(2). Exact magnitude UNKNOWN.
- Kill credit: when the victim HP ≤1 (and 0 or revivable): `0x1000f838(attacker, victim.level)` (0x1000ed6c). DoT kills set flag 0x400000 and credit the instance owner (0x10008930).
- Kill reward 0x1000f838 (heroes only): `XP += T1[victimLevel]` (@0x100f68a8: 0,10,13,17,22,29,38,49,64,83,108,140,182,237,308,400,520,676,879,1143,…). `+0xfc += T2[level]` (@0x100f6960: 0,8,10,14,18,23,30,39,51,66,86,112,146,190,…). Kill count +0xf6++.
- Level-up 0x1000f898: +2 stat points (+0xa4). Each auto-grow stat below cap×10 gets +1; if it is already capped, +1 stat point instead. Skill point +0xa5 +1 when the level's bit 2 flips (except levels 7 and 15). Recomputes max HP/energy (0x10010934/0x100108f0). Flag 0x200000 plays the level_up emitters 164/166.
- Death anim end 0x1000dbb4: when anim 8 finishes with HP ≤0 → anim stops, flag 0x10000000, CHAR+0x8c |= 2 (drop request). Corpse removal/fade timing UNKNOWN (DIE sets a 2000 ms timer).

## 3. Powers
Slot objects CHAR+0x1e8+16·i: +4 anim index, +8 code, +0xc item record (getters 0x1000004c range +0x72, 0x10000070 radius +0x74, 0x100000a4 +0x70, 0x100000c8 cost +0x6e).
AI_SPECIAL 0x10004fbc:
1. Energy check (0x10005140): `if cost > CHAR.energy(+0x9e)` → show the "not enough energy" string (text 0x29, 0x1004c550) → idle.
2. Travel/cast delay 0x1000471c:
   - Emitter = item+100 (projectile), else item+102.
   - Face the target, distance = to the target, or a raycast along facing for `range` (0x10018e48).
   - If emitter speed(+0x24) > 21: `delay = dist / (speed/11)`. Otherwise delay = 0, or emitter life (+0x54) when > 1500 ms.
   - Plus emitter start delay (+0x56) plus dt. Stored in BRAIN+0x2c. Class bit 0x10 (teleport) → delay 1.
3. **Energy is deducted immediately at cast:** `energy −= cost` (0x100053cc-0x100053d8).
4. Ability string index %100 == 76 → area search 0x10009b28(radius item+0x74, max 16 targets into BRAIN+0x238) → state 10 TELEPORT_FRENZY.
5. Play the slot anim (mode 3), reset CHAR+0x2be/+0x2c0 emitter handles, spawn the cast emitters at the caster via 0x1000a3dc/0x1000a5b4 and move them each tick (0x1000a4f0).
6. When BRAIN+0x2c hits 0 → `0x10010e00(ctx, caster, target, slot)` → 0x10010cd0 precheck → 0x10011e04 (power hit: damage `min+rand(max−min)`, elemental bonuses 0x10010ef0/0x10011680, area 0x10012718, arc item+118 checked in 0x1001205c). Class bits: 0x20 homing → 0x10004b74/0x10004a14; 0x10 teleport → 0x100045ac.
   The projectile is visual only (emitter). The hit is delayed hit-scan.
- Item instances (buffs/DoT) CHAR+0x11c, ticked by 0x1000bd7c each frame:
  - At each `now ≥ nextTick`: energy += item+98 (clamped to max, 0x1000eee0); heal item+106 (if alive or revive class 4, 0x1000eec8); damage item+108 via 0x1000e76c (HP 0 → flag 0x400000); then re-apply statuses 0x1000f014 and cures 0x1000f4ec. `nextTick += interval (+128)`.
  - Expired (end ≤ now) → removed; stats recomputed 0x1000ef64 (sum of all instance stat blocks into +0x194).
  - Ability string %100 == 63 → flag 0x20000000 + anim effect 1 (cloak/transparency INF).
- Adding an instance 0x1000f6c4: heal>0 with inventory class → healthup emitter flag. Charm/confuse items set 0x800000.
- AI power choice 0x100076f8/0x10007748: UNKNOWN (not traced; the anchor says AI checks energy ≥ cost).
- Player button mapping: UNKNOWN (input code not traced). Slot unlock = record +152 unlock level.

## 4. Status effects
Timers CHAR+0xb8+4·i (i16 ms), emitter handle +0xba+4·i.
- Apply 0x1000f014: skipped if immune (0x1000e5d0: (base|bonus immunity) & bit). `t = item.duration(+0x7c) + ((100 − stat)/20)·1000`, integer division. If t ≤ 0 the timer clears. The stat per status is below.
- Tick 0x1000f59c(dt): `t = max(0, t−dt)`, 0 if dead. At 0, the instances inflicting that status are removed.
- Emitters 0x10008668/table 0x100f66c0: spawned at (x+1, y+1, z) with height 0x180 while the timer is >0 and killed at 0.
- Status-bar colour squares drawn at 0x1004bbc4 (ARGB4444).

|bit|status|resist stat|behaviour (CONF)|emitter|colour|
|---|---|---|---|---|---|
|1|charm|Focus|flips allegiance: BRAIN team = team bit ^1 (0x100093e4); removes player control|154 charm|–|
|2|blind|Speed|attacker hit chance = 0 (0x10011c34); blocks some command types (0x100023f8)|156 dark|f000|
|4|stun|Strike|can't act: idle anim, commands dropped (0x10001dc0); incoming hit chance 100|162 stun|fff6|
|8|sleep|Strike|same as stun + flag 0x8000000; woken by a later hit (timer→1)|153 sleep|ffff|
|16|confuse|Focus|removes player control (AI drives the character); no other effect found|163 confusion|random|
|32|freeze|Body|same as sleep (can't act, hit chance 100, broken by a hit)|601 pfrsrtg|f66f|
|64|burn|Body|marker only; damage comes from the power instance's damage per tick|157 fire|ff66|
|128|poison|Body|same as burn|155 poison|f6f6|
Other emitters: 160 healthup (flag 0x1000000), 161 renewal (0x2000000), 165 revive (0x4000000), 164+166 level-up (0x200000).
Sleeping/frozen targets are skipped in AI target lists (0x10006fa4).

## 5. Enemy AI
- Perception 0x10001b64:
  - Target list BRAIN+0x168 (count +0x178). Targets are the opposite team (after charm).
  - Dropped when `dist > 3·sight(CHAR+0x92)` or LOS 0x10009e38 fails.
  - Dead or invulnerable targets are purged; if the list becomes empty, the "in combat" flag CHAR+8 bit 0x20 is cleared.
- Idle decision 0x10003944:
  - Only for non-player-controlled, non-dead characters.
  - Every 8 brain ticks (counter BRAIN+0x26) it evaluates the candidates in BRAIN+0x1b8 (count +0x1ac) with 0x10006c7c (FOV 0x10007f18, range).
  - If targets exist → MELEE (7), else IDLE (4).
- Party follow (0x10002080): a follower more than 799 (0x31f) from its leader in x or y regroups via 0x10009f44. Followers keep 2500 (0x9c4 = 50²) spacing (0x100030e8).
- Wander 0x10003bcc (CHAR+0x94 ≠ 0, i.e. random-walk enabled):
  - 50% chance (rand byte > 128): heading = facing ± 512 (180° turn) (INF), distance 50 + rand(0..63).
  - Raycast (0x10018a64) → SCRIPT_GOTO.
  - Idle wait BRAIN+0x20 = 200 + rand byte ms.
- Ranged spacing 0x10003d5c:
  - `R` = slot range, or 400. Allowed band = [R/2, R]; for allied characters [R/4, R/2].
  - Outside the band → RETREAT (12) to distance R/2+R/4.
- Hero auto-fight 0x10003a7c: if more than 300 from the leader, or the leader is walking/running → GOTO (5) toward the leader, else SCRIPT_GOTO.
- Power selection, patrol routes, group alerts, respawn: UNKNOWN. Mission-scripted spawns use record names `spawn1a…spawn7g` (@0x100fc6e8) (INF).

## 6. Drops / containers
Drop tables are registered by mission code (e.g. 0x100559f0 onward):
- `0x1002ae40(itemName, chance)` adds a {itemCode, chance ≤100} pair (0x10025564).
- `0x1002ae98(objectTypeName)` binds the pending table to every placed object of that objects.odt type (0x100255c8). `0x1002aeb0(characterKey)` binds it to characters (0x100256ac → CHAR+0x102).
- The table is cleared after binding.
- Example (mission at 0x100559f0):
  - "barrel": muscle relaxant 25, air horn 25, small med pack 15.
  - "wooden crate": muscle relaxant 25, antidote 25, small med pack 15.
  - "metal crate": eye drops 25, small med pack 15.
  - Further entries include small med pack 5.
- **The roll happens once, at binding time** (0x100257ec): `r = new 16-bit seed (0..65535)`; walk the pairs with a cumulative chance and take the first where `r < cum`, else 0. There is no `%100`, so the effective probability is chance/65536. This looks like a bug, but it is what the code does. The result is stored per object (+0xe) or per character (+0x102).
- Enemy drop spawn: when the death anim ends (CHAR+0x8c bit 2, 0x1000dc28), BRAIN spawns item CHAR+0x102 at the corpse position with `0x1000a478(world, item, x, y, z)` (0x100085f8). There are no generic health/energy orbs; drops are item pickups (Pickups.spr, used near 0x1002fa40).
- containerN (container1..31, @0x100f8960): mission init registers each name as a trigger zone via `0x1002add8(name, 1, 1)` (event 0x1f/0x12). What the zone does when triggered is UNKNOWN (likely inventory/crate interaction).
- Pickup radius, pickup lifetime, and breakable-object HP/hazard handling: UNKNOWN.

---
## Addendum A – enemy AI detail (supersedes the §5 notes where they differ)
- PC() = charm==0 && confuse==0 && CHAR+0x88 bit17. AI logic runs only when !PC.
- Debug flags on world+0x60 (0x10026008): 4 = infinite HP, 0x100 = infinite energy, 0x40 = AI off, 0x400 = double run step.
- Command intake 0x100021c0:
  - Command stack BRAIN+0x90 (24-byte entries, top +0x8c, max 8).
  - Type 8 checks energy (cost > energy → sub=0).
  - Player-team walk becomes run.
  - GOTO is refused while blind/charm/sleep/confuse is active.
  - Keep-fighting: AI class CHAR+0xf0 0/1 ignores a GOTO c==0 while within 800² of the leader (`ldr r3,=0x9c400`).
- Perception 0x10001ee8:
  - Proximity scan every 9 ticks (BRAIN+0x25=8), only if a hero is within a 799 box (0x31f).
  - Candidates within sight (CHAR+0x92) with LOS 0x10009e38 (nav raycast 0x1001778c).
  - Accepted if |facing diff| ≤ FOV/2 (CHAR+0x90), or dist ≤ sight/2, or (alert && dist ≤ 2·sight). Max 16.
  - Player-team owners drop targets beyond 3·sight or without LOS.
- 0x10003944: every 8 ticks adds visible enemies as threat entries (kind 7); returns 7 if there are targets, else 4.
- Attack decider 0x10003e4c (needs cooldown BRAIN+0x20==0, !PC, targets):
  - class 1 melee: nearest target (0x1000754c) → MELEE.
  - class 2: random power 0x10007c08 (rand&7; >3 = none → MELEE). Up to 3 range-band repositions, then SPECIAL.
  - class 3 caster: support power 0x100076f8 first (latch BRAIN+8 bit 0x20), then hostile 0x10007aec (highest unlock level, tie → higher code/100). Target = highest level (0x10007118). No power → MELEE.
  - class 0 mixed: threat target (0x10006eec, max a+b+c) and weakest (0x10007304, lowest HP). Picker 0x10007810 = affordable, in range, largest radius (+116), tie → smaller range. Fallback 0x100079d0 = cost==energy exactly (bug), largest range. Up to 2 repositions.
  - Target pickers skip sleeping/frozen units.
- Range band 0x10003d5c: R = power range, default 400. Enemies want [R/2, R] (player team [R/4, R/2]); outside it they RETREAT (12) to R/4+R/2. Requires move speed CHAR+0x94 ≠ 0.
- Post-melee 0x10003bcc (end of every non-player swing):
  - Cooldown BRAIN+0x20 = (rand8+200)·10 ms, i.e. 2000–4550 ms.
  - 50% chance (rand8>128): drop the target and back off behind (facing±0x200) by 50+(rand&0x7f)/2 via SCRIPT_GOTO.
  - (Replaces the "wander" interpretation in §5.)
- Surround slots 0x10003a7c/0x100031a4:
  - Slot point = target + sin/cos(slot·0x80)·(reach−20), slot = lowest set bit of BRAIN+0x279 (0x100107c0).
  - Used when a same-team ally is within 50 units.
  - Arrival ±0x31. Within 300 → GOTO, else SCRIPT_GOTO.
- GOTO 0x10003384: 3 retries × 1000 ms without LOS, then leash teleport 0x1000898c (AI ally offscreen: |dx|>0x8b or |dy|>0x9f → 5 probe points 500 from the leader).
- PATROL 0x10003608: waypoints BRAIN+0x160 (cell·100+50), ping-pong, 2000 ms dwell. With ≤1 waypoint → random point 500 away.
- RETREAT 0x10005df0: moves away from the nearest threat, or strafes around it at angle+(rand&3)·0x80+0x80, distance 0.75·desired. Adds 0x80 per blocked probe, up to 0x200.
- Stepper 0x10006700: pathfinder 0x100157a0, speed CHAR+0x94. Facing snaps to 45° octants. Runs if goal dist² > 300² (0x15f90), else walks; the player team always runs.
- Not found: an HP-based flee threshold, spawner/respawn code.

## Addendum B – powers detail
- Slot: +0 unlock level (compared with CHAR+0x96 level), +4 anim (default 9), +8 code, +0xc item.
  - Selected slot CHAR+0xf4 (setter 0x1000e320).
  - Range precheck 0x10010cd0: index 0 = melee reach, 1..4 = slots; `dist² ≤ range²`.
- Player UI:
  - HUD power menu 0x1002fef0: entry ids slot0=7, slot1=6, slot2=5, slot3=8. An entry is disabled if locked or cost > energy.
  - Callback 0x10030494 → 0x1004aefc selects the slot.
  - Targeting charge 0x1004b160: 150, −22 per update, ready at ≤0.
  - Auto-target 0x10022eb4 (melee reach, opposite team).
  - Command 0x1004c640: {8, 4, slot, targetId or −1, 1, 0}.
  - Physical key mapping UNKNOWN.
- SPECIAL target:
  - Self-cast if code%100==63 or range==1. If there is no target, 0x10007d98 picks one by range: allies for non-hostile powers, enemies for hostile ones.
  - Out of range → approach (0x10004914).
  - Class 0x20 homing/dash (0x10004a14): moves at 2×speed until within 50 units, then fires.
- Emitters at cast:
  - +100 and +102 at the caster (handles CHAR+0x2be/+0x2c0).
  - If emitter +104 lasts >1500 ms, it is pre-spawned on every unit within the radius inside max(arc, FOV)/2 (0x10004e0c).
- Timer: speed>21 → t = dist/(speed/22); long emitters use their duration; plus start delay +0x56 and dt.
- Fire:
  - With a target: 0x10010e00.
  - Without a target: 0x100045ac. Class 0x10 teleports along facing up to range (0x10004b74). Otherwise area damage 0x10012718 at the ray point, with the +104 emitter.
  - Screen shake via 0x1000a744 (+120/+122).
- Power hit 0x10011e04:
  - Units within radius +116 of the target (only the target for code 76).
  - Hostile powers hit the other team, support powers the caster's team.
  - Arc check (0x1001205c): |facing−angle| ≤ arc/2. Teleport class ignores it.
  - dmg = min+rand(max−min), event type 4 (8 if no damage). Then 0x10010ef0/0x10011680 → 0x1000a790.
  - +104 emitter at each target (id 0x300 → 0x301).
  - dmg/tick>0 also sends a type 6 event with total (duration/interval)·dmgPerTick (probably the floating number, UNKNOWN).
- Instances (20 bytes: item, nextTick, expiry, netId):
  - Applied on hit (0x1000eaa8) with expiry=now+duration, first tick now.
  - Duplicates are rejected: no stacking or refresh.
  - Duration 1 = one-shot, 0 = permanent.
- TELEPORT_FRENZY 0x10005980: for each collected target (≤16), play the slot anim, hit on the next update, teleport to it (class 0x10), spawn +104, shake.
- THROW 0x10008cb0: BRAIN+0x64 = item instance. Range check 0x10010d98, area 0x100122f0 around the target, or 0x10008bac with no target.

## Addendum C – melee/damage corrections (supersede §1/§2 where they differ)
- The receiver 0x1000eaa8 **sets HP to the server-sent value** via 0x1000e91c; it does not subtract. The on-hit item's statuses are applied through 0x1000f6c4.
- Knockback applies only to non-heroes and only when the target is not stunned, frozen or player-controlled.
  - `k = ((dmg·128)/maxHP)·100 >> 7`
  - `dx = (D.x − A.x)·k/(dist+1)`, same for dy
  - Anim-player op 0x1000d9c0(2), then push via 0x1001339c.
- The hit reaction 0x1000e614 **never produces AI_DAMAGE**. Dodge/block (kind 1/2) forces IDLE (interrupt). AI_DAMAGE/h01 is entered only from a script/net event (0x1001dfb4 writes CHAR+0xe8), and lasts exactly the length of the h01 animation.
- Melee range precheck 0x10010cd0 also requires **equal z**.
- 0x1000e76c:
  - Red flash via 0x1000ae84 (RGB at +0x2b8.., flags 0x80000|0x2000).
  - On death: "senscout" gets brain command {8, 0xd}; everyone else gets event 0xf {0xc, id, 0xd}, which forces DIE and HP 0.
  - On-death script 0x10028078 runs if CHAR+0x40 is set.
- Set HP 0x1000e170: non-heroes crossing below maxHP/3 raise anim-player event 8 (low-HP cue); HP clamped to max.
- Death anim end 0x1000dbb4: non-heroes are hidden/detached (0x100aa2ec); then the drop request (+0x8c|=2) → 0x100085f8 spawns item CHAR+0x102.
- Level-up check 0x10010430: `while level ≤ 39 && XP(+0x98) ≥ tbl[0x100f67f0+4(level+1)]`. Level-up refills HP and energy.
- m02 chaining is not started by AI code (UNKNOWN; likely animation data).
