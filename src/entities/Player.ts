import {
  TILE_SIZE,
  TILE,
  POWERUP,
  BASE_MOVE_COOLDOWN,
  SPEED_PER_PICKUP,
  MIN_MOVE_COOLDOWN,
  RANGE_PER_PICKUP,
  MAX_BOMB_RANGE,
  PIERCE_BOMBS_PER_PICKUP,
  REMOTE_BOMBS_PER_PICKUP,
  SKULL_DURATION,
  SKULL_SLOW_COOLDOWN,
  type PowerUpType,
} from '../config/constants';
import Bomb from './Bomb';
import type { BombType } from './Bomb';
import type GameScene from '../scenes/GameScene';
import type { InputController, PlayerCommand } from '../input/InputController';

const SPRITE_SIZE = TILE_SIZE * 0.82;

type SkullEffect = 'slow' | 'reverse' | 'mini_range';

export default class Player {
  scene: GameScene;
  controller: InputController;
  playerIndex: number;
  bombSpriteKey: string;
  col: number;
  row: number;
  maxBombs: number;
  activeBombs: number;
  bombRange: number;
  alive: boolean;
  hasBombKick: boolean;
  pierceBombs: number;
  remoteBombs: number;
  activeRemoteBombs: Bomb[];
  sprite: Phaser.GameObjects.Image;

  moveCooldown: number;
  lastMoveTime: number;
  speedPickups: number;
  cursed: boolean;
  curseEffect: SkullEffect | null;
  private curseTimer: Phaser.Time.TimerEvent | null;
  private curseTween: Phaser.Tweens.Tween | null;
  private savedRange: number;

  constructor(scene: GameScene, gridCol: number, gridRow: number, spriteKey: string, bombSpriteKey: string, controller: InputController, playerIndex: number, maxBombs = 1) {
    this.scene = scene;
    this.controller = controller;
    this.playerIndex = playerIndex;
    this.bombSpriteKey = bombSpriteKey;
    this.col = gridCol;
    this.row = gridRow;
    this.maxBombs = maxBombs;
    this.activeBombs = 0;
    this.bombRange = 1;
    this.alive = true;
    this.hasBombKick = false;
    this.pierceBombs = 0;
    this.remoteBombs = 0;
    this.activeRemoteBombs = [];

    this.moveCooldown = BASE_MOVE_COOLDOWN;
    this.lastMoveTime = 0;
    this.speedPickups = 0;
    this.cursed = false;
    this.curseEffect = null;
    this.curseTimer = null;
    this.curseTween = null;
    this.savedRange = 1;

    const { x, y } = this.toPixel();
    this.sprite = scene.add.image(x, y, spriteKey).setDisplaySize(SPRITE_SIZE, SPRITE_SIZE);
  }

  /**
   * Called once per tick by GameScene.
   * Asks the controller for a command, then executes it.
   * This is the ONLY method GameScene needs to call for player actions.
   */
  update() {
    if (!this.alive) return;
    const cmd = this.controller.getCommand();

    if (cmd.direction) {
      this.tryMove(cmd.direction.dx, cmd.direction.dy);
    }

    if (cmd.bombAction === 'normal') this.placeBomb();
    else if (cmd.bombAction === 'pierce') this.placePierceBomb();
    else if (cmd.bombAction === 'remote') this.placeOrDetonateRemoteBomb();
  }

  die() {
    this.alive = false;
    this.sprite.setVisible(false);
    this.removeCurse();
    this.scene.sound.play('snd_death');
  }

  canMove(): boolean {
    return this.scene.time.now - this.lastMoveTime >= this.moveCooldown;
  }

  tryMove(dx: number, dy: number) {
    if (this.cursed && this.curseEffect === 'reverse') {
      dx = -dx;
      dy = -dy;
    }

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
    this._placeBombInternal('normal');
  }

  placePierceBomb() {
    if (this.pierceBombs <= 0) return;
    if (this._placeBombInternal('pierce')) {
      this.pierceBombs--;
    }
  }

