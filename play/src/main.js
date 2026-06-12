// The Sorcerer-Sword ARPG — entry point
// Architecture rules (locked):
//  1. input -> character controller strictly separated
//  2. ALL game state lives in one serializable object (window.GameState)
//     so save/load is JSON.stringify and a future co-op retrofit isn't precluded.

window.GameState = {
  version: 1,
  player: null,        // set at character select: { class, stats, level, nickname, gold, belt: [] }
  world: { zone: 'boot', flags: {}, chestsOpened: [], questLog: [] },
  companions: {},      // name -> { recruited, approval, memory: [] }
  meta: { playtimeMs: 0, kills: 0 }
};

// Phones: fill the whole screen instead of letterboxing (ENVELOP crops the 16:9
// frame to the device's shape — the action gets ~25% bigger, the black bars go).
// The DOM HUD/buttons sit on the real screen, so nothing important is cropped.
window.IS_PHONE = Math.min(window.innerWidth, window.innerHeight) <= 520;
const fillScreen = window.IS_PHONE && window.innerWidth > window.innerHeight; // landscape phones

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#0a0808',
  pixelArt: true,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: fillScreen ? Phaser.Scale.ENVELOP : Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [ArenaScene, CityScene, GroveScene, DungeonScene, VarenholmScene, MountainScene]
};

window.game = new Phaser.Game(config);
