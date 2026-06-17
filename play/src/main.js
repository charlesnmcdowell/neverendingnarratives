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

// Stale-cache self-heal. The CDN/browser can serve an OLD cached index.html after a
// deploy, which then loads OLD ?v= scripts (e.g. a pre-fix voice.js) — the game runs
// outdated code (this caused city voice to wedge after the fix had shipped). build.txt
// is fetched UNCACHED every load; if it's newer than this page's stamp, the page is
// stale — reload once, cache-busted, to pull the current index.html + scripts.
(function () {
  try {
    fetch('build.txt?_=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (s) {
        s = s && s.trim();
        if (s && window.__BUILD && s !== window.__BUILD && !sessionStorage.getItem('ss-build-reload')) {
          sessionStorage.setItem('ss-build-reload', '1');
          location.replace(location.pathname.replace(/\/$/, '/') + '?b=' + s);
        } else { sessionStorage.removeItem('ss-build-reload'); }
      }).catch(function () {});
    // belt-and-suspenders for index.html older than the build-stamp era (missing 4th champion button)
    if (!document.getElementById('seraphBtn') && !sessionStorage.getItem('ss-skew-reload')) {
      sessionStorage.setItem('ss-skew-reload', '1');
      location.replace(location.pathname + '?fresh=' + Date.now());
    } else if (document.getElementById('seraphBtn')) sessionStorage.removeItem('ss-skew-reload');
  } catch (e) {}
})();

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
  scale: { mode: window.IS_PHONE ? Phaser.Scale.ENVELOP : Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [ArenaScene, CityScene, GroveScene, DungeonScene, VarenholmScene, MountainScene, AshenveilScene, AshLowerScene]
};

window.game = new Phaser.Game(config);

// Mobile: keep the canvas filling the screen across orientation changes (Hiro mobile fix)
(function () {
  const apply = () => { try {
    const phone = Math.min(window.innerWidth, window.innerHeight) <= 520;
    if (window.game && window.game.scale) {
      window.game.scale.scaleMode = phone ? Phaser.Scale.ENVELOP : Phaser.Scale.FIT;
      window.game.scale.refresh();
    }
  } catch (e) {} };
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', () => setTimeout(apply, 250));
})();
