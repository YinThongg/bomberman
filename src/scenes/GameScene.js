import {
  COLORS,
  GRID_COLS,
  GRID_ROWS,
  TILE_SIZE,
  TILE,
  POWERUP,
} from "../config/constants.js";
import Player from "../entities/Player.js";
import PowerUp from "../entities/PowerUp.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

    // grid is stored on `this` so future methods (collision, explosions) can read it
    this.grid = this.buildLevel();

    // softWallSprites: "col,row" → Image — destroyed when the wall is blown up
    this.softWallSprites = new Map();

    // powerUps: "col,row" → PowerUp — spawned on soft-wall destruction, collected on walk-over
    this.powerUps = new Map();

    this.renderGrid();

    // bombs: "col,row" → Bomb — checked by Player.placeBomb() and cleaned up in onBombExploded()
    this.bombs = new Map();

    this.player1 = new Player(this, 1, 1, "player_blue");
    this.player2 = new Player(this, GRID_COLS - 2, GRID_ROWS - 2, "player_red");

    this.keysP1 = this.input.keyboard.addKeys("I,J,K,L,SPACE");
    this.keysP2 = this.input.keyboard.addKeys("W,A,S,D,SHIFT");
    this.keyRestart = this.input.keyboard.addKey("R");

    this.gameOver = false;
  }

  update() {
    const JD = Phaser.Input.Keyboard.JustDown;

    if (this.gameOver) {
      if (JD(this.keyRestart)) this.scene.restart();
      return;
    }

    // Player 1 — IJKL + Space (only while alive)
    if (this.player1.alive) {
      if (JD(this.keysP1.J)) this.player1.tryMove(-1, 0);
      if (JD(this.keysP1.L)) this.player1.tryMove(1, 0);
      if (JD(this.keysP1.I)) this.player1.tryMove(0, -1);
      if (JD(this.keysP1.K)) this.player1.tryMove(0, 1);
      if (JD(this.keysP1.SPACE)) this.player1.placeBomb();
    }

    // Player 2 — WASD + Shift (only while alive)
    if (this.player2.alive) {
      if (JD(this.keysP2.A)) this.player2.tryMove(-1, 0);
      if (JD(this.keysP2.D)) this.player2.tryMove(1, 0);
      if (JD(this.keysP2.W)) this.player2.tryMove(0, -1);
      if (JD(this.keysP2.S)) this.player2.tryMove(0, 1);
      if (JD(this.keysP2.SHIFT)) this.player2.placeBomb();
    }
  }

  // ── Grid ──────────────────────────────────────────────────────────────────

  // Returns a 2D array [row][col] of TILE values describing the level layout.
  //
  // Pass 1 — hard structure:
  //   Border + pillar cells → WALL, everything else → FLOOR.
  //
  // Pass 2 — soft walls:
  //   70 % of remaining FLOOR tiles become SOFT_WALL, with a 3-tile L-shaped
  //   safe zone around each spawn so players aren't immediately trapped.
  buildLevel() {
    const grid = [];

    for (let row = 0; row < GRID_ROWS; row++) {
      grid[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        const onBorder =
          row === 0 ||
          row === GRID_ROWS - 1 ||
          col === 0 ||
          col === GRID_COLS - 1;
        const isPillar = row % 2 === 0 && col % 2 === 0;
        grid[row][col] = onBorder || isPillar ? TILE.WALL : TILE.FLOOR;
      }
    }

    const p2c = GRID_COLS - 2;
    const p2r = GRID_ROWS - 2;
    const safe = new Set([
      "1,1",
      "2,1",
      "1,2",
      `${p2c},${p2r}`,
      `${p2c - 1},${p2r}`,
      `${p2c},${p2r - 1}`,
    ]);

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (
          grid[row][col] === TILE.FLOOR &&
          !safe.has(`${col},${row}`) &&
          Math.random() < 0.7
        ) {
          grid[row][col] = TILE.SOFT_WALL;
        }
      }
    }

    return grid;
  }

  // Draws every cell using sprites loaded by BootScene.
  // Floor tiles under soft walls are drawn first so they show through
  // after the soft wall sprite is destroyed.
  renderGrid() {
    const half = TILE_SIZE / 2;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = col * TILE_SIZE + half;
        const y = row * TILE_SIZE + half;
        const tile = this.grid[row][col];
        const floorKey =
          (row + col) % 2 === 0 ? "tile_floor" : "tile_floor_alt";

        if (tile === TILE.WALL) {
          this.add
            .image(x, y, "tile_wall")
            .setDisplaySize(TILE_SIZE, TILE_SIZE);
        } else if (tile === TILE.SOFT_WALL) {
          this.add.image(x, y, floorKey).setDisplaySize(TILE_SIZE, TILE_SIZE);
          const sprite = this.add
            .image(x, y, "tile_soft_wall")
            .setDisplaySize(TILE_SIZE, TILE_SIZE);
          this.softWallSprites.set(`${col},${row}`, sprite);
        } else {
          this.add.image(x, y, floorKey).setDisplaySize(TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  // ── Explosion ────────────────────────────────────────────────────────────

  // Returns { tiles, revealed } for every tile the explosion reaches.
  //
  //   tiles    — array of {col, row} the blast covers (used for visuals + deaths)
  //   revealed — Set of "col,row" keys that were soft walls just destroyed by
  //              this explosion. Power-ups spawned on these tiles must NOT be
  //              immediately destroyed — they were hidden inside the wall.
  //
  // Stopping rules per ray:
  //   WALL      → stop, do NOT include (indestructible)
  //   SOFT_WALL → include, destroy it, then stop (consumed by blast)
  //   FLOOR     → include, keep walking
  getExplosionTiles(col, row, range) {
    const tiles    = [{ col, row }];
    const revealed = new Set();
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dc, dr] of directions) {
      for (let i = 1; i <= range; i++) {
        const nc = col + dc * i;
        const nr = row + dr * i;
        const tile = this.grid[nr][nc];

        if (tile === TILE.WALL) break;

        if (tile === TILE.SOFT_WALL) {
          tiles.push({ col: nc, row: nr });
          this.destroySoftWall(nc, nr);   // may spawn a power-up here
          revealed.add(`${nc},${nr}`);    // mark so Bomb skips it in destroyPowerUpAt
          break;
        }

        tiles.push({ col: nc, row: nr });
      }
    }

    return { tiles, revealed };
  }

  // Updates grid data, removes the soft-wall sprite, and maybe spawns a power-up.
  destroySoftWall(col, row) {
    this.grid[row][col] = TILE.FLOOR;

    const sprite = this.softWallSprites.get(`${col},${row}`);
    if (sprite) {
      sprite.destroy();
      this.softWallSprites.delete(`${col},${row}`);
    }

    // 30% chance — equal probability between the two power-up types
    if (Math.random() < 0.3) {
      const type = Math.random() < 0.5 ? POWERUP.EXTRA_BOMB : POWERUP.EXTRA_RANGE;
      this.powerUps.set(`${col},${row}`, new PowerUp(this, col, row, type));
    }
  }

  // Removes a power-up from the map and destroys its sprite.
  // Called by Bomb.explode() for every tile caught in the blast.
  destroyPowerUpAt(col, row) {
    const key = `${col},${row}`;
    const pu = this.powerUps.get(key);
    if (!pu) return;
    pu.collect();
    this.powerUps.delete(key);
  }

  // ── Death / game-over ────────────────────────────────────────────────────

  // Called by Bomb.explode() after chain reactions and visuals are ready.
  // die() is guarded by player.alive so simultaneous hits are safe.
  checkPlayerDeaths(tiles) {
    for (const { col, row } of tiles) {
      if (
        this.player1.alive &&
        this.player1.col === col &&
        this.player1.row === row
      ) {
        this.player1.die();
      }
      if (
        this.player2.alive &&
        this.player2.col === col &&
        this.player2.row === row
      ) {
        this.player2.die();
      }
    }
    this.checkGameOver();
  }

  // Shows end-game UI. The gameOver guard makes it safe to call from
  // multiple chain explosions in the same frame.
  checkGameOver() {
    if (this.gameOver) return;
    const p1Dead = !this.player1.alive;
    const p2Dead = !this.player2.alive;
    if (!p1Dead && !p2Dead) return;

    this.gameOver = true;

    const cx = (GRID_COLS * TILE_SIZE) / 2;
    const cy = (GRID_ROWS * TILE_SIZE) / 2;
    const message =
      p1Dead && p2Dead ? "Draw!" : p1Dead ? "Player 2 Wins!" : "Player 1 Wins!";

    this.add
      .text(cx, cy, message, {
        fontSize: "52px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 56, "Press R to restart", {
        fontSize: "22px",
        color: "#cccccc",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
  }

  // Called by Bomb.explode() to remove the bomb from the map
  // and decrement the owning player's active-bomb counter.
  onBombExploded(bomb) {
    this.bombs.delete(`${bomb.col},${bomb.row}`);
    bomb.owner.onBombExploded();
  }
}
