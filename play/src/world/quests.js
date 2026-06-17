// Quest data — main quest: THE ANKUSPAWN CONSPIRACY (beats 1-2 live in B3; 3-5 land in B5).
// Canon guardrail: the conspiracy survives this game. See docs/LORE_BIBLE.md.

const Quests = {
  // ---- per-character dialogue voices ----
  // Ronin: a man who has seen a thousand pits and names none of them (vague — the egg stays buried).
  // Druid: Amaris's daughter — green-eared, blunt-kind, listening to a hum no one else hears.
  // Warlock: neutral-evil, ominous; where it matters he gets TWO options — measured or malevolent.
  optTable: {
    marlowAsk: { default: 'Ask about the last champion',
      ronin: '"Champions don\'t leave their boots behind. Tell me about Dren."',
      druid: '"People are going missing quietly out here. Start with him."',
      warlock: ['"Dead men leave echoes. His is still warm in this room — speak."'] },
    marlowPay: { default: 'Pay 5 silver',
      ronin: '"A fair price for a fair truth." (pay 5s)',
      druid: '"For the missing, then." (pay 5s)',
      warlock: ['"Knowledge has a price. Here is yours." (pay 5s)',
                '"Five silver. Cheaper than the other ways I ask questions." (pay 5s)'] },
    campStrike: { default: 'Kick over the tents',
      ronin: '"No banner on these tents. Cut them down."',
      druid: '"The grove wants them gone. So do I."',
      warlock: ['"Fold their camp the way they fold people."',
                '"Wake them first. I want this heard."'] },
    captiveGo: { default: 'Let him run',
      ronin: '"Run far, boy. Don\'t look back at anything."',
      druid: '"Go. And learn to stop being SEEN."',
      warlock: ['"Run. You\'re worth more to me as a rumor."'] },
    shenGo: { default: 'Let him go',
      ronin: '"Roads keep secrets better than men. Go."',
      druid: '"Then run well... brother."',
      warlock: ['"Go. Hunted things make the finest debts."'] },
    buyerKeep: { default: 'Keep the vial (evidence)',
      ronin: '"Evidence outlives sentiment. I keep it."',
      druid: '"It hums like ME. I need to know why. ...I\'m sorry."',
      warlock: ['"It\'s safer in my hands than in your veins."',
                '"Mine now. Miracles rot in weak hands."'] },
    buyerGive: { default: 'Leave it with her (mercy)',
      ronin: '"A blade knows when not to cut. Keep it."',
      druid: '"Keep it. But NO ONE sells you hope again."',
      warlock: ['"Keep your bottled miracle. Your debt amuses me more."'] },
    caravanBreak: { default: 'Break the wheel',
      ronin: '"One cut for the wheel. The rest for whoever minds."',
      druid: '"Nothing rides in cages tonight."',
      warlock: ['"Stop the wagon. What spills, spills."',
                '"Open the crates. Then the crews."'] },
    finale1: { default: 'Kneel — or don\'t',
      druid: 'Kneel with the rest. Watch him like a question.',
      warlock: ['Watch the weather pass.',
                'Stand. Power should see power coming.'] },
    finale2: { default: 'Hold your tongue. Hold the vial.',
      druid: 'Say nothing. Your mother\'s caution wins.',
      warlock: ['"Not yet. Patience is also a weapon."'] },
    roninWait1: { default: 'Wait with the crowd', ronin: 'Wait with the crowd. (You don\'t kneel. Habit.)' },
  },
  opt(key) {
    const t = this.optTable[key]; if (!t) return [key];
    const c = (window.GameState && GameState.player && GameState.player.char) || 'default';
    const v = t[c] || t.default;
    return Array.isArray(v) ? v : [v];
  },

  // the Seraphim walks a different road: the journal shows HIS quests, not the conspiracy's.
  // The warlock's journal grows three beats past the plaza (the White Writ arc).
  mainFor() {
    const c = window.GameState && GameState.player && GameState.player.char;
    if (c === 'seraph') return this.seraph.main;
    if (c === 'warlock') {
      // base epilogue (writ -> alley -> Matron), then a LIVE hunt entry so the journal
      // reflects wq4 instead of stale-showing the completed Matron "black carriage" step.
      const list = this.main.concat(this.warlockEpilogue.main);
      const f = (window.GameState && GameState.world && GameState.world.flags) || {};
      const huntSt = f[this.warlockHunt.huntFlag]; // 'active' once Nyx recruits, 'done' after delivery
      if (huntSt) {
        const order = [
          ['cap-briar', 'Briar in the Thorn Grove'],
          ['cap-ossuary', 'Ossuary in the grove dungeon'],
          ['cap-cinder', 'Cinder on the Dragonspine'],
          ['cap-whisper', 'Whisper at the Ashenveil Academy'],
          ['cap-cookie', 'Cookie of Varenholm (and her protector)'],
        ];
        const caged = order.filter(o => f[o[0]]).length;
        const next = order.find(o => !f[o[0]]);
        const objective = (huntSt === 'done' || !next)
          ? 'All five cages delivered to Lady Nyx. The web has a new spider.'
          : caged + ' of 5 caged. Next: bring back ' + next[1] + ' — alive (capture, never kill).';
        list.push({ id: 'wq4-the-hunt', title: 'THE WARLOCK\'S HUNT',
          text: 'Lady Nyx\'s first contract: capture five gifted Ankuspawn ALIVE, one per region — never kill, for dead stock is worthless stock. The fifth is the dancer of Varenholm, behind her green protector. Deliver all five to the Ashenveil Academy.',
          objective });
      }
      return list;
    }
    if (c === 'druid') {
      // the Druid's journal grows ONE live entry once the Varenholm crossing begins, computed
      // from the dq-cross-* progress flags (mirrors the warlock wq4 pattern). id 'dq-the-crossing'
      // makes 'q-'+id === crossFlag so the existing journal renderer shows it with NO new UI.
      const list = this.main.slice();
      const f = (window.GameState && GameState.world && GameState.world.flags) || {};
      const crossSt = f[this.druidCrossing.crossFlag]; // 'active' once the warlock strikes; 'done' after Shen Sama
      if (crossSt) {
        const order = [
          ['dq-cross-warlock', 'break the warlock who came with cages'],
          ['dq-cross-cult', 'throw back the Anku reinforcements he raised'],
          ['dq-cross-flee', 'get Cookie up the spine trail — away from the ash road'],
          ['dq-cross-shen', 'find Shen Sama; learn what took Ignis the hearth-wyrm'],
        ];
        const doneN = order.filter(o => f[o[0]]).length;
        const next = order.find(o => !f[o[0]]);
        const objective = (crossSt === 'done' || !next)
          ? 'Cookie is safe in the warm ash. Ignis is still missing — and now her hunt is yours too.'
          : 'Step ' + (doneN + 1) + ' of 4: ' + next[1] + '.';
        list.push({ id: 'dq-the-crossing', title: 'THE CROSSING',
          text: 'The cult came to Varenholm with cages for the dancer — and a price on YOU: VERDANCE, underlined twice. You broke their warlock; he rose with the ash road at his back. Now you and Cookie climb the Dragonspine for the one shelter that never sold a stray: Ignis the hearth-wyrm. The fugitive dragon Shen Sama is climbing for her too. She has gone missing.',
          objective });
      }
      return list;
    }
    return this.main;
  },

  // ---- guild rank ladder (canon: Greyrush iron crew, Bronze rate, Brass Whistle
  // silver-tier, Platinum contracting, Diamond-tier Vanguard Hall) ----
  guildRanks: [
    { name: 'IRON', at: 0, mult: 1.0, note: 'unproven — iron-crew rates' },
    { name: 'BRONZE', at: 3, mult: 1.25, note: 'contract client' },
    { name: 'SILVER', at: 8, mult: 1.5, note: 'silver-tier crew standing' },
    { name: 'GOLD', at: 15, mult: 2.0, note: 'named on the board' },
    { name: 'PLATINUM', at: 25, mult: 2.5, note: 'premium contracting' },
    { name: 'DIAMOND', at: 40, mult: 3.0, note: 'Vanguard Hall — they pour when you enter' },
  ],
  rankFor(hunts) {
    let r = this.guildRanks[0];
    for (const g of this.guildRanks) if (hunts >= g.at) r = g;
    return r;
  },

  main: [
    {
      id: 'mq1-empty-cell',
      title: 'THE EMPTY CELL',
      give: 'auto', // granted on entering the city as champion
      text: 'The Pit\'s last champion vanished the night after his final win. Bellow grumbles that he "ran." The crowd believed it. The innkeeper of the Last Lantern does not.',
      objective: 'Ask around at the Last Lantern inn.',
    },
    {
      id: 'mq2-listening-room',
      title: 'THE LISTENING ROOM',
      give: 'innkeeper-paid', cost: 50, // 5 silver for the real rumor web
      text: 'Three more gone along the trade road — all of them gifted, all of them quiet disappearances. And a guest upstairs has been asking very specific questions about how YOU fight. The innkeeper kept his coin and his ears open.',
      objective: 'The guild keeps the road ledgers. Press them about the missing. Then find the camp the wood-elves spoke of, west past the ley-line node.',
    },
    {
      id: 'mq3-roots-that-rot',
      title: 'ROOTS THAT ROT',
      give: 'camp',
      text: 'A camp by no road: tents that fold fast, crates that breathe. They were moving a sedated captive along the ley-line — and profiling more. The boy you cut loose says they kept asking what he could DO.',
      objective: 'The freed quarry boy named a buyer in Karridge\'s back alleys. Find who is purchasing what the camp was selling.',
    },
    {
      id: 'mq4-the-buyer',
      title: 'THE BUYER',
      give: 'buyer',
      text: 'She isn\'t evil. She\'s desperate — a fertility elixir, priced like a miracle, promised by quiet men "out of the Ashenveil." She showed you the vial: it hums like the node hummed. Something living went into it.',
      objective: 'The grove keeper marks a caravan path on the western edge — the next shipment moves tonight. Stop it.',
    },
    {
      id: 'mq5-ash-and-silence',
      title: 'ASH AND SILENCE',
      give: 'caravan',
      text: 'You broke the caravan and freed the captives in transit. By morning the camp was gone — raked earth, no tents, no tracks, as if the forest had imagined it. Whoever they serve erases faster than you can accuse.',
      objective: 'Word arrives: the Dragon Emperor himself passes through Karridge. You hold a vial, a ledger page, and three witnesses who already won\'t talk. Go to the plaza.',
    },
    {
      id: 'mq6-the-dancer',
      title: 'THE DANCER OF VARENHOLM',
      give: 'coach',
      text: 'The cult shops for the gifted — and the most famous gifted in the heartland is a halfling dancer who stood up in a Varenholm guild hall and TOLD them all what she is.',
      objective: 'Take the heartland coach from the Karridge guild. See the show. Watch her back.',
    },
  ],

  // Post-finale epilogue arc: Varenholm and the Dancer.
  // Canon guardrails: Cookie is a live PC — unharmed, unresolved; her Ember growth
  // gate belongs to HER campaign. The cult is repelled, not exposed.
  varenholm: {
    journal: {
      id: 'mq6-the-dancer',
      title: 'THE DANCER OF VARENHOLM',
      text: 'The cult shops for the gifted — and the most famous gifted in the heartland is a halfling dancer who stood up in a Varenholm guild hall and TOLD them all what she is. Either she\'s the bravest mark alive, or she knows something about being hunted that you don\'t.',
      objective: 'Take the heartland coach from the Karridge guild. See the show. Watch her back.',
    },
    coach: 'Three days by coach, two changes of horses, one toll bridge where the guard waves you through when he recognizes the pit-name. Varenholm: spires, banners, streetlamps with GLASS in them. The Crown Quarter smells like money and rosin. Playbills on every post: ONE NIGHT — THE DANCER, V.E.A. MASTER OF VOICE — CIVIC AUDITORIUM.',
    performance1: 'The Civic Auditorium is full past the fire-marshal\'s patience. She comes out small and the room gets smaller — a halfling in firebird red, scroll-marks on her shoulders catching the footlights gold. The dance is all gyration and joy and impossible precision, and then the EMOTION arrives: not heard, FELT, washing the tiers like warm water. Two thousand strangers grinning at once and none of them knowing why.',
    performance2: 'You know why. You\'ve felt a hum like this before — in a vial, in a node, under a grove. Hers is tuned to the heart where the grove\'s is tuned to the green, but it is the SAME instrument. Somewhere in this city, you\'d wager a ledger has four small letters next to her name.',
    performance2druid: 'You know why — and it is worse than knowing. Her hum reaches the tiers and BRUSHES YOURS, string against string, and for half a beat the dancer misses a step no one else notices. From the stage, mid-spin, two thousand faces deep, she finds you. Her grin does not falter. Her eyes say: huh.',
    cookie: {
      name: 'COOKIE',
      greet: 'She\'s at the guild board before you are, still in the red, hair pinned with what is definitely a stolen quill. "You\'re the pit one. Karridge. They do a CHANT about you, it\'s very dramatic." She doesn\'t wait for an answer. "I\'m Cookie. I\'m taking the saltcellar job and I need a front line. You\'re hired. I pay in exposure and one (1) gold."',
      greetDruid: 'She\'s at the guild board before you are — and she goes still the moment you\'re close, head tilting like a tuning fork. "...Huh. There it IS. You were at the show. Third tier, left. You HUM." She looks you up and down with frank delight. "Green-flavored. Mine\'s all heartstrings. Okay, two questions: saltcellar job, you in? And does dad know about YOU too, or is he still collecting us by accident?"',
      jobBrief: '"Saltcellar by the canal. Something\'s chewing through the pork shipments and the warehouse boys won\'t go down past the third step. Guild says rats. Rats don\'t leave FROST on the railings. Probably wights. Possibly worse. Definitely fun."',
      afterJob: '"See, THAT\'S a front line." She flips a silver to the warehouse boy watching from the stairs. "Drinks would be on me, except—"',
      afterCult: '"—FOUR of you this time? I\'m FLATTERED." She straightens her hair-quill, breathing hard, grinning harder. "They keep sending little shopping parties. One day someone\'s going to explain to them what happened to the wererats." A beat — the grin banks down to something older. "You broke one of their camps out east. I heard. They don\'t stop, you know. They just re-letter the ledger." She presses the promised gold into your hand and one extra. "For the warning you didn\'t have to ride three days to give me. Tell the road I said hi."',
      afterCultDruid: '"—FOUR of you this time? I\'m FLATTERED." She catches her breath, then looks at you — really looks. "They had two cart-cages, cousin. TWO." The grin banks down to something older. "Whatever we are, we\'re worth more to them alive, which means we never stop being worth it. So: rule one, never be boring. Rule two, never be ALONE when it matters." She presses the gold into your hand, plus one extra, plus — quickly, like it costs her — a squeeze of your wrist. "Family discount. If you ever find out whether dad knows... I get the letter first."',
    },
    saltcellarBanner: ['THE SALTCELLAR', 'rats don\'t leave frost'],
    cultBanner: ['FOUR SMALL LETTERS', 'the ledger never stopped'],
    done: 'The coach south leaves at dawn. Varenholm\'s glass lamps go gold behind you. Somewhere in the Crown Quarter a dancer who is exactly as hunted as she is famous takes a third encore, because the best place to hide from the dark is the absolute center of the light.',
  },

  // Druid-only heritage thread — she is Amaris's daughter, conceived 25 years ago
  // in Millhaven by a quiet swordsman traveling under an alias. Amaris never knew
  // who he was. The Druid's "unnatural" strength is a Verdance Ember. (Retcon logged
  // in docs/LORE_BIBLE.md; Amaris alive and untouched, both campaigns intact.)
  druid: {
    marlowBeat: ' ...You\'d know about gifted, I\'d wager. The way the herb-pots on my sill lean toward you when you walk past. No offense, champion.',
    shenSamaAdd: ' He stops, half-turned. Nostrils flare, like catching woodsmoke. "...And yours, sister. Verdance, if I had to guess — life-magic gone loud. You don\'t even know what you\'re carrying, do you?" Something almost gentle crosses the old eyes. "Stay away from the Ashenveil. ESPECIALLY you. What they\'d render you down for is the one thing they can\'t brew."',
    vialHum: ' For you it is worse: the vial hums in your TEETH, in the wet of your blood, the way the grove node hums — the way, you realize with a cold drop, that YOU hum. You have always thought everyone could hear the green singing. They can\'t.',
    finaleGaze: 'And then he stops. Not on the vial. On YOU. For three heartbeats the Emperor of everything looks at you the way a man looks at a song he heard once, years ago, in a town whose name he traded away. He almost frowns. He moves on. He does not know what he is leaving in the plaza — and you, who have your mother\'s caution if not her contentment, do not tell him.',
    finaleGazeEmpty: 'You linger when the plaza empties. The road north stays bare. Whatever the Emperor is, whatever he was to a frontier farm twenty-five years ago, today he is a closed door — and you, who came all this way carrying a question shaped like a sword, fold it up and put it away for another season. The green keeps singing. You are getting better at admitting you can hear it.',
    captureBanner: ['THEY CAME WITH CHAINS', 'not to kill you — to TAKE you'],
    captureSign: 'They knew your routes. They were waiting off the path with sedative oils, a reinforced cart, and a ledger page bearing one word in scribe\'s shorthand: VERDANCE. Underlined. Twice.',
    captureAfter: 'The cart burns. The chains go into the river. But the ledger page is the part you keep: they did not come hunting a pit champion. They came shopping — and you are the listed item. The grove keeper was right. The line runs thin because something is drinking from it, and whatever it is has now tasted your name.',
  },

  // ===== THE WARLOCK'S ROAD, EXTENDED — the plaza was not the ending. It was the AUDITION. =====
  // After the Emperor passes: the White Order ambushes him (sanctioned killers, hard fight),
  // a cult letter finds him, the Pale Courier names the price of peace, and the black carriage
  // carries him to the Ashenveil — where LADY NYX herself offers the only protection that
  // outranks a kill-writ: a job. Hunt Ankuspawn. Capture, never kill. The web pays.
  warlockEpilogue: {
    main: [
      { id: 'wq1-the-white-writ', title: 'THE WHITE WRIT',
        text: 'The Emperor\'s dust had not settled before they came through the crowd — two paladins of the White Order, an inquisitor with a ledger of your summons, and a demon hunter who said nothing and counted his bolts. The writ names you, your portals, and everything that has ever stepped out of them.',
        objective: 'The plaza empties for a reason. Answer the writ.' },
      { id: 'wq2-a-friend-of-the-family', title: 'A FRIEND OF THE FAMILY',
        text: 'A letter with no seal, from no courier anyone saw. They watched the plaza. They know the Order does not stop at one writ. They offer "better arithmetic" — and a meeting in the alley behind the west wall, after dark.',
        objective: 'The dark alley by the west wall. Come alone. (You were always going to.)' },
      { id: 'wq3-the-matron', title: 'THE MATRON',
        text: 'The black carriage waits by the guild, and the horses do not breathe. At the end of the ash road: the Ashenveil academy, the school the rumors only whisper about — and the lady who runs the web your whole hunt has been brushing against.',
        objective: 'Take the black carriage. Meet Lady Nyx at the Ashenveil academy.' },
    ],
    ambush: {
      banner: ['THE WHITE WRIT', 'paladins, inquisitors, demon hunters — a hard lesson in theology'],
      haldric: 'They part the dispersing crowd like a blade through wool: two paladins in Writ-white, an inquisitor thin as a margin note, a demon hunter already loading. The lead paladin\'s voice carries court-room calm. "Warlock of Karridge. Ser Haldric, of the White Order. Your menagerie has been weighed, your portals catalogued, your... arch devil... witnessed by two thousand citizens at a sanctioned games." He unrolls nothing; the writ is memorized. "The Order thanks you for the camp you burned. The Order is not in the habit of leaving the instrument lying about after the surgery."',
      sallow: 'The inquisitor does not look up from the ledger. "Eleven summonings, public. One transformation, public. Zero licenses." A small, terrible smile at the margin. "The arithmetic sentences itself."',
      lose: 'the Order regroups. the writ stands. (the plaza will host them again)',
      winNarr: 'It is over by the time the crowd dares to look back. Writ-white does not stay white. The demon hunter\'s last bolt is still in the air when the portal takes you sideways out of its path, and then it is only you, the bodies, and a plaza that has learned a brand-new chant it is too afraid to use. By nightfall, every door in Karridge is locked to you. On your sill, where no courier was seen: a letter with no seal.',
      letter: '"We watched. Competent work — they were SANCTIONED, warlock, and there will be more writs, then knights, then whatever the Order keeps below the knights. We offer better arithmetic. The alley behind the west wall, after dark. Come alone. — A friend of the family."',
    },
    courier: {
      name: 'THE PALE COURIER',
      meet: 'She is waiting where the lamplight gives up — elegant, bloodless, dressed like a funeral that money attended. "The plaza was poetry," she says, by way of greeting. "Three professions, one survivor, and the survivor wasn\'t theirs." She does not bow. The cult does not bow to applicants. "My Matron makes problems like yours into careers. The writ on your name? It dies in committee the moment hers signs it. She would like to meet you. The black carriage, by the guild. The horses are patient. They have nowhere better to be — they\'re dead."',
      decline: '"Decline?" The word seems to amuse her the way weather amuses mountains. "Then we never met, this alley stays dark... and the next writ finds you SLEEPING. The Order forgives nothing. My Matron forgives everything she finds useful." She is already walking away. "The carriage waits either way."',
    },
    carriage: 'The carriage is upholstered in a silence that costs more than the inn. The horses do not breathe, do not tire, do not stop. The road runs out of farms, then out of green, then out of birdsong — and the Ashenveil begins: ash-grey fields where the DEAD are working, neat as clockwork, mending fences for a kingdom that officially does not employ them.',
    nyx: {
      name: 'LADY NYX',
      reveal1: 'The academy\'s great hall is colder inside than the night outside, and the woman at the far end of it has been dead longer than the kingdom has had a name. She does not look it — she looks like the portrait of someone\'s beloved queen, if the portrait moved, and chose you, and smiled. "The warlock of Karridge," says Lady Nyx, Matron of every ledger you have been bleeding for a season. "You burned my waystation. Broke my caravan. Freed my inventory. And then unmade a White Writ in open daylight." The smile deepens by one degree. "Most candidates apply with a LETTER."',
      reveal2: '"Let us be adults about the arithmetic. The Order will not stop — you killed SANCTIONED men, and their god keeps books. You need protection that outranks a writ. There is exactly one signature in this kingdom that does." She does not say her husband\'s name. The whole room says it for her. "And I — I have a procurement problem. The gifted. The Ankuspawn. My collectors keep bruising the merchandise, and the merchandise keeps being RESCUED by talented freelancers." The dead light in her eyes finds yours, amused. "You see the shape of the offer."',
      offer: '"Hunt the Ankuspawn. CAPTURE — never kill; dead stock is worthless stock. In exchange: my seal on your name. Diplomatic protection, warlock — kill-writs die in committee when the crown\'s own shadow countersigns. The Order may hate you forever. It may do so in WRITING, from very far away." She extends one perfect, room-temperature hand. "Terms?"',
      done: 'Somewhere north, an Emperor passes through cities like weather. Somewhere east, a grove hums over a line that runs thinner every season. And in the Ashenveil, a warlock signs nothing — the cult does not use paper for the things that matter — and walks out with the only armor the Order cannot pierce: employment. The hunt continues. It simply hunts for the web now.',
      credits: 'THE WARLOCK\'S ROAD — the writs die in committee, and the web has a new spider',
    },
  },

  // ===== THE WARLOCK'S HUNT (wq4) — Nyx's first contract: capture five Ankuspawn ALIVE. =====
  // The plaza was the audition; the offer was the callback; THIS is the job. Five gifted,
  // one per zone, captured never killed (dead stock is worthless stock). Climax: Cookie of
  // Varenholm, behind a Druid protector (two bosses). Canon: this is the WARLOCK'S POV of the
  // crossing — the Druid campaign tells the same meeting from her side (she guards; he hunts).
  // DATA ONLY this pass; scene wiring (cult-coach travel, WorldScene.tryHuntCapture, nyxDialog
  // launch, objective() routing, journal beats into mainFor) lands next run. New speakers are
  // mapped to existing voice ids in game/tools/voice_config.json. See docs/AUTOWORK_LOG.md.
  warlockHunt: {
    huntFlag: 'q-wq4-the-hunt',
    // Nyx hands over the list — this LAUNCHES the hunt instead of rolling the credits.
    launch: {
      name: 'LADY NYX',
      brief: 'The Matron does not shake on it. She slides a folded vellum across the cold table; it is warm, which is worse. "Five names, warlock. My collectors lost them — to rescue, to flight, to their own clumsiness. I want them back BREATHING. A grove-child who makes the green bleed. A boy in the dark who will not let things die. An ash-wick burning in the high cold. And a Listener who walked out of my OWN lower levels with a head full of my ledgers." A pause, precise. "The fifth name I have wanted longest. We will come to her."',
      charge: '"Capture, warlock. Cages, not cairns. A corpse is an apology; a captive is an asset. Bruise them if you must — break them and the contract breaks with them." The vellum folds itself shut. "The black carriage is yours now; it goes where the leash needs to reach. Bring me five, and the Order screams your name into a pillow forever."',
      go: ['"Five cages. Clean arithmetic. The hunt is on."',
           '"They ran from your collectors. They will not run from me."'],
    },
    // ---- the five targets (one per zone) ----
    targets: [
      { id: 'briar', zone: 'thorn-grove', region: 'Thorn Grove',
        name: 'BRIAR, THE GREEN ORPHAN', voice: 'Briar',
        gift: 'Verdance — the grove bleeds sap where she weeps; the wound never closes.',
        banner: ['THE GREEN ORPHAN', 'capture — do not let the grove keep her'],
        approach: 'She is not lost; the grove HID her, folded her into a bower of living thorn that leans away from you and toward her like courtiers. A girl no older than a sapling looks out from the green. "You smell like the cold men," she says, and the brambles stand up. "The cold men with the soft cages. I made the trees say NO last time." The bower bristles into a wall of root and tooth.',
        opt: ['"Easy, little weed. My cage is warmer than theirs." (measure)',
              '"The trees said no. I did not ask the trees." (sever)'],
        pack: [{ type: 'rotwarden', boss: true, deathCol: '#7fbf6a', x: 640, y: 300, r: 28, hp: 720, maxhp: 720, spd: 70, col: '#3a5a2c', wpn: '#2c4420', dmgScale: 1.4 }],
        capture: 'The bower comes apart strand by screaming strand. When the last root lets go she is just a child again, sap-streaked and furious, small enough to lift. The cult\'s cage is cold-iron lined in moss — someone planned for her. She does not cry where you can see it. Behind you the grove closes its wound at last, because the thing that kept it open is in a box. ONE.',
        flag: 'cap-briar' },

      { id: 'ossuary', zone: 'grove-dungeon', region: 'the grove dungeon',
        name: 'OSSUARY, THE QUIET BOY', voice: 'Ossuary',
        gift: 'Necrourgy — near him the dead forget to stay down and the dying forget to finish.',
        banner: ['THE QUIET BOY', 'everything down here is already his'],
        approach: 'The dungeon is loud with things that should be silent — bones reknitting, a rat dying and undying in the same corner forever. At the center sits a boy with his knees drawn up, ringed by skeletons that orbit him like moons around a patience. "They keep me company," he says, not looking up. "They can\'t leave. I can\'t MAKE them leave. The cold men knew that — a quarry that digs its own guards." The orbit tightens.',
        opt: ['"Then keep me company too, boy — for exactly one fight." (measure)',
              '"Call them off, or I unmake every one in front of you." (threaten)'],
        pack: [{ type: 'necro', boss: true, deathCol: '#7fd0ff', x: 640, y: 260, r: 20, hp: 740, maxhp: 740, spd: 75, col: '#b8b0a0', wpn: '#7fd0ff', dmgScale: 1.4 }],
        capture: 'You cut the orbit down faster than he can refill it, and for one breath the dungeon is, for the first time in years, simply DEAD. The boy looks at the stillness he made by accident and goes very pale. The cage you bring is bone-dry and salted — Nyx\'s people understand exactly what he is. "Will it be quiet where you take me?" he asks. You tell him the truth, which is no. He almost smiles anyway. TWO.',
        flag: 'cap-ossuary' },

      { id: 'cinder', zone: 'dragonspine', region: 'Dragonspine',
        name: 'CINDER, THE ASH-WICK', voice: 'Cinder',
        gift: 'A living flame the high cold cannot drown — he burns and is not consumed.',
        banner: ['THE ASH-WICK', 'a fire that will not go out is worth a kingdom in the cold'],
        approach: 'On a ledge where the snow should have buried him a week ago, a thin figure sits in a ring of melt-water, steaming, alive, ASH where a man\'s skin should be and embers where his eyes should. "Come to put me out?" The voice crackles like green wood. "Everyone wants to put me out, or BOTTLE me. The treaty-things up here just let me be warm. First kind thing the mountain ever did." He stands; the ledge dries around him; the air bends with heat.',
        opt: ['"Not put you out. Carry you somewhere your fire is wanted." (measure)',
              '"Bottle, cage — what\'s the difference to ash? Burn, then." (cold)'],
        pack: [{ type: 'pyre', boss: true, deathCol: '#ffb060', x: 640, y: 250, r: 18, hp: 700, maxhp: 700, spd: 150, col: '#7a3a2a', wpn: '#ffb060', dmgScale: 1.4 }],
        capture: 'You give the fire nothing to catch and everything to spend, and when it gutters low he sits down hard in his own melt-water, smoking, spent, still alive — he is ALWAYS still alive, that is the entire point of him. The cult\'s cage is a lattice of cold-iron and packed snow that hisses as they fill it. "Somewhere my fire is wanted," he repeats, bitter and small. "You lied like you meant it. I respect that." THREE.',
        flag: 'cap-cinder' },

      { id: 'whisper', zone: 'ashenveil', region: 'the Ashenveil',
        name: 'WHISPER, THE NINTH WARD', voice: 'Whisper',
        gift: 'She hears every ledger read aloud — she walked out of the Academy\'s OWN lower levels.',
        banner: ['THE NINTH WARD', 'she knows what the Matron knows — bring her back QUIET'],
        approach: 'This one Nyx wants for reasons she did not fully say. A woman in the grey shift of the lower wards stands in a fallow row, eyes bound, head cocked, listening to a field that should make no sound. "You\'re the new dog," she says before you speak. "She gave you five names. I\'m the one she said LAST about and meant FIRST." She turns the blindfold toward you like a face. "I heard your whole contract through nine floors of stone, warlock. I can hear the part she didn\'t say out loud. Want me to tell you?" The dead in the rows all stop working at once.',
        opt: ['"Tell me nothing. I\'m paid not to listen." (measure)',
              '"She wants you gagged for a reason. Let\'s find it the loud way." (silence)'],
        pack: [{ type: 'collector', boss: true, deathCol: '#b070f0', x: 640, y: 270, r: 20, hp: 760, maxhp: 760, spd: 145, col: '#4a3c5a', wpn: '#b070f0', dmgScale: 1.45 }],
        capture: 'You end it before she can spend whatever she overheard, and the field of dead lurches back into its patient labor as her focus breaks. The cage they bring is the cruelest yet: leaded, lined, deaf — a box that hears nothing, so she can speak to no one. As they seal it she finds your face one last time. "She\'ll cage you too, you know," she says, kindly. "When you\'ve heard too much." FOUR.',
        flag: 'cap-whisper' },
    ],

    // ---- the fifth name: COOKIE of Varenholm, behind her Druid protector (TWO bosses) ----
    // Canon: warlock POV of the crossing; the Druid campaign tells it from her side.
    varenholm: {
      banner: ['THE FIFTH NAME', 'the dancer, and the green thing guarding her'],
      approach: 'Varenholm\'s glass lamps, a playbill on every post: ONE NIGHT — THE DANCER. The fifth name is the one the Matron has wanted longest — a halfling who stood up in a guild hall and TOLD a room full of strangers exactly what she is. Easy mark, the ledger says. The ledger is wrong. She is not alone: something green-eared and blunt-handed has shadowed her since the show, and it makes the back of your teeth itch the way the grove node did.',
      protect: {
        name: 'THE THORNWARDEN', voice: 'Thornwarden',
        line: 'The bodyguard steps between you and the stage door without hurry — green-eared, callused, eyes like a forest deciding whether to be a fire. "You\'re the cult\'s new hand. I can smell the ash road on you." A staff of living wood settles into a grip that has buried people. "She\'s not for your cages. Neither am I. You want her, you come through the Verdance first — and friend, I have ROOTS in this."',
      },
      cookie: {
        name: 'COOKIE',
        line: 'And then the dancer herself, still in firebird red, sliding into your path with a grin that has never once been afraid in public. "Oh, you\'re a SERIOUS one. Cages and everything." She rolls her shoulders; the scroll-marks on them catch the lamplight gold, and the air goes warm and wrong — two thousand heartbeats of borrowed joy turning to teeth. "Rule one, cousin: never be boring. You\'re about to learn rule two — never corner a dancer with an audience."',
      },
      pack: [
        { type: 'rotwarden', boss: true, deathCol: '#7fbf6a', x: 520, y: 270, r: 26, hp: 720, maxhp: 720, spd: 80, col: '#2c5a30', wpn: '#1c3a20', dmgScale: 1.4 },
        { type: 'champ', boss: true, deathCol: '#ff7a5a', x: 760, y: 270, r: 18, hp: 680, maxhp: 680, spd: 165, col: '#c8443a', wpn: '#ffb060', dmgScale: 1.4 },
      ],
      capture: 'It takes everything Nyx is paying for. The Thornwarden goes down rooted to the spot he swore to hold; the dancer goes down still moving, because she does not know another way to go. Two cages this time — the cult learned, after the camp out east, to bring spares. As the leaded lid comes down on the firebird red she finds your eyes through the bars and, impossibly, WINKS. "They keep sending little shopping parties," she says. "One day someone explains to them about the wererats." Then the latch, and the long quiet road back to the Ashenveil. FIVE.',
      flag: 'cap-cookie',
    },

    // ---- deliver all five to Nyx -> the road's end ----
    deliver: {
      name: 'LADY NYX',
      line: 'Five cages stand in the cold great hall, and the Matron walks the row of them the way other women walk a garden. Grove-child, quiet boy, ash-wick, the deaf box that was her Ninth Ward, and — longest-wanted — the dancer, who blows her a kiss through leaded bars. "Complete," says Lady Nyx, and the word in her mouth is a payment. "The Order will write its writs. They will mean nothing. You are the crown\'s shadow\'s shadow now, warlock — protected by a signature no paladin dares read aloud." She does not thank you. The cult does not use that word either. "Rest. The web always has a sixth name."',
      go: ['"There is always a sixth name. I\'ll be here."'],
      credits: 'THE WARLOCK\'S ROAD — five cages delivered, and the writs die in committee forever',
    },
  },

  // ===== THE CROSSING (dq) — the Druid's POV of Varenholm: she GUARDS; the warlock HUNTS. =====
  // Canon mirror of warlockHunt.varenholm (the same meeting from her side). After the Druid
  // befriends Cookie the dancer, the cult's new warlock arrives with cages. She breaks him; he
  // rises again with Anku reinforcements; she and Cookie flee UP — to the Dragonspine treaty
  // lands, seeking dragon-fire for protection. There they find SHEN SAMA (the fugitive dragon
  // from cult.shenSama / druid.shenSamaAdd), who is hunting the same shelter she is: IGNIS, the
  // hearth-wyrm who has kept gifted strays warm for an age — and who has gone MISSING. New lore
  // kept consistent with the Dragonspine treaty dragons Aurvaeth (treaty-bound) and Vesshk
  // (wyvern matriarch): Ignis is a THIRD, un-treatied fire-dragon; her vanishing is the hook.
  //
  // DATA ONLY this pass (text bank + mainFor journal entry). Scene wiring (a Varenholm trigger
  // that launches the crossing, the rematch, the flee-to-mountain travel, objective() routing,
  // the Shen Sama meet) lands in later runs. New speaker SHEN SAMA must be mapped to an EXISTING
  // voice id in voice_config.json AND extracted into the manifest (constraints 8 & 9) BEFORE any
  // "voices ready" claim — NOT done this run. Keep dialogue TEXT-ONLY. See docs/AUTOWORK_LOG.md.
  druidCrossing: {
    crossFlag: 'q-dq-the-crossing', // 'active' once the warlock strikes in Varenholm; 'done' after Shen Sama
    // progress flags (set later by scene wiring; documented here as the single source of truth):
    //   dq-cross-warlock — the cult warlock is broken the first time (phase 1 fight won)
    //   dq-cross-cult    — the Anku reinforcements are thrown back (phase 2 fight won)
    //   dq-cross-flee    — Cookie is gotten clear of Varenholm, up the spine trail (travel beat)
    //   dq-cross-shen    — Shen Sama is found on the Dragonspine; the hunt for Ignis is shared (done)

    // ---- phase 0: the dancer, befriended, and the chains that follow her ----
    cookie: {
      name: 'COOKIE',
      line: 'The firebird dancer drops onto the bench beside you still in her stage red, breathless, grinning the grin that has never once been afraid in public. "Okay, cousin — you HUM, dad collects us by accident, and you smell like a forest that has opinions. We are absolutely related in the way that matters." Then her grin tips, just slightly, toward the street. "...Also we are being watched by a man who brought CAGES to a dance recital. Rule one, never be boring. Rule two: never be alone when it matters. Stand up slow."',
    },

    // ---- phase 1: the cult warlock arrives — capture, never kill (her side of warlockHunt.varenholm) ----
    warlock: {
      name: 'THE CULT WARLOCK', voice: 'Warlock', // map to existing Warlock id when voiced (later run)
      banner: ['THEY CAME WITH CAGES', 'the green thing is supposed to be the EASY part'],
      arrive: 'He steps out of the lamplight wrong — the way a portal-stitched man steps, half a breath behind his own shadow. Cult-ash on his coat, a leaded cart-cage breathing behind him on dead-eyed horses. "The dancer," he says, bored, reading a folded vellum he does not need to read. "And a bodyguard the Matron\'s ledger forgot to price. Verdance, isn\'t it? You hum like the merchandise." He pockets the list. "Stand aside, grove-thing. My contract is the halfling. You I\'ll take if you make me — alive pays better than dead."',
      cookieQuip: 'Cookie cracks her knuckles, scroll-marks gold in the lamplight. "He called you MERCHANDISE. In MY town. On show night." Two thousand borrowed heartbeats of joy go warm and wrong in the air around her. "Cousin, would you do the honors? I\'ll do the encore."',
      opt: ['"She\'s not a line in your ledger. Neither am I." (root him where he stands)',
            '"You brought a cage to the wrong recital." (the grove answers)'],
      pack: [{ type: 'collector', boss: true, deathCol: '#b070f0', x: 640, y: 260, r: 20, hp: 760, maxhp: 760, spd: 140, col: '#3a2a4a', wpn: '#b070f0', dmgScale: 1.45 }],
      down: 'He folds. The portal-stitch lets go and for one breath he is just a thin, winded man in an expensive coat, face-down in the dancer\'s town. The cart-cage stands open and empty behind him. You did not even have to kill him. The grove, for once, is quiet about it.',
      flag: 'dq-cross-warlock',
    },

    // ---- phase 2: the cinematic — he gets back up, and he is not alone ----
    rematch: {
      banner: ['HE GETS BACK UP', 'and the ash road got OUT of the cart with him'],
      druidLine: 'You crouch by the downed man — old habit, your mother\'s habit, check the breathing even of the thing that came to crate you. "Stay DOWN," you tell him, almost gently. "Walk back to your Matron with nothing. Tell her the green said no."',
      warlockRise: 'He laughs into the cobbles. It is not a well man\'s laugh. "Down? Grove-thing, I don\'t get to go back with NOTHING." He pushes up on hands that are already smoking, and the ash on his coat lifts off him and STANDS — cult-shades pouring out of the leaded cart in the shapes of the men and women they cored to fill it. "The Matron does not employ losers. So I will spend her whole advance right here. CAGE the dancer. Render the weed."',
      cookieLine: '"...Okay, THAT\'S a lot of him," Cookie admits, backing toward you, fists up, grin gone thin and bright. "New plan, cousin. We win this one, and then we run somewhere even the ash road won\'t follow. You know any dragons?"',
      opt: ['"Then spend it. I have my mother\'s patience — and worse." (stand with Cookie)',
            '"On your feet, dancer. We break this, then we climb." (hold the line)'],
      pack: [{ type: 'collector', boss: true, deathCol: '#b070f0', x: 640, y: 250, r: 20, hp: 700, maxhp: 700, spd: 140, col: '#3a2a4a', wpn: '#b070f0', dmgScale: 1.4 },
             { type: 'grave', x: 520, y: 320, hp: 320, maxhp: 320, spd: 150, r: 13, col: '#4a3c5a', dmgScale: 1.35 },
             { type: 'grave', x: 760, y: 320, hp: 320, maxhp: 320, spd: 150, r: 13, col: '#4a3c5a', dmgScale: 1.35 }],
      down: 'The shades come apart like blown ash; the warlock goes down a second time and this time STAYS down, spent past summoning, the Matron\'s advance burned to nothing in a dancer\'s street. He will live. He will go back with empty cages and a worse problem than you. But the ledger has your scent now — VERDANCE, underlined twice — and that is a debt the Ashenveil always comes to collect.',
      flag: 'dq-cross-cult',
    },

    // ---- phase 3: the flight — up, where fire still keeps the gifted warm ----
    flight: {
      banner: ['UP THE SPINE TRAIL', 'where treaty-fire still keeps strays warm'],
      text: 'You do not wait for the second cart. Varenholm\'s glass lamps fall away behind you, then the farms, then the green itself, until the air goes thin and rude and the Dragonspine opens overhead — the treaty lands, where everything too proud or too heavy for the valley went up to become a legend about itself. Cookie keeps pace on dancer\'s legs, breath ghosting in the cold. "There\'s a story," she pants, "the strays tell. A dragon up here that doesn\'t do the treaty, doesn\'t do cages, just keeps the warm ones WARM. Ignis. Hearth-wyrm. If anyone in this world won\'t sell us, it\'s her." You climb toward a heat you can already feel humming, the way the grove node hummed, the way YOU hum.',
      flag: 'dq-cross-flee',
    },

    // ---- phase 4: Shen Sama — and the hearth gone cold ----
    shen: {
      name: 'SHEN SAMA', voice: 'ShenSama', // NEW speaker -> map to an EXISTING voice id (later run)
      banner: ['THE HEARTH IS COLD', 'two fugitives, one missing flame'],
      meet: 'You find the warm place, and it is OUT. A scorched hollow under the highest cairns where the snow has not dared settle in an age — and crouched in the dead-warm ash, a traveler who is not a traveler: scales like cooling slag under a hood, eyes too old for the face. The fugitive dragon. He does not run this time. He is too tired, or the hollow matters too much. "You felt it too," Shen Sama says, not a question. "The hearth-song. You climbed all this way toward Ignis." A clawed hand turns over a fistful of cold cinder. "So did I. She has kept the un-treatied warm since before Aurvaeth signed his peace — strays, fugitives, the gifted the valley wants to render. She would have hidden your dancer in a heartbeat." He lets the ash fall. "And she is GONE. No fire. No feathers of smoke. Just this cold hollow, and her last warmth, and the shape in the snow of something large that did not leave a single track."',
      cookieLine: '"...Missing," Cookie repeats, very quietly, the grin finally, completely gone. "The one safe place, and it\'s missing too." She looks at you, and at the cold ash, and the borrowed joy in her does not have anywhere to land. "Cousin. Everyone who could shelter us keeps DISAPPEARING. That\'s not bad luck. That\'s a pattern."',
      shenClose: 'Shen Sama rises, slag and shadow, and for the first time looks at the two of you not as cargo to avoid but as company in a thin season. "It is a pattern, halfling, and it has a buyer." The old eyes go north, the way hunted things look. "I came up here to hide behind Ignis. Now I will find what took her instead — because whatever can vanish a hearth-wyrm without a track will not be stopped by a grove-child or a dancer or a worn-out wyrm alone." A long pause, geological. "...Three, though. Three is a different arithmetic. Stay near the warm ash, sisters. We hunt the missing flame together — and the green keeps singing the whole way up."',
      flag: 'dq-cross-shen',
    },

    credits: 'THE CROSSING — the cages came, the green said NO, and three fugitives went up the mountain after a missing flame',
  },


  // ===== THE RONIN'S RECKONING (rq) — Vorathiel, the defiled temple, the Seraphim =====
  // Item 7: a VOICED epilogue questline for the RONIN (Kenji), appended AFTER his original
  // ending (runFinale's RONIN branch sets q-mq5-ash-and-silence='done' and rolls
  // 'THE RONIN'S ROAD'). Gate everything on: char==='ronin' AND q-mq5-ash-and-silence==='done'.
  //
  // CANON (character_tracker.md — Kenji ~L279, Shen Sama ~L201, Ignis ~L435; mirrored here so the
  // dialogue stays faithful without re-opening the lore root):
  //   - The ARPG "Ronin" IS Kenji = in the novels ANKUNYX, an elder BLACK dragon, the Lv40 Dragon
  //     Emperor, playing dress-up as a nobody pit-fighter. Vorathiel calls this out to his face.
  //   - VORATHIEL: Dragon God Queen of the Dragonspine peaks; Shen Sama's mother; she and Kenji are
  //     Shen's parents (Shen hatched from her egg). She raised Shen and now HUNTS him because he fled
  //     to live among humans / become an adventurer-monk (the same fugitive dragon met in the Grove).
  //   - IGNIS, "The Firebird": an elder fire/red dragon who lived among humans as a bard; Shen's
  //     HALF-SISTER and the ELDER PRECEDENT for living among mortals. Ignis's mother is a SEPARATE
  //     red dragon — NOT Vorathiel. So Vorathiel frames Ignis as the precedent, never as her own
  //     daughter. (Do not invent parentage; defer to character_tracker.md on any conflict.)
  //   - THE SERAPHIM recruits mortal heroes for the side of the gods and only intervenes in person
  //     for threats beyond mortals (the arch devil). Someone DEFILING temples drains the gods' power
  //     — and thus his own — which is why this one matters to him.
  //
  // DATA ONLY this pass (text bank + combat tuning). Scene wiring lands in later runs: a CityScene
  // Marlow tip, a guild quest + spine passage (mirror the warlock cult-coach OR open the grove->spine
  // gate while rq is active), a MountainScene proximity trigger for the Vorathiel descent, the
  // fight/beg branch, the defiled-temple wave + destructible gate, the Seraphim beat, the guild turn-in,
  // and QuestNav.objective() routing inn->guild->mountains->temple->guild. Honor item 1.5 (no fights
  // while a dialog/cinematic is open) on EVERY new trigger.
  //
  // VOICE (deferred to a later run, exactly as the warlockHunt/druidCrossing data passes deferred
  // theirs — constraints 8 & 9): NEW lines only. Speakers: MARLOW (exists), GUILD CLERK (map to an
  // existing voice id), VORATHIEL (NEW -> map to an EXISTING fitting female id already in
  // voice_config.json, e.g. Nyx / Sylvara / Veiled Woman; do NOT design a new voice), THE SERAPHIM
  // (exists), ronin lines = PLAYER-RONIN (exists). When the wiring run is ready, ADD add()/speakerSlots
  // for VORATHIEL + GUILD CLERK to build_voice_manifest.js, rebuild (count grows; all resolve; none
  // clean to empty), THEN write "VOICES READY TO GENERATE (ronin ending)". NOT claimed this run.
  roninEnding: {
    epiFlag: 'q-rq-epilogue', // 'active' after Marlow's tip; 'done' after the final guild report
    gate: { char: 'ronin', requires: 'q-mq5-ash-and-silence' }, // also requires that flag === 'done'
    // progress flags (set later by scene wiring; documented here as the single source of truth):
    //   rq-epi-guild     — the guild gave him the Seraphim investigation + opened the spine passage
    //   rq-epi-vorathiel — the Vorathiel confrontation resolved (FOUGHT-and-won OR BEGGED-and-spared)
    //   rq-epi-temple    — the defiled temple cleared and the demonic gate closed
    //   rq-epi-seraph    — the Seraphim has spoken (the temple-defiling revealed)
    //   (the final guild turn-in sets epiFlag 'done' and rolls the new ronin credits)

    // ---- beat 1: Marlow's tip in the city (after the ronin's original ending) ----
    marlow: {
      name: 'MARLOW',
      tip: 'Marlow leans across the bar with the look of a man passing along a debt he would rather not hold. "Ronin. The Adventurers\' Guild sent a runner — sober, which is how I knew it was bad. They\'ve a request come down strange, and they asked for YOU. By name. By that name you don\'t use." He polishes a glass that is already clean. "I told them you\'d gone. They said the work would wait. Whatever you are when the lamps are out, friend — the guild knows enough to ask, and not enough to be smart about it. Go see them before they go asking louder."',
      go: ['"By name. By that name." (go to the guild)',
           '"The guild can keep its strange requests warm. ...Or I can go look." (go to the guild)'],
    },

    // ---- beat 2: the guild quest — investigate the SERAPHIM, last seen in the mountains ----
    guild: {
      name: 'GUILD CLERK', voice: 'GuildClerk', // map to an existing voice id when voiced (later run)
      brief: 'The clerk does not look up from the writ until you are close, and then she looks up too fast. "You came. Good. Sit, don\'t sit, whatever you — " She squares the page. "There is a figure abroad in the high country. Winged. Bright. Folk are calling it a SERAPHIM, an angel, and they are not wrong often enough for me to laugh. It is not killing. It is RECRUITING — choosing fighters, leaving the rest shaken and blessed and useless to us for a week. The guild wants to know what it WANTS. And the guild wants someone who will not flinch at the holy or the high." A breath. "Which is, apparently, you."',
      charge: '"Last sighting: the Dragonspine. The treaty lands — where everything too proud for the valley goes up to become a legend about itself. You can\'t take the trail as you are; the wards read the road. So the guild bought you a passage — a spine-coach with a treaty-seal that the stone will honor. Find the angel. Learn its business. Come back breathing." She slides a sealed token across the desk. "Don\'t make me explain to the masters why I sent the one fighter who scares the OTHER fighters."',
      go: ['"Find the angel. Learn its business. Simple work." (take the spine passage)',
           '"The mountain remembers me better than this town does. I\'ll go." (take the spine passage)'],
    },

    // ---- beat 3: the mountains — the search, then the descent ----
    arrival: 'THE DRAGONSPINE — the treaty lands. Thin bright air, and below it the whole conspiracy-riddled valley small enough to cover with a thumb. No angel on the cairn-line. No angel at the wind-scoured shrines. Only the feeling, climbing your spine the higher you climb the mountain, that something far larger than an angel has already noticed you are here.',
    descent: {
      banner: ['SOMETHING LANDS', 'the mountain has been waiting for this one'],
      text: 'You feel the heat before the shadow — a downdraft like a forge door opening, snow flashing to steam in a wide ring. A RED DRAGON comes down out of the high sun, vast and unhurried, wings folding the way a verdict folds. It does not roar. It lands, and looks at you the way a parent looks at a child caught in a costume, and then the great red shape FOLDS INWARD — scale to silk, talon to hand — until a tall woman stands in the melt-ring where the wyrm had been, crowned in red, beautiful the way a struck bell is beautiful. She tilts her head. "There you are," she says. "Little Emperor. Still wearing the little man."',
    },

    // ---- beat 4: the confrontation (cinematic dialogue; canon) ----
    vorathiel: {
      name: 'VORATHIEL', voice: 'Vorathiel', // NEW speaker -> map to an EXISTING female id (later run)
      accuse: '"Why are you DRESSED like that?" She circles, red silk steaming. "A pit. A nameless little sword. Cheering drunks. Who do you imagine you are fooling, Ankunyx? An elder black dragon. The Dragon Emperor of an age. Playing the orphan with a borrowed blade." Her voice does not rise; it does not have to. "It is CHILDISH. It was childish in the Pit and it is childish on my mountain."',
      roninDeny: '"...I don\'t know what you\'re talking about." (the nameless ronin\'s oldest line)',
      hunt: '"Of course you don\'t." A smile with no warmth in it. "Then I will tell you what I know. I am hunting my SON. OUR son — though you were a closed door the day his egg cracked and have been one since. Shen. He has fled the peaks to live DOWN there, among the soft ones, to call himself a wanderer, a monk, an ADVENTURER." The word is acid. "Like his sister before him. Like Ignis — the Firebird who threw away an age of fire to strum a lute in human taverns. I will not lose a second child to the valley\'s little dream. You will help me drag him home."',
      roninAsk: '"...I\'ll keep an eye out for him." A pause. "I came up here for a different name. An angel. They call it the Seraphim — have you seen it on your mountain?"',
      ultimatum: '"An ERRAND." She laughs, and the melt-ring widens. "You stand before the Dragon God Queen, the mother of your own hunted child, and you ask after an ANGEL for a guild of strangers." The red around her brightens to a glare. "I am DONE with the costume, Ankunyx. I will burn the little man off you, I will beat the black dragon under him bloody, and I will drag both halves of you up this mountain by the neck to find our son. The other mothers indulge your wandering — your scattered little brood, your dancers and your strays. I will NOT. You will take responsibility, or you will be MADE to."',
    },

    // ---- beat 5: the choice ----
    choice: {
      prompt: 'The melt-ring steams. The mountain holds its breath. The Dragon God Queen waits — and behind her, somewhere on this peak, the angel the guild sent you for.',
      fightOpt: 'FIGHT her — refuse the leash; the costume holds.',
      begOpt: 'BEG — kneel, ask forgiveness, ask for TIME to finish the Seraphim first.',
    },

    // BEG branch -> she relents (grants time), skip the human fight, proceed to the temple.
    beg: {
      name: 'VORATHIEL',
      kneel: 'You go down on one knee in the steaming melt — the nameless ronin and the elder Emperor both, for once in the same posture. "Then make me," you say, low. "But not today. There is an angel on your mountain doing the gods\' recruiting, and a guild of soft ones who trusted the wrong fighter with it. Let me finish that. Let me be, for one more errand, the little man — and I give you my word as the thing under him: I will look for our son with both eyes open." You do not look up. "You raised him alone because I was a closed door. I have no right to ask you for an hour. I am asking anyway."',
      relent: 'A long silence, geological, the kind only old things can hold. Then the glare banks down to embers. "...Both eyes," Vorathiel says at last, and something almost tired moves through the queenly voice. "An age of you, and THAT is the first true thing you have said to me." She steps back out of the melt-ring; the snow dares to return. "Go. Finish your angel\'s errand, little Emperor. But the door does not get to stay closed. When this is done you climb to me, and we hunt our son together — or I come DOWN there, and the valley learns why the peaks are quiet." She is already brightening toward wings. "Do not make a liar of the one honest hour you have ever given me."',
      flag: 'rq-epi-vorathiel',
    },

    // FIGHT branch -> Vorathiel HUMAN-FORM boss. On WIN she takes to the sky as the full RED DRAGON
    // (too mighty to beat) -> scripted RETREAT cutscene to the temple (NOT a winnable 2nd fight).
    fight: {
      name: 'VORATHIEL',
      banner: ['THE DRAGON GOD QUEEN', 'her human form is the MERCIFUL one'],
      vLine: '"So. The costume would rather BLEED than bow." She does not summon a weapon; she becomes one — red silk hardening to scale at the knuckles, the air around her going to forge-heat. "Good. I have wanted to knock the little man loose for a century. Hold still, my Emperor. This is the gentle half."',
      opt: ['"You called my brood scattered. You never asked why I keep them far from this mountain." (stand)',
            '"One honest hour, then. The hard way." (raise the nameless blade)'],
      // COMBAT TUNING (Hiro): "double the damage of the toughest enemy created so far, and at least
      // 3x its health." Toughest existing scene boss raw stats: hp 760, dmgScale ~1.45 (the collector,
      // warlockHunt/druidCrossing). Bosses scale x5 (boss:true) regardless of territory; base x0.5.
      // -> Vorathiel human form RAW hp = 3 x 760 = 2280 (effective ~5700, ~3x the toughest boss's ~1900),
      //    RAW dmgScale = 2 x 1.45 = 2.9. Reuse a tough melee AI type (beast — the big bruiser), boss:true,
      //    deathCol + distinct RED palette. The wiring run reconciles the exact final multipliers in-engine.
      pack: [{ type: 'beast', boss: true, deathCol: '#ff5a4a', x: 640, y: 260, r: 30,
               hp: 2280, maxhp: 2280, spd: 96, col: '#b02030', wpn: '#ffb060', dmgScale: 2.9, phase: 1 }],
      down: 'Her human shape folds to one knee in the melt — and laughs, blood bright on a queen\'s mouth, delighted. "THERE he is. The Emperor under the urchin." She rises anyway, because mercy and surrender were never the same thing to her. "But you mistook the lesson, little man. I let you win the GENTLE half."',
      // scripted retreat cutscene (NOT a second fight): she ascends to her true form; the ronin runs.
      skyward: 'The melt-ring becomes a crater. Vorathiel takes the sky as what she truly is — a RED DRAGON that blots the high sun, every scale a furnace door, a thing no blade in any pit was ever meant to face. "Run, then," her voice comes down like weather, almost fond. "Finish your angel. I have made my point, and you have made yours, and BOTH of us know how this ends." A wingbeat flattens the snow for a mile. "Climb to me when the errand is done — or I will come find the little man, and there will be no gentle half." You do the only wise thing an Emperor in a costume can do against the Dragon God Queen: you turn, and you RETREAT, up the spine trail toward the bright broken thing at the peak — the shrine the angel came for.',
      flag: 'rq-epi-vorathiel',
    },

    // ---- beat 6: the defiled temple (the Skyreach shrine) — demon wave + destructible gate ----
    temple: {
      banner: ['THE SKYREACH SHRINE — DEFILED', 'close the gate; put down what comes through'],
      arrive: 'The shrine at the peak should be the cleanest place on the mountain. It is the foulest. The dawn-stone is scrawled with a sigil that hurts to track, and where the altar stood a DEMONIC GATE hangs in the air — a wound in the world, weeping things. They come out wrong-jointed and burning, and they keep coming, because something opened this door on purpose and left it open. The Seraphim is nowhere yet. The gate is everywhere.',
      opt: ['"A temple. Of course it\'s a temple. Someone is starving the gods on purpose." (close it)',
            '"Hold the line. Break the door. Same as it ever was." (close it)'],
      // a normal-ish demon wave (reuse demon-ish AI types, reskinned infernal) PLUS the GATE as a
      // DESTRUCTIBLE OBJECTIVE (mirror the Ashenveil totem/destructible: a stationary high-hp target
      // the player must destroy to end the encounter). The wiring run reuses the existing destructible
      // pattern; spd:0 + a 'gate'/destructible marker keeps it as the objective, not a chaser.
      pack: [{ type: 'grave', boss: true, deathCol: '#ff6a3a', x: 640, y: 230, r: 30,
               hp: 1100, maxhp: 1100, spd: 0, col: '#5a1a20', wpn: '#ff6a3a', dmgScale: 1.6,
               destructible: true, gate: true },
             { type: 'brute', x: 470, y: 320, r: 22, hp: 360, maxhp: 360, spd: 120, col: '#7a2030', dmgScale: 1.4 },
             { type: 'brute', x: 810, y: 320, r: 22, hp: 360, maxhp: 360, spd: 120, col: '#7a2030', dmgScale: 1.4 },
             { type: 'pyre', x: 640, y: 360, r: 15, hp: 240, maxhp: 240, spd: 150, col: '#a4302c', wpn: '#ff6a3a', dmgScale: 1.4 }],
      cleared: 'You break the last burning thing and drive the nameless blade into the heart of the sigil, and the gate SHUTS — not gently, a slammed door, a wound scabbing over in fire. The shrine goes quiet. The dawn-stone is scarred but whole. Whatever was being fed through that door upstairs in the high cold will go hungry tonight. And only now, with the gate dark, does the light arrive.',
      flag: 'rq-epi-temple',
    },

    // ---- beat 7: the Seraphim ----
    seraph: {
      name: 'THE SERAPHIM', voice: 'Seraphim', // existing voice
      thanks: 'Light steps down out of the thin air the way the dragon came down, but kinder — a winged figure, too bright to hold in the eye, settling onto the scarred dawn-stone. "You closed it," the Seraphim says, and there is real gratitude in it. "I felt it open and could not reach it in time. You have the guild\'s thanks. You have MINE, which is rarer."',
      explain: '"You came looking for what I want. I will tell you, since you have earned the truth and bled for it. I do not fight your wars, fighter. I am not PERMITTED to — I recruit. I find the worthy, the way I found a champion on this very mountain, and I send them where the gods cannot openly reach. I step in MYSELF only against what no mortal should face alone — the arch devil clawing out of the deep, and things of that weight. A defiled shrine is beneath my office." A pause, and the brightness dims a shade, troubled. "Or it should be."',
      warn: '"But this gate was no accident, and it is not the first. Someone is DEFILING the temples — methodically, across the high country and beyond. Every shrine they foul, the gods above grow a little fainter. And the fainter the gods, the fainter their servant." The wings draw in. "Which means the thing that just made me weaker is exactly the thing I am forbidden to chase directly. So I will do what I do: I will tell the worthy, and hope they are worth it. Take this to your guild, fighter. Tell them their angel is not recruiting today — their angel is asking for HELP."',
    },

    // ---- beat 8: return to the guild -> the new ronin ending -> credits ----
    report: {
      name: 'GUILD CLERK', voice: 'GuildClerk',
      line: 'The clerk listens to all of it — the angel, the recruiting, the gate, the defiled shrine, the gods going thin — and for once does not square a single page. "An angel asking US for help," she says faintly. "Temples being starved on purpose. The masters are going to want this in triplicate, and then they are going to want a drink." She looks at you, and the practiced flinch is gone, replaced by something closer to respect. "You went up there as a fighter who scares fighters, and you came back the only one who closed the door. Whatever name you don\'t use — the guild owes that name a debt now. The hunt for whoever\'s defiling those shrines starts here. It\'ll be waiting when you are."',
      go: ['"Triplicate. And a drink." (close the ledger on this one)',
           '"Whoever\'s starving the gods — the guild will find them. I\'ll be near." (walk on)'],
      credits: 'THE RONIN\'S RECKONING — he closed a door an angel could not, and the mountain still calls him by a name he will not answer',
    },
  },

  // ===== THE SERAPHIM'S ROAD — an angel does not chase rumors. He recruits. =====
  // Backstory (player-facing): great evil brews in the land; he serves the place above
  // and has come to gather the worthy. (What the gods of death and creation actually
  // want with five mortal champions is between him and his two patrons.)
  seraph: {
    main: [
      { id: 'sq1-the-host-below', title: 'THE HOST BELOW',
        text: 'The Pit cheered a creature out of scripture and called it sport. Great evil brews in this land — you have tasted its smoke on the wind since you landed. The campaign above needs warriors. The Pit\'s were... adequate.',
        objective: 'Ask the innkeeper of the Last Lantern where TRUE strength lives.' },
      { id: 'sq2-where-strength-lives', title: 'WHERE STRENGTH LIVES',
        text: 'The innkeeper would not take your coin and would not stop bowing. But he answered: Dragonspine. The treaty lands — where everything too proud or too heavy for the valley went up to become a legend about itself. Ogres. Orc blade-saints. A goblin king. The wyvern brood-mother. And older, treaty-bound things.',
        objective: 'Take the spine trail east past Thorn Grove. The treaty stone will read what you are, and let you pass.' },
      { id: 'sq3-five-banners', title: 'FIVE BANNERS',
        text: 'Five names rule the high passes, and the mountain defers to all of them. The campaign needs ONE — the worthiest. There is only one way the Spine measures worth, and it is not conversation.',
        objective: 'Challenge the champions of the Spine to single combat. One of them will fly with you.' },
      { id: 'sq4-the-chosen', title: 'THE CHOSEN',
        text: 'A champion of the Spine has taken your banner. The chains at your waist have begun to hum — the two you serve are leaning closer, the one who closes doors and the one who opens them. It is time.',
        objective: 'Bring your chosen to the Skyreach shrine at the peak.' },
    ],
    marlow: {
      greet: 'Marlow does not reach for a tankard. He reaches, slowly, for his BEST one. "We don\'t— I haven\'t—" He stops. Starts over, quieter. "Welcome to the Last Lantern, holy one. First drink\'s free. All the drinks are free. Please don\'t unmake the inn."',
      ask: '"Peace, innkeeper. I seek warriors. The Pit\'s were adequate. Where does true strength live?"',
      answer: '"Adequate. The PIT. Adequate." He laughs the way men laugh near cliff edges. "Dragonspine, holy one. The treaty lands — east past Thorn Grove, up the spine trail. Where the dragons signed their peace, and everything too proud or too heavy for the valley went up to be a LEGEND about it. Ogres that carry hills. An orc whose blade keeps a funeral ledger. A goblin king — gods help us — with three crowns. The wyvern brood-mother. And older things. Treaty things." He slides your silver back across the bar with one finger. "I am not charging Heaven five silver. Tell the mountain Marlow sent you. Tell it GENTLY."',
      done: '"Still here, holy one? Mountain\'s east, past the grove. Drink\'s still free. Knees still shaking. Some things don\'t improve with practice."',
    },
    treatyStone: {
      barred: 'THE TREATY STONE — a slab of grey law older than the kingdom. Runes crawl across it as you approach, read what you are, and go dark. The way is barred. Whatever the Spine is waiting for, it is not you.',
      opens: 'The stone hums as you approach — then BOWS, runes flaring gold, the whole slab tilting a hand\'s width like a herald stepping aside. It has been a long age since one of the Above walked the spine trail. The wards remember the courtesy. The way is open.',
    },
    arrival: 'DRAGONSPINE — the treaty lands. The air is thin, bright, and rude. Below: the whole conspiracy-riddled valley, small enough to cover with a thumb. Ahead: five banners, and the worthy.',
    candidates: [
      { id: 'kargoth', name: 'KARGOTH, WHO CARRIES THE HILL', short: 'Kargoth, the ogre warchief',
        spot: [14, 30], look: { col: '#5a4a38', o: { hulk: true, headCol: '#4a3a28' }, r: 17 },
        banner: ['THE HILL ANSWERS', 'no wings past the cairn line'],
        intro: 'An ogre the size of a toll-house sits braiding a rope from whole pines. He looks up without alarm — very little alarms a hill. "Little god," he rumbles. "The stone said something bright was coming up the trail." He stands. The mountain adjusts. "Kargoth knows why the bright ones come. Single combat. No wings past the cairn line. Win, and Kargoth listens."',
        challenge: '"Then stand, Kargoth. The cairn line it is."',
        pack: [{ type: 'door', x: 640, y: 250, r: 32, hp: 760, maxhp: 760, spd: 56, col: '#5a4a38', wpn: '#3a2f24', dmgScale: 1.5 }],
        win: 'He sits down where he fell, laughing — an avalanche learning to chuckle. "STRONG little god. Nobody has knocked Kargoth onto his own rope in a hundred years."',
        recruit: '"The sky calls, Kargoth. Carry a hill up THERE."',
        spare: '"Keep your mountain. I am not done looking."',
        recruited: '"Kargoth comes. Kargoth has always wondered what hills look like from above."',
        ending: 'Kargoth ducks under the doorway of air out of habit — nothing above has lintels. "Little god," he rumbles, one mountain to another, "if this is a trick, know that I am very heavy, and very patient." The altar takes his measure without flinching. First thing in nine hundred years that hasn\'t.' },
      { id: 'skarva', name: 'SKARVA RED-BLADE', short: 'Skarva, the orc blade-saint',
        spot: [30, 12], look: { col: '#3a5a40', o: { wpnLen: 40, wpnCol: '#c8443a', headCol: '#5a7a50' } },
        banner: ['THE FUNERAL LEDGER', 'page one, or page last'],
        intro: 'She is sharpening a blade that is already sharp on a whetstone cut from a tombstone. "I keep a ledger," she says, not looking up. "Every name this blade has closed. Page one was my warlord. Page last is whoever asks." She looks up. Three heads look back at her. She grins like a drawn sword. "FINALLY. Something the ledger might not fit."',
        challenge: '"Sharpen it once more, Skarva. Then try the page."',
        pack: [{ type: 'grave', x: 640, y: 250, hp: 620, maxhp: 620, spd: 130, r: 16, col: '#3a5a40', stance: 'open', stanceT: 1, dmgScale: 1.5 }],
        win: '"Hm." She studies the disarm from the ground, professionally, the way surgeons study scars. "That one goes in the ledger in CAPITALS."',
        recruit: '"Your blade is wasted on names, Skarva. Come close a WAR."',
        spare: '"Keep your ledger. I am not done looking."',
        recruited: '"One condition, angel: when your war is done, the last page is MINE to write."',
        ending: 'Skarva sheathes her blade for the climb — the first rest the whetstone has had in a decade. "New ledger," she says, to no one in particular, to everyone below. "Page one: the sky."' },
      { id: 'nibnob', name: 'KING NIBNOB THE THRICE-CROWNED', short: 'Nibnob, the goblin king',
        spot: [48, 16], look: { col: '#4a6a3a', o: { headCol: '#7a9a5a' }, r: 9 },
        banner: ['CROWN RULES', 'kings don\'t have fair. kings have SUBJECTS'],
        intro: 'A goblin in three crowns — one iron, one gold, one suspiciously municipal — receives you from a throne of stolen saddles. "ANOTHER recruiter!" he shrieks, delighted. "Oh, I\'ve HEARD about you sky-folk. First it\'s cleanse the great evil, then it\'s build my temple, then it\'s meet my seventeen brides. NO SALE." He claps twice anyway. "But a DUEL? A duel the king will take. Crown rules: my guard fights too. Kings don\'t have FAIR. Kings have SUBJECTS."',
        challenge: '"Crown rules, then. Bring your subjects, little king."',
        pack: [{ type: 'necro', x: 640, y: 240, hp: 480, maxhp: 480, spd: 110, r: 14, col: '#4a6a3a', dmgScale: 1.4 },
               { type: 'skel', x: 540, y: 320, hp: 220, maxhp: 220, spd: 150, r: 11, col: '#5a7a4a', dmgScale: 1.35 },
               { type: 'skel', x: 740, y: 320, hp: 220, maxhp: 220, spd: 150, r: 11, col: '#5a7a4a', dmgScale: 1.35 }],
        win: 'He surrenders from inside a barrel, all three crowns askew. "FINE! FINE. The king concedes the field. STOP GLOWING AT ME."',
        recruit: '"Bring the crowns, little king. The sky needs cunning more than it admits."',
        spare: '"Keep your throne. I am not done looking."',
        recruited: '"The SKY kingdom. Yes. YES. Do they have an army? Do they have a TREASURY? Don\'t answer. Crown me up, featherbeard."',
        ending: 'Nibnob wears all three crowns at once for the occasion, and somewhere between the last step and the altar he steals a FOURTH — a circlet of cold starlight that was not, strictly, on offer. Heaven will notice eventually. He is counting on it.' },
      { id: 'vesshk', name: 'VESSHK OF THE HIGH WIND', short: 'Vesshk, the wyvern matriarch',
        spot: [54, 32], look: { col: '#7a3a4a', o: { quad: true }, r: 16 },
        banner: ['THE QUEEN\'S COLUMN', 'you are standing in her air'],
        intro: 'The brood-mother does not speak the way people do. She speaks the way weather does — a shift of wing, a heat across the ledge, a patience older than the treaty. The meaning arrives anyway, pressed into the thin air between you: the sky already has a queen up here. You are standing in her column of it. Prove you belong.',
        challenge: 'Spread your wings slowly. Answer weather with weather.',
        pack: [{ type: 'pyre', x: 640, y: 250, hp: 640, maxhp: 640, spd: 165, r: 15, col: '#7a3a4a', dmgScale: 1.5 }],
        win: 'She folds her wings — slowly, deliberately, the way a banner comes down with honors. The heat across the ledge dims to something very near respect.',
        recruit: 'Open the way skyward. Let the queen see the war above her weather.',
        spare: 'Fold your wings. Leave her the ledge. You are not done looking.',
        recruited: 'A single beat of wing — agreement, and a warning: she follows the war, not the angel. The brood will hold the Spine until the weather returns.',
        ending: 'Vesshk rises beside you without being carried — the first updraft of a war-sky reaching down to meet her. Below, the brood keens the long note they save for queens who go where the weather can\'t follow.' },
      { id: 'aurvaeth', name: 'AURVAETH THE TREATY-BOUND', short: 'Aurvaeth, the dragon',
        spot: [32, 7], look: { col: '#39414a', o: { hood: true }, r: 13 },
        banner: ['THE OLD WAY', 'the treaty says nothing about duels'],
        intro: 'At the highest cairn waits a grey-eyed traveler who was never a traveler. The shape is a polite fiction; the shadow it throws is not. "Seraphim." The voice has strata. "I signed a treaty to keep my fire out of the valley. And here you stand, smelling of two gods and one war, come to talk me into breaking it upward." A pause, geological. "...Convince me the old way. The treaty says nothing about duels."',
        challenge: '"The old way, then, treaty-keeper. Wear whichever shape loses best."',
        pack: [{ type: 'master', x: 640, y: 250, hp: 880, maxhp: 880, spd: 150, r: 16, col: '#39414a', dmgScale: 1.6 }],
        win: 'The traveler-shape dusts itself off. The grey eyes have gone molten amber, and pleased. "Adequate," the dragon says — in exactly the tone you once used about the Pit.',
        recruit: '"The treaty bound your fire to the valley, Aurvaeth. The sky above it was never named."',
        spare: '"Keep your treaty. I am not done looking."',
        recruited: '"Clever. The valley keeps its peace, and heaven inherits my fire. I begin to see why two gods share you." The traveler-shape smiles with too many years.',
        ending: 'Aurvaeth drops the traveler-shape on the last step, because treaties end where the valley does. What ascends beside you is the reason the word WYRM still has weight — wings like weather fronts, a patience like strata, fire signed over to a new and higher jurisdiction.' },
    ],
    shrine: {
      closed: 'THE SKYREACH SHRINE — wind-scoured steps ending at an altar of nothing: a doorway of cold bright air. It does not open for you yet. The campaign needs its champion first.',
      frame: 'The Skyreach shrine is older than the treaty, older than the kingdom whose maps forgot it. Wind-scoured steps end at an altar made of nothing — a standing doorway of cold, bright air. The runic chains at your waist and chest hum against it like struck bells. Somewhere above, your two patrons lean closer: the one who closes doors, and the one who opens them.',
      closing: 'The land below keeps its conspiracies. The taint keeps brewing in the Ashenveil; the ledgers keep their four small letters; the war you spoke of is real, whatever else you are. The Pit\'s crowds will tell it their own way for a hundred years — the night the angel and his champion walked into the sky. The light takes you both. The mountain keeps the story.',
      credits: 'THE SERAPHIM\'S ROAD — the sky took two, and heaven kept its reasons',
    },
    chatter: [
      'Don\'t stare at the middle head. Don\'t stare at ANY of the heads.',
      'My nan swore angels had one head. Somebody\'s nan owes my nan an apology.',
      'It blessed my cart. Wheel still squeaks, but HOLIER now.',
      'The temple took one look and started repainting their ceiling.',
      'Three heads, and not one of them pays the gate toll. I\'m just saying.',
      '{N}, the Pit named it. The Pit named an ANGEL. We are all going somewhere warm.',
      'I sold it an apple. It paid with a feather. The feather won\'t stop humming.',
      'The guard tried to ask it for papers. The middle head LOOKED at him.',
    ],
    guildNote: 'The clerk has been holding the same quill, unmoving, since you walked in. "The board\'s... contracts are for mortals, honored one. The mountain you want is east. Please tell the Spine the guild sends its respects and also please leave the quill alone it\'s my LUCKY one."',
  },

  cult: {
    campSign: 'Tents that fold fast. Crates with air-holes. A cold fire pit and a cage with bent bars. This is a waystation, not a camp.',
    captive: {
      name: 'THE QUARRY BOY',
      freed: 'He comes up swinging until he sees the cage door open. "They watched me lift at the quarry fair. WEEKS ago. Asked the others what I could do, wrote it down. There\'s a buyer in the city — back alleys, near the west wall. I heard them price me." He won\'t take an escort. He runs.',
    },
    shenSama: {
      name: 'A STRANGER IN THE TREELINE',
      text: 'Scales like cooling slag under a traveler\'s hood. Eyes too old for the face. "You freed the wrong cargo, champion — they\'ll re-profile and restock within a season. They are SHOPPING. Specific gifts, specific blood. Mine most of all." He looks north, the way hunted things do. "Don\'t follow me. Being near me is how people end up in crates." He is gone between one breath and the next.',
    },
    buyer: {
      name: 'THE VEILED WOMAN',
      text1: 'A back-alley meeting gone wrong the moment you aren\'t who she expected. She doesn\'t run. "You broke the camp. Then you\'ve killed her — the elixir was BOUGHT, paid in full. Out of the Ashenveil, they said. Grown, they said, not brewed." She shows you the vial — it hums against your teeth like the ley-node did.',
      text2: '"I don\'t care what it\'s made of." Her voice cracks on the lie. "I was told it\'s the only one that works. You want the men who sell it? They come down the west forest path, new moon, every month. That\'s all I know. Leave me the vial. Please."',
      choiceKeep: 'You keep the vial. Evidence. She doesn\'t cry where you can see it.',
      choiceGive: 'You leave her the vial. Whatever it is, whoever it was — tonight it\'s mercy. The trail is still the trail.',
    },
    caravanSign: 'Wheel ruts where no wagon should fit between the trees. The ruts are deep. The cargo is heavy, or alive, or both.',
    // Ronin-only finale: the Emperor never arrives. Readers of Book 4 know why.
    finaleRonin: {
      title: 'AN EMPTY ROAD',
      text1: 'Word ran ahead of itself for two days: the Dragon Emperor passes through Karridge. The plaza fills at dawn. Criers clear the road. The guild polishes its ledger table. Bellow, for the first time in living memory, wears a clean shirt.',
      text2: 'He does not come. The road north stays empty past noon, past the bells, past the point where the crowd stops pretending it isn\'t cold. A steward\'s rider finally trots in with the official word: the Emperor\'s itinerary has changed. No reason given. There never is. The crowd grumbles and disperses, and a hundred wagers die unpaid. Somewhere behind you, Bellow mutters: "Twenty-five years, and that man has never once been where anyone expects him to be."',
      text3: 'You stand a while in the emptying plaza, the vial humming in your coat, the crowd\'s name for you drifting back and forth across the stones. There was no one to show the evidence to today. You tell yourself that\'s why you\'re smiling — half a smile, the kind a man keeps for his own secrets. The conspiracy holds. The hunt continues. And the Pit\'s champion polishes a blade that has worn three names, and answers, as ever, to none of them.',
    },
    finale: {
      title: 'THE DRAGON EMPEROR',
      text1: 'He comes through Karridge the way weather comes — the plaza kneels in a wave, the pit-criers go silent mid-shout. ANKUNYX. The Dragon Emperor. He is exactly as tall as the stories and somehow worse: calm. His eyes pass over the crowd and stop, briefly, on you.',
      text2: '"The pit-crowned." His voice is conversational, which is the frightening part. "Karridge is louder about you than about its taxes. Good. Loud places stay honest." A breath. You hold a vial that hums, a ledger page, the names of three freed captives who begged you not to speak theirs. Accuse the Emperor\'s own house — with THIS? He is already turning away. The crowd is already rising. The moment is already over.',
      text3: 'The conspiracy holds. The camp is ash and silence; the Academy\'s lower levels keep their secrets; somewhere a woman with a vial tells herself it\'s medicine. But the captives are free, the grove\'s line runs clean — and you know. The crowd still chants your name. The story is not over. It has barely begun.',
    },
  },

  guildBoard: [
    // ---- THORN GROVE (north gate) ----
    { id: 'g-wolves', title: 'CULL: WOLVES', text: 'Eight wolves out of Thorn Grove\'s edge worry the wood-elf herds.', reward: '4s + potion', region: 'Thorn Grove', need: 8, copper: 40, potion: 'potion-health', potionLabel: 'Health Potion' },
    { id: 'g-rotshaman', title: 'HUNT: ROT SHAMAN', text: 'Something is raising the forest\'s dead. The Eldest want it stopped.', reward: '8s + potion', region: 'Thorn Grove', need: 1, copper: 80, potion: 'potion-str', potionLabel: 'STR Potion' },
    { id: 'g-hounds', title: 'CULL: GRAVE HOUNDS', text: 'Escaped pit hounds gone feral in the southern brush.', reward: '4s + potion', region: 'Thorn Grove', need: 6, copper: 40, potion: 'potion-dex', potionLabel: 'DEX Potion' },
    { id: 'g-goblins', title: 'CULL: GOBLIN SKULKERS', text: 'A skulk of goblins is tithing the mushroom-pickers. The pickers would prefer not.', reward: '4s + potion', region: 'Thorn Grove', need: 6, copper: 40, potion: 'potion-health', potionLabel: 'Health Potion' },
    { id: 'g-vines', title: 'ROOT OUT: STRANGLEVINES', text: 'Walking vines with opinions about travelers. The trade road wants its shade back.', reward: '5s + potion', region: 'Thorn Grove', need: 5, copper: 50, potion: 'potion-con', potionLabel: 'CON Potion' },
    { id: 'g-insects', title: 'SMOKE OUT: CHITTERSWARM', text: 'Dog-sized burrow insects under the old logging trail. Bring boots you don\'t love.', reward: '4s + potion', region: 'Thorn Grove', need: 6, copper: 40, potion: 'potion-atk', potionLabel: 'ATK Potion' },
    { id: 'g-bandits', title: 'BREAK: TOLL BANDITS', text: 'Men with knives invented a toll bridge that isn\'t theirs. The guild un-invents such things.', reward: '5s + potion', region: 'Thorn Grove', need: 5, copper: 50, potion: 'potion-str', potionLabel: 'STR Potion' },
    // ---- DRAGONSPINE (the spine trail past the grove — high pay, thin air) ----
    { id: 'g-orcs', title: 'DRIVE BACK: ORC RAIDERS', text: 'Raiders holding the high pass. The treaty does not cover tolls.', reward: '8s + potion', region: 'Dragonspine', need: 6, copper: 80, potion: 'potion-str', potionLabel: 'STR Potion' },
    { id: 'g-wyverns', title: 'THIN: WYVERN BROOD', text: 'The brood-queen\'s daughters range too low. Discourage, do not exterminate — treaty terms.', reward: '9s + potion', region: 'Dragonspine', need: 4, copper: 90, potion: 'potion-dex', potionLabel: 'DEX Potion' },
    { id: 'g-ogres', title: 'TOPPLE: HILL OGRES', text: 'Two hills moved onto the trail and started charging rent.', reward: '10s + potion', region: 'Dragonspine', need: 2, copper: 100, potion: 'potion-con', potionLabel: 'CON Potion' },
    { id: 'g-firele', title: 'QUENCH: FIRE ELEMENTALS', text: 'Something left the forge-vents open under the Spine. The fires walked out.', reward: '9s + potion', region: 'Dragonspine', need: 4, copper: 90, potion: 'potion-atk', potionLabel: 'ATK Potion' },
    // ---- THE ASHENVEIL (grim coach by the guild — the proving grounds pay best) ----
    { id: 'g-skeletons', title: 'RE-INTER: RESTLESS SKELETONS', text: 'Field stock wandering off the rows, the Academy says. Re-file them.', reward: '8s + potion', region: 'The Ashenveil', need: 8, copper: 80, potion: 'potion-health', potionLabel: 'Health Potion' },
    { id: 'g-zombies', title: 'PUT DOWN: FERAL ZOMBIES', text: 'Workers that stopped taking instruction. The Academy pays for quiet corrections.', reward: '8s + potion', region: 'The Ashenveil', need: 6, copper: 80, potion: 'potion-con', potionLabel: 'CON Potion' },
    { id: 'g-vampires', title: 'STAKE: VAMPIRE SPAWN', text: 'Unsanctioned feeding in the hedgerows. The Veil dislikes freelancers.', reward: '12s + potion', region: 'The Ashenveil', need: 3, copper: 120, potion: 'potion-dex', potionLabel: 'DEX Potion' },
    { id: 'g-werewolves', title: 'LEASH: WEREWOLVES', text: 'Three nights, three torn fences, one very specific paw print. Silver optional, violence mandatory.', reward: '12s + potion', region: 'The Ashenveil', need: 3, copper: 120, potion: 'potion-str', potionLabel: 'STR Potion' },
    { id: 'g-darkmages', title: 'EXPEL: RENEGADE DARK MAGES', text: 'Dropouts of the dark academy practicing on the locals. The faculty wants them expelled — thoroughly.', reward: '14s + potion', region: 'The Ashenveil', need: 3, copper: 140, potion: 'potion-atk', potionLabel: 'ATK Potion' },
  ],

  innkeeper: {
    name: 'MARLOW',
    greet: 'Well. The Pit spits out a live one for once. {N}, they\'re calling you. Sit — champions drink free, the first one anyway.',
    rumorFree: 'You want to know about Dren? Last champion before you. "Ran off," Bellow says. Dren left his winnings in my strongbox and his boots under the bed. Men who run, run IN boots.',
    rumorPaidOffer: 'The rest isn\'t free. My ears cost me good coin to keep open. Five silver and you\'ll know what the road knows.',
    rumorPaid: 'Three more vanished off the trade road this season. A juggler, a hedge-witch, a quarry boy who could lift a cart. All GIFTED, you follow? And a guest upstairs keeps asking after your fights — what you do, how fast, how often. Asked after Dren the same way, the week before he vanished. I\'d visit the guild before the road, champion.',
    broke: 'Five silver. The Pit paid you a silver a head — don\'t tell me you\'re short.',
    done: 'Watch the alleys, champion. Whatever shops for the gifted hasn\'t finished its list.',
  },
};

