// Virtual stick — shared by the arena and world scenes. Touch the left ~55% of
// the screen and drag: identical math to the source HTML's stick. Desktop mouse
// is unaffected (touch pointers only).
// Robustness: some mobile browsers hand Phaser TouchEvents (no pointerType, no
// clientX on the event itself) — we normalize via the Phaser pointer + changedTouches
// so the stick works on every phone, not just PointerEvent ones.

const TouchStick = {
  active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0, mag: 0,

  _isTouch(p) {
    if (p.wasTouch === true) return true;
    const ev = p.event;
    return !!(ev && (ev.pointerType === 'touch' || ev.pointerType === 'pen' || ev.changedTouches !== undefined));
  },
  _client(p) { // screen-space coords whatever the event flavor
    const ev = p.event || {};
    if (ev.changedTouches && ev.changedTouches.length)
      return { x: ev.changedTouches[0].clientX, y: ev.changedTouches[0].clientY };
    if (ev.clientX !== undefined) return { x: ev.clientX, y: ev.clientY };
    // last resort: project game coords back to the screen
    const sm = window.game && game.scale;
    if (sm && sm.canvasBounds) {
      const b = sm.canvasBounds;
      return { x: b.left + p.x / 1280 * b.width, y: b.top + p.y / 720 * b.height };
    }
    return { x: p.x, y: p.y };
  },

  attach(scene, onAttackTap) {
    const sb = document.getElementById('stickBase'), sn = document.getElementById('stickNub');
    scene.input.on('pointerdown', p => {
      if (!this._isTouch(p)) return;
      const c = this._client(p), cx = c.x, cy = c.y;
      if (cx < window.innerWidth * 0.55 && this.id === null) {
        this.id = p.id; this.ox = cx; this.oy = cy;
        this.dx = 0; this.dy = 0; this.mag = 0; this.active = true;
        sb.style.display = 'block'; sn.style.display = 'block';
        sb.style.left = (cx - 55) + 'px'; sb.style.top = (cy - 55) + 'px';
        sn.style.left = (cx - 24) + 'px'; sn.style.top = (cy - 24) + 'px';
      } else if (onAttackTap) onAttackTap(p); // right-side tap = attack
    });
    scene.input.on('pointermove', p => {
      if (this.id === null || p.id !== this.id) return;
      const c = this._client(p);
      let dx = c.x - this.ox, dy = c.y - this.oy;
      const m = Math.hypot(dx, dy), cap = 52, dz = 7; // dz = dead zone: kills micro-jitter drift
      // movement vector: a crisp unit direction scaled by a dead-zone-adjusted magnitude,
      // so the champion moves the instant the finger leaves the dead zone (responsive) and
      // never creeps from a stationary thumb.
      if (m <= dz) { this.dx = 0; this.dy = 0; this.mag = 0; }
      else { const mm = Math.min(1, (m - dz) / (cap - dz));
        this.dx = dx / m * mm; this.dy = dy / m * mm; this.mag = mm; }
      // nub follows the finger (capped to the ring) regardless of dead zone
      let nx = dx, ny = dy; if (m > cap) { nx = dx * cap / m; ny = dy * cap / m; }
      sn.style.left = (this.ox + nx - 24) + 'px'; sn.style.top = (this.oy + ny - 24) + 'px';
    });
    const end = p => {
      if (this.id === null || p.id !== this.id) return;
      this.id = null; this.dx = 0; this.dy = 0; this.mag = 0; this.active = false;
      sb.style.display = 'none'; sn.style.display = 'none';
    };
    scene.input.on('pointerup', end);
    scene.input.on('pointerupoutside', end);
  },

  isTouchDevice() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; },
};
if (typeof window !== 'undefined') window.TouchStick = TouchStick;
