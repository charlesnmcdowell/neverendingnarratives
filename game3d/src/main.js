/* main.js — ArenaScene: the Dragon's-Crown beat-em-up loop.
 * Owned by game3d-build. Side-on shallow plane, warlock player + enemy WAVES
 * with their own seek-and-attack AI, a follow/scroll camera, a DC-style HUD,
 * MELEE COMBAT RESOLUTION (hit detection + damage + death via the anim
 * hurt/knockback/die clips), wave progression, floating enemy HP bars, and the
 * visual-auditor hook window.__AUDIT__.entities. Kit/progression parity (pit.js)
 * is the next follow-up; this run makes it an actually playable brawler.
 */
(function (root) {
  'use strict';

  var SPEED = 175, ENEMY_SPEED = 70, ALLY_SPEED = 95;
  // CHARGE (anim increment #5 `run` clip): a melee NPC far from its target RUSHES in — the
  // faster, longer-stride `run` gait at RUN_MULT speed — then settles to the `walkF` shuffle
  // once it's within RUN_GAP. The Dragon's-Crown "the mob charges the screen" read; purely a
  // movement/anim feel beat (no kit/damage change, so pit.js parity is untouched).
  var RUN_GAP = 210, RUN_MULT = 1.7;
  // PLAYER DASH (same `run` clip): hold SHIFT to break the warlock into the run gait at
  // SPRINT_MULT speed — the DC dash. Pure movement/anim feel (no kit/economy change), the
  // player-side mirror of the NPC charge above; pit.js parity untouched.
  var SPRINT_MULT = 1.6;
  // DASH-ATTACK LUNGE (DC dash-into-combo): a swing BEGUN mid-dash (sprint + moving) inherits the
  // sprint momentum — the warlock LUNGES forward DASH_LUNGE px along his facing and the strike reaches
  // DASH_REACH_BONUS px further for that ONE swing (reach is bumped only around the connect, then
  // restored, so a form's set reach is untouched). Reuses the `attack` clip + the normal hit
  // resolution — pure feel/movement built on the existing dash, NO kit/damage/economy/parity change.
  var DASH_LUNGE = 70, DASH_REACH_BONUS = 30;
  // DASH-LAUNCHER: a dash-strike that connects on a LIGHT foe (maxhp <= LAUNCH_MAX_HP — grunts/thralls,
  // not brutes/bosses) and doesn't kill it POPS it airborne (actor.launch) for the DC juggle window.
  // Only the dash-strike launches (a standing swing never does); feel-only, no damage/economy change.
  var LAUNCH_MAX_HP = 60;
  var PLAYER_DMG = 18, ENEMY_DMG = 8;
  var MELEE_DEPTH = 46;   // vertical (depth) tolerance for a melee connect
  var ALLY_CAP = 12;      // pit.js summon cap (oldest dissolves past it)
  // SUMMON UPKEEP (pit.js parity): summons are FREE — NO mana/MP, NO HP-tax, NO gold (grep pit.js
  // `mana|mp|gold|cost` => zero economy). The horde's true risk/reward is the per-summon `life`
  // TIMEOUT: each ally decays and DISSOLVES on its own clock, so the warlock must RE-CAST to hold
  // the screen (the prior SUMMON_COST/UNDEAD_COST/MP_REGEN was a non-canonical game3d invention).
  // Seconds per type from pit.js summonDemons/summonZombies/summonArchers: claw-fiend(brute) life:18,
  // bone-dragon life:15, succubus-coven life:14, shambler(zombie)/bone-archer life:24. EXCEPTIONS
  // (pit.js line "phylactery freezes while risen; herald succubi NEVER time out"): the LICH SOVEREIGN
  // phylactery FREEZES risen dragons (no decay) and the HEX-FIEND/herald coven never expires.
  var LIFE = { brute: 18, dragon: 15, succubus: 14, shambler: 24, archer: 24 };
  // ranged summon fire (succubus fireball + dragon breath): traveling/exploding AoE + fire DoT
  var FIRE_RANGE = 330, BURST_R = 46, BURN_TIME = 2.4, BURN_DPS = 7, SUCCUBUS_HEAL = 0.25;
  // DoT-tick score-juice cadence (DC): a burning foe pops its ACCUMULATED fire damage on this
  // throttle (per-frame DoT would spew a number every frame); hex pops on its own discrete tick.
  var BURN_POP_EVERY = 0.5;
  var BOLT = { succubus: { color: 0xff5a8c, r: 10 }, dragon: { color: 0xff8a2c, r: 15 },
               archer: { color: 0xe8e0c8, r: 6 } };   // bone-archer arrow (single-target, no burn)
  // green Sheol-fire (arch/herald succubus): burns 3x and SPREADS to a fresh foe on a burn-kill (+5s/jump).
  var SHEOL_COLOR = 0x2ecc71, SHEOL_MULT = 3, SHEOL_BURN_TIME = 3.2, SHEOL_JUMP_R = 150, SHEOL_JUMP_BONUS = 5;
  // bone-dragon acid/gas breath (pit.js `zones` type:'gas'): a LINGERING ground cloud,
  // distinct from the dragon's single bolt. Paralytic + acid DoT to foes standing inside it.
  var GAS_COLOR = 0x7fd05a, GAS_R = 98, GAS_TELE = 0.6, GAS_LIFE = 4.2,
      GAS_TICK = 0.5, GAS_DMG = 14, GAS_EVERY = 5.0, GAS_STUN = 0.3;
  // EVOLUTION-ROAD horde scaling (pit.js EVOLUTIONS + summonDemons). The warlock
  // picks a road at level 10 and ascends to the Demon Lord at level 20; each tier
  // swells the summoned horde the way Dragon's Crown escalates the screen:
  //   DREADBINDER (binder, lv10) — ×2 counts, ×1.45 size, ×3 damage, dragon ×1.7 hp.
  //   DEMON LORD  (lv20)         — ×3 counts; EVERY succubus arrives ARCH and bursts once on appear.
  // Level is earned from kills (no XP screen yet), so the horde visibly grows mid-run.
  // pit.js parity (gainLevel): each kill adds +1.5 LEVELS from a base of 1, capped at 20 — so
  // lv10 (first evo road) lands at 6 kills and lv20 (Demon-Lord ascension) at 13 kills, the way
  // Dragon's Crown escalates the screen fast. (Was 3 kills/level → roads were ~4.5x too slow.)
  var LVL_PER_KILL = 1.5, LVL_CAP = 20, BIND_SIZE = 1.45, BIND_DMG = 3, BIND_DRAGON_HP = 1.7;
  var ARCH_FUSE_MIN = 0.6, ARCH_FUSE_MAX = 1.4;   // Demon-Lord arch burst-on-appear fuse
  // PLAYER HEX bolt (pit.js hexBolt): a purple curse the warlock hurls on a cooldown that
  // ROTS a single foe over time. No MP cost / no AoE / no fire-heal in pit.js — pure DoT:
  // 15 damage every 0.5s for 10s, base cooldown 10s (the herald-road 3s/stacking is a later gap).
  var HEX_CD = 10, HEX_SPEED = 420, HEX_R = 10, HEX_COLOR = 0xb070f0,
      HEX_DOT_TIME = 10, HEX_DMG = 15, HEX_TICK = 0.5;
  // PLAYER PORTAL WARD (pit.js portal): a defensive/mobility escape — swap places with the
  // FURTHEST enemy (disorienting it with a brief stun), then become UNTOUCHABLE for a few
  // seconds. base ward 3s (the herald/devil-road 7s split is deferred). cooldown ~3s
  // (pit.js sets P.parryCD=3 on cast). The ward blocks ALL incoming player damage.
  var WARD_T_BASE = 3, WARD_T_HERALD = 7, PORTAL_STUN = 0.6, PORTAL_CD = 3, PORTAL_COLOR = 0xb070f0;
  // HEX FIEND (herald) road: hex cooldown 10s -> 3s (pit.js P.hexCD); herald demons ~35% tougher.
  var HEX_CD_HERALD = 3, HERALD_TOUGH = 1.35;
  // UNDEAD FOOT-HORDE (pit.js summonZombies + summonArchers) — the summoner road's GROUND army,
  // distinct from the dragon/coven (which fly + cast). Raised on 'L'. Road-scaled like pit.js:
  //   SHAMBLERS (melee meat, take blows): base 3 / DREADBINDER 6 / LICH SOVEREIGN 9; hp 25+kills*4,
  //     binder ×1.45 size / ×3 dmg (pit.js _zn / _bR / _bM).
  //   BONE ARCHERS (ranged, minor harm at distance): base 2 / binder 4 / lichlord 6; hp 15+kills*3,
  //     binder ×1.45 size / ×3 dmg (pit.js _slots / _bR / _bM). Arrows = single-target, no burn/AoE.
  var SHAMBLER_DMG = 9, SHAMBLER_SCALE = 0.9, ARCHER_DMG = 6, ARCHER_SCALE = 0.82;  // (life lives in LIFE)
  var ARROW_SPEED = 540, ARROW_HIT_R = 40;   // arrow color/radius live in BOLT.archer
  // LV20 ASCENSION KITS (pit.js EVOLUTIONS lv20 — the choice finally means more than a horde triple).
  //   ARCHFIEND ASCENDANT (herald->archfiend): the burning coven RAGES — Sheol/hellfire blast radius
  //     ×1.5 (pit.js fireball aoe & burst ER widen) and coven damage ×1.4 (pit.js +ATK / diceN 21->31).
  //   LICH SOVEREIGN (binder->lichlord): the phylactery raises EXTRA undead — +2 bone dragons on top
  //     of the Demon-Lord horde (pit.js summon `_ll` raises extra undead; dragon-life freeze is moot
  //     here since game3d summons don't time out).
  var ARCHFIEND_DMG = 1.4, ARCHFIEND_AOE = 1.5, LICH_EXTRA_DRAGONS = 2;
  // CLAW-FIEND (brute) summon (pit.js summonDemons('brute')): a melee aggro/shove TANK that
  // body-blocks the wave and SHOVES enemies aside. The LAST missing summon family — it thickens
  // the front line so the coven + dragon can hurl fire from behind it. Road-scaled like pit.js:
  //   count base 1 / DREADBINDER|HEX-FIEND ×2 / DEMON LORD ×3 (mul.cnt); hp 30 + kills*5
  //   (HEX FIEND ×1.35 tough). Token SHOVE damage 1 (herald 2) × binder ×3 — the value is the
  //   crowd-control shove, not the chip. Maintained as a deficit (like the dragon) so re-casts
  //   don't over-stack the front line; the ally cap 12 still applies.
  var BRUTE_SCALE = 1.25, BRUTE_SHOVE = 60, BRUTE_TOKEN_HERALD = 2;
  // EVOLUTION-ROAD pick (pit.js maybeOfferEvo/pickEvo): a FROZEN Dragon's-Crown card screen at
  // lv10 (2 roads) then lv20 (filtered to the branch that continues the lv10 road). With no input
  // it AUTO-DEFAULTS to the first card after EVO_PICK_T seconds (pit.js evoPickT, deadlock-proof).
  var EVO_PICK_T = 9;
  // WAVE BANNER (DC stage callout): total lifetime of the "WAVE N" title (fade in / hold / fade out).
  var BANNER_T = 1.7;
  // COMBO DECAY (DC combo meter): the on-screen combo resets if no fresh player hit lands for
  // COMBO_DECAY seconds. Dragon's-Crown combos LAPSE on a pause, not only when you're struck — without
  // this a combo persisted forever across waves until the player took a hit. Pure HUD/feel: no kit,
  // damage, reach, summon, or pit.js-parity change (the combo counter is a game3d DC-feel readout only).
  var COMBO_DECAY = 1.8;
  // LICH FORM SWAP (pit.js enterLich/lichSlash/fade/lichPerish): the lv20 LICH SOVEREIGN ascension is
  // a real TRANSFORM, not just a bigger horde — the warlock rises as a giant floating reaper with a
  // SWAPPED attack kit. Light attack becomes the SCYTHE (lichSlash: longer reach, a long 5s stun + a
  // long knockback "flight"); PORTAL becomes FADE (untargetable for 5s, 10s on the DREADBINDER-lich
  // road — "five seconds beyond reach, raise the dead"). The bone dragons are his PHYLACTERY: they
  // FREEZE (no decay) while he is risen (already in tickUpkeep), but once he has raised one, if every
  // risen dragon FALLS the pact breaks and the form SHATTERS back to the living warlock (lichPerish).
  // Button labels swap to SCYTHE/FADE on-screen (pit.js setBtnLabel) via updateLabels().
  var LICH_REACH_BONUS = 26, LICH_SLASH_STUN = 5, LICH_SLASH_KNOCK = 70, LICH_SLASH_DMG = 16;
  var FADE_T_BASE = 5, FADE_T_BINDER = 10, FADE_CD = 9;
  // ARCH DEVIL CLAW FORM SWAP (pit.js devilClaw/devilStrike): the herald->archfiend lv20 ascension is a
  // real TRANSFORM too, the devil-road analog to the lich. The warlock's light attack becomes the devil
  // CLAW — a rolling DASH that closes on the nearest hostile, then a HEAVY 2x front sweep with a big shake
  // (pit.js devilStrike mult 2.0). Claws lengthen the reach a touch; the button label swaps ATK -> CLAW.
  var ARCHFIEND_CLAW_MULT = 2.0, ARCHFIEND_REACH_BONUS = 14;
  // LV8 TIMED ARCH DEVIL (pit.js enterDevil/devilT/exitDevil): BEFORE the terminal lv20 devil form, the
  // warlock can briefly BORROW the Arch Devil's shape — a TIMED buff entered at level 8 by summoning the
  // coven ("he was never summoning FOR himself"). For its duration the light attack becomes the CLAW and
  // the reach lengthens (reusing devilClaw), then the pact ends and reverts. Duration by road (pit.js
  // devilDur): plain 15s, HEX-FIEND/herald 21s. After it ends a cooldown stops it re-triggering on the
  // next coven cast. NOTE (deferred next slice): pit.js's archDevilOutro — the seraph-descent + guaranteed
  // Lich cinematic on expiry — is NOT yet ported; exit is a plain revert for now.
  var DEVIL_T_BASE = 15, DEVIL_T_HERALD = 21, DEVIL_LV = 8, DEVIL_CD = 8;
  var EVO_ROADS = { warlock: {
    10: [
      { key: 'binder', name: 'DREADBINDER', desc: 'The summoner-road — the bone dragon and succubi swarm at his word. The horde doubles, grows, and hits three times as hard.' },
      { key: 'herald', name: 'HEX FIEND',   desc: 'The devil-road — his hexes burn fast (3s cooldown) and his hardier coven hurls hellfire toward the Arch Devil.' }
    ],
    20: [
      { from: 'binder', key: 'lichlord',  name: 'LICH SOVEREIGN',      desc: 'Ascend the summoner-road — the undead horde TRIPLES under the Lich Sovereign.' },
      { from: 'herald', key: 'archfiend', name: 'ARCHFIEND ASCENDANT', desc: 'Ascend the devil-road — the burning coven TRIPLES and rages toward the Arch Devil.' }
    ]
  } };

  function loadJson(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  var ArenaScene = {
    key: 'Arena',
    actors: [], player: null, keys: null,
    combo: 0, gold: 0, level: 1, kills: 0, hitStop: 0,
    road: null, roadName: '', demonLord: false, lich: false, archfiend: false, _phylactery: 0,   // evolution-road state (lv10 road, lv20 Demon Lord, lv20 LICH/ARCHFIEND form)
    devilT: 0, devilCd: 0,   // LV8 TIMED arch-devil borrow (pit.js devilT) + re-trigger cooldown
    evoPick: null, evoTier: 0, evoPickT: 0, evo10: null, evo20: null,  // open road-choice card screen
    hud: null, bars: null, waveN: 1, waveCd: 0,
    banner: null, bannerT: 0,
    _roster: ['grave', 'thrall', 'skel'], _json: {},

    create: function () {
      var self = this;
      root.__AUDIT__ = root.__AUDIT__ || {};
      root.__AUDIT__.entities = [];

      this.world = root.World.build(this);
      this.fx = root.FX.create(this);   // projectile + impact VFX manager
      this.actors = [];
      this.combo = 0; this.comboT = 0; this.gold = 0; this.kills = 0; this.waveN = 1; this.waveCd = 0; this.hitStop = 0; this.bannerT = 0;
      this.level = 1; this.road = null; this.roadName = ''; this.demonLord = false;
      this.lich = false; this.archfiend = false; this._phylactery = 0;
      this.devilT = 0; this.devilCd = 0; this._archCast = false;   // arch-devil-outro once-per-run guard
      this.evoPick = null; this.evoTier = 0; this.evoPickT = 0; this.evo10 = null; this.evo20 = null;

      // input (K = summon demons — the warlock's signature; H = HEX curse bolt; 1/2 = pick a road)
      this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,UP,DOWN,LEFT,RIGHT,J,K,H,P,L,ONE,TWO,SHIFT');

      // HUD (camera-fixed — no debug text in the play area)
      this.hud = this.add.graphics().setScrollFactor(0).setDepth(10000);
      this.hudText = this.add.text(14, 8, '', { fontFamily: 'Georgia,serif', fontSize: '14px', color: '#f0e6ff' })
        .setScrollFactor(0).setDepth(10001);
      // world-space floating enemy HP bars (scroll with the pit, above the actors)
      this.bars = this.add.graphics().setDepth(9000);
      // EVOLUTION-ROAD card screen (camera-fixed, drawn over everything; hidden until lv10/lv20).
      this.evoG = this.add.graphics().setScrollFactor(0).setDepth(11000);
      this.evoTitle = this.add.text(480, 108, '', { fontFamily: 'Georgia,serif', fontSize: '22px',
        color: '#f3e8ff', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(11002).setVisible(false);
      this.evoCardText = [0, 1].map(function () {
        return self.add.text(0, 0, '', { fontFamily: 'Georgia,serif', fontSize: '16px', color: '#e8dcff',
          align: 'left', wordWrap: { width: 264 }, lineSpacing: 4 })
          .setScrollFactor(0).setDepth(11002).setVisible(false);
      });
      // WAVE BANNER (DC stage callout): a large centered title announcing each wave; eases in,
      // holds, fades out (tickBanner). Camera-fixed, above the action but below the evo card screen.
      this.banner = this.add.text(480, 188, '', { fontFamily: 'Georgia,serif', fontSize: '40px',
        color: '#f6ecff', align: 'center', stroke: '#241636', strokeThickness: 6 })
        .setOrigin(0.5).setScrollFactor(0).setDepth(10500).setVisible(false);

      // build player + first wave once rig JSONs resolve
      Promise.all([loadJson('./rigs/warlock.json'), loadJson('./rigs/grave.json'),
                   loadJson('./rigs/thrall.json'), loadJson('./rigs/skel.json'),
                   loadJson('./rigs/succubus.json'), loadJson('./rigs/dragon.json'),
                   loadJson('./rigs/shambler.json'), loadJson('./rigs/bonearcher.json'),
                   loadJson('./rigs/brute.json')])
        .then(function (j) {
          self._json = { warlock: j[0], grave: j[1], thrall: j[2], skel: j[3],
                         succubus: j[4], dragon: j[5], shambler: j[6], archer: j[7], brute: j[8] };
          self.player = new root.Actor(self, { type: 'warlock', plan: 'BIPED', json: j[0],
            team: 'player', x: 260, depth: 460, hp: 200, scale: 1.0 });
          self.actors.push(self.player);
          self.cameras.main.startFollow(self.player.rope, true, 0.08, 0.08);
          self.spawnWave([
            { type: 'grave',  json: j[1], x: 820,  depth: 420 },
            { type: 'thrall', json: j[2], x: 980,  depth: 480 },
            { type: 'skel',   json: j[3], x: 1140, depth: 440 },
            { type: 'thrall', json: j[2], x: 1320, depth: 410 }
          ]);
          self.showBanner('WAVE 1');
        });
    },

    spawnWave: function (defs) {
      var self = this;
      defs.forEach(function (d) {
        var a = new root.Actor(self, { type: d.type, plan: d.plan || 'BIPED', json: d.json,
          team: 'enemy', x: d.x, depth: d.depth, hp: d.hp || 40, scale: d.scale || 0.95 });
        a.atkCd = Math.random() * 0.8;
        self.actors.push(a);
      });
    },

    nextWave: function () {
      this.waveN++;
      // drop dead enemy actors, keep the player
      this.actors = this.actors.filter(function (a) { return a.team === 'player' || !a.dead; });
      var n = Math.min(6, 3 + this.waveN), hp = 40 + this.waveN * 12;
      var baseX = this.player.x + 480, defs = [];
      for (var i = 0; i < n; i++) {
        var t = this._roster[i % this._roster.length];
        defs.push({ type: t, json: this._json[t] || null,
          x: baseX + i * 150, depth: 410 + (i % 3) * 35, hp: hp });
      }
      this.spawnWave(defs);
      this.showBanner('WAVE ' + this.waveN);
    },

    // level up off kills (no XP screen yet) and OPEN the evolution-road choice at the
    // tier gates: lv10 -> the DREADBINDER/HEX-FIEND card screen, lv20 -> the filtered
    // ascension. (pit.js: warlock picks an evo road at 10, then its continuation at 20.)
    tickProgression: function () {
      if (this.evoPick) return;                         // a road choice is open — freeze leveling
      // pit.js gainLevel(): P.level += 1.5 per kill (from a base of 1), capped 20; lvl()=floor.
      // Closed form is exact since the +1.5 step is monotonic up to the LVL_CAP clamp.
      var lvl = Math.min(LVL_CAP, Math.floor(1 + LVL_PER_KILL * this.kills));
      if (lvl === this.level) return;
      this.level = lvl;
      if (lvl >= 20 && !this.demonLord && this.road) this.offerEvo(20);   // lv20: filtered ascension
      else if (lvl >= 10 && !this.road) this.offerEvo(10);                // lv10: first road, 2 cards
    },

    // open the FROZEN Dragon's-Crown card screen for a tier (10 first; then 20 filtered to the
    // branch that continues the lv10 road). Replaces the old silent auto-default (pit.js maybeOfferEvo).
    offerEvo: function (tier) {
      var self = this, E = EVO_ROADS.warlock || {}, list;
      if (tier === 20) list = (E[20] || []).filter(function (b) { return b.from === self.road; });
      else list = E[10] || [];
      if (!list || !list.length) { if (tier === 20) this.demonLord = true; return; }  // no branch -> just ascend
      this.evoPick = list.slice(0, 2); this.evoTier = tier; this.evoPickT = EVO_PICK_T;
    },

    // commit the chosen road. lv10 sets this.road to the card key ('binder'/'herald', which the
    // horde/ward/hex code already branches on); lv20 sets demonLord + the ascension name (pit.js pickEvo).
    pickEvo: function (i) {
      var pick = this.evoPick; if (!pick) return;
      var b = pick[i] || pick[0];
      if (this.evoTier === 20) { this.demonLord = true; this.evo20 = b.key; this.roadName = b.name;
        this.devilT = 0; this.devilCd = 0;                  // a timed lv8 borrow yields to the terminal lv20 form
        if (b.key === 'lichlord') this.enterLich();         // LICH SOVEREIGN: a real FORM SWAP (scythe + fade)
        else if (b.key === 'archfiend') this.enterArchfiend();   // ARCHFIEND ASCENDANT: the devil CLAW form swap
      } else { this.road = b.key; this.evo10 = b.key; this.roadName = b.name; }
      this.evoPick = null; this.evoTier = 0; this.evoPickT = 0;
      this.hideEvoPanel();
      if (this.cameras && this.cameras.main) this.cameras.main.flash(240, 150, 90, 220);
    },

    // while the screen is open: keyboard 1/2, or touch (ATK/SUMMON = card 1, HEX = card 2) selects.
    handleEvoInput: function () {
      var k = this.keys, T = root.__TOUCH__ || {};
      if (Phaser.Input.Keyboard.JustDown(k.ONE) || T.attack || T._summonEdge) {
        T.attack = false; T._summonEdge = false; this.pickEvo(0); return;
      }
      if (this.evoPick && this.evoPick[1] &&
          (Phaser.Input.Keyboard.JustDown(k.TWO) || T._hexEdge)) {
        T._hexEdge = false; this.pickEvo(1); return;
      }
    },

    // draw the dim + road cards over the frozen scene (base 960x540 FIT space).
    drawEvoPanel: function () {
      var g = this.evoG; if (!g || !this.evoPick) return;
      g.clear();
      g.fillStyle(0x05030a, 0.68); g.fillRect(0, 0, 960, 540);
      var n = this.evoPick.length, cw = 300, ch = 250, gap = 44;
      var x0 = (960 - (n * cw + (n - 1) * gap)) / 2, y0 = 172;
      for (var i = 0; i < n; i++) {
        var cx = x0 + i * (cw + gap), b = this.evoPick[i];
        g.fillStyle(0x1a1230, 0.97); g.fillRoundedRect(cx, y0, cw, ch, 14);
        g.lineStyle(2, 0x7a4cd0, 1);  g.strokeRoundedRect(cx, y0, cw, ch, 14);
        this.evoCardText[i].setPosition(cx + 18, y0 + 22)
          .setText('[ ' + (i + 1) + ' ]   ' + b.name + '\n\n' + b.desc).setVisible(true);
      }
      if (n < 2) this.evoCardText[1].setVisible(false);
      this.evoTitle.setText((this.evoTier === 20 ? 'ASCEND — Lv ' : 'CHOOSE YOUR ROAD — Lv ') +
        this.level + '\npress 1 or 2   (auto in ' + Math.ceil(this.evoPickT) + 's)').setVisible(true);
    },

    hideEvoPanel: function () {
      if (this.evoG) this.evoG.clear();
      if (this.evoTitle) this.evoTitle.setVisible(false);
      if (this.evoCardText) for (var i = 0; i < this.evoCardText.length; i++) this.evoCardText[i].setVisible(false);
    },

    // current horde-scaling multipliers from the evolution road (1/1/1 when un-evolved).
    hordeMul: function () {
      var dmg = this.road === 'binder' ? BIND_DMG : 1;
      if (this.evo20 === 'archfiend') dmg *= ARCHFIEND_DMG;   // ARCHFIEND: the coven rages (+ATK)
      return { cnt: this.demonLord ? 3 : (this.road ? 2 : 1),
               size: this.road === 'binder' ? BIND_SIZE : 1,
               dmg:  dmg,
               tough: this.road === 'herald' ? HERALD_TOUGH : 1,                      // HEX FIEND: demons ~35% tougher
               dragonAdd: this.evo20 === 'lichlord' ? LICH_EXTRA_DRAGONS : 0,         // LICH SOVEREIGN: +2 dragons
               aoe: this.evo20 === 'archfiend' ? ARCHFIEND_AOE : 1 };                 // ARCHFIEND: wider hellfire blast
    },

    // HIT-STOP (Dragon's-Crown impact weight): a landed blow involving the PLAYER briefly FREEZES
    // the whole sim for a few ms, so the connect reads with heft before motion resumes. Kept
    // player-centric (player deals/receives) so the background horde brawl never stutters; capped
    // low (≤110ms) to stay responsive. Pure feel — no kit/damage/parity change (the frozen frame
    // simply holds; update() resumes from the same state next tick).
    freezeFrame: function (ms) { this.hitStop = Math.min(110, Math.max(this.hitStop || 0, ms)); },

    // KILL-CONFIRM SPARK (Dragon's-Crown "death pop"): the frame an enemy FIRST goes down — by ANY
    // source (melee, fire DoT, gas cloud, hex-rot, bone-arrow, brute-shove) — spray a warm GOLD
    // burst at its torso so a kill READS as a reward, not just a silhouette that stops moving.
    // Detected HERE in one place off the actor's own dying/dead flag (the `_sparked` guard fires it
    // exactly once), so it covers every damage path without touching the six kill-credit sites.
    // Pure feel — no kills/gold/parity/kit change; the burst is the existing additive FX flash.
    killSpark: function () {
      if (!this.fx || !this.fx.burst) return;
      // COMBO CRESCENDO (DC kill-pop): the death burst SWELLS with the live combo so a kill landed
      // deep in a chain reads bigger/brighter than an isolated one — Dragon's-Crown's escalating
      // score-juice. scale ramps 1.0 -> ~1.6 across combo 0..30 (clamped), and at combo >=10 a third
      // bright-white core flash punches in for the crescendo. Pure feel: reads team/dying/dead/combo,
      // calls the existing additive fx.burst — no kit/damage/kill-credit/parity change.
      var combo = this.combo || 0;
      var scale = 1 + Math.min(combo, 30) * 0.02;   // 1.0 at 0 -> 1.6 at >=30
      for (var i = 0; i < this.actors.length; i++) {
        var a = this.actors[i];
        if (a.team !== 'enemy' || a._sparked) continue;
        if (!a.dying && !a.dead) continue;
        a._sparked = true;
        var cy = a.depth - (a.h || 200) * 0.5;
        this.fx.burst(a.x, cy, 0xffe27a, 34 * scale);   // bright gold core (swells with combo)
        this.fx.burst(a.x, cy, 0xffb02c, 52 * scale);   // warm wide ring (swells with combo)
        if (combo >= 10) this.fx.burst(a.x, cy, 0xfff2c0, 22 * scale);   // crescendo white pop
      }
    },

    // GROUND-BOUNCE / OTG LANDING SPLAT (Dragon's-Crown knockdown weight): the frame a juggled foe
    // touches down, actors.js sets a one-shot `_landSplat` flag (+ a feet squash). Read it HERE in one
    // place and spray a low DUST burst at the foe's FEET (ground y = a.depth) so the air-juggle ENDS
    // with a readable floor impact instead of silently settling. Consume the flag so it pops once per
    // landing. Pure feel — reads the flag + calls the existing additive fx.burst; no kit/kill/parity change.
    landSplat: function () {
      if (!this.fx || !this.fx.burst) return;
      for (var i = 0; i < this.actors.length; i++) {
        var a = this.actors[i];
        if (!a._landSplat) continue;
        a._landSplat = false;
        if (a.dead) continue;
        this.fx.burst(a.x, a.depth, 0xb6a488, 30);          // wide pale dust ring at the feet
        this.fx.burst(a.x, a.depth, 0x8a7c66, 18);          // darker low core
      }
    },

    // team -> side. enemies are 'dark'; player + summoned allies are 'light'.
    sideOf: function (team) { return team === 'enemy' ? 'dark' : 'light'; },
    hostile: function (a, b) { return this.sideOf(a.team) !== this.sideOf(b.team); },

    // nearest living hostile to `a` (used by both enemy and ally AI).
    nearestHostile: function (a) {
      var best = null, bd = Infinity;
      for (var i = 0; i < this.actors.length; i++) {
        var t = this.actors[i];
        if (t === a || t.dead || t.dying || !this.hostile(a, t)) continue;
        var d = Math.abs(t.x - a.x) + Math.abs(t.depth - a.depth);
        if (d < bd) { bd = d; best = t; }
      }
      return best;
    },

    // damage every hostile, in-range, in-front target once per swing.
    // floating damage number on a struck target (DC score-juice; mirrors pit.js popup).
    // white normal / gold on a heavy blow / orange for fire; size scales with damage.
    dmgPop: function (t, amount, kind) {
      if (!this.fx || !this.fx.popup) return;
      var n = Math.round(amount);
      if (n <= 0) return;
      var air = kind === 'air';   // an air-hit-confirm (bounce-juggle) pop — brighter/bigger regardless of dmg
      var heavy = (kind !== 'fire' && kind !== 'hex' && (n >= 30 || air));  // crit tier = the gold blows (+ air confirms)
      var col = kind === 'fire' ? '#ff9a3c' : (kind === 'hex' ? '#c98cff' : (air ? '#bda0ff' : (heavy ? '#ffd24a' : '#ffffff')));
      var size = 15 + Math.min(n, 45) * 0.32 + (air ? 4 : 0);
      this.fx.popup(t.x, t.depth - (t.h || 200) * 0.55, n, col, size, heavy);  // heavy -> scale-punch + shake
    },

    meleeHit: function (atk, dmg, launch) {
      var landed = false;
      for (var i = 0; i < this.actors.length; i++) {
        var t = this.actors[i];
        if (t === atk || t.dead || t.dying || !this.hostile(atk, t)) continue;
        var dx = t.x - atk.x;
        if (Math.abs(dx) > 18 && Math.sign(dx) !== atk.facing) continue;  // must be in front
        if (Math.abs(dx) > atk.reach) continue;
        if (Math.abs(t.depth - atk.depth) > MELEE_DEPTH) continue;
        if (this.wardBlocks(t)) continue;                 // warded player is untouchable
        if (t.hurt(dmg, atk.x)) {
          landed = true;
          var lightSide = this.sideOf(atk.team) === 'light';
          // AIR-HIT-CONFIRM (DC bounce-juggle payoff): a light-side blow on an ALREADY-airborne SURVIVING
          // foe re-pops it (t.airHit, capped per actor) — the juggle loop the dash-launcher opens. Evaluated
          // first so the pop reads as the brighter air-confirm; mutually exclusive with the initial launch
          // below via the `t._hop>0` gate. The `&& t.airHit && t.airHit()` short-circuits on the cap/ground.
          var airHit = lightSide && t.team === 'enemy' && t._hop > 0 && !t.dying && t.airHit && t.airHit();
          if (lightSide) this.dmgPop(t, dmg, airHit ? 'air' : undefined);   // score juice; brighter on an air-confirm
          if (airHit) this.fx.burst(t.x, t.depth - (t.h || 200) * 0.5, 0xc9a0ff, 20);   // violet juggle pop
          if (lightSide && t.dying) {
            this.kills++;
            this.gold += (atk.team === 'player') ? 12 : 6;  // summon kills pay less
          }
          // dash-launcher: a dash-strike pops a SURVIVING light foe airborne (DC juggle starter)
          else if (launch && t.team === 'enemy' && (t.maxhp || 0) <= LAUNCH_MAX_HP && !(t._hop > 0)) {
            if (t.launch()) this.fx.burst(t.x, t.depth - (t.h || 200) * 0.5, 0xc9a0ff, 16);
          }
          if (t === this.player) { this.combo = 0; this.freezeFrame(70); }   // player took a hit (heavier stop)
        }
      }
      if (landed && atk === this.player) this.freezeFrame(50);   // player connected a swing
      return landed;
    },

    // nearest LIVING own summon (pit.js devilClaw "his own first" — arch succubi off the menu),
    // so the ARCHFIEND dashes to feed on the horde before reaching the wave.
    nearestSummon: function (p) {
      var best = null, bd = Infinity;
      for (var i = 0; i < this.actors.length; i++) {
        var t = this.actors[i];
        if (t.team !== 'ally' || t.dead || t.dying || t.arch) continue;
        var d = Math.abs(t.x - p.x) + Math.abs(t.depth - p.depth);
        if (d < bd) { bd = d; best = t; }
      }
      return best;
    },

    // DEVOUR pass (pit.js devilStrike "he devours his own first"): the ARCHFIEND's claw eats every
    // own summon in front + in reach BEFORE it ever touches the wave. Arch succubi are immune (off
    // the menu). The CLAW path does not heal (pit.js heals=false — only the BITE feeds him). Returns
    // how many allies were devoured so devilClaw knows to skip the enemy sweep this swing.
    devourSummons: function (p, dmg) {
      var ate = 0;
      for (var i = 0; i < this.actors.length; i++) {
        var t = this.actors[i];
        if (t.team !== 'ally' || t.dead || t.dying || t.arch) continue;   // arch succubi off the menu
        var dx = t.x - p.x;
        if (Math.abs(dx) > 18 && Math.sign(dx) !== p.facing) continue;     // must be in front
        if (Math.abs(dx) > p.reach) continue;
        if (Math.abs(t.depth - p.depth) > MELEE_DEPTH) continue;
        if (t.hurt(dmg, p.x)) {                                            // DEVOURED — feeds him
          ate++;
          this.fx.burst(t.x, t.depth - (t.h || 200) * 0.4, 0xd03a4a, 14);  // red devour burst (pit.js popup)
        }
      }
      if (ate) this.devoured = (this.devoured || 0) + ate;
      return ate;
    },

    // CLAW-FIEND swing (pit.js brute branch): a pure aggro TANK — token chip damage but a BIG
    // SHOVE that knocks every nearby hostile away from the brute, scattering the wave so the
    // coven/dragon fire lands clean. No friendly fire; credits enemy deaths; a small camera shake.
    bruteShove: function (a) {
      var pushed = false;
      for (var i = 0; i < this.actors.length; i++) {
        var t = this.actors[i];
        if (t === a || t.dead || t.dying || !this.hostile(a, t)) continue;
        var dx = t.x - a.x, dd = t.depth - a.depth;
        if (Math.abs(dx) > a.reach + 24 || Math.abs(dd) > MELEE_DEPTH + 16) continue;
        if (this.wardBlocks(t)) continue;                 // warded player can't be shoved/chipped
        // SKID the shove rather than teleport-jump x: seed the target's `_kvx` (the actors.js
        // knockback-slide velocity) so a brute-shoved mob slides back smoothly — the SAME push
        // read every struck mob now gets from hurt() — instead of snapping BRUTE_SHOVE px in a
        // single frame. Skid distance ≈ v0 / KB_FRICTION (=7 in actors.js), so v0 = BRUTE_SHOVE*7
        // coasts ~BRUTE_SHOVE px before friction stops it; update() integrates + world-clamps it.
        // Depth has no slide system, so the small depth nudge stays instant. No kit/damage change.
        t._kvx = (dx >= 0 ? 1 : -1) * BRUTE_SHOVE * 7;    // smooth skid away from the brute
        t.depth += (dd >= 0 ? 1 : -1) * BRUTE_SHOVE * 0.4;
        this.clampBand(t);
        t.stagger = Math.max(t.stagger || 0, 0.2);
        t.hp -= a.dmg; pushed = true;                     // token chip
        if (t.facing != null) t.facing = a.x > t.x ? 1 : -1;
        this.fx.burst(t.x, t.depth - (t.h || 200) * 0.4, 0xd05a6a, 10);
        if (t.hp <= 0 && !t.dying) {
          t.hp = 0; t.dying = true; t.stagger = 1.0; t.play('die');
          if (t.team === 'enemy') { this.kills++; this.gold += 4; }
        }
      }
      if (pushed && this.cameras && this.cameras.main) this.cameras.main.shake(80, 0.004);
    },

    // unified seek-and-attack AI for any NPC combatant (enemy wave OR ally summon).
    // melee units close to swing; ranged units (succubus/dragon) hold a standoff
    // and cast traveling fire bolts. nearestHostile picks the target.
    npcAI: function (a, dt, speed) {
      a.stagger = Math.max(0, (a.stagger || 0) - dt);
      if (a.dying) return;
      if (a.stagger > 0) { a.reactTick(); return; }   // advance the knockdown chain while staggered
      a.atkCd = Math.max(0, (a.atkCd || 0) - dt);
      var foe = this.nearestHostile(a);
      if (!foe) { if (a.rig.action !== 'idle') a.play('idle'); return; }
      // Demon-Lord arch succubus: a short fuse, then ONE guaranteed Sheol blast on appear,
      // regardless of range (pit.js item 6); afterward it survives and fires normally.
      if (a.archBurst) {
        a.archT = (a.archT || 0) - dt;
        if (a.archT <= 0) {
          a.archBurst = false; a.play(a.atkClip); this.castBolt(a, foe);
          this.fx.burst(a.x, a.depth - (a.h || 200) * 0.4, SHEOL_COLOR, 30);
        }
      }
      var gapX = foe.x - a.x, gapD = foe.depth - a.depth, dist = Math.abs(gapX) + Math.abs(gapD);

      if (a.ranged) {
        if (a.laysGas) a.gasCd = Math.max(0, (a.gasCd || 0) - dt);   // gas breath recharges on its own clock
        // hold a firing standoff; close only if the foe is out of range
        if (dist > FIRE_RANGE) {
          a.moveTo(Math.sign(gapX) * speed * dt, Math.sign(gapD) * speed * 0.7 * dt);
          if (a.rig.action !== 'walkF') a.play('walkF');
        } else if (a.atkCd === 0) {
          a.play(a.atkClip); a.atkCd = a.fireCd || 1.6;
          // the bone dragon lays a lingering acid cloud when its breath is charged,
          // otherwise it spits a single bolt — two distinct attacks (pit.js parity).
          if (a.laysGas && a.gasCd <= 0) { this.castGas(a, foe); a.gasCd = a.gasEvery || GAS_EVERY; }
          else this.castBolt(a, foe);
        } else if (a.rig.action === a.atkClip && a.rig.done) {
          a.play('idle');
        }
        return;
      }

      // melee
      if (dist > 76) {
        // far -> CHARGE (run gait, faster close); near -> walk shuffle into swing range.
        var charging = dist > RUN_GAP, sp = charging ? speed * RUN_MULT : speed, gait = charging ? 'run' : 'walkF';
        a.moveTo(Math.sign(gapX) * sp * dt, Math.sign(gapD) * sp * 0.7 * dt);
        if (a.rig.action !== gait) a.play(gait);
      } else if (a.atkCd === 0) {
        a.play(a.atkClip); a.swingHit = false; a.atkCd = 1.4;
      } else if (a.rig.action === a.atkClip && !a.swingHit) {
        a.swingHit = true;
        if (a.brute) this.bruteShove(a);    // claw fiend: aggro/shove tank, not a single-target hit
        else this.meleeHit(a, a.dmg);
      } else if (a.rig.action === a.atkClip && a.rig.done) a.play('idle');
    },

    // PLAYER HEX bolt (pit.js hexBolt): a cooldown-gated purple curse that flies straight
    // (gently aimed at the nearest foe) and ROTS the first hostile it strikes. Reuses the
    // projectile pipeline with a `hex` tag so detonate routes it to the single-target rot.
    castHex: function () {
      var p = this.player;
      if (!p || p.dead || p.dying || (p.hexCd || 0) > 0) return;
      p.hexCd = (this.road === 'herald') ? HEX_CD_HERALD : HEX_CD;   // HEX FIEND: 10s -> 3s
      var foe = this.nearestHostile(p);
      if (foe) p.facing = foe.x > p.x ? 1 : -1;
      p.play('attack');                                   // reuse the cast/attack clip
      var sx = p.x + p.facing * 26, sd = p.depth - (p.h || 200) * 0.40;
      var vx = p.facing * HEX_SPEED, vy = 0;
      if (foe) {                                           // aim at the target's torso
        var tx = foe.x, td = foe.depth - (foe.h || 200) * 0.40;
        var dx = tx - sx, dd = td - sd, len = Math.sqrt(dx * dx + dd * dd) || 1;
        vx = dx / len * HEX_SPEED; vy = dd / len * HEX_SPEED;
      }
      this.fx.fire({ x: sx, depth: sd, vx: vx, vy: vy, life: 1.6, team: p.team,
        side: this.sideOf(p.team), dmg: 0, type: 'warlock', owner: p,
        r: HEX_R, color: HEX_COLOR, hex: true });
    },

    // PLAYER PORTAL WARD (pit.js portal): swap places with the FURTHEST living enemy,
    // briefly STUN it (disoriented by the swap), and gain a damage-immunity WARD. A flashy
    // reposition + i-frame escape — the warlock's defensive beat. CD-gated (no MP, like pit.js).
    castPortal: function () {
      var p = this.player;
      if (!p || p.dead || p.dying) return;
      if (this.lich) { this.fade(); return; }            // LICH form: PORTAL becomes FADE (untargetable)
      if ((p.portalCd || 0) > 0) return;
      // furthest living enemy (pit.js: enemies sorted by distance, take the farthest)
      var far = null, fd = -1;
      for (var i = 0; i < this.actors.length; i++) {
        var e = this.actors[i];
        if (e.team !== 'enemy' || e.dead || e.dying) continue;
        var d = Math.abs(e.x - p.x) + Math.abs(e.depth - p.depth);
        if (d > fd) { fd = d; far = e; }
      }
      if (!far) return;                                  // pit.js: no foes -> no portal
      p.portalCd = PORTAL_CD;
      // purple leaf-burst at BOTH endpoints (pit.js leafBurst), then swap positions
      this.fx.burst(p.x, p.depth - (p.h || 200) * 0.4, PORTAL_COLOR, 22);
      this.fx.burst(far.x, far.depth - (far.h || 200) * 0.4, PORTAL_COLOR, 22);
      var px = p.x, pd = p.depth;
      p.x = far.x; p.depth = far.depth; far.x = px; far.depth = pd;
      this.clampBand(p); this.clampBand(far);
      far.stagger = Math.max(far.stagger || 0, PORTAL_STUN);   // disoriented by the swap
      far.play('hurt');
      p.wardT = (this.road === 'herald') ? WARD_T_HERALD : WARD_T_BASE;  // untouchable
      this.fx.burst(p.x, p.depth - (p.h || 200) * 0.4, 0x5ad2ff, 18);    // cyan ward flash
      if (this.cameras && this.cameras.main) this.cameras.main.shake(120, 0.006);
    },

    // LICH FORM (pit.js enterLich): rise as the reaper on the LICH SOVEREIGN ascension — swap the
    // attack kit (SCYTHE + FADE), lengthen the warlock's reach, and swap the on-screen labels. (We
    // ASCEND rather than die, so we don't cut hp to 50% the way the death-rise does — noted choice.)
    enterLich: function () {
      this.lich = true; this._phylactery = 0;
      this.archfiend = false;   // terminal-form invariant: the scythe kit cannot co-exist with the devil CLAW (never two attack kits)
      var p = this.player;
      if (p) {
        p.reach = (root.Actor.prototype.reach || 92) + LICH_REACH_BONUS;   // a longer scythe arc
        if (this.fx) this.fx.burst(p.x, p.depth - (p.h || 200) * 0.5, 0x9af0c0, 34);   // bone-green rise
      }
      this.updateLabels();
      if (this.cameras && this.cameras.main) this.cameras.main.flash(320, 150, 240, 190);
    },

    // revert to the living warlock when the phylactery (every risen dragon) is gone (pit.js lichPerish).
    lichPerish: function () {
      this.lich = false; this._phylactery = 0;
      var p = this.player;
      if (p) {
        p.reach = root.Actor.prototype.reach || 92;
        if (this.fx) this.fx.burst(p.x, p.depth - (p.h || 200) * 0.5, 0xd03a4a, 26);   // the pact shatters
      }
      this.updateLabels();
    },

    // ARCH DEVIL form (pit.js enterDevil/enterDemonLord): the herald->archfiend ascension rises into the
    // devil's borrowed shape — swap the light attack for the CLAW (devilClaw), lengthen the reach a touch,
    // and swap the on-screen label. Like pit.js's Demon Lord the form is TERMINAL (no revert), so there is
    // no phylactery/perish to track — simpler than the lich.
    enterArchfiend: function () {
      this.archfiend = true;
      this.lich = false; this._phylactery = 0;   // terminal-form invariant: the devil CLAW kit overrides/drops any prior auto-Lich (never two attack kits)
      var p = this.player;
      if (p) {
        p.reach = (root.Actor.prototype.reach || 92) + ARCHFIEND_REACH_BONUS;   // devil claws reach further
        if (this.fx) this.fx.burst(p.x, p.depth - (p.h || 200) * 0.5, 0xd03a4a, 34);   // brimstone rise
      }
      this.updateLabels();
      if (this.cameras && this.cameras.main) this.cameras.main.flash(320, 220, 70, 70);
    },

    // currently wielding the devil CLAW kit? — the terminal lv20 ARCHFIEND form OR the lv8 TIMED borrow.
    inDevil: function () { return this.archfiend || (this.devilT || 0) > 0; },
    // timed arch-devil duration by road (pit.js devilDur): plain 15s, HEX-FIEND/herald 21s.
    devilDur: function () { return this.road === 'herald' ? DEVIL_T_HERALD : DEVIL_T_BASE; },

    // LV8 TIMED ARCH DEVIL (pit.js enterDevil): borrow the devil's shape for devilDur() seconds — the light
    // attack becomes the CLAW (devilClaw) + the reach lengthens — then exitDevil reverts. Gated: level>=8,
    // not already in a devil/lich/demon-lord form, and off the re-trigger cooldown. Auto-fired when the
    // warlock raises the coven ("he was never summoning FOR himself"). The seraph/guaranteed-Lich expiry
    // cinematic (pit.js archDevilOutro) is a DEFERRED next slice — exit is a plain revert for now.
    enterDevil: function () {
      if (this.level < DEVIL_LV || this.inDevil() || this.lich || this.demonLord) return;
      if ((this.devilCd || 0) > 0) return;
      this.devilT = this.devilDur();
      var p = this.player;
      if (p) {
        p.reach = (root.Actor.prototype.reach || 92) + ARCHFIEND_REACH_BONUS;   // borrowed devil claws reach further
        if (this.fx) this.fx.burst(p.x, p.depth - (p.h || 200) * 0.5, 0xd03a4a, 30);   // brimstone borrow
      }
      this.showBanner('ARCH DEVIL');
      this.updateLabels();
      if (this.cameras && this.cameras.main) this.cameras.main.flash(280, 200, 60, 60);
    },

    // exit the timed borrow (pit.js exitDevil): the pact ends, reach + labels revert, a cooldown stops it
    // re-triggering on the very next coven cast. Reach only resets if NOT in a lv20 form (which sets its own).
    exitDevil: function () {
      this.devilT = 0; this.devilCd = DEVIL_CD;
      var p = this.player;
      if (p && !this.archfiend && !this.lich) p.reach = root.Actor.prototype.reach || 92;
      if (p && this.fx) this.fx.burst(p.x, p.depth - (p.h || 200) * 0.5, 0xb070f0, 18);   // the pact ends (purple)
      this.updateLabels();
    },

    // ARCH DEVIL OUTRO (pit.js archDevilOutro): when the lv8 TIMED borrow runs OUT the pact does not just
    // lapse — the loosed devil TAUNTS, and the road decides his fate. HERALD road: he keeps the borrowed
    // crown forever as the terminal DEMON LORD. BASE/BINDER (or no road yet): the SERAPHIM descends and
    // casts him down, and death signs the ledger — he rises a GUARANTEED Lich. Plays at most ONCE per run
    // (softlock guard, pit.js archCineFight) so it can never trap a devil<->lich loop. Voice lines are
    // STUBBED to on-screen banners only — no VoiceMan / no paid TTS in a scheduled build. The phases run
    // off the Phaser clock when present, and COLLAPSE to an immediate transform headless (auditor-safe).
    archDevilOutro: function () {
      if (this._archCast || this.lich || this.demonLord || this.archfiend) { this.exitDevil(); return; }
      // NO ROAD YET: defer. A guaranteed cast-down here would pre-empt the lv10 road card and could
      // later layer a Lich UNDER a herald->archfiend lv20 form (the dual-form bug). Just revert; we
      // do NOT consume _archCast, so the outro re-arms and fires correctly once a road is chosen.
      if (!this.road) { this.exitDevil(); return; }
      this._archCast = true;                          // once per run — the guaranteed cast-down can't repeat
      this.devilT = 0; this.devilCd = DEVIL_CD;
      var p = this.player, self = this;
      var cam = (this.cameras && this.cameras.main) ? this.cameras.main : null;
      var clock = (this.time && this.time.delayedCall) ? this.time : null;
      this.showBanner('THE ARCH DEVIL');              // the loosed devil taunts the world (banner-only)
      if (this.road === 'herald') {                   // HERALD: the borrowed crown is his forever
        if (cam) cam.flash(280, 200, 60, 60);
        var crown = function () { if (!self.lich) self.enterDemonLord(); };
        if (clock) clock.delayedCall(1500, crown); else crown();
        return;
      }
      // BASE / BINDER / no road yet: the Seraphim descends and casts the devil down -> guaranteed Lich
      if (cam) cam.flash(280, 200, 60, 60);           // brimstone
      var seraph = function () {
        self.showBanner('THE SERAPHIM');
        if (cam) cam.flash(360, 255, 246, 200);       // a pillar of dawn pours down with the angel
      };
      var castDown = function () {
        if (self.lich || self.demonLord) return;
        self.showBanner('THE DEVIL IS CAST DOWN');
        if (cam) { cam.flash(420, 150, 240, 190); if (cam.shake) cam.shake(220, 0.012); }
        self.enterLich();                             // death signs the ledger — he rises the Lich (guaranteed)
      };
      if (clock) { clock.delayedCall(1400, seraph); clock.delayedCall(2700, castDown); }
      else { seraph(); castDown(); }                  // headless: collapse the phases to an instant rise
    },

    // terminal DEMON LORD (pit.js enterDemonLord): the herald's borrowed arch-devil shape becomes his own
    // forever — a bigger warlock wreathed in black-and-green fire whose summoned horde TRIPLES (demonLord).
    // Keeps the devil CLAW kit (archfiend flag, so inDevil() and the CLAW label hold) as the terminal
    // devil-road form, the analog to the binder road's Lich.
    enterDemonLord: function () {
      this.demonLord = true; this.archfiend = true; this.devilT = 0;
      this.lich = false; this._phylactery = 0;   // terminal-form invariant: the CLAW Demon Lord cannot carry a Lich kit underneath (never two attack kits)
      var p = this.player;
      if (p) {
        p.reach = (root.Actor.prototype.reach || 92) + ARCHFIEND_REACH_BONUS;   // devil claws reach further
        if (this.fx) this.fx.burst(p.x, p.depth - (p.h || 200) * 0.5, 0x2ecc71, 34);   // green hellfire rise
      }
      this.showBanner('THE DEMON LORD');
      this.updateLabels();
      if (this.cameras && this.cameras.main) this.cameras.main.flash(320, 70, 200, 110);
    },

    // CLAW (pit.js devilClaw + devilStrike mult 2.0): the archfiend's light attack — a rolling DASH then
    // a HEAVY 2x front sweep with a big shake. pit.js "he devours his own first": the dash targets the
    // nearest OWN SUMMON if one is alive (else the wave), and the sweep DEVOURS in-range allies before it
    // ever carves the Pit. Only when no summon is in reach does it fall through to the enemy sweep — so
    // kills/gold/ward rules on the wave stay identical (meleeHit). Returns whether the swing landed.
    devilClaw: function (p) {
      var dmg = Math.round(PLAYER_DMG * ARCHFIEND_CLAW_MULT);   // heavy 2x carve
      var target = this.nearestSummon(p) || this.nearestHostile(p);   // his own first, then the Pit
      if (target) {
        p.facing = target.x > p.x ? 1 : -1;
        if (Math.abs(target.x - p.x) > p.reach) {           // rolling dash that lands beside the target
          var lx = target.x - p.facing * (p.reach - 8);
          for (var s = 0; s < 6; s++)
            this.fx.burst(p.x + (lx - p.x) * s / 6, p.depth - (p.h || 200) * 0.4, 0xd03a4a, 5);
          p.x = lx; p.depth = target.depth; this.clampBand(p);
        }
      }
      var ate = this.devourSummons(p, dmg);                 // he devours his own first...
      var landed = ate > 0 ? true : this.meleeHit(p, dmg);  // ...else the Pit is next
      if (landed) this.freezeFrame(80);                     // heavy devil carve lands with weight
      if (this.cameras && this.cameras.main) this.cameras.main.shake(90, 0.006);
      return landed;
    },

    // SCYTHE (pit.js lichSlash): the lich's light attack — token-to-moderate harm but a LONG 5s stun
    // and a long knockback "flight". Sweeps every hostile in front within the lengthened reach.
    lichSlash: function (p) {
      var landed = false;
      // DREADBINDER lich: the scythe hits 2x (pit.js lichSlash `*(P.evo10==='binder'?2:1)`). The lich
      // only ever ascends from the binder road, so this is the binder-lich's heavier reaping.
      var dmg = LICH_SLASH_DMG * (this.road === 'binder' ? 2 : 1);
      for (var i = 0; i < this.actors.length; i++) {
        var t = this.actors[i];
        if (t === p || t.dead || t.dying || !this.hostile(p, t)) continue;
        var dx = t.x - p.x;
        if (Math.abs(dx) > 18 && Math.sign(dx) !== p.facing) continue;     // must be in front
        if (Math.abs(dx) > p.reach) continue;
        if (Math.abs(t.depth - p.depth) > MELEE_DEPTH) continue;
        if (this.wardBlocks(t)) continue;
        if (t.hurt(dmg, p.x)) {
          landed = true;
          this.dmgPop(t, dmg);                             // lich scythe number (always player → light)
          if (!t.dying) {                                  // survived -> long stun + long flight
            t.stagger = Math.max(t.stagger || 0, LICH_SLASH_STUN);
            // KNOCKBACK SLIDE (unify with bruteShove/hurt, runs #73-74): seed _kvx instead of
            // snapping t.x — coasts ~LICH_SLASH_KNOCK px before KB_FRICTION(=7, actors.js) decays
            // it to rest (same total flight as the old instant jump), but now a smooth skid that
            // update() integrates + world-clamps, identical to every other knockback read. No depth
            // slide system + lichSlash never nudges depth, so the band clamp is unneeded here.
            t._kvx = (dx >= 0 ? 1 : -1) * LICH_SLASH_KNOCK * 7;
            t.play('knockback');
          }
          if (t.dying && t.team === 'enemy') { this.kills++; this.gold += 12; }
        }
      }
      if (landed) { this.freezeFrame(80); if (this.cameras && this.cameras.main) this.cameras.main.shake(70, 0.004); }
      return landed;
    },

    // FADE (pit.js fade): the lich's PORTAL replacement — slip five seconds beyond reach (ten on the
    // DREADBINDER-lich road) where only summoning is allowed. Reuses the ward i-frame untargetability.
    fade: function () {
      var p = this.player;
      if (!p || p.dead || p.dying || (p.portalCd || 0) > 0) return;
      p.portalCd = FADE_CD;
      p.wardT = (this.road === 'binder') ? FADE_T_BINDER : FADE_T_BASE;   // untargetable window
      if (this.fx) this.fx.burst(p.x, p.depth - (p.h || 200) * 0.5, 0x9af0c0, 26);
      if (this.cameras && this.cameras.main) this.cameras.main.flash(160, 120, 200, 150);
    },

    // swap the on-screen ability button captions (pit.js setBtnLabel/updateLabels): in lich form the
    // verbs read SCYTHE / FADE; otherwise the warlock's ATK / WARD. Guarded DOM write (headless-safe).
    updateLabels: function () {
      var lich = this.lich, arch = this.inDevil(), set = function (id, txt) {
        try {
          var el = (typeof document !== 'undefined') && document.getElementById(id);
          if (el) el.textContent = txt;
        } catch (e) {}
      };
      set('btnAtk', lich ? 'SCYTHE' : (arch ? 'CLAW' : 'ATK'));
      set('btnWard', lich ? 'FADE' : 'WARD');
    },

    // clamp an actor into the playable band + world bounds (mirrors Actor.moveTo).
    clampBand: function (a) {
      var b = root.World.band;
      if (a.depth < b.far) a.depth = b.far;
      if (a.depth > b.near) a.depth = b.near;
      if (a.x < 30) a.x = 30;
      if (a.x > root.World.WORLD_W - 30) a.x = root.World.WORLD_W - 30;
    },

    // is incoming damage to `t` blocked? the warded player is untouchable (pit.js wardT).
    wardBlocks: function (t) {
      if (t === this.player && (this.player.wardT || 0) > 0) {
        this.fx.burst(t.x, t.depth - (t.h || 200) * 0.5, 0x5ad2ff, 10);   // WARDED spark
        return true;
      }
      return false;
    },

    // launch a fire bolt from `a` toward `foe` (straight, no homing — DC style).
    castBolt: function (a, foe) {
      var conf = BOLT[a.type] || BOLT.succubus;
      var sheol = !!a.boltSheol;                       // arch/herald succubus hurls green Sheol-fire
      var color = sheol ? SHEOL_COLOR : conf.color;
      var sx = a.x + a.facing * 26, sd = a.depth - (a.h || 200) * 0.34;
      var tx = foe.x, td = foe.depth - (foe.h || 200) * 0.34;
      var dx = tx - sx, dd = td - sd, len = Math.sqrt(dx * dx + dd * dd) || 1;
      var spd = a.boltSpeed || 430;
      a.facing = tx > a.x ? 1 : -1;
      this.fx.fire({ x: sx, depth: sd, vx: dx / len * spd, vy: dd / len * spd,
        life: 1.5, team: a.team, side: this.sideOf(a.team), dmg: a.dmg,
        type: a.type, owner: a, r: conf.r, color: color, sheol: sheol, arrow: !!a.arrow });
    },

    // bone-dragon acid/gas breath: lay a LINGERING ground cloud at the target's feet
    // (pit.js `zones.push({type:'gas'})`). It telegraphs, then ticks acid + paralysis
    // on every hostile standing inside it. Rules live in tickZones; fx.zone just draws.
    castGas: function (a, foe) {
      a.facing = foe.x > a.x ? 1 : -1;
      this.fx.zone({ x: foe.x, depth: foe.depth, r: GAS_R, tele: GAS_TELE, teleMax: GAS_TELE,
        life: GAS_LIFE, side: this.sideOf(a.team), owner: a, color: GAS_COLOR });
      this.fx.burst(a.x + a.facing * 28, a.depth - (a.h || 200) * 0.34, GAS_COLOR, 20);
    },

    // lingering-cloud DoT + paralysis: a live (post-telegraph) gas zone acid-ticks
    // every GAS_TICK and PARALYSES any hostile inside it (refreshed each frame, so it
    // wears off shortly after they leave). Drains hp directly (no flinch-clip spam,
    // like tickBurns) and credits enemy deaths. No friendly fire (side-checked).
    tickZones: function (dt) {
      var zs = this.fx.zones;
      for (var z = 0; z < zs.length; z++) {
        var zone = zs[z];
        if (zone.dead || zone.tele > 0) continue;       // still telegraphing = not yet harmful
        zone.tick = (zone.tick || 0) - dt;
        var doTick = false;
        if (zone.tick <= 0) { zone.tick = GAS_TICK; doTick = true; }
        var rx = zone.r, ry = zone.r * 0.55;
        for (var i = 0; i < this.actors.length; i++) {
          var t = this.actors[i];
          if (t.dead || t.dying) continue;
          if (this.sideOf(t.team) === zone.side) continue;          // no friendly fire
          var dx = (t.x - zone.x) / rx, dd = (t.depth - zone.depth) / ry;
          if (dx * dx + dd * dd > 1) continue;                       // outside the ellipse
          if (doTick) {
            t.hp -= GAS_DMG;
            if (Math.random() < 0.5)
              this.fx.burst(t.x + (Math.random() * 18 - 9), t.depth - (t.h || 200) * 0.4, GAS_COLOR, 9);
            if (t.hp <= 0) {
              t.hp = 0; t.dying = true; t.stagger = 1.0; t.play('die');
              if (t.team === 'enemy') { this.kills++; this.gold += 4; }
            }
          }
          if (!t.dying) t.stagger = Math.max(t.stagger || 0, GAS_STUN);  // paralytic while inside
        }
      }
    },

    // bolt impact: AoE damage + fire DoT to every hostile in the burst; succubus
    // bolts fire-heal their caster off the damage they deal (pit.js feedSuccubi).
    detonate: function (p, x, depth) {
      if (p.hex) { this.detonateHex(p, x, depth); return; }   // hex = single-target rot, not AoE fire
      if (p.arrow) { this.detonateArrow(p, x, depth); return; }   // bone arrow = single-target, no burn/AoE
      // ARCHFIEND ASCENDANT: Sheol/hellfire bursts wider (pit.js archfiend aoe ×1.5).
      var br = (p.sheol && this.evo20 === 'archfiend') ? BURST_R * ARCHFIEND_AOE : BURST_R;
      this.fx.burst(x, depth, p.color, (br > BURST_R) ? 48 : 36);
      var healed = 0;
      for (var i = 0; i < this.actors.length; i++) {
        var t = this.actors[i];
        if (t === p.owner || t.dead || t.dying) continue;
        if (this.sideOf(t.team) === p.side) continue;   // no friendly fire
        if (Math.abs(t.x - x) > br || Math.abs(t.depth - depth) > br * 0.7) continue;
        if (this.wardBlocks(t)) continue;                // warded player takes no bolt damage
        var pool = Math.min(t.hp, p.dmg);
        if (t.hurt(p.dmg, x)) {
          if (p.side === 'light') this.dmgPop(t, p.dmg, 'fire');   // our fire bolts pop orange
          healed += pool;
          if (p.sheol) {                                   // green Sheol-fire: 3x burn + spreads
            t.burn = Math.max(t.burn || 0, SHEOL_BURN_TIME);
            t.sheol = true; t.burnDps = BURN_DPS * SHEOL_MULT; t.burnSrcSide = p.side;
          } else {
            t.burn = Math.max(t.burn || 0, BURN_TIME);     // apply/refresh ordinary fire DoT
            if (!t.sheol) t.burnDps = BURN_DPS;             // never downgrade an active Sheol burn
          }
          if (t.team === 'enemy' && t.dying) { this.kills++; this.gold += 4; }
        }
      }
      if (p.type === 'succubus' && p.owner && !p.owner.dead && !p.owner.dying)
        p.owner.hp = Math.min(p.owner.maxhp, p.owner.hp + healed * SUCCUBUS_HEAL);
    },

    // hex-bolt impact (pit.js hexBolt): rot the struck foe with a single-target DoT —
    // no AoE, no fire-heal. Curses the nearest hostile to the impact point.
    detonateHex: function (p, x, depth) {
      this.fx.burst(x, depth, HEX_COLOR, 24);
      var best = null, bd = Infinity;
      for (var i = 0; i < this.actors.length; i++) {
        var t = this.actors[i];
        if (t === p.owner || t.dead || t.dying) continue;
        if (this.sideOf(t.team) === p.side) continue;          // no friendly fire
        if (Math.abs(t.x - x) > 44 || Math.abs(t.depth - depth) > 44) continue;
        var d = Math.abs(t.x - x) + Math.abs(t.depth - depth);
        if (d < bd) { bd = d; best = t; }
      }
      if (best) {
        // HEX FIEND (herald) road STACKS the hex on an already-hexed foe (pit.js: hexDmg+=15,
        // hexT=max(hexT,10), keep tick) — the rot deepens instead of just refreshing. Any other
        // road / un-evolved re-applies the base curse and RESETS hexJumps for a fresh contagion chain.
        if (this.road === 'herald' && best.hexT > 0) {
          best.hexDmg = (best.hexDmg || HEX_DMG) + HEX_DMG;
          best.hexT = Math.max(best.hexT, HEX_DOT_TIME);
          best.hexTick = best.hexTick || HEX_TICK;
        } else {
          best.hexT = HEX_DOT_TIME; best.hexDmg = HEX_DMG; best.hexTick = HEX_TICK; best.hexJumps = 0;
        }
        this.fx.burst(best.x, best.depth - (best.h || 200) * 0.4, HEX_COLOR, 16);
      }
    },

    // bone-arrow impact (pit.js bone archers: "minor harm from a careful distance"): a single
    // direct hit to the nearest hostile at the impact point — no AoE, no fire DoT. The summoner
    // road's ranged ground unit, distinct from the succubus/dragon fire.
    detonateArrow: function (p, x, depth) {
      this.fx.burst(x, depth, p.color, 8);
      var best = null, bd = Infinity;
      for (var i = 0; i < this.actors.length; i++) {
        var t = this.actors[i];
        if (t === p.owner || t.dead || t.dying) continue;
        if (this.sideOf(t.team) === p.side) continue;          // no friendly fire
        if (Math.abs(t.x - x) > ARROW_HIT_R || Math.abs(t.depth - depth) > ARROW_HIT_R) continue;
        var d = Math.abs(t.x - x) + Math.abs(t.depth - depth);
        if (d < bd) { bd = d; best = t; }
      }
      if (best && !this.wardBlocks(best) && best.hurt(p.dmg, x)) {
        if (p.side === 'light') this.dmgPop(best, p.dmg);   // bone-arrow score juice (our archers)
        if (best.team === 'enemy' && best.dying) { this.kills++; this.gold += 4; }
      }
    },

    // hex rot DoT: drains hp on a fixed cadence WITHOUT re-triggering the flinch clip
    // (hexed foes keep acting, like burns), throws purple sparks, credits enemy hex-deaths.
    tickHex: function (dt) {
      for (var i = 0; i < this.actors.length; i++) {
        var a = this.actors[i];
        if (!a.hexT || a.hexT <= 0 || a.dead || a.dying) continue;
        a.hexT = Math.max(0, a.hexT - dt);
        a.hexTick = (a.hexTick || HEX_TICK) - dt;
        if (a.hexTick <= 0) {
          a.hexTick += HEX_TICK;
          a.hp -= (a.hexDmg || HEX_DMG);
          this.fx.burst(a.x + (Math.random() * 18 - 9), a.depth - (a.h || 200) * 0.4, HEX_COLOR, 8);
          if (a.team === 'enemy') this.dmgPop(a, (a.hexDmg || HEX_DMG), 'hex');   // visible plague drain (purple)
          if (a.hp <= 0) {
            a.hp = 0; a.dying = true; a.stagger = 1.0; a.play('die');
            if (a.team === 'enemy') { this.kills++; this.gold += 4; }
          }
        }
        if (a.hexT === 0) { a.hexDmg = 0; }                    // curse ran out cleanly
      }
    },

    // WARLOCK CONTAGION (pit.js killEnemy): a hex that kills its HOST before its timer expires
    // LEAPS to the nearest living foe — damage DOUBLES and the remaining timer GROWS by +5s each
    // jump, so a well-placed hex chains through a pack. Central death-pass (mirrors pit.js's single
    // killEnemy site): catches a hexed foe killed by ANY source this frame (melee, fire, gas, the
    // hex tick itself), each leaping exactly once via the `_hexLeapt` guard.
    tickContagion: function () {
      for (var i = 0; i < this.actors.length; i++) {
        var a = this.actors[i];
        if (!a.dying || a._hexLeapt || !(a.hexT > 0)) continue;
        a._hexLeapt = true;
        this.hexContagion(a);
        a.hexT = 0; a.hexDmg = 0;                              // mark spent (pit.js clears the host)
      }
    },

    // leap the dying foe's hex to the nearest living same-side foe (pit.js: nearest in `enemies`,
    // no range cap). ×2 cumulative damage per jump, +5s remaining time (added, never reset),
    // hexJumps++ for the CONTAGION xN readout.
    hexContagion: function (src) {
      var best = null, bd = Infinity;
      for (var i = 0; i < this.actors.length; i++) {
        var t = this.actors[i];
        if (t === src || t.dead || t.dying) continue;
        if (this.sideOf(t.team) !== this.sideOf(src.team)) continue;   // leap among the host's own side
        var d = Math.abs(t.x - src.x) + Math.abs(t.depth - src.depth);
        if (d < bd) { bd = d; best = t; }
      }
      if (!best) return;
      best.hexDmg = (src.hexDmg || HEX_DMG) * 2;     // x2 cumulative per jump
      best.hexT = (src.hexT || 0) + 5;                // ADD 5s of remaining time, never reset
      best.hexTick = HEX_TICK;
      best.hexJumps = (src.hexJumps || 0) + 1;
      this.fx.burst(best.x, best.depth - (best.h || 200) * 0.4, HEX_COLOR, 18);
    },

    // advance live bolts: detonate on the first hostile hit or at world edge.
    stepProjectiles: function () {
      var bolts = this.fx.bolts;
      for (var i = 0; i < bolts.length; i++) {
        var p = bolts[i];
        if (p.dead) continue;
        if (p.x < 4 || p.x > root.World.WORLD_W - 4) { this.detonate(p, p.x, p.depth); p.dead = true; continue; }
        for (var k = 0; k < this.actors.length; k++) {
          var t = this.actors[k];
          if (t === p.owner || t.dead || t.dying) continue;
          if (this.sideOf(t.team) === p.side) continue;
          if (Math.abs(t.x - p.x) > 30 || Math.abs(t.depth - p.depth) > 34) continue;
          this.detonate(p, p.x, p.depth); p.dead = true; break;
        }
      }
    },

    // fire DoT: drains hp without re-triggering the flinch clip (so burning
    // foes keep acting), throws ember sparks, and credits enemy burn-deaths.
    tickBurns: function (dt) {
      for (var i = 0; i < this.actors.length; i++) {
        var a = this.actors[i];
        if (!a.burn || a.dead || a.dying) continue;
        a.burn = Math.max(0, a.burn - dt);
        a.hp -= (a.burnDps || BURN_DPS) * dt;
        // throttled fire score-juice: bank this frame's burn damage, pop the sum on the cadence
        // (enemy-only — DC juices the player's offense; per-frame popping would spam a number/frame).
        if (a.team === 'enemy') {
          a._burnPopAcc = (a._burnPopAcc || 0) + (a.burnDps || BURN_DPS) * dt;
          a._burnPopT = (a._burnPopT == null ? BURN_POP_EVERY : a._burnPopT) - dt;
          if (a._burnPopT <= 0) {
            if (a._burnPopAcc >= 1) this.dmgPop(a, a._burnPopAcc, 'fire');
            a._burnPopAcc = 0; a._burnPopT = BURN_POP_EVERY;
          }
        }
        if (a.burn === 0) { a.sheol = false; a.burnDps = 0; }   // burn ran out cleanly
        if (Math.random() < 0.10)
          this.fx.burst(a.x + (Math.random() * 20 - 10), a.depth - (a.h || 200) * 0.4,
            a.sheol ? SHEOL_COLOR : 0xff5a2a, 9);
        if (a.hp <= 0) {
          a.hp = 0; a.dying = true; a.stagger = 1.0; a.play('die');
          if (a.team === 'enemy') { this.kills++; this.gold += 4; }
          if (a.sheol) this.spreadSheol(a);                 // green fire jumps to a fresh foe
        }
      }
    },

    // green Sheol-fire spread: when a Sheol-burning foe dies, the flame LEAPS to the
    // nearest fresh (not-yet-Sheol-burning) hostile of the caster, with +5s bonus burn.
    spreadSheol: function (src) {
      var best = null, bd = Infinity;
      for (var i = 0; i < this.actors.length; i++) {
        var t = this.actors[i];
        if (t === src || t.dead || t.dying || t.sheol) continue;     // skip already-green foes
        if (this.sideOf(t.team) === src.burnSrcSide) continue;        // only the caster's enemies
        var d = Math.abs(t.x - src.x) + Math.abs(t.depth - src.depth);
        if (d < bd) { bd = d; best = t; }
      }
      if (!best || bd > SHEOL_JUMP_R) return;
      best.sheol = true;
      best.burn = Math.max(best.burn || 0, SHEOL_BURN_TIME + SHEOL_JUMP_BONUS);  // +5s/jump
      best.burnDps = BURN_DPS * SHEOL_MULT;
      best.burnSrcSide = src.burnSrcSide;
      this.fx.burst(best.x, best.depth - (best.h || 200) * 0.4, SHEOL_COLOR, 32);
    },

    // summonDemons — FREELY raise ally-team demons that fight the wave (pit.js: no MP/HP/gold cost).
    // (pit.js parity: claw-fiend + bone dragon + succubus coven; cap 12, oldest dissolves; each has a
    // `life` timeout set below so the horde decays and must be re-cast — see tickUpkeep.)
    summonDemons: function () {
      if (!this.player || this.player.dead) return;   // FREE (pit.js): gated only by cap 12 + life timeouts
      var self = this, px = this.player.x, pd = this.player.depth, defs = [];
      var mul = this.hordeMul();                 // evolution-road horde scaling (×1 un-evolved)
      var dl = this.demonLord;                    // Demon Lord: every succubus is arch + bursts on appear

      // bone dragons: maintain `mul.cnt` live ones (binder ×2 / Demon Lord ×3); binder dragons
      // are the BLACK DRAGON (×1.7 hp). Summon only the deficit so re-casts don't over-stack.
      var liveDragons = this.actors.filter(function (a) {
        return a.team === 'ally' && a.type === 'dragon' && !a.dead && !a.dying;
      }).length;
      var dragonHp = 90 * (this.road === 'binder' ? BIND_DRAGON_HP : 1) * mul.tough;
      var dragonTarget = mul.cnt + mul.dragonAdd;   // LICH SOVEREIGN: +2 phylactery dragons
      if (this._json.dragon)
        for (var dgn = liveDragons; dgn < dragonTarget; dgn++)
          defs.push({ type: 'dragon', plan: 'QUADRUPED', json: this._json.dragon,
            dmg: 22 * mul.dmg, scale: 1.9 * mul.size, hp: dragonHp });

      // CLAW-FIEND brutes: a melee aggro/shove TANK that thickens the front line so the coven
      // + dragon fire from behind it (pit.js summonDemons('brute')). Maintain `mul.cnt` live ones
      // (base 1 / binder|herald 2 / Demon Lord 3); hp 30 + kills*5, herald ×1.35 tough. Token shove
      // damage 1 (herald 2) × binder ×3 — the value is the shove, not the chip.
      var liveBrutes = this.actors.filter(function (a) {
        return a.team === 'ally' && a.type === 'brute' && !a.dead && !a.dying;
      }).length;
      var bruteHp = Math.round((30 + this.kills * 5) * mul.tough);
      var bruteDmg = (this.road === 'herald' ? BRUTE_TOKEN_HERALD : 1) * mul.dmg;
      if (this._json.brute)
        for (var bf = liveBrutes; bf < mul.cnt; bf++)
          defs.push({ type: 'brute', plan: 'BIPED', json: this._json.brute,
            dmg: bruteDmg, scale: BRUTE_SCALE * mul.size, hp: bruteHp, brute: true });

      // coven: pit.js baseline 3 succubi, scaled ×mul.cnt (binder SIX / Demon Lord NINE).
      // Un-evolved: one rises as the arch (green Sheol-fire). Demon Lord: ALL arch.
      var coven = 3 * mul.cnt;
      for (var i = 0; i < coven; i++) {
        var arch = dl || i === 0;
        defs.push({ type: 'succubus', plan: 'WINGED', json: this._json.succubus,
          dmg: (arch ? 16 : 13) * mul.dmg, scale: (arch ? 0.92 : 0.85) * mul.size,
          hp: Math.round((arch ? 55 : 45) * mul.tough), arch: arch, archBurst: dl });   // archBurst = blow once on appear
      }

      defs.forEach(function (d, i) {
        var a = new root.Actor(self, { type: d.type, plan: d.plan, json: d.json, team: 'ally',
          x: px - 50 + (i % 6) * 36, depth: pd + ((i % 2) ? 22 : -22),
          hp: d.hp, scale: d.scale, dmg: d.dmg });
        a.facing = 1; a.atkCd = 0.3 + Math.random() * 0.4;
        a.life = LIFE[d.type] || 16;   // pit.js per-summon timeout (decays in tickUpkeep; re-cast to hold)
        // succubus coven + bone dragon cast fire bolts at range (their core identity)
        if (d.type === 'succubus') {
          a.ranged = true; a.boltSpeed = 440; a.fireCd = 1.4;
          if (d.arch) { a.boltSheol = true; a.fireCd = 1.7; }   // arch: green Sheol-fire, slower cadence
          if (d.archBurst) { a.archBurst = true; a.archT = ARCH_FUSE_MIN + Math.random() * (ARCH_FUSE_MAX - ARCH_FUSE_MIN); }
        } else if (d.type === 'dragon') {
          a.ranged = true; a.boltSpeed = 380; a.fireCd = 2.0;
          a.laysGas = true; a.gasEvery = GAS_EVERY; a.gasCd = 1.2;  // lingering acid breath cloud
        } else if (d.brute) {
          a.brute = true;                    // melee aggro/shove tank (bruteShove on swing)
        }
        a.stagger = 0.4; a.play('spawn');   // spawn clip plays before AI takes over
        self.actors.push(a);
      });
      this.enforceAllyCap();
      // pit.js "he was never summoning FOR himself": raising the coven at level 8+ BORROWS the arch-devil
      // shape (the lv8 TIMED form). Gated inside enterDevil (level/form/cooldown) so it never spams.
      this.enterDevil();
    },

    // summonUndead — raise the GROUND foot-horde (pit.js summonZombies + summonArchers):
    // SHAMBLERS (melee meat that take blows) + BONE ARCHERS (ranged, minor harm at distance).
    // Road-scaled like pit.js (base / DREADBINDER ×2 + ×1.45 size + ×3 dmg / LICH SOVEREIGN ×3 count),
    // and hp grows with kills so the army swells mid-run. Distinct from the flying/casting coven.
    summonUndead: function () {
      if (!this.player || this.player.dead) return;   // FREE (pit.js): gated only by cap 12 + life timeouts
      var self = this, px = this.player.x, pd = this.player.depth, defs = [];
      var binder = this.road === 'binder', lich = this.evo20 === 'lichlord';
      var sizeMul = binder ? BIND_SIZE : 1;                          // pit.js _bR
      var dmgMul  = binder ? BIND_DMG : 1;                           // pit.js _bM
      var tough   = this.road === 'herald' ? HERALD_TOUGH : 1;       // HEX FIEND: tougher undead too

      // SHAMBLERS: count base 3 / binder 6 / lichlord 9 (pit.js summonZombies _zn); hp 25 + kills*4.
      var zn = lich ? 9 : (binder ? 6 : 3);
      var zHp = Math.round((25 + this.kills * 4) * tough);
      if (this._json.shambler)
        for (var z = 0; z < zn; z++)
          defs.push({ type: 'shambler', plan: 'BIPED', json: this._json.shambler,
            dmg: SHAMBLER_DMG * dmgMul, scale: SHAMBLER_SCALE * sizeMul, hp: zHp });

      // BONE ARCHERS: count base 2 / binder 4 / lichlord 6 (pit.js summonArchers _slots); hp 15 + kills*3.
      var an = lich ? 6 : (binder ? 4 : 2);
      var aHp = Math.round((15 + this.kills * 3) * tough);
      if (this._json.archer)
        for (var ar = 0; ar < an; ar++)
          defs.push({ type: 'archer', plan: 'BIPED', json: this._json.archer,
            dmg: ARCHER_DMG * dmgMul, scale: ARCHER_SCALE * sizeMul, hp: aHp, ranged: true });

      if (!defs.length) return;
      defs.forEach(function (d, i) {
        var a = new root.Actor(self, { type: d.type, plan: d.plan, json: d.json, team: 'ally',
          x: px - 44 + (i % 6) * 34, depth: pd + ((i % 2) ? 28 : -28),
          hp: d.hp, scale: d.scale, dmg: d.dmg });
        a.facing = 1; a.atkCd = 0.3 + Math.random() * 0.5;
        a.life = LIFE[d.type] || 24;   // pit.js zombie/archer timeout (life:24; decays in tickUpkeep)
        if (d.ranged) {                                  // bone archers loose arrows from a standoff
          a.ranged = true; a.arrow = true; a.boltSpeed = ARROW_SPEED; a.fireCd = 1.8;
        }
        a.stagger = 0.4; a.play('spawn');
        self.actors.push(a);
      });
      if (this.cameras && this.cameras.main) this.cameras.main.flash(160, 90, 150, 110);
      this.enforceAllyCap();
    },

    // cap allies at ALLY_CAP; the oldest dissolves (dies) past the cap.
    enforceAllyCap: function () {
      var allies = [];
      for (var i = 0; i < this.actors.length; i++) {
        var a = this.actors[i];
        if (a.team === 'ally' && !a.dead && !a.dying) allies.push(a);
      }
      while (allies.length > ALLY_CAP) {
        var old = allies.shift();
        old.dying = true; old.stagger = 1.0; old.play('die');
      }
    },

    // SUMMON UPKEEP (pit.js: `d.life-=dt; if(d.life<=0) leafBurst+dissolve`). Every summoned ally
    // burns down its `life` clock and DISSOLVES at zero, so the horde is not spam-once-permanent —
    // the warlock must RE-CAST to keep the screen. Two pit.js exceptions: the LICH SOVEREIGN
    // phylactery FREEZES risen dragons (no decay) and the HEX-FIEND/herald coven NEVER times out.
    tickUpkeep: function (dt) {
      var lich = this.evo20 === 'lichlord', herald = this.road === 'herald';
      for (var i = 0; i < this.actors.length; i++) {
        var a = this.actors[i];
        if (a.team !== 'ally' || a.dead || a.dying || a.life == null) continue;
        if (lich && a.type === 'dragon') continue;        // phylactery freezes the risen dragon
        if (herald && a.type === 'succubus') continue;     // herald coven never expires
        a.life -= dt;
        if (a.life <= 0) {
          a.life = 0; a.dying = true; a.stagger = 1.0; a.play('die');
          this.fx.burst(a.x, a.depth - (a.h || 200) * 0.4, PORTAL_COLOR, 14);   // purple leafBurst (pit.js)
        }
      }
      // PHYLACTERY (pit.js): while risen the lich's bone dragons freeze (above) and ARE his life —
      // once he has raised at least one, if every dragon FALLS the pact breaks and the form shatters.
      if (this.lich) {
        var liveDragons = 0;
        for (var d = 0; d < this.actors.length; d++) {
          var ad = this.actors[d];
          if (ad.team === 'ally' && ad.type === 'dragon' && !ad.dead && !ad.dying) liveDragons++;
        }
        if (liveDragons > 0) this._phylactery = Math.max(this._phylactery, liveDragons);
        else if (this._phylactery > 0) this.lichPerish();
      }
    },

    update: function (time, deltaMs) {
      var dt = Math.min(deltaMs / 1000, 0.05);
      var p = this.player;

      // --- HIT-STOP: hold the frame for a few ms after a player-involved blow (DC impact weight).
      // The sim doesn't advance; the last-rendered frame persists, only the HUD/bars refresh. ---
      if (this.hitStop > 0) {
        this.hitStop -= deltaMs;
        this.drawHud(); this.drawBars();
        return;
      }

      // --- EVOLUTION-ROAD card screen: freeze the whole sim while a choice is open ---
      if (this.evoPick) {
        this.evoPickT = Math.max(0, this.evoPickT - dt);
        this.handleEvoInput();
        if (this.evoPick && this.evoPickT <= 0) this.pickEvo(0);   // no input -> default to road 1
        if (this.evoPick) { this.drawEvoPanel(); return; }          // still open -> hold the frozen frame
      }

      // --- player control -------------------------------------------------
      if (p && !p.dead) {
        p.hexCd = Math.max(0, (p.hexCd || 0) - dt);          // HEX bolt cooldown
        p.portalCd = Math.max(0, (p.portalCd || 0) - dt);    // PORTAL cooldown
        p.wardT = Math.max(0, (p.wardT || 0) - dt);          // damage-immunity ward
        this.devilCd = Math.max(0, (this.devilCd || 0) - dt);   // lv8 devil re-trigger cooldown
        if (this.devilT > 0) { this.devilT = Math.max(0, this.devilT - dt); if (this.devilT === 0) this.archDevilOutro(); }  // borrow expires -> taunt -> Demon Lord (herald) / cast-down Lich (base/binder)
        var T = root.__TOUCH__ || {};                        // on-screen touch input (arena.html)
        if (Phaser.Input.Keyboard.JustDown(this.keys.K) || T._summonEdge) { this.summonDemons(); T._summonEdge = false; }
        if (Phaser.Input.Keyboard.JustDown(this.keys.L) || T._undeadEdge) { this.summonUndead(); T._undeadEdge = false; }
        if (Phaser.Input.Keyboard.JustDown(this.keys.H) || T._hexEdge) { this.castHex(); T._hexEdge = false; }
        if (Phaser.Input.Keyboard.JustDown(this.keys.P) || T._portalEdge) { this.castPortal(); T._portalEdge = false; }
        p.stagger = Math.max(0, (p.stagger || 0) - dt);
        if (p.stagger > 0) {
          p.reactTick();   // advance the knockdown chain (or settle to idle) while staggered
        } else {
          var k = this.keys, dx = 0, dd = 0;
          // hold SHIFT (or touch sprint) to DASH — run gait at SPRINT_MULT speed (DC dash).
          var sprinting = (k.SHIFT.isDown || !!T.sprint);
          var msp = sprinting ? SPEED * SPRINT_MULT : SPEED;
          if (k.A.isDown || k.LEFT.isDown) dx -= msp * dt;
          if (k.D.isDown || k.RIGHT.isDown) dx += msp * dt;
          if (k.W.isDown || k.UP.isDown) dd -= msp * 0.7 * dt;
          if (k.S.isDown || k.DOWN.isDown) dd += msp * 0.7 * dt;
          if (T.dx) dx += T.dx * msp * dt;                    // touch stick (analog L/R)
          if (T.dy) dd += T.dy * msp * 0.7 * dt;              // touch stick (analog depth)
          var attacking = (k.SPACE.isDown || k.J.isDown || !!T.attack);
          if (attacking && p.rig.action !== 'attack') {
            p.play('attack'); p.swingHit = false;
            // dash-attack: a swing started WHILE DASHING (sprint + a move direction) lunges forward
            // with the momentum — face the move, hop DASH_LUNGE px ahead, trail a violet dash spark.
            p._dashStrike = sprinting && (dx !== 0 || dd !== 0);
            if (p._dashStrike) {
              if (dx) p.facing = dx > 0 ? 1 : -1;
              p.x += p.facing * DASH_LUNGE; this.clampBand(p);
              this.fx.burst(p.x - p.facing * 20, p.depth - (p.h || 200) * 0.4, 0xc9a0ff, 12);
            }
          }
          else if (!attacking) {
            if (dx || dd) {
              p.moveTo(dx, dd);
              var gait = (sprinting ? 'run' : 'walkF');        // DASH swaps to the run clip
              if (p.rig.action !== gait) p.play(gait);
            }
            else if (p.rig.action === 'walkF' || p.rig.action === 'run') p.play('idle');
          }
          // melee connect: damage enemies in front, once per swing
          if (p.rig.action === 'attack' && !p.swingHit) {
            p.swingHit = true;
            // a dash-strike reaches further for this ONE connect — bump reach around the resolution,
            // then restore (non-dash path never touches p.reach, so a form's set reach is preserved).
            var _dashReach = p._dashStrike ? p.reach : null;
            if (p._dashStrike) p.reach += DASH_REACH_BONUS;
            // form-swaps route the light attack: LICH -> SCYTHE (lichSlash), ARCHFIEND -> CLAW (devilClaw);
            // otherwise the normal melee. A landed swing bumps the combo + gold (DC combo meter).
            var hit = this.lich ? this.lichSlash(p)
                    : (this.inDevil() ? this.devilClaw(p) : this.meleeHit(p, PLAYER_DMG, p._dashStrike));
            if (_dashReach != null) p.reach = _dashReach;   // restore the form/base reach
            p._dashStrike = false;
            if (hit) { this.combo++; this.comboT = COMBO_DECAY; this.gold += 3; }   // landed hit refreshes the decay clock
          }
          if (p.rig.action === 'attack' && p.rig.done) p.play('idle');
        }
      }

      // --- NPC seek-and-attack AI (enemy wave + ally summons) -------------
      // same brain for both sides; nearestHostile picks the target, meleeHit
      // applies damage by side, so summons fight the wave alongside the player.
      for (var i = 0; i < this.actors.length; i++) {
        var a = this.actors[i];
        if (a === p || a.dead) continue;
        if (a.team === 'enemy') this.npcAI(a, dt, ENEMY_SPEED);
        else if (a.team === 'ally') this.npcAI(a, dt, ALLY_SPEED);
      }

      // --- projectiles + fire DoT ----------------------------------------
      this.fx.move(dt);          // advance bolts + age impact flashes + age ground zones
      this.stepProjectiles();    // collision -> AoE burst + apply burn
      this.tickBurns(dt);        // fire damage-over-time + ember sparks
      this.tickUpkeep(dt);       // pit.js per-summon life timeouts: the horde decays + must be re-cast
      this.tickHex(dt);          // hex rot DoT (player curse) + purple sparks
      this.tickZones(dt);        // lingering acid/gas clouds: paralysis + acid DoT
      this.tickContagion();      // a hexed foe killed by ANY source this frame leaps the curse onward
      this.killSpark();          // gold kill-confirm pop on any enemy that went down this frame
      this.fx.draw();            // render zones (below) + bolts + flashes additively

      // advance every rig + depth sort
      for (var j = 0; j < this.actors.length; j++) this.actors[j].update(dt);
      this.landSplat();          // dust pop on any juggled foe that touched down this frame

      // --- wave clear -> next wave ----------------------------------------
      var alive = 0;
      for (var w = 0; w < this.actors.length; w++) {
        var e = this.actors[w]; if (e.team === 'enemy' && !e.dead) alive++;
      }
      if (alive === 0 && p && !p.dead) {
        this.waveCd += dt;
        if (this.waveCd > 1.6) { this.waveCd = 0; this.nextWave(); }
      } else this.waveCd = 0;

      // COMBO DECAY: the DC combo meter lapses after COMBO_DECAY seconds without a fresh player hit.
      if (this.combo > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }

      this.tickCameraZoom(dt);  // DC "screen breathes": punch in on a tight cluster, ease out as the wave fans
      this.tickProgression();   // kills -> level -> evolution road (escalates the horde)
      this.tickBanner(dt);      // DC wave-callout banner fade envelope
      this.drawHud();
      this.drawBars();
      this.refreshAudit();
    },

    // DYNAMIC CAMERA ZOOM (Dragon's-Crown "the screen breathes with the brawl"):
    // measure the live HORIZONTAL SPREAD of the fight (player + every living hostile)
    // and PUNCH IN on a tight cluster, easing back toward the base FIT framing as the
    // wave fans across the wider-than-screen pit. Zoom only TIGHTENS from 1.0 (never
    // below it) so we never reveal the pit's vertical edges past WORLD_H. Pure feel —
    // reads only actor x/team/dead, calls cameras.main.setZoom; no kit/parity/sim touch.
    tickCameraZoom: function (dt) {
      var cam = this.cameras && this.cameras.main; if (!cam || !cam.setZoom) return;
      var minX = Infinity, maxX = -Infinity, n = 0, p = this.player;
      if (p && !p.dead) { minX = maxX = p.x; n = 1; }
      for (var i = 0; i < this.actors.length; i++) {
        var a = this.actors[i];
        if (a.team !== 'enemy' || a.dead || a.dying) continue;
        if (a.x < minX) minX = a.x;
        if (a.x > maxX) maxX = a.x;
        n++;
      }
      var spread = (n >= 2) ? (maxX - minX) : 0;
      // spread 180..900 px -> zoom 1.16 (tight cluster, punched in) .. 1.00 (wide, base FIT)
      var f = Math.max(0, Math.min(1, (spread - 180) / (900 - 180)));
      var target = 1.16 - 0.16 * f;
      if (this.camZoom == null) this.camZoom = target;
      this.camZoom += (target - this.camZoom) * Math.min(1, dt * 2.2);   // damped ease, no per-frame jitter
      cam.setZoom(this.camZoom);
    },

    // WAVE BANNER (DC stage callout): show a large title for a wave. Pure UI/feel —
    // no kit, parity, or sim change. Reuses one text object; tickBanner runs the fade.
    showBanner: function (text) {
      if (!this.banner) return;
      this.banner.setText(text).setVisible(true).setAlpha(0);
      this.bannerT = BANNER_T;
    },

    // advance the wave-banner fade envelope (fade-in .25s, hold, fade-out .6s).
    tickBanner: function (dt) {
      if (!this.banner || this.bannerT <= 0) return;
      this.bannerT = Math.max(0, this.bannerT - dt);
      var el = BANNER_T - this.bannerT, a = 1;            // elapsed since shown
      if (el < 0.25) a = el / 0.25;                       // fade in
      else if (this.bannerT < 0.6) a = this.bannerT / 0.6;   // fade out
      this.banner.setAlpha(Math.max(0, Math.min(1, a)));
      if (this.bannerT === 0) this.banner.setVisible(false);
    },

    drawHud: function () {
      var h = this.hud; if (!h) return;
      h.clear();
      var p = this.player; if (!p) return;
      // player HP bar (DC style). No MP bar: pit.js summons are FREE (no mana) — the warlock's
      // resource is the horde's `life` upkeep (shown as Demons N/cap + the per-ally HP bars).
      h.fillStyle(0x000000, 0.45); h.fillRect(10, 6, 230, 34);
      h.fillStyle(0x401015, 1); h.fillRect(14, 24, 200, 11);
      h.fillStyle(0xd8324a, 1); h.fillRect(14, 24, 200 * Math.max(0, p.hp / p.maxhp), 11);
      var demons = 0;
      for (var i = 0; i < this.actors.length; i++) {
        var a = this.actors[i];
        if (a.team === 'ally' && !a.dead && !a.dying) demons++;
      }
      var hexState = (p.hexCd > 0) ? ('HEX ' + Math.ceil(p.hexCd) + 's') : 'HEX rdy';
      // LICH form swaps the PORTAL/WARD readout to FADE (pit.js label swap).
      var wardName = this.lich ? 'FADE' : 'WARD', portName = this.lich ? 'FADE' : 'PORTAL';
      var wardState = (p.wardT > 0) ? (wardName + ' ' + Math.ceil(p.wardT) + 's')
        : ((p.portalCd > 0) ? (portName + ' ' + Math.ceil(p.portalCd) + 's') : (portName + ' rdy'));
      var lichState = this.lich ? ('   PHYLACTERY ' + this._phylactery) : '';
      var devilState = (this.devilT > 0) ? ('   DEVIL ' + Math.ceil(this.devilT) + 's') : '';
      var formTag = this.lich ? ' [LICH]' : (this.archfiend ? ' [ARCHFIEND]' : (this.devilT > 0 ? ' [ARCH DEVIL]' : ''));
      this.hudText.setText((this.roadName || 'WARLOCK') + formTag + '  Lv ' + this.level +
        '   Wave ' + this.waveN + '   Demons ' + demons + '/' + ALLY_CAP +
        '   Combo ' + this.combo + '   Gold ' + this.gold + '   ' + hexState + '   ' + wardState + lichState + devilState);
    },

    drawBars: function () {
      var b = this.bars; if (!b) return; b.clear();
      // PORTAL ward: a pulsing cyan i-frame ring around the player while untouchable.
      var p = this.player;
      if (p && !p.dead && (p.wardT || 0) > 0) {
        var t = this.time.now / 1000, puls = 0.55 + 0.25 * Math.sin(t * 9);
        var cy = p.depth - (p.h || 200) * 0.5, rr = (p.h || 200) * 0.42;
        b.lineStyle(3, 0x5ad2ff, puls); b.strokeEllipse(p.x, cy, rr * 1.5, rr * 2.0);
        b.lineStyle(1, 0xbfeaff, puls * 0.8); b.strokeEllipse(p.x, cy, rr * 1.2, rr * 1.6);
      }
      for (var i = 0; i < this.actors.length; i++) {
        var a = this.actors[i];
        if (a === this.player || a.dead || a.dying) continue;
        if (a.team !== 'enemy' && a.team !== 'ally') continue;
        var bx = a.x - 24, by = a.depth - (a.h || 200) - 6, frac = Math.max(0, a.hp / a.maxhp);
        var ally = a.team === 'ally';
        b.fillStyle(0x000000, 0.5); b.fillRect(bx - 1, by - 1, 50, 6);
        b.fillStyle(ally ? 0x10303a : 0x6a1020, 1); b.fillRect(bx, by, 48, 4);
        b.fillStyle(ally ? 0x4ad0ff : 0xff5a4a, 1); b.fillRect(bx, by, 48 * frac, 4);
      }
    },

    refreshAudit: function () {
      var ents = [];
      for (var i = 0; i < this.actors.length; i++) ents.push(this.actors[i].audit());
      root.__AUDIT__.entities = ents;
      root.__AUDIT__.wave = this.waveN;
      root.__AUDIT__.kills = this.kills;
      root.__AUDIT__.level = this.level;
      root.__AUDIT__.road = this.roadName || null;
      root.__AUDIT__.lich = !!this.lich;
      root.__AUDIT__.archfiend = !!this.archfiend;
      root.__AUDIT__.devilT = this.devilT || 0;
      root.__AUDIT__.devoured = this.devoured || 0;
      root.__AUDIT__.phylactery = this._phylactery || 0;
      root.__AUDIT__.evoOpen = !!this.evoPick;
      root.__AUDIT__.zoom = this.camZoom || 1;
      root.__AUDIT__.rigged = (root.__riggedEntities && root.__riggedEntities()) || {};
    }
  };

  root.ArenaScene = ArenaScene;

  root.bootArena = function () {
    return new Phaser.Game({
      type: Phaser.AUTO,
      backgroundColor: '#0d0913', pixelArt: false,
      // DC plays fullscreen: FIT the fixed 16:9 art into the viewport (letterboxed,
      // aspect preserved) and re-center on resize — no black margins off a 960x540 island.
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game',
        width: 960,
        height: 540
      },
      physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
      scene: ArenaScene
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
