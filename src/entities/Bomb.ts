import Phaser from 'phaser';
import { TILE_SIZE } from '../config/constants';
import type Player from './Player';
import type GameScene from '../scenes/GameScene';

export default class Bomb {
  scene: GameScene;
  col: number;
  row: number;
  owner: Player;
  range: number;
  sprite: Phaser.GameObjects.Image;
  pulseTween: Phaser.Tweens.Tween;
  timer: Phaser.Time.TimerEvent;

  constructor(scene: GameScene, gridCol: number, gridRow: number, owner: Player, range = 1) {
    this.scene = scene;
    this.col = gridCol;
    this.row = gridRow;
    this.owner = owner;
    this.range = range;

    const x = gridCol * TILE_SIZE + TILE_SIZE / 2;
    const y = gridRow * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.image(x, y, 'bomb').setDisplaySize(TILE_SIZE * 0.72, TILE_SIZE * 0.72);

    this.pulseTween = scene.tweens.add({
      targets: this.sprite,
      displayWidth: TILE_SIZE * 0.58,
      displayHeight: TILE_SIZE * 0.58,
      duration: 420,
      yoyo: true,
      repeat: -1,
    });

    this.timer = scene.time.delayedCall(3000, () => this.explode());
  }

  explode() {
    this.pulseTween.stop();
    this.timer.remove(false);

    this.scene.onBombExploded(this);
    this.sprite.destroy();

    const { tiles, revealed } = this.scene.getExplosionTiles(this.col, this.row, this.range);

    for (const { col, row } of tiles) {
      const chainBomb = this.scene.bombs.get(`${col},${row}`);
      if (chainBomb) chainBomb.explode();
    }

    for (const { col, row } of tiles) {
      if (!revealed.has(`${col},${row}`)) {
        this.scene.destroyPowerUpAt(col, row);
      }
    }

    this.scene.sound.play('snd_explode');

    const imgs = tiles.map(({ col, row }) => {
      const x = col * TILE_SIZE + TILE_SIZE / 2;
      const y = row * TILE_SIZE + TILE_SIZE / 2;
      return this.scene.add.image(x, y, 'explosion').setDisplaySize(TILE_SIZE, TILE_SIZE);
    });

    this.scene.checkPlayerDeaths(tiles);

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
