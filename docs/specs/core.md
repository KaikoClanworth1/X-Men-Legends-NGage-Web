# Core loop, input, movement, collision, camera

Reverse-engineered from 6R54.app. VAs are addresses in the executable.

## Timing
- `CPeriodic` (VA 0x1005341c) with a 40000 µs period: **fixed 40 ms tick (25 Hz)**, with no catch-up. On hardware the timer rounds up to ≈46.9 ms.
- Movement and animation are per tick. A separate `dt` in ms (0x1002f28c) drives durations and timers.
- Gameplay tick order (0x1003119c):
  1. Movement bindings
  2. HUD and menu keys, power HUD
  3. `dt`
  4. Party / brain update
  5. Cheats
  6. World update (objects, sound listener, collision resolve 0x100c6080)
  7. Camera (0x1002ef48)
  8. Render world, then HUD

## Input
Held-key bitmask from `OfferKeyEventL` (0x10054088): key-down sets the key's bit, key-up clears it, auto-repeat is ignored. Presses are edges: `pressed = new & ~held`.

Default bindings:

| Action | Key | Behaviour |
|---|---|---|
| Move | D-pad (diagonal = two arrows held) | See movement below |
| Attack | '5' (press) | Melee on auto-target, brain state 7 |
| Power | '7' | Hold to aim (auto-target, Up/Down cycles target); release fires, state 8 |
| Special Abilities overlay | '4' | |
| Item overlay | '6' | |
| Character Select overlay | '8' | |
| Formation overlay | '2' | |
| Objectives | '9' | |
| Stats | '0' | |
| Map | '3' | |
| Pause menu | Softkeys | |

- A movement command is sent only when the held mask changes.
- Order of the direction tests: DownRight→0, UpRight→2, UpLeft→4, DownLeft→6, Right→1, Up→3, Left→5, Down→7. Direction index × 0x80 = angle.
- A match queues run (state 2) in that direction. No match queues idle (state 4), unless '5' is held.

## Movement
- Angles are 1024 per turn; there are 8 facings (multiples of 0x80).
- Speed is `s` = move speed, with diagonal component `d = trunc(2s/3)`. World delta by angle:

| Angle | 0 | 0x80 | 0x100 | 0x180 | 0x200 | 0x280 | 0x300 | 0x380 |
|---|---|---|---|---|---|---|---|---|
| dx | s | d | 0 | −d | −s | −d | 0 | d |
| dy | 0 | −d | −s | −d | 0 | d | s | d |
| Screen direction | down-right | right | up-right | up | up-left | left | down-left | down |

- Walk uses w01 and moves (dx, dy). Run uses r01 and moves (2dx, 2dy). Missing sprites fall back run → walk → idle.
- A move is applied only when the current animation already equals the requested one. Player characters always run.
- No acceleration. When the desired angle differs from the facing, turn ±0x80 per tick (+0x80 if `(desired−facing) mod 1024 ≤ 0x200`). A move is also made on the tick where the difference is ≤ 0x80.
- Deltas accumulate, knockback velocity is added, and the scene resolves the result against collision.

## Sprite row / mirroring (0x100b3904)
```
d = ((angle & 0x3ff) + 0x40) >> 7;  row = 7 - d;  if (row > 4) { mirror = true; row = 8 - row }
```

## Collision
- Node position is i16 x, y, z in world units (100 per cell). Screen coordinates: `sx = (x−y)·29/100`, `sy = (x+y−z)·15/100`.
- Character shape is a fixed quad: (−50,−50) (−50,10) (10,10) (10,−50) relative to the position.
- Collision mode is reset every tick: 2 (slide) for the controlled hero and anything with knockback velocity; 1 (no wall test) for AI teammates.

Resolver (0x100c6080), mode 2:
- Candidate c0 = p + d.
- If dx == 0: c1 = (x + dy>>2, y + dy>>2), c2 = (x − dy>>2, y + dy>>2).
- Else if dy == 0: c1 = (x + dx>>2, y + dx>>2), c2 = (x + dx>>2, y − dx>>2).
- Else: c1 = (x+dx, y), c2 = (x, y+dy).
- Accept the first candidate whose cell is inside the map and whose quad, translated to (c.x − (dx<0?3:0), c.y − (dy<0?3:0)), does not overlap any collision polygon in the 3×3 cells around it (0x100c6a1c → 0x100d4cb0).
- If none is accepted, the position is unchanged.

## Camera (0x1002ef48)
```
lead_target (only while moving, else (0,-20)) by facing:
  0:(60,30) 0x80:(60,0) 0x100:(60,-60) 0x180:(0,-60) 0x200:(-60,-60) 0x280:(-60,0) 0x300:(-60,30) 0x380:(0,30)
lerp(t, a, b) = b + ((a - b) * t >> 12) + (a > b ? 1 : 0)
lead = lerp(0xff, lead_target, lead)
target = hero screen pos + lead
if k == 0x1000 (level start) or dist²(target, cam) > 400000: cam = target; k = 0x2ff
else cam = lerp(k, target, cam)
view offset = (88 - cam.x, 104 - cam.y)
```
No clamping to map edges was found.

## Party
- Up to 4 heroes (party object at gameplay+0x55c).
- Switching moves the controlled flag and bindings to the new hero.
- AI teammates use the brain state machine: 1 walk, 2 run, 3 turn, 4 idle, 5 go-to with pathfinding (3 retries × 1000 ms), 7 attack, 8 power. They ignore walls (collision mode 1).
- Formation offsets and follow distances are unknown.
