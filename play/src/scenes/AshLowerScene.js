// AshLowerScene — the ASHENVEIL ACADEMY LOWER LEVELS (item 13, raid zone shell).
// "the lower levels are NOT a metaphor." Beneath the dark academy: a stone undercroft
// of cold cells, ledger-vaults and a sealed deep door the web keeps for its worst work.
// SHELL ONLY (increment 1): reachable from AshenveilScene's stairs, atmosphere + a
// "you descend" beat + flavor signs, NO encounters yet (packs/mini-boss/boss land in
// following increments). Reuses the WorldScene base + the undead HP tier.
class AshLowerScene extends WorldScene {
  constructor() { super({ key: 'AshLowerScene' }); }

  preload() {
    for (const [key, uri] of Object.entries(window.EMBEDDED_ASSETS))
      if (!this.textures.exists(key)) this.load.image(key, uri);
  }

  create() {
    const T = 32, MW = 40, MH = 28, WPX = MW * T, HPX = MH * T;
    this.worldW = WPX; this.worldH = HPX;
    this.worldInit();
    const GS = window.GameState, flags = GS.world.flags;
    GS.world.zone = 'ash-lower';

    // ---------- ground: a cold flagstone undercroft ----------
    const floor = this.add.graphics().setDepth(0);
    floor.fillStyle(0x14121a, 1); floor.fillRect(0, 0, WPX, HPX);
    floor.lineStyle(1, 0x221e2a, 1);
    for (let x = 0; x <= MW; x++) floor.lineBetween(x * T, 0, x * T, HPX);
    for (let y = 0; y <= MH; y++) floor.lineBetween(0, y * T, WPX, y * T);
    // a few darker, water-stained flagstones
    floor.fillStyle(0x0e0c14, 0.7);
    for (let i = 0; i < 40; i++) {
      const fx = (1 + Math.random() * (MW - 2)) | 0, fy = (1 + Math.random() * (MH - 2)) | 0;
      floor.fillRect(fx * T + 2, fy * T + 2, T - 4, T - 4);
    }

    // ---------- stone walls: a bordered chamber with cell stubs ----------
    const wallG = this.add.graphics().setDepth(3);
    const wall = (x, y, w, h) => {
      this.solid(x, y, w, h);
      wallG.fillStyle(0x2a2632, 1); wallG.fillRect(x, y, w, h);
      wallG.lineStyle(1, 0x3a3446, 0.8); wallG.strokeRect(x, y, w, h);
    };
    wall(0, 0, WPX, T);                      // north
    wall(0, HPX - T, WPX, T);                // south
    wall(0, 0, T, HPX);                      // west
    wall(WPX - T, 0, T, HPX);                // east
    // cell partitions down the west wall (cold cells — empty for now)
    for (const cy of [4, 9, 14, 19]) { wall(T, cy * T, 6 * T, T * 0.6); wall(7 * T, cy * T, T, 4 * T); }
    // a central ledger-vault block
    wall(22 * T, 11 * T, 6 * T, 5 * T);

    // cold green atmosphere — the academy's colour, carried underground
    this.makeAtmosphere({ darkness: 0.9, darkCol: 0x05040a, fogTint: 0x6a7a90, emberCol: '#9af0c0' });
    for (let i = 0; i < 12; i++) {           // grave-lanterns down the rows
      const lx = (3 + Math.random() * (MW - 6)) * T, ly = (3 + Math.random() * (MH - 6)) * T;
      if (this.collide(lx, ly, 12)) continue;
      this.add.circle(lx, ly, 2.5, 0x9af0c0, 0.8).setDepth(ly).setBlendMode(Phaser.BlendModes.ADD);
      this.addLight(lx, ly + 12, 55, false);
    }

    this.bakeFrames({});

    // ---------- flavor signs (text-only narration; unvoiced, like the surface signs) ----------
    this.interactables.push({ x: 4 * T, y: 5 * T, label: 'look into the cold cells', fn: () =>
      this.signDialog('THE COLD CELLS', 'A row of stone cells, swept clean and recently. No bars — the doors are slabs, and the slabs are open. Whatever the web keeps down here, it does not keep behind locks. On one threshold someone has chalked a tally and then, neatly, crossed every mark out.') });
    this.interactables.push({ x: 25 * T, y: 17 * T, label: 'read the ledger-vault plaque', fn: () =>
      this.signDialog('THE LEDGER-VAULT', 'A squat block of dressed stone, sealed with green wax over a hundred old seals. The plaque reads: ASHENVEIL ACQUISITIONS — DO NOT RENDER WITHOUT WRIT. Below, in a tidier hand: every name the academy ever bought, and the price it paid in quiet. The wax is unbroken. For now.') });

    // ---------- the DEEP DOOR — sealed until the warden falls, then the raid FINALE (item 13 inc 3) ----------
    const ddx = 20 * T, ddy = 2 * T;
    this.deepDoorX = ddx; this.deepDoorY = ddy;
    const dg = this.add.graphics().setDepth(ddy + 1);
    dg.fillStyle(0x1a1622, 1); dg.fillRect(ddx - 30, ddy - 6, 60, 44);
    dg.lineStyle(3, 0x9af0c0, 0.7); dg.strokeRect(ddx - 30, ddy - 6, 60, 44);
    dg.lineStyle(2, 0x9af0c0, 0.45); dg.lineBetween(ddx, ddy - 6, ddx, ddy + 38);
    this.deepDoorG = dg;
    this.addLight(ddx, ddy + 16, 90, false);
    this.deepDoorLabel = this.add.text(ddx, ddy - 20, 'THE DEEP DOOR', { fontFamily: 'Courier New', fontSize: '10px', color: '#9af0c0' }).setOrigin(0.5).setDepth(ddy + 2);
    if (flags['ash-lower-boss']) this.openDeepDoor(); // already cleared on a prior visit — keep it open
    this.interactables.push({ x: ddx, y: ddy + 38, label: 'the DEEP DOOR', fn: () => this.deepDoor() });

    // ---------- player + the stairs back up to Ashenveil ----------
    this.spawnPlayer(20 * T, (MH - 3) * T);
    this.territoryHpMult = 4; // undead tier (Hiro HP ladder) — for the encounters to come
    const sg = this.add.graphics().setDepth((MH - 3) * T);
    sg.fillStyle(0x0c0a12, 1); sg.fillRect(20 * T - 30, (MH - 2.4) * T - 14, 60, 28);
    sg.lineStyle(1, 0x9af0c0, 0.6); sg.strokeRect(20 * T - 30, (MH - 2.4) * T - 14, 60, 28);
    for (let i = 0; i < 4; i++) { sg.lineStyle(1, 0x9af0c0, 0.4); sg.lineBetween(20 * T - 26 + i * 13, (MH - 2.4) * T - 10, 20 * T - 26 + i * 13, (MH - 2.4) * T + 8); }
    this.add.text(20 * T, (MH - 2.4) * T - 22, 'STAIRS UP', { fontFamily: 'Courier New', fontSize: '9px', color: '#9af0c0' }).setOrigin(0.5).setDepth((MH - 2.4) * T + 2);
    this.interactables.push({ x: 20 * T, y: (MH - 2.4) * T, label: 'climb the stairs back to the Ashenveil', fn: () => {
      GS.world.zone = 'ashenveil';
      this.scene.start('AshenveilScene');
    }});

    // ---------- feral packs: what slipped the cells (item 13 increment 1) ----------
    // The undercroft restocks every descent — the web never runs short of the unfiled.
    // Reuses undead AI types + textures; HP scales by territoryHpMult (undead tier 4) via zoneScale.
    this.packs = [];
    const mkPack = (px, py, def) => {
      const sprs = [];
      for (let i = 0; i < def.n; i++) {
        const s = this.add.sprite(px + (Math.random() - 0.5) * 64, py + (Math.random() - 0.5) * 64, def.tex, 0);
        s.setDepth(s.y); sprs.push(s);
      }
      this.packs.push({ x: px, y: py, def, sprs, alive: true, wanderT: 0 });
    };
    const L_DEFS = {
      ghouls: { tex: 'fr-ghoul', n: 3, name: 'CELL GHOULS', sub: 'the slabs were open; so are their mouths', quest: 'g-ashlower',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'hound', x: 640 + Math.cos(i * 2.4) * 200, y: 320 + Math.sin(i * 2.4) * 110,
          hp: 230, maxhp: 230, spd: 205, r: 12, col: '#6a6a4a', dmgScale: 1.4 })) },
      wraiths: { tex: 'fr-wraith', n: 3, name: 'VAULT WRAITHS', sub: 'the cold the ledger keeps', quest: 'g-ashlower',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'hook', x: 640 + Math.cos(i * 2.0) * 200, y: 300 + Math.sin(i * 2.0) * 115,
          hp: 240, maxhp: 240, spd: 175, r: 12, col: '#2a2c3a', dmgScale: 1.4 })) },
      wights: { tex: 'fr-gravewight', n: 2, name: 'UNFILED WIGHTS', sub: 'names the vault never balanced', quest: 'g-ashlower',
        spawn: n => Array.from({ length: n }, (_, i) => ({ type: 'grave', x: 640 + Math.cos(i * 3.1) * 180, y: 300 + Math.sin(i * 3.1) * 110,
          hp: 320, maxhp: 320, spd: 130, r: 14, col: '#4a4452', stance: 'open', stanceT: 1, dmgScale: 1.45 })) },
      // --- MINI-BOSS: the jailer of the cells (item 13 increment 2). Reuses the 'door' AI = a
      // frontal-block guard (heavy strike OR a flank breaks the shield) - KILLABLE, with NO totem
      // dependency (the 'warden' AI is immune until its totems break, so we deliberately use 'door'
      // here instead). boss:false keeps it on the x4 undead tier (a MINI-boss - smaller than the x5
      // deep-door finale still to come). One enemy, a pre-fight beat, and a better-than-potion reward.
      warden: { tex: 'fr-bonegolem', n: 1, name: 'THE WARDEN OF THE UNFILED', sub: 'break its guard - flank it or strike HEAVY', mini: true, quest: 'g-ashlower',
        pre: 'A slab-shouldered thing unfolds from the dark between two cells, taller than the doorways it keeps. Where a face should be there is a ledger-plate, and every name on it is struck through but one. It lifts a key the size of a thighbone, turns it in the empty air, and the air locks. "UNFILED," it says, in a voice like a drawer sliding shut. "I will see you ENTERED." It sets its shield and waits for you to become a number.',
        preBtn: '(get under its guard)',
        spawn: () => [{ type: 'door', deathCol: '#9af0c0', x: 640, y: 270, r: 26, hp: 480, maxhp: 480, spd: 60, col: '#cfc6b4', wpn: '#9af0c0', dmgScale: 1.5 }] },
    };
    for (const [kind, spots] of Object.entries({ ghouls: [[14, 8], [32, 20]], wraiths: [[30, 9], [12, 22]], wights: [[16, 18]], warden: [[22, 8]] }))
      for (const [sx, sy] of spots) mkPack(sx * T, sy * T, L_DEFS[kind]);

    this.initEncounterHost(null);
    this.cameras.main.setBounds(0, 0, WPX, HPX).startFollow(this.player, true, 0.12, 0.12);
    this.floatText(this.player.x, this.player.y - 60, 'THE LOWER LEVELS', '#9af0c0', 18);
    this.introPan();
    if (!flags['ash-lower-arrived']) { flags['ash-lower-arrived'] = true;
      this.floatText(this.player.x, this.player.y - 44, 'JOURNAL — THE LOWER LEVELS', '#9af0c0', 13);
      this.signDialog('YOU DESCEND', 'The stair turns twice and the green light follows you down, pooling on stone that has never seen a sun. The air goes still and cold and faintly sweet, the way a ledger smells the moment before it is balanced. Empty cells. A sealed vault. A door at the far end that keeps itself warm. The boundary stone did not lie: the lower levels are not a metaphor. They are simply lower — and they are waiting.'); }
  }

  // The undercroft mini-boss: a short pre-fight beat (auto-advances under AUTO:FULL, so it can
  // never hard-block per the FAILSAFE PRINCIPLE) -> a guarded 'door' duel. On win: log the clear,
  // and on the FIRST clear only, drop the DUELIST'S KNOT artifact (a real, otherwise-unsourced
  // +20% parry/dodge relic). On loss: revive it and bounce the player to the stair - no hard-block.
  miniBossFight(pk) {
    const def = pk.def, flags = window.GameState.world.flags;
    CityUI.dialog(def.name, def.pre, [{ label: def.preBtn || '(fight)', fn: () => {
      CityUI.closeDialog();
      this.startEncounter(def.name, def.sub, def.spawn(def.n), win => {
        if (win) {
          for (const s of pk.sprs) s.destroy();
          const counts = window.GameState.world.questCounts;
          if (def.quest) counts[def.quest] = (counts[def.quest] || 0) + def.n;
          this.floatText(this.player.x, this.player.y - 50, def.name + ' — guard broken, name struck out', '#9af0c0', 14);
          if (!flags['ash-lower-miniboss']) {
            flags['ash-lower-miniboss'] = true;
            GroveScene.prototype.grantLoot.call(this, { type: 'artifact', id: 'duelists-knot', label: "DUELIST'S KNOT — +20% parry & dodge (permanent)" }, this.player.x + 30, this.player.y);
            if (typeof SaveSystem !== 'undefined' && SaveSystem.save) SaveSystem.save();
          }
        } else {
          pk.alive = true;
          this.player.x = 20 * 32; this.player.y = (28 - 3) * 32;
          this.floatText(this.player.x, this.player.y - 50, 'the warden files you under "later." the stair waits.', '#c8443a');
        }
      }, { zoneScale: true });
    }}]);
  }

  // The DEEP DOOR dispatcher. Sealed until the warden's name is struck (ash-lower-miniboss); once the
  // warden falls it opens into the raid FINALE; after the finale is won it stays open (flavor aftermath).
  // NEVER hard-blocks: every branch is a dialog/encounter that auto-advances under AUTO:FULL.
  deepDoor() {
    const flags = window.GameState.world.flags;
    if (flags['ash-lower-boss']) {
      this.signDialog('THE DEEP DOOR — OPEN', 'The slab stands open on a small, swept, empty room. Whatever the academy saved for last is unmade; the warmth has gone out of the stone. On the back wall a single name is freshly chalked — yours — and then, below it, struck cleanly through. You filed the filer. The web will have to start a new book.');
      return;
    }
    if (!flags['ash-lower-miniboss']) {
      this.signDialog('THE DEEP DOOR', 'A black slab taller than two men, ringed in academy-green light, with no handle and no hinge you can find. It is warm. Something on the far side keeps it warm. It does not open for you — not while the warden of the unfiled still keeps its key. A line is scratched at eye height: "the web saves its worst work for the last room." You make a note to come back when the jailer is down.');
      return;
    }
    this.deepDoorFight();
  }

  // The raid FINALE: a pre-fight beat (auto-advances under AUTO:FULL, so it can never hard-block per the
  // FAILSAFE PRINCIPLE) -> a boss:true encounter (x5 HP via the e.boss path in startEncounter). On win:
  // set ash-lower-boss, open the door, grant a finale copper purse + a victory beat. On loss: bounce the
  // player to the stair spawn (no hard-block). Reuses the 'necro' boss AI + the boss/deathCol pattern.
  deepDoorFight() {
    const flags = window.GameState.world.flags;
    const boss = { type: 'necro', boss: true, deathCol: '#9af0c0', x: 640, y: 262, r: 22, hp: 760, maxhp: 760, spd: 80, col: '#cfc6b4', wpn: '#9af0c0', stance: 'open', stanceT: 1, dmgScale: 1.4 };
    CityUI.dialog('THE THING THE WEB SAVES', 'With the warden down its key turns by itself, and the deep door swings in on the last room. It is not large. It does not need to be. A shape rises from a chair of filed bones, robed in struck-out names, and the warmth of the stone is its breath. "I am what the academy could not enter and could not let go," it says, almost kindly. "Every ledger ends in a last line. Come — be mine." The green light gutters. The room has been waiting for exactly one more name.', [{ label: '(write your own last line)', fn: () => {
      CityUI.closeDialog();
      this.startEncounter('THE THING THE WEB SAVES', 'the academy\'s worst work, kept for last', [boss], win => {
        if (win) {
          flags['ash-lower-boss'] = true;
          flags['q-ash-raid'] = 'done';   // close the optional lower-levels objective (item 13 gate)
          this.openDeepDoor();
          this.floatText(this.player.x, this.player.y - 50, 'THE LAST ROOM — unmade', '#9af0c0', 16);
          this.floatText(this.player.x, this.player.y - 74, 'JOURNAL — the lower levels are filed', '#9af0c0', 13);
          GroveScene.prototype.grantLoot.call(this, { type: 'copper', amount: 600 }, this.player.x + 30, this.player.y);
          if (typeof SaveSystem !== 'undefined' && SaveSystem.save) SaveSystem.save();
          this.signDialog('THE LAST ROOM', 'The shape comes apart along its seams and the names it wore scatter and go quiet, each one finally, simply, dead. The room behind the deep door is just a room now — cold, and ordinary. You step back into a green light that has lost its appetite. The lower levels are filed. The web will keep no more of its worst work here.');
        } else {
          this.player.x = 20 * 32; this.player.y = (28 - 3) * 32;
          this.floatText(this.player.x, this.player.y - 50, 'the last room is not done with you. the stair waits.', '#c8443a');
        }
      }, { zoneScale: true });
    }}]);
  }

  // Reskin the deep door as OPEN — called on the finale win and on re-entry once ash-lower-boss is set.
  openDeepDoor() {
    const ddx = this.deepDoorX, ddy = this.deepDoorY;
    if (this.deepDoorG) { const dg = this.deepDoorG;
      dg.clear();
      dg.fillStyle(0x05040a, 1); dg.fillRect(ddx - 30, ddy - 6, 60, 44);     // an open black doorway
      dg.lineStyle(3, 0x4a4452, 0.85); dg.strokeRect(ddx - 30, ddy - 6, 60, 44);
    }
    if (this.deepDoorLabel) this.deepDoorLabel.setText('THE DEEP DOOR — OPEN');
  }

  update(time, dtMs) {
    const dt = Math.min(0.05, dtMs / 1000);
    if (this.updateEncounter(time)) return;
    this.updatePlayer(dt);
    this.updateFollower(dt);
    this.updateNPCs(dt);
    this.updatePrompt();
    this.updateAtmosphere(time, dt);

    // feral packs wander + aggro — fully gated by the 1.5 no-fights-during-conversations rule
    const talking = CityUI.dialogOpen() || this.encounterActive || this.cinematic;
    for (const pk of this.packs) {
      if (!pk.alive) continue;
      pk.wanderT -= dt;
      if (talking) continue; // no wander/aggro while a dialog or cinematic is open
      for (const s of pk.sprs) {
        if (pk.wanderT <= 0) { s.tx = pk.x + (Math.random() - 0.5) * 100; s.ty = pk.y + (Math.random() - 0.5) * 100; }
        if (s.tx !== undefined) {
          const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
          if (d > 4) { const f = Math.atan2(dy, dx);
            s.x += Math.cos(f) * 32 * dt; s.y += Math.sin(f) * 32 * dt;
            s.setFrame(this.frameFor(f, time * 0.004, true)); s.setDepth(s.y); }
        }
      }
      if (pk.wanderT <= 0) pk.wanderT = 2 + Math.random() * 3;
      const d = Math.hypot(pk.sprs[0].x - this.player.x, pk.sprs[0].y - this.player.y);
      if (d < 130 && !CityUI.dialogOpen() && !this.encounterActive && !this.cinematic) {
        pk.alive = false;
        if (pk.def.mini) { this.miniBossFight(pk); continue; } // pre-fight beat -> guarded duel
        this.startEncounter(pk.def.name, pk.def.sub, pk.def.spawn(pk.def.n), win => {
          if (win) {
            for (const s of pk.sprs) s.destroy();
            const counts = window.GameState.world.questCounts;
            let logged = '';
            if (pk.def.quest) { counts[pk.def.quest] = (counts[pk.def.quest] || 0) + pk.def.n; logged = ' (' + counts[pk.def.quest] + ' cleared)'; }
            this.floatText(this.player.x, this.player.y - 50, pk.def.name + ' — put down' + logged, '#9af0c0');
            if (Math.random() < 0.5) GroveScene.prototype.grantLoot.call(this, { type: 'potion-health', label: 'Health Potion' }, this.player.x + 30, this.player.y);
          } else {
            pk.alive = true;
            this.player.x = 20 * 32; this.player.y = (28 - 3) * 32;
            this.floatText(this.player.x, this.player.y - 50, 'the cold drags you back to the stair. it is patient.', '#c8443a');
          }
        }, { zoneScale: true });
      }
    }
  }
}
