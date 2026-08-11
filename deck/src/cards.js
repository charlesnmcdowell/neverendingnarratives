/* cards.js — the warlock card pool: data + per-card choreography.
   Every card owns a full animation; nothing resolves as a silent stat change.
   ctx.react(kind) resolves per-enemy: bespoke sheet if the enemy has one, else its hurt anim.
   rarity: "starter" cards can't appear as rewards; common/uncommon/rare weight the reward pool. */
window.Spire = window.Spire || {};

const W = Spire.wait, T = Spire.tween, P = Spire.play;

Spire.CARDS = {
  /* ===================== STARTING SET ===================== */
  shadowbolt: {
    name: "Shadow Bolt", cost: 1, type: "Attack", art: "fx_hexbolt_3", rarity: "starter",
    desc: "Deal 7 damage.", flavor: "She barely looks up.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_cast"); await W(s, 260);
      await ctx.bolt("fx_hexbolt", ctx.wlX + 90, ctx.groundY - 190, ctx.hdX - 30, ctx.groundY - 95, { dur: 340 });
      ctx.impact(ctx.hdX - 20, ctx.groundY - 100, 0xaa66ff);
      ctx.applyHit(7); ctx.shake(4);
      await ctx.react("hexhit");
      await ctx.wlIdle();
    }
  },
  umbralward: {
    name: "Umbral Ward", cost: 1, type: "Skill", art: "fx_wardaura_3", rarity: "starter",
    desc: "Gain 6 Block.", flavor: "The dark answers to her.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_portal"); await W(s, 300);
      const aura = Spire.spawn(s, "fx_wardaura", ctx.wlX, ctx.groundY + 8, { depth: 9, height: 340 });
      aura.setAlpha(0);
      T(s, { targets: aura, alpha: 0.95, duration: 180 });
      ctx.applyBlock(6);
      await W(s, 750);
      await T(s, { targets: aura, alpha: 0, duration: 260 }); aura.destroy();
      await ctx.wlIdle();
    }
  },
  hexfrailty: {
    name: "Hex of Frailty", cost: 1, type: "Skill", art: "fx_greenbolt_3", rarity: "starter",
    desc: "Apply 2 Weak.\n(Weakened foes deal 25% less.)", flavor: "“Kneel. It suits you.”",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_cast"); await W(s, 260);
      await ctx.bolt("fx_greenbolt", ctx.wlX + 90, ctx.groundY - 190, ctx.hdX - 20, ctx.groundY - 90, { dur: 480, arc: 140 });
      ctx.impact(ctx.hdX - 20, ctx.groundY - 100, 0x77ff77);
      ctx.applyStatus(ctx.C.enemy, "weak", 2);
      await ctx.react("ahexhit");
      await ctx.wlIdle();
    }
  },
  shadowstep: {
    name: "Shadow Step", cost: 1, type: "Skill", art: "wl_slide_2", rarity: "starter",
    desc: "Gain 4 Block.\nDraw 1 card.", flavor: "Try to keep up.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_slide");
      const x0 = ctx.wl.x;
      for (let i = 0; i < 3; i++) ctx.afterimage(ctx.wl, 90 * i);
      await T(s, { targets: ctx.wl, x: x0 - 90, duration: 190, ease: "Cubic.easeOut" });
      ctx.applyBlock(4);
      for (let i = 0; i < 3; i++) ctx.afterimage(ctx.wl, 70 * i);
      await T(s, { targets: ctx.wl, x: x0, duration: 210, ease: "Cubic.easeInOut" });
      ctx.drawCards(1);
      await ctx.wlIdle();
    }
  },
  soulsiphon: {
    name: "Soul Siphon", cost: 2, type: "Attack", art: "fx_coldbolt_3", rarity: "starter",
    desc: "Deal 6 damage.\nHeal 4 HP.", flavor: "Yours now.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_cast"); await W(s, 260);
      await ctx.bolt("fx_hexbolt", ctx.wlX + 90, ctx.groundY - 190, ctx.hdX - 30, ctx.groundY - 95, { dur: 340, tint: 0xcc88ff });
      ctx.applyHit(6); ctx.shake(3);
      const react = ctx.react("hurt");
      for (let i = 0; i < 9; i++) {
        const m = s.add.circle(ctx.hdX - 20 + Phaser.Math.Between(-30, 30), ctx.groundY - 90 + Phaser.Math.Between(-50, 30),
                               Phaser.Math.Between(3, 6), 0xbb88ff).setDepth(15).setAlpha(0.9);
        T(s, { targets: m, x: ctx.wlX + 20, y: ctx.groundY - 170, duration: 480 + i * 55, ease: "Sine.easeIn",
               onComplete: () => m.destroy() });
        await W(s, 40);
      }
      ctx.applyHeal(4);
      await react;
      await ctx.wlIdle();
    }
  },
  pactofpain: {
    name: "Pact of Pain", cost: 0, type: "Attack", art: "fx_firebolt_2", rarity: "starter",
    desc: "Lose 2 HP.\nDeal 4 damage.", flavor: "Blood is just ink for better contracts.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_hurt");
      ctx.selfDamage(2); ctx.flash(0xff3333, 90);
      await W(s, 340);
      ctx.wl.play("a_wl_cast"); await W(s, 220);
      await ctx.bolt("fx_hexbolt", ctx.wlX + 90, ctx.groundY - 190, ctx.hdX - 30, ctx.groundY - 95, { dur: 280, tint: 0xff5555 });
      ctx.impact(ctx.hdX - 20, ctx.groundY - 100, 0xff5555);
      ctx.applyHit(4); ctx.shake(3);
      await ctx.react("hurt");
      await ctx.wlIdle();
    }
  },
  ruthlessfocus: {
    name: "Ruthless Focus", cost: 1, type: "Skill", art: "fx_lightbolt_3", rarity: "starter",
    desc: "Gain 2 Energy.\nDraw 1 card.", flavor: "Always in control.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_cast");
      const sig = Spire.spawn(s, "fx_wardaura", ctx.wlX + 60, ctx.groundY - 60, { depth: 14, height: 170, tint: 0xffcc55 });
      sig.setAlpha(0.85);
      T(s, { targets: sig, scale: sig.scale * 1.5, alpha: 0, duration: 620, onComplete: () => sig.destroy() });
      await W(s, 420);
      ctx.gainEnergy(2);
      ctx.drawCards(1);
      await ctx.wlIdle();
    }
  },
  veilofnight: {
    name: "Veil of Night", cost: 2, type: "Skill", art: "wl_portal_3", rarity: "starter",
    desc: "Gain 12 Block.", flavor: "Night is a place she keeps in her pocket.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_bigcast"); await W(s, 420);
      for (const d of [0, 220]) {
        const aura = Spire.spawn(s, "fx_wardaura", ctx.wlX, ctx.groundY + 8, { depth: 9, height: 360, tint: 0xaa66ff });
        aura.setAlpha(0);
        T(s, { targets: aura, alpha: 0.9, duration: 160 });
        s.time.delayedCall(720 + d, () => T(s, { targets: aura, alpha: 0, duration: 260, onComplete: () => aura.destroy() }));
        await W(s, d ? 0 : 220);
      }
      ctx.applyBlock(12);
      await W(s, 650);
      await ctx.wlIdle();
    }
  },

  /* ============ STARTING SUMMONS — standalone sprites, engine-sequenced ============ */
  succubus: {
    name: "Kiss of Cinders", cost: 2, type: "Attack", art: "su_idle_1", rarity: "starter",
    desc: "Summon the Succubus:\ndeal 8 damage, apply\n4 Burn.", flavor: "She tips well.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_bigcast"); await W(s, 500);
      const p1 = await ctx.portal(ctx.wlX + 200, ctx.groundY - 20);
      const su = Spire.spawn(s, "su_walk", p1.x, ctx.groundY - 8, { depth: 12 });
      su.setAlpha(0);
      T(s, { targets: su, alpha: 1, duration: 160 });
      await T(s, { targets: su, x: 610, y: ctx.groundY - 110, duration: 620, ease: "Sine.easeOut" });
      p1.close();
      su.play("a_su_fireball"); await W(s, 380);
      const fb = ctx.boltSprite("fx_fireball", su.x + 60, su.y - 90, { flipX: true });
      await T(s, { targets: fb, x: ctx.hdX - 30, y: ctx.groundY - 95, duration: 360, ease: "Sine.easeIn" });
      fb.destroy();
      ctx.impact(ctx.hdX - 20, ctx.groundY - 110, 0xffaa33);
      ctx.applySummonHit(8); ctx.applyStatus(ctx.C.enemy, "burn", 4); ctx.shake(5);
      const react = ctx.react("firehit");
      await P(su, "su_mend");
      ctx.hearts(su.x, su.y - 160);
      await P(su, "su_mend");
      await react;
      const p2 = await ctx.portal(su.x + 150, ctx.groundY - 20);
      su.setFlipX(true); su.play("a_su_walk");
      await T(s, { targets: su, x: p2.x, y: ctx.groundY - 8, alpha: 0.05, duration: 460, ease: "Sine.easeIn" });
      su.destroy(); await p2.close();
      await ctx.wlIdle();
    }
  },
  clawdemon: {
    name: "Rake of the Pit", cost: 2, type: "Attack", art: "cf_idle_3", rarity: "starter",
    desc: "Summon the Claw Demon:\ndeal 4 damage 3 times.", flavor: "Down, boy.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_bigcast"); await W(s, 500);
      const shadow = s.add.ellipse(ctx.hdX - 110, ctx.groundY - 4, 10, 5, 0x000000, 0.5).setDepth(9);
      T(s, { targets: shadow, scaleX: 14, scaleY: 5, duration: 330 });
      const cf = Spire.spawn(s, "cf_idle", ctx.hdX - 110, -60, { depth: 12 });
      await T(s, { targets: cf, y: ctx.groundY, duration: 330, ease: "Quad.easeIn" });
      ctx.dust(cf.x, ctx.groundY); ctx.shake(7); shadow.destroy();
      const react = ctx.react("clawhit");
      for (let i = 0; i < 3; i++) {
        const swing = P(cf, "cf_attack");
        await W(s, 260);
        ctx.applySummonHit(4); ctx.shake(4);
        await swing;
      }
      await react;
      const p = await ctx.portal(ctx.hdX + 190, ctx.groundY - 20);
      cf.play("a_cf_walk");
      await T(s, { targets: cf, x: p.x, duration: 420, ease: "Sine.easeIn",
                   onUpdate: (tw) => { cf.y = ctx.groundY - Math.sin(tw.progress * Math.PI) * 120; } });
      await T(s, { targets: cf, alpha: 0, duration: 120 });
      cf.destroy(); await p.close();
      await ctx.wlIdle();
    }
  },
  dragon: {
    name: "Black Sky", cost: 3, type: "Attack", art: "dr_idle_2", rarity: "starter",
    desc: "Summon the Black Dragon:\ndeal 16 damage, apply\n3 Burn.", flavor: "The sky remembers whom it belongs to.",
    async choreo(s, ctx) {
      /* 2026-08-11 (Hiro): the dragon deserves the EX treatment */
      await ctx.exCutIn("dr_fly", "B L A C K   S K Y", 0x9955ff);
      ctx.wl.play("a_wl_bigcast"); await W(s, 500);
      const dr = Spire.spawn(s, "dr_fly", -160, 300, { depth: 13 });
      await T(s, { targets: dr, x: 640, y: 310, duration: 850, ease: "Sine.easeOut" });
      dr.play("a_dr_breath");
      await W(s, 320);
      ctx.flameCone(dr.x + 90, dr.y - 70, ctx.hdX - 10, ctx.groundY - 80);
      ctx.shake(9);
      ctx.applySummonHit(16); ctx.applyStatus(ctx.C.enemy, "burn", 3);
      const react = ctx.react("fadehit", { holdLast: 500 });
      await W(s, 900);
      dr.play("a_dr_fly");
      await T(s, { targets: dr, x: 1480, y: 190, duration: 800, ease: "Sine.easeIn" });
      dr.destroy();
      await react;
      await ctx.wlIdle();
    }
  },
  shamblers: {
    name: "Grave Chorus", cost: 2, type: "Attack", art: "sh_idle_2", rarity: "starter",
    desc: "Raise 3 Shamblers:\ndeal 3 damage 4 times,\napply 1 Weak.", flavor: "Everyone she's done with, still working for her.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_bigcast"); await W(s, 500);
      const spots = [ctx.hdX - 210, ctx.hdX - 120, ctx.hdX + 170];
      const shs = [];
      for (let i = 0; i < spots.length; i++) {
        ctx.dust(spots[i], ctx.groundY);
        const sh = Spire.spawn(s, "sh_idle", spots[i], ctx.groundY, { depth: 12, flipX: spots[i] > ctx.hdX });
        sh.scaleY = 0.02;
        T(s, { targets: sh, scaleY: sh.scaleX, duration: 480, ease: "Back.easeOut" });
        shs.push(sh); await W(s, 150);
      }
      await W(s, 420);
      const tgt = [ctx.hdX - 95, ctx.hdX - 45, ctx.hdX + 85];
      shs.forEach((sh, i) => { sh.play("a_sh_walk"); T(s, { targets: sh, x: tgt[i], duration: 520, ease: "Sine.easeInOut" }); });
      await W(s, 560);
      shs.forEach(sh => sh.play("a_sh_attack"));
      for (let i = 0; i < 4; i++) {
        ctx.applySummonHit(3); ctx.blood(ctx.hdX - 20, ctx.groundY - 80); ctx.shake(3);
        if (i === 0) ctx.hd.play("a_" + ctx.prefix + "_hurt");
        await W(s, 240);
        shs.forEach(sh => { if (sh.anims && !sh.anims.isPlaying) sh.play("a_sh_attack"); });
      }
      ctx.applyStatus(ctx.C.enemy, "weak", 1);
      const react = ctx.react("scythehit", { holdLast: 300 });
      await W(s, 250);
      for (const sh of shs) {
        sh.setTint(0x777766);
        ctx.dust(sh.x, ctx.groundY, 0x998877);
        T(s, { targets: sh, alpha: 0, scaleY: sh.scaleY * 0.6, duration: 420, onComplete: () => sh.destroy() });
        await W(s, 120);
      }
      await react;
      await ctx.wlIdle();
    }
  },

  /* ===================== REWARD-ONLY CARDS (unlocked as you climb) ===================== */
  twinbolts: {
    name: "Twin Bolts", cost: 1, type: "Attack", art: "fx_hexbolt_5", rarity: "common",
    desc: "Deal 4 damage\ntwice.", flavor: "One for each of your eyes.",
    async choreo(s, ctx) {
      for (let i = 0; i < 2; i++) {
        ctx.wl.play("a_wl_cast"); await W(s, 200);
        await ctx.bolt("fx_hexbolt", ctx.wlX + 90, ctx.groundY - 190 + i * 24, ctx.hdX - 30, ctx.groundY - 95, { dur: 280 });
        ctx.impact(ctx.hdX - 20, ctx.groundY - 100, 0xaa66ff);
        ctx.applyHit(4); ctx.shake(3);
        const r = ctx.react(i === 0 ? "hurt" : "hexhit");
        if (i === 1) await r;
      }
      await ctx.wlIdle();
    }
  },
  embercoil: {
    name: "Ember Coil", cost: 1, type: "Attack", art: "fx_firebolt_3", rarity: "common",
    desc: "Deal 5 damage.\nApply 2 Burn.", flavor: "It remembers being a heart.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_cast"); await W(s, 260);
      await ctx.bolt("fx_firebolt", ctx.wlX + 90, ctx.groundY - 190, ctx.hdX - 30, ctx.groundY - 95, { dur: 340 });
      ctx.impact(ctx.hdX - 20, ctx.groundY - 100, 0xff8833);
      ctx.applyHit(5); ctx.applyStatus(ctx.C.enemy, "burn", 2); ctx.shake(4);
      await ctx.react("firehit");
      await ctx.wlIdle();
    }
  },
  bloodprice: {
    name: "Blood Price", cost: 1, type: "Attack", art: "fx_firebolt_5", rarity: "common",
    desc: "Lose 3 HP.\nDeal 9 damage.", flavor: "Everything worth having costs someone.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_hurt");
      ctx.selfDamage(3); ctx.flash(0xff3333, 110);
      await W(s, 340);
      ctx.wl.play("a_wl_cast"); await W(s, 220);
      await ctx.bolt("fx_hexbolt", ctx.wlX + 90, ctx.groundY - 190, ctx.hdX - 30, ctx.groundY - 95, { dur: 260, tint: 0xff4444 });
      ctx.impact(ctx.hdX - 20, ctx.groundY - 100, 0xff4444);
      ctx.applyHit(9); ctx.shake(6);
      await ctx.react("hexhit");
      await ctx.wlIdle();
    }
  },
  duskfang: {
    name: "Dusk Fang", cost: 0, type: "Attack", art: "wl_slide_3", rarity: "uncommon",
    desc: "Deal 3 damage.\nGain 3 Block.", flavor: "In and out before the scream.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_slide");
      const x0 = ctx.wl.x;
      for (let i = 0; i < 3; i++) ctx.afterimage(ctx.wl, 60 * i);
      await T(s, { targets: ctx.wl, x: ctx.hdX - 190, duration: 240, ease: "Cubic.easeIn" });
      ctx.impact(ctx.hdX - 60, ctx.groundY - 100, 0xbb88ff);
      ctx.applyHit(3); ctx.applyBlock(3); ctx.shake(3);
      const r = ctx.react("hurt");
      for (let i = 0; i < 3; i++) ctx.afterimage(ctx.wl, 60 * i);
      await T(s, { targets: ctx.wl, x: x0, duration: 260, ease: "Cubic.easeOut" });
      await r;
      await ctx.wlIdle();
    }
  },
  gloomnova: {
    name: "Gloom Nova", cost: 2, type: "Attack", art: "fx_coldbolt_2", rarity: "uncommon",
    desc: "Deal 9 damage.\nApply 1 Weak.", flavor: "The cold goes looking for confidence.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_bigcast"); await W(s, 420);
      const ring = s.add.circle(ctx.wlX, ctx.groundY - 140, 20).setStrokeStyle(6, 0x88ccff, 0.9).setDepth(15);
      await T(s, { targets: ring, radius: 620, alpha: 0, duration: 520, ease: "Sine.easeOut",
                   onUpdate: () => ring.setStrokeStyle(6, 0x88ccff, ring.alpha) });
      ring.destroy();
      ctx.impact(ctx.hdX - 20, ctx.groundY - 100, 0x88ccff);
      ctx.applyHit(9); ctx.applyStatus(ctx.C.enemy, "weak", 1); ctx.shake(6);
      await ctx.react("ahexhit");
      await ctx.wlIdle();
    }
  },
  hexweave: {
    name: "Hexweave", cost: 1, type: "Skill", art: "fx_greenbolt_5", rarity: "uncommon",
    desc: "Apply 2 Weak.\nDraw 1 card.", flavor: "Every thread ends in a knot around a throat.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_cast"); await W(s, 260);
      await ctx.bolt("fx_greenbolt", ctx.wlX + 90, ctx.groundY - 190, ctx.hdX - 20, ctx.groundY - 90, { dur: 420, arc: 120 });
      ctx.impact(ctx.hdX - 20, ctx.groundY - 100, 0x77ff77);
      ctx.applyStatus(ctx.C.enemy, "weak", 2);
      ctx.drawCards(1);
      await ctx.react("ahexhit");
      await ctx.wlIdle();
    }
  },
  siphonveil: {
    name: "Siphoning Veil", cost: 2, type: "Skill", art: "fx_wardaura_5", rarity: "uncommon",
    desc: "Gain 8 Block.\nHeal 3 HP.", flavor: "The Pit gives back, if you know how to take.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_portal"); await W(s, 300);
      const aura = Spire.spawn(s, "fx_wardaura", ctx.wlX, ctx.groundY + 8, { depth: 9, height: 350, tint: 0x99ffcc });
      aura.setAlpha(0);
      T(s, { targets: aura, alpha: 0.95, duration: 180 });
      ctx.applyBlock(8);
      await W(s, 400);
      ctx.applyHeal(3);
      await W(s, 380);
      await T(s, { targets: aura, alpha: 0, duration: 260 }); aura.destroy();
      await ctx.wlIdle();
    }
  },
  nightsembrace: {
    name: "Night's Embrace", cost: 2, type: "Skill", art: "wl_portal_5", rarity: "rare",
    desc: "Gain 10 Block.\nDraw 2 cards.", flavor: "It holds her the way nothing living dares to.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_bigcast"); await W(s, 420);
      const veil = s.add.rectangle(640, 360, 1280, 720, 0x1a0a2a, 0).setDepth(8);
      T(s, { targets: veil, fillAlpha: 0.45, duration: 300, yoyo: true, hold: 500, onComplete: () => veil.destroy() });
      const aura = Spire.spawn(s, "fx_wardaura", ctx.wlX, ctx.groundY + 8, { depth: 9, height: 380, tint: 0x7744cc });
      aura.setAlpha(0);
      T(s, { targets: aura, alpha: 0.95, duration: 200 });
      ctx.applyBlock(10);
      await W(s, 500);
      ctx.drawCards(2);
      await W(s, 400);
      await T(s, { targets: aura, alpha: 0, duration: 260 }); aura.destroy();
      await ctx.wlIdle();
    }
  },
  sheolkiss: {
    name: "Sheol Kiss", cost: 3, type: "Attack", art: "as_idle_1", rarity: "rare",
    desc: "Summon the Arch-\nSuccubus: deal 12 damage,\napply 5 Burn.", flavor: "Her older sister doesn't flirt. She collects.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_bigcast"); await W(s, 500);
      const p1 = await ctx.portal(ctx.wlX + 200, ctx.groundY - 20, 0x66ff88);
      const su = Spire.spawn(s, "as_walk", p1.x, ctx.groundY - 8, { depth: 12 });
      su.setAlpha(0);
      T(s, { targets: su, alpha: 1, duration: 160 });
      await T(s, { targets: su, x: 610, y: ctx.groundY - 110, duration: 620, ease: "Sine.easeOut" });
      p1.close();
      su.play("a_as_fireball"); await W(s, 420);
      const fb = ctx.boltSprite("fx_fireball", su.x + 60, su.y - 90, { flipX: true, tint: 0x66ff88 });
      await T(s, { targets: fb, x: ctx.hdX - 30, y: ctx.groundY - 95, duration: 340, ease: "Sine.easeIn" });
      fb.destroy();
      ctx.impact(ctx.hdX - 20, ctx.groundY - 110, 0x66ff88);
      ctx.applySummonHit(12); ctx.applyStatus(ctx.C.enemy, "burn", 5); ctx.shake(6);
      const react = ctx.react("afirehit");
      await P(su, "as_mend");
      ctx.hearts(su.x, su.y - 160);
      await react;
      const p2 = await ctx.portal(su.x + 150, ctx.groundY - 20, 0x66ff88);
      su.setFlipX(true); su.play("a_as_walk");
      await T(s, { targets: su, x: p2.x, y: ctx.groundY - 8, alpha: 0.05, duration: 460, ease: "Sine.easeIn" });
      su.destroy(); await p2.close();
      await ctx.wlIdle();
    }
  },
  marrowchoir: {
    name: "Marrow Choir", cost: 2, type: "Attack", art: "ba_idle_1", rarity: "rare",
    desc: "Raise the Bone Archer:\ndeal 4 damage 3 times.", flavor: "He only plays requiems.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_bigcast"); await W(s, 500);
      const bx = ctx.wlX + 190;
      ctx.dust(bx, ctx.groundY, 0xccccaa);
      const ba = Spire.spawn(s, "ba_idle", bx, ctx.groundY, { depth: 12 });
      ba.scaleY = 0.02;
      await T(s, { targets: ba, scaleY: ba.scaleX, duration: 480, ease: "Back.easeOut" });
      const react = ctx.react("arrowhit");
      for (let i = 0; i < 3; i++) {
        const loose = P(ba, "ba_attack");
        await W(s, 320);
        await ctx.bolt("fx_bonearrow", bx + 70, ctx.groundY - 150, ctx.hdX - 30, ctx.groundY - 95, { dur: 220 });
        ctx.impact(ctx.hdX - 20, ctx.groundY - 100, 0xddddaa);
        ctx.applySummonHit(4); ctx.shake(3);
        await loose;
      }
      await react;
      ba.setTint(0x999988);
      ctx.dust(bx, ctx.groundY, 0xccccaa);
      await T(s, { targets: ba, alpha: 0, scaleY: ba.scaleY * 0.5, duration: 420 });
      ba.destroy();
      await ctx.wlIdle();
    }
  },

  /* ===================== CARD AUDIT PASS (2026-07-30) =====================
     Hiro's ask: diversify past bolt-spam -- life steal, summon-buff, physical
     (non-magic) attacks, and an Arch-Devil transformation. Block cards were
     already praised, untouched here. */

  /* ---- life steal (distinct from Soul Siphon's flat heal: these heal off the
     damage actually dealt, so Weak/block on the enemy matters) ---- */
  vampiricedge: {
    name: "Vampiric Edge", cost: 1, type: "Attack", art: "wl_slide_1", rarity: "common",
    desc: "Deal 9 damage.\nHeal HP equal to\ndamage dealt.", flavor: "She takes back more than blood.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_slide");
      const x0 = ctx.wl.x;
      for (let i = 0; i < 3; i++) ctx.afterimage(ctx.wl, 70 * i);
      await T(s, { targets: ctx.wl, x: ctx.hdX - 190, duration: 230, ease: "Cubic.easeIn" });
      ctx.impact(ctx.hdX - 60, ctx.groundY - 100, 0xdd3355);
      const dealt = ctx.applyHit(9); ctx.blood(ctx.hdX - 40, ctx.groundY - 90); ctx.shake(4);
      const r = ctx.react("hurt");
      if (dealt > 0) ctx.applyHeal(dealt);
      for (let i = 0; i < 3; i++) ctx.afterimage(ctx.wl, 60 * i);
      await T(s, { targets: ctx.wl, x: x0, duration: 250, ease: "Cubic.easeOut" });
      await r;
      await ctx.wlIdle();
    }
  },
  crimsonharvest: {
    name: "Crimson Harvest", cost: 2, type: "Attack", art: "wl_slide_4", rarity: "rare",
    desc: "Deal 15 damage.\nHeal half the damage\ndealt. Apply 1 Weak.", flavor: "She always leaves something worse than a scar.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_slide");
      const x0 = ctx.wl.x;
      for (let i = 0; i < 4; i++) ctx.afterimage(ctx.wl, 55 * i);
      await T(s, { targets: ctx.wl, x: ctx.hdX - 170, duration: 260, ease: "Cubic.easeIn" });
      ctx.impact(ctx.hdX - 50, ctx.groundY - 100, 0xdd2244);
      const dealt = ctx.applyHit(15); ctx.blood(ctx.hdX - 30, ctx.groundY - 90); ctx.shake(7);
      const r = ctx.react("hurt");
      if (dealt > 0) ctx.applyHeal(Math.floor(dealt / 2));
      ctx.applyStatus(ctx.C.enemy, "weak", 1);
      for (let i = 0; i < 4; i++) ctx.afterimage(ctx.wl, 55 * i);
      await T(s, { targets: ctx.wl, x: x0, duration: 270, ease: "Cubic.easeOut" });
      await r;
      await ctx.wlIdle();
    }
  },

  /* ---- THE DRAIN PACKAGE (2026-08-06): the full life-steal archetype. Thirst
     stacks turn every HIT into a sip (multi-hit cards drink deepest), Scarlet Ward
     banks overheal as Block, Hemorrhage pays off a turn that already healed, and
     Crimson Feast turns a gorged heal into permanent max HP. Two NEW warlock
     animation sets carry them: wl_drain (siphon) and wl_bloodrite (ritual). ---- */
  redthirst: {
    name: "Red Thirst", cost: 1, type: "Skill", art: "wl_bloodrite_2", rarity: "uncommon",
    desc: "Gain 2 Thirst:\nattacks heal 2 HP\nper hit this fight.", flavor: "The first rule of collecting: never pay full price.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_bloodrite");
      await W(s, 460);
      const ring = s.add.circle(ctx.wlX, ctx.groundY - 130, 60, 0xdd2244, 0).setDepth(14).setStrokeStyle(4, 0xdd2244, 0.9);
      T(s, { targets: ring, scaleX: 2.2, scaleY: 0.7, alpha: 0, duration: 700, onComplete: () => ring.destroy() });
      ctx.applyThirst(2);
      await W(s, 520);
      await ctx.wlIdle();
    }
  },
  leechlash: {
    name: "Leech Lash", cost: 1, type: "Attack", art: "wl_drain_3", rarity: "common",
    desc: "Deal 8 damage.\nHeal half the\ndamage dealt.", flavor: "A straw, drawn from forty feet away.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_drain");
      await W(s, 340);
      await ctx.bolt("fx_hexbolt", ctx.wlX + 90, ctx.groundY - 180, ctx.hdX - 30, ctx.groundY - 100, { dur: 300, tint: 0xdd2244 });
      ctx.impact(ctx.hdX - 20, ctx.groundY - 100, 0xdd2244);
      const dealt = ctx.applyHit(8); ctx.shake(3);
      const r = ctx.react("hurt");
      if (dealt > 0) {
        for (let i = 0; i < 5; i++) {
          const m = s.add.circle(ctx.hdX - 20 + Phaser.Math.Between(-25, 25), ctx.groundY - 95 + Phaser.Math.Between(-35, 25),
                                 Phaser.Math.Between(3, 5), 0xdd2244).setDepth(15).setAlpha(0.95);
          T(s, { targets: m, x: ctx.wlX + 30, y: ctx.groundY - 170, duration: 420 + i * 60, ease: "Sine.easeIn",
                 onComplete: () => m.destroy() });
          await W(s, 45);
        }
        ctx.applyHeal(Math.floor(dealt / 2));
      }
      await r;
      await ctx.wlIdle();
    }
  },
  hemorrhage: {
    name: "Hemorrhage", cost: 2, type: "Attack", art: "wl_drain_4", rarity: "uncommon",
    desc: "Deal 10 damage.\n+5 more if you\nhealed this turn.", flavor: "Open wounds remember her name.",
    async choreo(s, ctx) {
      const fed = ctx.C.healedThisTurn > 0;
      ctx.wl.play("a_wl_drain");
      await W(s, 340);
      await ctx.bolt("fx_hexbolt", ctx.wlX + 90, ctx.groundY - 180, ctx.hdX - 30, ctx.groundY - 100, { dur: 280, tint: fed ? 0xff2233 : 0xbb3355 });
      ctx.impact(ctx.hdX - 20, ctx.groundY - 100, 0xff2233);
      ctx.blood(ctx.hdX - 30, ctx.groundY - 90);
      ctx.applyHit(fed ? 15 : 10); ctx.shake(fed ? 7 : 4);
      if (fed) s.floatText(ctx.hdX, ctx.groundY - 270, "FED", "#ff5577", 22);
      await ctx.react("hurt");
      await ctx.wlIdle();
    }
  },
  scarletward: {
    name: "Scarlet Ward", cost: 1, type: "Skill", art: "wl_bloodrite_5", rarity: "uncommon",
    desc: "Heal 6 HP. Excess\nhealing becomes\nBlock.", flavor: "Nothing she takes is ever wasted.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_bloodrite");
      await W(s, 460);
      const got = ctx.applyHeal(6);
      const excess = 6 - got;
      if (excess > 0) { await W(s, 300); ctx.applyBlock(excess); }
      await W(s, 420);
      await ctx.wlIdle();
    }
  },
  exsanguinate: {
    name: "Exsanguinate", cost: 3, type: "Attack", art: "wl_drain_5", rarity: "rare",
    desc: "Deal 4 damage 4\ntimes. Heal HP equal\nto damage dealt.", flavor: "She doesn't stop at enough.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_drain");
      /* her arch-self mirrors the working from the shadows (unused form art) */
      const aw = Spire.spawn(s, "aw_hex", ctx.wlX - 120, ctx.groundY + 2, { depth: 9, height: 340, tint: 0x442266 });
      aw.setAlpha(0);
      T(s, { targets: aw, alpha: 0.4, duration: 280 });
      await W(s, 380);
      let total = 0;
      for (let i = 0; i < 4; i++) {
        ctx.bolt("fx_hexbolt", ctx.wlX + 90, ctx.groundY - 180 - i * 12, ctx.hdX - 30, ctx.groundY - 100, { dur: 240, tint: 0xdd2244 });
        await W(s, 240);
        ctx.impact(ctx.hdX - 20 + Phaser.Math.Between(-15, 15), ctx.groundY - 100 + Phaser.Math.Between(-20, 10), 0xdd2244);
        total += ctx.applyHit(4); ctx.shake(3);
        const m = s.add.circle(ctx.hdX - 20, ctx.groundY - 100, 5, 0xdd2244).setDepth(15).setAlpha(0.95);
        T(s, { targets: m, x: ctx.wlX + 30, y: ctx.groundY - 170, duration: 400, ease: "Sine.easeIn", onComplete: () => m.destroy() });
        if (i < 3) await W(s, 120);
      }
      const r = ctx.react("hurt");
      if (total > 0) ctx.applyHeal(total);
      T(s, { targets: aw, alpha: 0, duration: 300, onComplete: () => aw.destroy() });
      await r;
      await ctx.wlIdle();
    }
  },
  crimsonfeast: {
    name: "Crimson Feast", cost: 2, type: "Attack", art: "wl_bloodrite_4", rarity: "epic",
    desc: "Deal 12 damage. Heal\nthe damage dealt;\nexcess raises max HP.", flavor: "Some meals change what you are.",
    async choreo(s, ctx) {
      await ctx.exCutIn("dl_idle", "C R I M S O N   F E A S T", 0xdd2244);
      ctx.wl.play("a_wl_bloodrite");
      /* the demon lord's shadow looms behind her while she feeds (unused form art) */
      const loom = Spire.spawn(s, "dl_idle", ctx.wlX - 130, ctx.groundY + 4, { depth: 9, height: 420, tint: 0x331122 });
      loom.setAlpha(0);
      T(s, { targets: loom, alpha: 0.5, duration: 300 });
      await W(s, 520);
      ctx.flash(0xdd2244, 120);
      await ctx.bolt("fx_hexbolt", ctx.wlX + 90, ctx.groundY - 190, ctx.hdX - 30, ctx.groundY - 95, { dur: 320, tint: 0xff2244 });
      ctx.impact(ctx.hdX - 20, ctx.groundY - 100, 0xff2244);
      ctx.blood(ctx.hdX - 30, ctx.groundY - 90);
      const dealt = ctx.applyHit(12); ctx.shake(6);
      const r = ctx.react("hurt");
      if (dealt > 0) {
        for (let i = 0; i < 8; i++) {
          const m = s.add.circle(ctx.hdX - 20 + Phaser.Math.Between(-30, 30), ctx.groundY - 95 + Phaser.Math.Between(-45, 30),
                                 Phaser.Math.Between(3, 6), 0xff2244).setDepth(15).setAlpha(0.95);
          T(s, { targets: m, x: ctx.wlX + 25, y: ctx.groundY - 170, duration: 440 + i * 50, ease: "Sine.easeIn",
                 onComplete: () => m.destroy() });
          await W(s, 40);
        }
        const got = ctx.applyHeal(dealt);
        const excess = dealt - got;
        if (excess > 0) { await W(s, 320); ctx.raiseMaxHp(excess); }
      }
      await r;
      T(s, { targets: loom, alpha: 0, duration: 340, onComplete: () => loom.destroy() });
      await ctx.wlIdle();
    }
  },

  /* ---- physical / non-magic (dagger work, no bolt, no summon) ---- */
  daggerflurry: {
    name: "Dagger Flurry", cost: 1, type: "Attack", art: "wl_slide_2", rarity: "common",
    desc: "Deal 4 damage\n3 times.", flavor: "Not everything needs a spell.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_slide");
      const x0 = ctx.wl.x;
      await T(s, { targets: ctx.wl, x: ctx.hdX - 200, duration: 220, ease: "Cubic.easeIn" });
      for (let i = 0; i < 3; i++) {
        ctx.afterimage(ctx.wl, 0);
        ctx.impact(ctx.hdX - 60 + i * 6, ctx.groundY - 100 + i * 4, 0xcccccc);
        ctx.applyHit(4); ctx.shake(3);
        if (i < 2) await W(s, 170);
      }
      const r = ctx.react("hurt");
      for (let i = 0; i < 3; i++) ctx.afterimage(ctx.wl, 60 * i);
      await T(s, { targets: ctx.wl, x: x0, duration: 240, ease: "Cubic.easeOut" });
      await r;
      await ctx.wlIdle();
    }
  },
  rivingslash: {
    name: "Riving Slash", cost: 2, type: "Attack", art: "wl_slide_3", rarity: "uncommon",
    desc: "Deal 13 damage.\nGain 5 Block.", flavor: "The follow-through is the point.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_slide");
      const x0 = ctx.wl.x;
      for (let i = 0; i < 4; i++) ctx.afterimage(ctx.wl, 55 * i);
      await T(s, { targets: ctx.wl, x: ctx.hdX - 160, duration: 250, ease: "Cubic.easeIn" });
      ctx.impact(ctx.hdX - 40, ctx.groundY - 100, 0xdddddd);
      ctx.applyHit(13); ctx.blood(ctx.hdX - 20, ctx.groundY - 90); ctx.shake(8);
      const r = ctx.react("hurt");
      ctx.applyBlock(5);
      for (let i = 0; i < 4; i++) ctx.afterimage(ctx.wl, 55 * i);
      await T(s, { targets: ctx.wl, x: x0, duration: 260, ease: "Cubic.easeOut" });
      await r;
      await ctx.wlIdle();
    }
  },

  /* ---- summon-buff: make her existing (and future) summons hit harder ---- */
  bloodpact: {
    name: "Blood Pact", cost: 1, type: "Skill", art: "wl_portal_2", rarity: "uncommon",
    desc: "Permanently gain +3\ndamage on summon\nattacks this fight.", flavor: "A little of hers, for a little more of theirs.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_portal"); await W(s, 260);
      const glyph = Spire.spawn(s, "fx_wardaura", ctx.wlX, ctx.groundY + 8, { depth: 9, height: 260, tint: 0xdd2244 });
      glyph.setAlpha(0);
      T(s, { targets: glyph, alpha: 0.9, duration: 200 });
      ctx.applySummonPower(3);
      await W(s, 500);
      await T(s, { targets: glyph, alpha: 0, duration: 300 }); glyph.destroy();
      await ctx.wlIdle();
    }
  },
  darkcovenant: {
    name: "Dark Covenant", cost: 2, type: "Skill", art: "wl_bigcast_4", rarity: "rare",
    desc: "Gain +6 damage on\nsummon attacks this\nfight. Draw 2 cards.", flavor: "Every pact she signs, she signs in someone else's blood.",
    async choreo(s, ctx) {
      ctx.wl.play("a_wl_bigcast"); await W(s, 420);
      const veil = s.add.rectangle(640, 360, 1280, 720, 0x2a0a12, 0).setDepth(8);
      T(s, { targets: veil, fillAlpha: 0.4, duration: 260, yoyo: true, hold: 420, onComplete: () => veil.destroy() });
      const glyph = Spire.spawn(s, "fx_wardaura", ctx.wlX, ctx.groundY + 8, { depth: 9, height: 340, tint: 0xdd2244 });
      glyph.setAlpha(0);
      T(s, { targets: glyph, alpha: 0.95, duration: 200 });
      /* the other signature: her lich-self surfaces to countersign (unused form art) */
      const li = Spire.spawn(s, "li_attack", ctx.wlX + 150, ctx.groundY + 2, { depth: 9, height: 300, tint: 0x66ff99 });
      li.setAlpha(0);
      T(s, { targets: li, alpha: 0.45, duration: 260, yoyo: true, hold: 700, onComplete: () => li.destroy() });
      ctx.applySummonPower(6);
      await W(s, 450);
      ctx.drawCards(2);
      await W(s, 380);
      await T(s, { targets: glyph, alpha: 0, duration: 300 }); glyph.destroy();
      await ctx.wlIdle();
    }
  },

  /* ---- Arch-Devil transformation (reuses the ARPG's warlock/forms/archdevil set;
     standalone-summon architecture -- she channels it, IT strikes, in-engine) ---- */
  archdeviloath: {
    name: "Wear the Devil's Skin", cost: 3, type: "Attack", art: "ad_idle_1", rarity: "epic",
    desc: "Become the Arch-Devil:\ndeal 18 damage, apply\n2 Weak, gain 8 Block.", flavor: "For a moment, she remembers what teeth are really for.",
    async choreo(s, ctx) {
      await ctx.exCutIn("ad_idle", "WEAR  THE  DEVIL'S  SKIN", 0xff2233);
      ctx.wl.play("a_wl_bigcast"); await W(s, 420);
      s.cameras.main.flash(260, 140, 10, 20);
      await T(s, { targets: ctx.wl, alpha: 0.15, duration: 220 });
      const ad = Spire.spawn(s, "ad_walk", ctx.wlX + 40, ctx.groundY, { depth: 13 });
      ctx.dust(ad.x, ctx.groundY, 0x992233);
      await T(s, { targets: ad, x: ctx.hdX - 200, duration: 480, ease: "Sine.easeIn" });
      const swing = P(ad, "ad_claw");     // the shelved five-frame claw rake (2026-08-11)
      Spire.sfx.whoosh();
      await W(s, 260);
      ctx.impact(ctx.hdX - 40, ctx.groundY - 110, 0xff2233);
      ctx.applyHit(18); ctx.shake(9);
      ctx.applyStatus(ctx.C.enemy, "weak", 2);
      const react = ctx.react("hurt");
      await swing;
      await react;
      ctx.applyBlock(8);
      ad.play("a_ad_walk");
      await T(s, { targets: ad, x: ctx.wlX + 40, duration: 460, ease: "Sine.easeOut" });
      ctx.dust(ad.x, ctx.groundY, 0x992233);
      ad.destroy();
      await T(s, { targets: ctx.wl, alpha: 1, duration: 260 });
      await ctx.wlIdle();
    }
  }
};

