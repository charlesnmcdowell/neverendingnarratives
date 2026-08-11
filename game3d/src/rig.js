/* rig.js — procedural 2D skeletal / mesh-deform rig for the Sorcerer-Sword 2.5D uplift.
 * Dragon's-Crown technique: animate ONE still per entity via bones + a vertical mesh-deform.
 * No Spine / DragonBones / paid tools. Renderer-agnostic core; optional Phaser rope binding.
 * Owned by the game3d-anim schedule. Do NOT edit arena.html from here.
 *
 * Public API (also on window for the browser):
 *   Rig.createRig(spriteKey, bodyPlan, rigJson) -> rig
 *   rig.play(action [,opts])      // 'idle','walkF','walkB','attack','hurt','cast','summon', summon attacks, transform/spawn/die/block/victory
 *   rig.update(dt)                // dt in seconds
 *   rig.animState()               // { rigged:true, frames:<keypose count>, action:<current> }
 *   rig.poseBones()               // [{name,parent,x,y,angle}] world transforms (sprite-local px after layout)
 *   rig.ropePoints(n)             // n vertical control points for a Phaser Rope (single-still deform)
 *   rig.layout(bbox)              // {x,y,w,h} place the skeleton from a sprite bbox (auto-fit)
 *   window.__riggedEntities()     // map of registered rigs -> animState (coverage telemetry)
 */
