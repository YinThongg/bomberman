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
import KeyboardInput, { P1_KEYS, P2_KEYS } from '../input/KeyboardInput';
import NullInput from '../input/NullInput';
import AIInput from '../ai/AIInput';

const PLAYER_NAMES = ['P1', 'P2', 'P3', 'P4'];
const PLAYER_COLORS = ['#4488ff', '#ff4444', '#dddddd', '#ffaa00'];

export default class GameScene extends Phaser.Scene {
  grid!: TileType[][];
  softWallSprites!: Map<string, Phaser.GameObjects.Image>;
  powerUps!: Map<string, PowerUp>;
  bombs!: Map<string, Bomb>;
  players!: Player[];
  keyRestart!: Phaser.Input.Keyboard.Key;
  gameOver!: boolean;
  private hudTexts!: Phaser.GameObjects.Text[];

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

    const kb1 = new KeyboardInput(this, P1_KEYS);
    const kb2 = new KeyboardInput(this, P2_KEYS);
    const nullInput = new NullInput(); // temporary, replaced below

    this.players = [
      new Player(this, 1, 1, 'player_blue', 'bomb_blue', kb1, 0),                              // top-left
      new Player(this, GRID_COLS - 2, GRID_ROWS - 2, 'player_red', 'bomb_red', kb2, 1),         // bottom-right
      new Player(this, GRID_COLS - 2, 1, 'player_white', 'bomb_white', nullInput, 2),            // top-right (AI)
      new Player(this, 1, GRID_ROWS - 2, 'player_yellow', 'bomb_yellow', nullInput, 3),          // bottom-left (AI)
    ];

    // Wire up AI controllers (they need a reference to the player they control)
    this.players[2]!.controller = new AIInput(this.players[2]!, this);
    this.players[3]!.controller = new AIInput(this.players[3]!, this);

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

    // Each player asks its controller for a command and executes it.
    // The controller could be keyboard, AI, or anything else.
    for (const player of this.players) {
      player.update();
    }

    for (const bomb of this.bombs.values()) {
      bomb.updateSlide();
    }

    this.updateHud();
  }

  // ── HUD ──────────────────────────────────────────────────────────────────

  private createHud() {
    const w = GRID_COLS * TILE_SIZE;
    const topY = GRID_ROWS * TILE_SIZE + 10;
    const botY = GRID_ROWS * TILE_SIZE + HUD_HEIGHT - 6;

    this.hudTexts = this.players.map((_, i) => {
      const isLeft = i === 0 || i === 3;  // P1 top-left, P4 bottom-left
      const isTop = i === 0 || i === 2;   // P1 & P3 on top row
      const x = isLeft ? 8 : w - 8;
      const y = isTop ? topY : botY;
      const color = PLAYER_COLORS[i]!;

      return this.add.text(x, y, '', {
        fontSize: '11px',
        color,
        fontFamily: 'monospace',
      }).setOrigin(isLeft ? 0 : 1, 0).setDepth(100);
    });
  }

  private buildHudString(player: Player): string {
    const name = PLAYER_NAMES[player.playerIndex]!;
    const parts: string[] = [name];
    parts.push(`B:${player.maxBombs}`);
    if (player.pierceBombs > 0) parts.push(`Pi:${player.pierceBombs}`);
    if (player.remoteBombs > 0) parts.push(`Rm:${player.remoteBombs}`);
    if (player.cursed) parts.push('CURSED');
    if (!player.alive) parts.push('DEAD');
    return parts.join(' ');
  }

  private updateHud() {
    for (let i = 0; i < this.players.length; i++) {
      this.hudTexts[i]!.setText(this.buildHudString(this.players[i]!));
    }
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

    const rc = GRID_COLS - 2;
    const br = GRID_ROWS - 2;
    const safe = new Set([
      // Top-left (P1)
      '1,1', '2,1', '1,2',
      // Bottom-right (P2)
      `${rc},${br}`, `${rc - 1},${br}`, `${rc},${br - 1}`,
      // Top-right (P3)
      `${rc},1`, `${rc - 1},1`, `${rc},2`,
      // Bottom-left (P4)
      `1,${br}`, `2,${br}`, `1,${br - 1}`,
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
      for (const player of this.players) {
        if (player.alive && player.col === col && player.row === row) {
          if (fromCursedBomb) {
            player.applyCurseFromBomb();
          } else {
            player.die();
          }
        }
      }
    }
    this.checkGameOver();
  }

  checkGameOver() {
    if (this.gameOver) return;
    const alive = this.players.filter(p => p.alive);
    if (alive.length > 1) return;

    this.gameOver = true;

    const cx = (GRID_COLS * TILE_SIZE) / 2;
    const cy = (GRID_ROWS * TILE_SIZE) / 2;
    const message = alive.length === 0
      ? 'Draw!'
      : `${PLAYER_NAMES[alive[0]!.playerIndex]} Wins!`;

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
