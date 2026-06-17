// AshenveilScene — the warlock's epilogue destination: Nyx's undead territory.
// Ash-grey fields where the dead work in neat rows, the dark academy the rumors
// only whisper about, and LADY NYX herself — the Matron, revealed to exactly one
// champion. She offers the only protection that outranks a kill-writ: a job.
// Canon guardrail: revealed to the warlock alone; the conspiracy continues.

class AshenveilScene extends WorldScene {
  constructor() { super({ key: 'AshenveilScene' }); }

  preload() {
    for (const [key, uri] of Object.entries(window.EMBEDDED_ASSETS))
      if (!this.textures.exists(key)) this.load.image(key, uri);
  }

  create() {
    const T = 32, MW = 48, MH = 34, WPX = MW * T, HPX = MH * T;
    this.worldW = WPX; this.worldH = HPX;
    this.worldInit();
    const GS = window.GameState, W = Quests.warlockEpilogue, flags = GS.world.flags;
    GS.world.zone = 'ashenveil';

    // ---------- ground: ash over old fields ----------
    const map = this.make.tilemap({ width: MW, height: MH, tileWidth: T, tileHeight: T });
    const tiles = map.addTilesetImage('cainos-grass', undefined, T, T, 0, 0);
    const ground = map.createBlankLayer('ground', tiles).setDepth(0);
    for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++)
      ground.putTileAt([0, 1, 2, 8, 9, 10][Math.floor(Math.random() * 6)], tx, ty);
    ground.forEachTile(t => { t.tint = 0x4a4452; }); // green, remembered wrongly

    // ---------- the veil: dead hedgerows and bone trees ----------
    const hedgeG = this.add.graphics().setDepth(3);
    const hedge = (x, y, w, h) => {
      this.solid(x, y, w, h);
      for (let i = 0; i < (w * h) / 1000; i++) {
        const cx = x + Math.random() * w, cy = y + Math.random() * h;
        hedgeG.fillStyle(0x241f2c, 1); hedgeG.fillCircle(cx, cy, 18 + Math.random() * 14);
        hedgeG.lineStyle(2, 0x8a8474, 0.8); // bone branches
        hedgeG.lineBetween(cx, cy - 8, cx + (Math.random() - 0.5) * 30, cy - 28 - Math.random() * 14);
      }
    };
    hedge(0, 0, WPX, T * 2);
    hedge(0, 0, T * 2, HPX); hedge(WPX - T * 2, 0, T * 2, HPX);
    hedge(0, HPX - T * 1.5, 21 * T, T * 1.5);    // south, gap 21-27: the carriage road
    hedge(27 * T, HPX - T * 1.5, WPX - 27 * T, T * 1.5);
    for (const [gx, gy, gw, gh] of [[8, 10, 7, 4], [34, 18, 7, 5], [14, 22, 6, 4]])
      hedge(gx * T, gy * T, gw * T, gh * T);

    // cold green atmosphere
    this.makeAtmosphere({ darkness: 0.82, darkCol: 0x06040c, fogTint: 0x9a8fb0, emberCol: '#9af0c0' });
    for (let i = 0; i < 16; i++) { // grave-lights along the field rows
      const lx = (4 + Math.random() * (MW - 8)) * T, ly = (5 + Math.random() * (MH - 10)) * T;
      if (this.collide(lx, ly, 12)) continue;
      this.add.circle(lx, ly, 2.5, 0x9af0c0, 0.8).setDepth(ly).setBlendMode(Phaser.BlendModes.ADD);
      this.addLight(lx, ly + 14, 60, false);
    }

