// world.js — the Lunarium Mint level: walls, cover crates, the exit gate and guard spawn points.
// The map is a grid of tiles; '#' is a solid wall, '.' is walkable floor, 'C' is a cover crate,
// 'E' is the exit zone. Everything is measured in pixels through TILE.

export const TILE = 40;

export const LEVEL_MAP = [
  '################################',
  '#......#........#........#......#',
  '#......#........#........#......#',
  '#..C...#...C....#....C...#..C...#',
  '#......#........#........#......#',
  '#......#........#........#......#',
  '###.####........####.########.###',
  '#..............................#',
  '#..C..............C........C...#',
  '#..............................#',
  '#......####.####.####.####.....#',
  '#......#...............#.......#',
  '#..C...#...C.......C...#...C...#',
  '#......#...............#.......#',
  '###.####..............####.#####',
  '#..............................#',
  '#..........C........C..........#',
  '#..............................#',
  '#....####.####.####.####........#',
  '#..............................#',
  '#..C..............C............#',
  '#..............................#',
  '###################.############',
  '#..........................E....#',
  '################################',
];

export const WORLD_COLS = LEVEL_MAP[0].length;
export const WORLD_ROWS = LEVEL_MAP.length;
export const WORLD_W = WORLD_COLS * TILE;
export const WORLD_H = WORLD_ROWS * TILE;

// Build the solid rectangles (walls + crates) and the exit zone from the tile map.
export function buildWorld() {
  const solids = [];   // {x, y, w, h} rectangles that block movement and sight
  const crates = [];   // cover crates (same as solids, drawn differently)
  let exit = null;     // {x, y, w, h}
  let spawn = { x: 0, y: 0 };

  for (let row = 0; row < WORLD_ROWS; row++) {
    const line = LEVEL_MAP[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      const x = col * TILE;
      const y = row * TILE;
      if (ch === '#') solids.push({ x, y, w: TILE, h: TILE });
      else if (ch === 'C') {
        const c = { x: x + 4, y: y + 4, w: TILE - 8, h: TILE - 8 };
        solids.push(c);
        crates.push(c);
      } else if (ch === 'E') {
        exit = { x: x + 2, y: y + 2, w: TILE - 4, h: TILE * 2 - 4 };
      }
    }
  }

  // Player spawn: top-left open floor.
  spawn = { x: 1.5 * TILE, y: 1.5 * TILE };

  return { solids, crates, exit, spawn, cols: WORLD_COLS, rows: WORLD_ROWS };
}

// Axis-aligned rectangle overlap test.
export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Move a circle (radius r) inside the world, colliding with every solid rectangle.
// Returns the corrected {x, y}.
export function moveCircle(world, x, y, r, dx, dy) {
  // Try the full move on X then Y so we can slide along walls.
  let nx = x + dx;
  let ny = y;
  const box = { x: nx - r, y: ny - r, w: r * 2, h: r * 2 };
  for (const s of world.solids) {
    if (rectsOverlap(box, s)) { nx = dx > 0 ? s.x - r : s.x + s.w + r; break; }
  }
  ny = y + dy;
  const box2 = { x: nx - r, y: ny - r, w: r * 2, h: r * 2 };
  for (const s of world.solids) {
    if (rectsOverlap(box2, s)) { ny = dy > 0 ? s.y - r : s.y + s.h + r; break; }
  }
  // Keep inside the outer walls.
  nx = Math.max(r + TILE, Math.min(WORLD_W - r - TILE, nx));
  ny = Math.max(r + TILE, Math.min(WORLD_H - r - TILE, ny));
  return { x: nx, y: ny };
}

// Segment vs rectangle intersection (for line-of-sight checks against cover/walls).
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Liang-Barsky clipping.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - rect.x, rect.x + rect.w - x1, y1 - rect.y, rect.y + rect.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const r = q[i] / p[i];
      if (p[i] < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
      else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
  }
  return true;
}

// Is the straight line from (x1,y1) to (x2,y2) blocked by any solid?
export function lineBlocked(world, x1, y1, x2, y2) {
  for (const s of world.solids) {
    if (segmentHitsRect(x1, y1, x2, y2, s)) return true;
  }
  return false;
}
