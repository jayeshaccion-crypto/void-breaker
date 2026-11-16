const ENEMY_TYPES = {
  swarmer: {
    radius: 10, speed: 200, health: 1, color: '#ffaa00', points: 100,
  },
  tank: {
    radius: 18, speed: 80, health: 3, color: '#ff6600', points: 200, fireRate: 2.0,
  },
  sniper: {
    radius: 14, speed: 40, health: 2, color: '#ff3366', points: 300, chargeTime: 0.8,
  },
};

class Enemy {
  constructor(type, x, y, playerX, playerY) {
    const config = ENEMY_TYPES[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = config.radius;
    this.speed = config.speed;
    this.health = config.health;
    this.maxHealth = config.health;
    this.color = config.color;
    this.points = config.points;
    this.active = true;
    this.hitTimer = 0;
    this.isBoss = false;

    const dx = playerX - x;
    const dy = playerY - y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = dx / len;
    this.vy = dy / len;

    if (type === 'tank') this.fireTimer = config.fireRate;
    if (type === 'sniper') {
      this.chargeTime = config.chargeTime;
      this.chargeTimer = 0;
      this.charging = false;
      this.hasFired = false;
    }
  }

  update(dt, playerX, playerY) {
    if (!this.active) return;
    if (this.hitTimer > 0) this.hitTimer -= dt;

    if (this.type === 'swarmer') {
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      this.x += (dx / len) * this.speed * dt;
      this.y += (dy / len) * this.speed * dt;
    } else if (this.type === 'tank') {
      this.x += this.vx * this.speed * dt;
      this.y += this.vy * this.speed * dt;
      this.fireTimer -= dt;
    } else if (this.type === 'sniper') {
      if (!this.hasFired && !this.charging) {
        this.chargeTimer = this.chargeTime;
        this.charging = true;
      }
      if (this.charging) {
        this.chargeTimer -= dt;
        if (this.chargeTimer <= 0) { this.charging = false; this.hasFired = true; }
      }
    }
  }

  shouldFire() {
    if (this.type === 'tank' && this.fireTimer <= 0) {
      this.fireTimer = 2.0; return true;
    }
    if (this.type === 'sniper' && !this.charging && !this.hasFired) return true;
    return false;
  }

  takeDamage(amount = 1) {
    this.health -= amount;
    this.hitTimer = 0.08;
    if (this.health <= 0) { this.active = false; return true; }
    return false;
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    const useWhite = this.hitTimer > 0;
    ctx.fillStyle = useWhite ? '#ffffff' : this.color;
    ctx.strokeStyle = useWhite ? '#ffffff' : this.color;
    ctx.lineWidth = 2;

    if (this.type === 'swarmer') {
      ctx.beginPath();
      ctx.moveTo(this.radius, 0);
      ctx.lineTo(-this.radius * 0.5, -this.radius * 0.6);
      ctx.lineTo(-this.radius * 0.5, this.radius * 0.6);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'tank') {
      ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
    } else if (this.type === 'sniper') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const r = this.radius + (this.charging ? (1 - this.chargeTimer / this.chargeTime) * 6 : 0);
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }

    if (this.health < this.maxHealth && !useWhite) {
      const barW = this.radius * 2, barH = 3;
      ctx.fillStyle = '#333';
      ctx.fillRect(-barW / 2, -this.radius - 8, barW, barH);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(-barW / 2, -this.radius - 8, barW * (this.health / this.maxHealth), barH);
    }

    ctx.restore();
  }
}

function spawnEnemy(type, canvasWidth, canvasHeight, playerX, playerY) {
  const side = Math.floor(runRandom() * 4);
  let x, y;
  const margin = 40;
  if (side === 0) { x = -margin; y = runRandom() * canvasHeight; }
  else if (side === 1) { x = canvasWidth + margin; y = runRandom() * canvasHeight; }
  else if (side === 2) { x = runRandom() * canvasWidth; y = -margin; }
  else { x = runRandom() * canvasWidth; y = canvasHeight + margin; }
  return new Enemy(type, x, y, playerX, playerY);
}
