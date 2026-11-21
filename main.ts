// Entry program for the make.fun stealth-game bounty. Node 22, standard library only.
// It hands in this repository's game/ and screenshots/ and writes the judge's dossier.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
const shots = join(here, 'screenshots');
if (existsSync(shots)) cpSync(shots, join(out, 'screenshots'), { recursive: true });

// Local mirror of the sealed scorer's caps, so a too-big entry fails here first:
// dossier text 160 KiB, at most 4 screenshots of 256 KiB, game/ at most 993
// files / 48 MiB with paths under 1000 bytes.
writeFileSync(join(out, 'dossier.json'), buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));
