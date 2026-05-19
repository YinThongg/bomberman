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
    this.renderGrid();

    this.player1 = new Player(this, 1, 1, 0x2196f3);

    // createCursorKeys() binds arrow keys + shift/space into one object
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    const { up, down, left, right } = this.cursors;

    // JustDown fires exactly once per key press regardless of how long the key is held.
    // Without it, update() runs ~60×/sec and the player would teleport across the map.
    const JD = Phaser.Input.Keyboard.JustDown;

    if (JD(left))  this.player1.tryMove(-1,  0);
    if (JD(right)) this.player1.tryMove( 1,  0);
    if (JD(up))    this.player1.tryMove( 0, -1);
    if (JD(down))  this.player1.tryMove( 0,  1);
  }

  // Returns a 2D array [row][col] of TILE values describing the level layout.
  //
  // Classic Bomberman pillar rule:
  //   - All border cells → WALL (indestructible frame)
  //   - Inner cells where BOTH row and col are even → WALL (the pillar grid)
  //   - Everything else → FLOOR (open space for players and soft walls)
  buildLevel() {
    const grid = [];

    for (let row = 0; row < GRID_ROWS; row++) {
      grid[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        const onBorder = row === 0 || row === GRID_ROWS - 1 || col === 0 || col === GRID_COLS - 1;
        const isPillar = row % 2 === 0 && col % 2 === 0;

        if (onBorder || isPillar) {
          grid[row][col] = TILE.WALL;
        } else {
          grid[row][col] = TILE.FLOOR;
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

        let color;
        if (tile === TILE.WALL) {
          color = COLORS.WALL;
        } else {
          // Checker: (row + col) even/odd alternates between two floor shades
          color = (row + col) % 2 === 0 ? COLORS.FLOOR : COLORS.FLOOR_ALT;
        }

        this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, color);
      }
    }
  }
}
