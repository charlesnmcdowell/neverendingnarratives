/* NodeScenes.js — the non-fight encounters: card Reward, Rest, Treasure, the story
   stops (Tavern / the Last Door Inn / the Cage / the Buyer), Story interludes,
   Act clear, and the Varenholm epilogue. */

const NODE_BG = (scene, dim, bgKey) => {
  const key = bgKey || (Spire.run && Spire.act().mapBg) || "bg_far_1";
  const far = scene.add.image(640, 340, scene.textures.exists(key) ? key : "bg_far_1");
  far.setScale(Math.max(1280 / far.width, 760 / far.height) * 1.05);
  scene.add.rectangle(640, 360, 1280, 720, 0x0a0705, dim);
  scene.add.particles(0, 0, "dot", {
    x: { min: 0, max: 1280 }, y: 740, lifespan: 6400, speedY: { min: -34, max: -10 },
    scale: { start: 0.4, end: 0 }, quantity: 1, frequency: 260,
    tint: [0xff9944, 0xe0b34a], alpha: { start: 0.6, end: 0 }, blendMode: "ADD"
  });
};
const NODE_TITLE = (scene, str, sub) => {
  scene.add.text(640, 74, str, { fontFamily: "Georgia, serif", fontSize: 38, color: "#e0b34a", letterSpacing: 5, stroke: "#1a0e08", strokeThickness: 5 }).setOrigin(0.5).setDepth(30);
  if (sub) scene.add.text(640, 116, sub, { fontFamily: "Georgia, serif", fontSize: 16, fontStyle: "italic", color: "#caa26a" }).setOrigin(0.5).setDepth(30);
};
const NODE_BUTTON = (scene, x, y, label, cb, w) => {
  const bg = scene.add.rectangle(x, y, w || 230, 52, 0x3a2420, 0.94).setStrokeStyle(2, 0xe0b34a).setDepth(31)
    .setInteractive({ useHandCursor: true })
    .on("pointerover", () => { Spire.sfx.hover(); bg.setFillStyle(0x5a3426, 0.96); })
    .on("pointerout", () => bg.setFillStyle(0x3a2420, 0.94))
    .on("pointerdown", () => { Spire.sfx.click(); cb(); });
  scene.add.text(x, y, label, { fontFamily: "Georgia, serif", fontSize: 19, color: "#e8cfa8" }).setOrigin(0.5).setDepth(32);
  return bg;
};

/* ---------------- card reward after a won fight ---------------- */
class RewardScene extends Phaser.Scene {
  constructor() { super("Reward"); }
  init(data) { this.elite = !!(data && data.elite); this.fromTreasure = !!(data && data.rareOnly); }
  create() {
    NODE_BG(this, 0.68);
    NODE_TITLE(this, this.fromTreasure ? "A  RELIC  OF  THE  PIT" : "S P O I L S",
      this.elite || this.fromTreasure ? "something rarer stirs in the sand…" : "claim one card for the climb");
    let choices = this.fromTreasure
      ? Spire.rewardChoices(3, true).filter(id => Spire.CARDS[id].rarity !== "common").slice(0, 3)
      : Spire.rewardChoices(3, this.elite);
    if (!choices.length) choices = Spire.rewardChoices(3, true);
    choices.forEach((id, i) => {
      const card = Spire.makeCard(this, id);
      const tx = 640 + (i - (choices.length - 1) / 2) * 240;
      card.setPosition(tx, 900).setDepth(30);
      this.tweens.add({ targets: card, y: 360, duration: 380, delay: i * 110, ease: "Back.easeOut" });
      card.setInteractive({ useHandCursor: true })
        .on("pointerover", () => this.tweens.add({ targets: card, scale: 1.12, duration: 110 }))
        .on("pointerout", () => this.tweens.add({ targets: card, scale: 1, duration: 110 }))
        .on("pointerdown", () => {
          Spire.sfx.card();
          Spire.run.deck.push(id);
          this.tweens.add({ targets: card, y: -260, alpha: 0.4, duration: 320, ease: "Cubic.easeIn" });
          this.time.delayedCall(340, () => this.done(`${Spire.CARDS[id].name} joins her deck`));
        });
    });
    NODE_BUTTON(this, 640, 610, "TAKE NOTHING", () => this.done("she leaves it for the sand"), 240);
    this.add.text(640, 668, `deck: ${Spire.run.deck.length} cards   ·   HP ${Spire.run.hp}/${Spire.run.maxHp}`,
      { fontFamily: "Georgia, serif", fontSize: 14, color: "#9a8264" }).setOrigin(0.5).setDepth(30);
    this.cameras.main.fadeIn(350);
    /* debug/test hooks */
    this._choices = choices;
    window.rewardPick = (i) => { const id = this._choices[i || 0]; if (id) { Spire.run.deck.push(id); this.done("debug pick"); } return id; };
    window.rewardSkip = () => { this.done("debug skip"); };
  }
  done(msg) {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => this.scene.start("Map", { toast: msg }));
  }
}

