// Zone music — plain HTMLAudio so it works from file:// and https alike.
// ONE cached Audio per track (duplicates are impossible); switching force-fades
// every other track. Missing files = silence, no errors.

const MusicMan = {
  tracks: {}, current: null, currentName: null, vol: 0.55, _missing: {}, _gestured: false,

  _ensureGestureRetry() {
    if (this._gestured) return;
    this._gestured = true;
    const kick = () => {
      const a = this.current;
      if (a && a.paused && !this._missing[this.currentName]) a.play().catch(() => {});
    };
    window.addEventListener('pointerdown', kick);
    window.addEventListener('keydown', kick);
  },

  play(name) {
    this._ensureGestureRetry();
    if (this.currentName === name) return;
    this.currentName = name;
    for (const [n, a] of Object.entries(this.tracks)) if (n !== name) this._fadeOut(a);
    if (this._missing[name]) { this.current = null; return; }
    let a = this.tracks[name];
    if (!a) {
      a = new Audio('assets/music/' + name + '.mp3');
      a.loop = true; a.volume = 0;
      a.addEventListener('error', () => { this._missing[name] = true; if (this.current === a) this.current = null; });
      this.tracks[name] = a;
    }
    this.current = a;
    const p = a.play(); if (p && p.catch) p.catch(() => {}); // retried on next gesture
    this._fadeIn(a);
  },

  _fadeIn(a) {
    const step = () => {
      if (this.current !== a) return;          // superseded — its fadeOut owns it now
      a.volume = Math.min(this.vol, a.volume + 0.05);
      if (a.volume < this.vol - 0.001) setTimeout(step, 80);
    };
    step();
  },

  _fadeOut(a) {
    if (a._fading) return;
    a._fading = true;
    const step = () => {
      if (this.current === a) { a._fading = false; return; } // re-promoted mid-fade
      a.volume = Math.max(0, a.volume - 0.08);
      if (a.volume > 0) setTimeout(step, 60);
      else { a.pause(); a.currentTime = 0; a._fading = false; }
    };
    step();
  },
};
if (typeof window !== 'undefined') window.MusicMan = MusicMan;
