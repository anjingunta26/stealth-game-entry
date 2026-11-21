// make.fun entry program: package the game and write the judge's dossier.
// Node 22, standard library only. Outside the grader, MAKEFUN_OUTPUT_DIR
// replaces the /output path the sealed runner uses.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repo = fileURLToPath(new URL('.', import.meta.url));
const dest = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(dest, { recursive: true });
cpSync(join(repo, 'game'), join(dest, 'game'), { recursive: true });
mkdirSync(join(dest, 'screenshots'), { recursive: true });
const shotDir = join(repo, 'screenshots');
if (existsSync(shotDir)) cpSync(shotDir, join(dest, 'screenshots'), { recursive: true });

// Same ceilings the sealed scorer enforces, applied up front: dossier text
// capped at 160 KiB, four screenshots of 256 KiB each, and game/ limited to
// 993 files, 48 MiB total, and 1000-byte paths.
writeFileSync(join(dest, 'dossier.json'), buildDossier(dest, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));