/* ---------------- rest site ---------------- */
class RestScene extends Phaser.Scene {
  constructor() { super("Rest"); }
  create() {
    NODE_BG(this, 0.7);
    NODE_TITLE(this, "E M B E R   R E S T", "a quiet ledge above the roar of the pit");
    const wl = Spire.spawn(this, Spire.char().prefix + "_idle", 520, 520, { depth: 20, height: 280 });
    /* campfire: pure engine — logs + flame particles + glow */
    const fx = 720, fy = 512;
    this.add.ellipse(fx, fy + 4, 130, 34, 0x2a1a10).setDepth(19);
    this.add.rectangle(fx - 18, fy - 6, 52, 9, 0x4a2f1a).setAngle(-18).setDepth(20);
    this.add.rectangle(fx + 16, fy - 6, 52, 9, 0x3a2414).setAngle(20).setDepth(20);
    this.add.particles(fx, fy - 12, "dot", {
      lifespan: 620, speedY: { min: -150, max: -70 }, speedX: { min: -22, max: 22 },
      scale: { start: 0.95, end: 0 }, tint: [0xffdd66, 0xff9933, 0xdd4411],
      quantity: 3, frequency: 40, blendMode: "ADD"
    }).setDepth(21);
    this.add.ellipse(fx, fy - 30, 260, 190, 0xff9944, 0.10).setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
    const heal = Math.min(25, Spire.run.maxHp - Spire.run.hp);
    NODE_BUTTON(this, 640, 640, heal > 0 ? `REST  (+${heal} HP)` : "REST  (already whole)", () => {
      if (heal > 0) {
        Spire.sfx.heal();
        Spire.run.hp += heal;
        this.add.text(520, 380, `+${heal}`, { fontFamily: "Georgia, serif", fontSize: 30, color: "#7ce87c", stroke: "#1a0e08", strokeThickness: 4 }).setOrigin(0.5).setDepth(30);
        const motes = this.add.particles(520, 460, "dot", {
          lifespan: 900, speedY: { min: -80, max: -30 }, scale: { start: 0.5, end: 0 },
          tint: 0x7ce87c, quantity: 2, frequency: 60, blendMode: "ADD"
        }).setDepth(21);
        this.time.delayedCall(900, () => motes.destroy());
      }
      this.time.delayedCall(1000, () => {
        this.cameras.main.fadeOut(300);
        this.time.delayedCall(320, () => this.scene.start("Map", { toast: "she rests — the Spire waits" }));
      });
    }, 300);
    this.add.text(640, 692, `HP ${Spire.run.hp}/${Spire.run.maxHp}`, { fontFamily: "Georgia, serif", fontSize: 14, color: "#9a8264" }).setOrigin(0.5).setDepth(30);
    this.cameras.main.fadeIn(350);
    window.restNow = () => {   // debug/test hook: same as pressing REST, minus the lingering beat
      const h = Math.min(25, Spire.run.maxHp - Spire.run.hp);
      Spire.run.hp += h;
      this.scene.start("Map", { toast: "debug rest" });
      return h;
    };
  }
}

/* ---------------- treasure ---------------- */
class TreasureScene extends Phaser.Scene {
  constructor() { super("Treasure"); }
  create() {
    this._grid = null;   // instance-reuse guard: Phaser reuses scenes, and a stale grid
                         // reference from the LAST cache made PURGE A CARD silently dead
    NODE_BG(this, 0.68);
    NODE_TITLE(this, "B U R I E D   C A C H E", "the sand gives up what its owners could not keep");
    /* chest: simple vector + fireball-orb glow */
    const cx = 640, cy = 250;
    const chest = this.add.container(cx, cy).setDepth(25);
    chest.add(this.add.rectangle(0, 12, 150, 74, 0x4a2f1a).setStrokeStyle(3, 0xe0b34a));
    chest.add(this.add.rectangle(0, -30, 158, 30, 0x5a3a20).setStrokeStyle(3, 0xe0b34a));
    chest.add(this.add.circle(0, 8, 10, 0xe0b34a));
    const orb = this.add.image(cx, cy - 6, "fx_fireball_1").setDepth(24).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
    orb.setScale(160 / orb.width);
    this.tweens.add({ targets: orb, alpha: 0.2, duration: 900, yoyo: true, repeat: -1 });

    NODE_BUTTON(this, 340, 470, "A RARE CARD", () => {
      this.cameras.main.fadeOut(250);
      this.time.delayedCall(270, () => this.scene.start("Reward", { rareOnly: true }));
    }, 250);
    NODE_BUTTON(this, 640, 470, "+8 MAX HP", () => {
      Spire.run.maxHp += 8; Spire.run.hp += 8;
      this.finish("her flesh remembers how to endure (+8 max HP)");
    }, 250);
    NODE_BUTTON(this, 940, 470, "PURGE A CARD", () => this.purgeGrid(), 250);
    this.add.text(640, 530, "choose one", { fontFamily: "Georgia, serif", fontSize: 14, fontStyle: "italic", color: "#9a8264" }).setOrigin(0.5).setDepth(30);
    this.cameras.main.fadeIn(350);
    window.treasureMaxHp = () => { Spire.run.maxHp += 8; Spire.run.hp += 8; this.scene.start("Map", { toast: "debug loot" }); };
  }
  purgeGrid() {
    if (this._grid) return;
    this._grid = this.add.container(0, 0).setDepth(40);
    this._grid.add(this.add.rectangle(640, 360, 1280, 720, 0x0a0705, 0.85).setInteractive());
    this._grid.add(this.add.text(640, 60, "burn one card from her deck", { fontFamily: "Georgia, serif", fontSize: 22, color: "#e8cfa8" }).setOrigin(0.5));
    const ids = Spire.run.deck.slice();
    const cols = Math.min(8, ids.length);
    ids.forEach((id, i) => {
      const card = Spire.makeCard(this, id);
      card.setScale(0.62);
      card.setPosition(640 + ((i % cols) - (cols - 1) / 2) * 150, 190 + Math.floor(i / cols) * 155);
      this._grid.add(card);
      card.setInteractive({ useHandCursor: true })
        .on("pointerover", () => card.setScale(0.72))
        .on("pointerout", () => card.setScale(0.62))
        .on("pointerdown", () => {
          Spire.sfx.burn();
          const ix = Spire.run.deck.indexOf(id);
          if (ix >= 0) Spire.run.deck.splice(ix, 1);
          this.finish(`${Spire.CARDS[id].name} burns to ash — deck: ${Spire.run.deck.length}`);
        });
    });
  }
  finish(msg) {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => this.scene.start("Map", { toast: msg }));
  }
}

