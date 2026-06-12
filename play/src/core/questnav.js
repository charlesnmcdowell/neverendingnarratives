// QuestNav — tap a quest in the journal and the champion walks there: BFS pathfinding
// inside zones, gate/coach/dungeon routing between zones. AUTO modes:
//   0 OFF · 1 FIGHT (combat bot only) · 2 FULL (walks the main quest, fights interrupts,
//   advances the dialogs it opened — an AFK game on the phone).
// Manual movement always cancels the walk. Story stays Hiro-canon: FULL clicks the
// first (quest-advancing) option of dialogs IT opened; player-opened dialogs stay manual.

const QuestNav = {
  mode: 0,                       // AUTO: 0 off, 1 fight, 2 full
  tracking: false,               // walking toward an objective
  path: [], pathI: 0,
  autoDialog: false,             // FULL opened the current dialog
  dialogT: 0,
  _zoneOf: { 'karridge-city': 'CityScene', 'thorn-grove': 'GroveScene', 'grove-dungeon': 'DungeonScene', 'varenholm': 'VarenholmScene', 'dragonspine': 'MountainScene' },

  cycleMode() {
    this.setMode((this.mode + 1) % 3);
    return ['AUTO: OFF', 'AUTO: FIGHT', 'AUTO: FULL'][this.mode];
  },

  setMode(m) {
    this.mode = m;
    Autopilot.on = m >= 1;
    if (window.GameState && GameState.meta) GameState.meta.autoMode = m;
    if (m === 2) this.tracking = true; else if (m === 0) this.stop();
    const label = ['AUTO: OFF', 'AUTO: FIGHT', 'AUTO: FULL'][m];
    for (const id of ['autoBtn', 'autoBtnArena']) {
      const el = document.getElementById(id); if (el) el.textContent = label;
    }
  },

  // ---- where is the main quest right now? -> {zone, x, y, interact, label} ----
  objective() {
    const GS = window.GameState, f = GS.world.flags, T = 32, druid = GS.player && GS.player.char === 'druid';
    const at = (zone, x, y, interact, label) => ({ zone, x, y, interact: !!interact, label });
    if (GS.player && GS.player.char === 'seraph') { // the angel's road: inn -> spine trail -> five banners -> the shrine
      if (!f['q-sq1-the-host-below']) return null;
      if (f['q-sq1-the-host-below'] === 'active' || !f['q-sq2-where-strength-lives'])
        return at('karridge-city', 640, 704, true, 'the Last Lantern — Marlow');
      if (f['q-sq2-where-strength-lives'] === 'active')
        return at('dragonspine', 27 * T, 39 * T, false, 'the spine trail — Dragonspine');
      if (f['q-sq3-five-banners'] === 'active') {
        const c = Quests.seraph.candidates.find(x => !f['duel-' + x.id]) || Quests.seraph.candidates[0];
        return at('dragonspine', c.spot[0] * T, c.spot[1] * T, true, c.short);
      }
      if (f['q-sq4-the-chosen'] === 'active') return at('dragonspine', 32 * T, 5 * T, true, 'the Skyreach shrine');
      return null;
    }
    if (!f['q-mq1-empty-cell']) return null;
    if (f['q-mq1-empty-cell'] === 'active' || (f['q-mq1-empty-cell'] === 'done' && !f['q-mq2-listening-room']))
      return at('karridge-city', 640, 704, true, 'the Last Lantern — Marlow');
    if (f['q-mq2-listening-room'] === 'active') return at('thorn-grove', 6 * T, 19 * T, true, 'the cult waystation');
    if (f['q-mq3-roots-that-rot'] === 'active') return at('karridge-city', 12 * T, 36 * T, true, 'the veiled woman');
    if (f['q-mq4-the-buyer'] === 'active') return at('thorn-grove', 4 * T, 27 * T, true, 'the night shipment');
    if (f['q-mq5-ash-and-silence'] === 'active') return at('karridge-city', 35 * T, 25.5 * T, false, 'the plaza'); // open ground south of the well (the well itself is solid)
    if (f['q-mq5-ash-and-silence'] === 'done' && druid && f['q-mq6-the-dancer'] !== 'done') {
      if (GS.world.zone !== 'varenholm') return at('karridge-city', 1656, 744, true, 'the heartland coach');
      if (!f['varenholm-show-seen']) return at('varenholm', 1248, 416, true, 'the Civic Auditorium');
      return at('varenholm', 864, 896, true, 'the Adventurers Guild — Cookie');
    }
    // after Cookie: the road home rolls the credits — guide her to the coach so she's never stranded
    if (f['q-mq6-the-dancer'] === 'done' && druid && !f['credits-rolled']) {
      if (GS.world.zone === 'varenholm') return at('varenholm', 896, 1088, true, 'the coach home — your road south');
      return at('karridge-city', 1656, 744, true, 'the heartland coach');
    }
    return null;
  },

  // ---- zone graph: next hop from zone A toward zone B ----
  nextHop(from, to) {
    const HOPS = {
      'karridge-city': { 'thorn-grove': { x: 1120, y: 24, interact: false }, 'grove-dungeon': { x: 1120, y: 24, interact: false }, 'varenholm': { x: 1656, y: 744, interact: true }, 'dragonspine': { x: 1120, y: 24, interact: false } },
      'thorn-grove': { 'karridge-city': { x: 1088, y: 1572, interact: false }, 'varenholm': { x: 1088, y: 1572, interact: false }, 'grove-dungeon': { x: 1984, y: 1344, interact: true }, 'dragonspine': { x: 2216, y: 320, interact: false } },
      'grove-dungeon': { 'thorn-grove': { x: 160, y: 96, interact: true }, 'karridge-city': { x: 160, y: 96, interact: true }, 'varenholm': { x: 160, y: 96, interact: true }, 'dragonspine': { x: 160, y: 96, interact: true } },
      'varenholm': { 'karridge-city': { x: 896, y: 1088, interact: true }, 'thorn-grove': { x: 896, y: 1088, interact: true }, 'grove-dungeon': { x: 896, y: 1088, interact: true }, 'dragonspine': { x: 896, y: 1088, interact: true } },
      'dragonspine': { 'thorn-grove': { x: 864, y: 1380, interact: false }, 'karridge-city': { x: 864, y: 1380, interact: false }, 'grove-dungeon': { x: 864, y: 1380, interact: false }, 'varenholm': { x: 864, y: 1380, interact: false } },
    };
    return (HOPS[from] || {})[to] || null;
  },

  startTracking(scene) {
    const obj = this.objective();
    if (!obj) { scene.floatText(scene.player.x, scene.player.y - 50, 'the story rests — no active objective', '#9a8f80'); return false; }
    this.tracking = true;
    this.replan(scene);
    scene.floatText(scene.player.x, scene.player.y - 50, '▶ walking to ' + obj.label, '#3df0c8');
    return true;
  },

  stop() { this.tracking = false; this.path = []; this.pathI = 0; },

  replan(scene) {
    const obj = this.objective();
    if (!obj) { this.stop(); return; }
    const zone = window.GameState.world.zone;
    const tgt = (obj.zone === zone) ? obj : this.nextHop(zone, obj.zone);
    if (!tgt) { this.stop(); return; }
    this.target = { x: tgt.x, y: tgt.y, interact: tgt.interact, final: obj.zone === zone };
    this.path = this.findPath(scene, scene.player.x, scene.player.y, tgt.x, tgt.y);
    this.pathI = 0;
  },

  // BFS on the 32px grid built from scene solids (maps are small; BFS is instant)
  findPath(scene, sx, sy, tx, ty) {
    const T = 32, W = Math.ceil(scene.worldW / T), H = Math.ceil(scene.worldH / T);
    const blocked = new Uint8Array(W * H);
    for (const s of scene.solids)
      for (let gy = Math.max(0, (s.y - 8) / T | 0); gy <= Math.min(H - 1, (s.y + s.h + 8) / T | 0); gy++)
        for (let gx = Math.max(0, (s.x - 8) / T | 0); gx <= Math.min(W - 1, (s.x + s.w + 8) / T | 0); gx++)
          blocked[gy * W + gx] = 1;
    const id = (x, y) => y * W + x;
    const S = [Math.min(W - 1, Math.max(0, sx / T | 0)), Math.min(H - 1, Math.max(0, sy / T | 0))];
    const E = [Math.min(W - 1, Math.max(0, tx / T | 0)), Math.min(H - 1, Math.max(0, ty / T | 0))];
    blocked[id(S[0], S[1])] = 0; blocked[id(E[0], E[1])] = 0;
    const prev = new Int32Array(W * H).fill(-1);
    const q = [id(S[0], S[1])]; prev[q[0]] = q[0];
    let found = false, best = q[0], bestD = Math.abs(S[0] - E[0]) + Math.abs(S[1] - E[1]);
    while (q.length) {
      const cur = q.shift();
      if (cur === id(E[0], E[1])) { found = true; break; }
      const cx = cur % W, cy = (cur / W) | 0;
      const d = Math.abs(cx - E[0]) + Math.abs(cy - E[1]);
      if (d < bestD) { bestD = d; best = cur; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = id(nx, ny);
        if (blocked[n] || prev[n] !== -1) continue;
        prev[n] = cur; q.push(n);
      }
    }
    const pts = [];
    let cur = found ? id(E[0], E[1]) : best; // unreachable target: walk to the closest reachable tile
    while (prev[cur] !== cur) { pts.push({ x: (cur % W) * T + T / 2, y: ((cur / W) | 0) * T + T / 2 }); cur = prev[cur]; }
    pts.reverse(); pts.push({ x: tx, y: ty });
    return pts;
  },

  // called from WorldScene.updatePlayer — returns {mx,my} drive or null
  drive(scene) {
    if (!this.tracking || this.path.length === 0) {
      if (this.tracking && this.mode === 2) this.replan(scene); // FULL self-starts
      if (this.path.length === 0) return null;
    }
    const p = scene.player;
    let wp = this.path[this.pathI];
    while (wp && Math.hypot(wp.x - p.x, wp.y - p.y) < 22) { this.pathI++; wp = this.path[this.pathI]; }
    if (!wp) { // arrived at zone target
      this.path = []; this.pathI = 0;
      if (this.target && this.target.interact) {
        if (this.target.final && this.mode !== 2) { this.stop(); scene.floatText(p.x, p.y - 50, 'you have arrived', '#3df0c8'); return null; }
        this.autoDialog = true;
        scene.tryInteract();
      } else if (this.target && this.target.final) { this.stop(); scene.floatText(p.x, p.y - 50, 'you have arrived', '#3df0c8'); }
      return null;
    }
    const dx = wp.x - p.x, dy = wp.y - p.y, m = Math.hypot(dx, dy);
    return { mx: dx / m, my: dy / m };
  },

  // FULL with nothing to do: quietly resume the hunt after a short idle
  idleResume(scene, dt) {
    if (this.mode !== 2 || this.tracking || CityUI.dialogOpen() || scene.encounterActive) { this._idleT = 0; return; }
    this._idleT = (this._idleT || 0) + dt;
    if (this._idleT > 1.2 && this.objective()) { this._idleT = 0; this.tracking = true; this.replan(scene); }
  },

  // FULL: advance ANY open dialog — but NEVER over a voice line. The mode is a
  // debugging chauffeur (Hiro): it makes every choice and walks every road, yet
  // waits for the current clip (and the queued reply) to finish so every word of
  // voice acting is heard. Companion chat menus (first option 'Talk') still close.
  updateDialogs(scene, dt) {
    if (this.mode !== 2) return;
    if (!CityUI.dialogOpen()) { this.dialogT = 0; this._voiceGapT = 0; return; }
    this.dialogT += dt;
    const a = window.VoiceMan && VoiceMan.current;
    const speaking = (a && !a.paused && !a.ended) || (window.VoiceMan && VoiceMan._pending);
    if (speaking && this.dialogT < 90) { this._voiceGapT = 0; return; } // let the line land (90s failsafe)
    this._voiceGapT = (this._voiceGapT || 0) + dt;
    if (this.dialogT < 2.8 || this._voiceGapT < 0.8) return; // reading pause + a beat after the voice
    this.dialogT = 0; this._voiceGapT = 0;
    const opts = document.querySelectorAll('#dlgOpts .dlgopt:not(.disabled)');
    if (opts.length && opts[0].textContent.trim() !== 'Talk') opts[0].dispatchEvent(new Event('pointerdown'));
    else if (opts.length) CityUI.closeDialog();
    if (!CityUI.dialogOpen()) { this.autoDialog = false; this.replan(scene); }
  },

};
if (typeof window !== 'undefined') window.QuestNav = QuestNav;
