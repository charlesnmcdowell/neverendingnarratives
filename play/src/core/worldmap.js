// World map overlay (M key) — proves the world's scale; locked regions are teasers.

const WorldMapUI = {
  visible: false,
  toggle() { this.visible ? this.hide() : this.show(); },
  hide() { const el = document.getElementById('worldmap'); el.style.display = 'none'; this.visible = false; },
  show() {
    const el = document.getElementById('worldmap');
    const zone = window.GameState.world.zone;
    const regions = [
      { id: 'karridge', name: 'KARRIDGE CITY', x: 46, y: 64, open: true, here: zone === 'karridge-city' },
      { id: 'grove', name: 'THORN GROVE', x: 46, y: 38, open: true, here: zone === 'thorn-grove' || zone === 'grove-dungeon' },
      { id: 'varenholm', name: 'VARENHOLM', x: 20, y: 50,
        open: window.GameState.world.flags['q-mq5-ash-and-silence'] === 'done' && window.GameState.player.char === 'druid',
        here: zone === 'varenholm', note: window.GameState.player.char === 'druid' ? 'the heartland — coach from Karridge' : 'the heartland — another champion\'s road' },
      { id: 'deepwood', name: 'DEEPWOOD INTERIOR', x: 38, y: 16, open: false, note: 'the Eldest do not invite' },
      { id: 'dragonspine', name: 'DRAGONSPINE', x: 72, y: 10,
        open: window.GameState.player.char === 'seraph',
        here: zone === 'dragonspine',
        note: window.GameState.player.char === 'seraph' ? 'the spine trail — east past Thorn Grove' : 'treaty lands — dragons' },
      { id: 'kharn', name: 'KHARN-DURAL', x: 14, y: 28, open: false, note: 'the undermountain' },
      { id: 'ashenveil', name: 'THE ASHENVEIL', x: 80, y: 46, open: false, note: 'the way is barred' },
    ];
    let h = '<div class="qhead">The Kingdom of Ankunyx — known roads</div><div id="wmcanvas">';
    h += '<svg viewBox="0 0 100 80" style="width:100%;height:100%">';
    h += '<path d="M46,64 L46,38" stroke="#7a6a4a" stroke-width="1" stroke-dasharray="2,1.5" fill="none"/>';
    h += '<path d="M46,38 L38,16 M46,38 L72,10 M46,64 L14,28 M46,64 L80,46" stroke="#3a332a" stroke-width="0.7" stroke-dasharray="1,2" fill="none"/>';
    for (const r of regions) {
      const col = r.open ? '#e7b450' : '#564c40';
      h += `<circle cx="${r.x}" cy="${r.y}" r="${r.here ? 3 : 2}" fill="${r.here ? '#3df0c8' : col}"/>`;
      h += `<text x="${r.x}" y="${r.y - 4}" text-anchor="middle" font-size="3.4" fill="${col}" font-family="Courier New" letter-spacing="0.5">${r.name}</text>`;
      if (!r.open) h += `<text x="${r.x}" y="${r.y + 6}" text-anchor="middle" font-size="2.3" fill="#3a332a" font-family="Courier New">${r.note}</text>`;
    }
    h += '</svg></div><div class="qobj" style="margin-top:8px">M — close · grey regions are spoken of, not yet walked</div>';
    el.innerHTML = h; el.style.display = 'block'; this.visible = true;
  },
};
if (typeof window !== 'undefined') window.WorldMapUI = WorldMapUI;
