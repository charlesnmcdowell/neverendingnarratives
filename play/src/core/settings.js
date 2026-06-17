// Settings panel (⚙) — music/voice volume, AUTO mode, credits, and NEW GAME.
// DOM-only; safe everywhere (title, arena, world). Volumes persist in localStorage.

const SettingsUI = {
  open: false,

  init() {
    if (this._bound) return;
    const gear = document.getElementById('settingsBtn');
    if (!gear) return;
    this._bound = true;
    // restore persisted volumes
    try {
      const mv = parseFloat(localStorage.getItem('ss-arpg-musicvol'));
      if (!isNaN(mv) && window.MusicMan) MusicMan.vol = mv;
      const vv = parseFloat(localStorage.getItem('ss-arpg-voicevol'));
      if (!isNaN(vv) && window.VoiceMan) VoiceMan.vol = vv;
    } catch (e) {}
    gear.addEventListener('pointerdown', e => { e.stopPropagation(); this.toggle(); });
  },

  toggle() { this.open ? this.hide() : this.show(); },
  hide() { document.getElementById('settings').style.display = 'none'; this.open = false; },

  show() {
    const el = document.getElementById('settings');
    this.open = true;
    const autoLabel = ['AUTO: OFF', 'AUTO: FIGHT', 'AUTO: FULL'][window.QuestNav ? QuestNav.mode : 0];
    el.innerHTML = `
      <div class="qhead">Settings — tap ⚙ to close</div>
      <div class="qtitle">MUSIC</div>
      <div style="display:flex;gap:10px;align-items:center;margin-top:6px">
        <span id="setMusicTgl" class="dlgopt" style="margin-top:0">${window.MusicMan && MusicMan.muted ? '♪ OFF' : '♪ ON'}</span>
        <input id="setMusicVol" type="range" min="0" max="100" value="${Math.round((window.MusicMan ? MusicMan.vol : 0.55) * 100)}" style="flex:1">
      </div>
      <div class="qtitle" style="margin-top:14px">VOICE</div>
      <div style="display:flex;gap:10px;align-items:center;margin-top:6px">
        <input id="setVoiceVol" type="range" min="0" max="100" value="${Math.round((window.VoiceMan && VoiceMan.vol !== undefined ? VoiceMan.vol : 0.95) * 100)}" style="flex:1">
      </div>
      <div class="qtitle" style="margin-top:14px">AUTO PLAY</div>
      <div id="setAuto" class="dlgopt" style="margin-top:6px">${autoLabel} — tap to cycle</div>
      <div class="qtitle" style="margin-top:14px">GAME</div>
      <div id="setCredits" class="dlgopt" style="margin-top:6px">View credits</div>
      <div id="setNewGame" class="dlgopt" style="margin-top:6px;color:#c8443a;border-color:rgba(200,68,58,.5)">NEW GAME — erase the save</div>
      <div id="setNewGameConfirm" style="display:none;margin-top:6px">
        <div class="qtext">The champion, the gold, the story — gone. Sure?</div>
        <div style="display:flex;gap:8px">
          <div id="setWipeYes" class="dlgopt" style="color:#c8443a;border-color:rgba(200,68,58,.5)">Erase it. Start over.</div>
          <div id="setWipeNo" class="dlgopt">Keep my story</div>
        </div>
      </div>`;
    el.style.display = 'block';
    const $ = id => document.getElementById(id);
    $('setMusicTgl').addEventListener('pointerdown', e => { e.stopPropagation();
      const m = MusicMan.toggleMute(); $('setMusicTgl').textContent = m ? '♪ OFF' : '♪ ON'; });
    const slide = (id, fn) => { const s = $(id);
      for (const ev of ['input', 'change']) s.addEventListener(ev, () => fn(s.value / 100)); };
    slide('setMusicVol', v => { MusicMan.vol = v;
      if (MusicMan.current) MusicMan.current.volume = v;
      try { localStorage.setItem('ss-arpg-musicvol', v); } catch (e) {} });
    slide('setVoiceVol', v => { VoiceMan.vol = v;
      if (VoiceMan.current) VoiceMan.current.volume = v;
      try { localStorage.setItem('ss-arpg-voicevol', v); } catch (e) {} });
    $('setAuto').addEventListener('pointerdown', e => { e.stopPropagation();
      const label = QuestNav.cycleMode(); $('setAuto').textContent = label + ' — tap to cycle'; });
    $('setCredits').addEventListener('pointerdown', e => { e.stopPropagation();
      this.hide(); CityUI.credits('THE STORY SO FAR — four roads out of the Pit'); });
    $('setNewGame').addEventListener('pointerdown', e => { e.stopPropagation();
      $('setNewGameConfirm').style.display = 'block'; });
    $('setWipeNo').addEventListener('pointerdown', e => { e.stopPropagation();
      $('setNewGameConfirm').style.display = 'none'; });
    $('setWipeYes').addEventListener('pointerdown', e => { e.stopPropagation();
      try { SaveSystem.wipe(); sessionStorage.removeItem('ss-skew-reload'); } catch (e2) {}
      location.replace(location.pathname); });
  },
};
if (typeof window !== 'undefined') {
  window.SettingsUI = SettingsUI;
  if (document.readyState !== 'loading') SettingsUI.init();
  else document.addEventListener('DOMContentLoaded', () => SettingsUI.init());
}

