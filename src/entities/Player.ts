import Phaser from 'phaser';
import { TILE_SIZE, TILE, POWERUP, type PowerUpType } from '../config/constants';
import Bomb from './Bomb';
import type GameScene from '../scenes/GameScene';

const SPRITE_SIZE = TILE_SIZE * 0.82;

export default class Player {
  scene: GameScene;
  col: number;
  row: number;
  maxBombs: number;
  activeBombs: number;
  bombRange: number;
  alive: boolean;
  sprite: Phaser.GameObjects.Image;

  constructor(scene: GameScene, gridCol: number, gridRow: number, spriteKey: string, maxBombs = 1) {
    this.scene = scene;
    this.col = gridCol;
    this.row = gridRow;
    this.maxBombs = maxBombs;
    this.activeBombs = 0;
    this.bombRange = 1;
    this.alive = true;

    const { x, y } = this.toPixel();
    this.sprite = scene.add.image(x, y, spriteKey).setDisplaySize(SPRITE_SIZE, SPRITE_SIZE);
  }

  die() {
    this.alive = false;
    this.sprite.setVisible(false);
    this.scene.sound.play('snd_death');
  }

  updateVisualPosition() {
    const { x, y } = this.toPixel();
    this.sprite.setPosition(x, y);
  }

  tryMove(dx: number, dy: number) {
    const targetCol = this.col + dx;
    const targetRow = this.row + dy;

    const gridBlocked = this.scene.grid[targetRow]![targetCol] !== TILE.FLOOR;
    const bombBlocked = this.scene.bombs.has(`${targetCol},${targetRow}`);

    if (!gridBlocked && !bombBlocked) {
      this.col = targetCol;
      this.row = targetRow;
      this.updateVisualPosition();
      this._checkPowerUp();
    }
  }

  placeBomb() {
    const key = `${this.col},${this.row}`;
    if (this.activeBombs >= this.maxBombs) return;
    if (this.scene.bombs.has(key)) return;

    this.activeBombs++;
    const bomb = new Bomb(this.scene, this.col, this.row, this, this.bombRange);
    this.scene.bombs.set(key, bomb);
    this.scene.sound.play('snd_place', { volume: 0.25 });
  }

  onBombExploded() {
    this.activeBombs--;
  }

  collectPowerUp(type: PowerUpType) {
    if (type === POWERUP.EXTRA_BOMB) this.maxBombs++;
    if (type === POWERUP.EXTRA_RANGE) this.bombRange++;
  }

  toPixel() {
    return {
      x: this.col * TILE_SIZE + TILE_SIZE / 2,
      y: this.row * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  private _checkPowerUp() {
    const key = `${this.col},${this.row}`;
    const pu = this.scene.powerUps.get(key);
    if (!pu) return;

    this.collectPowerUp(pu.type);
    pu.collect();
    this.scene.powerUps.delete(key);
    this.scene.sound.play('snd_pickup');
  }
}
