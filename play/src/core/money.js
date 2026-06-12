// Currency — canon: 1 gold = 10 silver = 100 copper. 1 gold ≈ $5,000 real-world.
// Stored internally as COPPER. Economy is deliberately light: the only money sink
// is paying the innkeeper for main-quest information.

const Money = {
  GOLD: 100, SILVER: 10, COPPER: 1,
  PIT_PAYOUT_PER_KILL: 10, // 1 silver per kill (Hiro-approved)

  fmt(copper) {
    copper = Math.max(0, Math.round(copper));
    const g = Math.floor(copper / 100), s = Math.floor((copper % 100) / 10), c = copper % 10;
    const parts = [];
    if (g) parts.push(g + 'g');
    if (s) parts.push(s + 's');
    if (c || !parts.length) parts.push(c + 'c');
    return parts.join(' ');
  },

  canAfford: (copper, cost) => copper >= cost,
};

if (typeof module !== 'undefined' && module.exports) module.exports = { Money };
else window.Money = Money;
