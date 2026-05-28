export const GRID_COLS = 15;
export const GRID_ROWS = 13;
export const TILE_SIZE = 48;

export const TILE = {
  FLOOR: 0,
  WALL: 1,
  SOFT_WALL: 2,
} as const;

export type TileType = (typeof TILE)[keyof typeof TILE];

export const POWERUP = {
  EXTRA_BOMB: 'extra_bomb',
  EXTRA_RANGE: 'extra_range',
  SPEED_UP: 'speed_up',
  BOMB_KICK: 'bomb_kick',
  FULL_FIRE: 'full_fire',
  PIERCE_BOMB: 'pierce_bomb',
  REMOTE_BOMB: 'remote_bomb',
  SKULL: 'skull',
} as const;

export type PowerUpType = (typeof POWERUP)[keyof typeof POWERUP];

export const COLORS = {
  FLOOR: 0x8bc34a,
  FLOOR_ALT: 0x7cb342,
  WALL: 0x455a64,
  SOFT_WALL: 0xa0522d,
  BACKGROUND: 0x1a1a2e,
  PLAYER_BLUE: 0x4488ff,
  PLAYER_RED: 0xff4444,
} as const;

export const POWERUP_SPAWN_CHANCE = 0.7;

export const POWERUP_WEIGHTS: Record<PowerUpType, number> = {
  [POWERUP.EXTRA_BOMB]: 1,
  [POWERUP.EXTRA_RANGE]: 0.6,
  [POWERUP.SPEED_UP]: 0.6,
  [POWERUP.BOMB_KICK]: 0.4,
  [POWERUP.FULL_FIRE]: 1.0,
  [POWERUP.PIERCE_BOMB]: 1.0,
  [POWERUP.REMOTE_BOMB]: 1.0,
  [POWERUP.SKULL]: 1.0,
};

export const BASE_MOVE_COOLDOWN = 180;
export const SPEED_PER_PICKUP = 20;
export const MIN_MOVE_COOLDOWN = 70;
export const BOMB_FUSE_TIME = 2500;
export const RANGE_PER_PICKUP = 0.5;
export const BOMB_SLIDE_SPEED = 6;
export const MAX_BOMB_RANGE = Math.max(GRID_COLS, GRID_ROWS);
export const PIERCE_BOMBS_PER_PICKUP = 3;
export const REMOTE_BOMBS_PER_PICKUP = 3;
export const SKULL_DURATION = 30_000;
export const SKULL_SLOW_COOLDOWN = 320;
export const HUD_HEIGHT = 36;
