import { TILE_SIZE } from '../config/constants.js';

const RADIUS = TILE_SIZE * 0.3;

export default class Bomb {
  constructor(scene, gridCol, gridRow, owner, range = 1) {
    this.scene = scene;
    this.col = gridCol;
    this.row = gridRow;
    this.owner = owner;
    this.range = range;

    const x = gridCol * TILE_SIZE + TILE_SIZE / 2;
    const y = gridRow * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.circle(x, y, RADIUS, 0x111111);

    // delayedCall fires after 3000 ms and is tied to the Phaser clock,
    // so it respects scene pause/resume — unlike setTimeout which runs
    // on the browser's JS event loop regardless of game state.
    this.timer = scene.time.delayedCall(3000, () => this.explode());
  }

  explode() {
    // Cancel the countdown timer. If this bomb was chain-triggered by another
    // explosion, its timer is still pending — removing it here ensures explode()
    // can never be called a second time on the same bomb instance.
    this.timer.remove(false);

    // Remove from the scene's map BEFORE walking the explosion tiles.
    // This is the key to preventing infinite recursion: if a chain bomb's
    // explosion reaches back to this tile, it will find nothing in the map
    // and skip it. See explanation below.
    this.scene.onBombExploded(this);

    this.sprite.destroy();

    const tiles = this.scene.getExplosionTiles(this.col, this.row, this.range);

    // Chain reaction: any bomb sitting on an explosion tile detonates now.
    for (const { col, row } of tiles) {
      const chainBomb = this.scene.bombs.get(`${col},${row}`);
      if (chainBomb) chainBomb.explode();
    }

    // Render an orange rectangle on every affected tile.
    const rects = tiles.map(({ col, row }) => {
      const x = col * TILE_SIZE + TILE_SIZE / 2;
      const y = row * TILE_SIZE + TILE_SIZE / 2;
      return this.scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0xff6600);
    });

    // Remove explosion visuals after 500 ms.
    this.scene.time.delayedCall(500, () => {
      rects.forEach(r => r.destroy());
    });
  }
}
