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
} as const;

export type PowerUpType = (typeof POWERUP)[keyof typeof POWERUP];

export const COLORS = {
  FLOOR: 0x8bc34a,
  FLOOR_ALT: 0x7cb342,
  WALL: 0x455a64,
  SOFT_WALL: 0xa0522d,
  BACKGROUND: 0x1a1a2e,
} as const;