    // ---------- THE ASHENVEIL ACADEMY (NE) ----------
    const bx = 28, by = 5, bw = 15, bh = 8;
    const key = 'bld-' + bw + 'x' + bh;
    if (!this.textures.exists(key)) CityScene.prototype.makeBuildingTexture.call(this, key, bw * T, bh * T);
    this.add.image(bx * T, by * T, key).setOrigin(0).setDepth((by + bh) * T).setTint(0x6a607a);
    this.solid(bx * T, by * T, bw * T, bh * T);
    const propsTex = this.textures.get('cainos-props');
    if (!propsTex.has('door')) propsTex.add('door', 0, 32, 98, 68, 90);
    const ddx = (bx + Math.floor(bw / 2)) * T, ddy = (by + bh) * T;
    this.add.image(ddx, ddy, 'cainos-props', 'door').setOrigin(0.5, 1).setDepth(ddy + 1).setScale(0.9).setTint(0x9af0c0);
    this.add.rectangle(ddx, by * T - 10, 178, 18, 0x0c0a12).setStrokeStyle(1, 0x9af0c0, 0.7).setDepth(ddy + 2);
    this.add.text(ddx, by * T - 10, 'THE ASHENVEIL ACADEMY', { fontFamily: 'Courier New', fontSize: '11px', color: '#9af0c0' }).setOrigin(0.5).setDepth(ddy + 2);
    this.addLight(ddx, ddy, 120, false);
    this.interactables.push({ x: ddx, y: ddy - 10, label: 'enter the ASHENVEIL ACADEMY', fn: () => this.nyxDialog() });
    // ---------- STAIRS DOWN to the lower levels (item 13 raid zone; "not a metaphor") ----------
    const slx = 33 * T, sly = 15 * T;
    const slg = this.add.graphics().setDepth(sly);
    slg.fillStyle(0x0c0a12, 1); slg.fillRect(slx - 26, sly - 14, 52, 30);
    slg.lineStyle(1, 0x9af0c0, 0.6); slg.strokeRect(slx - 26, sly - 14, 52, 30);
    for (let i = 0; i < 4; i++) { slg.lineStyle(1, 0x9af0c0, 0.4); slg.lineBetween(slx - 22 + i * 12, sly - 10, slx - 22 + i * 12, sly + 10); }
    this.add.text(slx, sly - 22, 'THE LOWER LEVELS', { fontFamily: 'Courier New', fontSize: '9px', color: '#9af0c0' }).setOrigin(0.5).setDepth(sly + 2);
    this.addLight(slx, sly, 70, false);
    this.interactables.push({ x: slx, y: sly, label: 'descend the stairs to the LOWER LEVELS', fn: () => {
      // light the optional lower-levels objective the moment a champion chooses to descend (item 13
      // gate) so the journal/AUTO can navigate the undercroft; never auto-set, so it can't divert the main quest.
      const _fl = window.GameState.world.flags; if (!_fl['q-ash-raid'] && !_fl['ash-lower-boss']) _fl['q-ash-raid'] = 'active';
      window.GameState.world.zone = 'ash-lower';
      this.scene.start('AshLowerScene');
    }});

    // ---------- the working dead ----------
    this.bakeFrames({ 'fr-deadworker': { col: '#8a8474', o: { skull: true } },
      'fr-ashskel': { col: '#c8c2b0', o: { skull: true, wpnLen: 22, wpnCol: '#8a8474' } },
      'fr-zombie': { col: '#5a6a4a', o: { skull: true } },
      'fr-vamp': { col: '#6a2a3a', o: { robe: true, hood: true, headCol: '#d8c8c0' } },
      'fr-wolfman': { col: '#3a3430', o: { quad: true }, r: 14 },
      'fr-darkmage': { col: '#4a3a5a', o: { robe: true, hood: true, wpnLen: 28, wpnCol: '#2a2234', staffTip: true, tipCol: '#b070f0', twoHand: false } },
      // 5 new undead monsters (Hiro)
      'fr-wraith': { col: '#2a2c3a', o: { robe: true, hood: true, headCol: '#9aa0b0' } },
      'fr-ghoul': { col: '#6a6a4a', o: { quad: true }, r: 12 },
      'fr-bonegolem': { col: '#cfc6b4', o: { hulk: true, skull: true, headCol: '#d8cdb8' }, r: 18 },
      'fr-banshee': { col: '#5a6a7a', o: { robe: true, hood: true, headCol: '#c8d0d8', wpnLen: 0 } },
      'fr-gravewight': { col: '#4a4452', o: { wpnLen: 30, wpnCol: '#8a8aa0', skull: true } },
    });
    for (let i = 0; i < 9; i++)
      this.addNPC('fr-deadworker', (5 + Math.random() * (MW - 14)) * T, (10 + Math.random() * 18) * T,
        { x: 4, y: 9, w: MW - 12, h: 20 });
    this.interactables.push({ x: 10 * T, y: 14 * T, label: 'watch the working dead', fn: () =>
      this.signDialog('THE WORKING DEAD', 'They mend fences. They clear ash. They stack stones in rows neat as ledgers, for a kingdom that officially does not employ them. None of them look up. One of them, you notice with a cold professional respect, has been dead long enough to be furniture — and still sets a straighter fencepost than any living farmhand you ever saw.') });
    this.interactables.push({ x: 38 * T, y: 24 * T, label: 'read the boundary stone', fn: () =>
      this.signDialog('THE BOUNDARY STONE', 'ASHENVEIL PROVING GROUNDS — VISITORS REGISTER AT THE ACADEMY. The letters are carved deep and recent. Below them, older, almost worn away: a name the rumors only whisper, and below THAT, scratched by some long-dead student: "the lower levels are NOT a metaphor."') });

