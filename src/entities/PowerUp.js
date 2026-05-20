import { TILE_SIZE, POWERUP } from '../config/constants.js';

export default class PowerUp {
  constructor(scene, col, row, type) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.type = type;

    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;
    const key = type === POWERUP.EXTRA_BOMB ? 'powerup_bomb' : 'powerup_range';
    this.sprite = scene.add.image(x, y, key).setDisplaySize(TILE_SIZE * 0.65, TILE_SIZE * 0.65);
  }

  // Called when an explosion reaches this tile.
  collect() {
    this.sprite.destroy();
  }
}
