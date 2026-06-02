import Phaser from 'phaser';
import type { InputController, PlayerCommand } from './InputController';

/**
 * KeyboardInput — reads physical keyboard keys and produces PlayerCommands.
 *
 * Each player gets their own instance with different key bindings.
 * Keys are stored by ACTION name (up/down/left/right/bomb/pierce/remote),
 * not by physical key name — so the same code works for any binding.
 */

export interface KeyMap {
  up: string;
  down: string;
  left: string;
  right: string;
  bomb: string;
  pierce: string;
  remote: string;
}

/** Pre-defined key maps for Player 1 and Player 2 */
export const P1_KEYS: KeyMap = {
  up: 'W', down: 'S', left: 'A', right: 'D',
  bomb: 'SHIFT', pierce: 'Q', remote: 'E',
};

export const P2_KEYS: KeyMap = {
  up: 'I', down: 'K', left: 'J', right: 'L',
  bomb: 'SPACE', pierce: 'O', remote: 'U',
};

export default class KeyboardInput implements InputController {
  private up: Phaser.Input.Keyboard.Key;
  private down: Phaser.Input.Keyboard.Key;
  private left: Phaser.Input.Keyboard.Key;
  private right: Phaser.Input.Keyboard.Key;
  private bomb: Phaser.Input.Keyboard.Key;
  private pierce: Phaser.Input.Keyboard.Key;
  private remote: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, keyMap: KeyMap) {
    const kb = scene.input.keyboard!;
    this.up = kb.addKey(keyMap.up);
    this.down = kb.addKey(keyMap.down);
    this.left = kb.addKey(keyMap.left);
    this.right = kb.addKey(keyMap.right);
    this.bomb = kb.addKey(keyMap.bomb);
    this.pierce = kb.addKey(keyMap.pierce);
    this.remote = kb.addKey(keyMap.remote);
  }

  getCommand(): PlayerCommand {
    // Movement — hold to walk (isDown)
    let direction: PlayerCommand['direction'] = null;
    if (this.left.isDown) direction = { dx: -1, dy: 0 };
    else if (this.right.isDown) direction = { dx: 1, dy: 0 };
    else if (this.up.isDown) direction = { dx: 0, dy: -1 };
    else if (this.down.isDown) direction = { dx: 0, dy: 1 };

    // Bomb actions — press once (JustDown)
    let bombAction: PlayerCommand['bombAction'] = null;
    if (Phaser.Input.Keyboard.JustDown(this.bomb)) {
      bombAction = 'normal';
    } else if (Phaser.Input.Keyboard.JustDown(this.pierce)) {
      bombAction = 'pierce';
    } else if (Phaser.Input.Keyboard.JustDown(this.remote)) {
      bombAction = 'remote';
    }

    return { direction, bombAction };
  }
}
