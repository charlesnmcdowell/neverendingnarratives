// VarenholmScene — the Crown Quarter, one night only. Post-finale epilogue arc:
// see the Dancer perform, join her crew for the saltcellar job, repel the cult's
// shopping party. Cookie is a live PC elsewhere — she leaves this scene exactly
// as famous, alive, and unresolved as her own campaign requires.

class VarenholmScene extends WorldScene {
  constructor() { super({ key: 'VarenholmScene' }); }

  preload() {
    for (const [key, uri] of Object.entries(window.EMBEDDED_ASSETS))
      if (!this.textures.exists(key)) this.load.image(key, uri);
  }

  create() {
    const T = 32, MW = 56, MH = 36, WPX = MW * T, HPX = MH * T;
    this.worldW = WPX; this.worldH = HPX;
    this.worldInit();
    const GS = window.GameState, V = Quests.varenholm, flags = GS.world.flags;
    GS.world.zone = 'varenholm';
    if (!flags['q-mq6-the-dancer']) flags['q-mq6-the-dancer'] = 'active';

    // ---------- ground: pale dressed stone (wealthy city) ----------
    const map = this.make.tilemap({ width: MW, height: MH, tileWidth: T, tileHeight: T });
    const tiles = map.addTilesetImage('cainos-stone', undefined, T, T, 0, 0);
    const ground = map.createBlankLayer('ground', tiles).setDepth(0);
    const blocks = [0, 2, 4, 6];
    for (let ty = 0; ty < MH; ty += 2) for (let tx = 0; tx < MW; tx += 2) {
      const b = blocks[Math.floor(Math.random() * blocks.length)];
      ground.putTileAt(b, tx, ty); ground.putTileAt(b + 1, tx + 1, ty);
      ground.putTileAt(b + 8, tx, ty + 1); ground.putTileAt(b + 9, tx + 1, ty + 1);
    }
    ground.forEachTile(t => { t.tint = 0x8a8088; }); // brighter than Karridge

    // walls
    const wallG = this.add.graphics().setDepth(2);
    const wall = (x, y, w, h) => { wallG.fillStyle(0x241e26); wallG.fillRect(x, y, w, h);
      wallG.fillStyle(0x322a36); for (let cx = x; cx < x + w; cx += 24) wallG.fillRect(cx, y - 6, 14, 6);
      this.solid(x, y, w, h); };
    wall(0, 0, WPX, T * 1.5); wall(0, HPX - T * 1.5, 25 * T, T * 1.5);
    wall(31 * T, HPX - T * 1.5, WPX - 31 * T, T * 1.5); // south gate gap 25-31 (the coach)
    wall(0, 0, T, HPX); wall(WPX - T, 0, T, HPX);

    // brighter, glassy atmosphere
    this.makeAtmosphere({ darkness: 0.68, darkCol: 0x0a0814, fogTint: 0xaab0d0, emberCol: '#ffe8a0' });
    for (let lx = 6; lx < MW - 4; lx += 7) { this.addLight(lx * T, 12 * T, 140, true); this.addLight(lx * T, 26 * T, 140, true); }

    // ---------- buildings ----------
    const mkB = (bx, by, bw, bh, name, fn, label) => {
      const key = 'bld-' + bw + 'x' + bh;
      if (!this.textures.exists(key)) this.makeBuildingTexture(key, bw * T, bh * T);
      this.add.image(bx * T, by * T, key).setOrigin(0).setDepth((by + bh) * T);
      this.solid(bx * T, by * T, bw * T, bh * T);
      const dx = (bx + Math.floor(bw / 2)) * T, dy = (by + bh) * T;
      this.add.image(dx, dy, 'cainos-props', 'door').setOrigin(0.5, 1).setDepth(dy + 1).setScale(0.9);
      for (let wx = bx * T + 24; wx < (bx + bw) * T - 24; wx += 70) {
        this.add.rectangle(wx, dy - 18, 12, 16, 0xffe8a0, 0.9).setDepth(dy + 1);
        this.addLight(wx, dy + 2, 60, false);
      }
      if (name) { this.add.rectangle(dx, by * T - 10, name.length * 7 + 16, 18, 0x15100b).setStrokeStyle(1, 0xe7b450, 0.7).setDepth(dy + 2);
        this.add.text(dx, by * T - 10, name, { fontFamily: 'Courier New', fontSize: '11px', color: '#e7b450' }).setOrigin(0.5).setDepth(dy + 2); }
      if (fn) this.interactables.push({ x: dx, y: dy - 10, label, fn });
      return { dx, dy };
    };
    const propsTex = this.textures.get('cainos-props');
    if (!propsTex.has('door')) propsTex.add('door', 0, 32, 98, 68, 90);
    if (!propsTex.has('statue')) propsTex.add('statue', 0, 448, 0, 64, 96);

    mkB(6, 4, 16, 7, 'VARENHOLM ACADEMY', () => this.signDialog('THE ACADEMY', 'Term is out. Somewhere in there is a registrar still recovering from an accelerated graduation, and a teacher who suspects "children of fire."'), 'read the Academy plaque');
    this.audit = mkB(30, 4, 18, 9, 'CIVIC AUDITORIUM', () => this.performance(), 'enter the CIVIC AUDITORIUM');
    this.guildB = mkB(20, 20, 14, 8, 'ADVENTURERS GUILD', () => this.guildHall(), 'enter the ADVENTURERS GUILD');
    mkB(42, 22, 10, 6, 'THE GILDED THREAD', () => this.signDialog('THE GILDED THREAD', 'Performance outfitter. The wererat damage in the cellar has been repaired, the discount plaque on the wall has one name on it, and the staff speak of her in the tone reserved for weather.'), 'window-shop');

    this.add.image(27 * T, 16 * T, 'cainos-props', 'statue').setOrigin(0.5, 1).setDepth(16 * T).setScale(1.2);
    this.solid(27 * T - 28, 16 * T - 34, 56, 34);

    // playbill
    this.interactables.push({ x: 27 * T, y: 17 * T, label: 'read the playbill', fn: () =>
      this.signDialog('PLAYBILL', 'ONE NIGHT — THE DANCER. V.E.A. MASTER OF VOICE. CIVIC AUDITORIUM. (Sold out. Sold out. SOLD OUT — standing room by mercy of the fire marshal.)') });

    // ---------- characters ----------
    this.bakeFrames({ 'fr-cookie': { col: '#8a2f3a', o: { headCol: '#b8884a', wpnLen: 0 }, r: 10 } });
    this.spawnPlayer(28 * T, (MH - 4) * T);
    const palettes = ['fr-npc0', 'fr-npc1', 'fr-npc2', 'fr-npc3'];
    for (let i = 0; i < 10; i++)
      this.addNPC(palettes[i % 4], (6 + Math.random() * (MW - 12)) * T, (12 + Math.random() * 18) * T,
        { x: 5, y: 12, w: MW - 10, h: 18 });

    this.initEncounterHost(null);
    this.cameras.main.setBounds(0, 0, WPX, HPX).startFollow(this.player, true, 0.12, 0.12);
    this.introPan();
    MusicMan.play('varenholm');
    this.floatText(this.player.x, this.player.y - 60, 'VARENHOLM — CROWN QUARTER', '#e7b450', 18);
    this.signDialog('THE COACH ROAD', Quests.varenholm.coach);

    // coach home
    this.interactables.push({ x: 28 * T, y: (MH - 2) * T, label: 'take the coach back to Karridge', fn: () => {
      const doneQ = window.GameState.world.flags['q-mq6-the-dancer'] === 'done';
      if (doneQ && !window.GameState.world.flags['credits-rolled']) {
        window.GameState.world.flags['credits-rolled'] = true;
        CityUI.dialog('THE ROAD SOUTH', Quests.varenholm.done, [{ label: 'Go home the long way', fn: () => {
          CityUI.closeDialog();
          CityUI.credits('THE DRUID\'S ROAD — the green keeps singing, and she keeps the letter ready');
        }}]);
        return;
      }
      window.GameState.world.cityFromGrove = false; this.scene.start('CityScene');
    }});
  }

