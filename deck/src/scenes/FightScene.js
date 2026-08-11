/* FightScene — any Pit encounter: Vessia vs the current node's enemy.
   Presentation layer over Spire.Combat; every card/enemy action runs full choreography. */
class FightScene extends Phaser.Scene {
  constructor() { super("Fight"); }
  init(data) { this.enemyOverride = data && data.enemy; }

  create() {
    if (!Spire.run || Spire.run.over) Spire.newRun();
    const node = Spire.currentNode();
    this.E = Spire.ENEMIES[this.enemyOverride || (node && node.enemy) || "hound"];
    this.C = new Spire.Combat(Spire.run.deck, this.E, Spire.run.hp, Spire.run.maxHp);
    this.busy = false;
    this.isDefeat = false;
    this._pile = null; this._intentTip = null;   // instance-reuse guards: stale overlay refs
                                                 // from a prior fight would swallow the first click
    this.groundY = 612; this.wlX = 430; this.hdX = 880;

    /* ---------- backdrop: each act fights on its own ground ---------- */
    this.buildArena();
    Spire.playMusic(Spire.act().music);

    /* ---------- combatants ---------- */
    for (const [x, w] of [[this.wlX, 300], [this.hdX, 360]]) {
      this.add.ellipse(x, this.groundY + 4, w, 64, 0xff9944, 0.13).setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
    }
    this.PP = Spire.char().prefix;    // player sprite prefix: wl (Vessia) or kd (Tsubaki)
    this.wl = Spire.spawn(this, this.PP + "_idle", this.wlX, this.groundY, { depth: 10, height: this.PP === "kd" ? 300 : 320 });
    /* BUG FIX (2026-07-30, corrected): the HOUND and BEAST sprite sets were generated facing
       RIGHT, so unflipped they stood with their backs to her. E.flip marks right-facing art
       (see the facing table in enemies.js); flipX here is the "face left, toward Vessia"
       resting orientation -- flipXFor() below keeps it correct through every turn.
       E.tint (the Frost Wight) rides on top and is re-applied after every hit-flash. */
    this.hd = Spire.spawn(this, this.E.prefix + "_idle", this.hdX, this.groundY, { depth: 11, height: this.E.height, flipX: !!this.E.flip });
    this.baseTint();

    this.buildHud();
    this.buildDebugHooks();

    this.cameras.main.fadeIn(400);
    /* the fight's opening exchange: her line first (boss fights), then the villain's taunt */
    (async () => {
      const voOk = !this.E.voChar || this.E.voChar === Spire.run.character;
      /* the act's bossVO belongs to the act's OWN boss — the Kagehime duel and any
         other drop-in boss brings its own intro line instead (2026-08-11) */
      if (this.E.boss && Spire.act().bossVO && this.E.id === Spire.act().boss) await Spire.say(this, Spire.act().bossVO);
      /* BUG FIX (2026-08-11, Hiro: "the ninja said nothing"): this block runs inside
         create(), when Phaser still reports the scene as NOT active — so the old
         `this.scene.isActive()` guard silently ate every NON-boss intro (bosses only
         talked because the awaited bossVO line above outlived scene startup). Wait a
         beat first; the guard then only rejects genuinely dead scenes. */
      else await Spire.wait(this, 450);
      if (this.E.vo && this.E.vo.intro && voOk && this.scene.isActive()) await Spire.say(this, this.E.vo.intro);
    })();
    const introColor = this.E.boss ? "#ff6644" : (this.E.elite ? "#ffd97a" : "#d9884a");
    this.banner(this.E.name, introColor).then(async () => {
      this.C.startPlayerTurn();
      this.refreshHud();
      await this.renderHand(true);
      await this.banner("YOUR TURN", "#e0b34a");
      this.busy = false;
    });
    this.busy = true;
  }

  /* re-assert the enemy's resting tint (or clear) -- used after hit-flashes/buff glows */
  baseTint() {
    if (!this.hd || !this.hd.active) return;
    if (this.E.tint) this.hd.setTint(this.E.tint); else this.hd.clearTint();
  }

  /* per-act arena: Act 1 the Pit, Act 2 the back alleys, Act 3 the west road at new moon */
  buildArena() {
    const act = Spire.run ? Spire.run.act : 1;
    const kd = Spire.run && Spire.run.character === "samurai";
    if (kd && act === 1 && this.textures.exists("bg_bam_far_1")) {
      /* THE BAMBOO ROAD — morning mist on the road to Karridge (her road only) */
      const far = this.add.image(640, 360, "bg_bam_far_1").setDepth(0);
      far.setScale(Math.max(1280 / far.width, 720 / far.height) * 1.02);
      const row = this.add.image(640, 668, "bg_bam_mid_1").setDepth(1).setOrigin(0.5, 1).setAlpha(0.95);
      row.setScale(1280 / row.width);
      this.add.rectangle(640, 360, 1280, 720, 0x06110a, this.E.boss ? 0.46 : 0.32).setDepth(2);
      this.add.particles(0, 0, "dot", {   // drifting bamboo leaves in the morning light
        x: { min: 0, max: 1280 }, y: { min: -20, max: 40 }, lifespan: 7000,
        speedX: { min: -28, max: -8 }, speedY: { min: 14, max: 34 },
        scale: { start: 0.34, end: 0.1 }, quantity: 1, frequency: 420,
        tint: [0x9fd47a, 0xd8e8a0, 0x6a9a55], alpha: { start: 0.55, end: 0 }, blendMode: "ADD"
      }).setDepth(3);
      return;
    }
    if (kd && act === 2 && this.textures.exists("bg_bv_far_1")) {
      /* BRASSVEIL — the lit city (arcane-punk; her road only) */
      const far = this.add.image(640, 360, "bg_bv_far_1").setDepth(0);
      far.setScale(Math.max(1280 / far.width, 720 / far.height) * 1.02);
      const row = this.add.image(640, 660, "bg_bv_mid_1").setDepth(1).setOrigin(0.5, 1).setAlpha(0.95);
      row.setScale(1280 / row.width);
      this.add.rectangle(640, 360, 1280, 720, 0x080a14, this.E.boss ? 0.5 : 0.38).setDepth(2);
      this.add.particles(0, 0, "dot", {   // ley-light motes, teal + magenta
        x: { min: 0, max: 1280 }, y: { min: 120, max: 560 }, lifespan: 5600,
        speedX: { min: -10, max: 10 }, speedY: { min: -10, max: -2 },
        scale: { start: 0.3, end: 0 }, quantity: 1, frequency: 340,
        tint: [0x55e8d8, 0xdd66cc, 0x9fd4ff], alpha: { start: 0.6, end: 0 }, blendMode: "ADD"
      }).setDepth(3);
      return;
    }
    if (kd && act === 3 && this.textures.exists("bg_fort_far_1")) {
      /* DRAKESPIRE KEEP — fortress grounds; the BOSS fight moves inside to the
         Emperor's THRONE ROOM, where Sera waits (2026-08-11) */
      const throne = this.E.id === "sera" && this.textures.exists("bg_throne_far_1");
      const far = this.add.image(640, 360, throne ? "bg_throne_far_1" : "bg_fort_far_1").setDepth(0);
      far.setScale(Math.max(1280 / far.width, 720 / far.height) * 1.02);
      const row = this.add.image(640, 655, throne ? "bg_throne_mid_1" : "bg_fort_mid_1").setDepth(1).setOrigin(0.5, 1).setAlpha(0.95);
      row.setScale(1280 / row.width);
      this.add.rectangle(640, 360, 1280, 720, 0x060a08, this.E.boss ? 0.52 : 0.4).setDepth(2);
      this.add.particles(0, 0, "dot", {   // green imperial brazier-embers in the rain
        x: { min: 0, max: 1280 }, y: 730, lifespan: 5200, speedY: { min: -34, max: -10 },
        scale: { start: 0.38, end: 0 }, quantity: 1, frequency: 300,
        tint: [0x66e88a, 0x9fd4a0], alpha: { start: 0.6, end: 0 }, blendMode: "ADD"
      }).setDepth(3);
      return;
    }
    if (act === 2) {
      const far = this.add.image(640, 360, "bg_alleys_far_1").setDepth(0);
      far.setScale(Math.max(1280 / far.width, 720 / far.height) * 1.02);
      const row = this.add.image(640, 648, "bg_alleys_mid_1").setDepth(1).setOrigin(0.5, 1).setAlpha(0.96);
      row.setScale(1280 / row.width);
      this.add.rectangle(640, 360, 1280, 720, 0x0a0810, this.E.boss ? 0.5 : 0.4).setDepth(2);
      const fg = this.add.image(150, 726, "bg_city_near_1").setDepth(24).setOrigin(0.5, 1).setAlpha(0.85);
      fg.setScale(560 / fg.width);
      this.add.particles(0, 0, "dot", {   // lantern motes drifting between the eaves
        x: { min: 0, max: 1280 }, y: { min: 120, max: 500 }, lifespan: 6200,
        speedX: { min: -12, max: 12 }, speedY: { min: -6, max: 6 },
        scale: { start: 0.3, end: 0 }, quantity: 1, frequency: 460,
        tint: [0xffcc77, 0xe0b34a], alpha: { start: 0.5, end: 0 }, blendMode: "ADD"
      }).setDepth(3);
    } else if (act === 3) {
      const far = this.add.image(640, 360, "bg_wroad_far_1").setDepth(0);
      far.setScale(Math.max(1280 / far.width, 720 / far.height) * 1.02);
      const row = this.add.image(640, 640, "bg_wroad_mid_1").setDepth(1).setOrigin(0.5, 1).setAlpha(0.95);
      row.setScale(1280 / row.width);
      this.add.rectangle(640, 360, 1280, 720, 0x040810, this.E.boss ? 0.5 : 0.38).setDepth(2);
      const fg = this.add.image(1080, 730, "bg_road_props_1").setDepth(24).setOrigin(0.5, 1).setAlpha(0.8);
      fg.setScale(620 / fg.width);
      this.add.particles(0, 0, "dot", {   // fireflies / ley-mist over the road
        x: { min: 0, max: 1280 }, y: { min: 300, max: 640 }, lifespan: 5200,
        speedX: { min: -16, max: 16 }, speedY: { min: -14, max: -4 },
        scale: { start: 0.32, end: 0 }, quantity: 1, frequency: 380,
        tint: [0x7fe8d0, 0x9fd4ff], alpha: { start: 0.55, end: 0 }, blendMode: "ADD"
      }).setDepth(3);
    } else {
      const far = this.add.image(640, 285, "bg_far_1").setDepth(0);
      far.setScale(Math.max(1280 / far.width, 590 / far.height) * 1.04);
      const floor = this.add.image(640, 655, "bg_floor_1").setDepth(1);
      floor.setScale(1280 / floor.width, 250 / (floor.height * 0.55));
      this.add.rectangle(640, 360, 1280, 720, 0x0c0806, this.E.boss ? 0.42 : 0.32).setDepth(2);
      const fg = this.add.image(640, 430, "bg_fg_1").setDepth(24).setAlpha(0.8);
      fg.setScale(Math.max(1280 / fg.width, 720 / fg.height) * 1.42);
      this.add.particles(0, 0, "dot", {
        x: { min: 0, max: 1280 }, y: 730, lifespan: 5600, speedY: { min: -36, max: -12 },
        scale: { start: 0.42, end: 0 }, quantity: 1, frequency: this.E.boss ? 160 : 300,
        tint: this.E.boss ? [0xff5533, 0xe0b34a] : [0xff9944, 0xe0b34a], alpha: { start: 0.7, end: 0 }, blendMode: "ADD"
      }).setDepth(3);
    }
  }

