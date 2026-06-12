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
    { id: 'g-wolves', title: 'CULL: WOLVES', text: 'Eight wolves out of Thorn Grove\'s edge worry the wood-elf herds.', reward: '4s + potion', region: 'Thorn Grove', need: 8, copper: 40, potion: 'potion-health', potionLabel: 'Health Potion' },
    { id: 'g-rotshaman', title: 'HUNT: ROT SHAMAN', text: 'Something is raising the forest\'s dead. The Eldest want it stopped.', reward: '8s + potion', region: 'Thorn Grove', need: 1, copper: 80, potion: 'potion-str', potionLabel: 'STR Potion' },
    { id: 'g-hounds', title: 'CULL: GRAVE HOUNDS', text: 'Escaped pit hounds gone feral in the southern brush.', reward: '4s + potion', region: 'Thorn Grove', need: 6, copper: 40, potion: 'potion-dex', potionLabel: 'DEX Potion' },
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