  makeBuildingTexture(key, w, h) { CityScene.prototype.makeBuildingTexture.call(this, key, w, h); }

  performance() {
    const V = Quests.varenholm, GS = window.GameState, flags = GS.world.flags;
    if (flags['varenholm-show-seen']) { this.signDialog('CIVIC AUDITORIUM', 'The hall is dark now. The footlights are cold. The grin lingers in the room the way warmth lingers in stone.'); return; }
    const p2 = GS.player.char === 'druid' ? V.performance2druid : V.performance2;
    const wash = () => { // Heartstring wash: the whole screen warms for a breath
      const f = document.getElementById('flash');
      f.style.background = '#ffb050'; f.style.transition = 'none'; f.style.opacity = 0.25;
      requestAnimationFrame(() => { f.style.transition = 'opacity 2.2s'; f.style.opacity = 0;
        setTimeout(() => { f.style.background = '#fff'; }, 2300); });
    };
    wash();
    CityUI.dialog('THE PERFORMANCE', V.performance1, [{ label: 'Let it wash over you', fn: () => {
      wash();
      CityUI.dialog('THE PERFORMANCE', p2, [{ label: 'Find the guild after the show', fn: () => {
        flags['varenholm-show-seen'] = true; CityUI.closeDialog();
        this.spawnCookie();
      }}]);
    }}]);
  }

