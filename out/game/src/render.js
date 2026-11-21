// render.js — all canvas drawing: flat-color art drawn in code, no images.

import { TILE, WORLD_W, WORLD_H } from './world.js';
import { coneParams } from './guard.js';

const FLOOR_A = '#171c33';
const FLOOR_B = '#141830';
const WALL = '#2c3560';
const WALL_TOP = '#3a467c';
const CRATE = '#6b4f2a';
const CRATE_EDGE = '#8a683a';
const EXIT = '#1d5c46';
const EXIT_GLOW = '#37d99a';

export function drawExit(ctx, exit) {
  if (!exit) return;
  ctx.fillStyle = EXIT;
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = EXIT_GLOW;
  ctx.lineWidth = 3;
  ctx.strokeRect(exit.x + 2, exit.y + 2, exit.w - 4, exit.h - 4);
  ctx.fillStyle = EXIT_GLOW;
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 - 4);
  ctx.font = '10px "Courier New", monospace';
  ctx.fillText('the vault lift', exit.x + exit.w / 2, exit.y + exit.h / 2 + 12);
}

export function drawWorld(ctx, world) {
  // Checkerboard floor.
  for (let row = 0; row < world.rows; row++) {
    for (let col = 0; col < world.cols; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
    }
  }
  // Walls (solid tiles that are not crates): draw every solid that is tile-sized as wall,
  // crates separately with a wooden look.
  for (const s of world.solids) {
    if (s.w === TILE && s.h === TILE) {
      ctx.fillStyle = WALL;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = WALL_TOP;
      ctx.fillRect(s.x, s.y, s.w, 6);
    }
  }
  // Cover crates.
  for (const c of world.crates) {
    ctx.fillStyle = CRATE;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = CRATE_EDGE;
    ctx.lineWidth = 3;
    ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
    ctx.beginPath();
    ctx.moveTo(c.x + 2, c.y + 2);
    ctx.lineTo(c.x + c.w - 2, c.y + c.h - 2);
    ctx.moveTo(c.x + c.w - 2, c.y + 2);
    ctx.lineTo(c.x + 2, c.y + c.h - 2);
    ctx.stroke();
  }
  // World border glow.
  ctx.strokeStyle = '#232a4d';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, WORLD_W, WORLD_H);
}

export function drawGuards(ctx, guards, detection) {
  const { range, halfAngle, alert } = coneParams(detection);
  for (const g of guards) {
    // Vision cone (drawn first, under the body).
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.arc(g.x, g.y, range, g.facing - halfAngle, g.facing + halfAngle);
    ctx.closePath();
    ctx.fillStyle = alert ? 'rgba(255, 84, 66, 0.28)' : 'rgba(255, 214, 90, 0.20)';
    ctx.fill();
    ctx.strokeStyle = alert ? 'rgba(255, 84, 66, 0.55)' : 'rgba(255, 214, 90, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Body: dark uniform disc with a lighter head.
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    ctx.fillStyle = alert ? '#7a1f18' : '#232946';
    ctx.fill();
    ctx.strokeStyle = alert ? '#ff5442' : '#8f9bd6';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing indicator.
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.facing) * (g.r + 6), g.y + Math.sin(g.facing) * (g.r + 6));
    ctx.strokeStyle = alert ? '#ff5442' : '#c7d0f5';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

export function drawPlayer(ctx, player) {
  // Cloaked courier: teal disc with a small hood triangle in the facing direction.
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fillStyle = '#39d0c4';
  ctx.fill();
  ctx.strokeStyle = '#0e6f68';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  const a = player.facing >= 0 ? 0 : Math.PI;
  ctx.moveTo(player.x + Math.cos(a) * player.r, player.y + Math.sin(a) * player.r);
  ctx.lineTo(player.x + Math.cos(a + 0.5) * player.r * 0.7, player.y + Math.sin(a + 0.5) * player.r * 0.7);
  ctx.lineTo(player.x + Math.cos(a - 0.5) * player.r * 0.7, player.y + Math.sin(a - 0.5) * player.r * 0.7);
  ctx.closePath();
  ctx.fillStyle = '#0e6f68';
  ctx.fill();
  // Click target marker.
  if (player.moveTarget) {
    ctx.beginPath();
    ctx.arc(player.moveTarget.x, player.moveTarget.y, 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#39d0c4';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export function drawTitle(ctx, w, h, t) {
  ctx.fillStyle = '#0b0e1a';
  ctx.fillRect(0, 0, w, h);
  // Decorative cones in the background.
  for (let i = 0; i < 5; i++) {
    const x = 120 + i * 260;
    const sway = Math.sin(t * 0.6 + i) * 0.25;
    ctx.beginPath();
    ctx.moveTo(x, 620);
    ctx.arc(x, 620, 190, -Math.PI / 2 - 0.4 + sway, -Math.PI / 2 + 0.4 + sway);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 214, 90, 0.07)';
    ctx.fill();
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#37d99a';
  ctx.font = 'bold 64px "Courier New", monospace';
  ctx.fillText('UMBRAL SHIFT', w / 2, 240);
  ctx.fillStyle = '#c7d0f5';
  ctx.font = '20px "Courier New", monospace';
  ctx.fillText('A night-shift courier. The Lunarium Mint. One unseen crossing.', w / 2, 300);
  ctx.fillText('Reach the vault lift (EXIT) without filling the detection meter.', w / 2, 330);

  ctx.fillStyle = '#8f9bd6';
  ctx.font = '18px "Courier New", monospace';
  ctx.fillText('MOVE: WASD or arrow keys   |   or CLICK a spot to walk there', w / 2, 430);
  ctx.fillText('HIDE behind crates — walls and crates block sight lines', w / 2, 460);
  ctx.fillText('R: restart      ENTER / CLICK: start', w / 2, 490);

  const blink = Math.sin(t * 4) > -0.2;
  if (blink) {
    ctx.fillStyle = '#ffd65a';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillText('PRESS ENTER TO CLOCK IN', w / 2, 570);
  }
}

export function drawEndScreen(ctx, w, h, kind) {
  ctx.fillStyle = kind === 'win' ? 'rgba(10, 40, 30, 0.82)' : 'rgba(50, 8, 8, 0.82)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  if (kind === 'win') {
    ctx.fillStyle = '#37d99a';
    ctx.font = 'bold 56px "Courier New", monospace';
    ctx.fillText('SHIFT COMPLETE', w / 2, h / 2 - 40);
    ctx.fillStyle = '#c7d0f5';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText('You reached the vault lift unseen. The mint never knew you were there.', w / 2, h / 2 + 10);
  } else {
    ctx.fillStyle = '#ff5442';
    ctx.font = 'bold 56px "Courier New", monospace';
    ctx.fillText('SPOTTED — ALARM', w / 2, h / 2 - 40);
    ctx.fillStyle = '#f0b8b2';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText('A sentry saw you. The shift is over.', w / 2, h / 2 + 10);
  }
  ctx.fillStyle = '#ffd65a';
  ctx.font = 'bold 22px "Courier New", monospace';
  ctx.fillText('PRESS R TO TRY AGAIN', w / 2, h / 2 + 70);
}