Object.keys(Spire.CARDS).forEach(k => { Spire.CARDS[k].id = k; });   // spend()/hand bookkeeping needs ids

Spire.STARTING_DECK = [
  "shadowbolt", "shadowbolt", "shadowbolt",
  "umbralward", "umbralward", "umbralward",
  "hexfrailty", "shadowstep", "soulsiphon", "pactofpain",
  "ruthlessfocus", "veilofnight",
  "succubus", "clawdemon", "dragon", "shamblers"
];

/* =====================================================================
   TSUBAKI — the Ieyasu school (2026-08-08). Three strategies, per Hiro:
   BLEED (open veins tick every enemy turn, through block), CONDITIONAL
   FATAL STROKES (playable only on the 1st turn / odd turns / against a
   bleeding foe — the cost of "one stroke, one kill" is choosing its
   moment), and PARRY/COUNTER (Focus banks bonus action points for the
   next turn; Riposte answers a guarded attack). Every card carries its
   own animation set (kd_*), generated from Hiro's samurai reference.
   ===================================================================== */
const KD_DASH = async (s, ctx, anim, strikeAt, strike, dashX) => {
  /* shared chassis: dash in on the WALK set, then perform the card's OWN anim at
     the enemy (2026-08-08 fix: the unique anim used to fire at dash-start and sat
     frozen on its last frame by the time she arrived — every card read as "the
     same attack". Now the signature animation IS the strike.) */
  const x0 = ctx.wl.x;
  ctx.wl.play("a_kd_walk");
  for (let i = 0; i < 3; i++) ctx.afterimage(ctx.wl, 60 * i);
  await T(s, { targets: ctx.wl, x: ctx.hdX - (dashX || 180), duration: 220, ease: "Cubic.easeIn" });
  ctx.wl.play("a_" + anim);                     // the card's signature, front and center
  await W(s, Math.max(strikeAt, 260));          // let the wind-up frames read
  const r = await strike();
  await W(s, 240);                              // hold the follow-through frame
  for (let i = 0; i < 3; i++) ctx.afterimage(ctx.wl, 55 * i);
  await T(s, { targets: ctx.wl, x: x0, duration: 240, ease: "Cubic.easeOut" });
  await r;
  await ctx.wlIdle();
};

