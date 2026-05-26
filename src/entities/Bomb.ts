import { TILE_SIZE, TILE, BOMB_FUSE_TIME, BOMB_SLIDE_SPEED } from '../config/constants';
import type Player from './Player';
import type GameScene from '../scenes/GameScene';

export type BombType = 'normal' | 'pierce' | 'remote';

export default class Bomb {
  scene: GameScene;
  col: number;
  row: number;
  owner: Player;
  range: number;
  pierce: boolean;
  remote: boolean;
  cursed: boolean;
  sprite: Phaser.GameObjects.Image;
  pulseTween: Phaser.Tweens.Tween;
  timer: Phaser.Time.TimerEvent | null;
  sliding: boolean;
  slideDx: number;
  slideDy: number;

  constructor(scene: GameScene, gridCol: number, gridRow: number, owner: Player, range = 1, bombType: BombType = 'normal') {
    this.scene = scene;
    this.col = gridCol;
    this.row = gridRow;
    this.owner = owner;
    this.range = range;
    this.pierce = bombType === 'pierce';
    this.remote = bombType === 'remote';
    this.cursed = owner.cursed;
    this.sliding = false;
    this.slideDx = 0;
    this.slideDy = 0;

    const x = gridCol * TILE_SIZE + TILE_SIZE / 2;
    const y = gridRow * TILE_SIZE + TILE_SIZE / 2;

    let bombKey: string;
    if (bombType === 'pierce') bombKey = 'bomb_pierce';
    else if (bombType === 'remote') bombKey = 'bomb_remote';
    else bombKey = owner === scene.player1 ? 'bomb_blue' : 'bomb_red';

    this.sprite = scene.add
      .image(x, y, bombKey)
      .setDisplaySize(TILE_SIZE * 0.72, TILE_SIZE * 0.72);

    this.pulseTween = scene.tweens.add({
      targets: this.sprite,
      displayWidth: TILE_SIZE * 0.58,
      displayHeight: TILE_SIZE * 0.58,
      duration: this.remote ? 700 : 350,
      yoyo: true,
      repeat: -1,
    });

    if (this.remote) {
      this.timer = null;
    } else {
      this.timer = scene.time.delayedCall(BOMB_FUSE_TIME, () => this.explode());
    }
  }

  kick(dx: number, dy: number) {
    if (this.sliding) return;
    this.sliding = true;
    this.slideDx = dx;
    this.slideDy = dy;
  }

  updateSlide() {
    if (!this.sliding) return;

    const nextCol = this.col + this.slideDx;
    const nextRow = this.row + this.slideDy;

    const blocked =
      this.scene.grid[nextRow]?.[nextCol] !== TILE.FLOOR ||
      this.scene.bombs.has(`${nextCol},${nextRow}`) ||
      this.isPlayerAt(nextCol, nextRow);

    if (blocked) {
      this.sliding = false;
      this.slideDx = 0;
      this.slideDy = 0;
      this.snapToGrid();
      return;
    }

    const oldKey = `${this.col},${this.row}`;
    this.scene.bombs.delete(oldKey);
    this.col = nextCol;
    this.row = nextRow;
    this.scene.bombs.set(`${this.col},${this.row}`, this);

    const targetX = this.col * TILE_SIZE + TILE_SIZE / 2;
    const targetY = this.row * TILE_SIZE + TILE_SIZE / 2;
    this.sprite.x += this.slideDx * BOMB_SLIDE_SPEED;
    this.sprite.y += this.slideDy * BOMB_SLIDE_SPEED;

    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    if (Math.abs(dx) < BOMB_SLIDE_SPEED && Math.abs(dy) < BOMB_SLIDE_SPEED) {
      this.snapToGrid();
    }
  }

  private isPlayerAt(col: number, row: number): boolean {
    const p1 = this.scene.player1;
    const p2 = this.scene.player2;
    return (p1.alive && p1.col === col && p1.row === row) ||
           (p2.alive && p2.col === col && p2.row === row);
  }

  private snapToGrid() {
    this.sprite.x = this.col * TILE_SIZE + TILE_SIZE / 2;
    this.sprite.y = this.row * TILE_SIZE + TILE_SIZE / 2;
  }

  explode() {
    this.sliding = false;
    this.pulseTween.stop();
    if (this.timer) this.timer.remove(false);

    this.scene.onBombExploded(this);
    this.sprite.destroy();

    const { tiles, revealed } = this.scene.getExplosionTiles(this.col, this.row, this.range, this.pierce);

    for (const { col, row } of tiles) {
      const chainBomb = this.scene.bombs.get(`${col},${row}`);
      if (chainBomb) chainBomb.explode();
    }

    for (const { col, row } of tiles) {
      if (!revealed.has(`${col},${row}`)) {
        this.scene.destroyPowerUpAt(col, row);
      }
    }

    this.scene.sound.play('snd_explode', { volume: 0.15 });

    const imgs = tiles.map(({ col, row }) => {
      const x = col * TILE_SIZE + TILE_SIZE / 2;
      const y = row * TILE_SIZE + TILE_SIZE / 2;
      return this.scene.add.image(x, y, 'explosion').setDisplaySize(TILE_SIZE, TILE_SIZE);
    });

    this.scene.checkPlayerDeaths(tiles, this.cursed);

    this.scene.time.delayedCall(300, () => {
      this.scene.tweens.add({
        targets: imgs,
        alpha: 0,
        duration: 200,
        onComplete: () => imgs.forEach((img) => img.destroy()),
      });
    });
  }
}
