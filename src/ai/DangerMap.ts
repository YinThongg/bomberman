import { GRID_COLS, GRID_ROWS, TILE, BOMB_FUSE_TIME } from '../config/constants';
import type { TileType } from '../config/constants';
import type Bomb from '../entities/Bomb';

/**
 * DangerMap — a 2D grid showing WHEN each tile becomes dangerous.
 *
 * Each cell holds:
 *   Infinity  = safe (no explosion will reach here)
 *   number    = timestamp (scene.time.now) when the explosion arrives
 *   -1        = impassable (wall / soft wall)
 *
 * Built once per tick from the current game state.
 * The AI reads this to know: "Is my tile safe? Where can I flee?"
 *
 * How it works:
 * 1. Start with all floor tiles as Infinity (safe)
 * 2. For each active bomb, walk rays in 4 directions (same as your explosion logic)
 * 3. Mark each tile with the SOONEST explosion time (Math.min)
 * 4. Handle chain reactions: if bomb A's blast reaches bomb B,
 *    bomb B detonates at bomb A's time (re-mark B's rays with earlier time)
 */

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export default class DangerMap {
  danger: number[][];

  constructor() {
    this.danger = [];
  }

  /**
   * Build the danger map from current game state.
   * Call this once per tick before any AI decisions.
   */
  build(
    grid: TileType[][],
    bombs: Map<string, Bomb>,
    now: number,
  ): number[][] {
    // Initialize: walls/soft walls = -1, floor = Infinity (safe)
    this.danger = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      this.danger[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = grid[r]![c]!;
        this.danger[r]![c] = tile === TILE.FLOOR ? Infinity : -1;
      }
    }

    // Also mark bomb tiles as impassable for pathfinding
    for (const bomb of bombs.values()) {
      // Calculate when this bomb explodes
      const explodeTime = this.getBombExplodeTime(bomb, now);
      this.markBlast(bomb.col, bomb.row, bomb.range, bomb.pierce, explodeTime, grid);
    }

    // Handle chain reactions — repeat until stable
    let changed = true;
    while (changed) {
      changed = false;
      for (const bomb of bombs.values()) {
        const explodeTime = this.getBombExplodeTime(bomb, now);
        const dangerAtBomb = this.danger[bomb.row]![bomb.col]!;

        // If another blast reaches this bomb before its own fuse...
        if (dangerAtBomb < explodeTime && dangerAtBomb > 0) {
          // Re-mark this bomb's blast with the earlier chain time
          this.markBlast(bomb.col, bomb.row, bomb.range, bomb.pierce, dangerAtBomb, grid);
          changed = true;
        }
      }
    }

    return this.danger;
  }

  /** Estimate when a bomb will explode based on its timer */
  private getBombExplodeTime(bomb: Bomb, now: number): number {
    if (bomb.remote) {
      // Remote bombs have no fuse — treat as "far future" danger
      // The AI can't predict when the owner will detonate
      return now + 10000;
    }
    if (!bomb.timer) return now;
    // Phaser timer: elapsed is how much time has passed
    const remaining = bomb.timer.delay - bomb.timer.elapsed;
    return now + Math.max(0, remaining);
  }

  /** Walk blast rays from a bomb position and mark danger times */
  private markBlast(
    col: number, row: number, range: number, pierce: boolean,
    explodeTime: number, grid: TileType[][],
  ) {
    // Mark the bomb's own tile
    this.danger[row]![col] = Math.min(this.danger[row]![col]!, explodeTime);

    for (const [dc, dr] of DIRS) {
      let reach = 0;
      for (let i = 1; ; i++) {
        const nc = col + dc! * i;
        const nr = row + dr! * i;

        // Out of bounds
        if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) break;

        const tile = grid[nr]![nc]!;

        // Hard wall — stop
        if (tile === TILE.WALL) break;

        // Soft wall — mark as danger but stop (unless pierce)
        if (tile === TILE.SOFT_WALL) {
          // Don't mark soft walls — AI can't walk through them anyway
          if (!pierce) break;
          continue;
        }

        reach++;
        if (reach > range) break;

        // Mark this floor tile with the soonest explosion
        this.danger[nr]![nc] = Math.min(this.danger[nr]![nc]!, explodeTime);
      }
    }
  }

  /** Is this tile safe (no explosion will reach it)? */
  isSafe(row: number, col: number): boolean {
    return this.danger[row]?.[col] === Infinity;
  }

  /** When does danger arrive at this tile? Infinity = never, -1 = impassable */
  dangerAt(row: number, col: number): number {
    return this.danger[row]?.[col] ?? -1;
  }
}