  spawnCookie() {
    if (this.cookieSpr) return;
    const x = this.guildB.dx + 50, y = this.guildB.dy + 20;
    this.cookieSpr = this.add.sprite(x, y, 'fr-cookie', 0).setDepth(y);
    this.add.text(x, y - 30, 'COOKIE', { fontFamily: 'Courier New', fontSize: '10px', color: '#f06a8a', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(y);
    this.addLight(x, y, 70, false);
  }

  guildHall() {
    const V = Quests.varenholm, GS = window.GameState, flags = GS.world.flags;
    if (!flags['varenholm-show-seen']) { this.signDialog('ADVENTURERS GUILD', 'The board is thick with contracts and the room is thin with people — everyone who matters is at the Auditorium. Whatever you came for, it\'s on that stage right now.'); return; }
    const close = () => CityUI.closeDialog();
    const C = V.cookie, druid = GS.player.char === 'druid';
    const portrait = this.portraitCookie();
    if (flags['q-mq6-the-dancer'] === 'done') {
      CityUI.dialog(C.name, '"Still here? The encore was YESTERDAY." She grins. "Road safe, pit-name. Send word if the ledger people get bold again."', [{ label: 'Leave', fn: close }], portrait); return;
    }
    const startJob = () => {
      CityUI.closeDialog();
      const ally = () => this.encCombat.addAlly({ humanLook: { headCol: '#b8884a', wpnLen: 0 }, col: '#8a2f3a', r: 10, nameTag: 'COOKIE', hp: 90, maxhp: 90 });
      setTimeout(ally, 150);
      this.startEncounter(V.saltcellarBanner[0], V.saltcellarBanner[1], [
        { type: 'hound', x: 540, y: 300, hp: 80, maxhp: 80, spd: 200, r: 11, col: '#5a4a3a', dmgScale: 1.1 },
        { type: 'hound', x: 720, y: 320, hp: 80, maxhp: 80, spd: 200, r: 11, col: '#5a4a3a', dmgScale: 1.1 },
        { type: 'skel', x: 600, y: 240, hp: 90, maxhp: 90, spd: 125, r: 11, col: '#b8d0d8', dmgScale: 1.15 },
        { type: 'skel', x: 700, y: 240, hp: 90, maxhp: 90, spd: 125, r: 11, col: '#b8d0d8', dmgScale: 1.15 },
        { type: 'skel', x: 650, y: 420, hp: 90, maxhp: 90, spd: 125, r: 11, col: '#b8d0d8', dmgScale: 1.15 },
      ], win => {
        if (!win) { this.player.x = 28 * 32; this.player.y = 32 * 32;
          this.floatText(this.player.x, this.player.y - 50, 'the warehouse boys drag you out by the boots', '#c8443a'); return; }
        CityUI.dialog(C.name, C.afterJob, [{ label: '—', fn: () => {
          CityUI.closeDialog();
          setTimeout(ally, 150);
          this.startEncounter(V.cultBanner[0], V.cultBanner[1], [
            { type: 'hook', x: 520, y: 280, hp: 140, maxhp: 140, spd: 155, r: 14, col: '#4a3c5a', dmgScale: 1.3 },
            { type: 'hook', x: 760, y: 280, hp: 140, maxhp: 140, spd: 155, r: 14, col: '#4a3c5a', dmgScale: 1.3 },
            { type: 'grave', x: 580, y: 220, hp: 300, maxhp: 300, spd: 105, r: 16, col: '#3a3450', stance: 'open', stanceT: 1, dmgScale: 1.35 },
            { type: 'stitch', x: 700, y: 220, hp: 200, maxhp: 200, spd: 125, r: 13, col: '#5a4a66', dmgScale: 1.3 },
          ], win2 => {
            if (!win2) { this.player.x = 28 * 32; this.player.y = 32 * 32;
              this.floatText(this.player.x, this.player.y - 50, 'Cookie hauls you clear. "RUDE of them," she pants.', '#c8443a'); return; }
            const GS2 = window.GameState;
            GS2.player.copper += 200; CityUI.setPurse(GS2.player.copper);
            GS2.world.flags['q-mq6-the-dancer'] = 'done';
            CityUI.dialog(C.name, druid ? C.afterCultDruid : C.afterCult,
              [{ label: druid ? '"You\'ll get the letter first."' : '"Tell the encore I said hi."', fn: () => {
                CityUI.closeDialog();
                this.floatText(this.player.x, this.player.y - 50, '+2g · JOURNAL UPDATED — THE DANCER', '#e7b450', 14);
              }}], portrait);
          });
        }}], portrait);
      });
    };
    CityUI.dialog(C.name, druid ? C.greetDruid : C.greet, [
      { label: druid ? '"...He doesn\'t know. Yes, I\'m in."' : 'Take the job', fn: () =>
        CityUI.dialog(C.name, C.jobBrief, [{ label: 'Down past the third step', fn: startJob }], portrait) },
      { label: 'Not yet', fn: close }], portrait);
  }

  portraitCookie() {
    if (this._cookiePortrait) return this._cookiePortrait;
    const pc = document.createElement('canvas'); pc.width = pc.height = 72;
    const r = createPitCombat({ width: 72, height: 72, ctx: pc.getContext('2d'), ui: {} });
    r.drawFighter(36, 44, 11, -Math.PI / 2, '#8a2f3a', { headCol: '#b8884a' });
    this._cookiePortrait = pc;
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
  }
}
