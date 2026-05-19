import GameScene from './scenes/GameScene.js';
import { GRID_COLS, GRID_ROWS, TILE_SIZE } from './config/constants.js';

const config = {
  type: Phaser.AUTO,
  width: GRID_COLS * TILE_SIZE,
  height: GRID_ROWS * TILE_SIZE,
  backgroundColor: '#1a1a2e',
  scene: [GameScene],
};

new Phaser.Game(config);
