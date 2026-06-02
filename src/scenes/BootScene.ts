import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.cameras.main.setBackgroundColor(0x1a1a2e);

    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2 - 32, 'Loading…', { fontSize: '22px', color: '#ffffff' })
      .setOrigin(0.5);
    const bar = this.add
      .rectangle(width / 2 - width * 0.25, height / 2, 0, 10, 0xffffff)
      .setOrigin(0, 0.5);
    this.add.rectangle(width / 2, height / 2, width * 0.5, 10, 0x333333);
    this.load.on('progress', (v: number) => bar.setSize(v * width * 0.5, 10));

    this.load.image('tile_floor', 'assets/tiles/floor.png');
    this.load.image('tile_floor_alt', 'assets/tiles/floor_alt.png');
    this.load.image('tile_wall', 'assets/tiles/wall.png');
    this.load.image('tile_soft_wall', 'assets/tiles/soft_wall.png');

    this.load.image('player_blue', 'assets/sprites/player_blue.png');
    this.load.image('player_red', 'assets/sprites/player_red.png');
    this.load.image('player_white', 'assets/sprites/player_white.png');
    this.load.image('player_yellow', 'assets/sprites/player_yellow.png');
    this.load.image('bomb', 'assets/sprites/bomb.png');
    this.load.image('bomb_blue', 'assets/sprites/bomb_blue.png');
    this.load.image('bomb_red', 'assets/sprites/bomb_red.png');
    this.load.image('bomb_white', 'assets/sprites/bomb_white.png');
    this.load.image('bomb_yellow', 'assets/sprites/bomb_yellow.png');
    this.load.image('bomb_pierce', 'assets/sprites/bomb_pierce.png');
    this.load.image('explosion', 'assets/sprites/explosion.png');
    this.load.image('powerup_bomb', 'assets/sprites/powerup_bomb.png');
    this.load.image('powerup_range', 'assets/sprites/powerup_range.png');
    this.load.image('powerup_speed', 'assets/sprites/powerup_speed.png');
    this.load.image('powerup_kick', 'assets/sprites/powerup_kick.png');
    this.load.image('powerup_fullfire', 'assets/sprites/powerup_fullfire.png');
    this.load.image('powerup_pierce', 'assets/sprites/powerup_pierce.png');
    this.load.image('powerup_remote', 'assets/sprites/powerup_remote.png');
    this.load.image('powerup_skull', 'assets/sprites/powerup_skull.png');
    this.load.image('bomb_remote', 'assets/sprites/bomb_remote.png');

    this.load.audio('snd_place', 'assets/audio/bomb_place.wav');
    this.load.audio('snd_explode', 'assets/audio/explosion.wav');
    this.load.audio('snd_death', 'assets/audio/player_death.wav');
    this.load.audio('snd_pickup', 'assets/audio/powerup_pickup.wav');
  }

  create() {
    this.scene.start('TitleScene');
  }
}