    // ---------- WARLOCK HUNT (wq4): Whisper, the Ninth Ward ----------
    // Only the warlock, with Nyx's hunt active and Whisper not yet caged, sees the
    // blindfolded listener standing in a fallow row. tryHuntCapture('whisper') runs
    // the approach -> capture-fight (collector boss). Placed in the open lower-middle
    // field, clear of the Academy (x28-43/y5-13), the hedge blocks ([8,10],[34,18],
    // [14,22]), and the other interactables (working dead 10,14 / boundary 38,24 /
    // carriage 24,30).
    if (this.huntActive() && !flags['cap-whisper']) {
      const wsX = 16 * T, wsY = 28 * T;
      const wsG = this.add.graphics().setDepth(wsY);
      wsG.lineStyle(2, 0x2a2430, 0.8); wsG.lineBetween(wsX - 34, wsY + 10, wsX + 34, wsY + 6); // the fallow row
      wsG.fillStyle(0x6a6470, 1); wsG.fillRect(wsX - 6, wsY - 8, 12, 22);   // grey shift
      wsG.fillStyle(0xc8c2b8, 1); wsG.fillCircle(wsX, wsY - 14, 7);         // pale head, cocked to listen
      wsG.fillStyle(0x9af0c0, 0.95); wsG.fillRect(wsX - 7, wsY - 15, 14, 3); // bound eyes (academy green)
      for (let i = 0; i < 4; i++) { wsG.lineStyle(1, 0x9af0c0, 0.35 - i * 0.07); wsG.strokeCircle(wsX, wsY - 14, 16 + i * 9); } // what she hears
      this.addLight(wsX, wsY, 70, false);
      this.interactables.push({ x: wsX, y: wsY, label: 'a blindfolded woman listens to an empty field', fn: () => this.tryHuntCapture('whisper') });
    }

    // ---------- player + the carriage home ----------
    this.spawnPlayer(24 * T, (MH - 4) * T);
    this.territoryHpMult = 4; // undead tier (Hiro HP ladder)
    const cg = this.add.graphics().setDepth((MH - 3) * T);
    cg.fillStyle(0x0c0a12); cg.fillRect(24 * T - 60, (MH - 3) * T - 16, 58, 32);
    cg.lineStyle(1, 0x9af0c0, 0.5); cg.strokeRect(24 * T - 60, (MH - 3) * T - 16, 58, 32);
    this.interactables.push({ x: 24 * T - 30, y: (MH - 3) * T, label: 'take the black carriage back to Karridge', fn: () => {
      window.GameState.world.cityFromGrove = false; this.scene.start('CityScene');
    }});

