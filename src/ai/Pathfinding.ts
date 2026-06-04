import { GRID_COLS, GRID_ROWS, TILE } from '../config/constants';
import type { TileType } from '../config/constants';
import type Bomb from '../entities/Bomb';

/**
 * BFS Pathfinding — finds the shortest path through the grid.
 *
 * Like dropping a stone in a pond: explores outward one ring at a time.
 * The first time we reach a tile, that's the shortest path to it.
 *
 * Danger-aware: a tile that will explode BEFORE the AI arrives is blocked.
 * The AI checks dangerMap[tile] against its estimated arrival time.
 *
 * Returns the FIRST step direction (or null if no path exists).
 * The AI calls this every tick with a fresh danger map, so it only
 * ever needs one step — next tick it recalculates.
 */

interface BFSNode {
  col: number;
  row: number;
  arrivalTime: number;
  firstStep: { dx: number; dy: number } | null; // direction of the first move from start
}

const DIRS = [
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
];

/**
 * Find a path from (startCol, startRow) to any tile that passes goalTest.
 *
 * @param moveCooldown  - the player's current move cooldown in ms (used to estimate arrival time)
 * @param dangerMap     - 2D array of explosion timestamps (Infinity = safe, -1 = impassable)
 * @param grid          - the tile grid
 * @param bombs         - active bombs map (bombs block movement)
 * @param now           - current scene time in ms
 * @param goalTest      - function that returns true for target tiles
 * @returns the direction of the first step, or null if no path found
 */
export function findPath(
  startCol: number,
  startRow: number,
  moveCooldown: number,
  dangerMap: number[][],
  grid: TileType[][],
  bombs: Map<string, Bomb>,
  now: number,
  goalTest: (col: number, row: number) => boolean,
): { dx: number; dy: number } | null {
  const visited = new Set<string>();
  const queue: BFSNode[] = [];

  visited.add(`${startCol},${startRow}`);
  queue.push({ col: startCol, row: startRow, arrivalTime: now, firstStep: null });

  let head = 0; // use index instead of shift() for performance

  while (head < queue.length) {
    const current = queue[head++]!;

    // Did we reach a goal tile? (skip start tile)
    if (current.firstStep && goalTest(current.col, current.row)) {
      return current.firstStep;
    }

    for (const dir of DIRS) {
      const nc = current.col + dir.dx;
      const nr = current.row + dir.dy;
      const key = `${nc},${nr}`;

      if (visited.has(key)) continue;

      // Bounds check
      if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) continue;

      // Can't walk through walls or soft walls
      if (grid[nr]![nc] !== TILE.FLOOR) continue;

      // Can't walk through bombs
      if (bombs.has(key)) continue;

      // When would we arrive at this tile?
      const arrivalTime = current.arrivalTime + moveCooldown;

      // Is the tile dangerous when we arrive?
      const dangerTime = dangerMap[nr]![nc]!;
      if (dangerTime <= arrivalTime) continue; // explosion at or before arrival = death

      visited.add(key);
      queue.push({
        col: nc,
        row: nr,
        arrivalTime,
        firstStep: current.firstStep ?? dir, // remember the first step
      });
    }
  }

  return null; // no path found
}

/**
 * Find path to the nearest safe tile (dangerMap === Infinity).
 * This is the AI's "flee" behavior.
 */
export function findEscapePath(
  col: number, row: number,
  moveCooldown: number,
  dangerMap: number[][],
  grid: TileType[][],
  bombs: Map<string, Bomb>,
  now: number,
): { dx: number; dy: number } | null {
  return findPath(col, row, moveCooldown, dangerMap, grid, bombs, now,
    (c, r) => dangerMap[r]![c] === Infinity,
  );
}
