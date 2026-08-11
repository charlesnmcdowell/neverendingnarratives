/* anim.js — registers every SPIRE_ASSETS entry as textures + Phaser animations.
   Frames arrive as base64 data-URIs (file:// safe). Each anim key K gets textures
   K_1..K_n and a Phaser anim "a_K". Looping sets are whitelisted below. */
window.Spire = window.Spire || {};

/* idles that should breathe back and forth instead of snapping frame4 -> frame1
   (2026-08-08: Tsubaki's idle read as "turning over and over" — yoyo + low fps
   makes a 4-frame breathing loop feel continuous) */
Spire.YOYO = new Set(["kd_idle", "sr_idle", "kd2_idle"]);
Spire.LOOPING = new Set([
  "wl_idle","wl_walk","hd_idle","hd_walk",
  "sk_idle","sk_walk","br_idle","br_walk","ms_idle","ms_walk","bs_idle","bs_walk",
  "su_idle","su_walk","cf_idle","cf_walk","dr_idle","dr_fly",
  "sh_idle","sh_walk","ba_idle","ba_walk","as_idle","as_walk","fx_wardaura",
  "ad_idle","ad_walk","dc_idle",
  "hk_idle","hk_walk","gn_idle","gn_walk","st_idle","st_walk","gv_idle","gv_walk",
  "nc_idle","nc_walk","ch_idle","ch_walk","py_idle","py_walk","dr2_idle","dr2_walk",
  "cp_idle","cp_walk",
  /* 2026-08-08 Tsubaki + the Tempest School — without these the new idles/walks
     played ONCE and froze (Hiro: "looks like a still image") */
  "kd_idle","kd_walk",
  "nj_idle","nj_walk","ar_idle","ar_walk","mk_idle","mk_walk","ss_idle","ss_walk","sr_idle","sr_walk",
  /* 2026-08-11 unused-art integration: the rival Second Blade + the Firebird's
     green wardrobe + the white-outfit bob */
  "kd2_idle","kd2_walk","dc2_idle","dc2_walk","dc2_dance","dcw_bob","owl_idle","owl_walk",
  "dl_idle","li_idle","aw_idle"
]);

/* Per-anim display target heights (px on the 1280x720 stage). Tuned by screenshot pass.
   Reaction sheets carry fx around the body, so their canvases differ from idle sets. */
Spire.SIZES = {
  wl_: 300, wl_hurt: 310,
  hd_idle: 210, hd_walk: 210, hd_attack: 215, hd_hurt: 210, hd_death: 200,
  hd_hexhit: 300, hd_firehit: 290, hd_clawhit: 290, hd_portalhit: 280,
  hd_afirehit: 290, hd_ahexhit: 280, hd_fadehit: 240, hd_scythehit: 250,
  su_: 230, cf_: 250, dr_: 260, dr_attack: 300, sh_: 230,
  sk_: 235, br_: 265, ms_: 270,
  bs_: 265, bs_hexhit: 330, bs_firehit: 330, bs_clawhit: 300, bs_portalhit: 300,
  bs_afirehit: 330, bs_ahexhit: 320, bs_fadehit: 260, bs_scythehit: 300, bs_arrowhit: 300,
  ba_: 235, as_: 235, fx_bonearrow: 110,
  ad_: 300, ad_attack: 340, dc_idle: 260,
  hk_: 235, gn_: 245, st_: 255, gv_: 250, nc_: 255,
  ch_: 275, py_: 250, dr2_: 265, cp_: 260,
  fx_hexbolt: 90, fx_firebolt: 100, fx_coldbolt: 150, fx_greenbolt: 130,
  fx_lightbolt: 150, fx_wardaura: 330, fx_fireball: 110, fx_fireballhit: 220
};
Spire.sizeFor = function (key) {
  if (Spire.SIZES[key]) return Spire.SIZES[key];
  let best = null;
  for (const k in Spire.SIZES) if (key.startsWith(k) && (!best || k.length > best.length)) best = k;
  return best ? Spire.SIZES[best] : 200;
};

/* Load all bundle textures into the given scene's texture manager.
   Returns via onProgress(loaded,total) and onDone(). */
Spire.loadAll = function (scene, onProgress, onDone) {
  const jobs = [];
  for (const key in SPIRE_ASSETS) {
    SPIRE_ASSETS[key].frames.forEach((uri, i) => jobs.push([`${key}_${i + 1}`, uri]));
  }
  const total = jobs.length;
  let done = 0;
  const tick = () => { done++; if (onProgress) onProgress(done, total); if (done === total) finish(); };
  const finish = () => {
    for (const key in SPIRE_ASSETS) {
      const a = SPIRE_ASSETS[key];
      if (scene.anims.exists("a_" + key)) continue;
      scene.anims.create({
        key: "a_" + key,
        frames: a.frames.map((_, i) => ({ key: `${key}_${i + 1}` })),
        frameRate: a.fps,
        repeat: Spire.LOOPING.has(key) ? -1 : 0,
        yoyo: Spire.YOYO.has(key)
      });
    }
    if (onDone) onDone();
  };
  scene.textures.on("addtexture", tick);
  jobs.forEach(([k, uri]) => {
    if (scene.textures.exists(k)) { tick(); return; }
    scene.textures.addBase64(k, uri);
  });
  if (total === 0 && onDone) onDone();
};

/* ---------- tiny promise helpers used by all choreography ---------- */
Spire.wait = (scene, ms) => new Promise(r => scene.time.delayedCall(ms, r));
Spire.tween = (scene, cfg) => new Promise(r => scene.tweens.add({ ...cfg, onComplete: r }));
Spire.play = (sprite, key) => new Promise(r => {
  if (!sprite.scene || !sprite.active) { r(); return; }
  let settled = false;
  const done = () => { if (!settled) { settled = true; r(); } };
  sprite.once("animationcomplete", done);
  sprite.once("animationstop", done);
  sprite.once("destroy", done);
  sprite.play("a_" + key);
  const anim = sprite.scene.anims.get("a_" + key);
  if (anim && anim.repeat === -1) done();        // looping anims resolve immediately
});
/* spawn an animated sprite scaled to its tuned height, origin bottom-center */
Spire.spawn = function (scene, key, x, y, opts) {
  opts = opts || {};
  const s = scene.add.sprite(x, y, key + "_1").setOrigin(0.5, 1);
  const h = opts.height || Spire.sizeFor(key);
  s.setScale(h / s.height * (opts.scaleMul || 1));
  if (opts.flipX) s.setFlipX(true);
  if (opts.depth !== undefined) s.setDepth(opts.depth);
  if (opts.tint) s.setTint(opts.tint);
  if (opts.play !== false) s.play("a_" + key);
  return s;
};
