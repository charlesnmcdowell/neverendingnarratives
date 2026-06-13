// GroveScene — Thorn Grove: the great forest's friendly edge. Giant roots, glowing
// flora, the wood-elf settlement, monster packs (re-skinned arena AI), the ley-line
// node, and the forest dungeon mouth. South gate returns to Karridge.

const GROVE_THEME = { backdrop: '#040a06', star: 'rgba(100,140,110,.10)', ringCol: '70,120,80',
  crowdCol: '127,191,106', floor: '#0c130c', rim: '#3a5a40', rivet: '#9ad0a0', showCrowd: false };

class GroveScene extends WorldScene {
  constructor() { super({ key: 'GroveScene' }); }

  preload() {
    for (const [key, uri] of Object.entries(window.EMBEDDED_ASSETS))
      if (!this.textures.exists(key)) this.load.image(key, uri);
  }

  create() {
    const T = 32, MW = 70, MH = 50, WPX = MW * T, HPX = MH * T;
    this.worldW = WPX; this.worldH = HPX;
    this.worldInit();
    const GS = window.GameState, P = GS.player;
    GS.world.zone = 'thorn-grove';

    // ---------- ground: grass with mossy variation ----------
    const map = this.make.tilemap({ width: MW, height: MH, tileWidth: T, tileHeight: T });
    const tiles = map.addTilesetImage('cainos-grass', undefined, T, T, 0, 0);
    const ground = map.createBlankLayer('ground', tiles).setDepth(0);
    for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++)
      ground.putTileAt([0, 1, 2, 8, 9, 10][Math.floor(Math.random() * 6)], tx, ty);
    ground.forEachTile(t => { t.tint = 0x5a6a52; });

    // ---------- forest edge: tree walls (procedural canopy blobs) ----------
    const treeG = this.add.graphics().setDepth(3);
    const treeWall = (x, y, w, h) => {
      this.solid(x, y, w, h);
      for (let i = 0; i < (w * h) / 900; i++) {
        const cx = x + Math.random() * w, cy = y + Math.random() * h;
        treeG.fillStyle(0x0c1a10, 1); treeG.fillCircle(cx, cy, 22 + Math.random() * 18);
        treeG.fillStyle(0x132615, 1); treeG.fillCircle(cx - 5, cy - 6, 13 + Math.random() * 10);
      }
    };
    treeWall(0, 0, WPX, T * 2);                       // north (deepwood teaser)
    treeWall(0, 0, T * 2, HPX);
    treeWall(WPX - T * 2, 0, T * 2, 8 * T);           // east, gap at 8-12: the spine trail
    treeWall(WPX - T * 2, 12 * T, T * 2, HPX - 12 * T);
    treeWall(0, HPX - T * 1.5, 31 * T, T * 1.5);      // south, gap at gate
    treeWall(37 * T, HPX - T * 1.5, WPX - 37 * T, T * 1.5);
    // scattered groves
    for (const [gx, gy, gw, gh] of [[8, 8, 8, 6], [50, 6, 10, 7], [10, 32, 9, 7], [56, 30, 9, 8], [26, 12, 6, 5]])
      treeWall(gx * T, gy * T, gw * T, gh * T);

