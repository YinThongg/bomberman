import { TILE_SIZE, TILE } from '../config/constants.js';
import Bomb from './Bomb.js';

const RADIUS = TILE_SIZE * 0.38; // slightly smaller than the tile so walls are visible around the player

export default class Player {
  constructor(scene, gridCol, gridRow, color, maxBombs = 1) {
    this.scene = scene;
    this.col = gridCol;
    this.row = gridRow;
    this.maxBombs = maxBombs;
    this.activeBombs = 0;

    const { x, y } = this.toPixel();

    // Phaser circle: centered at (x, y), radius, fill color
    this.sprite = scene.add.circle(x, y, RADIUS, color);
  }

  // Moves the sprite to match the current grid position.
  // Call this every time this.col or this.row changes.
  updateVisualPosition() {
    const { x, y } = this.toPixel();
    this.sprite.setPosition(x, y);
  }

  // Attempts to move by (dx, dy) grid steps.
  // Reads the grid from the scene so Player never owns a grid reference directly.
  // Only FLOOR tiles are walkable — WALL and SOFT_WALL both block.
  tryMove(dx, dy) {
    const targetCol = this.col + dx;
    const targetRow = this.row + dy;

    if (this.scene.grid[targetRow][targetCol] === TILE.FLOOR) {
      this.col = targetCol;
      this.row = targetRow;
      this.updateVisualPosition();
    }
  }

  // Places a bomb on the player's current tile if:
  //   - the player hasn't hit their bomb cap, and
  //   - no bomb already occupies this tile (checked via the scene's bombs map).
  placeBomb() {
    const key = `${this.col},${this.row}`;
    if (this.activeBombs >= this.maxBombs) return;
    if (this.scene.bombs.has(key)) return;

    this.activeBombs++;
    const bomb = new Bomb(this.scene, this.col, this.row, this);
    this.scene.bombs.set(key, bomb);
  }

  // Called by Bomb.explode() (via scene) so the counter stays accurate.
  onBombExploded() {
    this.activeBombs--;
  }

  // Converts grid (col, row) → pixel center (x, y).
  // Kept as a private helper so the formula lives in one place.
  toPixel() {
    return {
      x: this.col * TILE_SIZE + TILE_SIZE / 2,
      y: this.row * TILE_SIZE + TILE_SIZE / 2,
    };
  }
}
