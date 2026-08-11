/* run.js — the persistent run: deck, HP, map, position, ACT. One run = the whole road:
   the Pit -> the City -> the West Road -> Varenholm. Story/voice per act follows the
   original pit game (see docs/LORE_BIBLE.md + voice_manifest on Hiro's PC; src/voice.js). */
window.Spire = window.Spire || {};

/* ---- the three acts of the warlock's road (2026-08-06 story rewrite: the
   Karridge arm of the Ankuspawn Conspiracy, twenty years after Book 4 —
   see src/voice.js header and docs/LORE_BIBLE.md) ---- */
Spire.ACTS = {
  1: {
    name: "T H E   S P I R E  —  T H E   P I T",
    tag: "ACT I — THE PIT OF KARRIDGE",
    music: "w_pit",
    safeNode: "tavern",
    fightPool: ["skel", "hound", "brute"], elitePool: ["beast"], boss: "master",   // ordered easy -> hard
    mapBg: "bg_far_1",
    intro: ["n_bio", "m_champion", "w_act1_intro"],   // the era + her; Marlow: the vanished champion; her read
    mapVO: "n_gate",                            // the pit gate
    bossVO: "w_boss1",                          // "Show me the ledger..."
    clearTitle: "THE  PIT  IS  CLEARED",
    clearText: "the Hound Master's horn lies silent — but somebody's grey book still holds the champion's number",
    outro: ["m_warning", "w_act1_out"]          // Marlow: they're asking after YOU; "books have addresses"
  },
  2: {
    name: "T H E   C I T Y  —  T H E   B A C K   A L L E Y S",
    tag: "ACT II — KARRIDGE, WEST WALL",
    music: "w_city",
    safeNode: "inn",
    fightPool: ["hook", "gunner", "stitch"], elitePool: ["grave", "proctor"], boss: "necro",
    mapBg: "bg_alleys_far_1",
    /* 2026-08-11 inn rework: Marlow's back-room exposition (the three vanishings,
       the new moon, the wagons west) now plays HERE as story — the inn itself is
       just an innkeeper and a bed, per Hiro */
    intro: ["m_backroom"],
    mapVO: "n_well",                            // plaza of the nameless
    bossVO: "w_boss2",                          // "Open the crates, necromancer."
    clearTitle: "THE  ALLEYS  RUN  QUIET",
    clearText: "the west-wall pipeline is ash — and the Dragon Emperor himself passes through Karridge",
    outro: ["n_emperor", "w_patience"]          // Ankunyx passes, untouchable; "Patience is also a weapon."
  },
  3: {
    name: "T H E   W E S T   R O A D  —  N E W   M O O N",
    tag: "ACT III — THE NIGHT SHIPMENT",
    music: "w_forest",
    safeNode: "cage",
    fightPool: ["wight", "pyre", "chain"], elitePool: ["door", "proctor"], boss: "champ",   // ordered easy -> hard
    mapBg: "bg_wroad_far_1",
    intro: ["w_fold", "w_wagon"],               // "Fold their camp..."; "...rides home free tonight."
    mapVO: null,
    bossVO: "w_stand",                          // "I want the man who sold his name..."
    clearTitle: "THE  ROAD  RUNS  CLEAN",
    clearText: "the wagon burns, the freed walk home — and a playbill blows against your boot: THE FIREBIRD OF VARENHOLM",
    outro: []                                   // the epilogue scene carries the Varenholm beats
  }
};
/* ============ TSUBAKI'S ROAD (2026-08-08, the second playthrough) ============
   The other side of the same conspiracy: Tsubaki of the Ieyasu school — the
   Matron's best student, sent to Karridge after the pipeline burned. Her acts
   reuse the run engine with her own pools, her own bosses (the TEMPEST SCHOOL:
   a mercenary house hired by families of the taken to hunt the cult), and her
   own story voice (see src/voice.js). Same guardrails as Vessia's run. */
