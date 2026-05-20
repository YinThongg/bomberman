# Bomberman (Phaser 3)

A local 2-player Bomberman clone built with [Phaser 3](https://phaser.io/).

## Running the game

You need a local HTTP server because browsers block ES modules from `file://` URLs.

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

---

## Project structure

```
bomberman/
├── index.html
├── src/
│   ├── main.js                  # Phaser config, registers scenes
│   ├── config/constants.js      # Grid size, tile types, power-up types, colors
│   ├── scenes/
│   │   ├── BootScene.js         # Loads all assets, then starts GameScene
│   │   └── GameScene.js         # Game loop, grid, bombs, deaths, power-ups
│   └── entities/
│       ├── Player.js            # Movement, bomb placement, power-up collection
│       ├── Bomb.js              # Countdown, explosion rays, chain reactions
│       └── PowerUp.js           # Spawned on soft-wall destruction
└── assets/
    ├── tiles/                   # 16×16 tile sprites (see setup below)
    ├── sprites/                 # Character / bomb / explosion sprites
    └── audio/                   # Sound effects (WAV)
```

---

## Controls

| Action       | Player 1  | Player 2    |
|--------------|-----------|-------------|
| Move up      | I         | W           |
| Move left    | J         | A           |
| Move down    | K         | S           |
| Move right   | L         | D           |
| Place bomb   | Space     | Left Shift  |
| Restart      | R (either player) |     |

---

## Asset setup

The game uses free CC0 assets. You need to download them once and place them in the right folders before running.

### 1. Tile sprites — Kenney "Tiny Dungeon"

1. Go to **[kenney.nl/assets/tiny-dungeon](https://kenney.nl/assets/tiny-dungeon)** → Download (free, no account needed).
2. Extract the ZIP. Inside you'll find a `Tilemap/` folder with a `tilemap_packed.png` and individual tile PNGs.
3. Copy these files and **rename** them as shown:

| File from pack (example names)    | Save as                      |
|-----------------------------------|------------------------------|
| A plain stone/dungeon floor tile  | `assets/tiles/floor.png`     |
| A slightly different floor tile   | `assets/tiles/floor_alt.png` |
| A solid stone wall tile           | `assets/tiles/wall.png`      |
| A crate or wooden barrel tile     | `assets/tiles/soft_wall.png` |

The exact filenames in the pack may vary — just pick tiles that look right and rename them. All tiles are 16×16; the game scales them to 48×48 automatically.

### 2. Character sprites — Kenney "Tiny Dungeon" (same pack)

Inside the pack look for a `Characters/` folder. Pick two character sprites and save as:

| Save as                            |
|------------------------------------|
| `assets/sprites/player_blue.png`   |
| `assets/sprites/player_red.png`    |

Optionally tint or color them differently in an image editor to tell the players apart.

### 3. Bomb / explosion / power-up sprites — Kenney "Roguelike RPG Pack"

1. Go to **[kenney.nl/assets/roguelike-rpg-pack](https://kenney.nl/assets/roguelike-rpg-pack)** → Download.
2. Find sprites that fit and save them as:

| Save as                              | Suggested sprite             |
|--------------------------------------|------------------------------|
| `assets/sprites/bomb.png`            | Any bomb/orb sprite          |
| `assets/sprites/explosion.png`       | Fire / explosion tile        |
| `assets/sprites/powerup_bomb.png`    | A bag or extra-bomb icon     |
| `assets/sprites/powerup_range.png`   | A lightning bolt or arrow    |

All sprite sizes will be scaled automatically.

---

## Sound effects

All four sounds can be **generated in 30 seconds** using [sfxr.me](https://sfxr.me) (free, runs in the browser, exports WAV):

| File to create                    | sfxr preset to use                |
|-----------------------------------|-----------------------------------|
| `assets/audio/bomb_place.wav`     | "Powerup" → tweak to be short     |
| `assets/audio/explosion.wav`      | "Explosion"                       |
| `assets/audio/player_death.wav`   | "Hit/Hurt"                        |
| `assets/audio/powerup_pickup.wav` | "Powerup"                         |

Alternatively, grab from **[Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds)** (also CC0).

> **Note:** browsers require a user gesture before playing audio. Any keypress or click unlocks the audio context — all sounds will work normally once a player starts moving.

---

## Power-ups

| Icon color | Effect                              |
|------------|-------------------------------------|
| Yellow     | +1 max bomb (stack up to place more)|
| Purple     | +1 explosion range                  |

Power-ups spawn with 30% probability when a soft wall is destroyed. Walk over one to collect it.
