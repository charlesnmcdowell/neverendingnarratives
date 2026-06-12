// Autopilot — spectate mode. The same bots that play the headless tests drive the
// real game on screen. F10 toggles. Demo-style keep-alive keeps the show going
// (the source's own intro demos do the same).

const Autopilot = {
  on: false,
  boardT: 0,

  toggle() { if (window.QuestNav) { QuestNav.cycleMode(); } else this.on = !this.on; return this.on; },

  // call every frame while a combat sim is active
  frame(combat, dt) {
    if (!this.on) return;
    const P = combat.P, S = combat.S;

    if (S.mode === 'board') { // linger on the fight board, then step onto the sand
      this.boardT += dt;
      if (this.boardT > 2.2) { this.boardT = 0; combat.startFight(); }
      return;
    }
    if (S.mode !== 'fight') return;

    // keep-alive, scaled up late where one-shots punch through (same as test harness)
    if (P.hp < combat.maxHP() * (S.fight >= 12 ? 0.85 : 0.45)) P.hp = combat.maxHP();

    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const foes = combat.enemies.filter(e => !e.dead);
    const prio = foes.filter(e => ['stitch', 'necro', 'master'].includes(e.type));
    const foe = (prio.length ? prio : foes).sort((a, b) => dist(P, a) - dist(P, b))[0];
    const k = combat.keys; k.w = k.a = k.s = k.d = false;
    if (!foe) return;
    const dFoe = dist(P, foe);
    const moveTo = (tx, ty) => { const dx = tx - P.x, dy = ty - P.y;
      k.w = dy < -8; k.s = dy > 8; k.a = dx < -8; k.d = dx > 8; };
    const nearest = foes.sort((a, b) => dist(P, a) - dist(P, b))[0];

    if (P.char === 'warlock') {
      if (P.devilT > 0) { combat.doSlash(); return; }
      moveTo(foe.x, foe.y);
      if (prio.length && P.parryCD <= 0 && dFoe > 160 && foes.length > 1) combat.doParry();
      if (P.hexCD <= 0 && (nearest === foe || dFoe < 70)) combat.doSlash();
      const demonsUp = combat.demons.filter(d => d.hp > 0).length;
      if (!P.channel && demonsUp === 0 && P.heavyCD <= 0) {
        if (dist(P, nearest) < 230 && P.rollCD <= 0) combat.doRoll();
        combat.doHeavy();
      }
      if (P.channel) { const want = combat.lvl() >= 8 ? 6.2 : (combat.lvl() >= 3 ? 4.2 : 3.2);
        if (P.channel.t >= want) combat.heavyRelease(); }
      if (P.hp / combat.maxHP() < 0.35 && P.rollCD <= 0 && dist(P, nearest) < 80) combat.doRoll();
    } else if (P.char === 'druid') {
      const tooClose = dFoe < 90, tooFar = dFoe > 165;
      if (tooClose) moveTo(P.x + (P.x - foe.x), P.y + (P.y - foe.y));
      else if (tooFar) moveTo(foe.x, foe.y);
      if (P.form === 'human') {
        combat.doSlash();
        if (foes.some(e => dist(P, e) < 160) && P.cdVines <= 0) combat.doHeavy();
        if (combat.lvl() >= 6 && P.hp / combat.maxHP() < 0.5 && P.humanCD <= 0) { combat.doParry(); combat.doParry(); }
      } else if (P.form === 'wolf') {
        if (P.cdHowl <= 0) combat.doHeavy();
        combat.doSlash();
      } else {
        if (dFoe < 130 && P.cdRoar <= 0) combat.doHeavy();
        if (dFoe < 95) combat.doSlash(); else combat.doParry();
      }
      if (foe.attacking && foe.tele < 0.15 && dFoe < 100 && P.rollCD <= 0) combat.doRoll();
    } else { // ronin
      moveTo(foe.x - Math.cos(foe.face) * 55, foe.y - Math.sin(foe.face) * 55);
      if (foe.attacking && foe.tele > 0 && dFoe < 140) combat.doParry();
      if (dFoe < 95) { if (P.heavyCD <= 0 && Math.random() < 0.25) combat.doHeavy(); else combat.doSlash(); }
      if (P.hp / combat.maxHP() < 0.3 && dFoe < 90 && P.rollCD <= 0) combat.doRoll();
    }
  },
};
if (typeof window !== 'undefined') window.Autopilot = Autopilot;
