/* enemies.js — the Pit-level roster. Each def: sprite prefix, stats, move script,
   bespoke reaction map (kind -> anim key). Missing kinds fall back to <prefix>_hurt. */
window.Spire = window.Spire || {};

/* FACING (2026-07-30, corrected after a zoomed-in audit of every idle_1 frame):
   enemies stand on the RIGHT side of the arena, so on screen they must face LEFT.
   Native art facing:  hound RIGHT, beast RIGHT  -> flip: true
                       skel LEFT, brute LEFT, master LEFT -> no flip
   (The first pass had this exactly inverted for brute/master — misread the
   low-res previews. FightScene.flipXFor() consumes this flag.) */
Spire.ENEMIES = {
  hound: {
    id: "hound", name: "PIT HOUND", prefix: "hd", hp: 48, height: 225, flip: true,
    vo: { intro: "e_hd_intro" }, voChar: "warlock",   // his master bellows from the stands
    script: [
      { kind: "buff",   label: "Snarl", str: 2 },
      { kind: "attack", label: "Bite",  dmg: 9, hits: 1 },
      { kind: "attack", label: "Rend",  dmg: 5, hits: 2 },
      { kind: "block",  label: "Guard", block: 8 },
      { kind: "attack", label: "Bite",  dmg: 9, hits: 1 }
    ],
    reactions: { hexhit: "hd_hexhit", firehit: "hd_firehit", clawhit: "hd_clawhit",
                 portalhit: "hd_portalhit", afirehit: "hd_afirehit", ahexhit: "hd_ahexhit",
                 fadehit: "hd_fadehit", scythehit: "hd_scythehit", arrowhit: "hd_arrowhit" }
  },
  skel: {
    id: "skel", name: "PIT SKELETON", prefix: "sk", hp: 34, height: 235,
    vo: { intro: "e_sk_intro" },
    script: [
      { kind: "attack", label: "Rusted Slash", dmg: 7, hits: 1 },
      { kind: "block",  label: "Shield Up",    block: 6 },
      { kind: "attack", label: "Rusted Slash", dmg: 7, hits: 1 },
      { kind: "buff",   label: "Bone Rattle",  str: 1 }
    ],
    reactions: {}
  },
  brute: {
    id: "brute", name: "PIT BRUTE", prefix: "br", hp: 58, height: 265,
    vo: { intro: "e_br_intro" },
    script: [
      { kind: "attack", label: "Club Smash", dmg: 11, hits: 1 },
      { kind: "block",  label: "Brace",      block: 8 },
      { kind: "attack", label: "Club Smash", dmg: 11, hits: 1 },
      { kind: "buff",   label: "Roar",       str: 2 }
    ],
    reactions: {}
  },
  beast: {
    id: "beast", name: "THE BEAST", prefix: "bs", hp: 78, height: 265, elite: true, flip: true,
    vo: { intro: "e_bs_intro" },   // the narrator speaks for what has no voice
    script: [
      { kind: "attack", label: "Gore",   dmg: 12, hits: 1 },
      { kind: "attack", label: "Frenzy", dmg: 4,  hits: 3, ex: { anim: "bs_attack", label: "F R E N Z Y", tint: 0xff5533 } },
      { kind: "buff",   label: "Bellow", str: 3 },
      { kind: "block",  label: "Thick Hide", block: 9 },
      { kind: "attack", label: "Gore",   dmg: 12, hits: 1 }
    ],
    reactions: { hexhit: "bs_hexhit", firehit: "bs_firehit", clawhit: "bs_clawhit",
                 portalhit: "bs_portalhit", afirehit: "bs_afirehit", ahexhit: "bs_ahexhit",
                 fadehit: "bs_fadehit", scythehit: "bs_scythehit", arrowhit: "bs_arrowhit" }
  },
  master: {
    id: "master", name: "THE HOUND MASTER", prefix: "ms", hp: 95, height: 270, boss: true,
    vo: { intro: "e_ms_intro", special: "e_ms_horn", death: "e_ms_death" },
    script: [
      { kind: "attack",  label: "Whip Crack", dmg: 10, hits: 1 },
      { kind: "special", label: "Horn Call",  id: "horncall", dmg: 6, hits: 2, ex: { anim: "ms_attack", label: "H O R N   C A L L", tint: 0xff9944 } },
      { kind: "attack",  label: "Lash",       dmg: 5,  hits: 2 },
      { kind: "block",   label: "Beast Ward", block: 10 },
      { kind: "special", label: "Horn Call",  id: "horncall", dmg: 6, hits: 2 }
    ],
    reactions: {}
  },

  /* ============ ACT 2 — THE CITY (the cult's local pipeline; roster from the
     original pit ladder: hook / gunner / stitch / gravehand / court necromancer).
     Facing: this whole roster natively faces LEFT (audited via zoomed crops);
     the three right-facing ATTACK sets were mirrored at bundle time. ============ */
  hook: {
    id: "hook", name: "THE HOOK", prefix: "hk", hp: 55, height: 235,
    vo: { intro: "e_hk_intro" },
    script: [
      { kind: "attack", label: "Hook & Drag", dmg: 6, hits: 2 },
      { kind: "attack", label: "Gaff Swing",  dmg: 9, hits: 1 },
      { kind: "buff",   label: "Frenzy",      str: 2 },
      { kind: "attack", label: "Hook & Drag", dmg: 6, hits: 2 }
    ],
    reactions: {}
  },
  gunner: {
    id: "gunner", name: "THE ROAD GUNNER", prefix: "gn", hp: 62, height: 245,
    vo: { intro: "e_gn_intro" },
    script: [
      { kind: "block",  label: "Take Cover",  block: 9 },
      { kind: "attack", label: "Locked Shot", dmg: 15, hits: 1 },
      { kind: "attack", label: "Snap Shot",   dmg: 8,  hits: 1 },
      { kind: "buff",   label: "Powder Pack", str: 2 },
      { kind: "attack", label: "Locked Shot", dmg: 15, hits: 1 }
    ],
    ranged: true,   // fires from its spot -- no charge-in on attack turns
    reactions: {}
  },
  stitch: {
    id: "stitch", name: "THE STITCHER", prefix: "st", hp: 78, height: 255,
    vo: { intro: "e_st_intro", special: "e_st_mend" },
    script: [
      { kind: "attack",  label: "Needle Rake", dmg: 7, hits: 1 },
      { kind: "special", label: "Mend Flesh",  id: "mend", heal: 12 },
      { kind: "attack",  label: "Thread Lash", dmg: 5, hits: 2 },
      { kind: "special", label: "Mend Flesh",  id: "mend", heal: 12 },
      { kind: "attack",  label: "Needle Rake", dmg: 7, hits: 1 }
    ],
    reactions: {}
  },
  grave: {
    id: "grave", name: "GRAVEHAND", prefix: "gv", hp: 92, height: 250, elite: true,
    vo: { intro: "e_gv_intro" },
    script: [
      { kind: "attack", label: "Shovel Break", dmg: 13, hits: 1 },
      { kind: "block",  label: "Guard Stance", block: 13 },
      { kind: "attack", label: "Riposte",      dmg: 8,  hits: 2, ex: { anim: "gv_attack", label: "R I P O S T E", tint: 0x88ff99 } },
      { kind: "buff",   label: "Grave Cold",   str: 2 },
      { kind: "attack", label: "Shovel Break", dmg: 13, hits: 1 }
    ],
    reactions: {}
  },
  necro: {
    id: "necro", name: "THE COURT NECROMANCER", prefix: "nc", hp: 130, height: 255, boss: true,
    vo: { intro: "e_nc_intro", special: "e_nc_raise", death: "e_nc_death" },
    script: [
      { kind: "attack",  label: "Grave Bolt",  dmg: 9, hits: 1 },
      { kind: "special", label: "Raise Dead",  id: "raisedead", dmg: 7, hits: 2, ex: { anim: "nc_attack", label: "R A I S E   D E A D", tint: 0x88ff99 } },
      { kind: "block",   label: "Bone Ward",   block: 11 },
      { kind: "attack",  label: "Grave Bolt",  dmg: 9, hits: 1 },
      { kind: "special", label: "Raise Dead",  id: "raisedead", dmg: 7, hits: 2 }
    ],
    ranged: true,
    reactions: {}
  },

  /* ============ ACT 3 — THE WEST ROAD (the night shipment's crew:
     chain / pyre / frost wight / THE WALL / THE CHAMP). ============ */
  chain: {
    id: "chain", name: "THE CHAIN", prefix: "ch", hp: 85, height: 275,
    vo: { intro: "e_ch_intro" }, voChar: "warlock",   // cult-crew line; silent in her run
    script: [
      { kind: "attack", label: "Ring Sweep",  dmg: 14, hits: 1 },
      { kind: "block",  label: "Wrap Chains", block: 11 },
      { kind: "attack", label: "Flail",       dmg: 7,  hits: 2 },
      { kind: "buff",   label: "Tighten",     str: 2 },
      { kind: "attack", label: "Ring Sweep",  dmg: 14, hits: 1 }
    ],
    reactions: {}
  },
  pyre: {
    id: "pyre", name: "THE PYRE", prefix: "py", hp: 72, height: 250,
    vo: { intro: "e_py_intro" }, voChar: "warlock",
    script: [
      { kind: "special", label: "Cinder Toss", id: "cinder", dmg: 7, burn: 3 },
      { kind: "block",   label: "Mage Shield", block: 10 },
      { kind: "special", label: "Cinder Toss", id: "cinder", dmg: 7, burn: 3 },
      { kind: "attack",  label: "Scald",       dmg: 10, hits: 1 }
    ],
    ranged: true,
    reactions: {}
  },
  wight: {
    id: "wight", name: "FROST WIGHT", prefix: "sk", hp: 64, height: 235, tint: 0x9fd4ff,
    vo: { intro: "e_wg_intro" },
    /* Cookie's saltcellar tip made flesh: "Rats don't leave FROST on the railings."
       Reuses the skeleton art under an icy tint -- a risen thing off the night road. */
    script: [
      { kind: "attack", label: "Frost Slash",  dmg: 9, hits: 1 },
      { kind: "block",  label: "Rime Shell",   block: 10 },
      { kind: "attack", label: "Cold Snap",    dmg: 6, hits: 2 },
      { kind: "buff",   label: "Deep Winter",  str: 2 }
    ],
    reactions: {}
  },
  door: {
    id: "door", name: "THE WALL", prefix: "dr2", hp: 118, height: 265, elite: true,
    vo: { intro: "e_dr_intro" },
    script: [
      { kind: "block",  label: "Shut Fast",   block: 16 },
      { kind: "attack", label: "Slam",        dmg: 15, hits: 1, ex: { anim: "dr2_attack", label: "S L A M", tint: 0xe0b34a } },
      { kind: "attack", label: "Hinge Crush", dmg: 9,  hits: 2 },
      { kind: "block",  label: "Shut Fast",   block: 16 },
      { kind: "buff",   label: "Groan",       str: 3 }
    ],
    reactions: {}
  },
  /* ============ THE TEMPEST SCHOOL (2026-08-08, Tsubaki's run) — an eastern
     mercenary house hired by families of the taken to hunt the cult. Generated
     facing LEFT (audited); no flips. ============ */
  ninja: {
    id: "ninja", name: "TEMPEST SHINOBI", prefix: "nj", hp: 40, height: 225,
    vo: { intro: "e_nj_intro" }, voChar: "samurai",
    script: [
      { kind: "attack", label: "Twin Fangs",  dmg: 5, hits: 2 },
      { kind: "block",  label: "Vanish",      block: 9 },
      { kind: "attack", label: "Crosscut",    dmg: 8, hits: 1 },
      { kind: "attack", label: "Twin Fangs",  dmg: 5, hits: 2 }
    ],
    reactions: {}
  },
  archer: {
    id: "archer", name: "THE LONGBOW", prefix: "ar", hp: 100, height: 250, boss: true,
    vo: { intro: "e_ar_intro", death: "e_ar_death" }, voChar: "samurai",
    script: [
      { kind: "attack", label: "Measured Shot", dmg: 12, hits: 1 },
      { kind: "block",  label: "Give Ground",   block: 9 },
      { kind: "attack", label: "Storm Volley",  dmg: 5,  hits: 3, ex: { anim: "ar_attack", label: "S T O R M   V O L L E Y", tint: 0x9fd4ff } },
      { kind: "buff",   label: "Read the Wind", str: 2 },
      { kind: "attack", label: "Measured Shot", dmg: 12, hits: 1 }
    ],
    ranged: true,
    reactions: {}
  },
  monk: {
    id: "monk", name: "THE IRON PALM", prefix: "mk", hp: 135, height: 255, boss: true,
    vo: { intro: "e_mk_intro", death: "e_mk_death" }, voChar: "samurai",
    script: [
      { kind: "block",  label: "Rooted Stance", block: 14 },
      { kind: "attack", label: "Iron Palm",     dmg: 13, hits: 1 },
      { kind: "attack", label: "Hundred Hands", dmg: 5,  hits: 3, ex: { anim: "mk_attack", label: "H U N D R E D   H A N D S", tint: 0xffd97a } },
      { kind: "buff",   label: "Breath of Stone", str: 3 },
      { kind: "attack", label: "Iron Palm",     dmg: 13, hits: 1 }
    ],
    reactions: {}
  },
  sorcerer: {
    id: "sorcerer", name: "THE STORM SAGE", prefix: "ss", hp: 135, height: 260, elite: true,
    /* 2026-08-08 redesign: the school's last master now holds DRAKESPIRE's ley-ward
       as a hired warden — the elite guarding the fortress's loot lane. */
    vo: { intro: "e_ss_intro", death: "e_ss_death" }, voChar: "samurai",
    script: [
      { kind: "attack", label: "Forked Bolt",   dmg: 7,  hits: 2 },
      { kind: "block",  label: "Static Veil",   block: 12 },
      { kind: "attack", label: "Heaven's Spear", dmg: 16, hits: 1, ex: { anim: "ss_attack", label: "H E A V E N ' S   S P E A R", tint: 0xbb88ff } },
      { kind: "buff",   label: "Gathering Storm", str: 3 },
      { kind: "attack", label: "Forked Bolt",   dmg: 7,  hits: 2 }
    ],
    ranged: true,
    reactions: {}
  },

  /* ====== DRAKESPIRE KEEP's last door (2026-08-08): SERA — the Emperor's first
     companion, champion of tournaments, twenty years past Book 1. CANON GUARDRAIL:
     she does not die — her "death" set is a yield (down on one knee, alive), and
     her final line says so. ====== */
  sera: {
    id: "sera", name: "SERA", prefix: "sr", hp: 170, height: 250, boss: true,
    vo: { intro: "e_sr_intro", death: "e_sr_yield" }, voChar: "samurai",
    /* MOVE SET FROM THE BOOKS (2026-08-08 canon pass — Books 1-3 combat sweep):
       Rapier of Arrest + force-blade off-hand. "Twin Fang" is her named dual-wield
       scissors (B1 ch14); "Sera's Cage" is the defensive stance she INVENTED
       (B1 ch03, still hers in B2 ch16-17, "the Cage predicts angles"); the
       Arresting Thrust is the Rapier of Arrest's clean-hit freeze (B2 ch15);
       the Breach Shard fires devastating rays, three per fight (B2 ch15-16). */
    script: [
      { kind: "attack", label: "Twin Fang",         dmg: 7,  hits: 2,
        ex: { anim: "sr_attack", label: "T W I N   F A N G", tint: 0x9fd4ff } },
      { kind: "block",  label: "Sera's Cage",       block: 13 },
      { kind: "attack", label: "Arresting Thrust",  dmg: 13, hits: 1 },
      { kind: "buff",   label: "The Cage Predicts", str: 3 },
      { kind: "attack", label: "Breach Ray",        dmg: 6,  hits: 3,
        ex: { anim: "sr_attack", label: "B R E A C H   R A Y", tint: 0xbb88ff } }
    ],
    reactions: {}
  },

  proctor: {
    /* THE ASHENVEIL PROCTOR (2026-08-11): the original warlock art, reborn as the
       academy's enforcer — the faculty finally answers the question Vessia asked.
       Ranged caster; his hex bolts use the standoff-caster path. */
    id: "proctor", name: "THE ASHENVEIL PROCTOR", prefix: "owl", hp: 100, height: 280,
    elite: true, flip: true, ranged: true,
    vo: { intro: "e_pr_intro", death: "e_pr_death" }, voChar: "warlock",
    script: [
      { kind: "attack", label: "Corrective Bolt",  dmg: 8,  hits: 1 },
      { kind: "buff",   label: "Cite Precedent",   str: 2 },
      { kind: "attack", label: "Twin Citation",    dmg: 5,  hits: 2 },
      { kind: "block",  label: "Faculty Wards",    block: 11 },
      { kind: "attack", label: "Final Assessment", dmg: 12, hits: 1, ex: { anim: "owl_attack", label: "F I N A L   A S S E S S M E N T", tint: 0xbb88ff } }
    ],
    reactions: {}
  },

  archproctor: {
    /* THE ARCH-PROCTOR (2026-08-11): the faculty's VERDICT — Vessia's endgame duel,
       mirror of the Kagehime fight. He fights with HER kit: hex bolts, wards, and
       Exsanguinate that drinks what it deals (her Thirst, turned around). */
    id: "archproctor", name: "THE ARCH-PROCTOR OF THE ASHENVEIL", prefix: "owl", hp: 200, height: 285,
    boss: true, flip: true, ranged: true,
    vo: { intro: "e_ow_intro", death: "e_ow_death" }, voChar: "warlock",
    script: [
      { kind: "attack", label: "Corrective Bolt",  dmg: 9,  hits: 1 },
      { kind: "attack", label: "Exsanguinate",     dmg: 5,  hits: 2, drain: 1,
        ex: { anim: "owl_attack", label: "E X S A N G U I N A T E", tint: 0xdd2244 } },
      { kind: "block",  label: "Faculty Wards",    block: 14 },
      { kind: "buff",   label: "Cite Precedent",   str: 3 },
      { kind: "attack", label: "Final Assessment", dmg: 17, hits: 1,
        ex: { anim: "owl_attack", label: "F I N A L   A S S E S S M E N T", tint: 0xbb88ff } }
    ],
    reactions: {}
  },

  /* THE SECOND BLADE (2026-08-11): the retired first-pass samurai art, reborn as
     an Ieyasu-school rival. Art faces RIGHT (it was drawn as player art) -> flip.
     Two framings share the sprite set:
       kagehime   — Tsubaki's endgame duel (the Matron sends her own test)
       matronblade— the hunter who finally catches up with Vessia (act-3 ambush) */
  kagehime: {
    id: "kagehime", name: "KAGEHIME, THE SECOND BLADE", prefix: "kd2", hp: 225, height: 300,
    boss: true, flip: true,
    vo: { intro: "e_k2_intro", death: "e_k2_death" }, voChar: "samurai",
    /* 2026-08-11 (Hiro: "too easy"): she fights with TSUBAKI'S OWN KIT now —
       bleed that ticks through block, and an Ichigeki that earns its name. */
    script: [
      { kind: "attack", label: "First Cut",       dmg: 9,  hits: 1, bleed: 2 },
      { kind: "block",  label: "Patient Defense", block: 14 },
      { kind: "attack", label: "Crossveil",       dmg: 7,  hits: 2, anim: "kd2_attack2",
        ex: { anim: "kd2_attack2", label: "C R O S S V E I L", tint: 0xdd3355 } },
      { kind: "buff",   label: "Observant Draw",  str: 3 },
      { kind: "attack", label: "Artery Cut",      dmg: 6,  hits: 1, bleed: 3 },
      { kind: "attack", label: "Ichigeki",        dmg: 22, hits: 1,
        ex: { anim: "kd2_attack", label: "I C H I G E K I", tint: 0xff3344 } }
    ],
    reactions: {}
  },
  matronblade: {
    id: "matronblade", name: "THE MATRON'S BLADE", prefix: "kd2", hp: 155, height: 300,
    elite: true, flip: true,
    vo: { intro: "e_mb_intro", death: "e_mb_death" }, voChar: "warlock",
    script: [
      { kind: "attack", label: "First Cut",       dmg: 8,  hits: 1, bleed: 2 },
      { kind: "block",  label: "Patient Defense", block: 12 },
      { kind: "attack", label: "Crossveil",       dmg: 6,  hits: 2, anim: "kd2_attack2",
        ex: { anim: "kd2_attack2", label: "C R O S S V E I L", tint: 0xdd3355 } },
      { kind: "buff",   label: "Observant Draw",  str: 2 },
      { kind: "attack", label: "Ichigeki",        dmg: 18, hits: 1,
        ex: { anim: "kd2_attack", label: "I C H I G E K I", tint: 0xff3344 } }
    ],
    reactions: {}
  },

  champ: {
    id: "champ", name: "THE CHAMP", prefix: "cp", hp: 160, height: 260, boss: true, flip: true,
    vo: { intro: "e_cp_intro", special: "e_cp_devour", death: "e_cp_death" },
    /* the gauntlet's thrall-eater: audited facing = RIGHT (the one runtime flip in the new cast) */
    script: [
      { kind: "attack",  label: "Sword & Board", dmg: 12, hits: 1, ex: { anim: "cp_attack", label: "S W O R D   &   B O A R D", tint: 0xe0b34a } },
      { kind: "special", label: "Devour Thrall", id: "devour", heal: 15, str: 2, ex: { anim: "cp_attack", label: "D E V O U R", tint: 0xff5533 } },
      { kind: "attack",  label: "Shield Bash",   dmg: 7,  hits: 2 },
      { kind: "block",   label: "Raise Shield",  block: 13 },
      { kind: "attack",  label: "Sword & Board", dmg: 12, hits: 1 }
    ],
    reactions: {}
  }
};
