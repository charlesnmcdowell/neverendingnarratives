// CityScene — Karridge City (extends WorldScene; shared systems live there).

class CityScene extends WorldScene {
  constructor() { super({ key: 'CityScene' }); }

  preload() {
    for (const [key, uri] of Object.entries(window.EMBEDDED_ASSETS))
      if (!this.textures.exists(key)) this.load.image(key, uri);
  }

  create() {
    const M = CityMap, T = M.TILE, WPX = M.W * T, HPX = M.H * T;
    this.worldW = WPX; this.worldH = HPX;
    this.worldInit();
    const GS = window.GameState, P = GS.player;
    GS.world.zone = 'karridge-city';
    if (P.char === 'seraph') { // the angel walks a different road — no cold cells, no rumors
      if (!GS.world.flags['q-sq1-the-host-below']) GS.world.flags['q-sq1-the-host-below'] = 'active';
    } else if (!GS.world.flags['q-mq1-empty-cell']) GS.world.flags['q-mq1-empty-cell'] = 'active';

    // props frames
    const propsTex = this.textures.get('cainos-props');
    const F = { door: [32, 98, 68, 90], chest: [96, 32, 64, 64], crate: [160, 0, 64, 64],
      barrel: [160, 160, 32, 56], signEast: [96, 160, 32, 64], well: [352, 264, 112, 88],
      statue: [448, 0, 64, 96] };
    for (const [name, [x, y, w, h]] of Object.entries(F))
      if (!propsTex.has(name)) propsTex.add(name, 0, x, y, w, h);

    // ground
    const map = this.make.tilemap({ width: M.W, height: M.H, tileWidth: T, tileHeight: T });
    const tiles = map.addTilesetImage('cainos-stone', undefined, T, T, 0, 0);
    const ground = map.createBlankLayer('ground', tiles).setDepth(0);
    const blocks = [0, 2, 4, 6];
    for (let ty = 0; ty < M.H; ty += 2) for (let tx = 0; tx < M.W; tx += 2) {
      const b = blocks[Math.floor(Math.random() * blocks.length)];
      ground.putTileAt(b, tx, ty); ground.putTileAt(b + 1, tx + 1, ty);
      ground.putTileAt(b + 8, tx, ty + 1); ground.putTileAt(b + 9, tx + 1, ty + 1);
    }
    ground.forEachTile(t => { t.tint = 0x6a5f63; });

    // walls + gates
    const wallG = this.add.graphics().setDepth(2);
    const drawWallRun = (x, y, w, h) => {
      wallG.fillStyle(0x1a1418); wallG.fillRect(x, y, w, h);
      wallG.fillStyle(0x231b20);
      for (let i = 0; i < (w * h) / 700; i++)
        wallG.fillRect(x + Math.random() * (w - 12), y + Math.random() * (h - 6), 8 + Math.random() * 10, 4 + Math.random() * 4);
      wallG.fillStyle(0x2c2228);
      for (let cx = x; cx < x + w; cx += 24) wallG.fillRect(cx, y - 6, 14, 6);
      this.solid(x, y, w, h);
    };
    const gS = M.gates.south, gN = M.gates.north;
    drawWallRun(0, 0, gN.x * T, T * 1.5);
    drawWallRun((gN.x + gN.w) * T, 0, WPX - (gN.x + gN.w) * T, T * 1.5);
    drawWallRun(0, HPX - T * 1.5, gS.x * T, T * 1.5);
    drawWallRun((gS.x + gS.w) * T, HPX - T * 1.5, WPX - (gS.x + gS.w) * T, T * 1.5);
    drawWallRun(0, 0, T, HPX); drawWallRun(WPX - T, 0, T, HPX);

    // NORTH GATE — open since the guild escort returned (B4): travel trigger
    this.gateNorth = { x: gN.x * T, y: 0, w: gN.w * T, h: T * 1.5 };
    this.solid(gS.x * T, HPX - T * 0.5, gS.w * T, T * 0.5);

    // atmosphere
    this.makeAtmosphere({});
    for (const l of M.lights) this.addLight(l.x * T, l.y * T, l.r, true);

    // buildings
    this.windowLights = [];
    for (const b of M.buildings) {
      const bx = b.x * T, by = b.y * T, bw = b.w * T, bh = b.h * T;
      const key = 'bld-' + b.w + 'x' + b.h;
      if (!this.textures.exists(key)) this.makeBuildingTexture(key, bw, bh);
      this.add.image(bx, by, key).setOrigin(0).setDepth(by + bh);
      this.solid(bx, by, bw, bh);
      const dx = bx + b.door * T, dy = by + bh;
      this.add.image(dx, dy, 'cainos-props', 'door').setOrigin(0.5, 1).setDepth(dy + 1).setScale(0.9);
      for (let wx = bx + 24; wx < bx + bw - 24; wx += 86) {
        const wy = by + bh - 18;
        this.add.rectangle(wx, wy, 12, 16, 0xffc873, 0.85).setDepth(by + bh + 1);
        this.addLight(wx, wy + 20, 55, false);
      }
      if (b.id === 'inn') this.interactables.push({ x: dx, y: dy - 10, label: 'enter THE LAST LANTERN', fn: () => this.innDialog() });
      if (b.id === 'guild') {
        this.interactables.push({ x: dx, y: dy - 10, label: 'enter the ADVENTURERS GUILD', fn: () => this.guildBoard() });
        this.guildDoor = { dx, dy };
        // DRUID-ONLY post-finale: the heartland coach — her secret road north
        if (GS.world.flags['q-mq5-ash-and-silence'] === 'done' && P.char === 'druid') this.addVarenholmCoach();
        this.addHuntCoach(); // guild proving-ground writs: the Ashenveil hunts (all champions)
        if (P.char === 'warlock' && this.huntActive()) this.addCultCoach(); // wq4: the hunt's gated roads (Dragonspine + Varenholm)
        if (P.char === 'ronin' && GS.world.flags['rq-epi-guild'] && GS.world.flags['q-rq-epilogue'] !== 'done') this.addSpineCoach(); // rq: the spine passage persists through the temple/seraph beats until the epilogue ends
      }
      if (b.sign) {
        this.add.rectangle(dx + 36, dy - bh / 2 - 6, 46, 16, 0x15100b).setStrokeStyle(1, 0xe7b450, 0.6).setDepth(dy + 2);
        this.add.text(dx + 36, dy - bh / 2 - 6, b.sign, { fontFamily: 'Courier New', fontSize: '10px', color: '#e7b450' }).setOrigin(0.5).setDepth(dy + 2);
      }
    }

    // plaza props
    const wellX = M.well.x * T, wellY = M.well.y * T;
    this.add.image(wellX, wellY, 'cainos-props', 'well').setOrigin(0.5).setDepth(wellY + 30);
    this.solid(wellX - 44, wellY - 30, 88, 64);
    this.interactables.push({ x: wellX, y: wellY, label: 'look into the well', fn: () => this.signDialog('THE WELL', 'Coins glint far below. Most are offerings. Some are bribes. The well keeps every secret it is paid.') });
    for (const [px, py, frame] of [[18, 24, 'barrel'], [19, 25, 'crate'], [52, 24, 'barrel'], [27, 19, 'crate'], [43, 27, 'barrel'], [60, 32, 'crate'], [13, 33, 'barrel']]) {
      this.add.image(px * T, py * T, 'cainos-props', frame).setOrigin(0.5, 1).setDepth(py * T);
      this.solid(px * T - 14, py * T - 22, 28, 22);
    }
    this.add.image(35 * T, 17 * T, 'cainos-props', 'statue').setOrigin(0.5, 1).setDepth(17 * T);
    this.solid(35 * T - 24, 17 * T - 30, 48, 30);

    for (const s of M.signs) {
      this.add.image(s.x * T, s.y * T, 'cainos-props', 'signEast').setOrigin(0.5, 1).setDepth(s.y * T);
      const text = s.y === 3 ? 'NORTH GATE — THORN GROVE. The escort is back; the road is open. Mind the wolves.' : s.text;
      this.interactables.push({ x: s.x * T, y: s.y * T, label: 'read the sign', fn: () => this.signDialog('SIGNPOST', text) });
    }

    // chests
    for (const c of M.chests) {
      const id = 'chest-' + c.x + '-' + c.y;
      const img = this.add.image(c.x * T, c.y * T, 'cainos-props', 'chest').setOrigin(0.5, 1).setDepth(c.y * T).setScale(0.8);
      if (GS.world.chestsOpened.includes(id)) img.setTint(0x555555);
      this.interactables.push({ x: c.x * T, y: c.y * T, label: 'open the chest', fn: () => {
        if (GS.world.chestsOpened.includes(id)) { this.floatText(c.x * T, c.y * T - 40, 'empty', '#6b5d4f'); return; }
        GS.world.chestsOpened.push(id); img.setTint(0x555555);
        if (c.loot.type === 'copper') { P.copper += c.loot.amount; CityUI.setPurse(P.copper);
          this.floatText(c.x * T, c.y * T - 40, '+' + Money.fmt(c.loot.amount), '#e7b450'); }
        else if (P.belt.length < 8) { P.belt.push(c.loot); CityUI.belt(P.belt);
          this.floatText(c.x * T, c.y * T - 40, c.loot.label, '#7fbf6a'); }
        else this.floatText(c.x * T, c.y * T - 40, 'belt is full', '#c8443a');
      }});
    }

    // characters
    this.bakeFrames({ 'fr-ankunyx': { col: '#1a1622', o: { samurai: true, armor: 2, wpnLen: 62, thickWpn: true, wpnCol: '#f0e2b0', headCol: '#0d0a12' } } });
    const spawn = GS.world.cityFromGrove ? { x: 35 * T, y: 3 * T } : M.spawn;
    GS.world.cityFromGrove = false;
    this.spawnPlayer(spawn.x, spawn.y);
    const palettes = ['fr-npc0', 'fr-npc1', 'fr-npc2', 'fr-npc3'];
    for (const z of M.npcZones) for (let i = 0; i < z.n; i++)
      this.addNPC(palettes[Math.floor(Math.random() * palettes.length)],
        (z.x + Math.random() * z.w) * T, (z.y + Math.random() * z.h) * T, z);

    // --- BEAT 4: the buyer, back alley by the west wall (after the camp falls) ---
    const flags = GS.world.flags, C = Quests.cult;
    if (flags['q-mq3-roots-that-rot'] === 'active' && !flags['q-mq4-the-buyer']) {
      const bx = 12 * T, by = 36 * T;
      const spr = this.add.sprite(bx, by, 'fr-npc2', 0).setDepth(by);
      this.addLight(bx, by, 60, false);
      this.interactables.push({ x: bx, y: by, label: 'approach the veiled woman', fn: () => {
        const finish = kept => {
          flags['q-mq3-roots-that-rot'] = 'done';
          flags['q-mq4-the-buyer'] = 'active';
          flags['vial-kept'] = kept;
          CityUI.dialog('THE VEILED WOMAN', kept ? C.buyer.choiceKeep : C.buyer.choiceGive,
            [{ label: 'Walk away', fn: () => { CityUI.closeDialog();
              this.tweens.add({ targets: spr, alpha: 0, duration: 900, onComplete: () => spr.destroy() });
              this.interactables = this.interactables.filter(it => it.x !== bx || it.y !== by);
              this.floatText(this.player.x, this.player.y - 50, 'JOURNAL UPDATED — THE BUYER', '#3df0c8', 14);
            }}]);
        };
        const t1 = C.buyer.text1 + (window.GameState.player.char === 'druid' ? Quests.druid.vialHum : '');
        CityUI.dialog('THE VEILED WOMAN', t1, [
          { label: '"Who sells it?"', fn: () => CityUI.dialog('THE VEILED WOMAN', C.buyer.text2, [
            ...Quests.opt('buyerKeep').map(label => ({ label, fn: () => finish(true) })),
            ...Quests.opt('buyerGive').map(label => ({ label, fn: () => finish(false) }))]) },
          { label: 'Leave', fn: () => CityUI.closeDialog() }]);
      }});
    }

    // warlock epilogue state survives scene loads (save/continue, returning from Ashenveil)
    if (P.char === 'warlock') {
      if (flags['q-wq2-a-friend-of-the-family'] === 'active') this.spawnPaleCourier();
      if (flags['q-wq3-the-matron'] && !flags['credits-rolled']) this.addBlackCarriage();
    }

    this.placeCompanions('city');
    this.addEndKeeper(); // organic companion side-quests hub (Hiro)
    if (P.char === 'ronin') this.addDojo(); // rq item 11: the sensei teaches a weapon line (katana/spear/rifle)
    this.initEncounterHost(null); // city uses default pit theme (no city fights yet, but host is uniform)
    this.cameras.main.setBounds(0, 0, WPX, HPX).startFollow(this.player, true, 0.12, 0.12);
    this.floatText(spawn.x, spawn.y - 60, 'KARRIDGE CITY', '#e7b450', 18);
    this.introPan();
    this.chatterT = 4;
  }

