import Phaser from 'phaser';
import {
  COLORS,
  GRID_COLS,
  GRID_ROWS,
  TILE_SIZE,
  TILE,
  HUD_HEIGHT,
  POWERUP,
  POWERUP_SPAWN_CHANCE,
  POWERUP_WEIGHTS,
  type TileType,
  type PowerUpType,
} from '../config/constants';
import Player from '../entities/Player';
import PowerUp from '../entities/PowerUp';
import type Bomb from '../entities/Bomb';

export default class GameScene extends Phaser.Scene {
  grid!: TileType[][];
  softWallSprites!: Map<string, Phaser.GameObjects.Image>;
  powerUps!: Map<string, PowerUp>;
  bombs!: Map<string, Bomb>;
  player1!: Player;
  player2!: Player;
  keysP1!: Record<string, Phaser.Input.Keyboard.Key>;
  keysP2!: Record<string, Phaser.Input.Keyboard.Key>;
  keyRestart!: Phaser.Input.Keyboard.Key;
  gameOver!: boolean;
  private hudP1!: Phaser.GameObjects.Text;
  private hudP2!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

    this.grid = this.buildLevel();
    this.softWallSprites = new Map();
    this.powerUps = new Map();
    this.renderGrid();

    this.bombs = new Map();

    this.player1 = new Player(this, 1, 1, 'player_blue');
    this.player2 = new Player(this, GRID_COLS - 2, GRID_ROWS - 2, 'player_red');

    this.keysP1 = this.input.keyboard!.addKeys('W,A,S,D,SHIFT,Q,E') as Record<string, Phaser.Input.Keyboard.Key>;
    this.keysP2 = this.input.keyboard!.addKeys('I,J,K,L,SPACE,O,U') as Record<string, Phaser.Input.Keyboard.Key>;
    this.keyRestart = this.input.keyboard!.addKey('R');

    this.gameOver = false;

