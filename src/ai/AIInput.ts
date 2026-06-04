import type { InputController, PlayerCommand } from '../input/InputController';
import type Player from '../entities/Player';
import type GameScene from '../scenes/GameScene';
import DangerMap from './DangerMap';
import { findEscapePath } from './Pathfinding';

/**
 * AIInput — the AI brain that produces PlayerCommands.
 *
 * Each tick, the brain:
 * 1. Builds a danger map (where are explosions?)
 * 2. Checks if the AI's current tile is dangerous
 * 3. If dangerous → BFS to nearest safe tile → move there
 * 4. If safe → (for now) do nothing. Later: bomb, chase, collect.
 *
 * The AI never touches Phaser directly. It reads game state,
 * does math, and outputs the same { direction, bombAction } as keyboard.
 */
export default class AIInput implements InputController {
  private player: Player;
  private scene: GameScene;
  private dangerMap: DangerMap;

  constructor(player: Player, scene: GameScene) {
    this.player = player;
    this.scene = scene;
    this.dangerMap = new DangerMap();
  }

  getCommand(): PlayerCommand {
    const player = this.player;
    if (!player.alive) return { direction: null, bombAction: null };

    const now = this.scene.time.now;
    const danger = this.dangerMap.build(this.scene.grid, this.scene.bombs, now);

    // === PRIORITY 1: SURVIVE ===
    // Am I standing on a tile that will explode?
    if (!this.dangerMap.isSafe(player.row, player.col)) {
      const escapeDir = findEscapePath(
        player.col, player.row,
        player.moveCooldown,
        danger,
        this.scene.grid,
        this.scene.bombs,
        now,
      );

      if (escapeDir) {
        return { direction: escapeDir, bombAction: null };
      }
      // No escape — just stand still and accept fate
      return { direction: null, bombAction: null };
    }

    // === PRIORITY 2+ (coming in later steps) ===
    // For now: stand still when safe
    return { direction: null, bombAction: null };
  }
}