    // ---------- the feral edge: what slips the Academy's leash (guild contracts) ----------
    // These restock every visit — the Veil never runs out of strays.
    this.packs = [];
    const mkPack = (px, py, def) => {
      const sprs = [];
      for (let i = 0; i < def.n; i++) {
        const s = this.add.sprite(px + (Math.random() - 0.5) * 70, py + (Math.random() - 0.5) * 70, def.tex, 0);
        s.setDepth(s.y); sprs.push(s);
      }
      this.packs.push({ x: px, y: py, def, sprs, alive: true, wanderT: 0 });
    };
    const A_DEFS = {
      skeletons: { tex: 'fr-ashskel', n: 4, name: 'RESTLESS SKELETONS', sub: 'they wandered off the rows', quest: 'g-skeletons',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'skel', x: 640 + Math.cos(i * 1.8) * 210, y: 300 + Math.sin(i * 1.8) * 120,
          hp: 200, maxhp: 200, spd: 140, r: 11, col: '#c8c2b0', dmgScale: 1.3 })) },
      zombies: { tex: 'fr-zombie', n: 3, name: 'FERAL ZOMBIES', sub: 'workers that stopped taking instruction', quest: 'g-zombies',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'skel', x: 640 + Math.cos(i * 2.3) * 190, y: 310 + Math.sin(i * 2.3) * 110,
          hp: 340, maxhp: 340, spd: 68, r: 13, col: '#5a6a4a', dmgScale: 1.4 })) },
      vampires: { tex: 'fr-vamp', n: 2, name: 'VAMPIRE SPAWN', sub: 'unsanctioned feeding', quest: 'g-vampires',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'grave', x: 640 + Math.cos(i * 3.1) * 180, y: 300 + Math.sin(i * 3.1) * 110,
          hp: 380, maxhp: 380, spd: 160, r: 14, col: '#6a2a3a', stance: 'open', stanceT: 1, dmgScale: 1.45 })) },
      werewolves: { tex: 'fr-wolfman', n: 2, name: 'WEREWOLVES', sub: 'three nights, three fences', quest: 'g-werewolves',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'hound', x: 640 + Math.cos(i * 2.7) * 220, y: 320 + Math.sin(i * 2.7) * 125,
          hp: 360, maxhp: 360, spd: 215, r: 14, col: '#3a3430', dmgScale: 1.45 })) },
      darkmages: { tex: 'fr-darkmage', n: 2, name: 'RENEGADE DARK MAGES', sub: 'expelled. thoroughly.', quest: 'g-darkmages',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'necro', x: 640 + Math.cos(i * 2.9) * 190, y: 290 + Math.sin(i * 2.9) * 110,
          hp: 300, maxhp: 300, spd: 105, r: 14, col: '#4a3a5a', dmgScale: 1.4 })) },
      // --- 5 new undead monsters (Hiro) ---
      wraiths: { tex: 'fr-wraith', n: 3, name: 'WRAITHS', sub: 'the cold that walks',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'hook', x: 640 + Math.cos(i * 2.0) * 200, y: 300 + Math.sin(i * 2.0) * 115,
          hp: 240, maxhp: 240, spd: 175, r: 12, col: '#2a2c3a', dmgScale: 1.4 })) },
      ghouls: { tex: 'fr-ghoul', n: 3, name: 'GHOULS', sub: 'they got loose from the rows',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'hound', x: 640 + Math.cos(i * 2.4) * 190, y: 320 + Math.sin(i * 2.4) * 110,
          hp: 230, maxhp: 230, spd: 210, r: 12, col: '#6a6a4a', dmgScale: 1.35 })) },
      bonegolem: { tex: 'fr-bonegolem', n: 1, name: 'A BONE GOLEM', sub: 'an Academy experiment, off its leash',
        spawn: () => [{ type: 'door', x: 640, y: 270, r: 30, hp: 640, maxhp: 640, spd: 50, col: '#cfc6b4', wpn: '#9a9080', dmgScale: 1.5 }] },
      banshees: { tex: 'fr-banshee', n: 2, name: 'BANSHEES', sub: 'the wail comes before the teeth',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'gunner', x: 640 + Math.cos(i * 3) * 210, y: 290 + Math.sin(i * 3) * 120,
          hp: 260, maxhp: 260, spd: 140, r: 12, col: '#5a6a7a', dmgScale: 1.45 })) },
      gravewights: { tex: 'fr-gravewight', n: 2, name: 'GRAVE WIGHTS', sub: 'they remember how to fence',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'grave', x: 640 + Math.cos(i * 3.1) * 180, y: 300 + Math.sin(i * 3.1) * 110,
          hp: 320, maxhp: 320, spd: 130, r: 14, col: '#4a4452', stance: 'open', stanceT: 1, dmgScale: 1.4 })) },
      // --- BOSS: Provost Mortain (Hiro) - immune until his 3 totems are broken ---
      boss_mortain: { tex: 'fr-darkmage', n: 1, name: 'PROVOST MORTAIN', sub: 'break his wards before you can touch him',
        spawn: () => [
          { type: 'warden', boss: true, deathCol: '#9af0c0', x: 640, y: 268, r: 22, hp: 700, maxhp: 700, spd: 95, col: '#5a6a4a', wpn: '#9af0c0', dmgScale: 1.4 },
          { type: 'totem', x: 470, y: 360, r: 16, hp: 120, maxhp: 120, spd: 0, col: '#cfc6b4', wpn: '#9a9080', dmgScale: 1 },
          { type: 'totem', x: 810, y: 360, r: 16, hp: 120, maxhp: 120, spd: 0, col: '#cfc6b4', wpn: '#9a9080', dmgScale: 1 },
          { type: 'totem', x: 640, y: 200, r: 16, hp: 120, maxhp: 120, spd: 0, col: '#cfc6b4', wpn: '#9a9080', dmgScale: 1 },
        ] },
    };
    for (const [kind, spots] of Object.entries({ skeletons: [[10, 18], [34, 26]], zombies: [[18, 26], [40, 16]],
      vampires: [[8, 7]], werewolves: [[42, 30]], darkmages: [[16, 12]],
      wraiths: [[30, 8]], ghouls: [[22, 28]], bonegolem: [[44, 22]], banshees: [[6, 24]], gravewights: [[38, 10]], boss_mortain: [[24, 32]] }))
      for (const [sx, sy] of spots) mkPack(sx * T, sy * T, A_DEFS[kind]);

    this.initEncounterHost(null);
    this.cameras.main.setBounds(0, 0, WPX, HPX).startFollow(this.player, true, 0.12, 0.12);
    this.floatText(this.player.x, this.player.y - 60, 'THE ASHENVEIL', '#9af0c0', 18);
    this.introPan();
    const hunterArrival = 'The grim coach stops where the living road gives up. Grave-lights mark the field rows; the working dead do not look up. The guild\'s writ is folded in your coat: hunt what slips the leash — the feral, the unsanctioned, the expelled. The Academy pays for quiet corrections, and asks, politely, that you not stare at the workforce.';
    if (!flags['ashenveil-arrived']) { flags['ashenveil-arrived'] = true;
      if (GS.player.char === 'warlock') this.signDialog('THE BLACK CARRIAGE', W.carriage);
      else this.signDialog('THE PROVING GROUNDS', hunterArrival); }
  }

  nyxDialog() {
    const W = Quests.warlockEpilogue, H = Quests.warlockHunt, flags = window.GameState.world.flags, N = W.nyx;
    if (window.GameState.player.char !== 'warlock') { // the Matron receives exactly one champion
      const refusal = 'A registrar with no pulse takes your name without writing it down. "The Academy is not receiving. The proving grounds are THAT way." Behind the cold doors, something pauses — weighs you the way a ledger weighs a number it does not need yet — and moves on.';
      this.signDialog('THE ASHENVEIL ACADEMY', refusal); return;
    }
    const portrait = this.nyxPortrait();
    const cagedCount = () => H.targets.reduce((n, t) => n + (flags[t.flag] ? 1 : 0), 0) + (flags[H.varenholm.flag] ? 1 : 0);

    // the hunt is delivered and done: the great hall, and the web's next name
    if (flags[H.huntFlag] === 'done') {
      this.signDialog('THE ASHENVEIL ACADEMY', 'The great hall is empty. The cold is not. Somewhere below — and the lower levels are not a metaphor — the web is already drafting your next contract.'); return;
    }

    // the hunt is on: DELIVER when all five are caged, otherwise send the warlock back out
    if (flags[H.huntFlag] === 'active') {
      const caged = cagedCount();
      if (caged >= 5) {
        const D = H.deliver;
        flags[H.huntFlag] = 'done';
        flags['credits-rolled'] = true;
        CityUI.dialog(D.name, D.line, [{ label: D.go[0], fn: () => {
          CityUI.closeDialog();
          this.floatText(this.player.x, this.player.y - 60, 'THE WARLOCK\'S ROAD — complete', '#9af0c0', 16);
          setTimeout(() => CityUI.credits(D.credits), 2200);
        }}], portrait);
      } else {
        const left = 5 - caged;
        const midHunt = 'The Matron does not rise. She reads the empty floor where the cages will stand, and finds it wanting. "' + caged + ' of five, warlock. The web does not pay on credit." A pause, precise as a ledger line. "Bring me the rest — ' + left + ' still breathing, still loose — and the Order may scream your name into a pillow forever. The black carriage knows the way back out."';
        CityUI.dialog(N.name, midHunt, [{ label: '"' + left + ' to go. The hunt continues."', fn: () => CityUI.closeDialog() }], portrait);
      }
      return;
    }

    // first meeting: the reveal, the offer, and the LAUNCH of the hunt (no credits yet)
    const launch = () => {
      flags['q-wq3-the-matron'] = 'done';
      flags[H.huntFlag] = 'active';
      const L = H.launch;
      CityUI.dialog(L.name, L.brief, [{ label: 'Read the five names.', fn: () =>
        CityUI.dialog(L.name, L.charge, [{ label: L.go[0], fn: () => {
          CityUI.closeDialog();
          this.floatText(this.player.x, this.player.y - 60, 'THE HUNT — bring back five, breathing', '#9af0c0', 16);
        }}], portrait) }], portrait);
    };
    CityUI.dialog(N.name, N.reveal1, [{ label: '"You keep meticulous books, Matron."', fn: () =>
      CityUI.dialog(N.name, N.reveal2, [{ label: '"I see the shape. Name the terms."', fn: () =>
        CityUI.dialog(N.name, N.offer, [
          { label: '"Protection for procurement. Clean arithmetic. Accepted."', fn: launch },
          { label: '"Point the web at the prey. I\'ll mind the bruising."', fn: launch }], portrait) }], portrait) }], portrait);
  }

  nyxPortrait() {
    if (this._nyxP) return this._nyxP;
    const pc = document.createElement('canvas'); pc.width = pc.height = 72;
    const r = createPitCombat({ width: 72, height: 72, ctx: pc.getContext('2d'), ui: {} });
    r.drawFighter(36, 44, 13, -Math.PI / 2, '#1a1422', { robe: true, hood: true, headCol: '#d8d0e0' });
    this._nyxP = pc;
    return pc;
  }

  update(time, dtMs) {
    const dt = Math.min(0.05, dtMs / 1000);
    if (this.updateEncounter(time)) return;
    this.updatePlayer(dt);
    this.updateFollower(dt);
    this.updateNPCs(dt);
    this.updatePrompt();
    this.updateAtmosphere(time, dt);

    // feral packs wander + aggro (guild hunts; the Veil restocks every visit)
    const talking = CityUI.dialogOpen() || this.encounterActive || this.cinematic;
    for (const pk of this.packs) {
      if (!pk.alive) continue;
      pk.wanderT -= dt;
      if (talking) continue; // no wander/aggro while a dialog or cinematic is open
      for (const s of pk.sprs) {
        if (pk.wanderT <= 0) { s.tx = pk.x + (Math.random() - 0.5) * 110; s.ty = pk.y + (Math.random() - 0.5) * 110; }
        if (s.tx !== undefined) {
          const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
          if (d > 4) { const f = Math.atan2(dy, dx);
            s.x += Math.cos(f) * 34 * dt; s.y += Math.sin(f) * 34 * dt;
            s.setFrame(this.frameFor(f, time * 0.004, true)); s.setDepth(s.y); }
        }
      }
      if (pk.wanderT <= 0) pk.wanderT = 2 + Math.random() * 3;
      const d = Math.hypot(pk.sprs[0].x - this.player.x, pk.sprs[0].y - this.player.y);
      if (d < 130 && !CityUI.dialogOpen() && !this.encounterActive && !this.cinematic) {
        pk.alive = false;
        this.startEncounter(pk.def.name, pk.def.sub, pk.def.spawn(pk.def.n), win => {
          if (win) {
            for (const s of pk.sprs) s.destroy();
            const counts = window.GameState.world.questCounts;
            let logged = '';
            if (pk.def.quest) { counts[pk.def.quest] = (counts[pk.def.quest] || 0) + pk.def.n; logged = ' (' + counts[pk.def.quest] + ' logged)'; }
            this.floatText(this.player.x, this.player.y - 50, pk.def.name + ' — corrected' + logged, '#9af0c0');
            if (Math.random() < 0.5) GroveScene.prototype.grantLoot.call(this, { type: 'potion-health', label: 'Health Potion' }, this.player.x + 30, this.player.y);
          } else {
            pk.alive = true;
            this.player.x = 24 * 32; this.player.y = 30 * 32;
            this.floatText(this.player.x, this.player.y - 50, 'the working dead drag you back to the coach. gently.', '#c8443a');
          }
        }, { zoneScale: true });
      }
    }
  }
}
