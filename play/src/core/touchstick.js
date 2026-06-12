// Virtual stick — shared by the arena and world scenes. Touch the left ~55% of
// the screen and drag: identical math to the source HTML's stick. Desktop mouse
// is unaffected (touch pointers only).

const TouchStick = {
  active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0, mag: 0,

  attach(scene, onAttackTap) {
    const sb = document.getElementById('stickBase'), sn = document.getElementById('stickNub');
    scene.input.on('pointerdown', p => {
      const ev = p.event;
      if (!ev || (ev.pointerType !== 'touch' && ev.pointerType !== 'pen')) return;
      const cx = ev.clientX, cy = ev.clientY;
      if (cx < window.innerWidth * 0.55 && this.id === null) {
        this.id = ev.pointerId; this.ox = cx; this.oy = cy;
        this.dx = 0; this.dy = 0; this.mag = 0; this.active = true;
        sb.style.display = 'block'; sn.style.display = 'block';
        sb.style.left = (cx - 55) + 'px'; sb.style.top = (cy - 55) + 'px';
        sn.style.left = (cx - 24) + 'px'; sn.style.top = (cy - 24) + 'px';
      } else if (onAttackTap) onAttackTap(p); // right-side tap = attack
    });
    scene.input.on('pointermove', p => {
      const ev = p.event;
      if (!ev || ev.pointerId !== this.id) return;
      let dx = ev.clientX - this.ox, dy = ev.clientY - this.oy;
      const m = Math.hypot(dx, dy), cap = 52;
      if (m > cap) { dx *= cap / m; dy *= cap / m; }
      this.dx = dx / cap; this.dy = dy / cap; this.mag = Math.min(1, m / cap);
      sn.style.left = (this.ox + dx - 24) + 'px'; sn.style.top = (this.oy + dy - 24) + 'px';
    });
    const end = p => {
      const ev = p.event;
      if (!ev || ev.pointerId !== this.id) return;
      this.id = null; this.dx = 0; this.dy = 0; this.mag = 0; this.active = false;
      sb.style.display = 'none'; sn.style.display = 'none';
    };
    scene.input.on('pointerup', end);
    scene.input.on('pointerupoutside', end);
  },

  isTouchDevice() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; },
};
if (typeof window !== 'undefined') window.TouchStick = TouchStick;
