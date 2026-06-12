// WorldScene — shared base for exploration zones (City, Grove, Dungeon):
// atmosphere stack, collision, interactables, NPC wander, fighter-frame baking,
// and the clearing-encounter host that hands control to the pit combat sim.

class WorldScene extends Phaser.Scene {

  // ---------- shared init ----------
  worldInit() {
    this.solids = [];
    this.interactables = [];
    this.npcs = [];
    this.walkP = 0; this.face = -Math.PI / 2;
    this.encounterActive = false;
    const GS = window.GameState;
    if (!GS.player) GS.player = { char: 'ronin', kills: 20, level: 1, bladeTier: 1,
      base: { STR: 10, DEX: 10, CON: 10, ATK: 10 }, nickname: 'THE HEADSMAN', copper: 200, belt: [] };
    if (!GS.player.artifacts) GS.player.artifacts = [];
    if (!GS.world.questCounts) GS.world.questCounts = {};
  }

  solid(x, y, w, h) { this.solids.push({ x, y, w, h }); }

  collide(x, y, r) {
    for (const s of this.solids)
      if (x + r > s.x && x - r < s.x + s.w && y + r > s.y && y - r < s.y + s.h) return true;
    return x < 20 || y < 20 || x > this.worldW - 20 || y > this.worldH - 20;
  }

  // ---------- fighter frames (player, npcs, monsters) ----------
  bakeFrames(extra) {
    const pc = document.createElement('canvas'); pc.width = pc.height = 72;
    const rP = createPitCombat({ width: 72, height: 72, ctx: pc.getContext('2d'), ui: {} });
    rP.drawFighter(36, 42, 15, -Math.PI / 2, '#4a3527', { robe: true, headCol: '#caa27a' });
    this.portraitInn = pc;

    const GSP = window.GameState.player;
    const looks = Object.assign({
      'fr-player': GSP.char === 'druid' ? { col: '#2c4430', o: { druid: true, wpnLen: 26, wpnCol: '#d8e4d0', twin: true } }
        : GSP.char === 'warlock' ? { col: '#241a30', o: { warlock: true, robe: true, wpnLen: 30, wpnCol: '#3a3046', staffTip: true, tipCol: '#b070f0', twoHand: false, headCol: '#9a9ab0' } }
        : GSP.char === 'seraph' ? { col: '#cfd6e4', o: { seraphim: true, robe: true, wpnLen: 42, wpnCol: '#f0ead0', twoHand: false, headCol: '#e8e4da' } }
        : { col: '#2c3440', o: { samurai: true, armor: GSP.bladeTier || 0, wpnLen: (GSP.bladeTier === 2 ? 62 : GSP.bladeTier === 1 ? 46 : 30), wpnCol: '#e7d9a8', thickWpn: GSP.bladeTier === 2 } },
      'fr-npc0': { col: '#4a3c30', o: {} }, 'fr-npc1': { col: '#39414a', o: { hood: true } },
      'fr-npc2': { col: '#4a2f33', o: { robe: true, headCol: '#caa27a' } }, 'fr-npc3': { col: '#3c4434', o: {} },
      'fr-wolf': { col: '#3a4a3c', o: { quad: true } },
      'fr-shaman': { col: '#3c4434', o: { robe: true, hood: true, wpnLen: 30, wpnCol: '#5a4a3a', staffTip: true, twoHand: false } },
      'fr-hound': { col: '#4a4038', o: { quad: true } },
      'fr-elf': { col: '#2a4434', o: { wpnLen: 26, wpnCol: '#d8e4d0', headCol: '#caa27a' } },
    }, extra || {});

    const scratch = document.createElement('canvas'); scratch.width = scratch.height = 72;
    const sctx = scratch.getContext('2d');
    const render = createPitCombat({ width: 72, height: 72, ctx: sctx, ui: {} });
    const DIRS = 8, PH = 4;
    // the player's look only changes with character/blade-tier — NEVER destroy a texture
    // a live sprite is using (that's a black screen on WebGL)
    const frSig = GSP.char + ':' + (GSP.bladeTier || 0);
    for (const [key, look] of Object.entries(looks)) {
      if (this.textures.exists(key)) {
        if (key !== 'fr-player' || window.__frPlayerSig === frSig) continue;
        this.textures.remove(key); // look genuinely changed (new run) — safe: no sprite exists yet
      }
      if (key === 'fr-player') window.__frPlayerSig = frSig;
      const sheet = document.createElement('canvas'); sheet.width = 72 * DIRS; sheet.height = 72 * PH;
      const shctx = sheet.getContext('2d');
      for (let d = 0; d < DIRS; d++) for (let p = 0; p < PH; p++) {
        sctx.clearRect(0, 0, 72, 72);
        render.drawFighter(36, 40, look.r || 13, d / DIRS * Math.PI * 2, look.col,
          Object.assign({ phase: p * (Math.PI / 2) + 0.7, moving: p > 0 }, look.o));
        shctx.drawImage(scratch, d * 72, p * 72);
      }
      this.textures.addCanvas(key, sheet);
      const tex = this.textures.get(key);
      for (let d = 0; d < DIRS; d++) for (let p = 0; p < PH; p++) tex.add(d * PH + p, 0, d * 72, p * 72, 72, 72);
    }
  }

