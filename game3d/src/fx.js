/* fx.js — projectile + impact VFX for the beat-em-up (Dragon's-Crown additive fire).
 * Owned by game3d-build. Pure motion + drawing; the game RULES (collision,
 * AoE damage, fire DoT, succubus fire-heal, kill credit) live in main.js so this
 * module stays dumb and reusable. Bolts are drawn ADDITIVE so they glow like the
 * generated fireball/fireball_hit art will once it lands (placeholder glow today).
 *
 * API:
 *   FX.create(scene) -> {
 *     bolts:[], flashes:[],
 *     fire(o)        push a traveling bolt {x,depth,vx,vy,...}
 *     burst(x,depth,color,r)  spawn an expanding hit flash
 *     move(dt)       advance bolts + age flashes (no collision here)
 *     draw()         render all live bolts + flashes additively
 *   }
 *
 * bolt = { x, depth, vx, vy, life, team, dmg, type, owner, r, color, dead }
 */
(function (root) {
  'use strict';

  function create(scene) {
    var g = scene.add.graphics().setDepth(9500);
    g.blendMode = (root.Phaser && Phaser.BlendModes && Phaser.BlendModes.ADD) || 1;
    // ground-zone layer (lingering acid/gas clouds): NORMAL blend, drawn BELOW the
    // actors so the cloud reads as murky vapor on the floor that units stand inside.
    var gz = scene.add.graphics().setDepth(60);

    var mgr = {
      scene: scene, g: g, gz: gz, bolts: [], flashes: [], zones: [], popups: [],

      fire: function (o) {
        o.r = o.r || 11;
        o.life = o.life != null ? o.life : 1.4;
        o.color = o.color || 0xff7a3c;
        o.dead = false;
        this.bolts.push(o);
        return o;
      },

      burst: function (x, depth, color, r) {
        this.flashes.push({ x: x, depth: depth, color: color || 0xffae5a,
          r: r || 30, life: 0.32, max: 0.32 });
      },

      // floating DAMAGE NUMBER (Dragon's-Crown "score juice", pit.js popup()). Spawns
      // a real Phaser text game-object that rises + fades; it draws itself (NOT via the
      // graphics layers), so draw() stays graphics-only. color = CSS string, size = px.
      // crit=true gives a heavy blow a brief scale-PUNCH (1.7 -> 1.0 over .18s) + a
      // decaying horizontal SHAKE so a launcher reads bigger than a chip (move() drives it).
      popup: function (x, depth, text, color, size, crit) {
        if (!this.scene.add || !this.scene.add.text) return null;   // headless guard
        var t = this.scene.add.text(x, depth, '' + text, {
          fontFamily: 'Georgia, serif', fontSize: Math.round(size || 18) + 'px',
          color: color || '#ffffff', stroke: '#000000', strokeThickness: 4,
          fontStyle: 'bold'
        }).setOrigin(0.5, 1).setDepth(9650);
        if (crit && t.setScale) t.setScale(1.7);                    // pre-punch frame 1
        var e = { t: t, x: x, y: depth, vy: 52, rise: 0, life: 0.72, max: 0.72,
          jitter: (Math.random() * 16 - 8), crit: !!crit, dead: false };
        this.popups.push(e);
        return e;
      },

      // a persistent ground cloud (dragon acid/gas breath, pit.js `zones`). Game
      // rules (paralysis + acid DoT) live in main.js; this only telegraphs, ages,
      // and draws the murky vapor. tele>0 = warning ring; then it's live for `life`.
      zone: function (o) {
        o.r = o.r || 96;
        o.life = o.life != null ? o.life : 4.2;
        o.max = o.life;
        o.tele = o.tele || 0; o.teleMax = o.teleMax || o.tele || 0.0001;
        o.seed = Math.random() * 6.28;
        o.dead = false;
        o.color = o.color || 0x7fd05a;
        this.zones.push(o);
        return o;
      },

      // advance bolts + age flashes. collision/expiry handled by the caller,
      // which sets bolt.dead = true; we cull dead bolts here.
      move: function (dt) {
        var b = this.bolts, i;
        for (i = 0; i < b.length; i++) {
          var p = b[i];
          p.x += p.vx * dt; p.depth += p.vy * dt;
          p.life -= dt;
          if (p.life <= 0) p.dead = true;
        }
        for (i = b.length - 1; i >= 0; i--) if (b[i].dead) b.splice(i, 1);
        var f = this.flashes;
        for (i = f.length - 1; i >= 0; i--) {
          f[i].life -= dt;
          if (f[i].life <= 0) f.splice(i, 1);
        }
        // age floating damage numbers: rise (decelerating) + fade, then destroy the text.
        var pp = this.popups;
        for (i = 0; i < pp.length; i++) {
          var e = pp[i];
          e.life -= dt;
          e.rise += e.vy * dt; e.vy *= 0.90;                 // ease-out the climb
          if (e.t) {
            var sx = e.x + e.jitter * (1 - e.life / e.max);
            if (e.crit) {                                    // heavy-blow emphasis
              var k = Math.min(1, (e.max - e.life) / 0.18);  // 0 -> 1 over first .18s
              if (e.t.setScale) e.t.setScale(1.7 - 0.7 * k); // scale-PUNCH 1.7 -> 1.0
              sx += (1 - k) * 6 * Math.sin((e.max - e.life) * 64); // decaying SHAKE
            }
            e.t.setPosition(sx, e.y - e.rise);
            e.t.setAlpha(Math.max(0, Math.min(1, e.life / e.max + 0.15)));
          }
          if (e.life <= 0) e.dead = true;
        }
        for (i = pp.length - 1; i >= 0; i--) {
          if (pp[i].dead) { if (pp[i].t) pp[i].t.destroy(); pp.splice(i, 1); }
        }
        // age ground zones: burn down the telegraph first, then the live cloud.
        var z = this.zones;
        for (i = 0; i < z.length; i++) {
          var zo = z[i];
          if (zo.tele > 0) zo.tele = Math.max(0, zo.tele - dt);
          else { zo.life -= dt; if (zo.life <= 0) zo.dead = true; }
        }
        for (i = z.length - 1; i >= 0; i--) if (z[i].dead) z.splice(i, 1);
      },

      draw: function () {
        this.drawZones();   // murky ground vapor first (its own normal-blend layer)
        var g = this.g; g.clear();
        var i, p;
        // traveling bolts: bright core + soft outer glow (additive)
        for (i = 0; i < this.bolts.length; i++) {
          p = this.bolts[i];
          g.fillStyle(p.color, 0.30); g.fillCircle(p.x, p.depth, p.r * 1.9);
          g.fillStyle(p.color, 0.55); g.fillCircle(p.x, p.depth, p.r * 1.15);
          g.fillStyle(0xffffff, 0.85); g.fillCircle(p.x, p.depth, p.r * 0.5);
        }
        // impact flashes: expanding fading ring of light
        for (i = 0; i < this.flashes.length; i++) {
          var fl = this.flashes[i], t = fl.life / fl.max;   // 1 -> 0
          var rr = fl.r * (1.25 - t * 0.6);
          g.fillStyle(fl.color, 0.45 * t); g.fillCircle(fl.x, fl.depth, rr);
          g.fillStyle(0xffffff, 0.55 * t); g.fillCircle(fl.x, fl.depth, rr * 0.45);
        }
      },

      // ground zones: flattened ground ellipses (depth perspective ~0.55) on the
      // normal-blend layer below actors. Telegraph = a pulsing warning ring; live =
      // layered murky vapor that swells in and fades out over its lifetime.
      drawZones: function () {
        var gz = this.gz; gz.clear();
        var now = (this.scene.time && this.scene.time.now) || (Date.now());
        for (var i = 0; i < this.zones.length; i++) {
          var z = this.zones[i], rx = z.r, ry = z.r * 0.55;
          if (z.tele > 0) {                                   // warning ring
            var pulse = 0.45 + 0.35 * Math.sin(now / 90 + z.seed);
            gz.lineStyle(2, z.color, pulse);
            gz.strokeEllipse(z.x, z.depth, rx * 2, ry * 2);
            gz.fillStyle(z.color, 0.06);
            gz.fillEllipse(z.x, z.depth, rx * 2, ry * 2);
            continue;
          }
          var lifeT = Math.max(0, Math.min(1, z.life / z.max));  // 1 -> 0
          var grow = z.life > z.max - 0.35 ? (z.max - z.life) / 0.35 : 1; // quick swell-in
          var a = 0.30 * lifeT * grow;
          var s = grow;
          gz.fillStyle(z.color, a * 0.55); gz.fillEllipse(z.x, z.depth, rx * 2 * s, ry * 2 * s);
          gz.fillStyle(z.color, a);        gz.fillEllipse(z.x, z.depth, rx * 1.45 * s, ry * 1.45 * s);
          // a couple of drifting wisps so the vapor churns
          var w1 = Math.sin(now / 260 + z.seed) * rx * 0.3;
          var w2 = Math.cos(now / 200 + z.seed) * rx * 0.3;
          gz.fillStyle(z.color, a * 0.8); gz.fillEllipse(z.x + w1, z.depth - ry * 0.2, rx * 0.7 * s, ry * 0.7 * s);
          gz.fillStyle(0xffffff, a * 0.10); gz.fillEllipse(z.x + w2, z.depth, rx * 0.5 * s, ry * 0.5 * s);
        }
      }
    };
    return mgr;
  }

  root.FX = { create: create };
})(typeof window !== 'undefined' ? window : globalThis);
