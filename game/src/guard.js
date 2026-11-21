// guard.js — mint sentries: waypoint patrols, vision cones, and line-of-sight checks.
// A guard's cone widens and lengthens when alert (high detection), shrinks when calm.

import { lineBlocked, TILE } from './world.js';

export const GUARD_SPEED = 78;        // px per second on patrol
export const GUARD_RADIUS = 12;
export const CONE_RANGE = 240;        // px at calm
export const CONE_HALF_ANGLE = 0.42;  // radians at calm

// Each guard patrols a list of waypoints (pixel coords); ping-pong between ends.
export function createGuards(world) {
  const defs = [
    { waypoints: [[3.5 * TILE, 8.5 * TILE], [9.5 * TILE, 8.5 * TILE], [9.5 * TILE, 12.5 * TILE], [3.5 * TILE, 12.5 * TILE]] },
    { waypoints: [[20.5 * TILE, 3.5 * TILE], [28.5 * TILE, 3.5 * TILE], [28.5 * TILE, 8.5 * TILE]] },
    { waypoints: [[20.5 * TILE, 12.5 * TILE], [27.5 * TILE, 12.5 * TILE], [27.5 * TILE, 17.5 * TILE], [16.5 * TILE, 17.5 * TILE]] },
    { waypoints: [[6.5 * TILE, 20.5 * TILE], [14.5 * TILE, 20.5 * TILE], [14.5 * TILE, 12.5 * TILE]] },
    { waypoints: [[24.5 * TILE, 20.5 * TILE], [30.5 * TILE, 20.5 * TILE]] },
  ];
  return defs.map((d) => ({
    x: d.waypoints[0][0],
    y: d.waypoints[0][1],
    r: GUARD_RADIUS,
    waypoints: d.waypoints,
    wpIndex: 1,
    dir: 1,                 // 1 forward, -1 backward along the list
    facing: 0,              // radians, smoothed toward movement direction
    waitTimer: 0,
    reset() {
      this.x = this.waypoints[0][0];
      this.y = this.waypoints[0][1];
      this.wpIndex = 1;
      this.dir = 1;
      this.waitTimer = 0;
    },
  }));
}

export function updateGuards(guards, world, dt, elapsed) {
  for (const g of guards) {
    if (g.waitTimer > 0) {
      g.waitTimer -= dt;
      continue;
    }
    const wp = g.waypoints[g.wpIndex];
    const tx = wp[0] - g.x;
    const ty = wp[1] - g.y;
    const dist = Math.hypot(tx, ty);
    if (dist < 4) {
      // Reached a waypoint: pause briefly, then continue.
      g.waitTimer = 0.7;
      g.wpIndex += g.dir;
      if (g.wpIndex >= g.waypoints.length) { g.wpIndex = g.waypoints.length - 2; g.dir = -1; }
      if (g.wpIndex < 0) { g.wpIndex = 1; g.dir = 1; }
      continue;
    }
    const step = GUARD_SPEED * dt;
    // Facing tracks the waypoint direction even while blocked.
    g.facing = Math.atan2(ty, tx);
    const nx = g.x + (tx / dist) * step;
    const ny = g.y + (ty / dist) * step;
    // Guards collide with walls (simple axis-separated check).
    const rad = g.r;
    let blockedX = false;
    for (const s of world.solids) {
      if (nx - rad < s.x + s.w && nx + rad > s.x && g.y - rad < s.y + s.h && g.y + rad > s.y) blockedX = true;
    }
    if (!blockedX) g.x = nx;
    let blockedY = false;
    for (const s of world.solids) {
      if (g.x - rad < s.x + s.w && g.x + rad > s.x && ny - rad < s.y + s.h && ny + rad > s.y) blockedY = true;
    }
    if (!blockedY) g.y = ny;
  }
}

// Cone parameters depend on the global detection level: alert widens/lengthens the cone.
export function coneParams(detection) {
  const alert = detection > 55;
  return {
    range: alert ? CONE_RANGE * 1.35 : CONE_RANGE,
    halfAngle: alert ? CONE_HALF_ANGLE * 1.5 : CONE_HALF_ANGLE,
    alert,
  };
}

// Can this guard see the player right now? Needs angle-in-cone, in range, and clear LOS.
export function guardSeesPlayer(guard, player, world, detection = 0) {
  const { range, halfAngle } = coneParams(detection);
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  const ang = Math.atan2(dy, dx);
  let diff = ang - guard.facing;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > halfAngle) return false;
  if (lineBlocked(world, guard.x, guard.y, player.x, player.y)) return false;
  return true;
}