Spire.CARDS.firstcut = {
  name: "First Cut", cost: 1, type: "Attack", art: "kd_slash_3", rarity: "starter", char: "samurai",
  desc: "Deal 6 damage.\nApply 2 Bleed.", flavor: "Every duel is decided at the first exchange.",
  async choreo(s, ctx) {
    await KD_DASH(s, ctx, "kd_slash", 180, async () => {
      ctx.impact(ctx.hdX - 40, ctx.groundY - 100, 0xdddddd);
      ctx.applyHit(6); ctx.blood(ctx.hdX - 30, ctx.groundY - 95); ctx.shake(4);
      const r = ctx.react("hurt");
      ctx.applyBleed(2);
      return r;
    });
  }
};
Spire.CARDS.crossveil = {
  name: "Crossveil Slash", cost: 1, type: "Attack", art: "kd_cross_3", rarity: "starter", char: "samurai",
  desc: "Deal 4 damage\ntwice.", flavor: "Two arcs. One breath.",
  async choreo(s, ctx) {
    await KD_DASH(s, ctx, "kd_cross", 160, async () => {
      ctx.impact(ctx.hdX - 45, ctx.groundY - 110, 0xdddddd);
      ctx.applyHit(4); ctx.shake(3);
      await W(s, 200);
      ctx.impact(ctx.hdX - 35, ctx.groundY - 90, 0xdddddd);
      ctx.applyHit(4); ctx.shake(3);
      return ctx.react("hurt");
    });
  }
};
Spire.CARDS.patientdef = {
  name: "Patient Defense", cost: 1, type: "Skill", art: "kd_guard_2", rarity: "starter", char: "samurai",
  desc: "Gain 7 Block.\nGain 1 Focus.", flavor: "Let the enemy make the first move.",
  async choreo(s, ctx) {
    ctx.wl.play("a_kd_guard"); await W(s, 520);
    ctx.applyBlock(7); ctx.applyFocus(1);
    await W(s, 380); await ctx.wlIdle();
  }
};
Spire.CARDS.observe = {
  name: "Observant Draw", cost: 0, type: "Skill", art: "kd_observe_3", rarity: "starter", char: "samurai",
  desc: "Draw 1 card.\nGain 1 Focus.", flavor: "Analyze the movement. Counters come faster.",
  async choreo(s, ctx) {
    ctx.wl.play("a_kd_observe"); await W(s, 560);
    ctx.drawCards(1); ctx.applyFocus(1);
    await W(s, 300); await ctx.wlIdle();
  }
};
Spire.CARDS.ieyasucounter = {
  name: "Ieyasu Counter", cost: 2, type: "Skill", art: "kd_counter_3", rarity: "starter", char: "samurai",
  desc: "Gain 9 Block.\nRiposte 8: struck\nguard answers back.", flavor: "After a perfect block, a deadly stroke.",
  async choreo(s, ctx) {
    ctx.wl.play("a_kd_counter"); await W(s, 540);
    ctx.applyBlock(9); ctx.applyRiposte(8);
    await W(s, 380); await ctx.wlIdle();
  }
};
Spire.CARDS.sneakopening = {
  name: "Sneak Opening", cost: 1, type: "Attack", art: "kd_sneak_3", rarity: "common", char: "samurai",
  desc: "1st TURN ONLY:\nDeal 14 damage.\nApply 3 Bleed.", flavor: "Before the crowd finds its voice.",
  cond: C => C.turn === 1,
  async choreo(s, ctx) {
    await KD_DASH(s, ctx, "kd_sneak", 150, async () => {
      ctx.flash(0x222233, 90);
      ctx.impact(ctx.hdX - 40, ctx.groundY - 100, 0x99aadd);
      ctx.applyHit(14); ctx.blood(ctx.hdX - 25, ctx.groundY - 95); ctx.shake(7);
      const r = ctx.react("hurt");
      ctx.applyBleed(3);
      return r;
    }, 160);
  }
};
Spire.CARDS.arterycut = {
  name: "Artery Cut", cost: 1, type: "Attack", art: "kd_artery_2", rarity: "common", char: "samurai",
  desc: "Deal 5 damage.\nApply 3 Bleed.", flavor: "Precision is mercy's opposite.",
  async choreo(s, ctx) {
    await KD_DASH(s, ctx, "kd_artery", 170, async () => {
      ctx.impact(ctx.hdX - 40, ctx.groundY - 105, 0xdd3344);
      ctx.applyHit(5); ctx.blood(ctx.hdX - 30, ctx.groundY - 100); ctx.shake(3);
      const r = ctx.react("hurt");
      ctx.applyBleed(3);
      return r;
    });
  }
};
Spire.CARDS.oddhour = {
  name: "Odd-Hour Stroke", cost: 2, type: "Attack", art: "kd_oddhour_2", rarity: "uncommon", char: "samurai",
  desc: "ODD TURNS ONLY:\nDeal 16 damage.", flavor: "The hour strikes. So does she.",
  cond: C => C.turn % 2 === 1,
  async choreo(s, ctx) {
    await KD_DASH(s, ctx, "kd_oddhour", 220, async () => {
      ctx.flash(0xffffff, 90);
      ctx.impact(ctx.hdX - 35, ctx.groundY - 110, 0xffffff);
      ctx.applyHit(16); ctx.blood(ctx.hdX - 25, ctx.groundY - 95); ctx.shake(8);
      return ctx.react("hurt");
    });
  }
};
Spire.CARDS.openred = {
  name: "Open the Red", cost: 2, type: "Attack", art: "kd_openred_2", rarity: "uncommon", char: "samurai",
  desc: "BLEEDING FOE ONLY:\nDeal 12 damage.\nBleed +2.", flavor: "A wound is a door. She doesn't knock.",
  cond: C => (C.enemy.statuses.bleed || 0) > 0,
  async choreo(s, ctx) {
    await KD_DASH(s, ctx, "kd_openred", 200, async () => {
      ctx.impact(ctx.hdX - 40, ctx.groundY - 100, 0xdd2233);
      ctx.applyHit(12); ctx.blood(ctx.hdX - 30, ctx.groundY - 95); ctx.blood(ctx.hdX - 15, ctx.groundY - 105); ctx.shake(7);
      const r = ctx.react("hurt");
      ctx.applyBleed(2);
      return r;
    });
  }
};
Spire.CARDS.perfectparry = {
  name: "Perfect Parry", cost: 1, type: "Skill", art: "kd_parry_3", rarity: "uncommon", char: "samurai",
  desc: "Gain 11 Block.\nGain 2 Focus.", flavor: "Perfect blocks build Focus. Focus buys tomorrows.",
  async choreo(s, ctx) {
    ctx.wl.play("a_kd_parry"); await W(s, 540);
    ctx.applyBlock(11); ctx.applyFocus(2);
    await W(s, 400); await ctx.wlIdle();
  }
};
Spire.CARDS.ichigeki = {
  name: "Ichigeki", cost: 3, type: "Attack", art: "kd_ichigeki_3", rarity: "rare", char: "samurai",
  desc: "ODD TURN + BLEEDING\nFOE ONLY:\nDeal 30 damage.", flavor: "One stroke. One kill. Victory is her nature.",
  cond: C => C.turn % 2 === 1 && (C.enemy.statuses.bleed || 0) > 0,
  async choreo(s, ctx) {
    await ctx.exCutIn("kd_ichigeki", "I C H I G E K I", 0xff3344);
    ctx.wl.play("a_kd_ichigeki");
    await W(s, 620);                              // the sheathe: absolute stillness
    ctx.flash(0xffffff, 140);
    const x0 = ctx.wl.x;
    for (let i = 0; i < 5; i++) ctx.afterimage(ctx.wl, 30 * i);
    await T(s, { targets: ctx.wl, x: ctx.hdX + 60, duration: 130, ease: "Expo.easeIn" });  // THROUGH him
    ctx.impact(ctx.hdX - 20, ctx.groundY - 105, 0xffffff);
    ctx.applyHit(30); ctx.blood(ctx.hdX - 20, ctx.groundY - 95); ctx.blood(ctx.hdX + 5, ctx.groundY - 110);
    ctx.shake(10);
    const r = ctx.react("hurt");
    await W(s, 520);                              // back turned, sliding the katana home
    for (let i = 0; i < 3; i++) ctx.afterimage(ctx.wl, 60 * i);
    await T(s, { targets: ctx.wl, x: x0, duration: 260, ease: "Cubic.easeOut" });
    await r;
    await ctx.wlIdle();
  }
};
Spire.CARDS.tsubakibloom = {
  name: "Tsubaki Bloom", cost: 2, type: "Attack", art: "kd_bloom_3", rarity: "epic", char: "samurai",
  desc: "Deal 8 damage.\nConsume all Bleed:\n+4 damage per stack.", flavor: "The camellia falls whole.",
  async choreo(s, ctx) {
    const stacks = ctx.C.enemy.statuses.bleed || 0;
    await ctx.exCutIn("kd_bloom", "T S U B A K I   B L O O M", 0xdd3355);
    await KD_DASH(s, ctx, "kd_bloom", 240, async () => {
      /* petal burst */
      for (let i = 0; i < 10; i++) {
        const p = s.add.circle(ctx.hdX - 30 + Phaser.Math.Between(-40, 40), ctx.groundY - 100 + Phaser.Math.Between(-60, 40),
                               Phaser.Math.Between(3, 5), 0xbb2244).setDepth(16).setAlpha(0.95);
        T(s, { targets: p, y: p.y + Phaser.Math.Between(40, 110), x: p.x + Phaser.Math.Between(-30, 30),
               alpha: 0, duration: 700 + i * 40, ease: "Sine.easeIn", onComplete: () => p.destroy() });
      }
      ctx.impact(ctx.hdX - 35, ctx.groundY - 100, 0xdd3355);
      if (stacks > 0) ctx.C.enemy.statuses.bleed = 0;
      ctx.applyHit(8 + stacks * 4); ctx.blood(ctx.hdX - 25, ctx.groundY - 95); ctx.shake(8);
      if (stacks > 0) s.floatText(ctx.hdX, ctx.groundY - 270, `${stacks} bleed consumed`, "#ff5577", 20);
      return ctx.react("hurt");
    });
  }
};

