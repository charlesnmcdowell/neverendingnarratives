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