  /* ================= HUD ================= */
  buildHud() {
    const mk = (x, y, w, name) => {
      const c = {};
      c.plate = this.add.rectangle(x - 13, y + 4, w + 92, 66, 0x120b08, 0.55).setDepth(29);
      c.name = this.add.text(x, y - 22, name, { fontFamily: "Georgia, serif", fontSize: 15, color: "#e8cfa8" }).setOrigin(0.5).setDepth(30);
      c.barBg = this.add.rectangle(x, y, w, 15, 0x211511).setStrokeStyle(2, 0x60432a).setDepth(30);
      c.bar = this.add.rectangle(x - w / 2 + 2, y, w - 4, 9, 0xb03a2e).setOrigin(0, 0.5).setDepth(31);
      c.hpTxt = this.add.text(x, y, "", { fontFamily: "Georgia, serif", fontSize: 11, color: "#ffe9cc" }).setOrigin(0.5).setDepth(32);
      c.block = this.add.container(x - w / 2 - 26, y, [
        this.add.circle(0, 0, 15, 0x2a4a6a).setStrokeStyle(2, 0x7ab6e8),
        this.add.text(0, 0, "0", { fontFamily: "Georgia, serif", fontSize: 14, color: "#cfe8ff" }).setOrigin(0.5).setName("t")
      ]).setDepth(32).setVisible(false);
      c.statusTxt = this.add.text(x - w / 2, y + 16, "", { fontFamily: "Georgia, serif", fontSize: 13, color: "#e0b34a" }).setDepth(31);
      c.w = w; c.x = x;
      return c;
    };
    this.wlHud = mk(this.wlX, this.groundY + 34, 190, Spire.char().name);
    this.hdHud = mk(this.hdX, this.groundY + 34, 190, this.E.name);

    this.intentC = this.add.container(this.hdX, this.groundY - 275).setDepth(30);

    this.orb = this.add.container(96, 596).setDepth(40);
    this.orb.add(this.add.circle(0, 0, 37, 0x3a2244).setStrokeStyle(3, 0xb46ae0));
    this.orbTxt = this.add.text(0, 0, "3/3", { fontFamily: "Georgia, serif", fontSize: 22, color: "#efd7ff" }).setOrigin(0.5);
    this.orb.add(this.orbTxt);
    this.orb.add(this.add.text(0, 48, "ENERGY", { fontFamily: "Georgia, serif", fontSize: 11, color: "#9a8264" }).setOrigin(0.5));

    this.drawTxt = this.add.text(170, 690, "", { fontFamily: "Georgia, serif", fontSize: 15, color: "#caa26a" }).setDepth(40)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => { Spire.sfx.click(); this.pileView(this.C.draw, "DRAW PILE (order hidden)"); });
    this.discTxt = this.add.text(1110, 690, "", { fontFamily: "Georgia, serif", fontSize: 15, color: "#caa26a" }).setOrigin(1, 0).setDepth(40)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => { Spire.sfx.click(); this.pileView(this.C.discard, "DISCARD PILE"); });

    this.endBtn = this.add.container(1173, 596).setDepth(40);
    const eb = this.add.rectangle(0, 0, 150, 52, 0x3a2420, 0.94).setStrokeStyle(2, 0xe0b34a);
    const et = this.add.text(0, 0, "END TURN", { fontFamily: "Georgia, serif", fontSize: 19, color: "#e8cfa8" }).setOrigin(0.5);
    this.endBtn.add([eb, et]);
    eb.setInteractive({ useHandCursor: true })
      .on("pointerover", () => eb.setFillStyle(0x5a3426, 0.96))
      .on("pointerout", () => eb.setFillStyle(0x3a2420, 0.94))
      .on("pointerdown", () => { Spire.sfx.click(); this.endTurn(); });

    this.musTxt = this.add.text(1252, 16, Spire.musicOn ? "♪ on" : "♪ off",
      { fontFamily: "Georgia, serif", fontSize: 16, color: "#caa26a" }).setOrigin(1, 0).setDepth(40)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => { Spire.sfx.click(); Spire.toggleMusic(); this.musTxt.setText(Spire.musicOn ? "♪ on" : "♪ off"); });
    this.add.text(1252, 44, "⛶", { fontSize: 20, color: "#caa26a" }).setOrigin(1, 0).setDepth(40)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => { Spire.sfx.click(); if (this.scale.isFullscreen) this.scale.stopFullscreen(); else this.scale.startFullscreen(); });

    this.handC = this.add.container(0, 0).setDepth(50);
    this.refreshHud();
  }

  statusLine(unit) {
    const parts = [];
    if (unit.statuses.burn) parts.push(`Burn ${unit.statuses.burn}`);
    if (unit.statuses.weak) parts.push(`Weak ${unit.statuses.weak}`);
    if (unit.statuses.str) parts.push(`Str +${unit.statuses.str}`);
    if (unit.statuses.thirst) parts.push(`Thirst ${unit.statuses.thirst}`);
    if (unit.statuses.bleed) parts.push(`Bleed ${unit.statuses.bleed}`);
    if (unit.statuses.focus) parts.push(`Focus +${unit.statuses.focus}`);
    if (unit.statuses.riposte) parts.push(`Riposte ${unit.statuses.riposte}`);
    if (unit.statuses.summonpower) parts.push(`Summons +${unit.statuses.summonpower}`);
    return parts.join(" · ");
  }
  refreshHud() {
    const set = (hud, u) => {
      const tw = Math.max(0, (hud.w - 4) * u.hp / u.maxHp);
      this.tweens.killTweensOf(hud.bar);
      this.tweens.add({ targets: hud.bar, width: tw, duration: 220, ease: "Cubic.easeOut" });
      hud.hpTxt.setText(`${u.hp}/${u.maxHp}`);
      hud.block.setVisible(u.block > 0);
      hud.block.getByName("t").setText(String(u.block));
      hud.statusTxt.setText(this.statusLine(u));
    };
    set(this.wlHud, this.C.player);
    set(this.hdHud, this.C.enemy);
    this.orbTxt.setText(`${this.C.player.energy}/${this.C.player.maxEnergy}`);
    this.drawTxt.setText(`DRAW  ${this.C.draw.length}`);
    this.discTxt.setText(`${this.C.discard.length}  DISCARD`);
    this.refreshIntent();
  }
  refreshIntent() {
    this.tweens.killTweensOf(this.intentC);
    this.intentC.y = this.groundY - 275;
    this.intentC.removeAll(true);
    if (this.C.over) return;
    const it = this.C.intent();
    const g = this.add.graphics();
    let label;
    if (it.kind === "attack" || (it.kind === "special" && it.dmg !== undefined)) {
      g.lineStyle(3, 0xd9563a).strokeTriangle(-12, 8, 12, 8, 0, -14);
      g.fillStyle(0xd9563a).fillTriangle(-12, 8, 12, 8, 0, -14);
      label = it.hits > 1 ? `${it.dmg}×${it.hits}` : `${it.dmg}`;
      if (it.burn) label += ` +${it.burn}🔥`;
    } else if (it.kind === "special") {           // heal-type gimmick (Mend, Devour)
      g.fillStyle(0x4a9a5a).fillCircle(0, -2, 12);
      g.fillStyle(0xcfe8cf).fillRect(-2, -9, 4, 14).fillRect(-7, -4, 14, 4);
      label = it.heal ? `+${it.heal}` : "";
    } else if (it.kind === "block") {
      g.fillStyle(0x4a7ab6).fillRoundedRect(-13, -13, 26, 26, 7);
      label = `${it.block}`;
    } else {
      g.fillStyle(0xd99a3a).fillCircle(0, -2, 12);
      label = `+${it.str}`;
    }
    this.intentC.add(g);
    this.intentC.add(this.add.text(0, 24, `${it.label}  ${label}`,
      { fontFamily: "Georgia, serif", fontSize: 15, color: "#f0d9b8" }).setOrigin(0.5));
    const specialTips = {
      horncall: `the horn calls a hound: ${it.dmg} x${it.hits}`,
      raisedead: `raises a Risen thrall: ${it.dmg} x${it.hits}`,
      mend: `sews itself shut: heals ${it.heal}`,
      cinder: `a lobbed cinder: ${it.dmg} damage + ${it.burn} Burn`,
      devour: `eats a thrall: heals ${it.heal}, +${it.str} Str`
    };
    const tipStr = {
      attack: `intends to strike for ${it.dmg}${it.hits > 1 ? " x" + it.hits : ""}`,
      special: specialTips[it.id] || "something is coming",
      block: `intends to guard for ${it.block}`,
      buff: `intends to grow stronger (+${it.str} Str)`
    }[it.kind];
    const zone = this.add.zone(0, 0, 120, 70).setInteractive();
    zone.on("pointerover", () => {
      if (this._intentTip) this._intentTip.destroy();
      this._intentTip = this.add.text(this.hdX, this.groundY - 320, tipStr, {
        fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: "#e8cfa8",
        backgroundColor: "#241813", padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setDepth(46);
    });
    zone.on("pointerout", () => { if (this._intentTip) { this._intentTip.destroy(); this._intentTip = null; } });
    this.intentC.add(zone);
    this.tweens.add({ targets: this.intentC, y: this.groundY - 281, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  /* ================= hand ================= */
  async renderHand(popIn) {
    this.handC.removeAll(true);
    const ids = this.C.hand;
    const n = ids.length, cx = 660, cy = 668, spread = Math.min(150, 690 / Math.max(1, n - 1));
    ids.forEach((id, i) => {
      const card = Spire.makeCard(this, id);
      const off = i - (n - 1) / 2;
      const tx = cx + off * spread, ty = cy + Math.abs(off) * 9, ta = off * 3.2;
      card.baseX = tx; card.baseY = ty; card.baseA = ta; card.ix = i;
      card.setPosition(tx, popIn ? 900 : ty).setAngle(ta);
      this.handC.add(card);
      const playable = () => !this.busy && this.C.canPlay(Spire.CARDS[id]);
      card.setInteractive({ useHandCursor: true })
        .on("pointerover", () => { if (this.busy) return; Spire.sfx.hover(); this.handC.bringToTop(card); this.tweens.add({ targets: card, y: ty - 66, scale: 1.16, angle: 0, duration: 120 }); })
        .on("pointerout", () => { this.tweens.add({ targets: card, y: ty, scale: 1, angle: ta, duration: 130 }); this.sortHand(); })
        .on("pointerdown", () => { if (playable()) this.playCard(card); else if (!this.busy) this.shakeCard(card); });
      if (popIn) this.tweens.add({ targets: card, y: ty, duration: 300, delay: i * 70, ease: "Back.easeOut" });
    });
    if (popIn && ids.length) Spire.sfx.draw();
    this.dimUnplayable();
    if (popIn) await Spire.wait(this, 320 + n * 70);
  }
  sortHand() { this.handC.list.slice().sort((a, b) => a.ix - b.ix).forEach(c => this.handC.bringToTop(c)); }
  dimUnplayable() {
    this.handC.list.forEach(c => {
      const ok = this.C.canPlay(Spire.CARDS[c.cardId]);
      c.setAlpha(ok ? 1 : 0.55);
      if (c.hl) c.hl.setVisible(ok && !this.busy);
    });
  }
  shakeCard(card) {
    this.tweens.add({ targets: card, x: card.baseX + 8, duration: 45, yoyo: true, repeat: 3 });
    this.floatText(this.orb.x + 40, this.orb.y - 30, "not enough energy", "#b46ae0", 14);
  }

  /* ================= playing cards ================= */
  async playCard(card) {
    const def = Spire.CARDS[card.cardId];
    if (this.busy || !this.C.canPlay(def)) return;
    this.busy = true;
    Spire.sfx.card();
    if (["succubus", "clawdemon", "dragon", "shamblers", "sheolkiss", "marrowchoir"].includes(def.id)) {
      this.time.delayedCall(420, () => Spire.sfx.summon());
    }
    this.C.spend(def);
    this.refreshHud(); this.dimUnplayable();
    this.handC.bringToTop(card);
    await Spire.tween(this, { targets: card, x: 640, y: 360, scale: 1.28, angle: 0, duration: 200, ease: "Cubic.easeOut" });
    this.tweens.add({ targets: card, alpha: 0, scale: 0.7, duration: 220, delay: 90, onComplete: () => card.destroy() });
    try { await def.choreo(this, this.ctx()); }
    catch (e) { console.error("[choreo]", card.cardId, e); }
    this.wl.play("a_" + this.PP + "_idle");
    if (this.C.player.hp <= 0) { await this.defeat(); return; }
    if (this.C.enemy.hp <= 0) { await this.victory(); return; }
    if (this.hd.anims.currentAnim && !this.hd.anims.isPlaying) this.hd.play("a_" + this.E.prefix + "_idle");
    await this.renderHand(false);
    this.refreshHud();
    this.busy = false;
  }

  /* ================= enemy turn ================= */
  async endTurn() {
    if (this.busy || this.C.over) return;
    this.busy = true;
    this.C.endPlayerTurn();
    await this.renderHand(false);
    await this.banner(this.E.name + "'S TURN", "#d9563a");
    const { burnDmg, bleedDmg } = this.C.startEnemyTurn();
    this.refreshHud();
    if (burnDmg > 0) {
      Spire.sfx.burn();
      this.burnPuff(this.hd.x, this.groundY - 90);
      this.floatText(this.hdX, this.groundY - 240, `-${burnDmg} burn`, "#ff9944", 22);
      await this.react("firehit"); this.refreshHud();
      if (this.C.enemy.hp <= 0) { await this.victory(); return; }
    }
    if (bleedDmg > 0) {            // her opened veins tick, through any guard
      Spire.sfx.hit(false);
      this.blood(this.hd.x - 10, this.groundY - 95);
      this.floatText(this.hdX, this.groundY - 240, `-${bleedDmg} bleed`, "#ff4466", 22);
      await this.react("hurt"); this.refreshHud();
      if (this.C.enemy.hp <= 0) { await this.victory(); return; }
    }
    const ev = this.C.resolveEnemyMove();
    if (ev.kind === "attack") await this.enemyAttack(ev);
    if (ev.riposte !== undefined) {          // the counter stance answered (samurai)
      Spire.sfx.hit(ev.riposte >= 8);
      this.hitFlash(this.hd);
      this.blood(this.hd.x - 15, this.groundY - 100);
      this.floatText(this.hdX, this.groundY - 250, `-${ev.riposte} riposte`, "#ffd97a", 24);
      this.refreshHud();
      await this.react("hurt");
      if (this.C.enemy.hp <= 0) { await this.victory(); return; }
    }
    else if (ev.kind === "block") await this.enemyGuard(ev);
    else if (ev.kind === "special") await this.enemySpecial(ev);
    else await this.enemySnarl(ev);
    this.refreshHud();
    if (this.C.player.hp <= 0) { await this.defeat(); return; }
    const st = this.C.startPlayerTurn();
    this.refreshHud();
    if (st.carried > 0) {          // banked energy rolls into the fresh turn
      Spire.sfx.energy();
      this.floatText(this.orb.x + 52, this.orb.y - 30, `+${st.carried} carried`, "#b46ae0", 18);
      this.tweens.add({ targets: this.orb, scale: 1.2, duration: 150, yoyo: true });
    }
    if (st.focusGain > 0) {        // the parry school pays its debts (samurai)
      Spire.sfx.energy();
      this.floatText(this.orb.x + 52, this.orb.y - 54, `+${st.focusGain} focus`, "#ffd97a", 18);
      this.tweens.add({ targets: this.orb, scale: 1.25, duration: 160, yoyo: true });
    }
    if (st.burnDmg > 0) {          // the Pyre's cinders ticking on her
      Spire.sfx.burn();
      this.burnPuff(this.wlX + 10, this.groundY - 130);
      this.floatText(this.wlX, this.groundY - 250, `-${st.burnDmg} burn`, "#ff9944", 22);
      this.wl.play("a_" + this.PP + "_hurt");
      await Spire.wait(this, 450);
      this.wl.play("a_" + this.PP + "_idle");
      if (this.C.player.hp <= 0) { await this.defeat(); return; }
    }
    await this.renderHand(true);
    await this.banner("YOUR TURN", "#e0b34a");
    this.busy = false;
  }
  blood(x, y) {
    const p = this.add.particles(x, y, "dot", {
      lifespan: 420, speed: { min: 70, max: 210 }, gravityY: 500,
      scale: { start: 0.55, end: 0 }, tint: [0xaa1111, 0x771111], quantity: 10, emitting: false
    }).setDepth(14);
    p.explode(10);
    this.time.delayedCall(520, () => p.destroy());
  }
  /* which flipX makes this.hd visually face `dir` ("left" toward her, or "right" toward home),
     accounting for enemies whose base art already faces right (E.flip). See create()'s note. */
  flipXFor(dir) { return dir === "left" ? !!this.E.flip : !this.E.flip; }
  async enemyAttack(ev) {
    const homeX = this.hdX, pre = this.E.prefix;
    /* ranged foes (the Road Gunner, the Court Necromancer, the Pyre) hold their ground
       and fire a bolt per hit -- true to the original pit game's standoff casters */
    if (this.E.ranged) {
      const tracer = { gunner: 0xffe9a0, necro: 0x88ff99, pyre: 0xffaa44, proctor: 0xbb88ff }[this.E.id] || 0xffe9a0;
      for (let i = 0; i < ev.dealt.length; i++) {
        const swing = Spire.play(this.hd, pre + "_attack");
        Spire.sfx.bolt();
        await Spire.wait(this, 260);
        const b = Spire.spawn(this, "fx_hexbolt", this.hdX - 70, this.groundY - 130, { depth: 15, tint: tracer });
        b.setOrigin(0.5, 0.5).setFlipX(true);
        await Spire.tween(this, { targets: b, x: this.wlX + 40, y: this.groundY - 140, duration: 240, ease: "Sine.easeIn" });
        b.destroy();
        this.cameras.main.shake(110, 0.006);
        this.wl.play("a_" + this.PP + "_hurt");
        if (ev.dealt[i] > 0) { Spire.sfx.hit(ev.dealt[i] >= 10); this.hitFlash(this.wl); this.floatText(this.wlX, this.groundY - 250, `-${ev.dealt[i]}`, "#ff6655", 26); }
        else { Spire.sfx.blocked(); this.shatter(this.wlX + 40, this.groundY - 140); this.floatText(this.wlX, this.groundY - 250, "blocked", "#7ab6e8", 20); }
        this.refreshHud();
        await swing;
      }
      this.hd.play("a_" + pre + "_idle");
      this.wl.play("a_" + this.PP + "_idle");
      return;
    }
    this.hd.play("a_" + pre + "_walk");
    await Spire.tween(this, { targets: this.hd, x: this.wlX + 190, duration: 420, ease: "Sine.easeIn" });
    /* per-move attack animation (2026-08-11): a script move may name its own set
       via mv.anim (e.g. the Second Blade's Crossveil uses kd2_attack2) */
    const atkKey = (ev.anim && this.anims.exists("a_" + ev.anim)) ? ev.anim : pre + "_attack";
    for (let i = 0; i < ev.dealt.length; i++) {
      const swing = Spire.play(this.hd, atkKey);
      Spire.sfx.whoosh();
      await Spire.wait(this, 180);
      this.cameras.main.shake(110, 0.006);
      this.wl.play("a_" + this.PP + "_hurt");
      if (ev.dealt[i] > 0) { Spire.sfx.hit(ev.dealt[i] >= 10); this.hitFlash(this.wl); this.floatText(this.wlX, this.groundY - 250, `-${ev.dealt[i]}`, "#ff6655", 26); }
      else { Spire.sfx.blocked(); this.shatter(this.wlX + 40, this.groundY - 140); this.floatText(this.wlX, this.groundY - 250, "blocked", "#7ab6e8", 20); }
      this.refreshHud();
      await swing;
    }
    this.hd.play("a_" + pre + "_walk"); this.hd.setFlipX(this.flipXFor("right"));
    await Spire.tween(this, { targets: this.hd, x: homeX, duration: 420, ease: "Sine.easeOut" });
    this.hd.setFlipX(this.flipXFor("left")); this.hd.play("a_" + pre + "_idle");
    this.wl.play("a_" + this.PP + "_idle");
  }
  async enemyGuard(ev) {
    Spire.sfx.shield();
    const aura = Spire.spawn(this, "fx_wardaura", this.hdX, this.groundY + 6, { depth: 10, height: 300, tint: 0x66aaff });
    aura.setAlpha(0);
    this.tweens.add({ targets: aura, alpha: 0.9, duration: 160 });
    this.floatText(this.hdX, this.groundY - 240, `+${ev.block} block`, "#7ab6e8", 22);
    await Spire.wait(this, 800);
    await Spire.tween(this, { targets: aura, alpha: 0, duration: 240 }); aura.destroy();
  }
  async enemySnarl(ev) {
    Spire.sfx.roar();
    this.hd.setTint(0xff8866);
    this.floatText(this.hdX, this.groundY - 250, `+${ev.str} STR`, "#d99a3a", 24);
    const puff = this.add.particles(this.hdX, this.groundY - 110, "dot", {
      lifespan: 420, speed: { min: 60, max: 160 }, scale: { start: 0.7, end: 0 },
      tint: 0xd9563a, quantity: 14, blendMode: "ADD", emitting: false
    }).setDepth(14);
    puff.explode(14);
    await Spire.tween(this, { targets: this.hd, scale: this.hd.scale * 1.13, duration: 190, yoyo: true, repeat: 1 });
    this.baseTint();
    this.time.delayedCall(600, () => puff.destroy());
  }
  /* boss/act gimmicks, one per act roster:
     horncall (Hound Master), mend (the Stitcher), raisedead (the Court Necromancer),
     cinder (the Pyre), devour (the Champ). All engine-sequenced, per the summon rule. */
  async enemySpecial(ev) {
    if (this.E.vo && this.E.vo.special) Spire.say(this, this.E.vo.special);   // he calls his move
    if (ev.id === "mend") return this.enemyMend(ev);
    if (ev.id === "raisedead") return this.enemyRaiseDead(ev);
    if (ev.id === "cinder") return this.enemyCinder(ev);
    if (ev.id === "devour") return this.enemyDevour(ev);
    if (ev.id !== "horncall") return this.enemySnarl({ str: 2 });
    Spire.sfx.roar();
    this.hd.setTint(0xffcc66);
    this.floatText(this.hdX, this.groundY - 255, "HORN CALL", "#ffd97a", 24);
    await Spire.tween(this, { targets: this.hd, scale: this.hd.scale * 1.08, duration: 200, yoyo: true });
    this.hd.clearTint();
    const dog = Spire.spawn(this, "hd_walk", 1420, this.groundY, { depth: 12, height: 210, flipX: true });  // hound art faces right natively; it charges (and later exits) leftward
    await Spire.tween(this, { targets: dog, x: this.wlX + 180, duration: 520, ease: "Sine.easeIn" });
    for (let i = 0; i < ev.hits; i++) {
      const bite = Spire.play(dog, "hd_attack");
      Spire.sfx.whoosh();
      await Spire.wait(this, 170);
      const lost = this.C.hurt(this.C.player, ev.dmg);
      if (this.C.player.hp === 0) this.C.over = true;
      if (lost > 0) { Spire.sfx.hit(false); this.hitFlash(this.wl); } else Spire.sfx.blocked();
      this.cameras.main.shake(110, 0.006);
      this.wl.play("a_" + this.PP + "_hurt");
      this.floatText(this.wlX, this.groundY - 250, lost > 0 ? `-${lost}` : "blocked", lost > 0 ? "#ff6655" : "#7ab6e8", lost > 0 ? 26 : 20);
      this.refreshHud();
      await bite;
      if (this.C.player.hp <= 0) break;
    }
    dog.play("a_hd_walk");
    await Spire.tween(this, { targets: dog, x: -180, duration: 520, ease: "Sine.easeIn" });
    dog.destroy();
    this.wl.play("a_" + this.PP + "_idle");
  }
  /* the Stitcher sews itself back together */
  async enemyMend(ev) {
    const swing = Spire.play(this.hd, this.E.prefix + "_attack");
    await Spire.wait(this, 300);
    Spire.sfx.heal();
    this.C.heal(this.C.enemy, ev.heal);
    this.floatText(this.hdX, this.groundY - 250, `+${ev.heal}`, "#7ce87c", 24);
    const motes = this.add.particles(this.hdX, this.groundY - 110, "dot", {
      lifespan: 700, speedY: { min: -90, max: -30 }, speedX: { min: -40, max: 40 },
      scale: { start: 0.55, end: 0 }, tint: 0x7ce87c, quantity: 3, frequency: 50, blendMode: "ADD"
    }).setDepth(14);
    this.refreshHud();
    await swing;
    this.time.delayedCall(500, () => { motes.stop(); this.time.delayedCall(700, () => motes.destroy()); });
    this.hd.play("a_" + this.E.prefix + "_idle");
  }
  /* the Court Necromancer raises a Risen thrall that claws her and crumbles */
  async enemyRaiseDead(ev) {
    Spire.sfx.debuff();
    const cast = Spire.play(this.hd, this.E.prefix + "_attack");
    this.floatText(this.hdX, this.groundY - 255, "RAISE DEAD", "#9fe8a0", 24);
    await Spire.wait(this, 420);
    const rx = this.wlX + 260;
    const p = this.add.particles(rx, this.groundY - 6, "dot", {
      lifespan: 480, speed: { min: 50, max: 170 }, angle: { min: 220, max: 320 },
      scale: { start: 0.8, end: 0 }, tint: 0x8a9a7a, quantity: 12, emitting: false
    }).setDepth(13);
    p.explode(12);
    const risen = Spire.spawn(this, "sk_idle", rx, this.groundY, { depth: 12, height: 210, tint: 0xaaffcc });
    risen.scaleY = 0.02;
    await Spire.tween(this, { targets: risen, scaleY: risen.scaleX, duration: 420, ease: "Back.easeOut" });
    await cast;
    risen.play("a_sk_walk");
    await Spire.tween(this, { targets: risen, x: this.wlX + 170, duration: 380, ease: "Sine.easeIn" });
    for (let i = 0; i < ev.hits; i++) {
      const claw = Spire.play(risen, "sk_attack");
      Spire.sfx.whoosh();
      await Spire.wait(this, 180);
      const lost = this.C.hurt(this.C.player, ev.dmg);
      if (this.C.player.hp === 0) this.C.over = true;
      if (lost > 0) { Spire.sfx.hit(false); this.hitFlash(this.wl); } else Spire.sfx.blocked();
      this.cameras.main.shake(100, 0.005);
      this.wl.play("a_" + this.PP + "_hurt");
      this.floatText(this.wlX, this.groundY - 250, lost > 0 ? `-${lost}` : "blocked", lost > 0 ? "#ff6655" : "#7ab6e8", lost > 0 ? 26 : 20);
      this.refreshHud();
      await claw;
      if (this.C.player.hp <= 0) break;
    }
    risen.setTint(0x778866);
    this.time.delayedCall(500, () => p.destroy());
    await Spire.play(risen, "sk_death");
    this.tweens.add({ targets: risen, alpha: 0, duration: 320, onComplete: () => risen.destroy() });
    this.hd.play("a_" + this.E.prefix + "_idle");
    this.wl.play("a_" + this.PP + "_idle");
  }
  /* the Pyre lobs a cinder: damage now, Burn ticking on HER turns after */
  async enemyCinder(ev) {
    const cast = Spire.play(this.hd, this.E.prefix + "_attack");
    Spire.sfx.bolt();
    await Spire.wait(this, 320);
    const fb = Spire.spawn(this, "fx_firebolt", this.hdX - 70, this.groundY - 140, { depth: 15 });
    fb.setOrigin(0.5, 0.5).setFlipX(true);
    await Spire.tween(this, { targets: fb, x: this.wlX + 40, y: this.groundY - 130, duration: 300, ease: "Sine.easeIn" });
    fb.destroy();
    this.burnPuff(this.wlX + 20, this.groundY - 120);
    const lost = this.C.hurt(this.C.player, ev.dmg);
    if (this.C.player.hp === 0) this.C.over = true;
    this.C.addStatus(this.C.player, "burn", ev.burn);
    Spire.sfx.burn();
    this.cameras.main.shake(110, 0.006);
    this.wl.play("a_" + this.PP + "_hurt");
    this.floatText(this.wlX, this.groundY - 250, lost > 0 ? `-${lost}` : "blocked", lost > 0 ? "#ff6655" : "#7ab6e8", lost > 0 ? 26 : 20);
    this.floatText(this.wlX, this.groundY - 215, `+${ev.burn} burn`, "#ff9944", 20);
    this.refreshHud();
    await cast;
    this.hd.play("a_" + this.E.prefix + "_idle");
    this.wl.play("a_" + this.PP + "_idle");
  }
  /* the Champ's table manners: a thrall shambles in, and he eats it */
  async enemyDevour(ev) {
    Spire.sfx.roar();
    this.floatText(this.hdX, this.groundY - 255, "DEVOUR", "#ffd97a", 24);
    const thrall = Spire.spawn(this, "sk_walk", 1420, this.groundY, { depth: 12, height: 200, tint: 0xccbbaa });
    await Spire.tween(this, { targets: thrall, x: this.hdX + 150, duration: 460, ease: "Sine.easeIn" });
    thrall.play("a_sk_idle");
    this.hd.setFlipX(this.flipXFor("right"));                       // he turns to his meal
    const bite = Spire.play(this.hd, this.E.prefix + "_attack");
    await Spire.wait(this, 260);
    Spire.sfx.hit(true);
    this.hitFlash(thrall);
    const gore = this.add.particles(thrall.x - 10, this.groundY - 90, "dot", {
      lifespan: 420, speed: { min: 70, max: 210 }, gravityY: 500,
      scale: { start: 0.55, end: 0 }, tint: [0xccccaa, 0x998877], quantity: 10, emitting: false
    }).setDepth(14);
    gore.explode(10);
    this.time.delayedCall(520, () => gore.destroy());
    await Spire.play(thrall, "sk_death");
    this.tweens.add({ targets: thrall, alpha: 0, duration: 260, onComplete: () => thrall.destroy() });
    await bite;
    this.hd.setFlipX(this.flipXFor("left"));
    Spire.sfx.heal();
    this.C.heal(this.C.enemy, ev.heal);
    this.C.addStatus(this.C.enemy, "str", ev.str);
    this.floatText(this.hdX, this.groundY - 250, `+${ev.heal}`, "#7ce87c", 24);
    this.floatText(this.hdX, this.groundY - 215, `+${ev.str} STR`, "#d99a3a", 20);
    await Spire.tween(this, { targets: this.hd, scale: this.hd.scale * 1.1, duration: 200, yoyo: true });
    this.refreshHud();
    this.hd.play("a_" + this.E.prefix + "_idle");
  }

  /* ================= outcomes ================= */
  async victory() {
    this.busy = true;
    this.intentC.removeAll(true);
    Spire.run.hp = this.C.player.hp;
    Spire.clearNode();
    if (this.E.vo && this.E.vo.death && (!this.E.voChar || this.E.voChar === Spire.run.character)) Spire.say(this, this.E.vo.death);   // last words
    await this.react(this.E.prefix + "_death", { stay: true, raw: true });
    const soul = this.add.particles(this.hdX, this.groundY - 70, "dot", {
      lifespan: 1300, speedY: { min: -120, max: -40 }, speedX: { min: -30, max: 30 },
      scale: { start: 0.6, end: 0 }, tint: [0xbb88ff, 0xe0b34a], quantity: 2, frequency: 40, blendMode: "ADD"
    }).setDepth(14);
    this.tweens.add({ targets: this.hd, alpha: 0.15, duration: 1200 });
    if (this.E.boss) Spire.sfx.fanfare(); else Spire.sfx.victory();
    await this.banner("V I C T O R Y", "#e0b34a", 1200);
    soul.destroy();
    Spire.won = true;
    this.cameras.main.fadeOut(450);
    await Spire.wait(this, 470);
    if (this.E.id === "kagehime") this.scene.start("Epilogue");   // the duel won -> the Ashenveil
    else if (this.E.boss) this.scene.start("ActClear");
    else this.scene.start("Reward", { elite: !!this.E.elite });
  }
  async defeat() {
    Spire.sfx.defeat();
    this.busy = true;
    this.isDefeat = true;
    Spire.run.over = true;
    this.intentC.removeAll(true);
    this.wl.play("a_" + this.PP + "_hurt");
    this.add.rectangle(640, 360, 1280, 720, 0x0a0505, 0.62).setDepth(60);
    this.add.text(640, 300, "SHE FALLS", { fontFamily: "Georgia, serif", fontSize: 54, color: "#b03a2e" }).setOrigin(0.5).setDepth(61);
    this.add.text(640, 352, "…the Pit keeps her cards. The climb begins anew.", { fontFamily: "Georgia, serif", fontSize: 18, fontStyle: "italic", color: "#caa26a" }).setOrigin(0.5).setDepth(61);
    this.add.rectangle(640, 430, 210, 52, 0x3a2420).setStrokeStyle(2, 0xe0b34a).setDepth(61)
      .setInteractive({ useHandCursor: true }).on("pointerdown", () => { Spire.newRun(); this.scene.start("Map"); });
    this.add.text(640, 430, "RISE AGAIN", { fontFamily: "Georgia, serif", fontSize: 20, color: "#e8cfa8" }).setOrigin(0.5).setDepth(62);
  }

  /* MvC-STYLE EX CUT-IN (2026-08-11, Hiro's ask): the big cards announce themselves.
     Dim the arena, streak speedlines, slam the move's own art across the screen with
     its name — and sometimes someone in the dark says something about it. */
  async exCutIn(animKey, label, tint = 0xe0b34a) {
    const s = this;
    const junk = [];
    const dim = s.add.rectangle(640, 360, 1280, 720, 0x000000, 0.68).setDepth(48);
    junk.push(dim);
    for (let i = 0; i < 14; i++) {
      const r = s.add.rectangle(1500, Phaser.Math.Between(30, 690), Phaser.Math.Between(180, 430),
                                Phaser.Math.Between(2, 4), tint, 0.5).setDepth(49).setBlendMode(Phaser.BlendModes.ADD);
      junk.push(r);
      s.tweens.add({ targets: r, x: -260, duration: Phaser.Math.Between(280, 430), delay: i * 20, repeat: 2 });
    }
    const big = Spire.spawn(s, animKey, -260, 660, { depth: 50, height: 560 });
    junk.push(big);
    const txt = s.add.text(900, 580, label, {
      fontFamily: "Georgia, serif", fontSize: 42, color: "#ffe9b0", letterSpacing: 5,
      stroke: "#1a0e08", strokeThickness: 8
    }).setOrigin(0.5).setDepth(51).setAlpha(0);
    junk.push(txt);
    Spire.sfx.whoosh(); Spire.sfx.card();
    await Spire.tween(s, { targets: big, x: 350, duration: 300, ease: "Expo.easeOut" });
    s.cameras.main.flash(120, 255, 240, 200);
    s.tweens.add({ targets: txt, alpha: 1, duration: 150 });
    if (Math.random() < 0.45) {   // a voice from beyond the arena
      const kd = Spire.run.character === "samurai";
      const q = Phaser.Utils.Array.GetRandom(kd
        ? ["somewhere in the dark, steel students stop breathing…", "“the Ieyasu draw. I thought it was a rumor.”", "even the crows go quiet for this one.", "“do not blink. you will miss the year's best lesson.”"]
        : ["somewhere, the Firebird whistles low…", "“That grade of ember-work isn't SOLD anywhere.”", "the dark between the braziers leans in to watch.", "“gods. the ledger never had a page for THAT.”"]);
      const bt = s.add.text(640, 692, q, {
        fontFamily: "Georgia, serif", fontSize: 14, fontStyle: "italic", color: "#caa26a",
        stroke: "#120a08", strokeThickness: 4
      }).setOrigin(0.5).setDepth(51);
      junk.push(bt);
    }
    await Spire.wait(s, 640);
    await Spire.tween(s, { targets: junk, alpha: 0, duration: 170 });
    junk.forEach(o => o.destroy());
  }

  /* ================= choreography context ================= */
  ctx() {
    const s = this;
    return {
      C: s.C, wl: s.wl, hd: s.hd, wlX: s.wlX, hdX: s.hdX, groundY: s.groundY, prefix: s.E.prefix,
      exCutIn: (k, l, t) => s.exCutIn(k, l, t),
      wlIdle: async () => { s.wl.play("a_" + s.PP + "_idle"); },
      applyHit(base) {
        const n = s.C.playerHits(base);
        const lost = s.C.hurt(s.C.enemy, n);
        if (lost > 0) {
          Spire.sfx.hit(lost >= 10);
          s.hitFlash(s.hd);
          if (lost >= 12) s.punchZoom();
          s.floatText(s.hdX + Phaser.Math.Between(-25, 25), s.groundY - 235, `-${lost}`, "#ff6655", Math.min(40, 24 + lost));
          /* THIRST (life-steal package): every landed hit drinks. Crimson mote drifts
             home so the heal reads as coming OFF the wound, not from nowhere. */
          const th = s.C.player.statuses.thirst || 0;
          if (th > 0) {
            const got = s.C.heal(s.C.player, th);
            const m = s.add.circle(s.hdX - 20, s.groundY - 110, 5, 0xdd2244).setDepth(16).setAlpha(0.95);
            s.tweens.add({ targets: m, x: s.wlX + 20, y: s.groundY - 170, duration: 380, ease: "Sine.easeIn",
                           onComplete: () => m.destroy() });
            if (got > 0) s.time.delayedCall(380, () => {
              s.floatText(s.wlX, s.groundY - 250, `+${got}`, "#7ce87c", 18);
              s.refreshHud();
            });
          }
        } else {
          Spire.sfx.blocked();
          s.shatter(s.hdX - 20, s.groundY - 110);
          s.floatText(s.hdX + Phaser.Math.Between(-25, 25), s.groundY - 235, "blocked", "#7ab6e8", 20);
        }
        s.refreshHud();
        return lost;
      },
      /* summons/transformations hit through summonHits(), so Blood Pact / Dark Covenant's
         "+N summon damage this combat" actually lands. Same presentation as applyHit. */
      applySummonHit(base) {
        const n = s.C.summonHits(base);
        const lost = s.C.hurt(s.C.enemy, n);
        if (lost > 0) {
          Spire.sfx.hit(lost >= 10);
          s.hitFlash(s.hd);
          if (lost >= 12) s.punchZoom();
          s.floatText(s.hdX + Phaser.Math.Between(-25, 25), s.groundY - 235, `-${lost}`, "#ff6655", Math.min(40, 24 + lost));
        } else {
          Spire.sfx.blocked();
          s.shatter(s.hdX - 20, s.groundY - 110);
          s.floatText(s.hdX + Phaser.Math.Between(-25, 25), s.groundY - 235, "blocked", "#7ab6e8", 20);
        }
        s.refreshHud();
        return lost;
      },
      selfDamage(n) { Spire.sfx.hit(false); s.C.hurt(s.C.player, n, true); s.floatText(s.wlX, s.groundY - 250, `-${n}`, "#ff6655", 22); s.refreshHud(); },
      applyBlock(n) { Spire.sfx.shield(); s.C.player.block += n; s.floatText(s.wlX, s.groundY - 250, `+${n} block`, "#7ab6e8", 22); s.refreshHud(); },
      applyHeal(n) {
        const got = s.C.heal(s.C.player, n);
        Spire.sfx.heal();
        s.floatText(s.wlX, s.groundY - 250, got > 0 ? `+${got}` : "full", "#7ce87c", 22);
        s.refreshHud();
        return got;                                    // cards read this for overheal payoffs
      },
      applyBleed(n) {
        Spire.sfx.debuff();
        s.C.addStatus(s.C.enemy, "bleed", n);
        s.blood(s.hdX - 20, s.groundY - 95);
        s.floatText(s.hdX, s.groundY - 215, `+${n} bleed`, "#ff4466", 20);
        s.refreshHud();
      },
      applyFocus(n) {
        Spire.sfx.buff();
        s.C.addStatus(s.C.player, "focus", n);
        s.floatText(s.wlX, s.groundY - 215, `+${n} focus`, "#ffd97a", 20);
        s.refreshHud();
      },
      applyRiposte(n) {
        Spire.sfx.buff();
        s.C.player.statuses.riposte = Math.max(s.C.player.statuses.riposte || 0, n);
        s.floatText(s.wlX, s.groundY - 240, `riposte ${n}`, "#ffd97a", 20);
        s.refreshHud();
      },
      applyThirst(n) {
        Spire.sfx.buff();
        s.C.addStatus(s.C.player, "thirst", n);
        s.floatText(s.wlX, s.groundY - 215, `+${n} thirst`, "#dd4466", 20);
        s.refreshHud();
      },
      raiseMaxHp(n) {
        Spire.run.maxHp += n; s.C.player.maxHp += n; s.C.heal(s.C.player, n);
        Spire.sfx.heal();
        s.floatText(s.wlX, s.groundY - 250, `+${n} MAX HP`, "#ffd97a", 22);
        s.refreshHud();
      },
      applyStatus(unit, k, n) {
        Spire.sfx[k === "burn" ? "burn" : k === "weak" ? "debuff" : "buff"]();
        s.C.addStatus(unit, k, n);
        const x = unit === s.C.enemy ? s.hdX : s.wlX;
        const label = { burn: `+${n} burn`, weak: `+${n} weak`, str: `+${n} str` }[k] || k;
        s.floatText(x, s.groundY - 215, label, { burn: "#ff9944", weak: "#9ecf6a", str: "#d99a3a" }[k] || "#fff", 20);
        s.refreshHud();
      },
      applySummonPower(n) {
        Spire.sfx.buff();
        s.C.player.statuses.summonpower = (s.C.player.statuses.summonpower || 0) + n;
        s.floatText(s.wlX, s.groundY - 215, `+${n} summon dmg`, "#ff6688", 20);
        s.refreshHud();
      },
      gainEnergy(n) {
        Spire.sfx.energy();
        s.C.player.energy += n;
        s.floatText(s.orb.x + 46, s.orb.y - 28, `+${n}`, "#b46ae0", 22);
        s.tweens.add({ targets: s.orb, scale: 1.25, duration: 140, yoyo: true });
        s.refreshHud(); s.dimUnplayable();
      },
      drawCards(n) { s.C.drawCards(n); s.renderHand(false); s.refreshHud(); },
      react: (kind, opts) => s.react(kind, opts),
      shake(n) { s.cameras.main.shake(130, n * 0.0011); },
      flash(color, ms) { s.cameras.main.flash(ms || 100, (color >> 16) & 255, (color >> 8) & 255, color & 255); },
      impact(x, y, tint) {
        const im = s.add.image(x, y, "fx_fireballhit_1").setDepth(15).setTint(tint || 0xffffff).setAlpha(0.95);
        im.setScale(180 / im.height * 0.4);
        s.tweens.add({ targets: im, scale: 180 / im.height, alpha: 0, duration: 300, onComplete: () => im.destroy() });
      },
      async bolt(key, x0, y0, x1, y1, opts) {
        opts = opts || {};
        Spire.sfx.bolt();
        const b = Spire.spawn(s, key, x0, y0, { depth: 15, tint: opts.tint });
        b.setOrigin(0.5, 0.5);
        b.setAngle(Phaser.Math.RadToDeg(Math.atan2(y1 - y0, x1 - x0)));
        if (!opts.arc) await Spire.tween(s, { targets: b, x: x1, y: y1, duration: opts.dur || 350, ease: "Sine.easeIn" });
        else {
          const my = Math.min(y0, y1) - opts.arc;
          await Spire.tween(s, {
            targets: b, x: x1, duration: opts.dur || 500,
            onUpdate: tw => {
              const t = tw.progress;
              b.y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1;
            }
          });
        }
        b.destroy();
      },
      boltSprite(key, x, y, opts) {
        const b = Spire.spawn(s, key, x, y, opts || {});
        b.setOrigin(0.5, 0.5).setDepth(15);
        return b;
      },
      async portal(x, y, tint) {
        Spire.sfx.portal();
        const p = Spire.spawn(s, "fx_wardaura", x, y, { depth: 11, height: 300, tint: tint || 0xbb66ff });
        p.setAlpha(0);
        await Spire.tween(s, { targets: p, alpha: 0.95, duration: 200 });
        p.close = async () => { await Spire.tween(s, { targets: p, alpha: 0, duration: 240 }); p.destroy(); };
        return p;
      },
      afterimage(sprite, delay) {
        s.time.delayedCall(delay || 0, () => {
          if (!sprite.active) return;
          const g = s.add.image(sprite.x, sprite.y, sprite.texture.key)
            .setOrigin(sprite.originX, sprite.originY).setScale(sprite.scaleX, sprite.scaleY)
            .setFlipX(sprite.flipX).setDepth(sprite.depth - 1).setTint(0x9955ff).setAlpha(0.5);
          s.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
        });
      },
      dust(x, y, tint) {
        const p = s.add.particles(x, y - 6, "dot", {
          lifespan: 480, speed: { min: 50, max: 170 }, angle: { min: 220, max: 320 },
          scale: { start: 0.8, end: 0 }, tint: tint || 0xa8917a, quantity: 12, emitting: false
        }).setDepth(13);
        p.explode(12);
        s.time.delayedCall(600, () => p.destroy());
      },
      blood(x, y) {
        const p = s.add.particles(x, y, "dot", {
          lifespan: 420, speed: { min: 70, max: 210 }, gravityY: 500,
          scale: { start: 0.55, end: 0 }, tint: [0xaa1111, 0x771111], quantity: 10, emitting: false
        }).setDepth(14);
        p.explode(10);
        s.time.delayedCall(520, () => p.destroy());
      },
      hearts(x, y) {
        const p = s.add.particles(x, y, "dot", {
          lifespan: 750, speedY: { min: -90, max: -40 }, speedX: { min: -40, max: 40 },
          scale: { start: 0.6, end: 0 }, tint: 0xff88bb, quantity: 3, frequency: 70, blendMode: "ADD"
        }).setDepth(15);
        s.time.delayedCall(700, () => { p.stop(); s.time.delayedCall(800, () => p.destroy()); });
      },
      flameCone(x0, y0, x1, y1) {
        const ang = Phaser.Math.RadToDeg(Math.atan2(y1 - y0, x1 - x0));
        const p = s.add.particles(x0, y0, "dot", {
          lifespan: 380, speed: { min: 520, max: 760 }, angle: { min: ang - 9, max: ang + 9 },
          scale: { start: 1.15, end: 0.1 }, tint: [0xffdd66, 0xff9933, 0xdd4411],
          quantity: 6, frequency: 14, blendMode: "ADD"
        }).setDepth(15);
        s.time.delayedCall(620, () => { p.stop(); s.time.delayedCall(420, () => p.destroy()); });
        for (let i = 0; i < 3; i++) {
          s.time.delayedCall(i * 130, () => {
            const f = Spire.spawn(s, "fx_firebolt", x0 + 30, y0, { depth: 15 });
            f.setOrigin(0.5, 0.5).setAngle(ang);
            s.tweens.add({ targets: f, x: x1, y: y1, duration: 300, ease: "Sine.easeIn", onComplete: () => f.destroy() });
          });
        }
      },
      burnPuff: (x, y) => s.burnPuff(x, y)
    };
  }
  hitFlash(sprite) {
    if (!sprite || !sprite.active) return;
    sprite.setTintFill(0xffffff);
    this.time.delayedCall(70, () => {
      if (!sprite.active) return;
      sprite.clearTint();
      if (sprite === this.hd) this.baseTint();   // keep the Frost Wight frosty
    });
  }
  punchZoom() {
    const cam = this.cameras.main;
    this.tweens.killTweensOf(cam);
    cam.zoom = 1;
    this.tweens.add({ targets: cam, zoom: 1.035, duration: 70, yoyo: true, ease: "Sine.easeOut" });
  }
  shatter(x, y) {
    const p = this.add.particles(x, y, "dot", {
      lifespan: 380, speed: { min: 90, max: 240 }, scale: { start: 0.6, end: 0 },
      tint: [0x7ab6e8, 0xcfe8ff], quantity: 12, emitting: false, blendMode: "ADD"
    }).setDepth(15);
    p.explode(12);
    this.time.delayedCall(480, () => p.destroy());
  }
  pileView(ids, title) {
    if (this._pile) { this._pile.destroy(); this._pile = null; return; }
    if (!ids.length) { this.floatText(640, 620, "empty", "#9a8264", 16); return; }
    const grid = this.add.container(0, 0).setDepth(70);
    grid.add(this.add.rectangle(640, 360, 1280, 720, 0x0a0705, 0.88).setInteractive()
      .on("pointerdown", () => { grid.destroy(); this._pile = null; }));
    grid.add(this.add.text(640, 44, title + "  —  click anywhere to close", { fontFamily: "Georgia, serif", fontSize: 19, color: "#e8cfa8" }).setOrigin(0.5));
    const sorted = ids.slice().sort((a, b) => Spire.CARDS[a].name.localeCompare(Spire.CARDS[b].name));
    const cols = Math.min(8, sorted.length);
    sorted.forEach((id, i) => {
      const card = Spire.makeCard(this, id);
      card.setScale(0.6);
      card.setPosition(640 + ((i % cols) - (cols - 1) / 2) * 148, 180 + Math.floor(i / cols) * 150);
      grid.add(card);
    });
    this._pile = grid;
  }
  burnPuff(x, y) {
    const p = this.add.particles(x, y, "dot", {
      lifespan: 500, speedY: { min: -130, max: -50 }, speedX: { min: -35, max: 35 },
      scale: { start: 0.9, end: 0 }, tint: [0xffaa44, 0xdd5511], quantity: 16, emitting: false, blendMode: "ADD"
    }).setDepth(14);
    p.explode(16);
    this.time.delayedCall(600, () => p.destroy());
  }
  /* enemy reaction: kind -> bespoke sheet if the enemy has one, else its generic hurt.
     opts.raw plays the given key literally (used for death anims). */
  react(kind, opts) {
    opts = opts || {};
    let key;
    if (opts.raw) key = kind;
    else key = (this.E.reactions && this.E.reactions[kind]) || (this.E.prefix + "_hurt");
    if (!this.anims.exists("a_" + key)) key = this.E.prefix + "_hurt";
    return new Promise(resolve => {
      const done = async () => {
        if (opts.holdLast) await Spire.wait(this, opts.holdLast);
        if (!opts.stay && this.C.enemy.hp > 0) this.hd.play("a_" + this.E.prefix + "_idle");
        resolve();
      };
      this.hd.once("animationcomplete", done);
      this.hd.play("a_" + key);
    });
  }

  floatText(x, y, str, color, size) {
    const t = this.add.text(x, y, str, {
      fontFamily: "Georgia, serif", fontSize: size || 22, color, stroke: "#1a0e08", strokeThickness: 4
    }).setOrigin(0.5).setDepth(45);
    this.tweens.add({ targets: t, y: y - 52, alpha: 0, duration: 950, ease: "Cubic.easeOut", onComplete: () => t.destroy() });
  }
  banner(str, color, hold) {
    return new Promise(resolve => {
      const t = this.add.text(640, 330, str, {
        fontFamily: "Georgia, serif", fontSize: 46, color, letterSpacing: 6,
        stroke: "#1a0e08", strokeThickness: 6
      }).setOrigin(0.5).setDepth(55).setAlpha(0).setScale(0.8);
      this.tweens.add({ targets: t, alpha: 1, scale: 1, duration: 240, ease: "Back.easeOut" });
      this.time.delayedCall(hold || 900, () => {
        this.tweens.add({ targets: t, alpha: 0, y: 300, duration: 260, onComplete: () => { t.destroy(); resolve(); } });
      });
    });
  }

  /* ================= debug hooks (used by the headless tests) ================= */
  buildDebugHooks() {
    window.fightScene = this;
    window.spireState = () => JSON.stringify({
      php: this.C.player.hp, ehp: this.C.enemy.hp, energy: this.C.player.energy,
      hand: this.C.hand.slice(), draw: this.C.draw.length, discard: this.C.discard.length,
      busy: this.busy, over: this.C.over, turn: this.C.turn, defeat: !!this.isDefeat,
      enemy: this.E.id, deckSize: Spire.run ? Spire.run.deck.length : -1
    });
    window.spirePlay = (id) => {
      if (this.busy) return "busy";
      if (!Spire.CARDS[id]) return "unknown";
      if (!this.C.hand.includes(id)) this.C.hand.push(id);
      this.C.player.energy = Math.max(this.C.player.energy, Spire.CARDS[id].cost);
      this.renderHand(false);
      const card = this.handC.list.find(c => c.cardId === id);
      if (card) this.playCard(card);
      return "ok";
    };
    window.spireEndTurn = () => { this.endTurn(); return "ok"; };
  }
}
