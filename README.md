# Velvet Fox — A Midnight Heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/qazzk13/makefun-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/qazzk13/makefun-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

You are Wren, the Velvet Fox. Three rooms stand between you and the night: the Marlow Gallery, the Halcyon Vault and the Gilded Penthouse. Dodge the guards' amber vision cones and the cameras' red sweeps, lift the loot, then slip out the green exit before the alarm meter fills. A full alarm means you are caught.

Each room has more than one route to the loot, and two tools at a cost: smoke pellets (Q) that blind every watcher for a few seconds, and tossed coins (E or mouse click) that lure the nearest guard away to investigate. Bonus coins, a par-time bonus and a stealth bonus feed the score — clean runs pay best.

## Run it

```sh
node serve.ts          # serves game/ on http://localhost:8080
```

or hand the entry in and play the copy:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## How it plays

- **Move:** WASD or arrow keys. **Smoke:** Q (limited per room). **Lure a guard:** E or click where the coin should land (limited per room).
- **Guards** patrol set routes and pause at each waypoint; their amber cones are blocked by walls and by smoke. **Cameras** sweep fixed arcs from the walls.
- **Being seen raises the alarm** — guards faster than cameras. Unseen, the alarm slowly falls. At 100% you are caught.
- **Grabbing the loot** trips its case alarm (+15%) and unlocks the green exit. Reach the exit to clear the room.
- **Keys:** Enter start / continue · R restart level · P pause · Esc menu · M mute.
- **Sounds** are synthesised with WebAudio — no audio files, no network requests. The game runs fully offline from its own files.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
