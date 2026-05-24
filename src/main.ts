import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import TitleScene from './scenes/TitleScene';
import GameScene from './scenes/GameScene';
import { GRID_COLS, GRID_ROWS, TILE_SIZE } from './config/constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GRID_COLS * TILE_SIZE,
  height: GRID_ROWS * TILE_SIZE,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, TitleScene, GameScene],
};

new Phaser.Game(config);
