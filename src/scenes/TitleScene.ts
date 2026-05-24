import Phaser from "phaser";
import { GRID_COLS, GRID_ROWS, TILE_SIZE } from "../config/constants";

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  create() {
    const cx = (GRID_COLS * TILE_SIZE) / 2;
    const cy = (GRID_ROWS * TILE_SIZE) / 2;

    this.cameras.main.setBackgroundColor(0x1a1a2e);

    // Title
    this.add
      .text(cx, cy - 120, "Oppenhomie", {
        fontSize: "56px",
        fontFamily: "monospace",
        color: "#ff6600",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(cx, cy - 70, "Select Mode", {
        fontSize: "20px",
        fontFamily: "monospace",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    // Mode buttons
    const modes = [{ label: "2P Battle", mode: "battle" }];

    modes.forEach((entry, i) => {
      const y = cy - 10 + i * 60;
      const isDisabled = entry.mode === "ai";

      const btn = this.add
        .text(cx, y, entry.label, {
          fontSize: "28px",
          fontFamily: "monospace",
          color: isDisabled ? "#555555" : "#ffffff",
          stroke: "#000000",
          strokeThickness: 4,
          padding: { x: 20, y: 10 },
        })
        .setOrigin(0.5);

      if (!isDisabled) {
        btn.setInteractive({ useHandCursor: true });

        btn.on("pointerover", () => {
          btn.setColor("#ff6600");
          btn.setScale(1.08);
        });

        btn.on("pointerout", () => {
          btn.setColor("#ffffff");
          btn.setScale(1);
        });

        btn.on("pointerdown", () => {
          this.scene.start("GameScene", { mode: entry.mode });
        });
      }
    });

    // Controls info
    this.add
      .text(cx, cy + 140, "P1: WASD + Shift  |  P2: IJKL + Space", {
        fontSize: "14px",
        fontFamily: "monospace",
        color: "#666666",
      })
      .setOrigin(0.5);

    // Keyboard shortcut — Enter starts 2P battle
    this.input.keyboard!.on("keydown-ENTER", () => {
      this.scene.start("GameScene", { mode: "battle" });
    });
  }
}
