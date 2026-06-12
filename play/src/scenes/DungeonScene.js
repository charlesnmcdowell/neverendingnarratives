// DungeonScene — the Root-Hollow: a cramped cave under Thorn Grove.
// Two encounters and the Ley-Shard artifact chest. Dark, drips, bones.

class DungeonScene extends WorldScene {
  constructor() { super({ key: 'DungeonScene' }); }

  preload() {
    for (const [key, uri] of Object.entries(window.EMBEDDED_ASSETS))
      if (!this.textures.exists(key)) this.load.image(key, uri);
  }

  create() {
    const T = 32, MW = 40, MH = 30, WPX = MW * T, HPX = MH * T;
    this.worldW = WPX; this.worldH = HPX;
    this.worldInit();
    const GS = window.GameState;
    GS.world.zone = 'grove-dungeon';

    // stone floor, heavy dark
    const map = this.make.tilemap({ width: MW, height: MH, tileWidth: T, tileHeight: T });
    const tiles = map.addTilesetImage('cainos-stone', undefined, T, T, 0, 0);
    const ground = map.createBlankLayer('ground', tiles).setDepth(0);
    const blocks = [0, 2, 4, 6];
    for (let ty = 0; ty < MH; ty += 2) for (let tx = 0; tx < MW; tx += 2) {
      const b = blocks[Math.floor(Math.random() * blocks.length)];
      ground.putTileAt(b, tx, ty); ground.putTileAt(b + 1, tx + 1, ty);
      ground.putTileAt(b + 8, tx, ty + 1); ground.putTileAt(b + 9, tx + 1, ty + 1);
    }
    ground.forEachTile(t => { t.tint = 0x4a4248; });

    // cave walls: winding chambers (rect mask of walkable areas)
    const wallG = this.add.graphics().setDepth(3);
    const caveWall = (x, y, w, h) => {
      this.solid(x, y, w, h);
      for (let i = 0; i < (w * h) / 600; i++) {
        wallG.fillStyle(0x110d10, 1);
        wallG.fillCircle(x + Math.random() * w, y + Math.random() * h, 18 + Math.random() * 14);
      }
    };
    caveWall(0, 0, WPX, T * 2); caveWall(0, HPX - T * 2, WPX, T * 2);
    caveWall(0, 0, T * 2, HPX); caveWall(WPX - T * 2, 0, T * 2, HPX);
    caveWall(10 * T, 6 * T, 6 * T, 10 * T);   // pillars dividing chambers
    caveWall(24 * T, 12 * T, 7 * T, 9 * T);
    caveWall(16 * T, 22 * T, 10 * T, 4 * T);

    this.makeAtmosphere({ darkness: 0.9, darkCol: 0x020204, emberCol: '#7fd0ff' });
    // sparse cold lights (glow-worms)
    for (const [lx, ly] of [[6, 5], [20, 8], [33, 6], [7, 24], [34, 24], [20, 16]]) {
      this.add.circle(lx * T, ly * T, 3, 0x7fd0ff, 0.9).setDepth(ly * T).setBlendMode(Phaser.BlendModes.ADD);
      this.addLight(lx * T, ly * T, 95, false);
    }
    // bones
    const boneG = this.add.graphics().setDepth(1);
    boneG.fillStyle(0x9a9284, 0.5);
    for (let i = 0; i < 24; i++) boneG.fillRect(Math.random() * WPX, Math.random() * HPX, 8, 3);

    this.bakeFrames();
    this.spawnPlayer(5 * T, 4 * T);
    if (window.GameState.world.activeFollower) this.spawnFollower(window.GameState.world.activeFollower);
    this.initEncounterHost(GROVE_THEME);
    this.cameras.main.setBounds(0, 0, WPX, HPX).startFollow(this.player, true, 0.12, 0.12);
    this.floatText(5 * T, 4 * T - 50, 'THE ROOT-HOLLOW', '#7fd0ff', 16);

    // encounters as ambush trigger zones
    this.ambushes = [];
    const mk = (x, y, id, name, sub, pack) => {
      if (GS.world.flags[id]) return;
      this.ambushes.push({ x: x * T, y: y * T, id, name, sub, pack, done: false });
    };
    mk(20, 12, 'dg-amb1', 'THE HOLLOW STIRS', 'risen things in the dark',
      [{ type: 'skel', x: 540, y: 280, hp: 60, maxhp: 60, spd: 125, r: 11, col: '#b8b0a0', dmgScale: 1 },
       { type: 'skel', x: 740, y: 300, hp: 60, maxhp: 60, spd: 125, r: 11, col: '#b8b0a0', dmgScale: 1 },
       { type: 'skel', x: 640, y: 230, hp: 60, maxhp: 60, spd: 125, r: 11, col: '#b8b0a0', dmgScale: 1 },
       { type: 'hound', x: 640, y: 420, hp: 70, maxhp: 70, spd: 200, r: 11, col: '#2a3a30', dmgScale: 1 }]);
    mk(32, 22, 'dg-amb2', 'THE HOLLOW\'S KEEPER', 'it was buried here for a reason',
      [{ type: 'brute', x: 640, y: 260, hp: 220, maxhp: 220, spd: 72, r: 21, col: '#3a4a44', dmgScale: 1.3 },
       { type: 'skel', x: 520, y: 340, hp: 60, maxhp: 60, spd: 125, r: 11, col: '#b8b0a0', dmgScale: 1 },
       { type: 'skel', x: 760, y: 340, hp: 60, maxhp: 60, spd: 125, r: 11, col: '#b8b0a0', dmgScale: 1 }]);

    // the artifact chest — guarded by the keeper ambush
    const propsTex = this.textures.get('cainos-props');
    if (!propsTex.has('chest')) propsTex.add('chest', 0, 96, 32, 64, 64);
    const cid = 'dgchest-leyshard';
    const chest = this.add.image(35 * T, 25 * T, 'cainos-props', 'chest').setOrigin(0.5, 1).setDepth(25 * T).setScale(0.9);
    if (GS.world.chestsOpened.includes(cid)) chest.setTint(0x555555);
    this.interactables.push({ x: 35 * T, y: 25 * T, label: 'open the rooted chest', fn: () => {
      if (GS.world.chestsOpened.includes(cid)) { this.floatText(35 * T, 25 * T - 40, 'empty', '#6b5d4f'); return; }
      if (!GS.world.flags['dg-amb2']) { this.floatText(35 * T, 25 * T - 40, 'something watches. deal with it first.', '#c8443a'); return; }
      GS.world.chestsOpened.push(cid); chest.setTint(0x555555);
      GS.player.artifacts.push('ley-shard');
      this.floatText(35 * T, 25 * T - 50, 'LEY-SHARD — abilities +10% damage (permanent)', '#3df0c8', 15);
    }});

    // exit
    this.interactables.push({ x: 5 * T, y: 3 * T, label: 'climb back to the grove', fn: () => {
      window.GameState.world.zone = 'thorn-grove'; this.scene.start('GroveScene'); } });
  }

  update(time, dtMs) {
    const dt = Math.min(0.05, dtMs / 1000);
    if (this.updateEncounter(time)) return;
    this.updatePlayer(dt);
    this.updateFollower(dt);
    this.updatePrompt();
    this.updateAtmosphere(time, dt);

    for (const a of this.ambushes) {
      if (a.done || window.GameState.world.flags[a.id]) continue;
      if (Math.hypot(a.x - this.player.x, a.y - this.player.y) < 110) {
        a.done = true;
        this.startEncounter(a.name, a.sub, a.pack, win => {
          if (win) window.GameState.world.flags[a.id] = 'cleared';
          else { a.done = false; this.player.x = 5 * 32; this.player.y = 4 * 32;
            this.floatText(this.player.x, this.player.y - 40, 'you crawl back to the light', '#c8443a'); }
        });
      }
    }
  }
}