  makeBuildingTexture(key, w, h) {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x241d20); g.fillRect(0, 0, w, h);
    g.fillStyle(0x191215);
    for (let i = 0; i < (w * h) / 320; i++)
      g.fillRect(Math.random() * (w - 18), h * 0.42 + Math.random() * (h * 0.55 - 8), 12 + Math.random() * 14, 5 + Math.random() * 4);
    g.fillStyle(0x161013); g.fillRect(0, 0, w, h * 0.42);
    g.fillStyle(0x1f171c);
    for (let rx = 6; rx < w; rx += 14) g.fillRect(rx, 2, 7, h * 0.42 - 4);
    g.fillStyle(0x0d0a08); g.fillRect(0, h * 0.42 - 3, w, 3);
    g.lineStyle(2, 0x0d0a08, 1); g.strokeRect(0, 0, w, h);
    g.generateTexture(key, w, h); g.destroy();
  }

  innDialog() {
    if (window.GameState.player.char === 'seraph') { this.innDialogSeraph(); return; }
    const GS = window.GameState, P = GS.player, I = Quests.innkeeper, flags = GS.world.flags;
    // RONIN EPILOGUE beat 1: after his original ending, Marlow passes along the guild's
    // strange request. Conversation-safe (player opens this by talking to Marlow). Once the
    // epilogue is active the branch is skipped and the normal inn dialog resumes.
    if (P.char === 'ronin' && flags['q-mq5-ash-and-silence'] === 'done' && !flags['q-rq-epilogue']) {
      const MT = Quests.roninEnding.marlow;
      const startEpi = () => {
        flags['q-rq-epilogue'] = 'active';
        CityUI.closeDialog();
        this.floatText(this.player.x, this.player.y - 50, 'JOURNAL UPDATED — THE GUILD ASKED FOR YOU', '#e7b450', 14);
      };
      CityUI.dialog(MT.name, MT.tip, MT.go.map(label => ({ label, fn: startEpi })), this.portraitInn);
      return;
    }
    const N = t => t.replace('{N}', P.nickname);
    const close = () => CityUI.closeDialog();
    const paidOffer = () => {
      const payFn = () => {
        if (P.copper < 50) { CityUI.dialog(I.name, I.broke, [{ label: 'Leave', fn: close }], this.portraitInn); return; }
        P.copper -= 50; CityUI.setPurse(P.copper);
        flags['q-mq2-listening-room'] = 'active';
        const rumor = I.rumorPaid + (P.char === 'druid' ? Quests.druid.marlowBeat : '');
        CityUI.dialog(I.name, rumor, [{ label: '"The guild, then."', fn: close }], this.portraitInn);
      };
      CityUI.dialog(I.name, I.rumorPaidOffer, [
        ...Quests.opt('marlowPay').map(label => ({ label, fn: payFn })),
        { label: 'Not yet', fn: close }], this.portraitInn);
    };
    const opts = [];
    if (flags['q-mq1-empty-cell'] === 'active')
      opts.push({ label: Quests.opt('marlowAsk')[0], fn: () => {
        flags['q-mq1-empty-cell'] = 'done';
        CityUI.dialog(I.name, N(I.rumorFree), [{ label: '"Where did the rest of him go, then?"', fn: paidOffer }, { label: 'Leave', fn: close }], this.portraitInn);
      }});
    if (flags['q-mq1-empty-cell'] === 'done' && !flags['q-mq2-listening-room']) opts.push({ label: 'Ask what the road knows', fn: paidOffer });
    if (flags['q-mq2-listening-room']) opts.push({ label: 'Anything else?', fn: () => CityUI.dialog(I.name, I.done, [{ label: 'Leave', fn: close }], this.portraitInn) });
    opts.push({ label: 'Leave', fn: close });
    CityUI.dialog(I.name, N(I.greet), opts, this.portraitInn);
  }

  innDialogSeraph() {
    const flags = window.GameState.world.flags, M = Quests.seraph.marlow, close = () => CityUI.closeDialog();
    const opts = [];
    if (flags['q-sq1-the-host-below'] === 'active' || !flags['q-sq2-where-strength-lives'])
      opts.push({ label: M.ask, fn: () => {
        flags['q-sq1-the-host-below'] = 'done';
        flags['q-sq2-where-strength-lives'] = 'active';
        CityUI.dialog(M.name || 'MARLOW', M.answer, [{ label: '"Gently, then. You have my word, innkeeper."', fn: () => {
          close();
          this.floatText(this.player.x, this.player.y - 50, 'JOURNAL UPDATED — WHERE STRENGTH LIVES', '#3df0c8', 14);
        }}], this.portraitInn);
      }});
    else opts.push({ label: 'Anything else?', fn: () => CityUI.dialog('MARLOW', M.done, [{ label: 'Leave', fn: close }], this.portraitInn) });
    opts.push({ label: 'Leave him his knees', fn: close });
    CityUI.dialog('MARLOW', M.greet, opts, this.portraitInn);
  }

  guildBoard() {
    const GS = window.GameState, P = GS.player, flags = GS.world.flags, counts = GS.world.questCounts;
    // RONIN EPILOGUE beat 2: the guild clerk gives the Seraphim investigation + the spine passage.
    if (P.char === 'ronin' && flags['q-rq-epilogue'] === 'active' && !flags['rq-epi-guild']) { this.roninGuildClerk(); return; }
    // RONIN EPILOGUE beat 8: the angel has spoken — report it; the new ronin ending rolls.
    if (P.char === 'ronin' && flags['rq-epi-seraph'] === 'done' && flags['q-rq-epilogue'] !== 'done') { this.roninGuildReport(); return; }
    P.guildHunts = P.guildHunts || 0;
    const rank0 = Quests.rankFor(P.guildHunts);
    // turn-ins — contracts are NEVERENDING: pay out, reset the tally, respawn the prey
    let turnedIn = '';
    for (const q of Quests.guildBoard) {
      while ((counts[q.id] || 0) >= q.need) {
        counts[q.id] -= q.need;
        P.guildHunts++;
        const pay = Math.round(q.copper * Quests.rankFor(P.guildHunts).mult);
        P.copper += pay;
        if (P.belt.length < 8) P.belt.push({ type: q.potion, label: q.potionLabel });
        turnedIn += `<div class="qobj">✓ ${q.title} paid out: ${Money.fmt(pay)} + ${q.potionLabel}</div>`;
        const kind = q.id.slice(2);
        for (const k of Object.keys(flags)) if (k.startsWith('pack-' + kind)) delete flags[k]; // the wilds restock
      }
    }
    if (turnedIn) { CityUI.setPurse(P.copper); CityUI.belt(P.belt); }
    const rank = Quests.rankFor(P.guildHunts);
    if (rank.name !== rank0.name) turnedIn += `<div class="qtitle" style="color:#3df0c8">▲ GUILD RANK: ${rank.name} — ${rank.note}</div>`;
    const nextR = Quests.guildRanks.find(g => g.at > P.guildHunts);
    const rankLine = `<div class="qobj" style="margin-bottom:8px">GUILD RANK: <span style="color:#e7b450">${rank.name}</span> · ${P.guildHunts} hunts · payouts ×${rank.mult}` +
      (nextR ? ` · ${nextR.at - P.guildHunts} more to ${nextR.name}` : ' · the Vanguard Hall pours when you enter') + '</div>';
    const note = rankLine + (P.char === 'seraph' ? Quests.seraph.guildNote : flags['q-mq2-listening-room'] === 'active'
      ? 'The road ledger confirms it: three travelers logged in, never logged out — all near Thorn Grove. The clerk leans close: "The wood-elves found a camp that shouldn\'t be there. Ley-side. You didn\'t hear it from the guild." (Thorn Grove — the grove keeper knows more)'
      : 'The board creaks with contracts. The clerk eyes your blood-crusted boots with professional approval.') + turnedIn;
    const live = Quests.guildBoard.map(q => Object.assign({}, q, {
      locked: false,
      text: q.text + ' — ' + (counts[q.id] || 0) + '/' + q.need + ' (repeatable — the wilds restock)',
    }));
    CityUI.guildBoard(true, live, note);
  }

  // ===== THE RONIN'S EPILOGUE (rq) beat 2: the GUILD CLERK -> the Seraphim investigation + spine passage =====
  roninGuildClerk() {
    const G = Quests.roninEnding.guild, flags = window.GameState.world.flags;
    const takePassage = () => {
      flags['rq-epi-guild'] = 'done';
      CityUI.closeDialog();
      this.addSpineCoach();
      this.floatText(this.player.x, this.player.y - 50, 'JOURNAL UPDATED \u2014 THE SPINE PASSAGE', '#e7b450', 14);
    };
    CityUI.dialog(G.name, G.brief, [{ label: '"Go on."', fn: () =>
      CityUI.dialog(G.name, G.charge, G.go.map(label => ({ label, fn: takePassage }))) }]);
  }

  // ===== THE RONIN'S EPILOGUE (rq) beat 8: the GUILD TURN-IN -> the new ronin ending -> credits =====
  roninGuildReport() {
    const R = Quests.roninEnding.report, flags = window.GameState.world.flags;
    const close = () => {
      flags['rq-epi-report'] = 'done';
      flags['q-rq-epilogue'] = 'done';
      CityUI.closeDialog();
      if (typeof SaveSystem !== 'undefined' && SaveSystem.save) SaveSystem.save();
      setTimeout(() => CityUI.credits(R.credits), 600);
    };
    CityUI.dialog(R.name, R.line, R.go.map(label => ({ label, fn: close })));
  }

  addSpineCoach() { // rq: the guild's treaty-sealed spine-coach to the gated Dragonspine (mirror addCultCoach)
    if (this._spineCoachAdded || !this.guildDoor) return;
    this._spineCoachAdded = true;
    const { dx, dy } = this.guildDoor, cy = dy + 40;
    const cg = this.add.graphics().setDepth(cy);
    cg.fillStyle(0x14110a); cg.fillRect(dx - 58, cy - 22, 56, 30);            // the spine-coach, treaty-amber
    cg.lineStyle(1, 0xe7b450, 0.6); cg.strokeRect(dx - 58, cy - 22, 56, 30);  // guild-amber trim
    cg.fillStyle(0x0a0810); cg.fillCircle(dx - 46, cy + 10, 8); cg.fillCircle(dx - 14, cy + 10, 8);
    this.addLight(dx - 30, cy, 60, false);
    this.interactables.push({ x: dx - 30, y: cy, label: 'board the SPINE-COACH \u2014 the treaty road up the Dragonspine', fn: () => this.spineCoachDialog() });
  }

  spineCoachDialog() {
    const close = () => CityUI.closeDialog();
    CityUI.dialog('THE SPINE-COACH',
      'A treaty-sealed coach waits, the guild\u2019s amber stamp burned into the door, a driver who will not meet your eye. "Up the Dragonspine, then. The wards read the seal and let you pass. Climb down where the air goes thin and the legends start."',
      [{ label: 'To the DRAGONSPINE \u2014 find the angel', fn: () => { close(); this.scene.start('MountainScene'); } },
       { label: 'Not yet \u2014 the angel can wait', fn: close }]);
  }

  // ===== ITEM 11: THE DOJO \u2014 Sensei Okada teaches the ronin a weapon line =====
  // Increment 2: the unlock interactable only. Choosing a line sets GameState.player.weaponLine
  // (+ flags['rq-dojo']='met') and, for now, only changes the on-level-up tier BANNER names
  // (WPN_LINE_NAMES in pit.js). No spear/rifle moveset or stat change yet (later increments).
  addDojo() {
    if (this._dojoAdded || window.GameState.player.char !== 'ronin') return;
    this._dojoAdded = true;
    const T = CityMap.TILE, dx = 20 * T, dy = 25 * T; // inn-street side, clear of the guild coaches
    const g = this.add.graphics().setDepth(dy - 1); // a simple training post beside the sensei
    g.fillStyle(0x3a2a1a); g.fillRect(dx + 26, dy - 44, 6, 44);
    g.fillStyle(0x6b4a2a); g.fillRect(dx + 20, dy - 46, 18, 6);
    this.add.sprite(dx, dy, 'fr-npc1', 0).setDepth(dy);
    this.addLight(dx, dy, 60, false);
    this.interactables.push({ x: dx, y: dy, label: 'train with SENSEI OKADA', fn: () => this.dojoDialog() });
  }

  dojoDialog() {
    if (CityUI.dialogOpen() || this.encounterActive) return; // item 1.5: never open over a live scene
    const D = Quests.dojo, P = window.GameState.player, flags = window.GameState.world.flags;
    const close = () => CityUI.closeDialog();
    const current = P.weaponLine || 'katana';
    const choose = key => {
      const L = D.lines[key];
      P.weaponLine = key;
      flags[D.flag] = 'met';
      const tierNames = L.tiers.map(t => t.name).join(' \u2192 ');
      const focus = L.focus.charAt(0).toUpperCase() + L.focus.slice(1);
      CityUI.dialog(D.teacher,
        'A short bow. \"' + L.tiers[0].name + ', then. ' + focus + '. Your road climbs ' + tierNames +
        ' \u2014 earn each tier in the Pit, as you always have.\"',
        [{ label: 'Bow and take up the line', fn: () => { close();
          this.floatText(this.player.x, this.player.y - 52, 'WEAPON LINE \u2014 ' + L.tiers[0].name, '#e7b450', 15); } }]);
    };
    const opts = Object.keys(D.lines).map(key => ({
      label: (key === current ? '\u25cf ' : '') + D.lines[key].tiers[0].name + ' \u2014 ' + D.lines[key].stat,
      fn: () => choose(key) }));
    opts.push({ label: 'Not today, sensei', fn: close });
    CityUI.dialog(D.teacher, D.intro, opts);
  }

  // ===== THE WARLOCK'S EPILOGUE: the White Writ -> the letter -> the alley -> the carriage =====
  startWhiteWrit() {
    if (this._writRunning || CityUI.dialogOpen() || this.encounterActive) return;
    this._writRunning = true;
    const W = Quests.warlockEpilogue, flags = window.GameState.world.flags;
    const fight = () => { CityUI.closeDialog();
      this.startEncounter(W.ambush.banner[0], W.ambush.banner[1], [
        { type: 'door', x: 560, y: 240, r: 24, hp: 480, maxhp: 480, spd: 95, col: '#d8d2c0', wpn: '#b8b2a0', dmgScale: 1.45 },
        { type: 'grave', x: 720, y: 240, hp: 400, maxhp: 400, spd: 120, r: 16, col: '#c8c2b0', stance: 'open', stanceT: 1, dmgScale: 1.45 },
        { type: 'necro', x: 640, y: 180, hp: 340, maxhp: 340, spd: 105, r: 14, col: '#5a4a5a', dmgScale: 1.4 },
        { type: 'gunner', x: 520, y: 420, hp: 300, maxhp: 300, spd: 150, r: 13, col: '#3a3a44', dmgScale: 1.5 },
        { type: 'hook', x: 760, y: 420, hp: 360, maxhp: 360, spd: 165, r: 14, col: '#3a3a44', dmgScale: 1.5 },
      ], win => {
        this._writRunning = false;
        if (!win) { this.player.x = 640; this.player.y = 704;
          this.floatText(this.player.x, this.player.y - 50, W.ambush.lose, '#c8443a'); return; }
        flags['q-wq1-the-white-writ'] = 'done';
        flags['q-wq2-a-friend-of-the-family'] = 'active';
        CityUI.dialog('THE PLAZA, AFTER', W.ambush.winNarr, [{ label: 'Read the letter', fn: () =>
          CityUI.dialog('A LETTER WITH NO SEAL', W.ambush.letter, [{ label: '"A friend of the family. How... familial."', fn: () => {
            CityUI.closeDialog();
            this.spawnPaleCourier();
            this.floatText(this.player.x, this.player.y - 50, 'JOURNAL UPDATED — A FRIEND OF THE FAMILY', '#3df0c8', 14);
          }}]) }]);
      });
    };
    CityUI.dialog('SER HALDRIC', W.ambush.haldric, [{ label: '"You\'ve brought a WRIT to a portal fight, Ser."', fn: () =>
      CityUI.dialog('INQUISITOR SALLOW', W.ambush.sallow, [
        { label: '"Add one more line to the ledger, inquisitor. Yours."', fn: fight },
        { label: '"Three professions walk into a plaza. One of them digs."', fn: fight }]) }]);
  }

  spawnPaleCourier() {
    if (this._courierAdded) return;
    this._courierAdded = true;
    const W = Quests.warlockEpilogue, flags = window.GameState.world.flags;
    const cx = 12 * 32, cy = 36 * 32; // the alley behind the west wall, where the lamplight gives up
    const spr = this.add.sprite(cx, cy, 'fr-npc1', 0).setDepth(cy).setTint(0xb8b0c8);
    this.addLight(cx, cy, 50, false);
    this.interactables.push({ x: cx, y: cy, label: 'meet the PALE COURIER', fn: () => {
      const accept = () => {
        flags['q-wq2-a-friend-of-the-family'] = 'done';
        flags['q-wq3-the-matron'] = 'active';
        CityUI.closeDialog();
        this.addBlackCarriage();
        this.tweens.add({ targets: spr, alpha: 0, duration: 900, onComplete: () => spr.destroy() });
        this.interactables = this.interactables.filter(it => it.x !== cx || it.y !== cy);
        this.floatText(this.player.x, this.player.y - 50, 'JOURNAL UPDATED — THE MATRON · a black carriage waits by the guild', '#3df0c8', 13);
      };
      CityUI.dialog(W.courier.name, W.courier.meet, [
        { label: '"The carriage, then. Dead horses keep secrets."', fn: accept },
        { label: '"And if I decline the invitation?"', fn: () =>
          CityUI.dialog(W.courier.name, W.courier.decline, [{ label: '"...The carriage, then."', fn: accept }]) }]);
    }});
    this.floatText(cx, cy - 44, 'someone waits where the lamplight gives up', '#9a8f80', 12);
  }

  addBlackCarriage() {
    if (this._carriageAdded || !this.guildDoor) return;
    this._carriageAdded = true;
    const { dx, dy } = this.guildDoor, cy = dy + 40;
    const cg = this.add.graphics().setDepth(cy);
    cg.fillStyle(0x0c0a12); cg.fillRect(dx + 60, cy - 24, 58, 32);          // the black carriage
    cg.lineStyle(1, 0x9af0c0, 0.5); cg.strokeRect(dx + 60, cy - 24, 58, 32); // grave-light trim
    cg.fillStyle(0x05040a); cg.fillCircle(dx + 72, cy + 10, 8); cg.fillCircle(dx + 106, cy + 10, 8);
    this.addLight(dx + 88, cy, 60, false);
    this.interactables.push({ x: dx + 88, y: cy, label: 'board the BLACK CARRIAGE to the ASHENVEIL', fn: () => {
      this.scene.start('AshenveilScene');
    }});
  }

  addHuntCoach() { // guild proving-ground writs: ANY champion can ride to the Ashenveil fields to hunt
    if (this._huntCoachAdded || !this.guildDoor) return;
    this._huntCoachAdded = true;
    const { dx, dy } = this.guildDoor, cy = dy + 40;
    const cg = this.add.graphics().setDepth(cy);
    cg.fillStyle(0x14121c); cg.fillRect(dx - 150, cy - 22, 56, 30);          // the grim coach
    cg.lineStyle(1, 0x8a8474, 0.6); cg.strokeRect(dx - 150, cy - 22, 56, 30); // bone trim
    cg.fillStyle(0x0a0810); cg.fillCircle(dx - 138, cy + 10, 8); cg.fillCircle(dx - 106, cy + 10, 8);
    this.addLight(dx - 122, cy, 60, false);
    this.interactables.push({ x: dx - 122, y: cy, label: 'board the grim coach — ASHENVEIL PROVING GROUNDS', fn: () => {
      this.scene.start('AshenveilScene');
    }});
  }

  addVarenholmCoach() {
    if (this._coachAdded || !this.guildDoor) return;
    this._coachAdded = true;
    const { dx, dy } = this.guildDoor, cy = dy + 40;
    const cg = this.add.graphics().setDepth(cy);
    cg.fillStyle(0x241a12); cg.fillRect(dx + 60, cy - 22, 56, 30);
    cg.fillStyle(0x14100a); cg.fillCircle(dx + 72, cy + 10, 8); cg.fillCircle(dx + 104, cy + 10, 8);
    this.addLight(dx + 88, cy, 70, false);
    this.interactables.push({ x: dx + 88, y: cy, label: 'board the heartland coach to VARENHOLM', fn: () => {
      if (!window.GameState.world.flags['q-mq6-the-dancer']) window.GameState.world.flags['q-mq6-the-dancer'] = 'active';
      this.scene.start('VarenholmScene');
    }});
  }

  addCultCoach() { // wq4: Nyx's cult coach — the only road a warlock has to the gated zones during the hunt
    if (this._cultCoachAdded || !this.guildDoor) return;
    this._cultCoachAdded = true;
    const { dx, dy } = this.guildDoor, cy = dy + 40;
    const cg = this.add.graphics().setDepth(cy);
    cg.fillStyle(0x1a1226); cg.fillRect(dx - 58, cy - 22, 56, 30);            // the cult coach, anku-violet
    cg.lineStyle(1, 0xb070f0, 0.6); cg.strokeRect(dx - 58, cy - 22, 56, 30);  // hunt-purple trim
    cg.fillStyle(0x0a0810); cg.fillCircle(dx - 46, cy + 10, 8); cg.fillCircle(dx - 14, cy + 10, 8);
    this.addLight(dx - 30, cy, 60, false);
    this.interactables.push({ x: dx - 30, y: cy, label: 'board the CULT COACH \u2014 the hunt roads', fn: () => this.cultCoachDialog() });
  }

  cultCoachDialog() {
    const close = () => CityUI.closeDialog();
    const go = key => { close(); this.scene.start(key); };
    const f = window.GameState.world.flags;
    const spine = { label: 'To DRAGONSPINE \u2014 the ash-wick burns there', fn: () => go('MountainScene') };
    const varen = { label: 'To VARENHOLM \u2014 the dancer hides there', fn: () => go('VarenholmScene') };
    // AUTO (FULL) clicks the first option, so lead with the next uncaged gated target:
    // Cinder (Dragonspine) is hunted before Cookie (Varenholm).
    const dests = !f['cap-cinder'] ? [spine, varen] : [varen, spine];
    CityUI.dialog('THE CULT COACH',
      'A dead-eyed driver waits, Nyx\'s seal at his collar, the boot full of empty cages. "Where does the hunt take us, hand of Ashenveil?"',
      [...dests, { label: 'Not yet \u2014 the cages can wait', fn: close }]);
  }

  runFinale() {
    const C = Quests.cult, flags = window.GameState.world.flags;
    const ax = CityMap.well.x * 32, ay = (CityMap.well.y - 4) * 32;

    // RONIN-ONLY: the Emperor never arrives. (Book 4 readers know why.)
    if (window.GameState.player.char === 'ronin') {
      const F = C.finaleRonin;
      for (const n of this.npcs) { n.pauseT = 14; n.spr.setFrame(this.frameFor(Math.atan2(0 - n.spr.y, ax - n.spr.x), 0, false)); }
      const done = () => {
        flags['q-mq5-ash-and-silence'] = 'done';
        CityUI.closeDialog();
        for (const n of this.npcs) n.pauseT = 1 + Math.random() * 2;
        this.floatText(ax, ay - 60, 'THE ANKUSPAWN CONSPIRACY — it holds. for now.', '#e7b450', 16);
        this.floatText(ax, ay - 30, 'the Emperor was never where anyone expected · the hunt continues in the campaigns', '#9a8f80', 12);
        setTimeout(() => CityUI.credits('THE RONIN\'S ROAD — he was never where anyone expected'), 2600);
      };
      CityUI.dialog(F.title, F.text1, [{ label: Quests.opt('roninWait1')[0], fn: () =>
        CityUI.dialog(F.title, F.text2, [{ label: 'Stay until the plaza empties', fn: () =>
          CityUI.dialog(F.title, F.text3, [{ label: 'Half a smile. Walk on.', fn: done }]) }]) }]);
      return;
    }


    const em = this.add.sprite(ax, ay, 'fr-ankunyx', 0).setDepth(ay).setScale(1.35);
    this.addLight(ax, ay, 160, false);
    for (const n of this.npcs) { n.pauseT = 9999; n.spr.setFrame(this.frameFor(Math.atan2(ay - n.spr.y, ax - n.spr.x), 0, false)); }
    const done = () => {
      flags['q-mq5-ash-and-silence'] = 'done';
      CityUI.closeDialog();
      this.tweens.add({ targets: em, alpha: 0, duration: 1600, onComplete: () => em.destroy() });
      for (const n of this.npcs) n.pauseT = 1 + Math.random() * 2;
      this.floatText(ax, ay - 60, 'THE ANKUSPAWN CONSPIRACY — it holds. for now.', '#e7b450', 16);
      this.floatText(ax, ay - 30, 'epilogue in your journal (J) · the hunt continues in the campaigns', '#9a8f80', 12);
      if (window.GameState.player.char === 'warlock') { // the plaza was the audition: the Order watched
        flags['q-wq1-the-white-writ'] = 'active';
        setTimeout(() => this.startWhiteWrit(), 1600);
      }
      else if (window.GameState.player.char === 'druid') {
        this.addVarenholmCoach();
        setTimeout(() => this.floatText(ax, ay, 'a coach has arrived by the guild. it seems to be waiting for someone GIFTED.', '#3df0c8', 13), 2800);
      }
    };
    const t2 = C.finale.text2 + (window.GameState.player.char === 'druid' ? ' ' + Quests.druid.finaleGaze : '');
    const step3 = () => CityUI.dialog(C.finale.title, C.finale.text3, [{ label: 'The story has barely begun', fn: done }]);
    const step2 = () => CityUI.dialog(C.finale.title, t2, Quests.opt('finale2').map(label => ({ label, fn: step3 })));
    CityUI.dialog(C.finale.title, C.finale.text1, Quests.opt('finale1').map(label => ({ label, fn: step2 })));
  }

  // ===== THE END KEEPER — hub for ORGANIC companion side-quests (Hiro) =====
  // She posts the city's UNFILED problems — each solvable by exactly one specialist, so seeking
  // that companion is necessitated by the work. Romance is the byproduct. Fully optional + failsafe:
  // nothing here gates the main quest; each contract sets only its own ek-* flag.
  addEndKeeper() {
    if (this._endKeeperAdded) return;
    this._endKeeperAdded = true;
    const T = CityMap.TILE, ex = 29 * T, ey = 24 * T; // plaza, west of the well — lit, clear of buildings
    const g = this.add.graphics().setDepth(ey - 1); // a folding desk of loose ends
    g.fillStyle(0x241a12); g.fillRect(ex + 14, ey - 14, 26, 14);
    g.lineStyle(1, 0xe7b450, 0.5); g.strokeRect(ex + 14, ey - 14, 26, 14);
    this.add.sprite(ex, ey, 'fr-npc3', 0).setDepth(ey);
    this.add.text(ex, ey - 34, 'THE END KEEPER', { fontFamily: 'Courier New', fontSize: '10px', color: '#e7b450', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(ey);
    this.addLight(ex, ey, 60, false);
    this.interactables.push({ x: ex, y: ey, label: 'consult THE END KEEPER (unfiled matters)', fn: () => this.endKeeperBoard() });
  }

  endKeeperBoard() {
    if (CityUI.dialogOpen() || this.encounterActive) return; // item 1.5: never open over a live scene
    const Q = Quests.companionQuests, flags = window.GameState.world.flags;
    flags[Q.hubFlag] = 'met';
    const close = () => CityUI.closeDialog();
    const contracts = Object.entries(Q.contracts);
    const allDone = contracts.every(([k, c]) => flags[c.id] === 'done');
    const opts = [];
    for (const [key, c] of contracts) {
      const fstate = flags[c.id];
      if (fstate === 'done') {
        opts.push({ label: '\u2713 ' + c.title + ' \u2014 closed', fn: () =>
          CityUI.dialog(Q.keeper.name, '"' + c.title + '. Closed, and closed RIGHT \u2014 by the one pair of hands that could. It is filed now. My thanks, champion."',
            [{ label: 'Back', fn: () => this.endKeeperBoard() }]) });
      } else if (fstate === 'active') {
        opts.push({ label: '\u2026 ' + c.title + ' \u2014 seek ' + c.specialist + ' in ' + c.where, fn: () =>
          CityUI.dialog(Q.keeper.name, '"Still open. ' + c.seekHint + '"',
            [{ label: 'Back', fn: () => this.endKeeperBoard() }]) });
      } else {
        opts.push({ label: 'OPEN: ' + c.title, fn: () =>
          CityUI.dialog(Q.keeper.name, c.hubProblem, [
            { label: 'Take it on \u2014 find the one who can end it', fn: () => {
              flags[c.id] = 'active';
              close();
              this.floatText(this.player.x, this.player.y - 50, 'UNFILED MATTER TAKEN \u2014 ' + c.title + ' \u00b7 seek ' + c.specialist + ' in ' + c.where, '#3df0c8', 13);
            } },
            { label: 'Not yet', fn: () => this.endKeeperBoard() }]) });
      }
    }
    opts.push({ label: 'Leave the ledger', fn: close });
    const firstTime = !flags['ek-hub-seen'];
    flags['ek-hub-seen'] = true;
    const text = allDone ? Q.keeper.done : (firstTime ? Q.keeper.intro : Q.keeper.board);
    CityUI.dialog(Q.keeper.name, text, opts);
  }

  update(time, dtMs) {
    const dt = Math.min(0.05, dtMs / 1000);
    if (this.updateEncounter(time)) return;
    this.updatePlayer(dt);
    this.updateFollower(dt);
    this.updateNPCs(dt);
    this.updatePrompt();
    this.updateAtmosphere(time, dt);

    // --- BEAT 5 finale: the Dragon Emperor in the plaza ---
    const flags = window.GameState.world.flags;
    if (flags['q-mq5-ash-and-silence'] === 'active' && !this.finaleRan &&
        Math.hypot(this.player.x - CityMap.well.x * 32, this.player.y - CityMap.well.y * 32) < 170) {
      this.finaleRan = true;
      this.runFinale();
    }
    // warlock: the White Writ waits in the plaza until it is answered (retry after a loss / reload)
    if (window.GameState.player.char === 'warlock' && flags['q-wq1-the-white-writ'] === 'active' &&
        !this._writRunning && !this.encounterActive && !CityUI.dialogOpen() &&
        Math.hypot(this.player.x - CityMap.well.x * 32, this.player.y - CityMap.well.y * 32) < 170)
      this.startWhiteWrit();

    // --- BOSS: The Tithe-Knight (Hiro) - one-time plaza ambush; avoidable, auto-full crosses it ---
    if (!flags['city-boss-tithe'] && !this.encounterActive && !CityUI.dialogOpen() &&
        Math.hypot(this.player.x - (CityMap.well.x * 32 - 160), this.player.y - CityMap.well.y * 32) < 130) {
      flags['city-boss-tithe'] = 'active';
      this.startEncounter('THE TITHE-KNIGHT', 'the cult sends its collector', [
        { type: 'grave', boss: true, deathCol: '#c8c2b0', x: 640, y: 270, r: 20, hp: 620, maxhp: 620, spd: 135, col: '#8a8f98', wpn: '#c0c0c8', stance: 'open', stanceT: 1, dmgScale: 1.3 }
      ], win => { flags['city-boss-tithe'] = win ? 'cleared' : false; });
    }

    // north gate travel
    if (this.player.y < this.gateNorth.y + this.gateNorth.h + 10 &&
        this.player.x > this.gateNorth.x - 8 && this.player.x < this.gateNorth.x + this.gateNorth.w + 8) {
      window.GameState.world.groveFromCity = true;
      this.scene.start('GroveScene');
      return;
    }

    this.chatterT -= dt;
    if (this.chatterT <= 0) {
      this.chatterT = 5 + Math.random() * 5;
      const near = this.npcs.filter(n => Math.abs(n.spr.x - this.player.x) < 400 && Math.abs(n.spr.y - this.player.y) < 280);
      if (near.length) {
        const n = near[Math.floor(Math.random() * near.length)];
        const bank = window.GameState.player.char === 'seraph' ? Quests.seraph.chatter : CityMap.chatter;
        const line = bank[Math.floor(Math.random() * bank.length)].replace('{N}', window.GameState.player.nickname);
        this.floatText(n.spr.x, n.spr.y - 46, '“' + line + '”', '#9a8f80', 11);
        if (window.GameState.player.char === 'seraph' && Math.hypot(n.spr.x - this.player.x, n.spr.y - this.player.y) < 200) {
          n.pauseT = Math.max(n.pauseT, 2.5); // the crowd stops and stares. and maybe kneels a little.
          n.spr.setFrame(this.frameFor(Math.atan2(this.player.y - n.spr.y, this.player.x - n.spr.x), 0, false));
        }
      }
    }
  }
}
