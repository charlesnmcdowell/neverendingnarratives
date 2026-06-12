// Save/load — the whole game state is one serializable object by design.
// localStorage slot + autosave. Arena runs aren't saved mid-gauntlet; the world is.

const SaveSystem = {
  KEY: 'sorcerer-sword-arpg-save',
  VERSION: 1,

  hasSave() {
    try { return !!localStorage.getItem(this.KEY); } catch (e) { return false; }
  },

  save() {
    const GS = window.GameState;
    if (!GS.player) return false; // nothing worth keeping before the Pit is won
    try {
      localStorage.setItem(this.KEY, JSON.stringify({ v: this.VERSION, t: Date.now(), state: GS }));
      return true;
    } catch (e) { return false; }
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.v !== this.VERSION) return null;
      return data.state;
    } catch (e) { return null; }
  },

  apply(state) { // merge into the live object (scenes hold the same reference)
    const GS = window.GameState;
    GS.version = state.version; GS.player = state.player;
    GS.world = state.world; GS.companions = state.companions || {};
    GS.meta = state.meta || GS.meta;
  },

  sceneForZone(zone) {
    return { 'karridge-city': 'CityScene', 'thorn-grove': 'GroveScene', 'grove-dungeon': 'DungeonScene', 'varenholm': 'VarenholmScene', 'dragonspine': 'MountainScene' }[zone] || 'CityScene';
  },

  wipe() { try { localStorage.removeItem(this.KEY); } catch (e) {} },
};
if (typeof window !== 'undefined') window.SaveSystem = SaveSystem;
if (typeof module !== 'undefined' && module.exports) module.exports = { SaveSystem };