// ---------- Pause menu / onboarding hints / shareable result card (Hiro quick-wins) ----------
const PauseUI = {
  open: false, _paused: null,
  init() {
    if (this._bound) return; this._bound = true;
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (this.open) { this.hide(); return; }
      if (this._blocked()) return;
      this.show();
    });
    const $ = id => document.getElementById(id);
    const on = (id, fn) => { const b = $(id); if (b) b.addEventListener('pointerdown', e => { e.stopPropagation(); fn(); }); };
    on('pauseResume', () => this.hide());
    on('pauseSettings', () => { if (window.SettingsUI) SettingsUI.show(); });
    on('pauseQuit', () => { try { location.replace(location.pathname); } catch (e) { location.reload(); } });
  },
  _blocked() {
    if (!window.GameState || !window.GameState.player) return true;
    if (window.SettingsUI && SettingsUI.open) return true;
    if (document.querySelector('.screen.show')) return true;
    try { if (window.CityUI && CityUI.dialogOpen && CityUI.dialogOpen()) return true; } catch (e) {}
    return false;
  },
  _scenes() { try { return (window.game && window.game.scene.getScenes(true)) || []; } catch (e) { return []; } },
  show() {
    if (this.open) return;
    this._paused = this._scenes();
    for (const s of this._paused) { try { s.scene.pause(); } catch (e) {} }
    const el = document.getElementById('pauseMenu'); if (el) el.style.display = 'flex';
    this.open = true;
  },
  hide() {
    const el = document.getElementById('pauseMenu'); if (el) el.style.display = 'none';
    for (const s of (this._paused || [])) { try { s.scene.resume(); } catch (e) {} }
    this._paused = null; this.open = false;
  },
};

const OnboardUI = {
  _seen: false,
  init() {
    if (this._bound) return; this._bound = true;
    try { if (localStorage.getItem('ss-arpg-tut-seen')) this._seen = true; } catch (e) {}
    const ctrl = document.getElementById('controls');
    if (!ctrl) return;
    const obs = new MutationObserver(() => {
      if (this._seen) return;
      const vis = ctrl.style.display && ctrl.style.display !== 'none';
      if (vis && window.GameState && window.GameState.player && !document.querySelector('.screen.show')) this.show();
    });
    obs.observe(ctrl, { attributes: true, attributeFilter: ['style'] });
    const o = document.getElementById('onboardHints');
    if (o) o.addEventListener('pointerdown', () => this.hide());
  },
  show() {
    if (this._seen) return; this._seen = true;
    try { localStorage.setItem('ss-arpg-tut-seen', '1'); } catch (e) {}
    const o = document.getElementById('onboardHints'); if (!o) return;
    o.innerHTML = window.IS_PHONE
      ? '<b>How to fight</b><br>Left stick to move &nbsp;&middot;&nbsp; tap the buttons to attack, parry, roll<br><span class="ob-dismiss">tap to dismiss</span>'
      : '<b>How to fight</b><br>WASD / Arrows move &nbsp;&middot;&nbsp; J or Click attack &nbsp;&middot;&nbsp; K parry &nbsp;&middot;&nbsp; Space roll &nbsp;&middot;&nbsp; Q heavy<br><span class="ob-dismiss">click or press a key to dismiss</span>';
    o.style.display = 'block';
    clearTimeout(this._t); this._t = setTimeout(() => this.hide(), 9000);
    window.addEventListener('keydown', () => this.hide(), { once: true });
  },
  hide() { const o = document.getElementById('onboardHints'); if (o) o.style.display = 'none'; clearTimeout(this._t); },
};

