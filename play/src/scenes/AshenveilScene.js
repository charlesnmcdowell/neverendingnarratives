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

    // ---------- the working dead ----------
    this.bakeFrames({ 'fr-deadworker': { col: '#8a8474', o: { skull: true } } });
    for (let i = 0; i < 9; i++)
      this.addNPC('fr-deadworker', (5 + Math.random() * (MW - 14)) * T, (10 + Math.random() * 18) * T,
        { x: 4, y: 9, w: MW - 12, h: 20 });
    this.interactables.push({ x: 10 * T, y: 14 * T, label: 'watch the working dead', fn: () =>
      this.signDialog('THE WORKING DEAD', 'They mend fences. They clear ash. They stack stones in rows neat as ledgers, for a kingdom that officially does not employ them. None of them look up. One of them, you notice with a cold professional respect, has been dead long enough to be furniture — and still sets a straighter fencepost than any living farmhand you ever saw.') });
    this.interactables.push({ x: 38 * T, y: 24 * T, label: 'read the boundary stone', fn: () =>
      this.signDialog('THE BOUNDARY STONE', 'ASHENVEIL PROVING GROUNDS — VISITORS REGISTER AT THE ACADEMY. The letters are carved deep and recent. Below them, older, almost worn away: a name the rumors only whisper, and below THAT, scratched by some long-dead student: "the lower levels are NOT a metaphor."') });

    // ---------- player + the carriage home ----------
    this.spawnPlayer(24 * T, (MH - 4) * T);
    const cg = this.add.graphics().setDepth((MH - 3) * T);
    cg.fillStyle(0x0c0a12); cg.fillRect(24 * T - 60, (MH - 3) * T - 16, 58, 32);
    cg.lineStyle(1, 0x9af0c0, 0.5); cg.strokeRect(24 * T - 60, (MH - 3) * T - 16, 58, 32);
    this.interactables.push({ x: 24 * T - 30, y: (MH - 3) * T, label: 'take the black carriage back to Karridge', fn: () => {
      window.GameState.world.cityFromGrove = false; this.scene.start('CityScene');
    }});

    this.initEncounterHost(null);
    this.cameras.main.setBounds(0, 0, WPX, HPX).startFollow(this.player, true, 0.12, 0.12);
    this.floatText(this.player.x, this.player.y - 60, 'THE ASHENVEIL', '#9af0c0', 18);
    if (!flags['ashenveil-arrived']) { flags['ashenveil-arrived'] = true;
      this.signDialog('THE BLACK CARRIAGE', W.carriage); }
  }

  nyxDialog() {
    const W = Quests.warlockEpilogue, flags = window.GameState.world.flags, N = W.nyx;
    if (flags['q-wq3-the-matron'] === 'done') {
      this.signDialog('THE ASHENVEIL ACADEMY', 'The great hall is empty. The cold is not. Somewhere below — and the lower levels are not a metaphor — the web is already drafting your first contract.'); return;
    }
    const portrait = this.nyxPortrait();
    const done = () => {
      flags['q-wq3-the-matron'] = 'done';
      flags['credits-rolled'] = true;
      CityUI.dialog(N.name, N.done, [{ label: 'The hunt continues. It hunts for the web now.', fn: () => {
        CityUI.closeDialog();
        this.floatText(this.player.x, this.player.y - 60, 'THE WARLOCK\'S ROAD — complete', '#9af0c0', 16);
        setTimeout(() => CityUI.credits(N.credits), 2200);
      }}], portrait);
    };
    CityUI.dialog(N.name, N.reveal1, [{ label: '"You keep meticulous books, Matron."', fn: () =>
      CityUI.dialog(N.name, N.reveal2, [{ label: '"I see the shape. Name the terms."', fn: () =>
        CityUI.dialog(N.name, N.offer, [
          { label: '"Protection for procurement. Clean arithmetic. Accepted."', fn: done },
          { label: '"Point the web at the prey. I\'ll mind the bruising."', fn: done }], portrait) }], portrait) }], portrait);
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
  }
}
