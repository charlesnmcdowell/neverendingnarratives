/* main.js — game config + embedded music/voice control.
   Two embedded tracks now (the original pit game's scores): arena.mp3 under the Pit,
   city.mp3 under Karridge and the west road. */
window.Spire = window.Spire || {};
Spire.won = false;
/* 2026-08-11 (Hiro): music and fullscreen are ON by default; the player's toggles
   are remembered between sessions. Browsers only allow sound + fullscreen after
   the first click, so both engage on the first pointer-down. */
Spire._pref = function (key, dflt) {
  try { const v = localStorage.getItem(key); return v === null ? dflt : v === "1"; } catch (e) { return dflt; }
};
Spire._savePref = function (key, val) { try { localStorage.setItem(key, val ? "1" : "0"); } catch (e) {} };
Spire.musicOn = Spire._pref("spire_music", true);
Spire._audio = null;
Spire._musicKey = null;
Spire.playMusic = function (key) {
  key = key || "arena";
  if (!window.SPIRE_MUSIC || !SPIRE_MUSIC[key]) return;
  if (Spire._musicKey === key && Spire._audio) return;      // already on this track
  if (Spire._audio) { try { Spire._audio.pause(); } catch (e) {} }
  Spire._audio = new Audio(SPIRE_MUSIC[key]);
  Spire._audio.loop = true;
  Spire._audio.volume = 0.4;
  Spire._musicKey = key;
  if (Spire.musicOn) Spire._audio.play().catch(() => {});   // keep playing across track swaps
};
Spire.startMusic = function () {
  if (!Spire._audio) Spire.playMusic(Spire.run ? Spire.act().music : "w_pit");
  if (!Spire._audio) return;
  Spire._audio.play().then(() => { Spire.musicOn = true; }).catch(() => {});
  Spire.musicOn = true;
  Spire._savePref("spire_music", true);
};
Spire.toggleMusic = function () {
  if (!Spire._audio) { Spire.startMusic(); return; }
  if (Spire.musicOn) { Spire._audio.pause(); Spire.musicOn = false; }
  else { Spire._audio.play().catch(() => {}); Spire.musicOn = true; }
  Spire._savePref("spire_music", Spire.musicOn);
};

window.addEventListener("pointerdown", () => { if (Spire.sfx) Spire.sfx.unlock(); }, { once: true });

/* first gesture: let the default-on settings actually engage (autoplay rules) */
let _fsTried = false;
window.addEventListener("pointerdown", () => {
  if (Spire.musicOn && (!Spire._audio || Spire._audio.paused)) Spire.startMusic();   // title screen included
  if (!_fsTried) {
    _fsTried = true;
    if (Spire._pref("spire_fs", true) && window.game && game.scale && !game.scale.isFullscreen) {
      try { game.scale.startFullscreen(); } catch (e) {}
    }
  }
});

window.addEventListener("load", () => {
  const params = new URLSearchParams(location.search);
  window.game = new Phaser.Game({
    type: params.get("canvas") ? Phaser.CANVAS : Phaser.AUTO,   // ?canvas=1: headless test path
    width: 1280, height: 720,
    backgroundColor: "#14100e",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { roundPixels: true },
    scene: [BootScene, TitleScene, FightScene, MapScene, RewardScene, RestScene, TreasureScene,
            TavernScene, InnScene, CageScene, BuyerScene, StoryScene, ActClearScene, EpilogueScene]
  });
});