Spire.ACTS_K = {
  1: {
    name: "T H E   B A M B O O   R O A D",
    tag: "ACT I — THE BAMBOO ROAD TO KARRIDGE",
    music: "k_pit",
    safeNode: "tavern",
    fightPool: ["skel", "ninja", "brute"], elitePool: ["beast"], boss: "archer",
    mapBg: "bg_bam_far_1",
    intro: ["k_bio", "k_orders"],
    mapVO: "n_bamboo",
    bossVO: "k_boss1",
    clearTitle: "THE  ROAD  IS  HERS",
    clearText: "the Longbow's watch is ended — and the school that sent him now knows the Matron's blade walks the road to Karridge",
    outro: ["k_out1"]
  },
  2: {
    name: "B R A S S V E I L  —  T H E   L I T   C I T Y",
    tag: "ACT II — BRASSVEIL, WHERE THE LEY-LIGHTS HUM",
    music: "k_city",
    safeNode: "inn",
    fightPool: ["hook", "gunner", "stitch"], elitePool: ["grave"], boss: "monk",
    mapBg: "bg_bv_far_1",
    intro: ["n_bv"],
    mapVO: null,
    bossVO: "k_boss2",
    clearTitle: "BRASSVEIL  IS  MAPPED",
    clearText: "the Iron Palm kneels broken under the rune-signs — and word comes that the Emperor is NOT at his fortress",
    outro: ["n_emperor", "k_patience"]
  },
  3: {
    name: "D R A K E S P I R E   K E E P",
    tag: "ACT III — STORMING THE EMPEROR'S FORTRESS",
    music: "k_fortress",
    safeNode: "cage",
    /* garrison retheme (2026-08-11 narrative pass): the Keep's defenders are the
       Tempest School's last contract + the fortress's own warded dead — the cult's
       OWN road-crew (chain/pyre) no longer absurdly defends the Keep against
       the cult's blade */
    fightPool: ["ninja", "wight", "gunner"], elitePool: ["sorcerer"], boss: "sera",
    mapBg: "bg_fort_far_1",
    intro: ["n_keepgarrison", "k_fortress"],
    mapVO: null,
    bossVO: "k_boss3",
    clearTitle: "THE  KEEP  STANDS  EMPTY",
    clearText: "she has beaten his fortress, his wards, and his first companion — and the Dragon Emperor was never here at all",
    outro: []
  }
};

/* ---- playable characters ---- */
Spire.CHARS = {
  warlock: { id: "warlock", name: "VESSIA",  prefix: "wl", acts: null /* Spire.ACTS */,
             deckKey: "STARTING_DECK", epiScene: "Epilogue" },
  samurai: { id: "samurai", name: "TSUBAKI", prefix: "kd", acts: null /* Spire.ACTS_K */,
             deckKey: "STARTING_DECK_K", epiScene: "EpilogueK" }
};
Spire.char = function () {
  return Spire.CHARS[(Spire.run && Spire.run.character) || "warlock"];
};
Spire.act = function () {
  const table = (Spire.run && Spire.run.character === "samurai") ? Spire.ACTS_K : Spire.ACTS;
  return table[(Spire.run && Spire.run.act) || 1];
};
Spire.LAST_ACT = 3;

Spire.newRun = function (character) {
  character = character || "warlock";
  Spire.run = {
    character,
    deck: (character === "samurai" ? Spire.STARTING_DECK_K : Spire.STARTING_DECK).slice(),
    hp: 70, maxHp: 70,
    act: 1,
    usedEnemies: [],            // enemy ids already assigned this act -- keeps every fight unique
    map: null,
    pos: null,                 // null until the first (bottom) node is cleared
    cleared: {},               // "r:i" -> true
    over: false
  };
  Spire.run.map = Spire.generateMap();
  return Spire.run;
};

/* advance to the next act: fresh map, fresh enemy budget, a night's rest (full heal)
   and +10 max HP -- Marlow's board and bed / the coach seat between chapters. */
Spire.nextAct = function () {
  const run = Spire.run;
  run.act++;
  run.maxHp += 10;
  run.hp = run.maxHp;
  run.usedEnemies = [];
  run.cleared = {};
  run.pos = null;
  run.map = Spire.generateMap();
  return run;
};

/* claim an enemy id from `pool` that hasn't shown up yet this climb (map-wide, not just
   the path taken -- so two sibling nodes on the same floor never show the same foe either).
   Falls back to a random re-pick only once every id in the pool is already spoken for,
   which the map's small fight budget (<=3 per climb) should never actually hit. */
Spire.claimEnemy = function (pool) {
  const run = Spire.run;
  const fresh = pool.filter(id => !run.usedEnemies.includes(id));
  const pick = fresh.length ? Phaser.Utils.Array.GetRandom(fresh) : Phaser.Utils.Array.GetRandom(pool);
  run.usedEnemies.push(pick);
  return pick;
};

/* TACTICAL MAP (2026-08-05, Hiro's direction): loot is never free, and safety is
   earned with steel. Two lanes with explicit, hand-wired edges:

     row 4                 [ BOSS ]
                          /        \
     row 3        [fight M]        [LOOT 2]          M = the act's mid-tier foe
                  /       \        /       |
     row 2   [REST]      [STORY STOP]   [TOUGH FIGHT]   <- the act's ELITE
                 \          |    \         |
     row 1        [fight EASY]   [ ??? ] [LOOT 1]
                          \        |      /
     row 0                 [ fight EASY ]

   - The FIGHT lane (left) is all easy foes, and it pays in rest + the story stop.
   - The LOOT lane (right) skips fighting to grab the cache — and walks straight
     into the elite guarding it. Loot 2 sits right under the boss's shadow.
   - The ??? gamble threads the middle: it can go either way.
   - No path reaches the boss with fewer than 2 fights; no path exceeds 3. */