/* ---------------- tavern stop: the Dancer, a full heal, and an epic pick ---------------- */
class TavernScene extends Phaser.Scene {
  constructor() { super("Tavern"); }
  create() {
    NODE_BG(this, 0.62);
    NODE_TITLE(this, "A  L O N E   T A V E R N", "lamplight, warm ale, and someone who isn't trying to kill her");
    Spire.playMusic("tavern");   // Trouble By The Hearth (2026-08-11, Hiro's track)

    /* a little decor: lantern glow + a barrel, then the two figures */
    const lx = 860, ly = 330;
    this.add.ellipse(lx, ly + 30, 220, 170, 0xffaa55, 0.14).setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
    this.add.circle(lx, ly, 10, 0xffcc77).setDepth(21);
    this.add.rectangle(lx, ly - 22, 4, 26, 0x4a2f1a).setDepth(21);
    this.tweens.add({ targets: this.children.list[this.children.list.length - 2], alpha: 0.55, duration: 700, yoyo: true, repeat: -1 });
    this.add.rectangle(360, 560, 70, 60, 0x4a2f1a).setStrokeStyle(3, 0x2a1a10).setDepth(19);

    const wl = Spire.spawn(this, Spire.char().prefix + "_idle", 470, 520, { depth: 20, height: 280 });
    /* THE FIREBIRD'S WARDROBE (2026-08-11, sliced from Hiro's sheets): some nights
       she performs in the green stage outfit — a real belly dance, not a pose —
       other nights it's the white dress between sets. A second girl bobs on the
       back stage either way. */
    const green = this.textures.exists("dc2_dance_1") && Math.random() < 0.6;
    const dancer = Spire.spawn(this, green ? "dc2_dance" : "dc_idle", 780, 520, { depth: 20, height: 280 });
    if (!green) this.tweens.add({ targets: dancer, scaleX: dancer.scaleX * 1.015, scaleY: dancer.scaleY * 0.99, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    if (this.textures.exists("dcw_bob_1")) {
      this.add.rectangle(1075, 560, 150, 14, 0x2a1a10).setStrokeStyle(2, 0x1a0e08).setDepth(18);  // the back stage
      const bob = Spire.spawn(this, "dcw_bob", 1075, 552, { depth: 19, height: 150 });
      bob.setAlpha(0.82);
      this.add.ellipse(1075, 470, 170, 190, 0xffcc88, 0.07).setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
    }
    /* her face, up close — the sliced emote portraits chip in beside the flavor line */
    if (this.textures.exists("dcx_face_1")) {
      const fi = Phaser.Math.Between(1, 7);
      const chip = this.add.image(170, 212, "dcx_face_" + fi).setDepth(30);
      chip.setScale(Math.min(150 / chip.width, 82 / chip.height));
      this.add.rectangle(170, 212, chip.displayWidth + 8, chip.displayHeight + 8, 0x000000, 0)
        .setStrokeStyle(2, 0xe0b34a, 0.7).setDepth(31);
      const quip = Phaser.Utils.Array.GetRandom(green
        ? ["“new outfit. the crowd's louder tonight.”", "“watch the hips — that's where the magic lives.”", "“stay for the last number. it gets illegal.”"]
        : ["“white nights are for listening, love.”", "“between sets. buy a girl a cider?”", "“the songs remember what the city forgets.”"]);
      this.add.text(170, 278, quip, {
        fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: "#e8cfa8",
        align: "center", wordWrap: { width: 250 }
      }).setOrigin(0.5, 0).setDepth(30);
    }

    /* full heal, right away -- "your health is refilled" */
    const healed = Spire.run.maxHp - Spire.run.hp;
    Spire.run.hp = Spire.run.maxHp;
    if (healed > 0) {
      Spire.sfx.heal();
      this.add.text(470, 340, `+${healed}`, { fontFamily: "Georgia, serif", fontSize: 30, color: "#7ce87c", stroke: "#1a0e08", strokeThickness: 4 }).setOrigin(0.5).setDepth(30);
      const motes = this.add.particles(470, 420, "dot", {
        lifespan: 900, speedY: { min: -80, max: -30 }, scale: { start: 0.5, end: 0 },
        tint: 0x7ce87c, quantity: 2, frequency: 60, blendMode: "ADD"
      }).setDepth(21);
      this.time.delayedCall(900, () => motes.destroy());
    }
    this.add.text(640, 168, `she drinks her fill — HP restored to ${Spire.run.maxHp}/${Spire.run.maxHp}`, {
      fontFamily: "Georgia, serif", fontSize: 15, fontStyle: "italic", color: "#9ecf6a"
    }).setOrigin(0.5).setDepth(30);

    /* epic card offer */
    const kd = Spire.run.character === "samurai";
    if (kd) Spire.say(this, "k_file");     // she watches the dancer the way a scout watches
    this.add.text(640, 610, kd
      ? "the Firebird plays Karridge tonight. Tsubaki watches, and remembers everything."
      : "the Firebird plays Karridge tonight. she knows people — one of them owes her a favor.", {
      fontFamily: "Georgia, serif", fontSize: 14, fontStyle: "italic", color: "#caa26a"
    }).setOrigin(0.5).setDepth(30);
    let choices = Spire.epicChoices(3);
    if (!choices.length) choices = Spire.rewardChoices(3, true);
    choices.forEach((id, i) => {
      const card = Spire.makeCard(this, id);
      const tx = 640 + (i - (choices.length - 1) / 2) * 200;
      card.setScale(0.82);
      card.setPosition(tx, 900).setDepth(30);
      this.tweens.add({ targets: card, y: 460, duration: 380, delay: i * 110, ease: "Back.easeOut" });
      card.setInteractive({ useHandCursor: true })
        .on("pointerover", () => this.tweens.add({ targets: card, scale: 0.92, duration: 110 }))
        .on("pointerout", () => this.tweens.add({ targets: card, scale: 0.82, duration: 110 }))
        .on("pointerdown", () => {
          Spire.sfx.card();
          Spire.say(this, Spire.run.character === "samurai" ? "k_price" : "w_price");
          Spire.run.deck.push(id);
          this.tweens.add({ targets: card, y: -260, alpha: 0.4, duration: 320, ease: "Cubic.easeIn" });
          this.time.delayedCall(1100, () => this.done(`${Spire.CARDS[id].name} joins her deck`));
        });
    });
    NODE_BUTTON(this, 640, 660, "TAKE NOTHING", () => this.done("she finishes her drink and leaves"), 240);
    this.cameras.main.fadeIn(350);

    /* debug/test hooks */
    this._choices = choices;
    window.tavernPick = (i) => { const id = this._choices[i || 0]; if (id) { Spire.run.deck.push(id); this.done("debug pick"); } return id; };
    window.tavernSkip = () => { this.done("debug skip"); };
  }
  done(msg) {
    Spire.playMusic(Spire.act().music);   // the hearth-song stays in the tavern
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => this.scene.start("Map", { toast: msg }));
  }
}

/* ---------------- story interlude: act intros/outros, voiced ---------------- */
class StoryScene extends Phaser.Scene {
  constructor() { super("Story"); }
  init(data) {
    this.lines = (data && data.lines) || [];
    this.titleStr = (data && data.title) || "";
    this.next = (data && data.next) || "Map";     // "Map" | "__nextact" | "Epilogue"
  }
  create() {
    NODE_BG(this, 0.82);
    if (this.titleStr) {
      const t = this.add.text(640, 120, this.titleStr, {
        fontFamily: "Georgia, serif", fontSize: 34, color: "#e0b34a", letterSpacing: 5,
        stroke: "#1a0e08", strokeThickness: 5
      }).setOrigin(0.5).setDepth(30).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 500 });
    }
    Spire.spawn(this, Spire.char().prefix + "_idle", 640, 540, { depth: 20, height: 300 });
    this.add.text(640, 592, "· click to hurry a line — hold 5s to skip the scene ·", { fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6a5844" }).setOrigin(0.5).setDepth(30);
    this._done = false;
    window.storyNext = () => this.finish();     // debug/test hook
    Spire.holdToSkip(this, () => this.finish());   // hold 5s = skip the whole cutscene
    this.playLines();
    this.cameras.main.fadeIn(400);
  }
  async playLines() {
    for (const id of this.lines) {
      if (this._done) return;
      await Spire.say(this, id);
      if (this._done) return;
      await Spire.wait(this, 350);
    }
    if (!this._done) {
      NODE_BUTTON(this, 640, 660, "CONTINUE", () => this.finish(), 240);
      if (!this.lines.length) this.finish();
    }
  }
  finish() {
    if (this._done) return;
    this._done = true;
    if (Spire._voiceNow) { try { Spire._voiceNow.pause(); } catch (e) {} }
    if (Spire._audio && Spire.musicOn) Spire._audio.volume = 0.4;
    this.cameras.main.fadeOut(350);
    this.time.delayedCall(370, () => {
      if (this.next === "__nextact") { Spire.nextAct(); this.scene.start("Map", { toast: Spire.act().tag }); }
      else if (this.next === "__duel") this.scene.start("Fight", { enemy: "kagehime" });
      else this.scene.start(this.next);
    });
  }
}

/* ---------------- ACT 2 story stop: THE LAST DOOR INN (Marlow) ---------------- */
class InnScene extends Phaser.Scene {
  constructor() { super("Inn"); }
  create() {
    /* 2026-08-11 inn rework (Hiro): the inn greets you and offers a BED, full stop.
       Marlow's rumor exposition moved to the act-2 story intro. Brassveil gets its
       own inn (the samurai never meets Marlow — different city, different host). */
    const kd = Spire.run.character === "samurai";
    NODE_BG(this, 0.66, kd ? "bg_bv_far_1" : "bg_alleys_far_1");
    if (!kd) {
      const row = this.add.image(640, 652, "bg_inn_row_1").setOrigin(0.5, 1).setDepth(5).setAlpha(0.98);
      row.setScale(1280 / row.width);
    } else if (this.textures.exists("bg_bv_mid_1")) {
      const row = this.add.image(640, 660, "bg_bv_mid_1").setOrigin(0.5, 1).setDepth(5).setAlpha(0.95);
      row.setScale(1280 / row.width);
    }
    this.add.rectangle(640, 360, 1280, 720, 0x0a0705, 0.25).setDepth(6);
    if (kd) NODE_TITLE(this, "T H E   H U M M I N G   H E A R T H", "rune-warmed rooms in the lit city");
    else NODE_TITLE(this, "T H E   L A S T   D O O R   I N N", "board, bed, and the best-paid ears in Karridge");
    const wl = Spire.spawn(this, Spire.char().prefix + "_idle", 420, 600, { depth: 20, height: 280 });
    this.add.ellipse(880, 420, 300, 200, 0xffcc77, 0.08).setDepth(7).setBlendMode(Phaser.BlendModes.ADD);

    /* a short welcome — nothing more (the player is here for the bed) */
    Spire.say(this, kd ? "b_host" : "m_greet");

    /* a night's board: full heal */
    const healed = Spire.run.maxHp - Spire.run.hp;
    Spire.run.hp = Spire.run.maxHp;
    if (healed > 0) {
      Spire.sfx.heal();
      this.add.text(420, 380, `+${healed}`, { fontFamily: "Georgia, serif", fontSize: 30, color: "#7ce87c", stroke: "#1a0e08", strokeThickness: 4 }).setOrigin(0.5).setDepth(30);
    }
    this.add.text(640, 158, `a bath, a meal, a bed — HP restored to ${Spire.run.maxHp}/${Spire.run.maxHp}`, {
      fontFamily: "Georgia, serif", fontSize: 15, fontStyle: "italic", color: "#9ecf6a"
    }).setOrigin(0.5).setDepth(30);

    /* what the road knows: a rare-leaning pick */
    this.add.text(640, 600, kd ? "the host hears every traveler — pick what the city taught"
                               : "five silver, and Marlow's ears are hers — pick what the road taught", {
      fontFamily: "Georgia, serif", fontSize: 14, fontStyle: "italic", color: "#caa26a"
    }).setOrigin(0.5).setDepth(30);
    const choices = Spire.rewardChoices(3, true);
    choices.forEach((id, i) => {
      const card = Spire.makeCard(this, id);
      const tx = 640 + (i - (choices.length - 1) / 2) * 200;
      card.setScale(0.82);
      card.setPosition(tx, 900).setDepth(30);
      this.tweens.add({ targets: card, y: 440, duration: 380, delay: i * 110, ease: "Back.easeOut" });
      card.setInteractive({ useHandCursor: true })
        .on("pointerover", () => this.tweens.add({ targets: card, scale: 0.92, duration: 110 }))
        .on("pointerout", () => this.tweens.add({ targets: card, scale: 0.82, duration: 110 }))
        .on("pointerdown", () => {
          Spire.sfx.card();
          Spire.say(this, Spire.run.character === "samurai" ? "k_silver" : "w_fivesilver");
          Spire.run.deck.push(id);
          this.tweens.add({ targets: card, y: -260, alpha: 0.4, duration: 320, ease: "Cubic.easeIn" });
          this.time.delayedCall(1200, () => this.done(`${Spire.CARDS[id].name} joins her deck`));
        });
    });
    NODE_BUTTON(this, 640, 660, "KEEP HER SILVER", () => this.done("she keeps her coin and her counsel"), 260);
    this.cameras.main.fadeIn(350);
    this._choices = choices;
    window.innPick = (i) => { const id = this._choices[i || 0]; if (id) { Spire.run.deck.push(id); this.done("debug pick"); } return id; };
    window.innSkip = () => this.done("debug skip");
  }
  done(msg) {
    if (Spire._voiceNow) { try { Spire._voiceNow.pause(); } catch (e) {} }
    if (Spire._audio && Spire.musicOn) Spire._audio.volume = 0.4;
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => this.scene.start("Map", { toast: msg }));
  }
}

