// input.js — keyboard state plus mouse click-to-move targeting.

export function createInput() {
  return {
    keys: new Set(),       // held key names (lowercased)
    moving: false,        // set by player update
    clickTarget: null,    // {x, y} in world coords from the last click
    startPressed: false,  // edge-triggered: ENTER / click on title
    restartPressed: false,// edge-triggered: R
    consumeStart() { const v = this.startPressed; this.startPressed = false; return v; },
    consumeRestart() { const v = this.restartPressed; this.restartPressed = false; return v; },
  };
}

export function attachInput(win, canvas, input) {
  win.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    input.keys.add(k);
    if (k === 'enter' || k === ' ') input.startPressed = true;
    if (k === 'r') input.restartPressed = true;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  });
  win.addEventListener('keyup', (e) => {
    input.keys.delete(e.key.toLowerCase());
  });
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    input.clickTarget = {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy,
    };
    input.startPressed = true; // clicking also starts the game from the title
  });
}
