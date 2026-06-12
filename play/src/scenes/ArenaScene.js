// ArenaScene — hosts the ported Pit of Karridge combat sim on a CanvasTexture.
// The sim renders with the SAME 2d-canvas code as the original HTML (pixel-identical),
// Phaser owns the display list / scenes so the arena plugs into the city world later.

class ArenaScene extends Phaser.Scene {
  constructor() { super({ key: 'ArenaScene' }); }
  // Bellow's rate: 1 silver per kill (1g=10s=100c; money stored as copper — see core/money.js)

  create() {
    const W = this.scale.width, H = this.scale.height; // 1280x720 logical
    const DPR = 0.55; // source's chunky low-res backing buffer

    // --- backing canvases, set up exactly like the source's resize() ---
    this.pitTex = this.textures.createCanvas('pit-frame', Math.round(W * DPR), Math.round(H * DPR));
    const ctx = this.pitTex.getContext();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = false;

    this.decalCv = document.createElement('canvas');
    this.decalCv.width = Math.round(W * DPR); this.decalCv.height = Math.round(H * DPR);
    const dctx = this.decalCv.getContext('2d');
    dctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    this.frameImg = this.add.image(0, 0, 'pit-frame').setOrigin(0, 0);
    this.frameImg.setDisplaySize(W, H);

    // --- DOM overlay handles (the source UI, ported into index.html) ---
    const $ = id => document.getElementById(id);
    const els = {
      hud: $('hud'), controls: $('controls'), banner: $('banner'), flash: $('flash'),
      pname: $('pname'), pdice: $('pdice'), pkills: $('pkills'), hpbar: $('hpbar'),
      bossw: $('bossw'), bossname: $('bossname'), bosshp: $('bosshp'),
      intro: $('intro'), introName: $('introName'), introBio: $('introBio'), demoCap: $('demoCap'),
      statTable: $('statTable')
    };
    const screens = () => document.querySelectorAll('.screen');

    const ui = {
      stats: (dice, kills) => { els.pdice.textContent = dice; els.pkills.textContent = kills; },
      name: t => { els.pname.textContent = t; },
      btnLabel: (id, txt) => { const el = $(id); if (el) el.firstChild.nodeValue = txt; },
      flash: o => { els.flash.style.transition = 'none'; els.flash.style.opacity = o;
        requestAnimationFrame(() => { els.flash.style.transition = 'opacity .4s'; els.flash.style.opacity = 0; }); },
      banner: (t1, t2, ms, col) => { const b = els.banner, b1 = b.querySelector('.b1');
        b1.textContent = t1; b.querySelector('.b2').textContent = t2 || '';
        b1.style.color = col || '';
        b1.style.textShadow = col ? ('0 0 24px ' + col + ',4px 4px 0 #1a0408') : '';
        b.style.display = 'block'; clearTimeout(b._t); b._t = setTimeout(() => b.style.display = 'none', ms || 1600); },
      hud: v => { els.hud.style.display = v ? 'block' : 'none'; },
      controls: v => { els.controls.style.display = v ? 'block' : 'none'; },
      boss: (v, name) => { els.bossw.style.display = v ? 'block' : 'none'; if (v) els.bossname.textContent = name; },
      hpbar: f => { els.hpbar.style.width = (f * 100) + '%'; },
      bossbar: f => { els.bosshp.style.width = (f * 100) + '%'; },
      cds: c => {
        const set = (btn, f, max) => { const el = document.querySelector('#' + btn + ' .cd'); if (!el) return;
          el.style.display = f > 0 ? 'block' : 'none'; el.style.transform = 'scaleY(' + f + ')'; };
        set('bRoll', c.roll); set('bSlash', c.slash); set('bHeavy', c.heavy); set('bParry', c.parry);
      },
      demoCap: t => { els.demoCap.textContent = t; },
      intro: (v, data) => { els.intro.style.display = v ? 'flex' : 'none';
        if (v && data) { els.introName.textContent = data.name; els.introBio.textContent = data.bio;
          if (window.VoiceMan) VoiceMan.say('NARRATOR', data.bio); } },
      screen: (id, data) => {
        for (const s of screens()) s.classList.remove('show');
        if (window.VoiceMan) {
          if (id === 'board' && data) VoiceMan.say('BELLOW', data.foeTaunt.replace(/^"|"$/g, ''));
          else if (id === 'death' && data) VoiceMan.say('NARRATOR', data.quote);
          else VoiceMan.stop();
        }
        if (!id) return;
        if (id === 'board' && data) {
          $('foeName').textContent = data.foeName; $('foeRec').textContent = data.foeRec;
          $('foeTaunt').textContent = data.foeTaunt; $('odds').textContent = data.odds;
          $('crowdLine').textContent = data.crowd;
          els.statTable.innerHTML = '';
          for (const [lbl, val, up] of data.rows) {
            const tr = document.createElement('tr');
            for (const [cls, txt] of [['lbl', lbl], ['', val], ['up', up]]) {
              const td = document.createElement('td'); if (cls) td.className = cls; td.textContent = txt; tr.appendChild(td); }
            els.statTable.appendChild(tr); }
        }
        if (id === 'death' && data) { $('deathStats').textContent = data.stats;
          $('deathQuote').textContent = data.quote; $('deathHints').textContent = data.hints; }
        if (id === 'victory' && data) {
          // ---- arena -> city handoff: the run's earnings follow the player out of the Pit ----
          const P = this.combat.P;
          const purse = P.kills * Money.PIT_PAYOUT_PER_KILL; // copper
          window.GameState.player = {
            char: P.char,
            kills: P.kills,
            level: P.char === 'ronin' ? 1 : Math.min(10, Math.floor(P.level || 1)),
            bladeTier: P.bladeTier || 0,
            base: Object.assign({}, P.base),
            nickname: this.combat.nickname,
            copper: purse,
            belt: []
          };
          window.GameState.world.flags.pitChampion = true;
          $('vicStats').textContent = data.stats + ' · Bellow pays out ' + Money.fmt(purse);
        }
        $(id).classList.add('show');
      }
    };

    // --- the sim (numbers + feel live in src/combat/pit.js — the ported source of truth) ---
    this.combat = createPitCombat({
      width: W, height: H, ctx, dctx, decalCanvas: this.decalCv,
      now: () => performance.now(),
      vibrate: ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} },
      ui
    });

    // --- input: identical bindings to the source ---
    this.input.keyboard.on('keydown', e => {
      this.combat.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') this.combat.doRoll();
      const k = e.key.toLowerCase();
      if (k === 'q') this.combat.doHeavy();
      if (k === 'k') this.combat.doParry();
      if (k === 'j') this.combat.doSlash();
    });
    this.input.keyboard.on('keyup', e => {
      this.combat.keys[e.key.toLowerCase()] = false;
      if (e.key.toLowerCase() === 'q') this.combat.heavyRelease();
    });
    this.input.on('pointermove', p => this.combat.pointerMove(p.x, p.y));
    this.input.on('pointerdown', p => {
      const ev = p.event;
      if (ev && (ev.pointerType === 'touch' || ev.pointerType === 'pen')) return; // TouchStick handles touch
      if (p.rightButtonDown()) this.combat.doRoll();
      else this.combat.pointerAttack(p.x, p.y);
    });
    this.input.mouse.disableContextMenu();
    // mobile: left-half stick feeds the sim's stick (same math as the source HTML)
    TouchStick.attach(this, p => this.combat.pointerAttack(p.x, p.y));

    // touch buttons (mobile parity with source)
    const bindBtn = (id, fn, upFn) => { const el = $(id); if (!el) return;
      el.addEventListener('pointerdown', e => { e.stopPropagation(); el.classList.add('held'); fn(); });
      el.addEventListener('pointerup', () => { el.classList.remove('held'); if (upFn) upFn(); });
      el.addEventListener('pointercancel', () => { el.classList.remove('held'); if (upFn) upFn(); }); };
    bindBtn('bSlash', () => this.combat.doSlash());
    bindBtn('bRoll', () => this.combat.doRoll());
    bindBtn('bHeavy', () => this.combat.doHeavy(), () => this.combat.heavyRelease());
    bindBtn('bParry', () => this.combat.doParry());

    // screen buttons
    $('startBtn').addEventListener('pointerdown', () => this.combat.startIntro('ronin'));
    $('druidBtn').addEventListener('pointerdown', () => this.combat.startIntro('druid'));
    $('warlockBtn').addEventListener('pointerdown', () => this.combat.startIntro('warlock'));
    $('seraphBtn').addEventListener('pointerdown', () => this.combat.startIntro('seraph'));
    $('enterBtn').addEventListener('pointerdown', () => this.combat.endIntro());
    $('fightBtn').addEventListener('pointerdown', () => this.combat.startFight());
    $('againBtn').addEventListener('pointerdown', () => this.combat.fullReset());
    $('vicBtn').addEventListener('pointerdown', () => this.combat.fullReset());
    $('leaveBtn').addEventListener('pointerdown', () => {
      for (const s of screens()) s.classList.remove('show');
      ui.hud(false); ui.controls(false); ui.boss(false, '');
      this.scene.start('CityScene');
    });
    // F10 / AUTO button: OFF -> FIGHT -> FULL (full = AFK through the whole game)
    const cycleAuto = () => {
      const label = QuestNav.cycleMode();
      ui.banner(label, label === 'AUTO: OFF' ? 'your hands now' : 'the pit plays itself', 1600, '#3df0c8');
      if (QuestNav.mode >= 1 && this.combat.S.mode === 'title') this.combat.fullReset('warlock');
    };
    this.input.keyboard.on('keydown-F10', cycleAuto);
    const ab = $('autoBtnArena');
    if (ab) ab.addEventListener('pointerdown', e => { e.stopPropagation(); cycleAuto(); });
    if (window.GameState.meta && window.GameState.meta.autoMode) QuestNav.setMode(window.GameState.meta.autoMode);
    // DEV: F9 on the title screen skips straight to the city with a stock champion
    this.input.keyboard.on('keydown-F9', () => {
      if (!window.GameState.player) window.GameState.player = {
        char: 'ronin', kills: 20, level: 1, bladeTier: 1,
        base: { STR: 10, DEX: 10, CON: 10, ATK: 10 },
        nickname: 'THE HEADSMAN', copper: 200, belt: []
      };
      for (const s of screens()) s.classList.remove('show');
      ui.hud(false); ui.controls(false); ui.boss(false, '');
      this.scene.start('CityScene');
    });

    // continue from save
    const cont = $('continueBtn');
    if (SaveSystem.hasSave()) {
      cont.style.display = 'block';
      cont.addEventListener('pointerdown', () => {
        const st = SaveSystem.load();
        if (!st) { cont.style.display = 'none'; return; }
        SaveSystem.apply(st);
        for (const s of screens()) s.classList.remove('show');
        ui.hud(false); ui.controls(false); ui.boss(false, '');
        this.scene.start(SaveSystem.sceneForZone(st.world.zone));
      });
    }

    window.GameState.world.zone = 'pit-of-karridge';
    this.makeTitleBackdrop();
    this._tbVisible = null; // force first toggle
    MusicMan.play('title');
  }

  update(time, dtMs) {
    Autopilot.frame(this.combat, Math.min(0.05, dtMs / 1000));
    this.combat.stick.dx = TouchStick.dx; this.combat.stick.dy = TouchStick.dy; this.combat.stick.mag = TouchStick.mag;
    this.combat.frame(time);
    this.pitTex.refresh();
    const m = this.combat.S.mode;
    // arena track persists through the fight board (no flip-flop between fights).
    // Per-character pit themes (Hiro): ronin keeps the arena track, warlock gets
    // zero dark thirty (the dungeon track), druid gets her own pit-druid track.
    const ch = (window.GameState && GameState.player && GameState.player.char) || (this.combat.P && this.combat.P.char);
    const pitTrack = ch === 'warlock' ? 'dungeon' : (ch === 'druid' && !MusicMan._missing['pit-druid'] ? 'pit-druid' : 'arena'); // falls back to arena until pit-druid.mp3 exists
    MusicMan.play(m === 'fight' || m === 'demo' || m === 'board' ? pitTrack : 'title');
    this.updateTitleBackdrop(time, dtMs);
    // AUTO FULL: walk out of the Pit when the crowd has its name
    const vic = document.getElementById('victory').classList.contains('show');
    if (vic && QuestNav.mode === 2 && !this._vicAuto) {
      this._vicAuto = true;
      setTimeout(() => { if (document.getElementById('victory').classList.contains('show'))
        document.getElementById('leaveBtn').dispatchEvent(new Event('pointerdown')); }, 3500);
    } else if (!vic) this._vicAuto = false;
  }

  // ===================== torchlit title backdrop (the Bucket-0 look) =====================
  makeTitleBackdrop() {
    const W = this.scale.width, H = this.scale.height;
    const objs = [];
    // stone floor
    const g = this.add.graphics().setDepth(10);
    for (let y = 0; y < H; y += 40) for (let x = 0; x < W; x += 40) {
      const shade = 16 + Math.floor(Math.random() * 10);
      g.fillStyle(Phaser.Display.Color.GetColor(shade, shade - 2, shade - 4));
      g.fillRect(x, y, 38, 38);
    }
    objs.push(g);
    // torch glows
    this.tbTorch = this.add.circle(W / 2, H / 2 + 80, 230, 0xff9a3c, 0.10).setDepth(11);
    this.tbTorchIn = this.add.circle(W / 2, H / 2 + 80, 125, 0xffb050, 0.12).setDepth(11);
    this.tbSide1 = this.add.circle(W * 0.16, H * 0.3, 150, 0xff9a3c, 0.07).setDepth(11);
    this.tbSide2 = this.add.circle(W * 0.84, H * 0.3, 150, 0xff9a3c, 0.07).setDepth(11);
    objs.push(this.tbTorch, this.tbTorchIn, this.tbSide1, this.tbSide2);
    // drifting fog
    this.tbFog1 = this.add.rectangle(0, H * 0.42, W * 2, 190, 0x9090a0, 0.05).setOrigin(0, 0.5).setDepth(12);
    this.tbFog2 = this.add.rectangle(0, H * 0.72, W * 2, 250, 0x707080, 0.04).setOrigin(0, 0.5).setDepth(12);
    objs.push(this.tbFog1, this.tbFog2);
    // embers
    if (!this.textures.exists('title-ember')) {
      const c = document.createElement('canvas'); c.width = c.height = 4;
      c.getContext('2d').fillStyle = '#ffb050'; c.getContext('2d').fillRect(0, 0, 4, 4);
      this.textures.addCanvas('title-ember', c);
    }
    this.tbEmbers = this.add.particles(W / 2, H + 10, 'title-ember', {
      x: { min: -W / 2, max: W / 2 }, lifespan: 6500,
      speedY: { min: -30, max: -12 }, speedX: { min: -8, max: 8 },
      scale: { start: 0.8, end: 0 }, alpha: { start: 0.5, end: 0 },
      quantity: 1, frequency: 200, blendMode: 'ADD',
    }).setDepth(13);
    objs.push(this.tbEmbers);
    this.titleBackdrop = objs;
  }

  updateTitleBackdrop(time, dtMs) {
    const onTitle = document.getElementById('title').classList.contains('show');
    if (this._tbVisible !== onTitle) {
      this._tbVisible = onTitle;
      for (const o of this.titleBackdrop) o.setVisible(onTitle);
      this.frameImg.setVisible(!onTitle);
      if (this.tbEmbers) onTitle ? this.tbEmbers.start() : this.tbEmbers.stop();
    }
    if (!onTitle) return;
    const f = 0.10 + Math.sin(time * 0.01) * 0.015 + Math.random() * 0.02;
    this.tbTorch.setAlpha(f); this.tbTorchIn.setAlpha(f + 0.03);
    this.tbSide1.setAlpha(f * 0.7); this.tbSide2.setAlpha(f * 0.72);
    const W = this.scale.width;
    this.tbFog1.x = -((time * 0.012) % W);
    this.tbFog2.x = -((time * 0.027) % W);
  }
}
