/* combat.js — pure turn-engine state. No Phaser rendering here: FightScene animates it.
   Parameterized by an enemy def from Spire.ENEMIES. Statuses: burn (dmg at start of that
   unit's turn, then -1), weak (deal -25%), str (+n per hit), block (clears at own turn),
   thirst (2026-08-06 life-steal package: every player HIT that lands heals `thirst` HP —
   per hit, so multi-hit cards drink deepest; lasts the fight). heal() reports the amount
   ACTUALLY restored and tracks player healedThisTurn, so overheal cards (Scarlet Ward,
   Crimson Feast) and healed-this-turn payoffs (Hemorrhage) have real numbers to read.
   2026-08-08 SAMURAI package: bleed (enemy DoT at its turn start, PIERCES block, -1/turn),
   focus (banked action points: +focus energy next player turn, then cleared — the parry
   school's reward), riposte (armed by counter cards; if the enemy's attack meets her
   block, she strikes back for `riposte` once, then it clears), and card play-CONDITIONS
   (card.cond(C) gates crit cards: first turn, odd turns, bleeding enemy). */
window.Spire = window.Spire || {};

Spire.Combat = class {
  constructor(deckIds, enemyDef, playerHp, playerMaxHp) {
    this.enemyDef = enemyDef;
    this.player = { name: "Vessia", hp: playerHp || 70, maxHp: playerMaxHp || 70,
                    block: 0, energy: 3, maxEnergy: 3, statuses: {} };
    this.enemy  = { name: enemyDef.name, hp: enemyDef.hp, maxHp: enemyDef.hp, block: 0, statuses: {} };
    this.draw = Phaser.Utils.Array.Shuffle(deckIds.slice());
    this.hand = [];
    this.discard = [];
    this.turn = 0;
    this.enemyIx = 0;
    this.over = false;
    this.healedThisTurn = 0;
  }
  intent() {
    const move = this.enemyDef.script[this.enemyIx % this.enemyDef.script.length];
    const str = this.enemy.statuses.str || 0;
    const weak = this.enemy.statuses.weak ? 0.75 : 1;
    const it = { ...move };
    if (move.dmg !== undefined) it.dmg = Math.max(0, Math.floor((move.dmg + str) * weak));
    return it;
  }
  startPlayerTurn() {
    this.turn++;
    this.player.block = 0;
    /* unspent energy ROLLS OVER (Hiro, 2026-08-05): banked points stack on the refill,
       so a patient turn buys a bigger one later. carried is reported for the HUD float. */
    const carried = this.turn > 1 ? Math.max(0, this.player.energy) : 0;
    this.player.energy = this.player.maxEnergy + carried;
    this.healedThisTurn = 0;
    /* FOCUS (samurai): parries banked action points for this turn */
    const focusGain = this.player.statuses.focus || 0;
    if (focusGain > 0) { this.player.energy += focusGain; this.player.statuses.focus = 0; }
    this.player.statuses.riposte = 0;          // an unspent counter stance relaxes
    const burn = this.player.statuses.burn || 0;
    let burnDmg = 0;
    if (burn > 0) { burnDmg = this.hurt(this.player, burn, true); this.player.statuses.burn--; }
    const drawn = this.drawCards(5);
    return { drawn, burnDmg, carried, focusGain };
  }
  drawCards(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      if (!this.draw.length) { this.draw = Phaser.Utils.Array.Shuffle(this.discard); this.discard = []; }
      if (!this.draw.length) break;
      const c = this.draw.pop(); this.hand.push(c); out.push(c);
    }
    return out;
  }
  canPlay(card) {
    if (this.over || this.player.energy < card.cost) return false;
    if (card.cond && !card.cond(this)) return false;   // crit-card conditions (samurai)
    return true;
  }
  spend(card) {
    this.player.energy -= card.cost;
    const ix = this.hand.indexOf(card.id);
    if (ix >= 0) this.hand.splice(ix, 1);
    this.discard.push(card.id);
  }
  playerHits(base) {
    const str = this.player.statuses.str || 0;
    const weak = this.player.statuses.weak ? 0.75 : 1;
    return Math.max(0, Math.floor((base + str) * weak));
  }
  /* summon/transformation attacks: same Str/Weak math as playerHits, plus whatever
     permanent "summonpower" she's bought this fight (Blood Pact, Dark Covenant, ...). */
  summonHits(base) {
    const str = this.player.statuses.str || 0;
    const sp = this.player.statuses.summonpower || 0;
    const weak = this.player.statuses.weak ? 0.75 : 1;
    return Math.max(0, Math.floor((base + str + sp) * weak));
  }
  hurt(unit, amount, pierce) {
    let dmg = amount;
    if (!pierce) {
      const soak = Math.min(unit.block, dmg);
      unit.block -= soak; dmg -= soak;
    }
    unit.hp = Math.max(0, unit.hp - dmg);
    if (unit.hp === 0) this.over = true;
    return dmg;
  }
  heal(unit, n) {
    const got = Math.min(unit.maxHp - unit.hp, Math.max(0, n));
    unit.hp += got;
    if (unit === this.player) this.healedThisTurn += got;
    return got;                                   // actual restored (overheal excess = n - got)
  }
  addStatus(unit, k, n) { unit.statuses[k] = (unit.statuses[k] || 0) + n; }
  startEnemyTurn() {
    this.enemy.block = 0;
    const burn = this.enemy.statuses.burn || 0;
    let burnDmg = 0;
    if (burn > 0) { burnDmg = this.hurt(this.enemy, burn, true); this.enemy.statuses.burn--; }
    /* BLEED (samurai): open veins don't care about guard — pierces, then -1 */
    const bleed = this.enemy.statuses.bleed || 0;
    let bleedDmg = 0;
    if (bleed > 0) { bleedDmg = this.hurt(this.enemy, bleed, true); this.enemy.statuses.bleed--; }
    return { burnDmg, bleedDmg };
  }
  resolveEnemyMove() {
    const it = this.intent();
    this.enemyIx++;
    let out;
    if (it.kind === "buff")        { this.addStatus(this.enemy, "str", it.str); out = { ...it }; }
    else if (it.kind === "block")  { this.enemy.block += it.block; out = { ...it }; }
    else if (it.kind === "special"){ out = { ...it }; }               // scene choreographs + applies
    else {
      const hits = [];
      const guarded = this.player.block > 0;               // she met the blow with steel
      for (let i = 0; i < it.hits; i++) {
        if (this.player.hp <= 0) break;
        hits.push(this.hurt(this.player, it.dmg));
      }
      if (this.player.hp === 0) this.over = true;
      out = { ...it, dealt: hits };
      /* RIPOSTE (samurai): a counter stance answers a guarded attack, once */
      const rip = this.player.statuses.riposte || 0;
      if (rip > 0 && guarded && this.player.hp > 0) {
        out.riposte = this.hurt(this.enemy, rip);
        this.player.statuses.riposte = 0;
        if (this.enemy.hp === 0) this.over = true;
      }
    }
    if (this.enemy.statuses.weak) this.enemy.statuses.weak--;
    return out;
  }
  endPlayerTurn() {
    this.discard.push(...this.hand);
    this.hand = [];
    if (this.player.statuses.weak) this.player.statuses.weak--;
  }
};
