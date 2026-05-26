import {
  TILE_SIZE,
  TILE,
  POWERUP,
  BASE_MOVE_COOLDOWN,
  SPEED_BOOST_COOLDOWN,
  SPEED_UP_DURATION,
  RANGE_PER_PICKUP,
  type PowerUpType,
} from '../config/constants';
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
  hasBombKick: boolean;
  sprite: Phaser.GameObjects.Image;

  moveCooldown: number;
  lastMoveTime: number;
  hasSpeedUp: boolean;
  private speedUpTimer: Phaser.Time.TimerEvent | null;

  constructor(scene: GameScene, gridCol: number, gridRow: number, spriteKey: string, maxBombs = 1) {
    this.scene = scene;
    this.col = gridCol;
    this.row = gridRow;
    this.maxBombs = maxBombs;
    this.activeBombs = 0;
    this.bombRange = 1;
    this.alive = true;
    this.hasBombKick = false;

    this.moveCooldown = BASE_MOVE_COOLDOWN;
    this.lastMoveTime = 0;
    this.hasSpeedUp = false;
    this.speedUpTimer = null;

    const { x, y } = this.toPixel();
    this.sprite = scene.add.image(x, y, spriteKey).setDisplaySize(SPRITE_SIZE, SPRITE_SIZE);
  }

  die() {
    this.alive = false;
    this.sprite.setVisible(false);
    if (this.speedUpTimer) {
      this.speedUpTimer.remove(false);
      this.speedUpTimer = null;
    }
    this.scene.sound.play('snd_death');
  }

  canMove(): boolean {
    return this.scene.time.now - this.lastMoveTime >= this.moveCooldown;
  }

  tryMove(dx: number, dy: number) {
    const targetCol = this.col + dx;
    const targetRow = this.row + dy;

    const gridBlocked = this.scene.grid[targetRow]![targetCol] !== TILE.FLOOR;

    if (gridBlocked) return;

    const bombKey = `${targetCol},${targetRow}`;
    const bomb = this.scene.bombs.get(bombKey);

    if (bomb) {
      if (this.hasBombKick && !bomb.sliding) {
        bomb.kick(dx, dy);
      }
      return;
    }

    if (!this.canMove()) return;

    this.col = targetCol;
    this.row = targetRow;
    this.lastMoveTime = this.scene.time.now;
    this.updateVisualPosition();
    this._checkPowerUp();
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
    if (type === POWERUP.EXTRA_RANGE) this.bombRange += RANGE_PER_PICKUP;
    if (type === POWERUP.SPEED_UP) this.applySpeedUp();
    if (type === POWERUP.BOMB_KICK) this.hasBombKick = true;
  }

  private applySpeedUp() {
    if (this.speedUpTimer) {
      this.speedUpTimer.remove(false);
    }

    this.hasSpeedUp = true;
    this.moveCooldown = SPEED_BOOST_COOLDOWN;

    this.speedUpTimer = this.scene.time.delayedCall(SPEED_UP_DURATION, () => {
      this.hasSpeedUp = false;
      this.moveCooldown = BASE_MOVE_COOLDOWN;
      this.speedUpTimer = null;
    });
  }

  private updateVisualPosition() {
    const { x, y } = this.toPixel();
    this.sprite.setPosition(x, y);
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