(function (root) {
  'use strict';

  var TAU = Math.PI * 2;
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }

  /* ---- Body-plan templates -------------------------------------------------
   * Bones in NORMALIZED sprite space: x 0..1 (left->right), y 0..1 (top->bottom).
   * `rest` = joint pivot at rest. Templates auto-fit any sprite via layout(bbox). */
  var BIPED_BONES = [
    { name: 'hips',  parent: null,    x: 0.50, y: 0.60 },
    { name: 'spine', parent: 'hips',  x: 0.50, y: 0.44 },
    { name: 'chest', parent: 'spine', x: 0.50, y: 0.30 },
    { name: 'head',  parent: 'chest', x: 0.50, y: 0.14 },
    { name: 'armL',  parent: 'chest', x: 0.38, y: 0.33 },
    { name: 'handL', parent: 'armL',  x: 0.30, y: 0.52 },
    { name: 'armR',  parent: 'chest', x: 0.62, y: 0.33 },
    { name: 'handR', parent: 'armR',  x: 0.70, y: 0.52 },
    { name: 'legL',  parent: 'hips',  x: 0.43, y: 0.62 },
    { name: 'footL', parent: 'legL',  x: 0.42, y: 0.96 },
    { name: 'legR',  parent: 'hips',  x: 0.57, y: 0.62 },
    { name: 'footR', parent: 'legR',  x: 0.58, y: 0.96 }
  ];
  var WING_BONES = [
    { name: 'wingL', parent: 'chest', x: 0.30, y: 0.28 },
    { name: 'wingR', parent: 'chest', x: 0.70, y: 0.28 }
  ];
  var BODY_PLANS = {
    BIPED:     { spine: ['hips', 'spine', 'chest', 'head'], bones: BIPED_BONES, strips: 16 },
    WINGED:    { spine: ['hips', 'spine', 'chest', 'head'], bones: BIPED_BONES.concat(WING_BONES), strips: 16 },
    QUADRUPED: { spine: ['hips', 'spine', 'chest', 'head'], bones: [
        { name: 'hips',  parent: null,    x: 0.72, y: 0.55 },
        { name: 'spine', parent: 'hips',  x: 0.50, y: 0.50 },
        { name: 'chest', parent: 'spine', x: 0.30, y: 0.50 },
        { name: 'head',  parent: 'chest', x: 0.14, y: 0.42 },
        { name: 'legFL', parent: 'chest', x: 0.28, y: 0.95 },
        { name: 'legFR', parent: 'chest', x: 0.34, y: 0.95 },
        { name: 'legHL', parent: 'hips',  x: 0.70, y: 0.95 },
        { name: 'legHR', parent: 'hips',  x: 0.76, y: 0.95 }
      ], strips: 16 },
    STATIC:    { spine: ['root'], bones: [{ name: 'root', parent: null, x: 0.50, y: 0.50 }], strips: 4 }
  };

  /* ---- Parametric clip library --------------------------------------------
   * Each clip is f(phase, amp) -> { bend, bob, lean, breath, rot:{bone:rad}, keys:<n> }.
   * `bend` shears the spine column (Dragon's-Crown sway). One clip drives every biped. */
  var CLIPS = {
    idle: function (p) {
      var b = Math.sin(p * TAU) * 0.5 + 0.5;        // breathing
      return { keys: 4, breath: b * 0.012, bob: -b * 0.010, lean: 0, bend: Math.sin(p * TAU) * 0.012,
        rot: { armL: Math.sin(p * TAU) * 0.04, armR: -Math.sin(p * TAU) * 0.04, head: Math.sin(p * TAU) * 0.02 } };
    },
    walkF: function (p) {
      var s = Math.sin(p * TAU), c = Math.cos(p * TAU);
      // biped legs/arms + quadruped diagonal gait (extra bone keys are ignored by other plans)
      return { keys: 8, breath: 0, bob: -Math.abs(c) * 0.04, lean: 0.05, bend: s * 0.05,
        rot: { legL: s * 0.6, legR: -s * 0.6, footL: s * 0.3, footR: -s * 0.3,
               armL: -s * 0.5, armR: s * 0.5, chest: -0.03,
               legFL: s * 0.5, legFR: -s * 0.5, legHL: -s * 0.5, legHR: s * 0.5 } };
    },
    walkB: function (p) {                              // reverse + backward lean
      var s = Math.sin(p * TAU), c = Math.cos(p * TAU);
      return { keys: 8, breath: 0, bob: -Math.abs(c) * 0.04, lean: -0.06, bend: -s * 0.05,
        rot: { legL: -s * 0.5, legR: s * 0.5, footL: -s * 0.25, footR: s * 0.25,
               armL: s * 0.4, armR: -s * 0.4, chest: 0.03,
               legFL: -s * 0.5, legFR: s * 0.5, legHL: s * 0.5, legHR: -s * 0.5 } };
    },
    attack: function (p) {                             // windup -> contact -> recover
      var a;
      if (p < 0.30) a = -lerp(0, 0.9, p / 0.30);                 // windup back
      else if (p < 0.45) a = lerp(-0.9, 1.3, (p - 0.30) / 0.15); // contact swing
      else a = lerp(1.3, 0, clamp01((p - 0.45) / 0.55));         // recover
      return { keys: 5, breath: 0, bob: 0, lean: a * 0.10, bend: a * 0.08,
        rot: { armR: a, handR: a * 0.6, chest: a * 0.10, hips: a * 0.04 } };
    },
    hurt: function (p) {
      var k = Math.exp(-p * 5) * Math.sin(p * TAU * 3);
      return { keys: 3, breath: 0, bob: k * 0.02, lean: -k * 0.12, bend: -k * 0.10,
        rot: { chest: -k * 0.12, head: -k * 0.10 } };
    },
    cast: function (p) {                               // warlock: raise + hold + release
      var up = p < 0.5 ? lerp(0, 1, p / 0.5) : lerp(1, 0.2, (p - 0.5) / 0.5);
      return { keys: 5, breath: 0, bob: -up * 0.03, lean: 0, bend: 0,
        rot: { armL: -up * 1.1, armR: -up * 1.1, handL: -up * 0.5, handR: -up * 0.5, head: -up * 0.12 } };
    },
    summon: function (p) {                             // sweeping conjure
      var w = Math.sin(p * Math.PI);
      return { keys: 5, breath: 0, bob: -w * 0.02, lean: w * 0.05, bend: Math.sin(p * TAU) * 0.06,
        rot: { armR: -w * 1.2, handR: Math.sin(p * TAU) * 0.6, chest: w * 0.08 } };
    },
    // per-summon attack clips (aliases tuned per body part)
    fireballCast: function (p) { return CLIPS.cast(p); },
    breath: function (p) {                              // dragon breath: head dips, jaw forward
      var w = p < 0.4 ? lerp(0, 1, p / 0.4) : 1;
      return { keys: 4, breath: 0, bob: 0, lean: w * 0.08, bend: w * 0.04,
        rot: { head: w * 0.25, chest: w * 0.06 } };
    },
    clawSwipe: function (p) {                           // claw: fast horizontal rake (biped + quadruped foreleg)
      var a = p < 0.35 ? lerp(0, -0.7, p / 0.35) : lerp(-0.7, 1.1, clamp01((p - 0.35) / 0.65));
      return { keys: 4, breath: 0, bob: 0, lean: a * 0.10, bend: a * 0.06,
        rot: { armR: a, handR: a * 0.8, armL: a * 0.4, legFR: a * 0.8, legFL: a * 0.4 } };
    },
    draw: function (p) {                                // archer draw + loose
      var d = p < 0.7 ? lerp(0, 1, p / 0.7) : lerp(1, 0, (p - 0.7) / 0.3);
      return { keys: 4, breath: 0, bob: 0, lean: -d * 0.04, bend: -d * 0.03,  // brace back as the draw loads
        rot: { armL: -0.5, armR: -0.3 + d * 0.5, handR: d * 0.8 } };
    },
    // ---- universal full-coverage clips (HIRO FEEDBACK #11) -------------------
    transform: function (p) {                           // warlock morph: gather -> burst -> settle
      var bob, bend, arm;
      if (p < 0.40) { var u = p / 0.40; bob = u * 0.05; bend = Math.sin(u * TAU * 2) * 0.02; arm = -u * 0.3; }
      else if (p < 0.60) { var u2 = (p - 0.40) / 0.20; bob = lerp(0.05, -0.12, u2); bend = 0; arm = lerp(-0.3, -1.6, u2); }
      else { var u3 = (p - 0.60) / 0.40; bob = lerp(-0.12, 0, u3); bend = Math.sin(u3 * Math.PI) * 0.03; arm = lerp(-1.6, 0, u3); }
      return { keys: 6, breath: 0, bob: bob, lean: 0, bend: bend,
        rot: { armL: arm, armR: arm, head: arm * 0.15, chest: bob * 0.6 } };
    },
    spawn: function (p) {                               // summon appears: rise + pop
      var u = p < 0.6 ? clamp01(p / 0.6) : 1;
      var pop = p < 0.6 ? 0 : Math.sin((p - 0.6) / 0.4 * Math.PI) * 0.03;
      return { keys: 4, breath: 0, bob: -u * 0.05 + pop, lean: 0, bend: Math.sin(p * TAU) * 0.03 * (1 - u),
        rot: { armL: -(1 - u) * 0.4, armR: -(1 - u) * 0.4, head: (1 - u) * 0.2,
               legFL: -(1 - u) * 0.3, legFR: -(1 - u) * 0.3 } };
    },
    die: function (p) {                                 // collapse into a heap
      var f = p < 0.5 ? lerp(0, 1, p / 0.5) : 1;
      return { keys: 4, breath: 0, bob: f * 0.06, lean: -f * 0.20, bend: -f * 0.18,
        rot: { chest: -f * 0.4, head: -f * 0.5, armL: f * 0.3, armR: f * 0.3, hips: -f * 0.2,
               legFL: f * 0.3, legHL: f * 0.3 } };
    },
    block: function (p) {                                // raise guard, brace back, hold, settle
      var g = p < 0.25 ? lerp(0, 1, p / 0.25) : (p < 0.75 ? 1 : lerp(1, 0.3, (p - 0.75) / 0.25));
      var j = Math.exp(-p * 6) * Math.sin(p * TAU * 4) * 0.4;   // small impact jitter on guard-up
      return { keys: 4, breath: 0, bob: -g * 0.01, lean: -g * 0.06 + j * 0.02, bend: -g * 0.05 + j * 0.02,
        rot: { armL: -g * 1.0, armR: -g * 0.7, handL: -g * 0.5, handR: -g * 0.4, chest: -g * 0.08, head: -g * 0.05 } };
    },
    victory: function (p) {                              // arms up, triumphant bob
      var u = p < 0.35 ? lerp(0, 1, p / 0.35) : 1;
      var cheer = Math.sin(p * TAU * 2) * 0.5 + 0.5;     // double pump while held
      return { keys: 5, breath: 0, bob: -u * 0.04 - cheer * 0.02, lean: 0, bend: Math.sin(p * TAU) * 0.03,
        rot: { armL: -u * (1.4 + cheer * 0.2), armR: -u * (1.4 + cheer * 0.2),
               handL: -u * 0.6, handR: -u * 0.6, head: u * 0.08, chest: -u * 0.05 } };
    },
    // ---- locomotion + hit-reaction chain (DC brawler verbs) -----------------
    run: function (p) {                                 // faster, longer-stride gait (dash/charge)
      var s = Math.sin(p * TAU), c = Math.cos(p * TAU);
      return { keys: 8, breath: 0, bob: -Math.abs(c) * 0.06, lean: 0.10, bend: s * 0.07,
        rot: { legL: s * 0.9, legR: -s * 0.9, footL: s * 0.45, footR: -s * 0.45,
               armL: -s * 0.8, armR: s * 0.8, chest: -0.06, head: -0.03,
               legFL: s * 0.75, legFR: -s * 0.75, legHL: -s * 0.75, legHR: s * 0.75 } };
    },
    knockback: function (p) {                           // launched off feet: impact spike -> airborne tumble back
      var imp = Math.exp(-p * 4);                        // sharp hit decays
      var rise = Math.sin(clamp01(p / 0.6) * Math.PI);   // airborne arc up then back down
      return { keys: 5, breath: 0, bob: rise * 0.10, lean: -(0.10 + imp * 0.25), bend: -(0.08 + imp * 0.10),
        rot: { chest: -(0.2 + imp * 0.3), head: -(0.25 + imp * 0.2), hips: 0.15 * rise,
               armL: 0.4 * imp + 0.2, armR: 0.4 * imp + 0.2,
               legL: -0.3 * rise, legR: -0.4 * rise, legFL: -0.3 * rise, legFR: -0.4 * rise } };
    },
    knockdown: function (p) {                           // slam to the ground, end prone
      var f = p < 0.45 ? lerp(0, 1, p / 0.45) : 1;       // drop + rotate flat
      var bounce = (p > 0.45 && p < 0.65) ? Math.sin((p - 0.45) / 0.20 * Math.PI) * 0.03 : 0;
      return { keys: 5, breath: 0, bob: -f * 0.10 + bounce, lean: -f * 0.28, bend: -f * 0.22,
        rot: { chest: -f * 0.5, head: -f * 0.6, hips: -f * 0.3, armL: f * 0.5, armR: f * 0.4,
               legL: f * 0.4, legR: f * 0.4, legFL: f * 0.4, legFR: f * 0.4, legHL: f * 0.3, legHR: f * 0.3 } };
    },
    getup: function (p) {                               // rise from prone back to stance (reverse of knockdown)
      var d = 1 - clamp01(p);                            // 1 = down, 0 = standing
      var push = (p > 0.3 && p < 0.6) ? Math.sin((p - 0.3) / 0.30 * Math.PI) * 0.04 : 0;  // hands-push hitch
      return { keys: 5, breath: 0, bob: -d * 0.10 + push, lean: -d * 0.20, bend: -d * 0.16,
        rot: { chest: -d * 0.45, head: -d * 0.5, hips: -d * 0.25, armL: d * 0.5 + push * 2, armR: d * 0.4,
               legL: d * 0.35, legR: d * 0.35, legFL: d * 0.35, legHL: d * 0.2 } };
    }
  };
  CLIPS.loose = CLIPS.draw;

  // Per-clip default loop seconds
  var CLIP_SECS = { idle: 2.6, walkF: 0.7, walkB: 0.7, attack: 0.55, hurt: 0.45,
    cast: 1.0, summon: 0.9, fireballCast: 1.0, breath: 1.1, clawSwipe: 0.5, draw: 0.9, loose: 0.9,
    transform: 1.2, spawn: 0.7, die: 1.0, block: 0.8, victory: 1.4,
    run: 0.55, knockback: 0.5, knockdown: 0.7, getup: 0.8 };

  // ---- Registry for coverage telemetry -------------------------------------
  var REGISTRY = {};

  function Rig(spriteKey, bodyPlan, rigJson) {
    this.key = spriteKey || 'unknown';
    this.plan = BODY_PLANS[bodyPlan] || BODY_PLANS.BIPED;
    this.planName = BODY_PLANS[bodyPlan] ? bodyPlan : 'BIPED';
    // clone template bones, apply any rigJson overrides
    var over = (rigJson && rigJson.bones) || {};
    this.bones = this.plan.bones.map(function (b) {
      var o = over[b.name] || {};
      return { name: b.name, parent: b.parent, x: (o.x != null ? o.x : b.x), y: (o.y != null ? o.y : b.y), angle: 0 };
    });
    this.byName = {};
    for (var i = 0; i < this.bones.length; i++) this.byName[this.bones[i].name] = this.bones[i];
    this.box = { x: 0, y: 0, w: 1, h: 1 };
    this.action = 'idle';
    this.t = 0;                 // phase 0..1
    this.loop = true;
    this.done = false;
    REGISTRY[this.key] = this;
  }

  // place skeleton from a sprite bbox {x,y,w,h} in pixels (auto-fit)
  Rig.prototype.layout = function (bbox) { if (bbox) this.box = bbox; return this; };

  Rig.prototype.play = function (action, opts) {
    if (!CLIPS[action]) action = 'idle';
    if (this.action !== action) { this.action = action; this.t = 0; this.done = false; }
    opts = opts || {};
    this.loop = (opts.loop != null) ? opts.loop : !(action === 'attack' || action === 'hurt' ||
      action === 'cast' || action === 'summon' || action === 'fireballCast' ||
      action === 'clawSwipe' || action === 'draw' || action === 'loose' || action === 'breath' ||
      action === 'transform' || action === 'spawn' || action === 'die' ||
      action === 'block' || action === 'victory' ||
      action === 'knockback' || action === 'knockdown' || action === 'getup');
    // note: 'run' is a looping locomotion clip (like walk), so it stays looped
    return this;
  };

  Rig.prototype.update = function (dt) {
    var secs = CLIP_SECS[this.action] || 1;
    this.t += (dt || 0) / secs;
    if (this.t >= 1) {
      if (this.loop) this.t %= 1;
      else { this.t = 1; this.done = true; }
    }
    return this;
  };

  Rig.prototype.animState = function () {
    var clip = CLIPS[this.action] || CLIPS.idle;
    var f = clip(this.t) || {};
    return { rigged: true, frames: f.keys || 4, action: this.action, plan: this.planName, done: this.done };
  };

  // forward-kinematics: world transform of every bone in sprite-local pixels
  Rig.prototype.poseBones = function () {
    var clip = CLIPS[this.action] || CLIPS.idle;
    var f = clip(this.t) || { rot: {} };
    var rot = f.rot || {};
    var box = this.box, out = [], cache = {};
    var lean = (f.lean || 0), bob = (f.bob || 0), breath = (f.breath || 0);
    for (var i = 0; i < this.bones.length; i++) {
      var b = this.bones[i];
      var px = box.x + b.x * box.w;
      var py = box.y + (b.y - bob - (b.y > 0.5 ? 0 : breath)) * box.h;
      px += lean * box.w * (1 - b.y);          // lean: top of body drifts
      var node = { name: b.name, parent: b.parent, x: px, y: py, angle: rot[b.name] || 0 };
      // apply parent angle as a simple rotation of this joint about the parent pivot
      if (b.parent && cache[b.parent]) {
        var par = cache[b.parent];
        var a = par.angle;
        if (a) {
          var dx = node.x - par.x, dy = node.y - par.y;
          node.x = par.x + dx * Math.cos(a) - dy * Math.sin(a);
          node.y = par.y + dx * Math.sin(a) + dy * Math.cos(a);
        }
        node.angle += par.angle;
      }
      cache[b.name] = node;
      out.push(node);
    }
    return out;
  };

  // vertical control points for a Phaser Rope (single-still spine deform).
  // returns n points top->bottom in sprite-local px; x carries bend/sway, y carries bob/breath.
  Rig.prototype.ropePoints = function (n) {
    n = n || this.plan.strips;
    var clip = CLIPS[this.action] || CLIPS.idle;
    var f = clip(this.t) || {};
    var bend = (f.bend || 0), lean = (f.lean || 0), bob = (f.bob || 0), breath = (f.breath || 0);
    var box = this.box, pts = [];
    for (var i = 0; i < n; i++) {
      var v = i / (n - 1);                     // 0 = top(head), 1 = bottom(feet)
      var topInfluence = 1 - v;                // bend/lean act most on upper body
      var sx = box.x + box.w * 0.5
             + Math.sin(v * Math.PI) * bend * box.w   // C-curve spine bend
             + lean * box.w * topInfluence;
      var sy = box.y + v * box.h * (1 - breath * (1 - v)) - bob * box.h * topInfluence;
      pts.push({ x: sx, y: sy });
    }
    return pts;
  };

  function createRig(spriteKey, bodyPlan, rigJson) { return new Rig(spriteKey, bodyPlan, rigJson); }

  function riggedEntities() {
    var out = {};
    for (var k in REGISTRY) if (REGISTRY.hasOwnProperty(k)) out[k] = REGISTRY[k].animState();
    return out;
  }

  var Rig_NS = { createRig: createRig, BODY_PLANS: BODY_PLANS, CLIPS: CLIPS, riggedEntities: riggedEntities };
  if (typeof module !== 'undefined' && module.exports) module.exports = Rig_NS;
  root.Rig = Rig_NS;
  root.__riggedEntities = riggedEntities;
})(typeof window !== 'undefined' ? window : globalThis);
