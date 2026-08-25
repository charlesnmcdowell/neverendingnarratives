/* MapScene — the road map for the current ACT, driven by the run state: position,
   cleared nodes, available paths. Act 1 climbs the Pit; Act 2 works the back alleys;
   Act 3 hunts the night shipment up the west road. Every node type is a real encounter. */
class MapScene extends Phaser.Scene {
  constructor() { super("Map"); }
  init(data) { this._toast = data && data.toast; }

  create() {
    this._leaving = false;   // instance-reuse guard: blocks double-enter during a delayed transition
    if (!Spire.run || Spire.run.over) Spire.newRun();
    const run = Spire.run;
    const ACT = Spire.act();
    Spire.playMusic(ACT.music);

    const far = this.add.image(640, 340, ACT.mapBg);
    far.setScale(Math.max(1280 / far.width, 760 / far.height) * 1.05);
    this.add.rectangle(640, 360, 1280, 720, run.act === 3 ? 0x040608 : 0x0a0705, 0.72);
    this.add.particles(0, 0, "dot", {
      x: { min: 0, max: 1280 }, y: 740, lifespan: 6400, speedY: { min: -34, max: -10 },
      scale: { start: 0.4, end: 0 }, quantity: 1, frequency: 260,
      tint: run.act === 3 ? [0x7fe8d0, 0x9fd4ff] : [0xff9944, 0xe0b34a],
      alpha: { start: 0.6, end: 0 }, blendMode: "ADD"
    });

    this.add.text(640, 40, ACT.name, {
      fontFamily: "Georgia, serif", fontSize: 30, color: "#e0b34a", letterSpacing: 7,
      stroke: "#1a0e08", strokeThickness: 5
    }).setOrigin(0.5).setDepth(30);
    const subtitle = run.pos === null ? ACT.tag + " — the road begins at the bottom"
      : run.pos.r >= run.map.length - 1 ? "nothing left but the one who waits"
      : `${ACT.tag} — floor ${run.pos.r + 1} of ${run.map.length}`;
    this.add.text(640, 74, subtitle, { fontFamily: "Georgia, serif", fontSize: 14, fontStyle: "italic", color: "#caa26a" }).setOrigin(0.5).setDepth(30);
    this.add.text(24, 20, `HP ${run.hp}/${run.maxHp}   deck ${run.deck.length}   act ${run.act}/${Spire.LAST_ACT}`,
      { fontFamily: "Georgia, serif", fontSize: 15, color: "#caa26a" }).setDepth(30);

    /* floor numerals up the left side */
    const NUM = ["I", "II", "III", "IV", "V", "VI", "VII"];
    run.map.forEach((row, r) => this.add.text(150, row[0].y - 6, NUM[r] || String(r + 1), {
      fontFamily: "Georgia, serif", fontSize: 17, color: r === (run.pos ? run.pos.r : -1) ? "#e0b34a" : "#5a4a34"
    }).setOrigin(0.5).setDepth(30));

    this.musTxt = this.add.text(1252, 16, Spire.musicOn ? "♪ on" : "♪ off",
      { fontFamily: "Georgia, serif", fontSize: 16, color: "#caa26a" }).setOrigin(1, 0).setDepth(30)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => { Spire.sfx.click(); Spire.toggleMusic(); this.musTxt.setText(Spire.musicOn ? "♪ on" : "♪ off"); });
    this.add.text(1252, 44, "⛶", { fontSize: 20, color: "#caa26a" }).setOrigin(1, 0).setDepth(30)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => { Spire.sfx.click(); if (this.scale.isFullscreen) { this.scale.stopFullscreen(); Spire._savePref("spire_fs", false); } else { this.scale.startFullscreen(); Spire._savePref("spire_fs", true); } });

    this.drawMap(run.map);
    if (this._toast) this.toast(this._toast);

    /* the act's gate line plays once, on first arrival */
    run._mapVO = run._mapVO || {};
    if (run.pos === null && ACT.mapVO && !run._mapVO[run.act]) {
      run._mapVO[run.act] = true;
      Spire.say(this, ACT.mapVO);
    }

    this.add.text(24, 690, "◄ title", { fontFamily: "Georgia, serif", fontSize: 16, color: "#9a8264" })
      .setDepth(30).setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.scene.start("Title"));
    this.cameras.main.fadeIn(400);
    window.mapScene = this;   // debug/testing hook
  }

  nodeArt(n) {
    if (!n.enemy) return null;
    const E = Spire.ENEMIES[n.enemy];
    return E ? E.prefix + "_idle_1" : null;
  }
  nodeGlyph(type) { return { rest: "▲", treasure: "◆", unknown: "?", inn: "🍺", cage: "⛓", tavern: "♪" }[type]; }
  nodeLabel(type, enemy) {
    if (type === "fight") return {
      hound: "HOUND", skel: "SKELETON", brute: "BRUTE",
      hook: "HOOK", gunner: "GUNNER", stitch: "STITCHER",
      chain: "CHAIN", pyre: "PYRE", wight: "WIGHT"
    }[enemy] || "FIGHT";
    return { elite: "ELITE", boss: "BOSS", rest: "REST", treasure: "LOOT", unknown: "???",
             tavern: "TAVERN", inn: "THE INN", cage: "THE CAGE" }[type];
  }

  drawMap(rows) {
    const run = Spire.run;
    const avail = Spire.availableNodes();
    const g = this.add.graphics().setDepth(10);
    for (let r = 0; r < rows.length - 1; r++) {
      rows[r].forEach(n => n.edges.forEach(j => {
        const m = rows[r + 1][j];
        const lit = run.pos && run.pos.r === r && run.pos.i === n.i;
        g.lineStyle(2, lit ? 0xe0b34a : 0x8a5a33, lit ? 0.95 : 0.6);
        const steps = 9;
        for (let s2 = 0; s2 < steps; s2++) {
          const t0 = s2 / steps, t1 = (s2 + 0.55) / steps;
          g.lineBetween(n.x + (m.x - n.x) * t0, n.y - 26 + (m.y - n.y + 22) * t0,
                        n.x + (m.x - n.x) * t1, n.y - 26 + (m.y - n.y + 22) * t1);
        }
      }));
    }
    rows.forEach(row => row.forEach(n => this.drawNode(n, avail)));
    /* her marker walks the road with her */
    const at = run.pos ? rows[run.pos.r][run.pos.i] : rows[0][0];
    Spire.spawn(this, Spire.char().prefix + "_idle", at.x - 56, at.y + 34, { depth: 22, height: 90 });
  }

  drawNode(n, avail) {
    const run = Spire.run;
    const done = run.cleared[`${n.r}:${n.i}`];
    const isCurrent = run.pos && run.pos.r === n.r && run.pos.i === n.i;
    const available = avail.includes(n);
    const c = this.add.container(n.x, n.y).setDepth(20);
    const plate = this.add.circle(0, 0, n.type === "boss" ? 40 : 28, done ? 0x2c4a2c : (isCurrent ? 0x4a3a20 : 0x241813), 1)
      .setStrokeStyle(2.5, available ? 0xe0b34a : (isCurrent ? 0xffd97a : 0x6a5433));
    c.add(plate);
    const artKey = this.nodeArt(n);
    if (artKey && this.textures.exists(artKey)) {
      const im = this.add.image(0, 2, artKey);
      im.setScale((n.type === "boss" ? 60 : 42) / Math.max(im.width, im.height));
      if (!available && !done && !isCurrent) im.setTint(0x777777);
      const E = Spire.ENEMIES[n.enemy];
      if (E && E.flip) im.setFlipX(true);
      if (E && E.tint && (available || done || isCurrent)) im.setTint(E.tint);
      c.add(im);
    } else if (n.type === "tavern" && this.textures.exists("dc_idle_1")) {
      const im = this.add.image(0, 2, "dc_idle_1");
      im.setScale(42 / Math.max(im.width, im.height));
      if (!available && !done && !isCurrent) im.setTint(0x777777);
      c.add(im);
    } else {
      c.add(this.add.text(0, 0, this.nodeGlyph(n.type) || "?", {
        fontFamily: "Georgia, serif", fontSize: 24, color: available ? "#e0b34a" : "#8a744f"
      }).setOrigin(0.5));
    }
    c.add(this.add.text(0, n.type === "boss" ? 54 : 42, this.nodeLabel(n.type, n.enemy), {
      fontFamily: "Georgia, serif", fontSize: 11,
      color: done ? "#7ce87c" : (available ? "#e8cfa8" : "#6a5844"), letterSpacing: 1
    }).setOrigin(0.5));
    if (done) c.add(this.add.text(20, -20, "✓", { fontSize: 18, color: "#7ce87c" }).setOrigin(0.5));
    const foeTips = {
      hound: "the Pit Hound", skel: "a Pit Skeleton", brute: "a Pit Brute",
      hook: "the Hook — fast and hungry", gunner: "the Road Gunner — sidestep the lock",
      stitch: "the Stitcher — it sews itself shut", chain: "the Chain — stay out of the sweep",
      pyre: "the Pyre — its cinders keep burning", wight: "a Frost Wight off the night road"
    };
    const eliteTips = { beast: "ELITE — The Beast. Greater spoils for greater risk.",
                        grave: "ELITE — Gravehand. It parries, then it punishes.",
                        door: "ELITE — THE WALL. Patience against patience.",
                        sorcerer: "ELITE — The Storm Sage. The sky fights beside him.",
                        proctor: "ELITE — an Ashenveil Proctor. The academy grades harshly." };
    const bossTips = { master: "THE HOUND MASTER — clear him to take the floor",
                       necro: "THE COURT NECROMANCER — the buyer's pet, and his court of Risen",
                       champ: "THE CHAMP — the shipment's keeper eats his own thralls" };
    const tip = {
      fight: `a fight: ${foeTips[n.enemy] || "something hungry"}`,
      elite: eliteTips[n.enemy] || "ELITE — greater spoils for greater risk",
      boss: bossTips[n.enemy] || "the one who waits at the top",
      rest: "rest site — recover 25 HP",
      treasure: n.r === 1 ? "cache — rich, and watched. The elite guards the road past it."
              : n.r === 3 ? "cache — one last take, in the boss's shadow"
              : "cache — a rare card, +8 max HP, or purge a card",
      unknown: "??? — the road decides what you find",
      tavern: "a lone tavern — the Dancer waits with a full cup and a rarer card",
      inn: "THE LAST DOOR INN — Marlow's board, a bed, and what the road knows",
      cage: "a cold waystation — crates with air-holes, and something alive in the cage"
    }[n.type];
    plate.on("pointerover", () => { if (available) Spire.sfx.hover(); this.hoverTip(n.x, n.y - (n.type === "boss" ? 62 : 48), tip); });
    plate.on("pointerout", () => this.hoverTip());
    if (available) {
      this.tweens.add({ targets: plate, scale: 1.12, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      plate.setInteractive({ useHandCursor: true }).on("pointerdown", () => { Spire.sfx.click(); this.enter(n); });
    } else {
      plate.setInteractive({ useHandCursor: true }).on("pointerdown", () =>
        this.toast(done || isCurrent ? "that ground is already hers" : "the path doesn't reach there yet"));
    }
  }

  enter(n) {
    if (this._leaving) return;   // a transition is already in flight (e.g. an ??? node's delayed reveal)
    this._leaving = true;
    Spire.enterNode(n);
    const go = (scene) => {
      if (!this.cameras || !this.cameras.main) return;   // scene already shut down
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(320, () => this.scene.start(scene));
    };
    if (n.type === "fight" || n.type === "elite" || n.type === "boss") return go("Fight");
    if (n.type === "rest") { Spire.clearNode(); return go("Rest"); }
    if (n.type === "treasure") { Spire.clearNode(); return go("Treasure"); }
    if (n.type === "tavern") { Spire.clearNode(); return go("Tavern"); }
    if (n.type === "inn") { Spire.clearNode(); return go("Inn"); }
    if (n.type === "cage") { Spire.clearNode(); return go("Cage"); }
    /* unknown — the road decides. Its danger is the easy foe from the fork she DIDN'T
       take (that node can never be visited once she's past row 1, so no duplicates —
       the road she skipped catches up with her). */
    const ACT = Spire.act();
    const roll = Math.random();
    const skipped = (Spire.run.map[1] && Spire.run.map[1][0] && Spire.run.map[1][0].enemy) || Spire.claimEnemy(ACT.fightPool);
    if (Spire.run.act === 3 && !Spire.run._bladeMet && Spire.run.character !== "samurai") {
      /* 2026-08-11 (Hiro playtest): was a 30% roll — too easy to never meet her.
         The hunter always finds the arsonist on the first act-3 dark node now. */
      /* THE MATRON'S BLADE finds the arsonist (2026-08-11): the cult's hunter has
         been following the ledger's burned pages — once per run, act 3 dark nodes */
      Spire.run._bladeMet = true;
      n.enemy = "matronblade";
      this.toast("a blade has been following the smoke you left…");
      this.time.delayedCall(1000, () => go("Fight"));
    } else if (Spire.run.act === 2 && roll < 0.30 && !Spire.run._buyerMet && Spire.run.character !== "samurai") {
      /* the story finds her: the Veiled Woman and her humming vial */
      Spire.run._buyerMet = true;
      Spire.clearNode();
      this.toast("a lantern burns in a doorway that should be dark…");
      this.time.delayedCall(900, () => go("Buyer"));
    } else if (roll < 0.35) {
      n.enemy = skipped;
      this.toast("something was waiting in the dark…");
      this.time.delayedCall(900, () => go("Fight"));
    } else if (roll < 0.60) {
      Spire.clearNode();
      this.toast("a cache, unguarded…");
      this.time.delayedCall(900, () => go("Treasure"));
    } else if (roll < 0.80) {
      Spire.clearNode();
      const heal = Math.min(8, Spire.run.maxHp - Spire.run.hp);
      Spire.run.hp += heal;
      this.toast(`a moment of mercy — +${heal} HP`);
      this.time.delayedCall(1100, () => this.scene.restart());
    } else {
      n.enemy = skipped;
      this.toast("an AMBUSH!");
      this.time.delayedCall(1000, () => go("Fight"));
    }
  }

  hoverTip(x, y, str) {
    if (this._tip) { this._tip.destroy(); this._tip = null; }
    if (!str) return;
    this._tip = this.add.text(x, y, str, {
      fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: "#e8cfa8",
      backgroundColor: "#241813", padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(45);
  }
  toast(str) {
    if (!str) return;
    if (this._toastTxt) this._toastTxt.destroy();
    this._toastTxt = this.add.text(640, 640, str, {
      fontFamily: "Georgia, serif", fontSize: 17, fontStyle: "italic", color: "#e8cfa8",
      backgroundColor: "#241813", padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(40);
    const t = this._toastTxt;
    this.tweens.add({ targets: t, alpha: 0, delay: 1600, duration: 400, onComplete: () => { t.destroy(); if (this._toastTxt === t) this._toastTxt = null; } });
  }
}