// ---- ARCH DEVIL OUTRO (Hiro item 5): played when devil-mode timer EXPIRES (warlock only) ----
// 10 taunts (Warlock voice) chosen at random + the Seraphim's banishing line (Seraphim voice).
// pit.js reads these at runtime; build_voice_manifest.js extracts them. If you EDIT this text,
// the line must be re-voiced (the clip is keyed by a hash of speaker+text).
Quests.archDevilOutro = {
  taunts: [
    "At last - Sheol's gates could not hold me. The mortal plane is mine to take.",
    "Free! An age in the Pit, and now your soft little world will kneel.",
    "Do you feel it? The chains are off. I have CLIMBED OUT of hell.",
    "Sheol spat me back up. How generous. Now I remake your sky in fire.",
    "No more pits. No more wardens. The conqueror has arrived, and he is HUNGRY.",
    "I clawed through the floor of the underworld for this - for YOU. Kneel.",
    "The abyss is behind me. Ahead: a whole plane of warm, breathing thrones.",
    "Escaped. Ascended. Unleashed. Sheol held its door open one breath too long.",
    "They said no devil leaves the deep. They will be wrong about many things now.",
    "Mortal plane - I waited an age in the dark to swallow you whole.",
  ],
  seraph: "Vile demon - away with you. Back to hell you go.",
};

