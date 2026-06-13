// MountainScene — DRAGONSPINE, the treaty lands. The Seraphim's road: very high
// level wilds (ogres, orcs, goblins, wyverns, slimes), five duel-champions, and
// the Skyreach shrine at the peak. Other champions hear about it in a tavern.

const MOUNT_THEME = { backdrop: '#08090f', star: 'rgba(150,160,200,.16)', ringCol: '120,135,170',
  crowdCol: '160,170,200', floor: '#10121c', rim: '#8a93a8', rivet: '#cfd6e4', showCrowd: false };

class MountainScene extends WorldScene {
  constructor() { super({ key: 'MountainScene' }); }

  preload() {
    for (const [key, uri] of Object.entries(window.EMBEDDED_ASSETS))
      if (!this.textures.exists(key)) this.load.image(key, uri);
  }

  create() {
    const T = 32, MW = 64, MH = 44, WPX = MW * T, HPX = MH * T;
    this.worldW = WPX; this.worldH = HPX;
    this.worldInit();
    const GS = window.GameState, flags = GS.world.flags, SQ = Quests.seraph;
    GS.world.zone = 'dragonspine';

    // the spine trail delivers the quest beat
    if (flags['q-sq2-where-strength-lives'] === 'active') {
      flags['q-sq2-where-strength-lives'] = 'done';
      flags['q-sq3-five-banners'] = 'active';
    }

    // ---------- ground: cold dressed stone ----------
    const map = this.make.tilemap({ width: MW, height: MH, tileWidth: T, tileHeight: T });
    const tiles = map.addTilesetImage('cainos-stone', undefined, T, T, 0, 0);
    const ground = map.createBlankLayer('ground', tiles).setDepth(0);
    const blocks = [0, 2, 4, 6];
    for (let ty = 0; ty < MH; ty += 2) for (let tx = 0; tx < MW; tx += 2) {
      const b = blocks[Math.floor(Math.random() * blocks.length)];
      ground.putTileAt(b, tx, ty); ground.putTileAt(b + 1, tx + 1, ty);
      ground.putTileAt(b + 8, tx, ty + 1); ground.putTileAt(b + 9, tx + 1, ty + 1);
    }
    ground.forEachTile(t => { t.tint = 0x4a4f5e; }); // thin-air blue-grey

    // ---------- cliffs: jagged rock walls ----------
    const rockG = this.add.graphics().setDepth(3);
    const cliff = (x, y, w, h) => {
      this.solid(x, y, w, h);
      for (let i = 0; i < (w * h) / 800; i++) {
        const cx = x + Math.random() * w, cy = y + Math.random() * h;
        rockG.fillStyle(0x1c1f2c, 1); rockG.fillTriangle(cx - 26, cy + 16, cx + 26, cy + 16, cx + (Math.random() - 0.5) * 14, cy - 24 - Math.random() * 16);
        rockG.fillStyle(0x2a2e40, 1); rockG.fillTriangle(cx - 12, cy + 12, cx + 14, cy + 12, cx + 2, cy - 14);
        rockG.fillStyle(0xcfd6e4, 0.5); rockG.fillTriangle(cx - 4, cy - 8, cx + 6, cy - 6, cx + 2, cy - 14); // snowcap
      }
    };
    cliff(0, 0, WPX, T * 2);                          // the peak ridge
    cliff(0, 0, T * 2, HPX); cliff(WPX - T * 2, 0, T * 2, HPX);
    cliff(0, HPX - T * 1.5, 24 * T, T * 1.5);          // south, gap 24-30: the spine trail down
    cliff(30 * T, HPX - T * 1.5, WPX - 30 * T, T * 1.5);
    // scattered crags
    for (const [gx, gy, gw, gh] of [[8, 8, 7, 5], [22, 20, 6, 5], [40, 26, 8, 6], [50, 8, 7, 6], [10, 36, 8, 5], [38, 12, 5, 4]])
      cliff(gx * T, gy * T, gw * T, gh * T);

    // thin, bright, rude air
    this.makeAtmosphere({ darkness: 0.72, darkCol: 0x070910, fogTint: 0x9aa8d0, emberCol: '#cfd6e4' });
    for (let i = 0; i < 14; i++) { // cairn-lights along the passes
      const lx = (5 + Math.random() * (MW - 10)) * T, ly = (5 + Math.random() * (MH - 10)) * T;
      if (this.collide(lx, ly, 14)) continue;
      this.add.circle(lx, ly, 3, 0xcfe2ff, 0.9).setDepth(ly).setBlendMode(Phaser.BlendModes.ADD);
      this.addLight(lx, ly + 14, 70, false);
    }

    // ---------- the Skyreach shrine (peak, north center) ----------
    const shX = 32 * T, shY = 4 * T;
    const sg = this.add.graphics().setDepth(shY);
    sg.fillStyle(0x232838); for (let s = 0; s < 4; s++) sg.fillRect(shX - 70 + s * 10, shY + 30 - s * 12, 140 - s * 20, 10); // wind-scoured steps
    sg.lineStyle(3, 0xffe9a8, 0.8); sg.strokeEllipse(shX, shY - 26, 52, 64); // the doorway of air
    sg.lineStyle(1.5, 0xfff6dc, 0.4); sg.strokeEllipse(shX, shY - 26, 66, 80);
    this.addLight(shX, shY, 160, false);
    this.interactables.push({ x: shX, y: shY + 26, label: 'approach the SKYREACH SHRINE', fn: () => this.shrineDialog() });

    // ---------- the five banners ----------
    this.bakeFrames(Object.fromEntries([
      ...Quests.seraph.candidates.map(c => ['fr-duel-' + c.id, c.look]),
      ['fr-goblin', { col: '#4a6a3a', o: {}, r: 9 }],
      ['fr-orcm', { col: '#3a5a40', o: { wpnLen: 26, wpnCol: '#8a8f98' } }],
      ['fr-ogre', { col: '#5a4a38', o: { hulk: true, headCol: '#4a3a28' }, r: 15 }],
      ['fr-slime', { col: '#3a8a6a', o: { blob: true }, r: 12 }],
      ['fr-wyvern', { col: '#7a3a4a', o: { quad: true }, r: 13 }],
      ['fr-firele', { col: '#d05a2a', o: { blob: true }, r: 12 }],
      // 5 new mountain monsters (Hiro)
      ['fr-rockgolem', { col: '#6a6a72', o: { hulk: true, headCol: '#4a4a52' }, r: 18 }],
      ['fr-frostele', { col: '#7fd0ff', o: { blob: true }, r: 12 }],
      ['fr-troll', { col: '#5a6a4a', o: { hulk: true, headCol: '#3a4a2c' }, r: 17 }],
      ['fr-griffon', { col: '#b89a5a', o: { quad: true }, r: 13 }],
      ['fr-drake', { col: '#8a3a2c', o: { quad: true }, r: 14 }],
    ]));
    for (const c of Quests.seraph.candidates) this.placeCandidate(c, T);

    // ---------- the high wilds (they restock — the Spine is never tamed) ----------
    this.packs = [];
    const mkPack = (px, py, def) => {
      const sprs = [];
      for (let i = 0; i < def.n; i++) {
        const s = this.add.sprite(px + (Math.random() - 0.5) * 80, py + (Math.random() - 0.5) * 80, def.tex, 0);
        s.setDepth(s.y); sprs.push(s);
      }
      this.packs.push({ x: px, y: py, def, sprs, alive: true, wanderT: 0 });
    };
    const W_DEFS = {
      goblins: { tex: 'fr-goblin', n: 4, name: 'GOBLIN CUTTERS', sub: 'the king\'s unpaid taxmen',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'skel', x: 640 + Math.cos(i * 1.7) * 210, y: 300 + Math.sin(i * 1.7) * 120,
          hp: 190, maxhp: 190, spd: 165, r: 10, col: '#4a6a3a', dmgScale: 1.35 })) },
      orcs: { tex: 'fr-orcm', n: 3, name: 'ORC RAIDERS', sub: 'they hold the pass. held.', quest: 'g-orcs',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'hook', x: 640 + Math.cos(i * 2.1) * 200, y: 310 + Math.sin(i * 2.1) * 120,
          hp: 270, maxhp: 270, spd: 155, r: 14, col: '#3a5a40', dmgScale: 1.4 })) },
      ogres: { tex: 'fr-ogre', n: 1, name: 'A HILL THAT MOVES', sub: 'it was here first', quest: 'g-ogres',
        spawn: () => [{ type: 'door', x: 640, y: 260, r: 30, hp: 640, maxhp: 640, spd: 54, col: '#5a4a38', wpn: '#3a2f24', dmgScale: 1.5 }] },
      firele: { tex: 'fr-firele', n: 2, name: 'FIRE ELEMENTALS', sub: 'the forge-vents walked out', quest: 'g-firele',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'pyre', x: 640 + Math.cos(i * 2.8) * 200, y: 300 + Math.sin(i * 2.8) * 120,
          hp: 310, maxhp: 310, spd: 120, r: 14, col: '#d05a2a', dmgScale: 1.45 })) },
      slimes: { tex: 'fr-slime', n: 3, name: 'MOUNTAIN SLIMES', sub: 'they remember being heroes',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'hound', x: 640 + Math.cos(i * 2.4) * 190, y: 320 + Math.sin(i * 2.4) * 110,
          hp: 320, maxhp: 320, spd: 115, r: 13, col: '#3a8a6a', dmgScale: 1.3 })) },
      wyverns: { tex: 'fr-wyvern', n: 2, name: 'WYVERN BROOD', sub: 'the queen\'s daughters take a look at you', quest: 'g-wyverns',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'gunner', x: 640 + Math.cos(i * 3) * 230, y: 290 + Math.sin(i * 3) * 130,
          hp: 290, maxhp: 290, spd: 145, r: 13, col: '#7a3a4a', dmgScale: 1.45 })) },
      // --- 5 new mountain monsters (Hiro) ---
      rockgolem: { tex: 'fr-rockgolem', n: 1, name: 'ROCK GOLEM', sub: 'the mountain stood up',
        spawn: () => [{ type: 'door', x: 640, y: 270, r: 30, hp: 680, maxhp: 680, spd: 48, col: '#6a6a72', wpn: '#4a4a52', dmgScale: 1.5 }] },
      frostele: { tex: 'fr-frostele', n: 2, name: 'FROST ELEMENTALS', sub: 'the cold has opinions',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'gunner', x: 640 + Math.cos(i * 2.7) * 210, y: 300 + Math.sin(i * 2.7) * 120,
          hp: 300, maxhp: 300, spd: 130, r: 13, col: '#7fd0ff', dmgScale: 1.45 })) },
      troll: { tex: 'fr-troll', n: 2, name: 'MOUNTAIN TROLLS', sub: 'they heal faster than you hit',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'chain', x: 640 + Math.cos(i * 2.5) * 190, y: 300 + Math.sin(i * 2.5) * 110,
          hp: 420, maxhp: 420, spd: 80, r: 17, col: '#5a6a4a', dmgScale: 1.4 })) },
      griffon: { tex: 'fr-griffon', n: 2, name: 'GRIFFONS', sub: 'they hunt the high passes',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'hound', x: 640 + Math.cos(i * 3) * 220, y: 290 + Math.sin(i * 3) * 125,
          hp: 300, maxhp: 300, spd: 215, r: 14, col: '#b89a5a', dmgScale: 1.4 })) },
      drake: { tex: 'fr-drake', n: 1, name: 'A YOUNG DRAKE', sub: 'not the brood-mother. bad enough.',
        spawn: () => [{ type: 'pyre', x: 640, y: 270, r: 16, hp: 520, maxhp: 520, spd: 110, col: '#8a3a2c', dmgScale: 1.5 }] },
    };
    for (const [kind, spots] of Object.entries({ goblins: [[40, 20], [18, 24]], orcs: [[26, 34], [46, 36]],
      ogres: [[10, 18], [50, 38]], slimes: [[52, 24], [20, 12]], wyverns: [[44, 8], [12, 8]], firele: [[34, 28], [22, 40]],
      rockgolem: [[8, 30]], frostele: [[56, 16]], troll: [[28, 12]], griffon: [[48, 26]], drake: [[16, 38]] }))
      for (const [sx, sy] of spots) mkPack(sx * T, sy * T, W_DEFS[kind]);

    // ---------- chests ----------
    const propsTex = this.textures.get('cainos-props');
    if (!propsTex.has('chest')) propsTex.add('chest', 0, 96, 32, 64, 64);
    for (const c of [
      { x: 8, y: 40, loot: { type: 'potion-con', label: 'CON Potion (+25%, 60s)' } },
      { x: 56, y: 14, loot: { type: 'artifact', id: 'ley-shard', label: 'LEY-SHARD — +10% damage (permanent)' } },
    ]) {
      const id = 'mchest-' + c.x + '-' + c.y;
      const img = this.add.image(c.x * T, c.y * T, 'cainos-props', 'chest').setOrigin(0.5, 1).setDepth(c.y * T).setScale(0.8);
      if (GS.world.chestsOpened.includes(id)) img.setTint(0x555555);
      this.interactables.push({ x: c.x * T, y: c.y * T, label: 'open the chest', fn: () => {
        if (GS.world.chestsOpened.includes(id)) { this.floatText(c.x * T, c.y * T - 40, 'empty', '#6b5d4f'); return; }
        GS.world.chestsOpened.push(id); img.setTint(0x555555);
        GroveScene.prototype.grantLoot.call(this, c.loot, c.x * T, c.y * T);
      }});
    }

    // ---------- player + travel ----------
    this.spawnPlayer(27 * T, (MH - 4) * T);
    this.gateSouth = { x: 24 * T, y: HPX - T * 1.5, w: 6 * T, h: T * 1.5 };
    this.initEncounterHost(MOUNT_THEME);
    this.cameras.main.setBounds(0, 0, WPX, HPX).startFollow(this.player, true, 0.12, 0.12);
    this.floatText(this.player.x, this.player.y - 60, 'DRAGONSPINE — THE TREATY LANDS', '#cfd6e4', 18);
    this.introPan();
    if (!flags['spine-arrived']) { flags['spine-arrived'] = true; this.signDialog('THE SPINE TRAIL', SQ.arrival); }
  }

  placeCandidate(c, T) {
    const flags = window.GameState.world.flags;
    const x = c.spot[0] * T, y = c.spot[1] * T;
    const spr = this.add.sprite(x, y, 'fr-duel-' + c.id, 0).setDepth(y);
    this.add.text(x, y - 38, c.name.split(',')[0], { fontFamily: 'Courier New', fontSize: '10px',
      color: flags['duel-' + c.id] ? '#7fbf6a' : '#e7b450', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(y);
    this.addLight(x, y, 80, false);
    this.interactables.push({ x, y, label: (flags['duel-' + c.id] ? 'speak with ' : 'challenge ') + c.name.split(',')[0], fn: () => this.duelDialog(c) });
  }

  duelDialog(c) {
    const GS = window.GameState, flags = GS.world.flags, close = () => CityUI.closeDialog();
    const recruited = flags['seraph-recruit'];
    if (recruited === c.id) { CityUI.dialog(c.name, c.recruited + ' (The Skyreach shrine waits at the peak.)', [{ label: '"To the peak."', fn: close }], this.duelPortrait(c)); return; }
    if (recruited) { CityUI.dialog(c.name, 'The banner is already pledged elsewhere. The mountain knows it; so does this one. There is a kind of peace in losing to the WORTHIEST.', [{ label: 'Leave', fn: close }], this.duelPortrait(c)); return; }
    const offerRecruit = () => CityUI.dialog(c.name, c.win, [
      { label: c.recruit, fn: () => {
        flags['seraph-recruit'] = c.id;
        flags['q-sq3-five-banners'] = 'done';
        flags['q-sq4-the-chosen'] = 'active';
        CityUI.dialog(c.name, c.recruited, [{ label: 'To the Skyreach shrine', fn: () => {
          close();
          this.floatText(this.player.x, this.player.y - 50, 'JOURNAL UPDATED — THE CHOSEN', '#3df0c8', 14);
        }}], this.duelPortrait(c));
      }},
      { label: c.spare, fn: close }], this.duelPortrait(c));
    if (flags['duel-' + c.id] === 'won') { offerRecruit(); return; }
    const fight = () => { close();
      this.startEncounter(c.banner[0], c.banner[1], c.pack.map(e => Object.assign({}, e)), win => {
        if (!win) { this.player.x = 27 * 32; this.player.y = 40 * 32;
          this.floatText(this.player.x, this.player.y - 50, 'the mountain carries you back down. the banner stands.', '#c8443a'); return; }
        flags['duel-' + c.id] = 'won';
        offerRecruit();
      });
    };
    CityUI.dialog(c.name, c.intro, [
      { label: c.challenge, fn: fight },
      { label: 'Not yet', fn: close }], this.duelPortrait(c));
  }

  duelPortrait(c) {
    this._dp = this._dp || {};
    if (this._dp[c.id]) return this._dp[c.id];
    const pc = document.createElement('canvas'); pc.width = pc.height = 72;
    const r = createPitCombat({ width: 72, height: 72, ctx: pc.getContext('2d'), ui: {} });
    r.drawFighter(36, 44, c.look.r || 13, -Math.PI / 2, c.look.col, c.look.o);
    this._dp[c.id] = pc;
    return pc;
  }

  shrineDialog() {
    const GS = window.GameState, flags = GS.world.flags, S = Quests.seraph.shrine;
    if (flags['q-sq4-the-chosen'] === 'done') { this.signDialog('THE SKYREACH SHRINE', 'The doorway of air stands quiet. It has done what it was waiting nine hundred years to do.'); return; }
    if (flags['q-sq4-the-chosen'] !== 'active') { this.signDialog('THE SKYREACH SHRINE', S.closed); return; }
    const c = Quests.seraph.candidates.find(x => x.id === flags['seraph-recruit']);
    CityUI.dialog('THE SKYREACH SHRINE', S.frame, [{ label: 'Lay your spear on the air', fn: () =>
      CityUI.dialog('THE SKYREACH SHRINE', c.ending, [{ label: 'Rise', fn: () =>
        CityUI.dialog('THE SKYREACH SHRINE', S.closing, [{ label: 'The sky takes two', fn: () => {
          flags['q-sq4-the-chosen'] = 'done';
          CityUI.closeDialog();
          this.floatText(this.player.x, this.player.y - 60, 'THE SERAPHIM\'S ROAD — complete', '#ffe9a8', 16);
          setTimeout(() => CityUI.credits(S.credits), 2200);
        }}]) }]) }]);
  }

  update(time, dtMs) {
    const dt = Math.min(0.05, dtMs / 1000);
    if (this.updateEncounter(time)) return;
    this.updatePlayer(dt);
    this.updateFollower(dt);
    this.updatePrompt();
    this.updateAtmosphere(time, dt);

    // wilds wander + aggro (no flags: the Spine restocks every visit)
    for (const pk of this.packs) {
      if (!pk.alive) continue;
      pk.wanderT -= dt;
      for (const s of pk.sprs) {
        if (pk.wanderT <= 0) { s.tx = pk.x + (Math.random() - 0.5) * 120; s.ty = pk.y + (Math.random() - 0.5) * 120; }
        if (s.tx !== undefined) {
          const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
          if (d > 4) { const f = Math.atan2(dy, dx);
            s.x += Math.cos(f) * 36 * dt; s.y += Math.sin(f) * 36 * dt;
            s.setFrame(this.frameFor(f, time * 0.004, true)); s.setDepth(s.y); }
        }
      }
      if (pk.wanderT <= 0) pk.wanderT = 2 + Math.random() * 3;
      const d = Math.hypot(pk.sprs[0].x - this.player.x, pk.sprs[0].y - this.player.y);
      if (d < 130) {
        pk.alive = false;
        this.startEncounter(pk.def.name, pk.def.sub, pk.def.spawn(pk.def.n), win => {
          if (win) {
            for (const s of pk.sprs) s.destroy();
            if (pk.def.quest) { // the guild ledger hears about it
              const counts = window.GameState.world.questCounts;
              counts[pk.def.quest] = (counts[pk.def.quest] || 0) + pk.def.n;
              this.floatText(this.player.x, this.player.y - 66, pk.def.quest.slice(2).toUpperCase() + ' logged: ' + counts[pk.def.quest], '#7fbf6a', 11);
            }
            this.floatText(this.player.x, this.player.y - 50, pk.def.name + ' — the pass is yours', '#cfd6e4');
            if (Math.random() < 0.5) GroveScene.prototype.grantLoot.call(this, { type: 'potion-health', label: 'Health Potion' }, this.player.x + 30, this.player.y);
          } else {
            pk.alive = true;
            this.player.x = 27 * 32; this.player.y = 40 * 32;
            this.floatText(this.player.x, this.player.y - 50, 'the thin air spits you back to the trailhead', '#c8443a');
          }
        }, { zoneScale: true });
      }
    }

    // south gate → the spine trail down to Thorn Grove
    if (this.player.y > this.gateSouth.y - 10 &&
        this.player.x > this.gateSouth.x - 8 && this.player.x < this.gateSouth.x + this.gateSouth.w + 8) {
      window.GameState.world.groveFromCity = false;
      this.scene.start('GroveScene');
    }
  }
}
