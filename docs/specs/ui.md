# X-Men Legends (N-Gage, 2004 prototype): UI, HUD, save and text spec

- **Binary:** 6R54.app. VA = 0x10000000 + file offset − 0x7C.
- **Screen:** 176×208.
- **Byte order:** all values are little-endian.
- **Labels:** "?" marks something inferred, not proven. **UNKNOWN** marks something that was not traced.

**Working files** are in `re_ui\` (menu.txt, intro.txt, gt.txt, audio.txt, sv.txt, dl2.txt, plus the hud/, save/, dlg/ and pause/ dumps).

**Colours** are ARGB4444 unless stated otherwise.

---
## 0. Engine primitives (reference)

### Keys
Key bitmask: global `[0x100eeb14()+0xC]` is returned by 0x100a9fdc. It is built in 0x10054088, where key event type 2 clears a bit and type 3 sets it. Symbian scancode to bit:

| Key | Scancode | Bit |
|---|---|---|
| Right | 0x0F | 0x1 |
| Left | 0x0E | 0x2 |
| Down | 0x11 | 0x4 |
| Up | 0x10 | 0x8 |
| Left soft key | 0xA4 | 0x10 |
| Right soft key | 0xA5 | 0x20 |
| OK / Select | 0xA7 | 0x40 |
| 1 | 0x31 | 0x80 |
| 2 | 0x32 | 0x100 |
| 3 | 0x33 | 0x200 |
| 4 | 0x34 | 0x400 |
| 5 | 0x35 | 0x800 |
| 6 | 0x36 | 0x1000 |
| 7 | 0x37 | 0x2000 |
| 8 | 0x38 | 0x4000 |
| 9 | 0x39 | 0x8000 |
| 0 | 0x30 | 0x10000 |
| * | 0x2A | 0x20000 |
| # | 0x7F | 0x40000 |
| scancode 0x01 | 0x01 | 0x80000 |
| any other key | — | 0x100000 |

Scancode 0x12 toggles a shift flag (+0x34).

Game actions go through remappable masks in game.cfg (see section 5.3). The GUI framework's action indices are 0 up, 1 down, 2 left, 3 right, 5 select, 6 alternate select, 7 back.

### Sprite batch
Draw calls append commands.

| Call | VA | Notes |
|---|---|---|
| `setState(ctx,key,val)` | 0x100abd3c | key 4 = colour (ARGB4444); key 0 = blend mode (5 normal, 6 alternate); key 5 = world-space |
| `bindSprite(ctx,id)` | 0x100abd8c | |
| `setPos(ctx,x,y)` | 0x100abde0 | |
| `drawFrame(ctx,frame)` | 0x100abe9c | Drawn at pos − hotspot |
| `fillRect(ctx,x1,y1,x2,y2)` | 0x100abf78 | Uses the current colour |

Sprites load by name through 0x100af280, which returns a u8 handle.

### GUI framework (0x100b0xxx / 0x100bxxxx)
Elements carry a rect set by `setRect(el,x,y,w,h)` (0x100b0c44, stored as i16 at +0xC..+0x12). Other element calls: `setFont` 0x100b0cac, flags set 0x100b0ce4 / clear 0x100b0d1c, colour 0x100b145c(r,g,b,a), focus 0x100b0f0c.

Flag bits:
- 0x10: centre horizontally (x is the centre).
- 0x20: "more" arrows from menunotify.spr.
- 0x200: disables alternate-select paging.

**Yes/No dialog** `0x100ae2a4(text, noLabel, yesLabel, default=1, callback, obj)` → 0x100bc690:
- Message element: rect (10,50,156,140), menu.fnt, white.
- Button area: (15,145,146,45).
- Labels are always menus 26 "Yes" / 27 "No".

**Message box** `0x100ae348(text, cb, obj)` → 0x100bcc68: same box (10,50,156,140), menu.fnt.

**Screen fade overlay** (0x100bc450): rect (−3,−3,182,214). `fadeTo(r,g,b)` via 0x100bc4c4 / 0x100bc540.

**menunotify.spr** (4 frames: 5×4, 5×4, 4×4, 4×4) provides the text-element arrows:
- Frame 0 at bottom centre: more text below.
- Frame 1 at top centre: text scrolled.
- Frames 2–3 blink at (x+1, y+h−1): end of text. The counter runs 0..15 and frame = 2 + (cnt>>3). See 0x100bff5c and 0x100c29e8.

**Strings:** `str(table, id)` = 0x100aa680(resmgr[+0x24], id, table). Table 2 = menus.txt. menus.txt ids are 0-based lines; indices are listed in section 1.10.

---
## 1. Front end

### 1.1 Top-level state machine (built in 0x10019a60)
Built with `fsm_add(name, stateObj, target1, target2, ..., 0)` (0x100ae930). A state leaves by setting `[obj+0x54] = n`, which moves to its n-th target (1-based); −1 means back.

| State | Object ctor (field) | Targets 1,2,3,4 |
|---|---|---|
| Intro | 0x1002bf70 (+0xb44) | MainMenu |
| MainMenu | 0x100346b4 (+0xb48) | GameType, MultiMenu, GamePlay, Options |
| MultiMenu | 0x1003731c (+0xb50) | MainMenu, MultiJoin, MultiHost |
| MultiJoin | 0x100376f4 (+0xb54) | MultiMenu, Gameplay |
| MultiHost | 0x100395b0 (+0xb58) | MultiMenu, GameType |
| Options | 0x10035d98 (+0xb60) | MainMenu (sub-FSM, see 1.6) |
| GameType ("Single-Player") | 0x1003b63c (+0xb4c) | MainMenu, LevelSelect, GamePlay, MultiHost |
| LevelSelect | 0x100408d4 (+0xb64) | GameType, GamePlay |
| GamePlay | 0x1002c6fc (+0xb68) | MainMenu, GameType |
| Movieplay | 0x100446c4 (+0xb5c) | MainMenu, GamePlay |

### 1.2 Intro / splash (0x1002c3c0 update)
- **Splash list:** 24-byte names at 0x100f7808: splash_nokia, splash_activision, splash_marvel, splash_bl. The count is in [+0x44].
- **Timing:** each splash shows for at least 3000 ms (0xbb8 at 0x1002c41c). A key press ([+0x48]) skips ahead only after that minimum. Then the next splash loads.
- **Position:** frame 0, centred: x = (176−w)/2 − bboxX, y = (208−h)/2 − bboxY (0x1002c4dc).
- **Nokia splash (index 0) extra text:** menus 152..156 ("Copyright © 2004 Nokia" … "trademarks of Nokia Corporation."), small_7.fnt.
  - Element rect (x=88, y=132+14·i, w=176, h=76), flags 0x18 (centred), flag 4 cleared (0x1002c598–0x1002c65c).
- **Exit:** after the last splash, returns 1 and moves to MainMenu.

### 1.3 Title screen (MainMenu with [+0x60]=1)
Set up in 0x100349e0:
- **Title art:** title.spr frame 0 at x = (176−w)/2 − bx, y = (208−h)/4 − by (a quarter, not half).
- **Prompt:** menus 157 "Press any key to continue", small_7.fnt. Rect centre (88,146), w=156, h=62, flag 0x10, flag 4 cleared.
- **Version string:** literal "X-Men Legends version 0.16", small_6.fnt, at (88,198) centred, colour RGB (0x60,0x60,0x60).
- **Update (0x10034778):** draws title.spr. On any newly pressed key (keys & ~prevKeys), it calls vt+0x14 then vt+0x10 (build the menu) and clears [+0x60].
- **Corrupt config:** if cfg+0x67 is set (game.cfg was corrupt), it shows a message box with menus 162 "Data Corrupted. Save game will be deleted." once.
- **Cheat code** (checked while the menu is showing): a 7-step key sequence from table 0x100f7b90 = 0x100,0x800,0x1000,0x100,0x200,0x100,0x4000, which is **2 5 6 2 3 2 8**.
  - Completing it calls 0x10025fd8 (unlock cheats, twice) and plays sound "applauses_05".
  - A wrong key resets the sequence.

### 1.4 Generic list menu (base class 0x1003326c; all front-end and pause lists)
**Resources** (loaded in 0x10033870):
- mainmenu.spr (or pausemenu.spr when in game, per 0x10026c24)
- selector.spr
- st_items.spr
- arial_8.fnt, for the soft keys

**Draw (0x100333cc), per frame:**
1. Background: bg.spr frame [+0x2a]>>1 at (0,0). [+0x2a] cycles 0..2·frames−1, so the animation runs at half rate.
2. Row slots: for each item i, selector.spr frame 1 at (0, 49+21·i).
3. Highlight: selector.spr frame 0 at (0, hiY−1). hiY eases toward the focused element's y ([+0x2d]) via 0x100a9c50 (smoothing, constant 0xd48). Initial value 0x31.
4. Left soft key: menus 107 "Select" (arial_8) at x=3, y=209−fontHeight.
5. Right soft key: if back is allowed ([+0x58]), menus 108 "Back" at x=173−width.
6. Scroll arrows:
   - st_items.spr frame 14 at (85,43) when scroll offset [+0x50] > 0.
   - Frame 13 at (85,196) when offset+7 < count.

**Items (0x10033b58):**
- Text elements in menu.fnt, rect (9, 49+21·row, 0, 100), flags +2 / −8 −5.
- At most **7 visible rows**. Navigation wraps and focus links cyclically (0x100b134c).

**Item tables** come from virtuals:
- vt+0x28 / +0x2c: 8-byte entries {u32 menusId, u32 callback} and a count.
- vt+0x20 / +0x24: 16-byte entries with dynamic strings.
- vt+0x18 / +0x1c: 12-byte entries.

**Input (0x100344c0):**
- Up at the top row with offset > 0: offset−1.
- Down at the bottom row with more items: offset+1.
- Jump codes 0 / 6 move to the first / last page.
- Select calls the item's callback with its index. Back sets [+0x54] = −1.
- Sounds: menu_scroll, menu_accept, menu_back (0x100f6e20…).

### 1.5 Main menu (items at 0x100f7af4, callback 0x10034f9c → 0x10034cf8)

| Row | Text (menus id) | Action |
|---|---|---|
| 0 | Single-Player (0) | → GameType |
| 1 | Multiplayer (1) | → MultiMenu |
| 2 | Tutorial (133) | Starts "tutorial" with tutorial.mdd (0x100504c8 + 0x1001bd40) → GamePlay |
| 3 | Options (3) | → Options |
| 4 | Exit (4) | If free disk < 0x400: message 163 "Game deck memory full.". Otherwise Yes/No "Do you want to quit X-Men Legends?" (120) |

Multiplayer menu (0x100f7d5c): Join Game (57), Host Game (58).

### 1.6 Options (0x10035d98)
**Sub-FSM:** Options → AudioMenu (0x100366e4), Credits (0x1002aed4), Language (0x100424b0), Backlight (0x10042628), Bluetooth (0x10042858), KeyConfig (0x10042ff0).

**Items** (0x100f7c94): Audio(5), Backlight(101), Language(83), Controller(8), Bluetooth(9), Delete All(104), Credits(6).
- **Delete All:** Yes/No 105 "This will erase data and close the game." Yes deletes slots 0..4 (.pdm), game.cfg, the 6R54.mbm/.cfg files and the GameMgr icon, then exits (0x1003648c).

**Audio** (0x100f7d28): Sound(10), Music(11), Voice(12), "Mute when in Call:"(106).
- Sliders (0x100368f0) use slider.spr:
  - Frame 0 (track) at (88, 52+21·row).
  - Frame 1 (knob) at (89+k, 52+21·row), with k = f(volume) from 0x100372f0.
  - Stored volume = k²/27 (save-agent finding: 0x100372cc); k runs 0..79.
- Left/right arrow hints: at k≤0 only one direction, at k>79 the other.
- Row 3 shows "Yes"/"No" for cfg byte +1 (toggle at 0x10036e98). As coded, the flag set shows "No" (27).

**Language** (table 0x100f7f30): English, Français, Italiano, Deutsch, Español. The index 0..4 is stored in cfg+4.

**Credits** (0x1002b588): credits.txt, menu.fnt/Arial_8, subbasement.swb music.
- 15 recycled line elements centred at x=88, scrolling up 1 px/frame.
- Inline sprites are drawn at (88, lineY+1).
- End fade: counter +16/frame. From 0x100 it fills (0,0,176,208) with black at alpha ((c−0x100)&0xF0)>>4; at 0x1F0 the screen is fully black and credits exit.

**Backlight / Bluetooth / KeyConfig:** menu screens; details **UNKNOWN**. KeyConfig uses small_6/small_7 and selector_small.spr (0x100430f8).

### 1.7 Single-Player / GameType (0x1003b63c, list rebuild 0x1003b834)
**Normal mode** (8 rows, 16-byte dynamic entries):
- Row 0: New Game (13).
- Rows 1..5: slots 0..4 (0 = Autosave.pdm, n = Game n.pdm). The label is "%s   %u:%02u" from 0x1005077c: map name, then minutes:seconds of play time.
- Rows beyond the existing saves show "-----" (25). A corrupt slot (error 7) shows "Delete..." (15).
- Row 6: Delete... (15) toggles delete mode ([+0x5c]).
- Row 7: Level Select (17) → LevelSelect.

**Delete mode:** only existing saves are listed, padded with "-----". Selecting one opens Yes/No 28 "This will erase this game. Are you sure?". Back leaves delete mode.

**Select (0x1003bcb4):**
- **New Game:** 0x10050374 (new profile), 0x10052284 (map path), 0x1001bd40 start → [+0x54]=3 (GamePlay).
- **Slot:** load 0x100509f0.
  - On error 7: message 162, then delete.
  - On success: start its map → GamePlay.

### 1.8 LevelSelect (0x100408d4)
Lists every `*.mdd` in the app folder (directory scan at 0x10040a1c) and starts the chosen one. A debug key check uses mask 0x810 (keys 5+Right-soft?). **UNKNOWN** detail.

### 1.9 Transitions
- Screen fades use the overlay in section 0.
- The GUI yes/no dialog is modal. Its callback receives the chosen button (1 = Yes).

### 1.10 menus.txt index (0-based)
Full list in `re_ui\pause\menus_idx.txt`. Key ids:

| Ids | Strings |
|---|---|
| 0–4 | Single/Multi/Arena/Options/Exit |
| 13 | New Game |
| 15 | Delete... |
| 17 | Level Select |
| 19–24 | Save, Load, Stats, Items, Quit, Cheats |
| 25 | ----- |
| 26 / 27 | Yes / No |
| 28 | Erase confirm |
| 29 | Paused |
| 30 | Unload confirm |
| 32 | Auto-saved. |
| 33 | Saved |
| 38–41 | Dodge / Miss / Blocked / No energy |
| 42–51 | HP, EP, Level, Strength, Speed, Body, Intelligence, Points, Auto-assign, XP |
| 52–56 | AI Stance, Berserk, Aggressive, Normal, Defensive |
| 107 / 108 | Select / Back |
| 116–119 | Game over: "All X-Men have / been eliminated.", Retry, Main Menu |
| 121 | Overwrite |
| 122 | Resume |
| 148–151 | Stats / Skills / Equip / Items |
| 157 | Press any key |
| 162 | Data Corrupted |
| 168 | Map |
| 169 | Inventory full |

---
## 2. In-game HUD (object created at 0x1004ab2c, at game+0x594)
**Frame entry:** 0x1003171c → 0x1004b070 (reticle) → 0x1004b364 (panel) → 0x1004c250 (floating text).

**Resources:**
- Fonts: Arial_8, small_6, damage, damage_9/10/11.
- Sprites: HUD.spr, enimeter.spr, status.spr, `<hero>.spr` portrait, selected.spr, donut.spr, targeted.spr, targetedspecial.spr.

**Slide in/out:** [+0x79] (0 hidden, 1 shown, 2/3 sliding). Offset s = [+0x7a] eases toward 60 or 0, and the whole panel draws at y−s.

### 2.1 Player panel (top-left)
Drawn in this order:
1. **HP bar:** w = min(hp·52/maxHP, 52). hp = i16 actor+0x9c; maxHP = [+0x140]+[+0x194]. fillRect colour 0x0F00 (red), (25,11)–(25+w,14).
2. **EP bar:** w = min(ep·51/maxEP, 51). ep = actor+0x9e; max = [+0x144]+[+0x198]. Colour 0x000F (blue), (30,16)–(30+w,19).
3. **Portrait:** `<hero>.spr` frame 0 at (12,12). Frame sizes: 0 = 28×28 (hotspot 15,14); 1–4 = power icons 18×18 (10,10); 5–8 = 28×28.
4. **Selected power:** same sprite at (26,27). Frame for power index p (hud+4): p=0 → 3, p=2 → 1, otherwise p+1 (0x1004ba50).
5. **Frame overlay:** HUD.spr frame 0 (84×37) at (0,0), drawn over the bars.
6. **Status icons:** status.spr frame 0 (6×6) at (37+8·i, 22), one per non-zero timer u16 at actor+0xb8..+0xd4, each tinted: 0xFE0E, 0xF000, 0xFFF6, 0xFFFF, random grey, 0xF66F, 0xFF66, 0xF6F6. Meanings **UNKNOWN**.
7. **Hero name:** small_6, white, x = 47 − w/2, y = 1.

### 2.2 Enemy meter (bottom-right; shown when a target exists)
- **Bar:** blend 6, colour 0x6F00, w = hp·59/maxHP. fillRect (154−w,200)–(154,206), right-anchored.
- **Frame:** enimeter.spr frame 0 (82×23, hotspot 41,11) at (135,196). Frame 1 (21×21) at (165,196) flashes while the target was just hit.
- **Name:** Arial_8, white, centred at x=125, y=187.

### 2.3 Targeting reticle
- Sprite: targeted.spr, 7 frames (~70×64, hotspot x=w/2), looping. Uses targetedspecial.spr when special-target mode is on.
- Position: target world position projected to screen, drawn at (x, y−70).
- Lock timer [+0x7e] starts at 150 and drops by 22 (?).

### 2.4 Party markers (world space)
- **Current hero:** selected.spr (44×21) under the hero (0x1004c08c).
- **Other living members:** donut.spr ring, 12 frames.
  - HP frame = 6 − (6·(hp−1)/max + 1), giving 0..5 (0 = full).
  - EP frame = 12 − (6·(ep−1)/max + 1), giving 6..11.
  - Stored at actor+0x2bb..0x2bd.

### 2.5 Floating text (pool of 16, 0x54 bytes; add 0x1004c550)
**Slot fields:** age starts at 60 (+1/frame); life starts at 900 (−frameDelta); alpha starts at 255 (−8/frame).

**Damage numbers ("%d", posted at 0x10006e08, only when the attacker is the controlled hero):**
- Colour: damage > 0 → (255,100,100); heal → (100,255,100).
- Font by t = life/9: t>90 damage_9, t>70 damage_10, otherwise damage_11. The digits shrink as they age.
- Fixed position (screen corners):
  - Hero is the victim: (10−w/2, 2).
  - Otherwise: (165−w/2, 188).
- damage.fnt is loaded but always overridden.

**Actor text** (e.g. menus 41 "No energy", posted at 0x100051cc): Arial_8 at the projected actor point (x−w/2, y−age), rising 1 px/frame. Dodge/Miss/Blocked (38–40) likely use the same path (?).

### 2.6 Not present or unknown
- No minimap in the HUD.
- lvl.spr and lvl2.spr are unreferenced.
- xpie.spr (108×108) is used by a separate element created at 0x1002e7d8 (menu.fnt, area around (10,60,156,130)); probably the level-up/XP screen. **UNKNOWN.**
- loading.spr / verdana_14.fnt: loading screen (0x10047420). **UNKNOWN** layout.
- "Notify" (0x100f6ea0) is an event-name table, not a drawing.
- Autosave notice: menus 32 "Auto-saved." (0x1002ea50).

---
## 3. Pause and in-game menus (sub-FSM in 0x1002cff4)

**States:** Loading, Unloading, Waiting, Running, Paused, Menu, Objectives, Map, StatMenu, StatMenu2, CharSelect, CheatsMenu, Options, SaveMenu, Saving, GameOver, Movie, Summary, Disconnected.

**State objects:**

| Ctor | Object |
|---|---|
| 0x1003c244 | ? |
| 0x100350a4 | Pause Menu |
| 0x1004e8d8 | 9-row list; Objectives? |
| 0x10040c54 | ? |
| 0x10045028 | ? |
| 0x100458f4 | Map / summary? |
| 0x100357f8 | SaveMenu, 4 rows |
| 0x10046338 | In-game Options, same as front end |
| 0x10047258 | Loading |

### 3.1 Pause Menu (0x100350a4; count 0x10035544, select 0x100355b8)
- Uses pausemenu.spr and the generic list from 1.4.
- **Items:** table 0x100f7bf4..; the observed sequence is Stats, Quit, Cheats, Resume(122), Save(19), Options(3), Stats(21), Quit(23), Cheats(24).
- **Visible count:** 5, 6 or 7 depending on cfg flags +0x61/+0x62/+0x68 (multiplayer/tutorial variants?), minus 1 when cheats are locked (0x10026008(1) false).
- **Expected single-player list:** Resume, Save, Options, Stats, Quit, [Cheats]. Exact variant mapping **UNKNOWN**.
- **Quit:** Yes/No 30 "This will unload your current game. Are you sure?" (0x10035660).

### 3.2 SaveMenu (0x100357f8, 4 rows at +0x98)
- Rows are Game1..Game4 slot labels (same format as 1.7).
- An existing file prompts 121 "Overwrite your current save data?".
- The save runs on the next tick (0x1003179c → 0x1002dab8), then shows 33 "Saved".

### 3.3 Stats / Skills / Equip / Items
Tabs are menus 148–151.

**Code locations:**
- 0x1003ff58: statscr.spr, st_items.spr, stat_bar.spr, select_pads.spr, small_6/7.
- 0x1003ca2c: stat lines ":%d (%+d)".
- 0x10041bc8: CharSelect with chr_select.spr, select_pads.spr, portraits `<char>_i01.spr`, ":%d/%d" and ":  %d".
- 0x100459bc: "%u:%s" with tally.spr.
- 0x100430f8: selector_small.spr.

**Labels:** HP, EP, Level, Strength, Speed, Body, Intelligence, Points, Auto-assign, XP (42–51). Stance: Berserk / Aggressive / Normal / Defensive (53–56). Formation Select (37). Item groups: Status / Recover / Attack / Health / Energy Items (97–100, 179).

**Layout, spending rules, key handling:** **UNKNOWN**. Not traced; the analysis pass on these screens returned no result.

**Game over:** gameover.spr (0x1002cd84), menus 116/117, then Retry(118) / Main Menu(119).

---
## 4. Dialogue (.dlg)
### 4.1 Format (loader 0x10048ed0)
- **File name:** `<name><langSuffix>.dlg`. Starts with "DLG00000", then a label table (cstr + u32 node index).
- **Node** (0x1C bytes): file order parent, sibling, child (runtime +0 child, +4 sibling, +8 parent), then a kind byte.

| Kind | Name | Contents |
|---|---|---|
| 0 | Line | → 0x30-byte object: +0 speaker (UTF-16), +0xC text (UTF-16), +0x18 voice cstr, +0x24 portrait cstr |
| 1 | Choice | Text and voice |
| 2 | Goto | Label resolved at load |
| 3 | End | i32 result, passed to callback [+0x14C] |

- 4 dialogue slots at this+0xB0+slot·0x20.

### 4.2 Show node (0x10049518)
1. Stops the previous voice (speech vt+0x50, arg 1?).
2. If the speaker is L"(Player)", it is replaced by the party member's name from characters.txt, and that member's portrait is used.
3. If voice ≠ "", plays `<voice>.elp` (no language suffix) via speech vt+0x38.
4. **Choice with more than one sibling:** choice list (4.4), no voice. **Single choice:** shown like a line.

### 4.3 Line layout (0x1004a094)
| Element | Rect / position | Font, colour |
|---|---|---|
| Backing box | (−2,108,180,100) | Fill 0x8000 (50% black). Bevel: white top/left, 0xF888 bottom/right (0x100bf410) |
| Speaker | (4,110,168,104) | small_7, yellow 0xFFF0 |
| Text | (4,123,168,79) | small_7, white; wrap width 168 |
| Portrait | at (142,94) | `<portrait>.spr` frame 0 |
| Portrait frame | at (140,92) | st_items.spr frame 18 |

- The portrait and its frame are drawn only if the portrait name is non-empty.
- Lines fitting = h/(lineH+3); 5 lines with small_7 (lineH 11).
- Text block is centred vertically: y + (h − n·(lineH+3))/2, so the first line lands at y=127.
- menunotify arrows as in section 0.

### 4.4 Choice list (0x1004a4b8)
- Same box. List at (16,112,156,92), small_7, word-wrapped.
- Selected item: bar colour 0x008F, full width, height lines·14−3.
- Up/Down wrap. Select passes the item index.

### 4.5 Advance
- **Text element (0x100c0104):** Up/Down scroll one line. Select pages forward by the visible line count. At the end of the text, 0x10049d28 → 0x10049c58 picks the next node:
  - Chosen sibling (for choices), else the child.
  - Else climb: take the sibling of a line, or the parent.
  - Posts event 0x12 → the next node is shown.
- **Skipping:** no separate skip. Select cuts the line short, and the voice is stopped when the next node starts.

---
## 5. Save system
### 5.1 I/O and paths
- **Streams:** read 0x100a98d4, write 0x100a9920, seek 0x100a996c. Open file 0x100ad624 (mode 1 read, 3 replace).
- **CRC-32:** standard, poly 0xEDB88320. Buffer version 0x100a9e18(buf,len); stream version 0x100a9a7c.
- **Slot path** `0x10052d40(n)`: `C:\system\apps\6R54\` + (n>0 ? "Game"+n : "Autosave") + ".pdm". Slots are 0..4.
- **Error codes:** 7 = corrupt/version, 0x14 = disk full.

### 5.2 .pdm layout (loader 0x10050ab0, label reader 0x1005077c, writers 0x10050f10 / 0x100517c0)
**Header (0x20 bytes):**

| Offset | Type | Content |
|---|---|---|
| 0x00 | char[] | "6R54\0", zero-padded |
| 0x08 | u32 | CRC-32 of file[0x20..EOF]; 0 skips the check |
| 0x0C | u32 | Version = 4 |
| 0x10 | u32 | Payload size (not checked) |

**Fixed block (0x988 bytes at file offset 0x20; offsets relative to the block):**

| Offset | Size | Content |
|---|---|---|
| 0x000 | 11×0xB8 | Character records, order Beast, Colossus, Cyclops, Gambit, Iceman, Phoenix, Magma, Ncrawler, Rogue, Storm, Wolverine (names at 0x100f8908). Built by 0x1000b740; → profile+0xBC |
| 0x7E8 | u16 | Unlocked-character bitmask |
| 0x7EA | u16 | Mission index (28-entry table 0x100f8604: .mdd name + 4 forced party slots) |
| 0x7EC | u16 | Spawn number ("spawn%d") |
| 0x7EE | u8 | Flag, profile+0x30 ? |
| 0x7EF | u8 | "Party editable" flag |
| 0x7F0 | 4×u32 | Party character indices. New game: 10,2,5,8 (Wolverine, Cyclops, Phoenix, Rogue) |
| 0x800 | u32 | Shared inventory item count (array A) |
| 0x804 | 11×u32 | Per-character item counts (arrays B0..B10) |
| 0x830 | char[0x18] | Current map (.mdd). Also the slot label |
| 0x848 | char[0x18] | Second name, profile+0x40 ? |
| 0x860 | 10×{u32 key, u32 val} | Script flags/variables ? |
| 0x8B0 | u32 | Total item bytes |
| 0x8B4 | u32 | Map-chunk count, at most 5 |
| 0x8B8 | u32 | Chunk bytes |
| 0x8BC | 5×0x24 | Chunk directory: char[0x18] map name, u32 offset, u32 size, u32 play time in ms. The slot label sums the times (m:ss) |
| 0x970 | u32 | Counter, profile+0x24 ? |
| 0x974 | u32 | Counter, profile+0x28 ? |
| 0x978 | 4×u32 | ID list, profile+0x9A8 (default −1) |

**Then:**
1. Array A, then arrays B0..B10. Each item is 0x20 bytes: u32 item-definition ID, u32, u32, zero padding. Character record s16 fields at 0x1E/0x20/0x22 index the equipped items in that character's B array (−1 = none).
2. Map chunks: one .mdd-format snapshot per visited map, written by 0x1002dc94 and loaded by 0x1002e310/0x10023744.
   - Header "mdd\0" (0x44 bytes).
   - Per-entity records {u32 0xE71DFADE, u32 size, u32 type, char[20] name} followed by entity data. Includes the object serialisers 0x100c8fbc / 0x100c9150; their fields are **UNKNOWN**.
   - Then party state (0x1004853c) and script VM state (0x100283ac).
   - Trailer (0x24 bytes): time, game+0x24/0x22C/0x230, position (8 bytes).

**Character record (0xB8 bytes), same as characters.cdt, version byte 4:**

| Offset | Content |
|---|---|
| 0x00 | Version (4) |
| 0x02 | Level ? |
| 0x0C | Flags |
| 0x1E / 0x20 / 0x22 | Equipped item indices |
| 0x24 / 0x28 | u32 XP ? / second counter |
| 0x32 / 0x34 | u16 current HP / EP |
| 0x3A–0x3D | Core stats (base + bonus) |
| 0x40–0x5B | Derived stats |
| 0x68 / 0x80 | 0x18 bytes each |
| 0x98 | 4 powers × 8 bytes: u16 id, u16, u8 level ? |

### 5.3 Save triggers and load path
- **Manual save:** Pause → Save (see 3.2).
- **Autosave** ("Autosave.pdm", in 0x1002ea50):
  - Mission complete: advance the mission (0x10052354), then write without chunks.
  - Map transition within a mission: write with chunks. Shows menus 32.
- **Load path:** 0x100509f0 → 0x10050ab0 → start the map. On map entry, that map's chunk is loaded via 0x10050e0c, or the plain .mdd if there is none. The party is rebuilt by 0x1002dda8.

### 5.4 game.cfg (load 0x100260c4, save 0x10026328)
Layout: `u32 CRC32(next 0x48 bytes)` followed by 0x48 bytes:

| Offset (in the 0x48) | Type | Content |
|---|---|---|
| +0x00 | u32 | Unused |
| +0x04 | u16 | Volume → cfg+8 |
| +0x06 | u16 | Volume → cfg+0xA |
| +0x08 | u16 | Volume → cfg+0xC |
| +0x0C | u32 | Language: 0 English, 1 _fr, 2 _it, 3 _gr, 4 _sp |
| +0x10 | u8 | cfg[0] |
| +0x11 | u8 | cfg[1] = mute-in-call |
| +0x14 | 13×u32 | Action key masks. Default table 0x100f76bc: 0x800, 0x2000, 0x4000, 0x100, 0x1000, 0x400, 0x10000, 0x8000, 0x200, 0x8, 0x4, 0x2, 0x1 |

- Which volume is Sound, Music or Voice is **UNKNOWN**. The getters are 0x100ac658, 0x100ac6d0 and 0x100ac694, in Audio rows 0, 1, 2.
- The language mapping above was checked against the jump table at 0x100265a4 (literals at 0x100265d0–0x10026600); an earlier reading had _gr and _it swapped.
- The default key table's order matches cheat/action usage: 5, 7, 8, 2, 6, 4, 0, 9, 3, Up, Down, Left, Right.
- A CRC mismatch deletes the file and sets cfg+0x67, which triggers the title-screen "Data Corrupted" message.
- Saving is skipped when cfg+0x64 is set or less than 0x400 bytes are free.

---
## 6. Text rendering
### 6.1 Font loading (0x100c192c)
- **ft2:** u32 count (font+4), u32 lineHeight (font+0), u32 flags (non-zero → blend mode 6, else 5), s16 extra spacing at 0x10 (font+0xA; 0 in all shipped fonts). u16 map at 0x20.
- **fnt:** u16 map at 0x0C.
- Glyphs are frames of the same-named .spr.

### 6.2 Glyph lookup and draw (0x100c1d20 wide, 0x100c1af8 narrow)
- **Lookup:** frame = map[c] if c < count, otherwise map[0]. The code uses the map value directly, with no −1, which **contradicts FORMATS.md "frame+1"**. Verify against a font file.
- **Colour and blend:** colour = font+8 (u16 ARGB4444, default 0xFFFF), blend = font+0xC.
- **Newline:** '\n' (0x0A) sets x = x0 and y += lineHeight + 1.
- **Advance:** frame width + spacing. A space uses its own glyph width (2 px in small_7).
- **Tint:** how the colour tint is applied is inside the batch executor 0x100b7b50. **UNKNOWN** (likely a modulate).

### 6.3 Measuring and wrapping
- **Width:** 0x100c20b8 / 0x100c1f6c sum the advances.
- **Characters that fit:** 0x100c2180 / 0x100c200c.
- **Word wrap (0x100c054c):**
  1. Take the characters that fit the width.
  2. Back up to the last space/tab/newline and break after it.
  3. If there is none, break mid-word.
  - Line pitch = lineHeight + elem+0x14 (default 3).
- **Alignment:** flag 0x10 centres each line (x − w/2). Vertical centring as in 4.3. No right alignment.
- **HUD text:** uses 0x100b18b4 setColor(font, r, g, b, a), packed to nibbles.

### 6.4 Language
- **String tables** (0x10026530): `<name><suffix>.txt`, UTF-16LE, one entry per line. Loaded in order: abilities(0), characters(3), items(1), menus(2), scripts(4), objectives(5), abilitydesc(6), itemdesc. The suffix comes from the cfg language index (5.4).
- **Default language** (0x10054900) from User::Language():
  - French 1: codes 2, 11, 21, 24, 51
  - Italian 2: codes 5, 61
  - German 3: codes 3, 12, 22
  - Spanish 4: codes 4, 44, 82, 83
  - Anything else: English 0.
- **Changing language** in Options reloads the string tables and all .dlg slots (0x100494a0).
- **Voice .elp files** have no language suffix.

---
## 7. Main unknowns
- Pause-menu variant mapping.
- Stats, Skills, Equip, Items, CharSelect, Formation and Cheats screen layouts and spending rules (only resources and labels are identified).
- Backlight, Bluetooth and KeyConfig screen layouts.
- The xpie / level-up screen.
- The loading screen.
- Status icon meanings.
- Which volume is which.
- Fields in map chunks and entity data.
- The batch executor's tint and blend behaviour.
