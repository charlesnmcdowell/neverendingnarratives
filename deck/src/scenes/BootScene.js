/* BootScene — decodes the base64 bundles into textures, builds anims, shows a load bar. */
class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }
  create() {
    const cx = 640, cy = 380;
    this.add.text(cx, 260, "THE SORCERER SWORD", { fontFamily: "Georgia, serif", fontSize: 44, color: "#e0b34a" }).setOrigin(0.5);
    this.add.text(cx, 310, "S P I R E   O F   K A R R I D G E", { fontFamily: "Georgia, serif", fontSize: 18, color: "#caa26a", letterSpacing: 4 }).setOrigin(0.5);
    const barBg = this.add.rectangle(cx, cy, 424, 18, 0x2a1e16).setStrokeStyle(2, 0x8a5a33);
    const bar = this.add.rectangle(cx - 210, cy, 2, 12, 0xe0b34a).setOrigin(0, 0.5);
    const label = this.add.text(cx, cy + 30, "waking the spire…", { fontFamily: "Georgia, serif", fontSize: 14, color: "#9a8264" }).setOrigin(0.5);
    // tiny particle dot used by every engine-side effect
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1); g.fillCircle(5, 5, 5); g.generateTexture("dot", 10, 10); g.destroy();
    Spire.loadAll(this,
      (n, total) => { bar.width = Math.max(2, 420 * n / total); },
      () => {
        label.setText("ready");
        const params = new URLSearchParams(location.search);
        this.scene.start(params.get("scene") === "fight" ? "Fight" : (params.get("scene") === "map" ? "Map" : "Title"));
      });
  }
}