    this.createHud();
    this.createHomeButton();
  }

  update() {
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.keyRestart)) this.scene.restart();
      return;
    }

    if (this.player1.alive) {
      if (this.keysP1.A!.isDown) this.player1.tryMove(-1, 0);
      else if (this.keysP1.D!.isDown) this.player1.tryMove(1, 0);
      else if (this.keysP1.W!.isDown) this.player1.tryMove(0, -1);
      else if (this.keysP1.S!.isDown) this.player1.tryMove(0, 1);
      if (Phaser.Input.Keyboard.JustDown(this.keysP1.SHIFT!)) this.player1.placeBomb();
      if (Phaser.Input.Keyboard.JustDown(this.keysP1.Q!)) this.player1.placePierceBomb();
      if (Phaser.Input.Keyboard.JustDown(this.keysP1.E!)) this.player1.placeOrDetonateRemoteBomb();
    }

    if (this.player2.alive) {
      if (this.keysP2.J!.isDown) this.player2.tryMove(-1, 0);
      else if (this.keysP2.L!.isDown) this.player2.tryMove(1, 0);
      else if (this.keysP2.I!.isDown) this.player2.tryMove(0, -1);
      else if (this.keysP2.K!.isDown) this.player2.tryMove(0, 1);
      if (Phaser.Input.Keyboard.JustDown(this.keysP2.SPACE!)) this.player2.placeBomb();
      if (Phaser.Input.Keyboard.JustDown(this.keysP2.O!)) this.player2.placePierceBomb();
      if (Phaser.Input.Keyboard.JustDown(this.keysP2.U!)) this.player2.placeOrDetonateRemoteBomb();
    }

    for (const bomb of this.bombs.values()) {
      bomb.updateSlide();
    }

    this.updateHud();
  }

  // ── HUD ──────────────────────────────────────────────────────────────────

  private createHud() {
    const hudY = GRID_ROWS * TILE_SIZE + HUD_HEIGHT / 2;
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '13px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    };

    this.hudP1 = this.add.text(8, hudY, '', style).setOrigin(0, 0.5).setDepth(100);
    this.hudP2 = this.add.text(GRID_COLS * TILE_SIZE - 8, hudY, '', style)
      .setOrigin(1, 0.5).setDepth(100);
  }

  private buildHudString(player: Player): string {
    const parts: string[] = [];
    parts.push(`Bombs: ${player.maxBombs}`);
    if (player.pierceBombs > 0) parts.push(`Pierce: ${player.pierceBombs}`);
    if (player.remoteBombs > 0) parts.push(`Remote: ${player.remoteBombs}`);
    if (player.cursed) parts.push('CURSED');
    return parts.join('  ');
  }

  private updateHud() {
    this.hudP1.setText(this.buildHudString(this.player1));
    this.hudP2.setText(this.buildHudString(this.player2));
  }

  // ── Home button ──────────────────────────────────────────────────────────

  private createHomeButton() {
    const padding = 8;
    const size = 28;

    const btn = this.add
      .text(padding + size / 2, padding + size / 2, '⌂', {
        fontSize: '24px',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#ff6600'));
    btn.on('pointerout', () => btn.setColor('#888888'));
    btn.on('pointerdown', () => this.scene.start('TitleScene'));
  }

  // ── Grid ──────────────────────────────────────────────────────────────────

  buildLevel(): TileType[][] {
    const grid: TileType[][] = [];

    for (let row = 0; row < GRID_ROWS; row++) {
      grid[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        const onBorder =
          row === 0 || row === GRID_ROWS - 1 || col === 0 || col === GRID_COLS - 1;
        const isPillar = row % 2 === 0 && col % 2 === 0;
        grid[row]![col] = onBorder || isPillar ? TILE.WALL : TILE.FLOOR;
      }
    }

    const p2c = GRID_COLS - 2;
    const p2r = GRID_ROWS - 2;
    const safe = new Set([
      '1,1',
      '2,1',
      '1,2',
      `${p2c},${p2r}`,
      `${p2c - 1},${p2r}`,
      `${p2c},${p2r - 1}`,
    ]);

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (
          grid[row]![col] === TILE.FLOOR &&
          !safe.has(`${col},${row}`) &&
          Math.random() < 0.7
        ) {
          grid[row]![col] = TILE.SOFT_WALL;
        }
      }
    }

    return grid;
  }

  renderGrid() {
    const half = TILE_SIZE / 2;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = col * TILE_SIZE + half;
        const y = row * TILE_SIZE + half;
        const tile = this.grid[row]![col]!;
        const floorKey = (row + col) % 2 === 0 ? 'tile_floor' : 'tile_floor_alt';

        if (tile === TILE.WALL) {
          this.add.image(x, y, 'tile_wall').setDisplaySize(TILE_SIZE, TILE_SIZE);
        } else if (tile === TILE.SOFT_WALL) {
          this.add.image(x, y, floorKey).setDisplaySize(TILE_SIZE, TILE_SIZE);
          const sprite = this.add
            .image(x, y, 'tile_soft_wall')
            .setDisplaySize(TILE_SIZE, TILE_SIZE);
          this.softWallSprites.set(`${col},${row}`, sprite);
        } else {
          this.add.image(x, y, floorKey).setDisplaySize(TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  // ── Explosion ────────────────────────────────────────────────────────────

  getExplosionTiles(col: number, row: number, range: number, pierce = false) {
    const tiles: { col: number; row: number }[] = [{ col, row }];
    const revealed = new Set<string>();
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    for (const [dc, dr] of directions) {
      let reach = 0;
      for (let i = 1; ; i++) {
        const nc = col + dc! * i;
        const nr = row + dr! * i;
        const tile = this.grid[nr]?.[nc];

        if (tile === undefined || tile === TILE.WALL) break;

        if (tile === TILE.SOFT_WALL) {
          tiles.push({ col: nc, row: nr });
          this.destroySoftWall(nc, nr);
          revealed.add(`${nc},${nr}`);
          if (!pierce) break;
          continue;
        }

        // Cursed bombs block incoming explosion rays
        const bombAtTile = this.bombs.get(`${nc},${nr}`);
        if (bombAtTile?.cursed) {
          tiles.push({ col: nc, row: nr });
          break;
        }

        reach++;
        if (reach > range) break;
        tiles.push({ col: nc, row: nr });
      }
    }

    return { tiles, revealed };
  }

  destroySoftWall(col: number, row: number) {
    this.grid[row]![col] = TILE.FLOOR;

    const sprite = this.softWallSprites.get(`${col},${row}`);
    if (sprite) {
      sprite.destroy();
      this.softWallSprites.delete(`${col},${row}`);
    }

    if (Math.random() < POWERUP_SPAWN_CHANCE) {
      const type = this.rollPowerUpType();
      this.powerUps.set(`${col},${row}`, new PowerUp(this, col, row, type));
    }
  }

  private rollPowerUpType(): PowerUpType {
    const entries = Object.entries(POWERUP_WEIGHTS) as [PowerUpType, number][];
    const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = Math.random() * totalWeight;
    for (const [type, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return type;
    }
    return entries[0]![0];
  }

  destroyPowerUpAt(col: number, row: number) {
    const key = `${col},${row}`;
    const pu = this.powerUps.get(key);
    if (!pu) return;
    pu.collect();
    this.powerUps.delete(key);
  }

  // ── Death / game-over ────────────────────────────────────────────────────

  checkPlayerDeaths(tiles: { col: number; row: number }[], fromCursedBomb: boolean) {
    for (const { col, row } of tiles) {
      if (this.player1.alive && this.player1.col === col && this.player1.row === row) {
        if (fromCursedBomb) {
          this.player1.applyCurseFromBomb();
        } else {
          this.player1.die();
        }
      }
      if (this.player2.alive && this.player2.col === col && this.player2.row === row) {
        if (fromCursedBomb) {
          this.player2.applyCurseFromBomb();
        } else {
          this.player2.die();
        }
      }
    }
    this.checkGameOver();
  }

  checkGameOver() {
    if (this.gameOver) return;
    const p1Dead = !this.player1.alive;
    const p2Dead = !this.player2.alive;
    if (!p1Dead && !p2Dead) return;

    this.gameOver = true;

    const cx = (GRID_COLS * TILE_SIZE) / 2;
    const cy = (GRID_ROWS * TILE_SIZE) / 2;
    const message =
      p1Dead && p2Dead ? 'Draw!' : p1Dead ? 'Player 2 Wins!' : 'Player 1 Wins!';

    this.add
      .text(cx, cy, message, {
        fontSize: '52px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 56, 'Press R to restart', {
        fontSize: '22px',
        color: '#cccccc',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
  }

  onBombExploded(bomb: Bomb) {
    this.bombs.delete(`${bomb.col},${bomb.row}`);
    bomb.owner.onBombExploded();
  }
}
