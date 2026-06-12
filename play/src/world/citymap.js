// Karridge City — layout data. TILE=32. Map 70x46 tiles (2240x1472 px).
// Dark-ages fantasy city: the Pit gate (south), main street to the plaza well,
// the Inn (west), the Adventurers Guild (east), market stalls, back alleys.
// North gate is barred — Thorn Grove opens in Bucket 4.

const CityMap = {
  TILE: 32, W: 70, H: 46,

  // player spawn: just inside the south (Pit) gate
  spawn: { x: 35 * 32, y: 42 * 32 },

  // rectangular buildings (tile coords). door = tile offset on the south face.
  buildings: [
    { id: 'inn',    x: 14, y: 14, w: 12, h: 8, door: 6, name: 'THE LAST LANTERN', sign: 'INN' },
    { id: 'guild',  x: 44, y: 14, w: 12, h: 8, door: 5, name: 'ADVENTURERS GUILD', sign: 'GUILD' },
    { id: 'house1', x: 10, y: 28, w: 8,  h: 6, door: 3, name: '', sign: '' },
    { id: 'house2', x: 24, y: 30, w: 7,  h: 5, door: 3, name: '', sign: '' },
    { id: 'house3', x: 46, y: 28, w: 9,  h: 6, door: 4, name: '', sign: '' },
    { id: 'house4', x: 58, y: 30, w: 7,  h: 5, door: 2, name: '', sign: '' },
    { id: 'house5', x: 12, y: 6,  w: 9,  h: 5, door: 4, name: '', sign: '' },
    { id: 'house6', x: 50, y: 6,  w: 9,  h: 5, door: 4, name: '', sign: '' },
    { id: 'house7', x: 30, y: 6,  w: 8,  h: 5, door: 3, name: '', sign: '' },
  ],

  // plaza around the well
  plaza: { x: 28, y: 18, w: 14, h: 10 },
  well: { x: 35, y: 22 }, // tile center of the well prop (96x96 px)

  // city wall ring (1 tile thick) with gates
  gates: {
    south: { x: 33, w: 4 },  // to the Pit (player enters here)
    north: { x: 33, w: 4 },  // barred — Thorn Grove teaser
  },

  // light sources (torch posts / braziers / windows light up at runtime too)
  lights: [
    { x: 35, y: 40, r: 150 }, { x: 31, y: 34, r: 130 }, { x: 39, y: 34, r: 130 },
    { x: 30, y: 27, r: 140 }, { x: 40, y: 27, r: 140 }, { x: 35, y: 22, r: 170 },
    { x: 27, y: 18, r: 130 }, { x: 43, y: 18, r: 130 },
    { x: 20, y: 22, r: 150 }, { x: 50, y: 22, r: 150 },
    { x: 35, y: 12, r: 130 }, { x: 35, y: 4, r: 140 },
    { x: 14, y: 35, r: 120 }, { x: 56, y: 35, r: 120 },
  ],

  // chests (alleys + behind the guild)
  chests: [
    { x: 11, y: 36, loot: { type: 'potion-health', label: 'Health Potion' } },
    { x: 62, y: 27, loot: { type: 'potion-str', label: 'STR Potion (+25%, 60s)' } },
    { x: 57, y: 9,  loot: { type: 'copper', amount: 50, label: '5 silver' } },
  ],

  // signposts
  signs: [
    { x: 35, y: 3,  text: 'NORTH GATE — THORN GROVE. The way is barred. (Guild escort required)' },
    { x: 35, y: 43, text: 'THE PIT OF KARRIDGE — mind the blood on your way out.' },
    { x: 27, y: 23, text: 'Plaza of the Nameless. The well remembers every champion.' },
  ],

  // ambient NPC wander zones + count
  npcZones: [
    { x: 28, y: 18, w: 14, h: 10, n: 5 },   // plaza
    { x: 30, y: 32, w: 12, h: 8,  n: 3 },   // main street south
    { x: 12, y: 22, w: 10, h: 5,  n: 2 },   // inn street
    { x: 44, y: 22, w: 10, h: 5,  n: 2 },   // guild street
  ],

  // overheard chatter — {N} replaced with the player's crowd nickname
  chatter: [
    'That\'s {N}. Saw the last fight myself.',
    'They say Bellow wept when he paid out.',
    'The old champion never walked out. {N} did.',
    'Twenty fights. TWENTY.',
    'Don\'t stare. That\'s {N}.',
    'My cousin bet against you. Idiot.',
    'The Pit remembers, friend.',
    'Another one gone missing off the trade road, I heard.',
    'Quiet lately. Too quiet in the alleys.',
    'The grove road\'s shut. Guild business, they say.',
  ],
};

if (typeof module !== 'undefined' && module.exports) module.exports = { CityMap };
else window.CityMap = CityMap;
