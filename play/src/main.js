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

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#0a0808',
  pixelArt: true,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [ArenaScene, CityScene, GroveScene, DungeonScene, VarenholmScene, MountainScene]
};

window.game = new Phaser.Game(config);
