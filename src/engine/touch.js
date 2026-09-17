// On-screen controls for touch devices, feeding the same actions as the keyboard (N-Gage layout).
const BUTTONS = [
  { action: 'attack', label: '5', x: 78, y: 62, size: 64 },
  { action: 'power', label: '7', x: 12, y: 36, size: 52 },
  { action: 'characters', label: '8', x: 70, y: 0, size: 44 },
  { action: 'items', label: '6', x: 132, y: 10, size: 44 },
  { action: 'specials', label: '4', x: 8, y: 100, size: 44 },
];

export function installTouchControls(input) {
  if (!('ontouchstart' in window) && !navigator.maxTouchPoints) return;
  const style = document.createElement('style');
  style.textContent = `
    .tc{position:fixed;bottom:12px;z-index:5;touch-action:none;user-select:none;-webkit-user-select:none}
    .tc-pad{left:12px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.18)}
    .tc-knob{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px;border-radius:50%;background:rgba(255,255,255,.25)}
    .tc-btns{right:12px;width:190px;height:170px}
    .tc-btn{position:absolute;border-radius:50%;background:rgba(242,194,48,.25);border:2px solid rgba(242,194,48,.55);color:#fff;font:bold 18px system-ui;display:flex;align-items:center;justify-content:center}
    .tc-btn.on{background:rgba(242,194,48,.6)}
    .tc-menu{position:fixed;top:10px;right:10px;z-index:5;padding:8px 14px;border-radius:8px;background:rgba(255,255,255,.15);color:#fff;font:14px system-ui;touch-action:none}
    body{padding-bottom:190px}`;
  document.head.append(style);

  // virtual d-pad: 8-way from the drag direction
  const pad = document.createElement('div'); pad.className = 'tc tc-pad';
  const knob = document.createElement('div'); knob.className = 'tc-knob'; pad.append(knob);
  const setDirs = (dx, dy) => {
    for (const d of ['up', 'down', 'left', 'right']) input.down.delete(d);
    const len = Math.hypot(dx, dy);
    knob.style.transform = `translate(${Math.max(-45, Math.min(45, dx))}px,${Math.max(-45, Math.min(45, dy))}px)`;
    if (len < 18) return;
    const a = Math.atan2(dy, dx), s = Math.PI / 8;
    if (a > -7 * s && a < -s) input.down.add('up');
    if (a > s && a < 7 * s) input.down.add('down');
    if (Math.abs(a) > 5 * s) input.down.add('left');
    if (Math.abs(a) < 3 * s) input.down.add('right');
  };
  let padId = null;
  pad.addEventListener('pointerdown', e => { padId = e.pointerId; try { pad.setPointerCapture(e.pointerId); } catch { /* not capturable */ } const r = pad.getBoundingClientRect(); setDirs(e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2); e.preventDefault(); });
  pad.addEventListener('pointermove', e => { if (e.pointerId !== padId) return; const r = pad.getBoundingClientRect(); setDirs(e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2); });
  const padUp = e => { if (e.pointerId !== padId) return; padId = null; setDirs(0, 0); };
  pad.addEventListener('pointerup', padUp); pad.addEventListener('pointercancel', padUp);

  const box = document.createElement('div'); box.className = 'tc tc-btns';
  for (const b of BUTTONS) {
    const el = document.createElement('div');
    el.className = 'tc-btn'; el.textContent = b.label;
    Object.assign(el.style, { left: b.x + 'px', top: b.y + 'px', width: b.size + 'px', height: b.size + 'px' });
    el.addEventListener('pointerdown', e => { try { el.setPointerCapture(e.pointerId); } catch { /* not capturable */ } el.classList.add('on'); if (!input.down.has(b.action)) input.pressed.add(b.action); input.down.add(b.action); e.preventDefault(); });
    const up = () => { el.classList.remove('on'); input.down.delete(b.action); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    box.append(el);
  }
  const menu = document.createElement('div'); menu.className = 'tc-menu'; menu.textContent = 'Menu';
  menu.addEventListener('pointerdown', e => { input.pressed.add('menu'); e.preventDefault(); });
  document.body.append(pad, box, menu);
}
