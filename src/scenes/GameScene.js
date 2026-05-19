import { COLORS, GRID_COLS, GRID_ROWS, TILE_SIZE, TILE } from '../config/constants.js';
import Player from '../entities/Player.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

    // grid is stored on `this` so future methods (collision, explosions) can read it
    this.grid = this.buildLevel();

    // softWallSprites: key = "col,row" → rectangle Game Object
    // Kept separate from the bomb map so explosion cleanup stays simple.
    this.softWallSprites = new Map();

    this.renderGrid();

    // bombs: key = "col,row" → Bomb instance
    // Checked by Player.placeBomb() and cleaned up in onBombExploded().
    this.bombs = new Map();

    this.player1 = new Player(this, 1, 1, 0x2196f3);
    this.player2 = new Player(this, GRID_COLS - 2, GRID_ROWS - 2, 0xe53935);

    // addKeys returns an object keyed by the names you pass in
    this.keysP1 = this.input.keyboard.addKeys('I,J,K,L,SPACE');
    this.keysP2 = this.input.keyboard.addKeys('W,A,S,D,SHIFT');
  }

  update() {
    const JD = Phaser.Input.Keyboard.JustDown;

    // Player 1 — IJKL (I=up, J=left, K=down, L=right)
    if (JD(this.keysP1.J)) this.player1.tryMove(-1,  0);
    if (JD(this.keysP1.L)) this.player1.tryMove( 1,  0);
    if (JD(this.keysP1.I)) this.player1.tryMove( 0, -1);
    if (JD(this.keysP1.K)) this.player1.tryMove( 0,  1);

    // Player 2 — WASD + Shift to place bomb
    if (JD(this.keysP2.A))     this.player2.tryMove(-1,  0);
    if (JD(this.keysP2.D))     this.player2.tryMove( 1,  0);
    if (JD(this.keysP2.W))     this.player2.tryMove( 0, -1);
    if (JD(this.keysP2.S))     this.player2.tryMove( 0,  1);
    if (JD(this.keysP2.SHIFT)) this.player2.placeBomb();

    if (JD(this.keysP1.SPACE)) this.player1.placeBomb();
  }

  // Called by Bomb.explode() to remove the bomb from the scene's map
  // and decrement the owning player's active-bomb counter.
  onBombExploded(bomb) {
    const key = `${bomb.col},${bomb.row}`;
    this.bombs.delete(key);
    bomb.owner.onBombExploded();
  }

  // Returns an array of {col, row} objects for every tile the explosion reaches,
  // and destroys any soft walls it hits as a side-effect.
  //
  // Stopping rules per ray step:
  //   WALL      → stop, do NOT include the tile (indestructible, absorbs blast)
  //   SOFT_WALL → include the tile, destroy it, then stop (consumed by blast)
  //   FLOOR     → include the tile, keep walking
  getExplosionTiles(col, row, range) {
    const tiles = [{ col, row }];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dc, dr] of directions) {
      for (let i = 1; i <= range; i++) {
        const nc = col + dc * i;
        const nr = row + dr * i;
        const tile = this.grid[nr][nc];

        if (tile === TILE.WALL) break;

        if (tile === TILE.SOFT_WALL) {
          tiles.push({ col: nc, row: nr });
          this.destroySoftWall(nc, nr);
          break; // blast consumed destroying this wall
        }

        tiles.push({ col: nc, row: nr });
      }
    }

    return tiles;
  }

  // Updates the grid data and removes the visual for a soft wall.
  destroySoftWall(col, row) {
    this.grid[row][col] = TILE.FLOOR;
    const sprite = this.softWallSprites.get(`${col},${row}`);
    if (sprite) {
      sprite.destroy();
      this.softWallSprites.delete(`${col},${row}`);
    }
  }

  // Returns a 2D array [row][col] of TILE values describing the level layout.
  //
  // Pass 1 — hard structure (same as before):
  //   Border + pillar cells → WALL, everything else → FLOOR.
  //
  // Pass 2 — soft walls:
  //   70 % of remaining FLOOR tiles become SOFT_WALL, except for the
  //   3-tile L-shaped safe zone around each spawn so players aren't trapped:
  //     P1 (1,1)              → spare (1,1), (2,1), (1,2)
  //     P2 (GRID_COLS-2, GRID_ROWS-2) → spare that tile, its left and up neighbors
  buildLevel() {
    const grid = [];

    for (let row = 0; row < GRID_ROWS; row++) {
      grid[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        const onBorder = row === 0 || row === GRID_ROWS - 1 || col === 0 || col === GRID_COLS - 1;
        const isPillar = row % 2 === 0 && col % 2 === 0;
        grid[row][col] = (onBorder || isPillar) ? TILE.WALL : TILE.FLOOR;
      }
    }

    // Build spawn-safe set so the player always has room to move on turn 1.
    const p2c = GRID_COLS - 2;
    const p2r = GRID_ROWS - 2;
    const safe = new Set([
      '1,1', '2,1', '1,2',                       // P1 spawn + right + down
      `${p2c},${p2r}`, `${p2c - 1},${p2r}`, `${p2c},${p2r - 1}`, // P2 spawn + left + up
    ]);

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (grid[row][col] === TILE.FLOOR && !safe.has(`${col},${row}`) && Math.random() < 0.7) {
          grid[row][col] = TILE.SOFT_WALL;
        }
      }
    }

    return grid;
  }

  // Draws every cell as a solid rectangle.
  //
  // Coordinate mapping — grid (row, col) → pixel (x, y):
  //   x = col * TILE_SIZE + TILE_SIZE / 2
  //   y = row * TILE_SIZE + TILE_SIZE / 2
  // The +half offset is because Phaser's add.rectangle positions
  // the shape by its CENTER, not its top-left corner.
  //
  // Floor tiles use two alternating shades so the open area is visually
  // distinct even before any sprites are added.
  renderGrid() {
    const half = TILE_SIZE / 2;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = col * TILE_SIZE + half;
        const y = row * TILE_SIZE + half;
        const tile = this.grid[row][col];

        if (tile === TILE.WALL) {
          this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, COLORS.WALL);
        } else if (tile === TILE.SOFT_WALL) {
          // Draw the floor underneath first so it shows through when the
          // soft wall is destroyed and its rectangle is removed.
          const floorColor = (row + col) % 2 === 0 ? COLORS.FLOOR : COLORS.FLOOR_ALT;
          this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, floorColor);
          const sprite = this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, COLORS.SOFT_WALL);
          this.softWallSprites.set(`${col},${row}`, sprite);
        } else {
          // Checker: (row + col) even/odd alternates between two floor shades
          const floorColor = (row + col) % 2 === 0 ? COLORS.FLOOR : COLORS.FLOOR_ALT;
          this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, floorColor);
        }
      }
    }
  }
}
