const POWERUP_TYPES = ['spread', 'rapid', 'shield', 'health'];
const POWERUP_RADIUS = 10;
const DURATION = 8;

class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
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
        player.fireRate = 0.07;
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
      player.powerups.rapid -= dt;
      if (player.powerups.rapid <= 0) {
        player.powerups.rapid = 0;
        player.fireRate = 0.15;
      }
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
