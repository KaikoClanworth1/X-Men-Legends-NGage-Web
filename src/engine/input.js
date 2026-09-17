// Keyboard + gamepad mapped to the N-Gage controls.
// N-Gage: d-pad (8-way), 5 = action/attack, 7 = power, 9 = switch hero, * / # extra, left/right softkeys = menu.
export const ACTIONS = ['up', 'down', 'left', 'right', 'attack', 'power', 'specials', 'items', 'characters', 'formation', 'objectives', 'stats', 'map', 'menu', 'back'];

// Default N-Gage bindings (docs/specs/core.md): 5 attack, 7 power (hold/release), 4 specials, 6 items, 8 characters,
// 2 formation, 9 objectives, 0 stats, 3 map, softkeys = pause menu. PC keys mirror the phone keypad.
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Digit5: 'attack', Numpad5: 'attack', KeyJ: 'attack', Space: 'attack',
  Digit7: 'power', Numpad7: 'power', KeyK: 'power',
  Digit4: 'specials', Numpad4: 'specials', KeyU: 'specials',
  Digit6: 'items', Numpad6: 'items', KeyI: 'items',
  Digit8: 'characters', Numpad8: 'characters', KeyL: 'characters', Tab: 'characters',
  Digit2: 'formation', Numpad2: 'formation', KeyO: 'formation',
  Digit9: 'objectives', Numpad9: 'objectives',
  Digit0: 'stats', Numpad0: 'stats',
  Digit3: 'map', Numpad3: 'map', KeyM: 'map',
  Enter: 'menu', Escape: 'back', Backspace: 'back',
};

export class Input {
  constructor(target = window) {
    this.down = new Set();
    this.pressed = new Set();
    target.addEventListener('keydown', e => {
      const a = KEYMAP[e.code];
      if (!a) return;
      e.preventDefault();
      this.heldKeys.add(e.code);
      if (!this.down.has(a)) this.pressed.add(a);
      this.down.add(a);
    });
    this.heldKeys = new Set();
    target.addEventListener('keyup', e => {
      const a = KEYMAP[e.code];
      this.heldKeys.delete(e.code);
      if (a && ![...this.heldKeys].some(k => KEYMAP[k] === a)) this.down.delete(a);
    });
    window.addEventListener('blur', () => { this.down.clear(); this.heldKeys.clear(); });
    this.prevPad = new Set();
  }
  pollGamepad() {
    const pad = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null;
    if (!pad) return;
    const now = new Set(), b = i => pad.buttons[i] && pad.buttons[i].pressed, ax = pad.axes;
    if (b(12) || ax[1] < -0.5) now.add('up');
    if (b(13) || ax[1] > 0.5) now.add('down');
    if (b(14) || ax[0] < -0.5) now.add('left');
    if (b(15) || ax[0] > 0.5) now.add('right');
    if (b(0)) now.add('attack');
    if (b(2)) now.add('power');
    if (b(3)) now.add('characters');
    if (b(9)) now.add('menu');
    if (b(1)) now.add('back');
    for (const a of now) { if (!this.prevPad.has(a)) this.pressed.add(a); this.down.add(a); }
    for (const a of this.prevPad) if (!now.has(a)) this.down.delete(a);
    this.prevPad = now;
  }
  isDown(a) { return this.down.has(a); }
  wasPressed(a) { return this.pressed.has(a); }
  endFrame() { this.pressed.clear(); }
}
