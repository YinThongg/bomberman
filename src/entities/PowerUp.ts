import Phaser from 'phaser';
import { TILE_SIZE, POWERUP, type PowerUpType } from '../config/constants';

export default class PowerUp {
  scene: Phaser.Scene;
  col: number;
  row: number;
  type: PowerUpType;
  sprite: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, col: number, row: number, type: PowerUpType) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.type = type;

    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;
    const key = type === POWERUP.EXTRA_BOMB ? 'powerup_bomb' : 'powerup_range';
    this.sprite = scene.add.image(x, y, key).setDisplaySize(TILE_SIZE * 0.65, TILE_SIZE * 0.65);
  }

  collect() {
    this.sprite.destroy();
  }
}
