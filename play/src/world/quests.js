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
    if (c === 'warlock') return this.main.concat(this.warlockEpilogue.main);
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

if (typeof module !== 'undefined' && module.exports) module.exports = { Quests };
else window.Quests = Quests;
