const UPGRADE_CARDS = [
  {
    id: 'overclock', name: 'Overclock', tier: 1, unique: false,
    desc: 'Fire rate +15%', apply: (p) => { p.upgradeData.fireRateMult *= 0.87; },
  },
  {
    id: 'armor_plating', name: 'Armor Plating', tier: 1, unique: false,
    desc: 'Max HP +1', apply: (p) => { p.maxHealth++; p.health = Math.min(p.health + 1, p.maxHealth); },
  },
  {
    id: 'quick_dash', name: 'Quick Dash', tier: 1, unique: false,
    desc: 'Dash cooldown -0.3s', apply: (p) => { p.upgradeData.dashCdReduction += 0.3; },
  },
  {
    id: 'scattershot', name: 'Scattershot', tier: 1, unique: false,
    desc: 'Bullets split into 2 on impact', apply: (p) => { p.upgradeData.scattershot = true; },
  },
  {
    id: 'magnet', name: 'Magnet', tier: 1, unique: false,
    desc: 'Pickup radius ×2', apply: (p) => { p.upgradeData.pickupRange *= 2; },
  },
  {
    id: 'chain_lightning', name: 'Chain Lightning', tier: 2, unique: false,
    desc: 'Every 5th bullet arcs to a nearby enemy', apply: (p) => { p.upgradeData.chainLightning = true; },
  },
  {
    id: 'afterburn', name: 'Afterburn', tier: 2, unique: false,
    desc: 'Bullets leave a fire trail', apply: (p) => { p.upgradeData.afterburn = true; },
  },
  {
    id: 'ghost_dash', name: 'Ghost Dash', tier: 2, unique: false,
    desc: 'Dash passes through + damages enemies', apply: (p) => { p.upgradeData.ghostDash = true; },
  },
  {
    id: 'bouncer', name: 'Bouncer', tier: 2, unique: false,
    desc: 'Bullets ricochet off walls once', apply: (p) => { p.upgradeData.bouncer = true; },
  },
  {
    id: 'black_hole', name: 'Black Hole', tier: 3, unique: true,
    desc: 'Q launches singularity, 30s cooldown', apply: (p) => { p.upgradeData.blackHole = true; },
  },
  {
    id: 'overload', name: 'Overload', tier: 3, unique: true,
    desc: 'Every 10th kill: screen-wide damage pulse', apply: (p) => { p.upgradeData.overload = true; },
  },
  {
    id: 'twin_ship', name: 'Twin Ship', tier: 3, unique: true,
    desc: 'Drone mirrors your movement and fires', apply: (p) => { p.upgradeData.twinShip = true; },
  },
];

class UpgradeManager {
  constructor() {
    this.pool = [];
    this.offered = [];
    this.lastPick = null;
    this.pickCount = 0;
    this.uniquePicked = {};
    this.reset();
  }

  reset() {
    this.pool = UPGRADE_CARDS.map(c => ({ ...c }));
    this.offered = [];
    this.lastPick = null;
    this.pickCount = 0;
    this.uniquePicked = {};
  }

  getAvailableTiers(wave) {
    if (wave <= 4) return [1];
    if (wave <= 9) return [1, 2];
    return [1, 2, 3];
  }

  tierWeights(wave) {
    if (wave <= 4) return { 1: 1 };
    if (wave <= 9) return { 1: 0.6, 2: 0.4 };
    return { 1: 0.3, 2: 0.4, 3: 0.3 };
  }

  selectCards(wave) {
    const tiers = this.getAvailableTiers(wave);
    const weights = this.tierWeights(wave);
    const eligible = this.pool.filter(c =>
      tiers.includes(c.tier) && !this.offered.some(o => o.id === c.id)
    );
    if (eligible.length === 0) return [];

    const picked = [];
    const usedIds = new Set();
    for (let i = 0; i < 3; i++) {
      let attempts = 0;
      let card = null;
      while (!card && attempts < 50) {
        attempts++;
        const r = Math.random();
        let cum = 0, chosenTier = tiers[0];
        for (const t of tiers) { cum += weights[t]; if (r < cum) { chosenTier = t; break; } }
        const pool = eligible.filter(c => c.tier === chosenTier && !usedIds.has(c.id));
        if (pool.length > 0) card = pool[Math.floor(Math.random() * pool.length)];
      }
      if (!card) break;
      picked.push(card);
      usedIds.add(card.id);
    }

    this.offered = picked;
    return picked;
  }

  pick(index) {
    const card = this.offered[index];
    if (!card) return null;
    if (card.unique) this.pool = this.pool.filter(c => c.id !== card.id);
    this.offered = [];
    this.pickCount++;
    if (card.unique) this.uniquePicked[card.id] = true;
    this.lastPick = card;
    return card;
  }

  autoPick() {
    const idx = Math.floor(Math.random() * this.offered.length);
    return this.pick(idx);
  }
}

const upgradeManager = new UpgradeManager();
