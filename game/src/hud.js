// hud.js — the detection meter and run info drawn over the game.

export function createHud() {
  return { label: 'DETECTION' };
}

export function drawHud(ctx, hud, canvasW, detection, state, elapsed) {
  // Top bar background.
  ctx.fillStyle = 'rgba(8, 10, 22, 0.75)';
  ctx.fillRect(0, 0, canvasW, 46);

  // Detection meter.
  const mx = 20;
  const my = 14;
  const mw = 300;
  const mh = 18;
  ctx.fillStyle = '#1a2038';
  ctx.fillRect(mx, my, mw, mh);
  const frac = detection / 100;
  const hue = detection > 55 ? '#ff5442' : detection > 25 ? '#ffd65a' : '#37d99a';
  ctx.fillStyle = hue;
  ctx.fillRect(mx + 2, my + 2, (mw - 4) * frac, mh - 4);
  ctx.strokeStyle = '#3a467c';
  ctx.lineWidth = 2;
  ctx.strokeRect(mx, my, mw, mh);
  ctx.fillStyle = '#c7d0f5';
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${hud.label} ${Math.floor(detection)}%`, mx + mw + 12, my + 14);

  // Timer and state text on the right.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#8f9bd6';
  ctx.font = '14px "Courier New", monospace';
  const mm = Math.floor(elapsed / 60);
  const ss = Math.floor(elapsed % 60).toString().padStart(2, '0');
  ctx.fillText(`SHIFT ${mm}:${ss}   |   R restart`, canvasW - 20, 28);
}