Quests.dojo = {
  // ITEM 11 — Ronin DOJO weapon lines (DESIGN DATA; wiring + voice land in later runs).
  // The katana chain (Katana->Nodachi->Odachi) is the ronin's default. The dojo unlocks
  // two ALTERNATE lines; each mirrors the katana tier ladder (tier 0/1/2) with its own
  // stat-doubling focus, look and attack feel. Hiro: review/approve the names + stat focus
  // + feel below (these are creative calls, flagged in the AUTOWORK log).
  flag: 'rq-dojo',                 // dojo unlock / questline flag (set when the sensei is met)
  teacher: 'SENSEI OKADA',         // dojo master NPC (City) — voice mapped to an existing id later
  intro: "Three weapons, one discipline. The blade you carry, the spear that keeps the wolf at arm's length, and the thunder-stick the southern traders left behind. Choose, and I will set your feet on the road.",
  lines: {
    katana: { key: 'katana', stat: 'STR', focus: 'balanced kesa cuts + the men finisher',
      tiers: [
        { name: 'KATANA',  sub: 'one edge, one breath' },
        { name: 'NODACHI', sub: 'the blade grows with its legend' },
        { name: 'ODACHI',  sub: 'the blade is taller than the man was' } ] },
    spear: { key: 'spear', stat: 'DEX', focus: 'long reach thrusts that pierce a line of foes',
      tiers: [
        { name: 'YARI',         sub: "keep the wolf at arm's length" },
        { name: 'NAGAE-YARI',   sub: 'the reach outgrows the man' },
        { name: 'JUMONJI-YARI', sub: 'the cross-blade takes two at once' } ] },
    rifle: { key: 'rifle', stat: 'ATK', focus: 'slow, heavy matchlock shots — range over rhythm',
      tiers: [
        { name: 'TANEGASHIMA', sub: 'thunder in a wooden stock' },
        { name: 'LONG RIFLE',  sub: 'the range outgrows the room' },
        { name: 'OZUTSU',      sub: 'a hand-cannon that ends arguments' } ] },
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = { Quests };
else window.Quests = Quests;
