export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.cameras.main.setBackgroundColor(0x1a1a2e);

    // Loading bar — shows progress while assets download
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2 - 32, 'Loading…', {
      fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5);
    const track = this.add.rectangle(width / 2, height / 2, width * 0.5, 10, 0x333333);
    const bar   = this.add.rectangle(width / 2 - width * 0.25, height / 2, 0, 10, 0xffffff).setOrigin(0, 0.5);
    this.load.on('progress', v => bar.setSize(v * width * 0.5, 10));

    // ── Tiles ──────────────────────────────────────────────────────────────
    // Source: Kenney "Tiny Dungeon" – kenney.nl/assets/tiny-dungeon
    // Extract the pack → find the Tilemap folder → copy tiles as described
    // in README.md into assets/tiles/.
    this.load.image('tile_floor',     'assets/tiles/floor.png');
    this.load.image('tile_floor_alt', 'assets/tiles/floor_alt.png');
    this.load.image('tile_wall',      'assets/tiles/wall.png');
    this.load.image('tile_soft_wall', 'assets/tiles/soft_wall.png');

    // ── Sprites ────────────────────────────────────────────────────────────
    // Characters: Kenney "Tiny Dungeon" character sprites (Characters folder)
    // Bomb / explosion / power-ups: Kenney "Roguelike Pack"
    //   kenney.nl/assets/roguelike-rpg-pack  (also CC0, enormous variety)
    this.load.image('player_blue',   'assets/sprites/player_blue.png');
    this.load.image('player_red',    'assets/sprites/player_red.png');
    this.load.image('bomb',          'assets/sprites/bomb.png');
    this.load.image('explosion',     'assets/sprites/explosion.png');
    this.load.image('powerup_bomb',  'assets/sprites/powerup_bomb.png');
    this.load.image('powerup_range', 'assets/sprites/powerup_range.png');

    // ── Audio ──────────────────────────────────────────────────────────────
    // All sounds can be generated for free at sfxr.me (retro 8-bit style).
    // Alternatively grab from Kenney "Interface Sounds":
    //   kenney.nl/assets/interface-sounds
    // See README.md for exact sfxr presets.
    this.load.audio('snd_place',   'assets/audio/bomb_place.wav');
    this.load.audio('snd_explode', 'assets/audio/explosion.wav');
    this.load.audio('snd_death',   'assets/audio/player_death.wav');
    this.load.audio('snd_pickup',  'assets/audio/powerup_pickup.wav');
  }

  create() {
    this.scene.start('GameScene');
  }
}
