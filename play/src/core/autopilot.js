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
      if (S.canLeave) return; // Bellow's buy-out is up — leaving is the default; the arena scene takes it
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
      if (P.lich) { // dead man's plan: scythe the close ones, FADE, hold the long channel home
        if (dFoe < 95 && !P.channel && P.fadeT <= 0) combat.doSlash();
        if (P.parryCD <= 0 && P.fadeT <= 0 && !P.channel) combat.doParry(); // FADE first
        if (!P.channel) combat.doHeavy(); // then raise the dead — never release, stage 3 is the way back
        if (dFoe < 140 && !P.channel) moveTo(P.x + (P.x - foe.x), P.y + (P.y - foe.y));
        return;
      }
      // the warlock's kit, played properly: hex on cooldown, FULL-duration channels,
      // blink for spacing, portal to escape crowds and to flee his own succubus bombs
      const demons = combat.demons.filter(d => d.hp > 0);
      const archBomb = demons.find(d => d.arch);                  // ticking succubus
      if (P.devilT > 0) {
        const succubus = demons.find(d => d.type === 'succubus' && !d.arch);
        if (archBomb && dist(P, archBomb) < 200 && P.parryCD <= 0) { combat.doParry(); return; } // PORTAL away from the blast
        if (archBomb && dist(P, archBomb) < 190 && P.rollCD <= 0) { combat.doRoll(); return; }   // or blink clear
        if (succubus && dist(P, succubus) < 130) { combat.doHeavy(); return; }                   // BITE — ascend her
        combat.doSlash();                                                                        // CLAW everything else
        return;
      }
      moveTo(foe.x, foe.y);
      if (archBomb && dist(P, archBomb) < 190 && P.parryCD <= 0) combat.doParry();               // never stand near the bomb
      if (P.hexCD <= 0 && (nearest === foe || dFoe < 70)) combat.doSlash();                      // hex whenever available
      const crowd = foes.filter(e => dist(P, e) < 120).length;
      if (crowd >= 2 && P.parryCD <= 0) combat.doParry();                                        // portal out of a surround
      else if (dist(P, nearest) < 70 && P.rollCD <= 0 && !P.channel) combat.doRoll();            // blink for spacing
      if (!P.channel && demons.length < 2 && P.heavyCD <= 0) {
        if (dist(P, nearest) < 230 && P.rollCD <= 0) combat.doRoll();                            // clear room, then channel
        combat.doHeavy();
      }
      // hold the channel its FULL duration: fiend 3s, +dragon 4s, +coven/devil 6s
      if (P.channel) { const want = combat.lvl() >= 5 ? 6.2 : (combat.lvl() >= 3 ? 4.2 : 3.2);
        if (P.channel.t >= want) combat.heavyRelease(); }
    } else if (P.char === 'druid') {
      // full form rotation: vines+glaive in human, shift to BEAR for the brawl,
      // WOLF for the heal and the pack, back to human when the wild needs to gather
      const tooClose = dFoe < 90, tooFar = dFoe > 165;
      if (tooClose && P.form === 'human') moveTo(P.x + (P.x - foe.x), P.y + (P.y - foe.y));
      else if (tooFar || P.form !== 'human') moveTo(foe.x, foe.y);
      if (P.form === 'human') {
        combat.doSlash();                                          // glaive patterns
        if (foes.some(e => dist(P, e) < 160) && P.cdVines <= 0) combat.doHeavy(); // vines + hop
        if (combat.lvl() >= 3 && P.humanCD <= 0 && P.formCD <= 0 && dFoe < 170) combat.doParry(); // -> BEAR
      } else if (P.form === 'bear') {
        if (foes.filter(e => dist(P, e) < 145).length >= 2 && P.cdRoar <= 0) combat.doHeavy();    // ROAR the crowd
        if (dFoe < 95) combat.doSlash();                                                          // CLAW
        if (combat.lvl() >= 6 && P.formCD <= 0 && (P.hp / combat.maxHP() < 0.75 || P.cdRoar > 1.5)) combat.doParry(); // -> WOLF
      } else { // wolf
        if (P.cdHowl <= 0) combat.doHeavy();                       // HOWL heal + pack
        combat.doSlash();                                          // BITE lunges
      }
      if (foe.attacking && foe.tele < 0.15 && dFoe < 100 && P.rollCD <= 0 && P.form === 'human') combat.doRoll();
    } else if (P.char === 'seraph') {
      // spear pressure at lance range, the ray when foes line up, wings out of a surround
      if (dFoe > 100) moveTo(foe.x, foe.y);
      else moveTo(P.x + (P.x - foe.x), P.y + (P.y - foe.y)); // keep the lance's reach
      combat.doSlash();
      if (P.heavyCD <= 0 && P.heavyWind <= 0 && dFoe < 600) combat.doHeavy(); // the ray is on a 1s clock — keep it singing
      const crowd = foes.filter(e => dist(P, e) < 110).length;
      if (P.parryCD <= 0 && (crowd >= 2 || (P.hp / combat.maxHP() < 0.45 && dFoe < 100))) combat.doParry(); // ASCEND
      if (foe.attacking && foe.tele < 0.15 && dFoe < 100 && P.rollCD <= 0 && !(P.ascendT > 0)) combat.doRoll();
    } else { // ronin
      moveTo(foe.x - Math.cos(foe.face) * 55, foe.y - Math.sin(foe.face) * 55);
      if (foe.attacking && foe.tele > 0 && dFoe < 140) combat.doParry();
      if (dFoe < 95) { if (P.heavyCD <= 0 && Math.random() < 0.25) combat.doHeavy(); else combat.doSlash(); }
      if (P.hp / combat.maxHP() < 0.3 && dFoe < 90 && P.rollCD <= 0) combat.doRoll();
    }
  },
};
if (typeof window !== 'undefined') window.Autopilot = Autopilot;