/* ---------------- ACT 3 story stop: THE CAGE (the waystation) ---------------- */
class CageScene extends Phaser.Scene {
  constructor() { super("Cage"); }
  create() {
    NODE_BG(this, 0.6, "bg_wroad_far_1");
    const props = this.add.image(640, 648, "bg_wroad_mid_1").setOrigin(0.5, 1).setDepth(5).setAlpha(0.95);
    props.setScale(1280 / props.width);
    this.add.rectangle(640, 360, 1280, 720, 0x040810, 0.3).setDepth(6);
    NODE_TITLE(this, "T H E   W A Y S T A T I O N", "tents that fold fast — crates with air-holes");
    const wl = Spire.spawn(this, Spire.char().prefix + "_idle", 430, 600, { depth: 20, height: 280 });
    /* the cage, engine-drawn: bars + a shape inside */
    const cg = this.add.container(830, 560).setDepth(19);
    cg.add(this.add.rectangle(0, 0, 190, 150, 0x0c0806, 0.6).setStrokeStyle(3, 0x555a60));
    for (let i = -3; i <= 3; i++) cg.add(this.add.rectangle(i * 27, 0, 6, 150, 0x3a3f45));
    cg.add(this.add.ellipse(6, 40, 90, 60, 0x1a141a));
    this.tweens.add({ targets: cg, y: 558, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this._opened = false;
    this.playStory();
    NODE_BUTTON(this, 640, 660, "BEND THE BARS OPEN", () => this.open(), 300);
    this.cameras.main.fadeIn(350);
    window.cageOpen = () => this.open();
  }
  async playStory() {
    const kd2 = Spire.run.character === "samurai";
    await Spire.say(this, kd2 ? "n_kcage" : "n_camp");
    if (!this._opened) await Spire.say(this, kd2 ? "k_courier" : "q_priced");
  }
  async open() {
    if (this._opened) return;
    this._opened = true;
    Spire.sfx.shield();
    this.cameras.main.shake(140, 0.004);
    await Spire.say(this, Spire.run.character === "samurai" ? "k_go" : "w_run");                           // "Run. You're worth more to me as a rumor."
    Spire.run.maxHp += 12; Spire.run.hp = Math.min(Spire.run.maxHp, Spire.run.hp + 12);
    if (Spire._voiceNow) { try { Spire._voiceNow.pause(); } catch (e) {} }
    if (Spire._audio && Spire.musicOn) Spire._audio.volume = 0.4;
    this.cameras.main.fadeOut(320);
    this.time.delayedCall(340, () => this.scene.start("Map", { toast: "the boy runs — a debt owed is worth +12 max HP" }));
  }
}

/* ------- ACT 2 chance event: THE BUYER (the Veiled Woman and her humming vial) ------- */
class BuyerScene extends Phaser.Scene {
  constructor() { super("Buyer"); }
  create() {
    NODE_BG(this, 0.72, "bg_alleys_far_1");
    const row = this.add.image(640, 652, "bg_alleys_mid_1").setOrigin(0.5, 1).setDepth(5).setAlpha(0.95);
    row.setScale(1280 / row.width);
    this.add.rectangle(640, 360, 1280, 720, 0x0a0810, 0.35).setDepth(6);
    NODE_TITLE(this, "T H E   B U Y E R", "a back-alley meeting gone wrong the moment you aren't who she expected");
    const wl = Spire.spawn(this, Spire.char().prefix + "_idle", 430, 600, { depth: 20, height: 280 });
    /* the veiled woman: a hooded silhouette by lanternlight, and the vial's hum */
    const vx = 860, vy = 600;
    const fig = this.add.container(vx, vy).setDepth(19);
    const cloak = this.add.graphics();
    cloak.fillStyle(0x161020, 0.98);
    cloak.fillEllipse(0, -60, 96, 190);
    cloak.fillCircle(0, -168, 34);
    fig.add(cloak);
    fig.add(this.add.ellipse(0, -168, 40, 22, 0x0a0812));
    const vial = this.add.circle(vx - 42, vy - 110, 8, 0x9fe8a0).setDepth(20).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: vial, alpha: 0.35, scale: 1.5, duration: 700, yoyo: true, repeat: -1 });
    this.add.ellipse(vx, vy - 90, 260, 320, 0xffcc77, 0.06).setDepth(18).setBlendMode(Phaser.BlendModes.ADD);

    this._chosen = false;
    this._btns = false;   // instance-reuse guard, same reason as ActClear
    Spire.say(this, "b_vial").then(() => { if (!this._chosen) this.showButtons(); });
    this.time.delayedCall(2500, () => { if (!this._btns && !this._chosen) this.showButtons(); });
    this.cameras.main.fadeIn(350);
    window.buyerTake = () => this.choose(true);
    window.buyerLeave = () => this.choose(false);
  }
  showButtons() {
    if (this._btns) return;
    this._btns = true;
    NODE_BUTTON(this, 420, 660, "TAKE THE VIAL", () => this.choose(true), 260);
    NODE_BUTTON(this, 860, 660, "LEAVE IT WITH HER", () => this.choose(false), 280);
  }
  async choose(take) {
    if (this._chosen) return;
    this._chosen = true;
    if (Spire._voiceNow) { try { Spire._voiceNow.pause(); } catch (e) {} }
    if (take) {
      await Spire.say(this, "w_vial_take");  // "It's safer in my hands than in your veins."
      const epics = Spire.epicChoices(1);
      if (epics.length) Spire.run.deck.push(epics[0]);
      this.leave(epics.length ? `the vial hums in her coat — ${Spire.CARDS[epics[0]].name} learned from it` : "the vial hums in her coat");
    } else {
      await Spire.say(this, "w_vial_leave"); // "Keep your bottled miracle. Your debt amuses me more."
      Spire.run.maxHp += 12; Spire.run.hp = Math.min(Spire.run.maxHp, Spire.run.hp + 8);
      this.leave("mercy, of a kind — the debt is worth +12 max HP");
    }
  }
  leave(msg) {
    if (Spire._audio && Spire.musicOn) Spire._audio.volume = 0.4;
    this.cameras.main.fadeOut(320);
    this.time.delayedCall(340, () => this.scene.start("Map", { toast: msg }));
  }
}