Spire.STARTING_DECK_K = [
  "firstcut", "firstcut", "crossveil", "crossveil",
  "patientdef", "patientdef", "observe", "ieyasucounter",
  "sneakopening", "arterycut"
];
Object.keys(Spire.CARDS).forEach(k => { Spire.CARDS[k].id = k; });   // re-run for the samurai set
                                                                      // (the first pass at line ~699 ran before these defs)

/* ---------- shared card widget (fight hand, reward picks, purge grid) ---------- */
Spire.cardTheme = t => t === "Attack" ? { ribbon: 0x8a2f22, edge: 0xe0b34a } : { ribbon: 0x6a512e, edge: 0xe0b34a };
Spire.makeCard = function (scene, id) {
  const d = Spire.CARDS[id];
  const th = Spire.cardTheme(d.type);
  if (d.rarity === "epic") th.edge = 0xff5c8a;   // epic cards get their own frame color, not just a text tag
  const c = scene.add.container(0, 0);
  const W2 = 152, H2 = 212;
  const bg = scene.add.graphics();
  bg.fillStyle(0x241813, 0.97).fillRoundedRect(-W2 / 2, -H2 / 2, W2, H2, 10);
  bg.lineStyle(2.5, th.edge, 1).strokeRoundedRect(-W2 / 2, -H2 / 2, W2, H2, 10);
  bg.fillStyle(th.ribbon, 1).fillRoundedRect(-W2 / 2 + 5, -H2 / 2 + 26, W2 - 10, 17, 4);
  c.add(bg);
  const art = scene.add.image(0, -37, d.art);
  const fit = Math.min((W2 - 22) / art.width, 88 / art.height);
  art.setScale(fit);
  c.add(art);
  c.add(scene.add.text(0, -H2 / 2 + 15, d.name, { fontFamily: "Georgia, serif", fontSize: 13.5, color: "#efdcb8" }).setOrigin(0.5));
  const sub = (d.rarity === "epic" ? "EPIC " : d.rarity === "rare" ? "RARE " : "") + d.type.toUpperCase();
  const subColor = d.rarity === "epic" ? "#ff7ab6" : d.rarity === "rare" ? "#ffd97a" : "#e8cfa8";
  c.add(scene.add.text(0, -H2 / 2 + 34.5, sub, { fontFamily: "Georgia, serif", fontSize: 9.5, color: subColor, letterSpacing: 2 }).setOrigin(0.5));
  c.add(scene.add.text(0, 40, d.desc, { fontFamily: "Georgia, serif", fontSize: 12, color: "#d8c4a0", align: "center", lineSpacing: 2 }).setOrigin(0.5, 0));
  const orb = scene.add.circle(-W2 / 2 + 3, -H2 / 2 + 3, 15, 0x3a2244).setStrokeStyle(2, 0xb46ae0);
  const cost = scene.add.text(-W2 / 2 + 3, -H2 / 2 + 3, String(d.cost), { fontFamily: "Georgia, serif", fontSize: 15, color: "#efd7ff" }).setOrigin(0.5);
  c.add([orb, cost]);
  const hl = scene.add.graphics();          // "playable" glow edge, toggled by the hand
  hl.lineStyle(3, 0xffe9a0, 0.9).strokeRoundedRect(-W2 / 2 - 2, -H2 / 2 - 2, W2 + 4, H2 + 4, 11);
  hl.setVisible(false);
  c.add(hl);
  c.hl = hl;
  c.setSize(W2, H2);
  c.cardId = id;
  return c;
};
