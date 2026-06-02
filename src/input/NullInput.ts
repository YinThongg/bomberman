import type { InputController, PlayerCommand } from './InputController';

/**
 * NullInput — a controller that does nothing.
 *
 * Used as a placeholder for AI players before the brain is wired up.
 * The player just stands still.
 */
export default class NullInput implements InputController {
  getCommand(): PlayerCommand {
    return { direction: null, bombAction: null };
  }
}