/* ---------------- act clear — each act ends on its own line ---------------- */
class ActClearScene extends Phaser.Scene {
  constructor() { super("ActClear"); }
  create() {
    this._adv = false;   // Phaser reuses scene instances — reset the advance guard every entry
    const ACT = Spire.act();
    const lastAct = Spire.run.act >= Spire.LAST_ACT;
    NODE_BG(this, 0.55);
    const showAd = Spire.run.act === 1 && !Spire.run._suppShown;
    const wl = Spire.spawn(this, Spire.char().prefix + "_idle", showAd ? 330 : 640, 560, { depth: 20, height: 340 });
    this.add.particles(640, 620, "dot", {
      lifespan: 1600, speedY: { min: -160, max: -60 }, speedX: { min: -60, max: 60 },
      scale: { start: 0.7, end: 0 }, tint: [0xbb88ff, 0xe0b34a, 0xff9944],
      quantity: 3, frequency: 40, blendMode: "ADD"
    }).setDepth(19);
    const title = this.add.text(640, 150, ACT.clearTitle, {
      fontFamily: "Georgia, serif", fontSize: 52, color: "#e0b34a", letterSpacing: 6,
      stroke: "#1a0e08", strokeThickness: 7
    }).setOrigin(0.5).setDepth(30).setAlpha(0).setScale(0.85);
    this.tweens.add({ targets: title, alpha: 1, scale: 1, duration: 500, ease: "Back.easeOut" });
    this.add.text(640, 210, ACT.clearText, {
      fontFamily: "Georgia, serif", fontSize: 17, fontStyle: "italic", color: "#caa26a"
    }).setOrigin(0.5).setDepth(30);
    const cardsWon = Spire.run.deck.length - Spire.STARTING_DECK.length;
    this.add.text(640, 268, `cards claimed: ${Math.max(0, cardsWon)}   ·   deck: ${Spire.run.deck.length}   ·   HP ${Spire.run.hp}/${Spire.run.maxHp}`, {
      fontFamily: "Georgia, serif", fontSize: 15, color: "#9a8264"
    }).setOrigin(0.5).setDepth(30);
    if (!lastAct) {
      this.add.text(640, 316, "the road rests a night — full health, +10 max HP, and the next act's ground ahead", {
        fontFamily: "Georgia, serif", fontSize: 15, color: "#6a5844"
      }).setOrigin(0.5).setDepth(30);
    }
    /* 2026-08-11 (Hiro): a small, honest ask after the first act — never blocks the
       PRESS ON button, shows once per run, links to the site's Fund page. */
    if (showAd) {
      Spire.run._suppShown = true;
      const sy = 384;
      this.add.rectangle(640, sy + 32, 660, 110, 0x140f0c, 0.92).setStrokeStyle(1.5, 0xe0b34a, 0.55).setDepth(30);
      this.add.text(640, sy + 2, "enjoying the road so far?", {
        fontFamily: "Georgia, serif", fontSize: 15, color: "#e0b34a"
      }).setOrigin(0.5).setDepth(31);
      this.add.text(640, sy + 26, "this game is free — if it's worth something to you, a small donation or a review", {
        fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: "#caa26a"
      }).setOrigin(0.5).setDepth(31);
      this.add.text(640, sy + 44, "keeps the next act coming. either way: thank you for playing.", {
        fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: "#caa26a"
      }).setOrigin(0.5).setDepth(31);
      const sb = this.add.text(640, sy + 74, "♥  SUPPORT ON THE FUND PAGE", {
        fontFamily: "Georgia, serif", fontSize: 13, color: "#ffd97a"
      }).setOrigin(0.5).setDepth(31).setInteractive({ useHandCursor: true })
        .on("pointerover", function () { this.setColor("#ffe9b0"); })
        .on("pointerout",  function () { this.setColor("#ffd97a"); })
        .on("pointerdown", () => { Spire.sfx.click(); try { window.open("https://neverendingnarratives.com/#fund", "_blank"); } catch (e) {} });
    }
    const nextLabel = lastAct ? "TAKE THE COACH NORTH" : "PRESS ON";
    NODE_BUTTON(this, 640, 660, nextLabel, () => this.advance(), 300);
    this.cameras.main.fadeIn(500);
    window.actClearActive = true;
    window.actClearNext = () => this.advance();    // debug/test hook
    this.events.once("shutdown", () => { window.actClearActive = false; });
  }
  advance() {
    if (this._adv) return;
    this._adv = true;
    const run = Spire.run;
    this.cameras.main.fadeOut(350);
    this.time.delayedCall(370, () => {
      if (run.act >= Spire.LAST_ACT) {
        /* THE ENDGAME DUEL (2026-08-11): the Keep is cleared, but the Matron
           never sends only one blade. Kagehime waits at the gates — Tsubaki's
           own school, sent to test what Sera left of her. Then the Ashenveil. */
        if (run.character === "samurai" && !run._dueled) {
          run._dueled = true;
          run.hp = run.maxHp;   // she binds her wounds at the gates — Sera's duel earned that much
          return this.scene.start("Story", { lines: ["k_duel", "e_k2_meet"], title: "AT  THE  BROKEN  GATES", next: "__duel" });
        }
        return this.scene.start("Epilogue");
      }
      const T = run.character === "samurai" ? Spire.ACTS_K : Spire.ACTS;
      const cur = T[run.act], nxt = T[run.act + 1];
      const lines = (cur.outro || []).concat(nxt.intro || []);
      this.scene.start("Story", { lines, title: nxt.tag, next: "__nextact" });
    });
  }
}

