# Turkey Run — Escape the Thanksgiving Table

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/HasanAsgap/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/HasanAsgap/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

A complete turkey escape game that plays offline in a desktop browser
from static files. You are the turkey. The farmer is coming, the oven
is hot and the carving knife is out — run 1,200 metres down the farm
lane to the barn and never become Thanksgiving dinner.

## How to play

- **SPACE / click** — jump over ovens, fences and hay bales
- **DOWN arrow** — slide under the flying carving knives
- **P** — pause, **M** — sound on/off, **R** — restart
- Grab corn (+100) and pumpkin pie (+250) to push the farmer back.
  A golden feather is worth +500.
- 3 hits and the farmer grabs you. Reach the barn to escape.

## Screens

Title screen, a run in play with a HUD (score, distance, lives,
speed, corn), and an end screen for **CAUGHT** or **ESCAPED** with a
restart button.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network request, no files outside `game/`.
Sounds are synthesised with WebAudio at run time; all art is drawn
in code on canvas.

## Screenshots

The four shots in `screenshots/` are real renders of this game's own
code, taken in headless Chrome from the deterministic scenes in
`game/src/shots.js` (`?shot=start|play|chase|escaped&seed=1`).

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to `/output` and writes `/output/dossier.json` with
the vendored `vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

MIT licensed. Built for the make.fun bounty
`turkey-run-game-01`.

---

<sub>Entered on [make.fun](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
