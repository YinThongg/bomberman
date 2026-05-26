import { TILE_SIZE, POWERUP, type PowerUpType } from '../config/constants';

const SPRITE_KEYS: Record<PowerUpType, string> = {
  [POWERUP.EXTRA_BOMB]: 'powerup_bomb',
  [POWERUP.EXTRA_RANGE]: 'powerup_range',
  [POWERUP.SPEED_UP]: 'powerup_speed',
  [POWERUP.BOMB_KICK]: 'powerup_kick',
  [POWERUP.FULL_FIRE]: 'powerup_fullfire',
  [POWERUP.PIERCE_BOMB]: 'powerup_pierce',
  [POWERUP.REMOTE_BOMB]: 'powerup_remote',
  [POWERUP.SKULL]: 'powerup_skull',
};

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
    this.sprite = scene.add.image(x, y, SPRITE_KEYS[type]).setDisplaySize(TILE_SIZE * 0.65, TILE_SIZE * 0.65);
  }

  collect() {
    this.sprite.destroy();
  }
}