/* ---------------- epilogue: VARENHOLM — the Dancer, and the road south ---------------- */
class EpilogueScene extends Phaser.Scene {
  constructor() { super("Epilogue"); }
  create() {
    Spire.run.over = true;
    Spire.won = true;
    this._done = false;
    Spire.holdToSkip(this, () => this.finish());   // hold 5s = skip the epilogue reading
    this.kd = Spire.run.character === "samurai";
    if (this.kd) {
      /* TSUBAKI'S EPILOGUE — THE ASHENVEIL: the delivery, and the next assignment */
      NODE_BG(this, 0.62, "bg_wroad_far_1");
      this.add.rectangle(640, 360, 1280, 720, 0x0a0614, 0.5).setDepth(5);
      NODE_TITLE(this, "T H E   A S H E N V E I L", "ash fields, the working dead, and an academy with lower levels");
      /* the emissary: a robed silhouette in the smoke (never the Matron herself) */
      const em = Spire.spawn(this, "nc_idle", 880, 606, { depth: 20, height: 265, tint: 0x120a18 });
      em.setAlpha(0.92);
      this.add.ellipse(880, 430, 300, 380, 0x6a4a9a, 0.08).setDepth(10).setBlendMode(Phaser.BlendModes.ADD);
      const kdF = Spire.spawn(this, "kd_idle", 360, 610, { depth: 20, height: 290 });
      this._done = false;
      window.storyNext = () => this.finish();
      this.playLinesK();
      this.cameras.main.fadeIn(600);
      return;
    }
    NODE_BG(this, 0.5, "bg_city_far_1");
    this.add.rectangle(640, 360, 1280, 720, 0x0a0812, 0.35).setDepth(5);
    NODE_TITLE(this, "V A R E N H O L M", "spires, banners, streetlamps with glass in them");
    /* the Civic Auditorium: a stage of light, and the Dancer at the center of it */
    this.add.ellipse(830, 600, 420, 90, 0x2a2018, 1).setDepth(9);
    this.add.ellipse(830, 480, 380, 420, 0xffe9bb, 0.10).setDepth(10).setBlendMode(Phaser.BlendModes.ADD);
    for (const dx of [-150, 0, 150]) {
      const beam = this.add.triangle(830 + dx, 320, 0, 0, 60, 320, -60, 320, 0xffe9bb, 0.06).setDepth(10).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: beam, alpha: 0.5, duration: 1200 + Math.abs(dx), yoyo: true, repeat: -1 });
    }
    /* 2026-08-11 (Hiro): NO dancer sprite here — the show reads through the empty
       spotlit stage, the beams, and the crowd; the narrator carries the Firebird. */
    const wl = Spire.spawn(this, "wl_idle", 330, 610, { depth: 20, height: 290 });
    /* two thousand strangers: silhouetted heads between her and the stage */
    for (let i = 0; i < 26; i++) {
      const hx = 180 + Math.random() * 920, hy = 664 + Math.random() * 40;
      this.add.ellipse(hx, hy, 34 + Math.random() * 18, 40 + Math.random() * 16, 0x080608, 0.9).setDepth(23);
    }
    this._done = false;
    window.storyNext = () => this.finish();
    this.playLines();
    this.cameras.main.fadeIn(600);
  }
  async playLinesK() {
    for (const id of ["n_ashen", "k_deliver", "n_vial", "k_next", "n_kclose"]) {
      if (this._done) return;
      await Spire.say(this, id);
      if (this._done) return;
      await Spire.wait(this, 400);
    }
    if (this._done) return;
    this.add.text(640, 96, "— THE WEB HAS A NEW SPIDER —", {
      fontFamily: "Georgia, serif", fontSize: 20, color: "#ffd97a", letterSpacing: 4
    }).setOrigin(0.5).setDepth(30);
    const cardsWonK = Spire.run.deck.length - Spire.STARTING_DECK_K.length;
    this.add.text(640, 130, `her road, walked — cards claimed: ${Math.max(0, cardsWonK)} · final deck: ${Spire.run.deck.length} · HP ${Spire.run.hp}/${Spire.run.maxHp}`, {
      fontFamily: "Georgia, serif", fontSize: 14, color: "#9a8264"
    }).setOrigin(0.5).setDepth(30);
    NODE_BUTTON(this, 640, 660, "WALK IT AGAIN", () => this.finish(), 260);
  }
  async playLines() {
    for (const id of ["n_coach", "n_firebird", "n_hum", "c_flower", "n_close", "w_epilogue"]) {
      if (this._done) return;
      await Spire.say(this, id);
      if (this._done) return;
      await Spire.wait(this, 400);
    }
    if (this._done) return;
    this.add.text(640, 96, "— THE ROAD CONTINUES —", {
      fontFamily: "Georgia, serif", fontSize: 20, color: "#ffd97a", letterSpacing: 4
    }).setOrigin(0.5).setDepth(30);
    const cardsWon = Spire.run.deck.length - Spire.STARTING_DECK.length;
    this.add.text(640, 130, `the whole road, walked — cards claimed: ${Math.max(0, cardsWon)} · final deck: ${Spire.run.deck.length} · HP ${Spire.run.hp}/${Spire.run.maxHp}`, {
      fontFamily: "Georgia, serif", fontSize: 14, color: "#9a8264"
    }).setOrigin(0.5).setDepth(30);
    NODE_BUTTON(this, 640, 660, "WALK IT AGAIN", () => this.finish(), 260);
  }
  finish() {
    if (this._done) return;
    this._done = true;
    if (Spire._voiceNow) { try { Spire._voiceNow.pause(); } catch (e) {} }
    if (Spire._audio && Spire.musicOn) Spire._audio.volume = 0.4;
    Spire.newRun();
    this.cameras.main.fadeOut(500);
    this.time.delayedCall(520, () => this.scene.start("Title"));
  }
}
