import { TILE_SIZE } from '../config/constants.js';

export default class Bomb {
  constructor(scene, gridCol, gridRow, owner, range = 1) {
    this.scene = scene;
    this.col = gridCol;
    this.row = gridRow;
    this.owner = owner;
    this.range = range;

    const x = gridCol * TILE_SIZE + TILE_SIZE / 2;
    const y = gridRow * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.image(x, y, 'bomb').setDisplaySize(TILE_SIZE * 0.72, TILE_SIZE * 0.72);

    // Pulse animation signals the countdown; shrinks slightly then grows back.
    this.pulseTween = scene.tweens.add({
      targets: this.sprite,
      displayWidth:  TILE_SIZE * 0.58,
      displayHeight: TILE_SIZE * 0.58,
      duration: 420,
      yoyo: true,
      repeat: -1,
    });

    // delayedCall respects scene pause/resume — unlike setTimeout.
    this.timer = scene.time.delayedCall(3000, () => this.explode());
  }

  explode() {
    // Stop the pulse and cancel the countdown timer first.
    // If this bomb was chain-triggered, its timer is still pending — removing
    // it ensures explode() is never called twice on the same instance.
    this.pulseTween.stop();
    this.timer.remove(false);

    // Remove from the scene map BEFORE walking explosion tiles — prevents
    // infinite recursion if a chain blast reaches back to this tile.
    this.scene.onBombExploded(this);
    this.sprite.destroy();

    const tiles = this.scene.getExplosionTiles(this.col, this.row, this.range);

    // Chain reaction: any bomb on an explosion tile detonates immediately.
    for (const { col, row } of tiles) {
      const chainBomb = this.scene.bombs.get(`${col},${row}`);
      if (chainBomb) chainBomb.explode();
    }

    // Destroy power-ups caught in the blast before checking deaths.
    for (const { col, row } of tiles) {
      this.scene.destroyPowerUpAt(col, row);
    }

    this.scene.sound.play('snd_explode');

    // Spawn explosion visuals over every affected tile.
    const imgs = tiles.map(({ col, row }) => {
      const x = col * TILE_SIZE + TILE_SIZE / 2;
      const y = row * TILE_SIZE + TILE_SIZE / 2;
      return this.scene.add.image(x, y, 'explosion').setDisplaySize(TILE_SIZE, TILE_SIZE);
    });

    this.scene.checkPlayerDeaths(tiles);

    // Fade the explosion out after a short hold.
    this.scene.time.delayedCall(300, () => {
      this.scene.tweens.add({
        targets: imgs,
        alpha: 0,
        duration: 200,
        onComplete: () => imgs.forEach(img => img.destroy()),
      });
    });
  }
}
