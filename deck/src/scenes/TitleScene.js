/* TitleScene — the pit backdrop, CHARACTER SELECT (2026-08-08): two roads through
   the same conspiracy. VESSIA hunts the ledger; TSUBAKI writes it. */
class TitleScene extends Phaser.Scene {
  constructor() { super("Title"); }
  create() {
    const far = this.add.image(640, 300, "bg_far_1");
    far.setScale(Math.max(1280 / far.width, 620 / far.height) * 1.05);
    const floor = this.add.image(640, 660, "bg_floor_1");
    floor.setScale(Math.max(1280 / floor.width, 260 / (floor.height * 0.4)));
    this.add.rectangle(640, 360, 1280, 720, 0x0c0806, 0.45);

    this.add.particles(0, 0, "dot", {
      x: { min: 0, max: 1280 }, y: 730, lifespan: 5200, speedY: { min: -42, max: -14 },
      speedX: { min: -8, max: 14 }, scale: { start: 0.5, end: 0 }, quantity: 1, frequency: 220,
      tint: [0xff9944, 0xe0b34a, 0xcc5522], alpha: { start: 0.85, end: 0 }, blendMode: "ADD"
    }).setDepth(15);

    this.add.text(640, 150, "THE SORCERER SWORD", {
      fontFamily: "Georgia, serif", fontSize: 60, color: "#e8cfa8",
      stroke: "#4a2c18", strokeThickness: 8, shadow: { offsetY: 4, color: "#000", blur: 10, fill: true }
    }).setOrigin(0.5).setDepth(20);
    this.add.text(640, 206, "— S P I R E   O F   K A R R I D G E —", {
      fontFamily: "Georgia, serif", fontSize: 22, color: "#e0b34a"
    }).setOrigin(0.5).setDepth(20);

    const climbing = Spire.run && !Spire.run.over && (Spire.run.pos !== null || Spire.run.act > 1);

    /* continue button (when a road is underway) */
    if (climbing) {
      const cont = this.add.container(640, 260).setDepth(21);
      const cbg = this.add.rectangle(0, 0, 330, 50, 0x3a2420, 0.94).setStrokeStyle(2, 0xe0b34a);
      const ctxt = this.add.text(0, 0, `CONTINUE — ${Spire.char().name}`, { fontFamily: "Georgia, serif", fontSize: 21, color: "#e8cfa8" }).setOrigin(0.5);
      cont.add([cbg, ctxt]);
      cbg.setInteractive({ useHandCursor: true })
        .on("pointerover", () => cbg.setFillStyle(0x5a3426, 0.95))
        .on("pointerout", () => cbg.setFillStyle(0x3a2420, 0.94))
        .on("pointerdown", () => {
          Spire.sfx.click(); Spire.startMusic();
          this.cameras.main.fadeOut(350);
          this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Map"));
        });
    }

    /* -------- character select: her road, or hers -------- */
    const pick = (x, key, prefix, title, sub, charId) => {
      const panel = this.add.container(x, 468).setDepth(20);
      const bg = this.add.rectangle(0, 0, 340, 330, 0x1c110c, 0.9).setStrokeStyle(2.5, 0x8a5a33);
      panel.add(bg);
      const fig = Spire.spawn(this, prefix + "_idle", x, 588, { depth: 21, height: 240 });
      panel.add(this.add.text(0, -138, title, { fontFamily: "Georgia, serif", fontSize: 26, color: "#e8cfa8", letterSpacing: 3 }).setOrigin(0.5));
      panel.add(this.add.text(0, 128, sub, { fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: "#caa26a", align: "center", lineSpacing: 3 }).setOrigin(0.5));
      bg.setInteractive({ useHandCursor: true })
        .on("pointerover", () => { Spire.sfx.hover(); bg.setStrokeStyle(3, 0xe0b34a); fig.setScale(fig.scaleX * 1.03); })
        .on("pointerout", () => { bg.setStrokeStyle(2.5, 0x8a5a33); fig.setScale(fig.scaleX / 1.03); })
        .on("pointerdown", () => {
          Spire.sfx.click(); Spire.startMusic();
          Spire.newRun(charId);
          this.cameras.main.fadeOut(350);
          this.cameras.main.once("camerafadeoutcomplete", () => {
            const acts = charId === "samurai" ? Spire.ACTS_K : Spire.ACTS;
            this.scene.start("Story", { lines: acts[1].intro, title: acts[1].tag, next: "Map" });
          });
        });
      return panel;
    };
    /* Tsubaki's panel only appears once her art is bundled — safe on older asset packs */
    const hasKd = this.textures.exists("kd_idle_1");
    pick(hasKd ? 450 : 640, "wl", "wl", "V E S S I A",
      "the warlock — hunt the ledger,\nburn the pipeline", "warlock");
    if (hasKd) pick(830, "kd", "kd", "T S U B A K I",
      "the samurai — the Matron's blade,\nsent to write it anew", "samurai");

    this.add.text(640, 700, "Acts I–III: the Pit · the City · the West Road — two roads through one conspiracy", {
      fontFamily: "Georgia, serif", fontSize: 12, color: "#6a5844"
    }).setOrigin(0.5).setDepth(20);
  }
}
