// Zone music — plain HTMLAudio so it works from file:// and https alike.
// ONE cached Audio per track (duplicates are impossible); switching force-stops
// every other track. Missing files = silence, no errors.

const MusicMan = {
  tracks: {}, current: null, currentName: null, vol: 0.55, _missing: {}, _gestured: false,
  muted: (typeof localStorage !== 'undefined' && localStorage.getItem('ss-arpg-muted') === '1'),

  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem('ss-arpg-muted', this.muted ? '1' : '0'); } catch (e) {}
    if (this.muted) { if (this.current) this.current.pause(); }
    else if (this.current) { const p = this.current.play(); if (p && p.catch) p.catch(() => {}); this._fadeIn(this.current); }
    this._syncBtn();
    return this.muted;
  },

  _syncBtn() {
    const el = document.getElementById('musicBtn');
    if (el) { el.textContent = this.muted ? '♪ OFF' : '♪ ON'; el.style.opacity = this.muted ? 0.55 : 1; }
  },

  _bindBtn() {
    if (this._btnBound) return;
    const el = document.getElementById('musicBtn');
    if (!el) return;
    this._btnBound = true;
    el.addEventListener('pointerdown', e => { e.stopPropagation(); this.toggleMute(); });
    this._syncBtn();
  },

  _ensureGestureRetry() {
    if (this._gestured) return;
    this._gestured = true;
    const kick = () => {
      const a = this.current;
      if (a && a.paused && !this.muted && !this._missing[this.currentName]) {
        a.volume = 0; const p = a.play(); if (p && p.catch) p.catch(() => {});
        this._fadeIn(a);
      }
      // failsafe: anything that isn't the current track gets HARD-stopped, no exceptions
      for (const [n, t] of Object.entries(this.tracks))
        if (t !== this.current && !t.paused) this._hardStop(t);
    };
    window.addEventListener('pointerdown', kick);
    window.addEventListener('keydown', kick);
  },

  // Mobile-safe immediate stop. Phones routinely throttle/drop chained setTimeout
  // fade loops (esp. across a scene/zone transition), leaving a detached <audio>
  // looping forever. So we never rely on the async fade to actually stop a track:
  // we synchronously pause it, rewind it, and zero its volume right now.
  _hardStop(a) {
    if (!a) return;
    try { a.pause(); } catch (e) {}
    try { a.currentTime = 0; } catch (e) {}
    a.volume = 0;
    a._fading = false;
  },

  play(name) {
    this._ensureGestureRetry();
    this._bindBtn();
    if (this.currentName === name) {
      // already the active track — but make sure nothing else is sneaking through
      this._stopOthers(name);
      return;
    }
    this.currentName = name;
    // CRITICAL (mobile): kill every other track immediately and synchronously,
    // BEFORE starting the new one, so two tracks can never overlap.
    this._stopOthers(name);
    if (this._missing[name]) { this.current = null; return; }
    let a = this.tracks[name];
    if (!a) {
      a = new Audio('assets/music/' + name + '.mp3');
      a.loop = true; a.volume = 0;
      a.addEventListener('error', () => { this._missing[name] = true; if (this.current === a) this.current = null; });
      this.tracks[name] = a;
    }
    this.current = a;
    if (this.muted) return; // remembered as current; resumes on unmute
    const p = a.play(); if (p && p.catch) p.catch(() => {}); // retried on next gesture
    this._fadeIn(a);
  },

  // Hard-stop every cached track except `keep`. Synchronous — no timers, so it
  // always completes even on a throttled mobile browser.
  _stopOthers(keep) {
    for (const [n, a] of Object.entries(this.tracks)) if (n !== keep) this._hardStop(a);
  },

  // Fully stop all music (e.g. on a scene that should be silent).
  stop() {
    this.currentName = null;
    this.current = null;
    for (const a of Object.values(this.tracks)) this._hardStop(a);
  },

  _fadeIn(a) {
    const step = () => {
      if (this.current !== a) return;          // superseded — something else owns playback now
      // a track that comes up while a voice line is playing stays ducked under it
      const ceil = this._duckedByVoice && window.VoiceMan ? VoiceMan.DUCK : this.vol;
      a.volume = Math.min(ceil, a.volume + 0.05);
      if (a.volume < ceil - 0.001) setTimeout(step, 80);
    };
    step();
  },
};
if (typeof window !== 'undefined') window.MusicMan = MusicMan;
