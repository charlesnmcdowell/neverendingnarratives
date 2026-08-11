/* world.js — Dragon's-Crown beat-em-up arena: shallow 2.5D ground band,
 * a sideways-scrolling PARALLAX pit, a follow camera, and a painterly POST-FX
 * pass (soft radial vignette + warm additive bloom).
 * Owned by game3d-build. Pure placeholders for now (real bg layers swap in from
 * art_in/ later) — nothing in scenery may occlude actors: pillars sit at low
 * depth (BEHIND the actors, which are depth-sorted by their ground y); the
 * post-FX is camera-fixed and its CENTER is fully transparent so the action reads.
 *
 * PARALLAX DEPTH (slow→fast scroll): far crowd wall 0.35 · MID crowd 0.55 ·
 * floor 1.0 (contact plane, locked to actors) · pillars 1.0 (midground, behind
 * actors). Only the background crowd walls parallax; the floor stays 1:1 so the
 * flagstones never slide under the actors' feet. The post-FX (vignette +
 * bloom) is camera-fixed (scrollFactor 0) above the scene but BELOW the HUD.
 *
 * API:
 *   World.build(scene)  -> { width, height, band, layers, groundY(d) }
 *   World.band          -> { near, far }  depth range actors walk within
 */
(function (root) {
  'use strict';

  // pit is WIDER than the screen so the camera scrolls sideways
  var WORLD_W = 2600, WORLD_H = 540;
  var VIEW_W = 960, VIEW_H = 540;             // FIT base resolution (bootArena)
  // shallow depth band (y = depth; smaller = farther back). actors y-sort on it.
  var BAND = { far: 330, near: 500 };
  // post-FX layer depths: above actors/fx (≤9500) but below HUD (10000).
  var DEPTH_BLOOM = 9600, DEPTH_VIGNETTE = 9700;

  function g(scene) { return scene.add.graphics(); }

  // build a one-off canvas texture via a draw callback (radial gradients — which
  // Phaser.Graphics can't do — for the smooth vignette + bloom falloff).
  function canvasTex(scene, key, w, h, paint) {
    if (scene.textures.exists(key)) scene.textures.remove(key);   // safe on scene restart
    var ct = scene.textures.createCanvas(key, w, h);
    if (!ct) return null;                                         // headless guard
    paint(ct.getContext(), w, h);
    ct.refresh();
    return key;
  }

  function build(scene) {
    scene.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    scene.physics && scene.physics.world && scene.physics.world.setBounds &&
      scene.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    var layers = {};

    // --- far crowd wall (slow parallax, lit so the packed stands read) -------
    var far = g(scene);
    far.fillStyle(0x241a30, 1); far.fillRect(0, 0, WORLD_W, BAND.far + 30);
    // warm lit stands so the crowd wall is visible (TOP-4 #2: not crushed dark)
    for (var x = 0; x < WORLD_W; x += 26) {
      var lum = 0x3a2c1e + ((x * 37) % 0x18) * 0x010000;
      far.fillStyle(lum, 0.9);
      far.fillRect(x, 70 + ((x * 13) % 40), 20, 150);
    }
    far.fillStyle(0x100a16, 0.5); far.fillRect(0, 0, WORLD_W, 60); // top gloom only
    far.setScrollFactor(0.35).setDepth(-1000);
    layers.far = far;

    // --- MID crowd band (medium parallax) — a second, brighter, larger row of
    //     packed silhouettes between the far wall and the floor. Its faster scroll
    //     (0.55 vs 0.35) gives the sideways camera real depth as it tracks. -----
    var mid = g(scene);
    for (var mx = 0; mx < WORLD_W; mx += 30) {
      var head = 0x4a3622 + ((mx * 53) % 0x1c) * 0x010000;   // warm-lit heads
      mid.fillStyle(head, 0.92);
      mid.fillRect(mx, 150 + ((mx * 17) % 34), 24, 120);     // bigger = nearer
      mid.fillStyle(0x2a1d2e, 0.6);                          // shoulder gap shadow
      mid.fillRect(mx + 24, 150 + ((mx * 17) % 34), 6, 120);
    }
    mid.fillStyle(0x140d18, 0.42); mid.fillRect(0, BAND.far - 30, WORLD_W, 60); // base haze
    mid.setScrollFactor(0.55).setDepth(-750);
    layers.mid = mid;

    // --- floor (CONTACT PLANE — locked 1:1 to the actors) --------------------
    // The ground the actors stand on must scroll at scrollFactor 1.0, the same as
    // the (default-1.0) actors, or the flagstones visibly DRIFT under their feet
    // (a foot-slide). DC parallaxes only the BACKGROUND crowd walls (far 0.35 /
    // mid 0.55), never the playfield floor — so lock it to world space.
    var floor = g(scene);
    floor.fillStyle(0x171019, 1); floor.fillRect(0, BAND.far - 10, WORLD_W, WORLD_H);
    floor.fillStyle(0x20151f, 1); floor.fillRect(0, BAND.far - 10, WORLD_W, 22);
    // flagstone hint lines
    floor.lineStyle(1, 0x2c1f30, 0.6);
    for (var fx = 0; fx < WORLD_W; fx += 80) { floor.beginPath(); floor.moveTo(fx, BAND.far); floor.lineTo(fx - 40, WORLD_H); floor.strokePath(); }
    floor.setScrollFactor(1).setDepth(-500);
    layers.floor = floor;

    // --- MIDGROUND pillars: BEHIND the actors (low depth), never occluding ----
    var pil = g(scene);
    pil.fillStyle(0x130d1a, 1);
    for (var px = 180; px < WORLD_W; px += 520) {
      pil.fillRect(px, 90, 46, BAND.far + 40);
      pil.fillStyle(0x1c1426, 1); pil.fillRect(px + 4, 90, 10, BAND.far + 40);
      pil.fillStyle(0x130d1a, 1);
    }
    pil.setScrollFactor(1).setDepth(-100); // < any actor depth (actors use +y)
    layers.pillars = pil;

    // --- POST-FX (camera-fixed, center transparent so it never occludes) ------
    // Warm additive BLOOM rising from the lit arena floor (Vanillaware glow).
    var bloomKey = canvasTex(scene, '__bloom', VIEW_W, VIEW_H, function (ctx, w, h) {
      var rg = ctx.createRadialGradient(w * 0.5, h * 0.84, 40, w * 0.5, h * 0.84, h * 0.95);
      rg.addColorStop(0.0, 'rgba(255,176,96,0.30)');
      rg.addColorStop(0.4, 'rgba(214,120,70,0.14)');
      rg.addColorStop(1.0, 'rgba(40,18,30,0.0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    });
    if (bloomKey) {
      var bloom = scene.add.image(VIEW_W * 0.5, VIEW_H * 0.5, bloomKey)
        .setScrollFactor(0).setDepth(DEPTH_BLOOM);
      bloom.blendMode = (root.Phaser && Phaser.BlendModes && Phaser.BlendModes.ADD) || 1;
      layers.bloom = bloom;
    }
    // Soft radial VIGNETTE — replaces the harsh CSS box-shadow that crushed the
    // crowd wall. Clear at center, darkening toward the corners (DC framing).
    var vigKey = canvasTex(scene, '__vignette', VIEW_W, VIEW_H, function (ctx, w, h) {
      var cx = w * 0.5, cy = h * 0.46, r1 = Math.hypot(w, h) * 0.62;
      var rg = ctx.createRadialGradient(cx, cy, r1 * 0.34, cx, cy, r1);
      rg.addColorStop(0.0, 'rgba(8,5,14,0.0)');
      rg.addColorStop(0.62, 'rgba(8,5,14,0.18)');
      rg.addColorStop(1.0, 'rgba(5,3,9,0.72)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    });
    if (vigKey) {
      layers.vignette = scene.add.image(VIEW_W * 0.5, VIEW_H * 0.5, vigKey)
        .setScrollFactor(0).setDepth(DEPTH_VIGNETTE);
    }

    return { width: WORLD_W, height: WORLD_H, band: BAND, layers: layers,
             groundY: function (d) { return d; } };
  }

  root.World = { build: build, band: BAND, WORLD_W: WORLD_W, WORLD_H: WORLD_H };
})(typeof window !== 'undefined' ? window : globalThis);