const ShareUI = {
  init() {
    if (this._bound) return; this._bound = true;
    const bind = (id, kind) => { const b = document.getElementById(id);
      if (b) b.addEventListener('pointerdown', e => { e.stopPropagation(); this.make(kind); }); };
    bind('vicShare', 'victory'); bind('deathShare', 'death'); bind('creditsShare', 'credits');
  },
  _stat(kind) {
    const id = { victory: 'vicStats', death: 'deathStats', credits: 'creditsEnding' }[kind];
    const el = id && document.getElementById(id); return el ? el.textContent.trim() : '';
  },
  make(kind) {
    const W = 1200, H = 630, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#15100b'); g.addColorStop(1, '#0a0808');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#2c2118'; x.lineWidth = 6; x.strokeRect(14, 14, W - 28, H - 28);
    x.textAlign = 'center';
    const nick = (window.GameState && window.GameState.player && window.GameState.player.nickname) || 'NOBODY';
    const head = { victory: 'THE NAME OF THE PIT', death: 'THE SAND TOOK ANOTHER', credits: 'THE STORY HAS BARELY BEGUN' }[kind] || 'PIT OF KARRIDGE';
    x.fillStyle = '#8a8474'; x.font = '600 26px Georgia, serif'; x.fillText('THE SORCERER-SWORD  ·  PIT OF KARRIDGE', W / 2, 84);
    x.fillStyle = '#e7b450'; x.font = '700 58px Georgia, serif'; x.fillText(head, W / 2, 176);
    x.fillStyle = '#cfc6b4'; x.font = '700 50px Georgia, serif'; x.fillText('“' + nick + '”', W / 2, 290);
    const stat = this._stat(kind); if (stat) { x.fillStyle = '#9aa0a8'; x.font = '26px monospace'; x.fillText(stat.slice(0, 64), W / 2, 360); }
    x.fillStyle = '#3df0c8'; x.font = '600 28px Georgia, serif'; x.fillText('play  ·  neverendingnarratives.com', W / 2, 466);
    x.fillStyle = '#e7b450'; x.font = '22px Georgia, serif'; x.fillText('Books 1 & 2 on Amazon  ·  Neverending Narratives podcast', W / 2, 514);
    x.fillStyle = '#6b5d4f'; x.font = '20px Georgia, serif'; x.fillText('a game in the world of the novels', W / 2, 574);
    try {
      c.toBlob(b => {
        if (!b) { this._fallback(c); return; }
        const file = (typeof File !== 'undefined') ? new File([b], 'sorcerer-sword.png', { type: 'image/png' }) : null;
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: 'The Sorcerer-Sword', text: 'I walked out of the Pit as ' + nick }).catch(() => this._dl(b));
        } else this._dl(b);
      }, 'image/png');
    } catch (e) { this._fallback(c); }
  },
  _dl(b) {
    const url = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = url; a.download = 'sorcerer-sword-result.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  },
  _fallback(c) {
    try { const w = window.open(); if (w) w.document.write('<img src="' + c.toDataURL('image/png') + '">'); } catch (e) {}
  },
};

if (typeof window !== 'undefined') {
  window.PauseUI = PauseUI; window.OnboardUI = OnboardUI; window.ShareUI = ShareUI;
  const _initQuickWins = () => { try { PauseUI.init(); OnboardUI.init(); ShareUI.init(); } catch (e) {} };
  if (document.readyState !== 'loading') _initQuickWins();
  else document.addEventListener('DOMContentLoaded', _initQuickWins);
}
