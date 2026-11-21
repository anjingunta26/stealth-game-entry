// main.js — bootstrap and game state machine for Umbral Shift.
// States: 'title' -> 'play' -> 'alert' (game over) | 'win'. R restarts from play/alert/win.
// Also hosts the ?shot= auto-demo mode used for deterministic screenshots.

import { buildWorld, WORLD_W, WORLD_H, rectsOverlap, moveCircle } from './world.js';
import { createPlayer, updatePlayer } from './player.js';
import { createGuards, updateGuards, guardSeesPlayer } from './guard.js';
import { drawWorld, drawGuards, drawPlayer, drawExit, drawTitle, drawEndScreen } from './render.js';
import { createInput, attachInput } from './input.js';
import { createAudio } from './audio.js';
import { createHud, drawHud } from './hud.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot');           // 'title' | 'play' | 'alert' | 'win' | null
const SEED = parseInt(params.get('seed') ?? '1', 10) || 1;

const world = buildWorld();
const player = createPlayer(world.spawn.x, world.spawn.y);
const guards = createGuards(world);
const input = createInput();
attachInput(window, canvas, input);
const audio = createAudio();
const hud = createHud();

let state = 'title';        // title | play | alert | win
let detection = 0;          // 0..100 detection meter
let alertTimer = 0;         // seconds left in the alert state before game over
let elapsed = 0;            // seconds in the current run
let demoT = 0;              // demo-mode clock
let demoStartAt = 0;        // when the scripted demo began (performance.now ms)

const ALERT_SECONDS = 2.2;

function startRun() {
  player.x = world.spawn.x;
  player.y = world.spawn.y;
  player.moveTarget = null;
  detection = 0;
  alertTimer = 0;
  elapsed = 0;
  for (const g of guards) g.reset();
  state = 'play';
  audio.resume();
  audio.beep('start');
}

function update(dt) {
  if (state === 'title') {
    if (input.consumeStart()) startRun();
    return;
  }
  if (state === 'win' || state === 'alert') {
    if (input.consumeRestart()) startRun();
    return;
  }

  // ---- play ----
  elapsed += dt;
  if (input.clickTarget) {
    // Convert screen-space click to world space using the same camera as draw().
    const camX = Math.max(0, Math.min(WORLD_W - canvas.width, player.x - canvas.width / 2));
    const camY = Math.max(0, Math.min(WORLD_H - canvas.height, player.y - canvas.height / 2));
    player.moveTarget = { x: input.clickTarget.x + camX, y: input.clickTarget.y + camY };
    input.clickTarget = null;
  }
  updatePlayer(player, input, world, dt);
  updateGuards(guards, world, dt, elapsed);

  // Detection: any guard with unblocked line of sight fills the meter.
  let seen = false;
  for (const g of guards) {
    if (guardSeesPlayer(g, player, world, detection)) {
      seen = true;
      detection = Math.min(100, detection + dt * 55);
    }
  }
  if (!seen) detection = Math.max(0, detection - dt * 22);

  if (detection >= 100) {
    state = 'alert';
    alertTimer = ALERT_SECONDS;
    audio.alarm();
  }

  // Win: reach the exit zone while not fully detected.
  if (world.exit && rectsOverlap({ x: player.x - player.r, y: player.y - player.r, w: player.r * 2, h: player.r * 2 }, world.exit)) {
    state = 'win';
    audio.win();
  }

  // Footstep sounds while moving.
  player.stepAcc = (player.stepAcc ?? 0) + dt * (input.moving ? 1 : 0);
  if (player.stepAcc > 0.34) { player.stepAcc = 0; audio.step(); }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state === 'title') {
    drawTitle(ctx, canvas.width, canvas.height, elapsed);
    return;
  }
  // Camera follows the player, clamped to the world.
  const camX = Math.max(0, Math.min(WORLD_W - canvas.width, player.x - canvas.width / 2));
  const camY = Math.max(0, Math.min(WORLD_H - canvas.height, player.y - canvas.height / 2));
  ctx.save();
  ctx.translate(-camX, -camY);
  drawExit(ctx, world.exit);
  drawWorld(ctx, world);
  drawGuards(ctx, guards, detection);
  drawPlayer(ctx, player);
  ctx.restore();
  drawHud(ctx, hud, canvas.width, detection, state, elapsed);
  if (state === 'alert') {
    drawEndScreen(ctx, canvas.width, canvas.height, 'alert');
  } else if (state === 'win') {
    drawEndScreen(ctx, canvas.width, canvas.height, 'win');
  }
}

// ---- fixed-timestep loop ----
let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05;
  if (SHOT) runDemo(now);
  else update(dt);
  draw();
  requestAnimationFrame(frame);
}

// Deterministic scripted demo so headless screenshots show real gameplay.
// demoT is measured from when the run actually starts, so early load frames don't count.
function runDemo(nowMs) {
  if (state === 'title') {
    if (SHOT === 'title') return; // stay on the title screen
    startRun();
    demoStartAt = nowMs;
    return;
  }
  if (state !== 'play') return;
  demoT = (nowMs - demoStartAt) / 1000;

  if (SHOT === 'play') {
    // Walk right, down the open corridor, and end behind a crate lower in the map
    // so the exit zone is also in frame for the screenshot.
    const path = [
      { x: world.spawn.x, y: world.spawn.y },
      { x: 9.5 * 40, y: 1.5 * 40 },
      { x: 9.5 * 40, y: 7.5 * 40 },
      { x: 14.0 * 40, y: 14.0 * 40 },
      { x: 14.0 * 40, y: 14.0 * 40 },
    ];
    const seg = Math.min(path.length - 2, Math.floor(demoT / 0.9));
    const a = path[seg];
    const b = path[seg + 1];
    const local = Math.min(1, (demoT - seg * 0.9) / 0.9);
    const tx = a.x + (b.x - a.x) * local;
    const ty = a.y + (b.y - a.y) * local;
    const dx = Math.sign(tx - player.x) * Math.min(Math.abs(tx - player.x), 150 * 0.016);
    const dy = Math.sign(ty - player.y) * Math.min(Math.abs(ty - player.y), 150 * 0.016);
    const pos = moveCircle(world, player.x, player.y, player.r, dx, dy);
    player.x = pos.x;
    player.y = pos.y;
    player.moveTarget = null;
  } else if (SHOT === 'alert') {
    // Pin the player on sentry 0's vertical patrol lane so the cone catches us
    // for a full leg of the route.
    if (demoT > 0.5) {
      player.x = 3.5 * 40;
      player.y = 10.75 * 40;
    }
  } else if (SHOT === 'win') {
    // Teleport near the exit and step in.
    if (demoT > 1.0) { player.x = world.exit.x + 20; player.y = world.exit.y + 40; }
  }

  elapsed += 0.016;
  updateGuards(guards, world, 0.016, elapsed);
  let seen = false;
  for (const g of guards) if (guardSeesPlayer(g, player, world, detection)) { seen = true; detection = Math.min(100, detection + 0.016 * 90); }
  if (!seen) detection = Math.max(0, detection - 0.016 * 22);
  if (SHOT === 'alert' && detection >= 100) { state = 'alert'; alertTimer = ALERT_SECONDS; audio.alarm(); }
  if (SHOT !== 'alert' && detection >= 100) { state = 'alert'; alertTimer = ALERT_SECONDS; }
  if (world.exit && rectsOverlap({ x: player.x - player.r, y: player.y - player.r, w: player.r * 2, h: player.r * 2 }, world.exit) && detection < 100) {
    state = 'win';
  }
}

requestAnimationFrame(frame);
