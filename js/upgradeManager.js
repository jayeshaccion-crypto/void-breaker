const UPGRADE_CARDS = [
  {
    id: 'overclock', name: 'Overclock', tier: 1, unique: false,
    desc: 'Fire rate x1.15 per stack',
    stackRule: 'multiplicative',
    effect: { fireRateMultiplier: 1.15 },
  },
  {
    id: 'armor_plating', name: 'Armor Plating', tier: 1, unique: false,
    desc: 'Max HP +1 per stack',
    stackRule: 'additive',
    effect: { maxHealth: 1 },
  },
  {
    id: 'quick_dash', name: 'Quick Dash', tier: 1, unique: false,
    desc: 'Dash cooldown -0.3s (floor 0.1s)',
    stackRule: 'additive',
    effect: { dashCooldownReduction: 0.3, dashCooldownFloor: 0.1 },
  },
  {
    id: 'scattershot', name: 'Scattershot', tier: 1, unique: false,
    desc: '2 split projectiles per stack',
    stackRule: 'split-count',
    effect: { scattershotStacks: 1, splitProjectilesPerStack: 2 },
  },
  {
    id: 'magnet', name: 'Magnet', tier: 1, unique: false,
    desc: 'Pickup radius x2 per stack',
    stackRule: 'multiplicative',
    effect: { pickupRangeMultiplier: 2 },
  },
  {
    id: 'chain_lightning', name: 'Chain Lightning', tier: 2, unique: false,
    desc: 'Every 5th hit arcs to +1 target per stack',
    stackRule: 'target-count',
    effect: { chainLightningStacks: 1, triggerEvery: 5 },
  },
  {
    id: 'afterburn', name: 'Afterburn', tier: 2, unique: false,
    desc: 'Trail damage +1 per stack',
    stackRule: 'additive',
    effect: { afterburnStacks: 1 },
  },
  {
    id: 'ghost_dash', name: 'Ghost Dash', tier: 2, unique: false,
    desc: 'Dash-contact damage +1 per stack',
    stackRule: 'additive',
    effect: { ghostDashStacks: 1 },
  },
  {
    id: 'bouncer', name: 'Bouncer', tier: 2, unique: false,
    desc: 'Wall ricochet +1 per stack',
    stackRule: 'additive',
    effect: { bouncerStacks: 1 },
  },
  {
    id: 'black_hole', name: 'Black Hole', tier: 3, unique: true,
    desc: 'Q launches singularity, 30s cooldown',
    stackRule: 'additive',
    effect: { unlock: 'blackHole' },
  },
  {
    id: 'overload', name: 'Overload', tier: 3, unique: true,
    desc: 'Every 10th kill: 3 damage pulse',
    stackRule: 'additive',
    effect: { unlock: 'overload', killInterval: 10, damage: 3 },
  },
  {
    id: 'twin_ship', name: 'Twin Ship', tier: 3, unique: true,
    desc: 'Drone mirrors movement and fire',
    stackRule: 'additive',
    effect: { unlock: 'twinShip', offset: 40 },
  },
];

function applyCardEffect(card, player) {
  const data = player.upgradeData;
  const effect = card.effect || {};

  if (effect.fireRateMultiplier) data.fireRateMult *= effect.fireRateMultiplier;
  if (effect.maxHealth) {
    player.maxHealth += effect.maxHealth;
    player.health = Math.min(player.health + effect.maxHealth, player.maxHealth);
  }
  if (effect.dashCooldownReduction) data.dashCdReduction += effect.dashCooldownReduction;
  if (effect.scattershotStacks) data.scattershotStacks += effect.scattershotStacks;
  if (effect.pickupRangeMultiplier) data.pickupRange *= effect.pickupRangeMultiplier;
  if (effect.chainLightningStacks) data.chainLightningStacks += effect.chainLightningStacks;
  if (effect.afterburnStacks) data.afterburnStacks += effect.afterburnStacks;
  if (effect.ghostDashStacks) data.ghostDashStacks += effect.ghostDashStacks;
  if (effect.bouncerStacks) data.bouncerStacks += effect.bouncerStacks;
  if (effect.unlock) data[effect.unlock] = true;
}

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
    this.pool = UPGRADE_CARDS.map(card => ({
      ...card,
      effect: { ...card.effect },
    }));
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
    const eligible = this.pool.filter(card => tiers.includes(card.tier));

    if (eligible.length <= 3) {
      this.offered = eligible.slice();
      return this.offered;
    }

    const picked = [];
    const used = new Set();

    while (picked.length < 3) {
      const remaining = eligible.filter(card => !used.has(card.id));
      if (remaining.length === 0) break;

      const activeTiers = tiers.filter(tier => remaining.some(card => card.tier === tier));
      if (activeTiers.length === 0) break;

      let totalWeight = 0;
      for (const tier of activeTiers) totalWeight += weights[tier];

      let roll = runRandom() * totalWeight;
      let chosenTier = activeTiers[activeTiers.length - 1];
      for (const tier of activeTiers) {
        roll -= weights[tier];
        if (roll <= 0) { chosenTier = tier; break; }
      }

      const tierPool = remaining.filter(card => card.tier === chosenTier);
      const card = tierPool[Math.floor(runRandom() * tierPool.length)];
      picked.push(card);
      used.add(card.id);
    }

    this.offered = picked;
    return this.offered;
  }

  pick(index) {
    const card = this.offered[index];
    if (!card) return null;
    if (card.unique) this.pool = this.pool.filter(entry => entry.id !== card.id);
    this.offered = [];
    this.pickCount++;
    if (card.unique) this.uniquePicked[card.id] = true;
    this.lastPick = card;
    return card;
  }

  autoPick() {
    if (this.offered.length === 0) return null;
    const index = Math.floor(runRandom() * this.offered.length);
    return this.pick(index);
  }

  apply(card, player) {
    if (card) applyCardEffect(card, player);
  }
}

const upgradeManager = new UpgradeManager();
