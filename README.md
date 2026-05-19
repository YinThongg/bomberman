# Bomberman (Phaser 3)

A local 2-player Bomberman clone built with [Phaser 3](https://phaser.io/).

## Running the game

You need a local HTTP server because browsers block ES modules loaded from `file://` URLs.

```bash
# Python 3 (recommended — no install needed)
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

## Project structure

```
bomberman/
├── index.html              # Entry point — loads Phaser from CDN, boots main.js
├── src/
│   ├── main.js             # Phaser game config, registers scenes
│   ├── config/
│   │   └── constants.js    # Grid size, tile types, colors
│   ├── scenes/
│   │   └── GameScene.js    # Main game scene (empty skeleton for now)
│   └── entities/           # Future: Player, Bomb, Explosion classes
└── assets/                 # Future: sprites, sounds, tilemaps
```

## Controls (planned)

| Player | Move | Bomb |
|--------|------|------|
| P1 | WASD | Space |
| P2 | Arrow keys | Enter |