  placeOrDetonateRemoteBomb() {
    if (this.activeRemoteBombs.length > 0) {
      const toDetonate = [...this.activeRemoteBombs];
      this.activeRemoteBombs = [];
      for (const bomb of toDetonate) {
        if (this.scene.bombs.has(`${bomb.col},${bomb.row}`)) {
          bomb.explode();
        }
      }
      return;
    }

    if (this.remoteBombs <= 0) return;
    if (this._placeBombInternal('remote')) {
      this.remoteBombs--;
    }
  }

  private _placeBombInternal(bombType: BombType): boolean {
    const key = `${this.col},${this.row}`;
    if (this.activeBombs >= this.maxBombs) return false;
    if (this.scene.bombs.has(key)) return false;

    this.activeBombs++;
    const range = (this.cursed && this.curseEffect === 'mini_range') ? 1 : this.bombRange;
    const bomb = new Bomb(this.scene, this.col, this.row, this, range, bombType);
    this.scene.bombs.set(key, bomb);

    if (bombType === 'remote') {
      this.activeRemoteBombs.push(bomb);
    }

    this.scene.sound.play('snd_place', { volume: 0.25 });
    return true;
  }

  onBombExploded() {
    this.activeBombs--;
  }

  collectPowerUp(type: PowerUpType) {
    if (type === POWERUP.EXTRA_BOMB) this.maxBombs++;
    if (type === POWERUP.EXTRA_RANGE) this.bombRange += RANGE_PER_PICKUP;
    if (type === POWERUP.SPEED_UP) this.applySpeedUp();
    if (type === POWERUP.BOMB_KICK) this.hasBombKick = true;
    if (type === POWERUP.FULL_FIRE) this.bombRange = MAX_BOMB_RANGE;
    if (type === POWERUP.PIERCE_BOMB) this.pierceBombs += PIERCE_BOMBS_PER_PICKUP;
    if (type === POWERUP.REMOTE_BOMB) this.remoteBombs += REMOTE_BOMBS_PER_PICKUP;
    if (type === POWERUP.SKULL) this.applyCurse();
  }

  private applySpeedUp() {
    this.speedPickups++;
    if (!(this.cursed && this.curseEffect === 'slow')) {
      this.moveCooldown = Math.max(
        MIN_MOVE_COOLDOWN,
        BASE_MOVE_COOLDOWN - this.speedPickups * SPEED_PER_PICKUP,
      );
    }
  }

  applyCurseFromBomb() {
    this.applyCurse();
  }

  private applyCurse() {
    this.removeCurse();

    const effects: SkullEffect[] = ['slow', 'reverse', 'mini_range'];
    this.curseEffect = effects[Math.floor(Math.random() * effects.length)]!;
    this.cursed = true;

    if (this.curseEffect === 'slow') {
      this.moveCooldown = SKULL_SLOW_COOLDOWN;
    }
    if (this.curseEffect === 'mini_range') {
      this.savedRange = this.bombRange;
    }

    this.curseTween = this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: 200,
      yoyo: true,
      repeat: -1,
    });

    this.curseTimer = this.scene.time.delayedCall(SKULL_DURATION, () => {
      this.removeCurse();
    });
  }

  private removeCurse() {
    if (!this.cursed) return;

    if (this.curseEffect === 'slow') {
      this.moveCooldown = Math.max(
        MIN_MOVE_COOLDOWN,
        BASE_MOVE_COOLDOWN - this.speedPickups * SPEED_PER_PICKUP,
      );
    }
    if (this.curseEffect === 'mini_range') {
      this.bombRange = this.savedRange;
    }

    this.cursed = false;
    this.curseEffect = null;

    if (this.curseTween) {
      this.curseTween.stop();
      this.curseTween = null;
    }
    this.sprite.setAlpha(1);

    if (this.curseTimer) {
      this.curseTimer.remove(false);
      this.curseTimer = null;
    }
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
