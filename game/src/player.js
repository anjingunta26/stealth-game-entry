// player.js — the courier: position, movement (keyboard + point-and-click target), radius.

import { moveCircle } from './world.js';

export const PLAYER_SPEED = 170;   // px per second
export const PLAYER_RADIUS = 11;

export function createPlayer(x, y) {
  return {
    x, y,
    r: PLAYER_RADIUS,
    moveTarget: null,   // {x, y} set by mouse click, or null for pure keyboard
    facing: 1,          // 1 = right, -1 = left (for drawing)
  };
}

export function updatePlayer(player, input, world, dt) {
  let dx = 0;
  let dy = 0;
  if (input.keys.has('arrowleft') || input.keys.has('a')) dx -= 1;
  if (input.keys.has('arrowright') || input.keys.has('d')) dx += 1;
  if (input.keys.has('arrowup') || input.keys.has('w')) dy -= 1;
  if (input.keys.has('arrowdown') || input.keys.has('s')) dy += 1;

  if (dx !== 0 || dy !== 0) {
    // Keyboard movement overrides any click target.
    player.moveTarget = null;
    input.moving = true;
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
  } else if (player.moveTarget) {
    input.moving = true;
    const tx = player.moveTarget.x - player.x;
    const ty = player.moveTarget.y - player.y;
    const dist = Math.hypot(tx, ty);
    if (dist < 6) {
      player.moveTarget = null;
      input.moving = false;
    } else {
      dx = tx / dist; dy = ty / dist;
    }
  } else {
    input.moving = false;
  }

  if (dx !== 0 || dy !== 0) {
    if (dx !== 0) player.facing = dx > 0 ? 1 : -1;
    const pos = moveCircle(world, player.x, player.y, player.r, dx * PLAYER_SPEED * dt, dy * PLAYER_SPEED * dt);
    player.x = pos.x;
    player.y = pos.y;
  }
}
