/**
 * PlayerCommand — the universal output format for all input controllers.
 *
 * Every tick, a controller (keyboard or AI) produces one of these.
 * The Player class doesn't care WHO produced it — it just reads the command.
 *
 *   direction:  which way to move (null = stand still)
 *   bombAction: which bomb type to place/detonate (null = do nothing)
 */
export interface PlayerCommand {
  direction: { dx: number; dy: number } | null;
  bombAction: 'normal' | 'pierce' | 'remote' | null;
}

/**
 * InputController — the interface that both KeyboardInput and AIInput implement.
 *
 * This is the key abstraction. GameScene doesn't know or care if a player
 * is human or AI. It just calls controller.getCommand() each tick.
 */
export interface InputController {
  getCommand(): PlayerCommand;
}
