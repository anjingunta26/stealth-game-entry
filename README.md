# Shadow Courier

An original top-down stealth game for the make.fun bounty
[best-stealth-game-20261121-1759](https://make.fun/bounty/best-stealth-game-20261121-1759).

![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)
![rank](https://make.fun/badge/best-stealth-game-20261121-1759/anjingunta26/stealth-game-entry/rank.svg)
![reward](https://make.fun/badge/best-stealth-game-20261121-1759/anjingunta26/stealth-game-entry/reward.svg)

You are a night courier slipping through a guarded depot. Top-down level, guards
patrol with visible vision cones, crates and walls give cover, and you must reach
the exit unseen. Move with WASD/arrows or click a spot to walk there. `R` restarts.

## Run

Serve `game/` with any static file server and open `game/index.html` in desktop
Chrome. No network requests, no build step.

```
cd game && python3 -m http.server 8080   # then open http://localhost:8080
```

## Hand in

`main.ts` (Node 22) copies `game/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with `buildDossier` from `vendor/makefun-game.ts`.

```
MAKEFUN_OUTPUT_DIR=out node main.ts
```