Spire.generateMap = function () {
  const ACT = Spire.act();          // character-aware (Vessia's ACTS or Tsubaki's ACTS_K)
  const jit = () => Phaser.Math.Between(-16, 16);
  const Y = r => 596 - r * 82;
  const mk = (r, i, x, type) => ({ r, i, x: x + (r > 0 && r < 4 ? jit() : 0), y: Y(r), type, edges: [] });

  const easyPool = ACT.fightPool.slice(0, 2);
  const rows = [];
  /* row 0 — the road finds her first: one easy fight, no choices yet */
  const n00 = mk(0, 0, 640, "fight"); n00.enemy = Spire.claimEnemy(easyPool);
  rows.push([n00]);
  /* row 1 — the fork: fight for safety, gamble the dark, or reach for the cache */
  const n10 = mk(1, 0, 430, "fight"); n10.enemy = Spire.claimEnemy(easyPool);
  const n11 = mk(1, 1, 640, "unknown");
  const n12 = mk(1, 2, 850, "treasure");
  rows.push([n10, n11, n12]);
  /* row 2 — consequences: the fighter rests and hears the story; the looter meets the guard */
  const n20 = mk(2, 0, 400, "rest");
  const n21 = mk(2, 1, 640, ACT.safeNode);
  const n22 = mk(2, 2, 880, "elite"); n22.enemy = Spire.claimEnemy(ACT.elitePool);
  rows.push([n20, n21, n22]);
  /* row 3 — one more take: a mid-tier fight on the safe side, or loot in the boss's shadow */
  const n30 = mk(3, 0, 500, "fight"); n30.enemy = Spire.claimEnemy(ACT.fightPool);
  const n31 = mk(3, 1, 790, "treasure");
  rows.push([n30, n31]);
  /* row 4 — the one who waits */
  const n40 = mk(4, 0, 640, "boss"); n40.enemy = ACT.boss;
  rows.push([n40]);

  /* hand-wired edges (indices into the NEXT row) */
  n00.edges = [0, 1, 2];       // the fork is hers
  n10.edges = [0, 1];          // easy fight -> rest or the story stop
  n11.edges = [1, 2];          // ??? -> story stop, or thrown to the elite
  n12.edges = [2];             // loot 1 -> the elite guarding it. No way around.
  n20.edges = [0];             // rest -> the mid fight
  n21.edges = [0];             // story stop -> the mid fight (no free lane to the boss-shadow loot)
  n22.edges = [1];             // elite slain -> the loot she bled for. Hers ALONE.
  n30.edges = [0];
  n31.edges = [0];
  return rows;
};

/* which nodes can be entered right now */
Spire.availableNodes = function () {
  const run = Spire.run;
  if (!run) return [];
  if (run.pos === null) return [run.map[0][0]];
  if (run.pos.r >= run.map.length - 1) return [];
  const cur = run.map[run.pos.r][run.pos.i];
  return cur.edges.map(j => run.map[run.pos.r + 1][j]);
};
Spire.enterNode = function (node) {         // advance position; caller routes to the right scene
  Spire.run.pos = { r: node.r, i: node.i };
};
Spire.clearNode = function () {
  const p = Spire.run.pos;
  if (p) Spire.run.cleared[`${p.r}:${p.i}`] = true;
};
Spire.currentNode = function () {
  const p = Spire.run.pos;
  return p ? Spire.run.map[p.r][p.i] : null;
};

/* ---- card reward pools ---- */
Spire.rewardChoices = function (n, elite) {
  const me = (Spire.run && Spire.run.character) || "warlock";
  const pool = [];
  for (const id in Spire.CARDS) {
    const c = Spire.CARDS[id];
    if ((c.char || "warlock") !== me) continue;                // each character owns her pool
    const rarity = c.rarity || "common";
    if (rarity === "starter" || rarity === "epic") continue;   // epic is tavern-exclusive
    const w = rarity === "rare" ? (elite ? 4 : 1) : rarity === "uncommon" ? 3 : 4;
    for (let k = 0; k < w; k++) pool.push(id);
  }
  const out = [];
  while (out.length < n && pool.length) {
    const pick = Phaser.Utils.Array.GetRandom(pool);
    out.push(pick);
    for (let i = pool.length - 1; i >= 0; i--) if (pool[i] === pick) pool.splice(i, 1);
  }
  return out;
};

/* the tavern's reward: her one guaranteed EPIC pick, backed up with rare alternates so
   it still reads as a real choice even while the epic pool is small. */
Spire.epicChoices = function (n) {
  const me = (Spire.run && Spire.run.character) || "warlock";
  const mine = id => (Spire.CARDS[id].char || "warlock") === me;
  const epics = Object.keys(Spire.CARDS).filter(id => Spire.CARDS[id].rarity === "epic" && mine(id));
  const out = epics.slice();
  const rarePool = Phaser.Utils.Array.Shuffle(
    Object.keys(Spire.CARDS).filter(id => Spire.CARDS[id].rarity === "rare" && mine(id) && !out.includes(id)));
  const unPool = Phaser.Utils.Array.Shuffle(
    Object.keys(Spire.CARDS).filter(id => Spire.CARDS[id].rarity === "uncommon" && mine(id)));
  for (const pick of rarePool.concat(unPool)) {   // top up with rares, then uncommons — never loops
    if (out.length >= n) break;
    if (!out.includes(pick)) out.push(pick);
  }
  return out.slice(0, n);
};