  frameFor(face, walkP, moving) {
    const d = Math.round(((face % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) * 8) % 8;
    const p = moving ? (1 + Math.floor(walkP * 2) % 3) : 0;
    return d * 4 + p;
  }

  // ---------- atmosphere ----------
  makeAtmosphere(opts) {
    const o = Object.assign({ darkness: 0.84, darkCol: 0x06040c, fogTint: null, emberCol: '#ffb050' }, opts || {});
    if (!this.textures.exists('softlight')) {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const x = c.getContext('2d');
      const gr = x.createRadialGradient(128, 128, 10, 128, 128, 128);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
      this.textures.addCanvas('softlight', c);
    }
    if (!this.textures.exists('vignette')) {
      const c = document.createElement('canvas'); c.width = 1280; c.height = 720;
      const x = c.getContext('2d');
      const gr = x.createRadialGradient(640, 360, 250, 640, 360, 760);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.62)');
      x.fillStyle = gr; x.fillRect(0, 0, 1280, 720);
      this.textures.addCanvas('vignette', c);
    }
    if (!this.textures.exists('fognoise')) {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const x = c.getContext('2d');
      for (let i = 0; i < 240; i++) { x.fillStyle = 'rgba(160,160,190,' + (Math.random() * 0.16) + ')';
        const r = 14 + Math.random() * 44;
        x.beginPath(); x.arc(Math.random() * 256, Math.random() * 256, r, 0, 7); x.fill(); }
      this.textures.addCanvas('fognoise', c);
    }
    if (!this.textures.exists('ember')) {
      const c = document.createElement('canvas'); c.width = c.height = 4;
      c.getContext('2d').fillStyle = o.emberCol; c.getContext('2d').fillRect(0, 0, 4, 4);
      this.textures.addCanvas('ember', c);
    }
    this.darkAlpha = o.darkness; this.darkCol = o.darkCol;
    this.darkRT = this.add.renderTexture(0, 0, 1280, 720).setOrigin(0).setScrollFactor(0).setDepth(90);
    this.lightStamp = this.make.image({ key: 'softlight', add: false });
    this.fog1 = this.add.tileSprite(640, 360, 1280, 720, 'fognoise').setScrollFactor(0).setDepth(91).setAlpha(0.07);
    this.fog2 = this.add.tileSprite(640, 360, 1280, 720, 'fognoise').setScrollFactor(0).setDepth(91).setAlpha(0.045).setTileScale(1.9);
    if (o.fogTint) { this.fog1.setTint(o.fogTint); this.fog2.setTint(o.fogTint); }
    this.add.image(640, 360, 'vignette').setScrollFactor(0).setDepth(92);
    this.add.particles(640, 730, 'ember', { x: { min: -640, max: 640 }, lifespan: 7000,
      speedY: { min: -26, max: -10 }, speedX: { min: -7, max: 7 }, scale: { start: 0.8, end: 0 },
      alpha: { start: 0.4, end: 0 }, quantity: 1, frequency: 300, blendMode: 'ADD' })
      .setScrollFactor(0).setDepth(89);
    this.zoneLights = [];
  }

