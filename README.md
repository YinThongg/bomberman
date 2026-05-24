# Oppenhomie (Bomberman)

A local 2-player Bomberman clone built with [Phaser 3](https://phaser.io/), TypeScript, and Vite.

## Running the game

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

---

## Project structure

```
bomberman/
├── index.html
├── package.json
├── tsconfig.json
├── src/
│   ├── main.ts                   # Phaser config, registers scenes
│   ├── config/constants.ts       # Grid size, tile types, power-up types, colors
│   ├── scenes/
│   │   ├── BootScene.ts          # Loads all assets, then starts TitleScene
│   │   ├── TitleScene.ts         # Mode select screen
│   │   └── GameScene.ts          # Game loop, grid, bombs, deaths, power-ups
│   └── entities/
│       ├── Player.ts             # Movement, bomb placement, power-up collection
│       ├── Bomb.ts               # Countdown, explosion rays, chain reactions
│       └── PowerUp.ts            # Spawned on soft-wall destruction
└── assets/
    ├── tiles/                    # 16×16 tile sprites (see setup below)
    ├── sprites/                  # Character / bomb / explosion sprites
    └── audio/                    # Sound effects (WAV)
```

---

## Game flow

**Boot → Title (mode select) → Game**

- Title screen: click **2P Battle** or press **Enter** to start
- In-game: press **R** to restart the round
- Click the **⌂** home icon (top-left) anytime to return to the title screen

---

## Controls

| Action       | Player 1    | Player 2  |
|--------------|-------------|-----------|
| Move up      | W           | I         |
| Move left    | A           | J         |
| Move down    | S           | K         |
| Move right   | D           | L         |
| Place bomb   | Left Shift  | Space     |
| Restart      | R (either player) |     |

---

## Asset setup

The game uses free CC0 assets. You need to download them once and place them in the right folders before running.

### 1. Tile sprites — Kenney "Tiny Dungeon"

1. Go to **[kenney.nl/assets/tiny-dungeon](https://kenney.nl/assets/tiny-dungeon)** → Download (free, no account needed).
2. Extract the ZIP. Inside you'll find a `Tilemap/` folder with individual tile PNGs.
3. Copy and rename:

| File from pack              | Save as                      |
|-----------------------------|------------------------------|
| A plain floor tile          | `assets/tiles/floor.png`     |
| A slightly different floor  | `assets/tiles/floor_alt.png` |
| A solid stone wall tile     | `assets/tiles/wall.png`      |
| A crate or barrel tile      | `assets/tiles/soft_wall.png` |

All tiles are 16×16; the game scales them to 48×48 automatically.

### 2. Character sprites — Kenney "Tiny Dungeon" (same pack)

Pick two character sprites from the `Characters/` folder:

| Save as                            |
|------------------------------------|
| `assets/sprites/player_blue.png`   |
| `assets/sprites/player_red.png`    |

### 3. Bomb / explosion / power-up sprites — Kenney "Roguelike RPG Pack"

1. Go to **[kenney.nl/assets/roguelike-rpg-pack](https://kenney.nl/assets/roguelike-rpg-pack)** → Download.
2. Find fitting sprites:

| Save as                              | Suggested sprite             |
|--------------------------------------|------------------------------|
| `assets/sprites/bomb.png`            | Any bomb/orb sprite          |
| `assets/sprites/explosion.png`       | Fire / explosion tile        |
| `assets/sprites/powerup_bomb.png`    | A bag or extra-bomb icon     |
| `assets/sprites/powerup_range.png`   | A lightning bolt or arrow    |

---

## Sound effects

Generate using [sfxr.me](https://sfxr.me) (free, browser-based, exports WAV):

| File                              | sfxr preset                       |
|-----------------------------------|-----------------------------------|
| `assets/audio/bomb_place.wav`     | "Powerup" → tweak to be short     |
| `assets/audio/explosion.wav`      | "Explosion"                       |
| `assets/audio/player_death.wav`   | "Hit/Hurt"                        |
| `assets/audio/powerup_pickup.wav` | "Powerup"                         |

Or grab from **[Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds)** (CC0).

---

## Power-ups

| Icon color | Effect                              |
|------------|-------------------------------------|
| Yellow     | +1 max bomb (stack up to place more)|
| Purple     | +1 explosion range                  |

Power-ups spawn with 30% probability when a soft wall is destroyed. Walk over one to collect it.
