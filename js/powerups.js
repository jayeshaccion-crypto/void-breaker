const POWERUP_TYPES = ['spread', 'rapid', 'shield', 'health'];
const POWERUP_RADIUS = 10;
const DURATION = 8;
const BASE_DROP_RATE = 0.2;
const BONUS_DROP_RATE = 0.3;

function getDropRate(unlocks) {
  return unlocks && unlocks.bonus_drop_rate ? BONUS_DROP_RATE : BASE_DROP_RATE;
}

class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.type = POWERUP_TYPES[Math.floor(runRandom() * POWERUP_TYPES.length)];
    this.radius = POWERUP_RADIUS;
    this.active = true;
    this.life = 12;
    this.bobTimer = 0;
  }

  update(dt) {
    this.life -= dt;
    this.bobTimer += dt;
    if (this.life <= 0) this.active = false;
  }

  apply(player) {
    if (!this.active) return;
    this.active = false;
    switch (this.type) {
      case 'spread':
        player.powerups.spread = DURATION;
        break;
      case 'rapid':
        player.powerups.rapid = DURATION;
        break;
      case 'shield':
        player.powerups.shield = true;
        break;
      case 'health':
        player.health = Math.min(player.health + 1, player.maxHealth);
        break;
    }
  }

  updatePowerups(player, dt) {
    if (player.powerups.spread > 0) {
      player.powerups.spread -= dt;
      if (player.powerups.spread <= 0) player.powerups.spread = 0;
    }
    if (player.powerups.rapid > 0) {
      player.powerups.rapid = Math.max(0, player.powerups.rapid - dt);
    }
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y + Math.sin(this.bobTimer * 3) * 3);

    const colors = { spread: '#ff00ff', rapid: '#ffff00', shield: '#00ffff', health: '#00ff00' };
    ctx.fillStyle = colors[this.type];
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labels = { spread: 'S', rapid: 'R', shield: 'D', health: '+' };
    ctx.fillText(labels[this.type], 0, 0);

    ctx.restore();
  }
}