  addLight(x, y, r, withPost) {
    this.zoneLights.push({ x, y, r });
    if (withPost) {
      this.add.rectangle(x, y, 4, 18, 0x2c2118).setOrigin(0.5, 1).setDepth(y);
      this.add.circle(x, y - 22, 4, 0xffc873, 1).setDepth(y).setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  updateAtmosphere(time, dt) {
    const cam = this.cameras.main;
    this.darkRT.clear();
    this.darkRT.fill(this.darkCol, this.darkAlpha);
    const stamp = this.lightStamp;
    const drawLight = (wx, wy, r) => {
      const sx = wx - cam.scrollX, sy = wy - cam.scrollY;
      if (sx < -r || sy < -r || sx > 1280 + r || sy > 720 + r) return;
      const fl = r * (0.94 + Math.sin(time * 0.011 + wx) * 0.04 + Math.random() * 0.03);
      stamp.setDisplaySize(fl * 2, fl * 2);
      this.darkRT.erase(stamp, sx, sy);
    };
    for (const l of this.zoneLights) drawLight(l.x, l.y - 20, l.r);
    drawLight(this.player.x, this.player.y, 135);
    this.fog1.tilePositionX += 9 * dt; this.fog1.tilePositionY += 2.2 * dt;
    this.fog2.tilePositionX -= 5 * dt; this.fog2.tilePositionY += 1.2 * dt;
  }

  // ---------- player + npcs ----------
  spawnPlayer(x, y) {
    this.player = this.add.sprite(x, y, 'fr-player', 0).setDepth(y);
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,J,M,ESC,ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT');
    this.input.keyboard.on('keydown-E', () => { if (!this.encounterActive) this.tryInteract(); });
    this.input.keyboard.on('keydown-J', () => { if (this.encounterActive) return;
      this.qlogOpen = !this.qlogOpen; CityUI.questlog(this.qlogOpen, Quests.mainFor(), window.GameState.world.flags); });
    this.input.keyboard.on('keydown-M', () => { if (!this.encounterActive) WorldMapUI.toggle(); });
    this.input.keyboard.on('keydown-F10', () => {
      const label = QuestNav.cycleMode();
      this.floatText(this.player.x, this.player.y - 56, label, label === 'AUTO: OFF' ? '#9a8f80' : '#3df0c8', 14);
    });
    // restore AUTO mode from the save
    if (window.GameState.meta && window.GameState.meta.autoMode) QuestNav.setMode(window.GameState.meta.autoMode);
    else CityUI.syncAutoBtn && CityUI.syncAutoBtn();
    this.input.keyboard.on('keydown-ESC', () => { CityUI.closeDialog(); CityUI.guildBoard(false);
      WorldMapUI.hide(); this.qlogOpen = false; CityUI.questlog(false); });
    CityUI.init(); CityUI.hud(true);
    CityUI.setIdentity(window.GameState.player.nickname);
    CityUI.setPurse(window.GameState.player.copper);
    CityUI.belt(window.GameState.player.belt);
    // mobile: stick moves, tapping the prompt interacts, tapping belt slots drinks
    TouchStick.attach(this, p => { if (this.encounterActive) this.encCombat.pointerAttack(p.x, p.y); });
    CityUI._onPrompt = () => { if (!this.encounterActive) this.tryInteract(); };
    CityUI._onBelt = i => this.useBeltSlot(i, this.encounterActive);
    CityUI._onJournal = () => { this.qlogOpen = !this.qlogOpen;
      CityUI.questlog(this.qlogOpen, Quests.mainFor(), window.GameState.world.flags); };
    CityUI._onTrackQuest = () => { this.qlogOpen = false; CityUI.questlog(false);
      QuestNav.startTracking(this); };
    CityUI.syncAutoBtn();
    // a tracked walk continues across zone loads
    if (QuestNav.tracking) this.time.delayedCall(150, () => QuestNav.replan(this));
    // zone music + autosave heartbeat
    const zoneTrack = { 'karridge-city': 'city', 'thorn-grove': 'grove', 'grove-dungeon': 'dungeon', 'dragonspine': 'mountain' }[window.GameState.world.zone];
    if (zoneTrack) MusicMan.play(zoneTrack);
    SaveSystem.save();
    this.time.addEvent({ delay: 10000, loop: true, callback: () => { if (!this.encounterActive) SaveSystem.save(); } });
  }

  updatePlayer(dt) {
    if (CityUI.dialogOpen() || this.encounterActive) return 0;
    const P = window.GameState.player;
    const DEX = P.char === 'ronin' ? P.base.DEX + P.kills * 2 : P.base.DEX + 3 * (Math.min(10, P.level) - 1);
    const spd = 185 + (DEX - 10) * 4;
    let mx = (this.keys.A.isDown ? -1 : 0) + (this.keys.D.isDown ? 1 : 0);
    let my = (this.keys.W.isDown ? -1 : 0) + (this.keys.S.isDown ? 1 : 0);
    if (TouchStick.mag > 0.15) { mx = TouchStick.dx; my = TouchStick.dy; }
    if (mx || my) QuestNav.stop();                 // your hands always outrank the chauffeur
    else if (QuestNav.tracking) {
      const d = QuestNav.drive(this);
      if (d) { mx = d.mx; my = d.my; }
    }
    const m = Math.hypot(mx, my);
    if (m > 0) {
      this.face = Math.atan2(my, mx);
      const nx = this.player.x + mx / m * spd * dt, ny = this.player.y + my / m * spd * dt;
      if (!this.collide(nx, this.player.y, 10)) this.player.x = nx;
      if (!this.collide(this.player.x, ny, 10)) this.player.y = ny;
      this.walkP += spd * dt * 0.011;
    }
    this.player.setFrame(this.frameFor(this.face, this.walkP, m > 0));
    this.player.setDepth(this.player.y);
    return m;
  }

  addNPC(key, x, y, zone) {
    const spr = this.add.sprite(x, y, key, 0).setDepth(y);
    this.npcs.push({ spr, zone, tx: x, ty: y, pauseT: Math.random() * 3, walkP: 0, face: 0, speed: 52 });
    return spr;
  }

  updateNPCs(dt) {
    for (const n of this.npcs) {
      if (n.pauseT > 0) { n.pauseT -= dt; n.spr.setFrame(this.frameFor(n.face, 0, false)); continue; }
      const dx = n.tx - n.spr.x, dy = n.ty - n.spr.y, d = Math.hypot(dx, dy);
      if (d < 6) { n.pauseT = 1.5 + Math.random() * 4;
        n.tx = (n.zone.x + Math.random() * n.zone.w) * 32; n.ty = (n.zone.y + Math.random() * n.zone.h) * 32; continue; }
      n.face = Math.atan2(dy, dx);
      const nx = n.spr.x + Math.cos(n.face) * n.speed * dt, ny = n.spr.y + Math.sin(n.face) * n.speed * dt;
      if (!this.collide(nx, ny, 8)) { n.spr.x = nx; n.spr.y = ny; } else { n.pauseT = 1; n.tx = n.spr.x; n.ty = n.spr.y; }
      n.walkP += n.speed * dt * 0.011;
      n.spr.setFrame(this.frameFor(n.face, n.walkP, true));
      n.spr.setDepth(n.spr.y);
    }
  }

  // ---------- interactables ----------
  tryInteract() {
    if (CityUI.dialogOpen()) return;
    let best = null, bd = 60;
    for (const it of this.interactables) {
      const d = Math.hypot(it.x - this.player.x, it.y - this.player.y);
      if (d < bd) { bd = d; best = it; }
    }
    if (best) best.fn();
  }

  updatePrompt() {
    QuestNav.updateDialogs(this, 1 / 60);
    QuestNav.idleResume(this, 1 / 60);
    let best = null, bd = 60;
    for (const it of this.interactables) {
      const d = Math.hypot(it.x - this.player.x, it.y - this.player.y);
      if (d < bd) { bd = d; best = it; }
    }
    CityUI.prompt(best && !CityUI.dialogOpen() && !this.encounterActive ? 'E — ' + best.label : null);
  }

  floatText(x, y, txt, col, size) {
    const t = this.add.text(x, y, txt, { fontFamily: 'Courier New', fontSize: (size || 13) + 'px',
      color: col || '#d8cdb8', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(10000);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 2200, onComplete: () => t.destroy() });
  }

  signDialog(name, text) {
    CityUI.dialog(name, text, [{ label: 'Leave', fn: () => CityUI.closeDialog() }]);
  }

  // ---------- clearing encounters (pit combat host) ----------
  initEncounterHost(theme) {
    const W = 1280, H = 720, DPR = 0.55;
    const texKey = 'enc-frame-' + this.scene.key;
    if (this.textures.exists(texKey)) this.textures.remove(texKey);
    this.encTex = this.textures.createCanvas(texKey, Math.round(W * DPR), Math.round(H * DPR));
    const ctx = this.encTex.getContext();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.imageSmoothingEnabled = false;
    this.encDecal = document.createElement('canvas');
    this.encDecal.width = Math.round(W * DPR); this.encDecal.height = Math.round(H * DPR);
    const dctx = this.encDecal.getContext('2d');
    dctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const $ = id => document.getElementById(id);
    const ui = {
      stats: (dice, kills) => { $('pdice').textContent = dice; $('pkills').textContent = kills; },
      name: t => { $('pname').textContent = t; },
      btnLabel: (id, txt) => { const el = $(id); if (el) el.firstChild.nodeValue = txt; },
      flash: o => { const f = $('flash'); f.style.transition = 'none'; f.style.opacity = o;
        requestAnimationFrame(() => { f.style.transition = 'opacity .4s'; f.style.opacity = 0; }); },
      banner: (t1, t2, ms, col) => { const b = $('banner'), b1 = b.querySelector('.b1');
        b1.textContent = t1; b.querySelector('.b2').textContent = t2 || '';
        b1.style.color = col || ''; b1.style.textShadow = col ? ('0 0 24px ' + col + ',4px 4px 0 #1a0408') : '';
        b.style.display = 'block'; clearTimeout(b._t); b._t = setTimeout(() => b.style.display = 'none', ms || 1600); },
      hud: v => { $('hud').style.display = v ? 'block' : 'none'; },
      controls: v => { $('controls').style.display = v ? 'block' : 'none'; },
      boss: () => {}, hpbar: f => { $('hpbar').style.width = (f * 100) + '%'; }, bossbar: () => {},
      cds: c => { const set = (btn, f) => { const el = document.querySelector('#' + btn + ' .cd'); if (!el) return;
        el.style.display = f > 0 ? 'block' : 'none'; el.style.transform = 'scaleY(' + f + ')'; };
        set('bRoll', c.roll); set('bSlash', c.slash); set('bHeavy', c.heavy); set('bParry', c.parry); },
      demoCap: () => {}, intro: () => {}, screen: () => {},
    };
    this.encCombat = createPitCombat({ width: W, height: H, ctx, dctx, decalCanvas: this.encDecal,
      now: () => performance.now(),
      vibrate: ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} },
      ui, theme });
    this.encImg = this.add.image(0, 0, texKey).setOrigin(0).setScrollFactor(0).setDepth(95)
      .setDisplaySize(W, H).setVisible(false);

    // encounter touch: stick feeds the sim each frame (see updateEncounter)
    // combat input routed only while an encounter runs
    this.input.keyboard.on('keydown', e => {
      if (!this.encounterActive) {
        const belt = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7 }[e.key];
        if (belt !== undefined) this.useBeltSlot(belt, false);
        return;
      }
      this.encCombat.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') this.encCombat.doRoll();
      const k = e.key.toLowerCase();
      if (k === 'q') this.encCombat.doHeavy();
      if (k === 'k') this.encCombat.doParry();
      if (k === 'j') this.encCombat.doSlash();
      const belt = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7 }[e.key];
      if (belt !== undefined) this.useBeltSlot(belt, true);
    });
    this.input.keyboard.on('keyup', e => {
      if (!this.encounterActive) return;
      this.encCombat.keys[e.key.toLowerCase()] = false;
      if (e.key.toLowerCase() === 'q') this.encCombat.heavyRelease();
    });
    this.input.on('pointermove', p => { if (this.encounterActive) this.encCombat.pointerMove(p.x, p.y); });
    this.input.on('pointerdown', p => { if (!this.encounterActive) return;
      if (p.rightButtonDown()) this.encCombat.doRoll(); else this.encCombat.pointerAttack(p.x, p.y); });
    this.input.mouse.disableContextMenu();
  }

  // ---------- companions ----------
  placeCompanions(zone) {
    this._portraits = this._portraits || {};
    for (const [key, c] of Object.entries(Companions)) {
      if (c.where !== zone && c.where !== 'both') continue;
      const st = CompanionEngine.state(key);
      if (st.following) continue; // they're walking with you, not standing at their spot
      const x = c.spot[0] * 32, y = c.spot[1] * 32;
      const texKey = 'fr-comp-' + key;
      if (!this.textures.exists(texKey)) this.bakeFrames({ [texKey]: c.look });
      const spr = this.add.sprite(x, y, texKey, 0).setDepth(y);
      this.add.text(x, y - 34, c.name, { fontFamily: 'Courier New', fontSize: '10px', color: '#e7b450', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(y);
      this.interactables.push({ x, y, label: 'speak with ' + c.name, fn: () => CompanionEngine.talk(this, key) });
    }
    // active follower walks in with you
    const fk = window.GameState.world.activeFollower;
    if (fk) this.spawnFollower(fk);
    this.input.keyboard.on('keydown-P', () => {
      this.compOpen = !this.compOpen;
      CityUI.companions(this.compOpen, Object.entries(Companions).map(([k, c]) => {
        const st = CompanionEngine.state(k);
        return { name: c.name, blurb: c.blurb, met: st.met, recruited: st.recruited, approval: st.approval,
          following: st.following, where: c.where === 'both' ? 'roams' : c.where };
      }));
    });
  }

  portraitFor(key) {
    this._portraits = this._portraits || {};
    if (this._portraits[key]) return this._portraits[key];
    const c = Companions[key];
    const pc = document.createElement('canvas'); pc.width = pc.height = 72;
    const r = createPitCombat({ width: 72, height: 72, ctx: pc.getContext('2d'), ui: {} });
    r.drawFighter(36, 42, 15, -Math.PI / 2, c.look.col, c.look.o);
    this._portraits[key] = pc;
    return pc;
  }

  onRecruit(key) {
    CompanionEngine.remember(key, 'joined you');
    CompanionEngine.rememberAll(Companions[key].name + ' joined the company');
    this.setFollower(key);
    this.floatText(this.player.x, this.player.y - 56, Companions[key].name + ' WALKS WITH YOU', '#3df0c8', 15);
  }

  setFollower(key) {
    const GS = window.GameState;
    for (const k of Object.keys(GS.companions)) GS.companions[k].following = false;
    if (this.followerSpr) { this.followerSpr.destroy(); this.followerSpr = null; this.followerKey = null; }
    GS.world.activeFollower = key || null;
    if (key) { CompanionEngine.state(key).following = true; this.spawnFollower(key); }
  }

  spawnFollower(key) {
    const c = Companions[key];
    const texKey = 'fr-comp-' + key;
    if (!this.textures.exists(texKey)) this.bakeFrames({ [texKey]: c.look });
    if (this.followerSpr) this.followerSpr.destroy();
    this.followerKey = key;
    this.followerSpr = this.add.sprite(this.player.x + 30, this.player.y + 20, texKey, 0).setDepth(this.player.y + 20);
    this.followerWalkP = 0;
  }

  updateFollower(dt) {
    if (!this.followerSpr) return;
    const f = this.followerSpr;
    const dx = this.player.x - f.x, dy = this.player.y - f.y, d = Math.hypot(dx, dy);
    if (d > 46) {
      const face = Math.atan2(dy, dx), spd = Math.min(260, 120 + d);
      const nx = f.x + Math.cos(face) * spd * dt, ny = f.y + Math.sin(face) * spd * dt;
      if (!this.collide(nx, ny, 8)) { f.x = nx; f.y = ny; } else { f.x += Math.cos(face) * spd * dt * 0.3; f.y += Math.sin(face) * spd * dt * 0.3; }
      this.followerWalkP += spd * dt * 0.011;
      f.setFrame(this.frameFor(face, this.followerWalkP, true));
    } else f.setFrame(this.frameFor(this.face, 0, false));
    f.setDepth(f.y);
  }

  artifactMods() {
    const a = window.GameState.player.artifacts || [];
    return {
      dmg: a.includes('ley-shard') ? 1.10 : 1,
      maxhp: a.includes('coalheart') ? 1.10 : 1,
      parryWin: a.includes('duelists-knot') ? 1.20 : 1,
      dodgeWin: a.includes('duelists-knot') ? 1.20 : 1,
    };
  }

  useBeltSlot(i, inCombat) {
    const P = window.GameState.player;
    const it = P.belt[i];
    if (!it || !it.type.startsWith('potion')) return;
    if (!inCombat) { this.floatText(this.player.x, this.player.y - 50, 'save it for a fight', '#6b5d4f'); return; }
    if (this.encCombat.usePotion(it.type)) { P.belt.splice(i, 1); CityUI.belt(P.belt); }
  }

  // mild field scaling: the world pushes back against a snowballed champion.
  // Kits untouched (source is law) — only MY field enemies get tougher hides.
  fieldScale() {
    if (window.GAME_CONFIG && window.GAME_CONFIG.fieldScaling === false) return 1;
    const k = window.GameState.player.kills || 0;
    return Math.min(2.5, 1 + Math.max(0, k - 20) * 0.012);
  }

  startEncounter(name, sub, pack, onEnd) {
    const GS = window.GameState, P = GS.player;
    const fs = this.fieldScale();
    pack = pack.map(e => Object.assign({}, e, { hp: Math.round(e.hp * fs), maxhp: Math.round((e.maxhp || e.hp) * fs) }));
    this.encounterActive = true;
    this.encImg.setVisible(true);
    this.encCombat.setPlayerSnapshot(P);
    this.encCombat.setMods(this.artifactMods());
    // the companion fights beside you
    const fk = GS.world.activeFollower;
    if (fk) { const c = Companions[fk];
      this.encCombat.addAlly({ humanLook: c.look.o, col: c.look.col, nameTag: c.name });
      CompanionEngine.remember(fk, 'fought beside you'); }
    this.encCombat.startEncounter(pack, win => {
      // sync the run back into the world snapshot (ronin snowball persists)
      P.kills = this.encCombat.P.kills;
      P.level = Math.min(10, Math.floor(this.encCombat.P.level || P.level));
      P.bladeTier = this.encCombat.P.bladeTier || P.bladeTier;
      P.nickname = this.encCombat.nickname;
      CityUI.setIdentity(P.nickname); CityUI.belt(P.belt);
      this.encounterActive = false;
      this.encImg.setVisible(false);
      document.getElementById('hud').style.display = 'none';
      document.getElementById('controls').style.display = 'none';
      onEnd(win);
    });
    const b = document.getElementById('banner'), b1 = b.querySelector('.b1');
    b1.textContent = name; b.querySelector('.b2').textContent = sub || '';
    b1.style.color = '#7fbf6a'; b.style.display = 'block';
    clearTimeout(b._t); b._t = setTimeout(() => b.style.display = 'none', 1600);
  }

  updateEncounter(time) {
    if (!this.encounterActive) return false;
    QuestNav.updateDialogs(this, 1 / 60);
    Autopilot.frame(this.encCombat, 1 / 60);
    this.encCombat.stick.dx = TouchStick.dx; this.encCombat.stick.dy = TouchStick.dy; this.encCombat.stick.mag = TouchStick.mag;
    this.encCombat.frame(time);
    this.encTex.refresh();
    return true;
  }
}
