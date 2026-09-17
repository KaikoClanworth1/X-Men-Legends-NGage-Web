// Keyboard + gamepad mapped to the N-Gage controls.
// N-Gage: d-pad (8-way), 5 = action/attack, 7 = power, 9 = switch hero, * / # extra, left/right softkeys = menu.
export const ACTIONS = ['up', 'down', 'left', 'right', 'attack', 'power', 'switch', 'star', 'hash', 'menu', 'back'];

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  KeyJ: 'attack', Space: 'attack', Numpad5: 'attack', Digit5: 'attack',
  KeyK: 'power', Numpad7: 'power', Digit7: 'power',
  KeyL: 'switch', Numpad9: 'switch', Digit9: 'switch', Tab: 'switch',
  KeyU: 'star', NumpadMultiply: 'star', KeyI: 'hash', NumpadDivide: 'hash',
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
      if (!this.down.has(a)) this.pressed.add(a);
      this.down.add(a);
    });
    target.addEventListener('keyup', e => { const a = KEYMAP[e.code]; if (a) this.down.delete(a); });
    window.addEventListener('blur', () => this.down.clear());
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
    if (b(3)) now.add('switch');
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
