/* actors.js — a rig-driven brawler actor (player or enemy) on the shallow plane.
 * Owned by game3d-build. Binds src/rig.js (anim-owned) to a Phaser Rope over a
 * placeholder silhouette; real gen-sprites art swaps the texture later.
 *
 * Actor(scene, opts{type,plan,json,x,depth,team,hp,scale})
 *   .update(dt)               advance rig + reposition rope, depth-sort, face
 *   .play(action)             proxy to rig.play
 *   .moveTo(dx,dd)            nudge within the depth band, sets facing + gait
 *   .audit()                  { type, action, anim:{rigged,frames} }
 */
(function (root) {
  'use strict';
  // ACTOR-HEIGHT-BAND fix (clears the long-standing P3 auditor FAIL): the base
  // silhouette box. warlock draws at scale 1.0, so BH is the warlock's on-screen
  // px height; BH/WORLD_H(540) must sit in the Dragon's-Crown character band 28-36%.
  // Was 220 (=40.7%, too tall → FAIL). Now 180 (=33.3%, mid-band). BW scaled with it
  // (98/180=0.544 ≈ the old 120/220=0.545) so the silhouette aspect is unchanged —
  // every actor just sits at true DC proportion against the pit. Feet stay planted
  // (positioning is by ground `depth`, not box top), reach/kit values untouched.
  var BW = 98, BH = 180, _id = 0;
  // A blow this big doesn't just flinch — it LAUNCHES the target into the Dragon's-Crown
  // knockdown beat: knockback (off the feet) -> knockdown (slam prone) -> getup (rise). The
  // anim rig ships these three as universal one-shots; CHAIN_SECS spans their clip sum (+ε)
  // so the actor stays down until it has finished getting up (driven in reactTick).
  var KNOCKDOWN_DMG = 30;
  var CHAIN_SECS = 0.5 + 0.7 + 0.8 + 0.1;   // knockback .5 + knockdown .7 + getup .8 + ε
  // HIT-FLASH: Dragon's-Crown's signature white-blink on every connect. A struck actor's
  // silhouette is solid-white tinted (rope.tintFill) for FLASH_SECS, then restored to neutral.
  // Pure feel: no damage/reach/kit change. Phaser Rope supports tintFill + a tint setter that
  // fills every vertex colour, so the whole sprite flashes white for a couple of frames.
  var FLASH_SECS = 0.09;
  // SQUASH-ON-HIT: Dragon's-Crown impact pop. A struck actor's silhouette SQUASHES flat at the
  // connect moment (wider in x, shorter in y) then springs back to neutral over SQUASH_SECS,
  // anchored at the FEET so it reads as a recoil into the ground rather than a float. Drives the
  // existing Rope's scaleX/scaleY (facing lives in the point flip, not scale, so scale is free).
  // Lands on the SAME frame as the hit-flash + hit-stop, so the freeze-frame is a white,
  // squashed sprite — DC's full contact tell. Pure feel: no damage/reach/kit change.
  var SQUASH_SECS = 0.13, SQUASH_AMP = 0.18;
  // DASH-LAUNCHER (DC juggle starter): a dash-strike on a LIGHT foe POPS it airborne — the sprite
  // lifts off the ground on a gravity arc (LAUNCH_VY up, LAUNCH_GRAV pulling it back down) and hangs
  // HELPLESS for the airtime (~0.65s), opening the Dragon's-Crown air-combo window. Pure feel: the
  // hop offsets ONLY the rope's y (the ground `depth` used for depth-sorting is untouched, so the
  // shadow/sort stays planted), and it reuses the existing stagger + the `knockback` clip — no
  // damage/reach/kit/economy change. Clamped + zeroed on landing so a big dt can't strand it aloft.
  var LAUNCH_VY = 300, LAUNCH_GRAV = 920;
  // AIR-HIT-CONFIRM (DC bounce-juggle payoff): once a foe is aloft from the dash-launcher, a follow-up
  // light-side blow RE-POPS it — re-adding a DIMINISHING fraction (AIR_HIT_VY) of the launch velocity so
  // it bounces back up instead of falling, opening the next air swing. A small per-actor counter
  // (AIR_HIT_CAP) bounds the juggle so it can never loop forever; the initial launch() resets it and a
  // landing clears it, so every fresh launch starts a clean count. Pure feel — the damage was already
  // applied by hurt(); this only re-sets the kinematic hop + the helpless stagger.
  var AIR_HIT_CAP = 3, AIR_HIT_VY = 0.6;
  // KNOCKBACK SLIDE (DC horizontal push): a struck actor doesn't just flinch in place — it SKIDS
  // backward away from the attacker, harder the heavier the blow, decaying under friction. This is
  // Dragon's-Crown's signature "the mob gets shoved off its feet" read and the horizontal companion
  // to the vertical juggle hop. Pure spatial feel: hurt() seeds a horizontal velocity `_kvx`,
  // update() integrates it into `x` (with the same band/world clamp moveTo uses) and decays it to
  // rest — NO damage/reach/summon-economy/kit change (pit.js is top-down and has no knockback vector).
  // Speeds px/s by weight: light flinch / heavy knockback / launching knockdown.
  var KB_LIGHT = 90, KB_HEAVY = 230, KB_LAUNCH = 320, KB_FRICTION = 7;
  // GROUND DROP-SHADOW (Dragon's-Crown depth cue): a soft dark ellipse on the floor directly under
  // each actor. Vanillaware/DC seats every character with a contact shadow — it tells the eye where
  // a sprite stands on the plane and (crucially) reads the AIRBORNE juggle: the shadow is pinned to
  // the GROUND `depth` and is NEVER lifted by the hop, so when the dash-launcher pops a foe the
  // sprite rises while its shadow stays planted, and the shadow SHRINKS + fades the higher it floats
  // (further off the ground = smaller/fainter contact). Sorted just under its owner. Pure spatial
  // feel — no damage/reach/summon-economy/kit change (pit.js is top-down and has no shadow concept).
  var SHADOW_W = 0.62, SHADOW_H = 0.20, SHADOW_A = 0.34, SHADOW_MIN = 0.45, SHADOW_FALL = 320;

  function drawBiped(g, w, h, robe, accent) {
    g.fillStyle(robe, 1); g.beginPath(); g.moveTo(w*0.5,h*0.10); g.lineTo(w*0.80,h*0.55);
    g.lineTo(w*0.72,h*0.98); g.lineTo(w*0.28,h*0.98); g.lineTo(w*0.20,h*0.55); g.closePath(); g.fill();
    g.fillStyle(accent, 1); g.fillRect(w*0.30,h*0.30,w*0.40,h*0.30);
    g.fillStyle(0x1b1530, 1); g.beginPath(); g.arc(w*0.5,h*0.16,w*0.20,Math.PI,0); g.closePath(); g.fill();
    g.fillStyle(0xc9a0ff, 1); g.fillRect(w*0.42,h*0.17,5,3); g.fillRect(w*0.54,h*0.17,5,3);
  }
  function drawWinged(g, w, h, robe, accent) {
    g.fillStyle(0x5a2740, 1);
    g.beginPath(); g.moveTo(w*0.30,h*0.30); g.lineTo(w*0.02,h*0.18); g.lineTo(w*0.12,h*0.46); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(w*0.70,h*0.30); g.lineTo(w*0.98,h*0.18); g.lineTo(w*0.88,h*0.46); g.closePath(); g.fill();
    drawBiped(g, w, h, robe || 0x7a2347, accent || 0x9c3a5e);
  }
  function drawQuad(g, w, h, robe) {
    g.fillStyle(robe || 0x3a3450, 1);
    g.beginPath(); g.moveTo(w*0.20,h*0.42); g.lineTo(w*0.84,h*0.40); g.lineTo(w*0.84,h*0.60); g.lineTo(w*0.20,h*0.62); g.closePath(); g.fill();
    g.fillStyle(0x46405e, 1);
    g.beginPath(); g.moveTo(w*0.20,h*0.42); g.lineTo(w*0.04,h*0.30); g.lineTo(w*0.10,h*0.48); g.lineTo(w*0.22,h*0.56); g.closePath(); g.fill();
    g.fillStyle(0x2f2a44, 1);
    g.fillRect(w*0.26,h*0.60,w*0.06,h*0.36); g.fillRect(w*0.36,h*0.60,w*0.06,h*0.36);
    g.fillRect(w*0.64,h*0.58,w*0.06,h*0.38); g.fillRect(w*0.74,h*0.58,w*0.06,h*0.38);
    g.fillStyle(0xcaa0ff, 1); g.fillRect(w*0.10,h*0.36,5,3);
  }

  function Actor(scene, o) {
    o = o || {};
    this.scene = scene;
    this.type = o.type || 'grunt';
    this.plan = o.plan || 'BIPED';
    this.team = o.team || 'enemy';
    this.dmg = o.dmg != null ? o.dmg : 10;          // per-hit damage this actor deals
    this.atkClip = (o.json && o.json.attack) || 'attack'; // rig clip for its strike
    this.scale = o.scale || 1;
    this.x = o.x || 100;
    this.depth = o.depth || 440;          // ground y within the band = depth
    this.hp = o.hp != null ? o.hp : 40;
    this.maxhp = this.hp;
    this.facing = this.team === 'enemy' ? -1 : 1;
    this.dead = false;
    this.key = this.type + '#' + (++_id);

    var w = BW * this.scale, h = BH * this.scale;
    var cv = scene.textures.createCanvas(this.key, w, h), g2 = cv.getContext('2d');
    // tiny graphics-style draw on the canvas ctx via a throwaway Graphics is overkill;
    // draw directly with 2d ctx using the same silhouette
    g2.clearRect(0, 0, w, h);
    var ctxG = wrap2d(g2);
    var robe = this.team === 'player' ? 0x2b2140 : 0x3a1f2a;
    var acc  = this.team === 'player' ? 0x6a3cc0 : 0x7a2740;
    if (this.plan === 'QUADRUPED') drawQuad(ctxG, w, h, robe);
    else if (this.plan === 'WINGED') drawWinged(ctxG, w, h, robe, acc);
    else drawBiped(ctxG, w, h, robe, acc);
    cv.refresh();

    this.box = { x: 0, y: 0, w: w, h: h };
    this.rig = root.Rig.createRig(this.key, this.plan, o.json || null).layout(this.box);
    var pts = this.rig.ropePoints();
    this.rope = scene.add.rope(this.x, this.depth - h, this.key, null,
      pts.map(function (p) { return new Phaser.Math.Vector2(p.x - w / 2, p.y); }), false);
    this.rope.setOrigin(0.5, 0);
    this.h = h;
    // GROUND DROP-SHADOW: a feet-anchored contact ellipse, sorted just below its owner so it never
    // occludes the sprite. Guarded for the headless auditor (add.ellipse may be absent there).
    this.shadow = scene.add.ellipse
      ? scene.add.ellipse(this.x, this.depth, w * SHADOW_W, w * SHADOW_H, 0x000000, SHADOW_A).setDepth(this.depth - 1)
      : null;
    this.rig.play('idle');
  }

  // adapt the canvas 2d ctx to the Graphics-style calls used by the draw fns
  function wrap2d(g) {
    return {
      fillStyle: function (hex, a) { g.fillStyle = '#' + ('000000' + hex.toString(16)).slice(-6); g.globalAlpha = a == null ? 1 : a; },
      fillRect: function (x, y, w, h) { g.fillRect(x, y, w, h); },
      beginPath: function () { g.beginPath(); },
      moveTo: function (x, y) { g.moveTo(x, y); },
      lineTo: function (x, y) { g.lineTo(x, y); },
      arc: function (x, y, r, a, b) { g.arc(x, y, r, a, b); },
      closePath: function () { g.closePath(); },
      fill: function () { g.fill(); }
    };
  }

  Actor.prototype.play = function (a) { this.rig.play(a); return this; };

  Actor.prototype.moveTo = function (dx, dd) {
    if (dx) this.facing = dx > 0 ? 1 : -1;
    this.x += dx; this.depth += dd;
    var b = root.World.band;
    if (this.depth < b.far) this.depth = b.far;
    if (this.depth > b.near) this.depth = b.near;
    if (this.x < 30) this.x = 30;
    if (this.x > root.World.WORLD_W - 30) this.x = root.World.WORLD_W - 30;
  };

  // melee reach in x-pixels (front of facing). overridable per-type later.
  Actor.prototype.reach = 92;

  // take damage; turn to face the attacker; pick an anim hit-reaction clip.
  // light -> 'hurt' (in-place flinch); heavy -> 'knockback'; a LAUNCHING blow ->
  // the knockback->knockdown->getup chain (reactTick advances it); lethal -> 'die'.
  Actor.prototype.hurt = function (dmg, attackerX) {
    if (this.dead || this.dying) return false;
    this.hp -= dmg;
    this.flash = FLASH_SECS;   // pop a white hit-flash on every connect (incl. the killing blow)
    this.squash = SQUASH_SECS;  // and a feet-grounded squash pop on the same connect frame
    if (attackerX != null) this.facing = attackerX > this.x ? 1 : -1;
    if (this.hp <= 0) {
      this.hp = 0; this.dying = true; this.stagger = 1.0; this._chain = null; this.play('die');
    } else if (dmg >= KNOCKDOWN_DMG) {
      // a truly heavy hit LAUNCHES into the full DC knockdown beat (advanced in reactTick).
      this._chain = ['knockback', 'knockdown', 'getup'];
      this.stagger = CHAIN_SECS; this.play('knockback');
    } else {
      var heavy = dmg >= 22;
      this._chain = null;
      this.stagger = heavy ? 0.5 : 0.26;
      this.play(heavy ? 'knockback' : 'hurt');
    }
    // KNOCKBACK SLIDE seed (the horizontal companion to the vertical juggle): shove the struck
    // actor AWAY from the attacker, harder the heavier the blow (light flinch / heavy / launching).
    // update() integrates + decays this under friction. A DoT with no attacker pos (attackerX null
    // — fire/hex/gas) skips, so a burn never shoves. No damage/reach/kit/economy change.
    if (attackerX != null) {
      var kdir = this.x >= attackerX ? 1 : -1;
      var kmag = this.hp <= 0 ? KB_HEAVY : (dmg >= KNOCKDOWN_DMG ? KB_LAUNCH : (dmg >= 22 ? KB_HEAVY : KB_LIGHT));
      this._kvx = kdir * kmag;
    }
    return true;
  };

  // advance the post-hit reaction while the actor is staggered. The player loop + npcAI call
  // this in place of the old inline "force idle on rig.done": if a knockdown CHAIN is active,
  // step to the next one-shot as each completes (knockback -> knockdown -> getup -> idle);
  // otherwise settle to idle once the flinch/knockback one-shot has played out (prior behavior).
  Actor.prototype.reactTick = function () {
    if (this._chain) {
      if (this.rig.done) {
        this._chain.shift();
        var next = this._chain[0];
        if (next) this.play(next);
        else { this._chain = null; this.play('idle'); }
      }
    } else if (this.rig.done && this.rig.action !== 'idle') {
      this.play('idle');
    }
  };

  // pop this actor airborne (dash-launcher juggle starter). Sets a vertical velocity the update loop
  // integrates against gravity, and staggers it helpless for the airtime so it can be juggled. Pure
  // feel — reuses stagger + the knockback clip; no damage/kit change. Returns false if not poppable.
  Actor.prototype.launch = function () {
    if (this.dead || this.dying) return false;
    this._vy = LAUNCH_VY; this._hop = Math.max(this._hop || 0, 0.001);
    this._airHits = 0;   // fresh juggle — reset the air-hit counter so the new launch starts clean
    this.stagger = Math.max(this.stagger || 0, (2 * LAUNCH_VY / LAUNCH_GRAV) + 0.12);
    this._chain = null; this.play('knockback');
    return true;
  };

  // AIR-HIT-CONFIRM: re-pop an ALREADY-airborne foe (the bounce-juggle). Re-adds a diminishing fraction
  // of the launch velocity (so successive bounces peak lower) and refreshes the helpless stagger to the
  // new airtime, capped by a per-actor air-hit counter. Returns false (no re-pop) if grounded, dead/dying,
  // or the juggle cap is spent — so the loop is always bounded. Pure feel: no damage/kit change.
  Actor.prototype.airHit = function () {
    if (this.dead || this.dying || !(this._hop > 0)) return false;
    if ((this._airHits || 0) >= AIR_HIT_CAP) return false;
    this._airHits = (this._airHits || 0) + 1;
    this._vy = LAUNCH_VY * AIR_HIT_VY;   // bounce back up with a diminishing pop
    this.stagger = Math.max(this.stagger || 0, (2 * this._vy / LAUNCH_GRAV) + 0.12);
    this._chain = null; this.play('knockback');
    return true;
  };

  Actor.prototype.update = function (dt) {
    if (this.dead) return;
    this.rig.update(dt);
    // KNOCKBACK SLIDE: integrate the horizontal skid hurt() seeded, decaying under friction so it
    // always settles to rest. Clamped with the same band/world x-bounds moveTo uses (depth/sort
    // untouched — this is the horizontal twin of the vertical hop). Zeroed below 1px/s. Runs even
    // while staggered/down so a knocked-down foe keeps sliding before it gets up.
    if (this._kvx) {
      this.x += this._kvx * dt;
      this._kvx -= this._kvx * KB_FRICTION * dt;
      if (Math.abs(this._kvx) < 1) this._kvx = 0;
      var _ww = (root.World && root.World.WORLD_W) || 1920;
      if (this.x < 30) { this.x = 30; this._kvx = 0; }
      if (this.x > _ww - 30) { this.x = _ww - 30; this._kvx = 0; }
    }
    // HIT-FLASH: while the flash clock runs, paint the silhouette solid white; restore neutral
    // (tintFill off, tint white = no multiply) the frame it expires. Holds through the death frame.
    if (this.rope && this.flash > 0) {
      this.flash -= dt;
      if (this.flash > 0) { this.rope.tintFill = true; this.rope.tint = 0xffffff; }
      else { this.flash = 0; this.rope.tintFill = false; this.rope.tint = 0xffffff; }
    }
    // finalize a death once the 'die' one-shot has played out
    if (this.dying && this.rig.done) { this.dead = true; if (this.rope) this.rope.setVisible(false); if (this.shadow) this.shadow.setVisible(false); return; }
    var pts = this.rig.ropePoints(), w = this.box.w;
    var rp = this.rope.points;
    for (var i = 0; i < rp.length && i < pts.length; i++) {
      rp[i].x = (pts[i].x - w / 2) * this.facing;
      rp[i].y = pts[i].y;
    }
    // SQUASH-ON-HIT envelope: e decays 1->0 over SQUASH_SECS, so the pop is hardest at the
    // connect frame and springs back. sx>1 / sy<1 = squashed flat; clamp guarantees a big dt can
    // never leave a sprite stuck deformed. rope.y subtracts h*sy so the FEET stay planted at
    // `depth` (origin is top, 0.5,0) — the body recoils down into the ground, DC style.
    var sx = 1, sy = 1;
    if (this.squash > 0) {
      this.squash -= dt;
      if (this.squash < 0) this.squash = 0;
      var e = this.squash / SQUASH_SECS;     // 1 at impact -> 0 settled
      sx = 1 + SQUASH_AMP * e;
      sy = 1 - SQUASH_AMP * e;
    }
    // DASH-LAUNCHER airborne arc: integrate the vertical hop against gravity. _hop is height above
    // the ground; while aloft the rope lifts by _hop (depth/sorting unchanged). Clamped + zeroed on
    // landing so a huge dt can never leave an actor stuck in the air.
    if (this._vy || this._hop > 0) {
      this._vy -= LAUNCH_GRAV * dt;
      this._hop = (this._hop || 0) + this._vy * dt;
      if (this._hop <= 0) {
        // GROUND-BOUNCE / OTG SPLAT: a juggled foe finally slams down. Punctuate the end of the
        // juggle with a feet-anchored squash recoil (reuses the existing squash envelope) + a
        // one-shot `_landSplat` signal that main.js reads to spray a low dust fx.burst, then clears.
        // Only fires on a genuine fall (_vy<0 = coming down), never the launch frame. Pure feel:
        // no damage/reach/kit/economy change — the kinematics were already resolved by launch/airHit.
        if (this._vy < 0) { this._landSplat = true; this.squash = SQUASH_SECS; }
        this._hop = 0; this._vy = 0; this._airHits = 0;   // grounded -> juggle count clears
      }
      else if (this._hop > 400) this._hop = 400;
    }
    this.rope.scaleX = sx; this.rope.scaleY = sy;
    this.rope.x = this.x; this.rope.y = this.depth - this.h * sy - (this._hop || 0);
    this.rope.setDepth(this.depth);     // depth-sort by ground y (front draws over back)
    this.rope.setDirty();
    // GROUND DROP-SHADOW: pin it to the FEET (x, ground depth) — never lifted by the hop — and
    // shrink + fade it the higher the actor floats, so the airborne juggle reads against a planted
    // contact. Re-sorted to this.depth-1 each frame so it tracks the actor's y-sort just underneath.
    if (this.shadow) {
      var hop = this._hop || 0;
      var k = hop > 0 ? Math.max(SHADOW_MIN, 1 - hop / SHADOW_FALL) : 1;
      this.shadow.x = this.x; this.shadow.y = this.depth;
      this.shadow.setScale(k, k);
      this.shadow.setAlpha(SHADOW_A * (hop > 0 ? 0.7 : 1));
      this.shadow.setDepth(this.depth - 1);
    }
  };

  Actor.prototype.audit = function () {
    var s = this.rig.animState();
    return { type: this.type, action: s.action, anim: { rigged: s.rigged, frames: s.frames } };
  };

  root.Actor = Actor;
})(typeof window !== 'undefined' ? window : globalThis);
