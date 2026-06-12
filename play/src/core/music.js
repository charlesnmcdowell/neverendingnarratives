// Zone music — plain HTMLAudio so it works from file:// (no XHR).
// Drop tracks into game/assets/music/ named: title.mp3, arena.mp3, city.mp3,
// grove.mp3, dungeon.mp3. Missing files = silence, no errors. Fades between zones.

const MusicMan = {
  current: null, currentName: null, vol: 0.55, _fade: null, _missing: {},

  play(name) {
    if (this.currentName === name) return;
    this.currentName = name;
    const old = this.current;
    if (old) this._fadeOut(old);
    this.current = null;
    if (this._missing[name]) return;
    const a = new Audio('assets/music/' + name + '.mp3');
    a.loop = true; a.volume = 0;
    a.addEventListener('error', () => { this._missing[name] = true; if (this.current === a) this.current = null; });
    const p = a.play();
    if (p && p.catch) p.catch(() => { /* autoplay blocked until first input; retried below */ });
    this.current = a;
    this._fadeIn(a);
    // browsers block autoplay before a user gesture — retry once on next input
    const retry = () => { if (this.current === a && a.paused && !this._missing[name]) a.play().catch(() => {});
      window.removeEventListener('pointerdown', retry); window.removeEventListener('keydown', retry); };
    window.addEventListener('pointerdown', retry); window.addEventListener('keydown', retry);
  },

  _fadeIn(a) {
    const step = () => { if (this.current !== a) return;
      a.volume = Math.min(this.vol, a.volume + 0.04);
      if (a.volume < this.vol) setTimeout(step, 80); };
    step();
  },

  _fadeOut(a) {
    const step = () => { a.volume = Math.max(0, a.volume - 0.06);
      if (a.volume > 0) setTimeout(step, 70); else { a.pause(); a.src = ''; } };
    step();
  },
};
if (typeof window !== 'undefined') window.MusicMan = MusicMan;