    // giant roots (the grove's signature) — sweeping dark arcs
    const rootG = this.add.graphics().setDepth(2);
    rootG.lineStyle(14, 0x1d140e, 1);
    for (const [x1, y1, cx, cy, x2, y2] of [
      [4 * T, 20 * T, 14 * T, 16 * T, 22 * T, 22 * T], [66 * T, 18 * T, 56 * T, 14 * T, 46 * T, 20 * T],
      [20 * T, 44 * T, 30 * T, 40 * T, 26 * T, 30 * T], [50 * T, 46 * T, 44 * T, 38 * T, 52 * T, 32 * T]]) {
      const c = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(x1, y1), new Phaser.Math.Vector2(cx, cy), new Phaser.Math.Vector2(x2, y2));
      c.draw(rootG);
    }

    // glowing flora
    this.makeAtmosphere({ darkness: 0.8, darkCol: 0x030a05, fogTint: 0x9ab8a0, emberCol: '#9ad0ff' });
    for (let i = 0; i < 26; i++) {
      const fx = (3 + Math.random() * (MW - 6)) * T, fy = (3 + Math.random() * (MH - 6)) * T;
      if (this.collide(fx, fy, 12)) continue;
      const hue = Math.random() < 0.5 ? 0x7fd0ff : 0x9af0c0;
      this.add.circle(fx, fy, 3 + Math.random() * 3, hue, 0.9).setDepth(fy).setBlendMode(Phaser.BlendModes.ADD);
      this.addLight(fx, fy + 18, 55, false);
    }

    // ---------- wood-elf settlement (NE) ----------
    const setX = 56, setY = 12;
    for (const [hx, hy] of [[setX, setY], [setX + 5, setY + 3], [setX - 4, setY + 4]]) {
      const g = this.add.graphics().setDepth((hy + 3) * T);
      g.fillStyle(0x1a2416); g.fillCircle(hx * T, hy * T, 40);          // leaf-dome hut
      g.fillStyle(0x24301c); g.fillCircle(hx * T - 8, hy * T - 10, 26);
      g.fillStyle(0x120d08); g.fillRect(hx * T - 8, hy * T + 22, 16, 18); // door
      this.solid(hx * T - 36, hy * T - 30, 72, 56);
      this.addLight(hx * T, hy * T + 30, 90, false);
    }
    // grove keeper (Faelar's people — Faelar himself is a Bucket 6 companion)
    this.bakeFrames({
      'fr-goblin': { col: '#4a6a3a', o: {}, r: 9 },
      'fr-vine': { col: '#2c5a2c', o: { blob: true }, r: 13 },
      'fr-insect': { col: '#6a5a2a', o: { quad: true }, r: 9 },
      'fr-bandit': { col: '#5a4a3a', o: { hood: true, wpnLen: 24, wpnCol: '#8a8f98' } },
      // 5 new forest monsters (Hiro)
      'fr-boar': { col: '#5a4030', o: { quad: true }, r: 14 },
      'fr-treant': { col: '#3a5a2c', o: { hulk: true, headCol: '#2c4420' }, r: 18 },
      'fr-spider': { col: '#2a2030', o: { quad: true }, r: 12 },
      'fr-harpy': { col: '#6a5a3a', o: { wpnLen: 0 }, r: 11 },
      'fr-wisp': { col: '#7fd0ff', o: { robe: true, hood: true, staffTip: true, tipCol: '#7fd0ff', wpnLen: 18 }, r: 9 },
    });
    const keeper = this.add.sprite(setX * T - 2 * T, (setY + 5) * T, 'fr-elf', 0).setDepth((setY + 5) * T);
    this.interactables.push({ x: keeper.x, y: keeper.y, label: 'speak with the grove keeper', fn: () => this.keeperDialog() });

    // ---------- ley-line node (B5 quest landmark) ----------
    const nodeX = 12 * T, nodeY = 14 * T;
    const nodeC = this.add.circle(nodeX, nodeY, 26, 0x3df0c8, 0.18).setDepth(nodeY).setBlendMode(Phaser.BlendModes.ADD);
    this.add.circle(nodeX, nodeY, 8, 0x3df0c8, 0.7).setDepth(nodeY).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: nodeC, scale: 1.35, alpha: 0.06, duration: 1800, yoyo: true, repeat: -1 });
    this.addLight(nodeX, nodeY, 120, false);
    this.interactables.push({ x: nodeX, y: nodeY, label: 'touch the ley-line node', fn: () =>
      this.signDialog('LEY-LINE NODE', 'The current here runs WRONG — pulled thin, like a vein tapped upstream. The wood-elves feel it too. Something is drinking from the line.' +
        (window.GameState.world.flags['q-mq2-listening-room'] === 'active' ? ' The grove keeper watches you read the water. "So. You see it too."' : '')) });

    // ---------- the dungeon mouth (SE) ----------
    const dgX = 62 * T, dgY = 42 * T;
    const dg = this.add.graphics().setDepth(dgY);
    dg.fillStyle(0x0a0c0a); dg.fillEllipse(dgX, dgY, 84, 56);
    dg.fillStyle(0x000000); dg.fillEllipse(dgX, dgY + 4, 56, 36);
    dg.lineStyle(4, 0x1d2a1d); dg.strokeEllipse(dgX, dgY, 84, 56);
    this.addLight(dgX, dgY, 80, false);
    this.interactables.push({ x: dgX, y: dgY, label: 'descend into the root-hollow', fn: () => {
      window.GameState.world.zone = 'grove-dungeon'; this.scene.start('DungeonScene'); } });

    // ---------- monster packs ----------
    this.packs = [];
    const mkPack = (px, py, kind) => {
      const defs = {
        wolves: { tex: 'fr-wolf', n: 3 + Math.floor(Math.random() * 2), name: 'WOLVES OF THE EDGE', sub: 'the pack circles',
          spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'hound', x: 640 + Math.cos(i * 2.1) * 200, y: 300 + Math.sin(i * 2.1) * 120,
            hp: 66, maxhp: 66, spd: 200, r: 11, col: '#3a4a3c', dmgScale: 1 })), quest: 'g-wolves' },
        hounds: { tex: 'fr-hound', n: 3 + Math.floor(Math.random() * 2), name: 'FERAL PIT HOUNDS', sub: 'they remember the sand',
          spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'hound', x: 640 + Math.cos(i * 2.6) * 220, y: 320 + Math.sin(i * 2.6) * 130,
            hp: 80, maxhp: 80, spd: 210, r: 12, col: '#4a4038', dmgScale: 1.15 })), quest: 'g-hounds' },
        rotshaman: { tex: 'fr-shaman', n: 1, name: 'THE ROT SHAMAN', sub: 'the forest\'s dead answer it',
          spawn: () => [{ type: 'necro', x: 640, y: 260, hp: 180, maxhp: 180, spd: 100, r: 15, col: '#3c4434', dmgScale: 1.2 }], quest: 'g-rotshaman' },
        goblins: { tex: 'fr-goblin', n: 3 + Math.floor(Math.random() * 2), name: 'GOBLIN SKULKERS', sub: 'the tithe collectors of the underbrush',
          spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'skel', x: 640 + Math.cos(i * 2.2) * 210, y: 300 + Math.sin(i * 2.2) * 120,
            hp: 60, maxhp: 60, spd: 175, r: 10, col: '#4a6a3a', dmgScale: 1 })), quest: 'g-goblins' },
        vines: { tex: 'fr-vine', n: 2 + Math.floor(Math.random() * 2), name: 'STRANGLEVINES', sub: 'the shade walked off the road',
          spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'chain', x: 640 + Math.cos(i * 2.6) * 180, y: 310 + Math.sin(i * 2.6) * 110,
            hp: 130, maxhp: 130, spd: 60, r: 15, col: '#2c5a2c', dmgScale: 1.1 })), quest: 'g-vines' },
        insects: { tex: 'fr-insect', n: 3 + Math.floor(Math.random() * 2), name: 'THE CHITTERSWARM', sub: 'dog-sized and disagreeable',
          spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'hound', x: 640 + Math.cos(i * 1.9) * 220, y: 320 + Math.sin(i * 1.9) * 130,
            hp: 55, maxhp: 55, spd: 230, r: 9, col: '#6a5a2a', dmgScale: 0.95 })), quest: 'g-insects' },
        bandits: { tex: 'fr-bandit', n: 3, name: 'TOLL BANDITS', sub: 'the bridge was never theirs',
          spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'hook', x: 640 + Math.cos(i * 2.1) * 200, y: 300 + Math.sin(i * 2.1) * 115,
            hp: 90, maxhp: 90, spd: 150, r: 13, col: '#5a4a3a', dmgScale: 1.05 })), quest: 'g-bandits' },
        // --- 5 new forest monsters (Hiro) ---
        boar: { tex: 'fr-boar', n: 2, name: 'DIRE BOARS', sub: 'they were here before the road',
          spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'hound', x: 640 + Math.cos(i * 2.3) * 190, y: 310 + Math.sin(i * 2.3) * 110,
            hp: 110, maxhp: 110, spd: 175, r: 14, col: '#5a4030', dmgScale: 1.15 })) },
        treant: { tex: 'fr-treant', n: 1, name: 'AN ANGRY TREANT', sub: 'the grove walks when wronged',
          spawn: () => [{ type: 'door', x: 640, y: 280, r: 26, hp: 260, maxhp: 260, spd: 50, col: '#3a5a2c', wpn: '#2c4420', dmgScale: 1.2 }] },
        spider: { tex: 'fr-spider', n: 3, name: 'GIANT SPIDERS', sub: 'the webs you walked through were warnings',
          spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'hook', x: 640 + Math.cos(i * 2.0) * 200, y: 300 + Math.sin(i * 2.0) * 115,
            hp: 70, maxhp: 70, spd: 165, r: 12, col: '#2a2030', dmgScale: 1.05 })) },
        harpy: { tex: 'fr-harpy', n: 2, name: 'HARPIES', sub: 'they sing, then they dive',
          spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'gunner', x: 640 + Math.cos(i * 3) * 210, y: 290 + Math.sin(i * 3) * 120,
            hp: 80, maxhp: 80, spd: 150, r: 11, col: '#6a5a3a', dmgScale: 1.1 })) },
        wisp: { tex: 'fr-wisp', n: 2, name: 'WILL-O-WISPS', sub: 'follow the lights and you drown',
          spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'pyre', x: 640 + Math.cos(i * 2.6) * 190, y: 300 + Math.sin(i * 2.6) * 110,
            hp: 90, maxhp: 90, spd: 110, r: 11, col: '#3a7faf', dmgScale: 1.1 })) },
      };
      const d = defs[kind];
      const sprs = [];
      for (let i = 0; i < d.n; i++) {
        const s = this.add.sprite(px + (Math.random() - 0.5) * 70, py + (Math.random() - 0.5) * 70, d.tex, 0);
        s.setDepth(s.y); sprs.push(s);
      }
      this.packs.push({ x: px, y: py, kind, def: d, sprs, alive: true, wanderT: 0 });
    };
    const packSpots = { wolves: [[20, 26], [36, 10], [8, 44]], hounds: [[44, 34], [24, 40]], rotshaman: [[30, 22]],
      goblins: [[14, 18], [48, 26]], vines: [[40, 42], [6, 30]], insects: [[24, 8], [54, 40]], bandits: [[46, 18]],
      boar: [[16, 40]], treant: [[58, 16]], spider: [[10, 24]], harpy: [[50, 8]], wisp: [[30, 44]] };
    for (const [kind, spots] of Object.entries(packSpots))
      for (const [sx, sy] of spots) {
        const id = 'pack-' + kind + '-' + sx + '-' + sy;
        if (!GS.world.flags[id]) mkPack(sx * T, sy * T, kind);
        else continue;
        this.packs[this.packs.length - 1].id = id;
      }

    // ---------- chests ----------
    const propsTex = this.textures.get('cainos-props');
    if (!propsTex.has('chest')) propsTex.add('chest', 0, 96, 32, 64, 64);
    const groveChests = [
      { x: 9, y: 10, loot: { type: 'potion-con', label: 'CON Potion (+25%, 60s)' } },
      { x: 52, y: 44, loot: { type: 'artifact', id: 'coalheart', label: 'COALHEART — +10% max HP (permanent)' } },
    ];
    for (const c of groveChests) {
      const id = 'gchest-' + c.x + '-' + c.y;
      const img = this.add.image(c.x * T, c.y * T, 'cainos-props', 'chest').setOrigin(0.5, 1).setDepth(c.y * T).setScale(0.8);
      if (GS.world.chestsOpened.includes(id)) img.setTint(0x555555);
      this.interactables.push({ x: c.x * T, y: c.y * T, label: 'open the chest', fn: () => {
        if (GS.world.chestsOpened.includes(id)) { this.floatText(c.x * T, c.y * T - 40, 'empty', '#6b5d4f'); return; }
        GS.world.chestsOpened.push(id); img.setTint(0x555555);
        this.grantLoot(c.loot, c.x * T, c.y * T);
      }});
    }

    // ---------- the treaty stone: the spine trail east, up to Dragonspine ----------
    const tsX = 66 * T, tsY = 10 * T;
    const tsg = this.add.graphics().setDepth(tsY);
    tsg.fillStyle(0x2a2e3a); tsg.fillRect(tsX - 16, tsY - 40, 32, 48);   // the grey slab of law
    tsg.fillStyle(0x1c1f28); tsg.fillRect(tsX - 12, tsY - 36, 24, 40);
    const seraphHere = GS.player.char === 'seraph';
    if (seraphHere) { tsg.lineStyle(2, 0xffe9a8, 0.8); tsg.strokeRect(tsX - 12, tsY - 36, 24, 40); }
    this.addLight(tsX, tsY, 80, false);
    this.solid(tsX - 16, tsY - 40, 32, 48);
    this.interactables.push({ x: tsX, y: tsY + 14, label: 'read the TREATY STONE', fn: () => {
      const TS = Quests.seraph.treatyStone;
      if (!seraphHere) { this.signDialog('THE TREATY STONE', TS.barred); return; }
      GS.world.flags['treaty-stone-read'] = true;
      this.signDialog('THE TREATY STONE', TS.opens);
    }});
    this.gateEast = { x: WPX - T * 2, y: 8 * T, w: T * 2, h: 4 * T };

    // ---------- main quest: cult camp / Shen Sama / caravan ----------
    this.buildConspiracy(T);

    // ---------- player + travel ----------
    const spawn = GS.world.groveFromCity !== false ? { x: 34 * T, y: (MH - 4) * T } : { x: 34 * T, y: (MH - 4) * T };
    GS.world.groveFromCity = false;
    this.spawnPlayer(spawn.x, spawn.y);
    this.gateSouth = { x: 31 * T, y: HPX - T * 1.5, w: 6 * T, h: T * 1.5 };
    this.placeCompanions('grove');
    this.initEncounterHost(GROVE_THEME);
    this.cameras.main.setBounds(0, 0, WPX, HPX).startFollow(this.player, true, 0.12, 0.12);
    this.floatText(spawn.x, spawn.y - 60, 'THORN GROVE', '#7fbf6a', 18);
    this.introPan();
  }

  buildConspiracy(T) {
    const GS = window.GameState, flags = GS.world.flags, C = Quests.cult;

    // --- BEAT 3: the cult waystation, west past the node ---
    if (flags['q-mq2-listening-room'] === 'active' && !flags['q-mq3-roots-that-rot']) {
      const cx = 6 * T, cy = 19 * T;
      const g = this.add.graphics().setDepth(cy);
      for (const [tx, ty] of [[cx - 40, cy - 10], [cx + 44, cy + 6]]) {     // fast-fold tents
        g.fillStyle(0x241c2e); g.fillTriangle(tx - 26, ty + 18, tx + 26, ty + 18, tx, ty - 22);
        g.lineStyle(2, 0x120d16); g.strokeTriangle(tx - 26, ty + 18, tx + 26, ty + 18, tx, ty - 22);
      }
      g.fillStyle(0x1a1410); g.fillRect(cx - 14, cy + 24, 28, 22);          // crate with air-holes
      g.fillStyle(0x000000); for (let i = 0; i < 3; i++) g.fillRect(cx - 8 + i * 8, cy + 30, 3, 3);
      g.lineStyle(2, 0x3a3a40);                                             // the cage, bars bent
      for (let i = -20; i <= 20; i += 8) g.lineBetween(cx + 40 + i, cy - 40, cx + 40 + i + (i === 4 ? 6 : 0), cy - 6);
      this.addLight(cx, cy, 90, false);
      this.interactables.push({ x: cx, y: cy, label: 'search the camp', fn: () => {
        const strike = () => { CityUI.closeDialog();
            this.startEncounter('THE WAYSTATION WAKES', 'they fold camps and people alike', [
              { type: 'hook', x: 540, y: 280, hp: 110, maxhp: 110, spd: 150, r: 14, col: '#4a3c5a', dmgScale: 1.2 },
              { type: 'hook', x: 740, y: 300, hp: 110, maxhp: 110, spd: 150, r: 14, col: '#4a3c5a', dmgScale: 1.2 },
              { type: 'grave', x: 640, y: 240, hp: 240, maxhp: 240, spd: 105, r: 16, col: '#3a3450', stance: 'open', stanceT: 1, dmgScale: 1.25 },
              { type: 'stitch', x: 640, y: 420, hp: 160, maxhp: 160, spd: 125, r: 13, col: '#5a4a66', dmgScale: 1.2 },
            ], win => {
              if (!win) { this.player.x = 34 * 32; this.player.y = 46 * 32;
                this.floatText(this.player.x, this.player.y - 50, 'the camp stands. you, barely.', '#c8443a'); return; }
              flags['q-mq2-listening-room'] = 'done';
              flags['q-mq3-roots-that-rot'] = 'active';
              this.interactables = this.interactables.filter(it => !(it.x === cx && it.y === cy));
              CityUI.dialog(C.captive.name, C.captive.freed, [{ label: Quests.opt('captiveGo')[0], fn: () => {
                CityUI.closeDialog();
                this.floatText(this.player.x, this.player.y - 50, 'JOURNAL UPDATED — ROOTS THAT ROT', '#3df0c8', 14);
                this.spawnShenSama();
              }}]);
            }); };
        CityUI.dialog('THE WAYSTATION', C.campSign, [
          ...Quests.opt('campStrike').map(label => ({ label, fn: strike })),
          { label: 'Not yet', fn: () => CityUI.closeDialog() }]);
      }});
    }

    // --- BEAT 5 stage: the night shipment, west edge (after the buyer) ---
    if (flags['q-mq4-the-buyer'] === 'active' && !flags['q-mq5-ash-and-silence']) {
      const wx = 4 * T, wy = 27 * T;
      const g = this.add.graphics().setDepth(wy);
      g.fillStyle(0x241a12); g.fillRect(wx - 30, wy - 18, 60, 36);          // the wagon
      g.fillStyle(0x14100a); g.fillCircle(wx - 20, wy + 20, 9); g.fillCircle(wx + 20, wy + 20, 9);
      g.lineStyle(2, 0x3a3a40); for (let i = -18; i <= 18; i += 7) g.lineBetween(wx + i, wy - 18, wx + i, wy + 8);
      this.addLight(wx, wy, 80, false);
      this.interactables.push({ x: wx, y: wy, label: 'stop the night shipment', fn: () => {
        const breakWheel = () => { CityUI.closeDialog();
            this.startEncounter('ASH AND SILENCE', 'free what breathes in the crates', [
              { type: 'door', x: 640, y: 250, r: 26, hp: 320, maxhp: 320, spd: 52, col: '#3a3450', wpn: '#2a2438', dmgScale: 1.3 },
              { type: 'hook', x: 520, y: 320, hp: 120, maxhp: 120, spd: 150, r: 14, col: '#4a3c5a', dmgScale: 1.25 },
              { type: 'hook', x: 760, y: 320, hp: 120, maxhp: 120, spd: 150, r: 14, col: '#4a3c5a', dmgScale: 1.25 },
              { type: 'grave', x: 560, y: 220, hp: 260, maxhp: 260, spd: 105, r: 16, col: '#3a3450', stance: 'open', stanceT: 1, dmgScale: 1.3 },
              { type: 'stitch', x: 720, y: 220, hp: 180, maxhp: 180, spd: 125, r: 13, col: '#5a4a66', dmgScale: 1.25 },
            ], win => {
              if (!win) { this.player.x = 34 * 32; this.player.y = 46 * 32;
                this.floatText(this.player.x, this.player.y - 50, 'the shipment rolls on. tonight you lost.', '#c8443a'); return; }
              flags['q-mq4-the-buyer'] = 'done';
              flags['q-mq5-ash-and-silence'] = 'active';
              this.interactables = this.interactables.filter(it => !(it.x === wx && it.y === wy));
              this.signDialog('THE CRATES OPEN', 'Three captives, sedated, breathing. A juggler. A hedge-witch. A girl nobody reported missing. They wake on the forest floor free, terrified, and ALIVE — and they beg you, each one, not to speak their names to anyone. By the time you look back at the wagon, the cult\'s dead have already been dragged away by someone you never saw. JOURNAL UPDATED — the Dragon Emperor passes through Karridge. Go to the plaza.');
            }); };
        CityUI.dialog('THE NIGHT SHIPMENT', C.caravanSign, [
          ...Quests.opt('caravanBreak').map(label => ({ label, fn: breakWheel })),
          { label: 'Wait', fn: () => CityUI.closeDialog() }]);
      }});
    }
  }

  spawnShenSama() {
    const flags = window.GameState.world.flags;
    if (flags['shen-sama-met']) return;
    const sx = 14 * 32, sy = 13 * 32; // by the node
    const spr = this.add.sprite(sx, sy, 'fr-npc1', 0).setDepth(sy).setTint(0x9a8060);
    this.addLight(sx, sy, 70, false);
    this.interactables.push({ x: sx, y: sy, label: 'approach the hooded stranger', fn: () => {
      const C = Quests.cult;
      const shenText = C.shenSama.text + (window.GameState.player.char === 'druid' ? Quests.druid.shenSamaAdd : '');
      CityUI.dialog(C.shenSama.name, shenText, [{ label: Quests.opt('shenGo')[0], fn: () => {
        CityUI.closeDialog(); flags['shen-sama-met'] = true;
        this.tweens.add({ targets: spr, alpha: 0, duration: 900, onComplete: () => spr.destroy() });
        this.interactables = this.interactables.filter(it => it.x !== sx || it.y !== sy);
        this.floatText(sx, sy - 40, 'gone between one breath and the next', '#9a8f80', 12);
      }}]);
    }});
    this.floatText(sx, sy - 44, 'someone watches from the treeline', '#9a8f80', 12);
  }

  grantLoot(loot, x, y) {
    const P = window.GameState.player;
    if (loot.type === 'copper') { P.copper += loot.amount; CityUI.setPurse(P.copper);
      this.floatText(x, y - 40, '+' + Money.fmt(loot.amount), '#e7b450'); }
    else if (loot.type === 'artifact') { P.artifacts.push(loot.id);
      this.floatText(x, y - 40, loot.label, '#3df0c8', 15); }
    else if (P.belt.length < 8) { P.belt.push(loot); CityUI.belt(P.belt);
      this.floatText(x, y - 40, loot.label, '#7fbf6a'); }
    else this.floatText(x, y - 40, 'belt is full', '#c8443a');
  }

  keeperDialog() {
    const flags = window.GameState.world.flags;
    const base = 'A wood elf with bark-braided hair sizes you up. "The pit-crowned. Word outruns you." ';
    const text = flags['q-mq2-listening-room'] === 'active'
      ? base + '"The line runs thin and the dead walk our edge. There is a camp by no road, west past the node — men who are not woodsmen, crates that are not goods. The Eldest will not act beyond Deepwood\'s shade. You might." (The trail sharpens in the next stretch of the hunt — Bucket 5.)'
      : base + '"Wolves grow bold and something fouls the dead. The guild posts coin for both. Earn the grove\'s trust, champion."';
    this.signDialog('GROVE KEEPER', text);
  }

  update(time, dtMs) {
    const dt = Math.min(0.05, dtMs / 1000);
    if (this.updateEncounter(time)) return;
    this.updatePlayer(dt);
    this.updateFollower(dt);
    this.updatePrompt();
    this.updateAtmosphere(time, dt);

    // pack wander + aggro
    for (const pk of this.packs) {
      if (!pk.alive) continue;
      pk.wanderT -= dt;
      for (const s of pk.sprs) {
        if (pk.wanderT <= 0) { s.tx = pk.x + (Math.random() - 0.5) * 110; s.ty = pk.y + (Math.random() - 0.5) * 110; }
        if (s.tx !== undefined) {
          const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
          if (d > 4) { const f = Math.atan2(dy, dx);
            s.x += Math.cos(f) * 40 * dt; s.y += Math.sin(f) * 40 * dt;
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
            if (pk.id) window.GameState.world.flags[pk.id] = 'cleared';
            const counts = window.GameState.world.questCounts;
            let logged = '';
            if (pk.def.quest) { counts[pk.def.quest] = (counts[pk.def.quest] || 0) + pk.def.n; logged = ' (' + counts[pk.def.quest] + ' logged)'; }
            this.floatText(this.player.x, this.player.y - 50, pk.def.name + ' — cleared' + logged, '#7fbf6a');
            if (Math.random() < 0.5) this.grantLoot({ type: 'potion-health', label: 'Health Potion' }, this.player.x + 30, this.player.y);
          } else {
            pk.alive = true; // the pack holds its ground; the forest spat you out
            this.player.x = 34 * 32; this.player.y = (50 - 4) * 32;
            this.floatText(this.player.x, this.player.y - 50, 'dragged back to the treeline, breathing', '#c8443a');
          }
        }, { zoneScale: true });
      }
    }

    // DRUID-ONLY: the cult comes for HER — capture team on the south path after the camp falls
    const GS2 = window.GameState;
    if (GS2.player.char === 'druid' && GS2.world.flags['q-mq3-roots-that-rot'] && !GS2.world.flags['druid-capture'] && !this.druidAmbushDone &&
        Math.hypot(this.player.x - 20 * 32, this.player.y - 38 * 32) < 120) {
      this.druidAmbushDone = true;
      const D = Quests.druid;
      this.startEncounter(D.captureBanner[0], D.captureBanner[1], [
        { type: 'hook', x: 540, y: 280, hp: 130, maxhp: 130, spd: 155, r: 14, col: '#4a3c5a', dmgScale: 1.25 },
        { type: 'hook', x: 740, y: 300, hp: 130, maxhp: 130, spd: 155, r: 14, col: '#4a3c5a', dmgScale: 1.25 },
        { type: 'grave', x: 640, y: 230, hp: 280, maxhp: 280, spd: 105, r: 16, col: '#3a3450', stance: 'open', stanceT: 1, dmgScale: 1.3 },
        { type: 'stitch', x: 640, y: 430, hp: 190, maxhp: 190, spd: 125, r: 13, col: '#5a4a66', dmgScale: 1.25 },
      ], win => {
        if (!win) { this.player.x = 34 * 32; this.player.y = 46 * 32;
          this.floatText(this.player.x, this.player.y - 50, 'you wake by the treeline. unchained. this time.', '#c8443a'); return; }
        GS2.world.flags['druid-capture'] = 'repelled';
        CityUI.dialog('THE CAPTURE TEAM', D.captureSign, [{ label: 'Burn the cart', fn: () => {
          CityUI.dialog('VERDANCE', D.captureAfter, [{ label: 'They tasted your name', fn: () => CityUI.closeDialog() }]);
        }}]);
      });
    }

    // east gate → the spine trail (the treaty stone reads what you are)
    if (this.player.x > this.gateEast.x + 24 &&
        this.player.y > this.gateEast.y - 8 && this.player.y < this.gateEast.y + this.gateEast.h + 8) {
      if (GS2.player.char === 'seraph') { this.scene.start('MountainScene'); return; }
      this.player.x = this.gateEast.x - 20; // the wards push the unworthy back, politely
      this.floatText(this.player.x, this.player.y - 50, 'the treaty stone bars the way', '#8a93a8', 12);
    }

    // south gate → city
    if (this.player.y > this.gateSouth.y - 10 &&
        this.player.x > this.gateSouth.x - 8 && this.player.x < this.gateSouth.x + this.gateSouth.w + 8) {
      window.GameState.world.cityFromGrove = true;
      this.scene.start('CityScene');
    }
  }
}
