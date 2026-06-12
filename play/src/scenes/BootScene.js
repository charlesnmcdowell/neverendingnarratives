// BootScene — proves the engine + post-processing direction run locally.
// Shows the title over a torchlit darkness test (the D2 atmosphere stack preview):
// darkness overlay, flickering torch glow, drifting fog, ember particles, vignette.

class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;

    // --- stone floor placeholder (procedural, no assets needed yet) ---
    const g = this.add.graphics();
    for (let y = 0; y < H; y += 40) {
      for (let x = 0; x < W; x += 40) {
        const shade = 18 + Math.floor(Math.random() * 10);
        g.fillStyle(Phaser.Display.Color.GetColor(shade, shade - 2, shade - 4));
        g.fillRect(x, y, 38, 38);
      }
    }

    // --- torch glow (flickering radial light) ---
    this.torch = this.add.circle(W / 2, H / 2 + 60, 220, 0xff9a3c, 0.10);
    this.torchInner = this.add.circle(W / 2, H / 2 + 60, 120, 0xffb050, 0.12);

    // --- darkness overlay with a hole-free cheap version (full implementation in Bucket 1) ---
    const dark = this.add.graphics();
    dark.fillStyle(0x000000, 0.55);
    dark.fillRect(0, 0, W, H);
    dark.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // --- drifting fog: two alpha rectangles scrolling at different speeds ---
    this.fog1 = this.add.rectangle(0, H * 0.4, W * 2, 180, 0x9090a0, 0.05).setOrigin(0, 0.5);
    this.fog2 = this.add.rectangle(0, H * 0.7, W * 2, 240, 0x707080, 0.04).setOrigin(0, 0.5);

    // --- ember particles ---
    const emberTex = this.textures.createCanvas('ember', 4, 4);
    const ctx = emberTex.getContext();
    ctx.fillStyle = '#ffb050'; ctx.fillRect(0, 0, 4, 4); emberTex.refresh();
    this.add.particles(W / 2, H + 10, 'ember', {
      x: { min: -W / 2, max: W / 2 },
      lifespan: 6000, speedY: { min: -30, max: -12 }, speedX: { min: -8, max: 8 },
      scale: { start: 0.8, end: 0 }, alpha: { start: 0.5, end: 0 },
      quantity: 1, frequency: 220, blendMode: 'ADD'
    });

    // --- vignette (4 gradient edges, cheap version) ---
    const vig = this.add.graphics();
    for (let i = 0; i < 60; i++) {
      const a = 0.012 * (60 - i) / 60 * 30;
      vig.fillStyle(0x000000, Math.min(a, 0.35) / 30);
      vig.fillRect(i * 4, i * 3, W - i * 8, H - i * 6);
    }

    // --- title ---
    this.add.text(W / 2, H / 2 - 90, 'THE SORCERER-SWORD', {
      fontFamily: 'Georgia, serif', fontSize: '54px', color: '#d8c9a3',
      stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 38, 'T H E   A N K U S P A W N   C O N S P I R A C Y', {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#8a2f2f',
      stroke: '#000000', strokeThickness: 4, letterSpacing: 2
    }).setOrigin(0.5);
    this.add.text(W / 2, H - 60, 'Bucket 0 scaffold — Phaser ' + Phaser.VERSION + ' running. Combat port begins in Bucket 1.', {
      fontFamily: 'monospace', fontSize: '14px', color: '#6a6a6a'
    }).setOrigin(0.5);
  }

  update(time) {
    // torch flicker
    const f = 0.10 + Math.sin(time * 0.01) * 0.015 + Math.random() * 0.02;
    this.torch.setAlpha(f);
    this.torchInner.setAlpha(f + 0.03);
    // fog drift
    this.fog1.x = -((time * 0.012) % (this.scale.width));
    this.fog2.x = -((time * 0.027) % (this.scale.width));
  }
}
