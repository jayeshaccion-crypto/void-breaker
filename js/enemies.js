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

const BOSS_RADIUS = 35;

class Boss {
  constructor(wave, canvasWidth, canvasHeight) {
    this.type = 'boss';
    this.x = canvasWidth / 2;
    this.y = -60;
    this.targetY = canvasHeight * 0.3;
    this.radius = BOSS_RADIUS;
    this.health = 10 + wave * 2;
    this.maxHealth = this.health;
    this.color = '#cc00ff';
    this.points = 2000 + wave * 500;
    this.active = true;
    this.isBoss = true;
    this.hitTimer = 0;
    this.phase = 1;
    this.attackTimer = 2.5;
    this.attackIndex = 0;
    this.spiralAngle = 0;
    this.summonCount = 0;
  }

  update(dt, playerX, playerY) {
    if (!this.active) return;
    if (this.hitTimer > 0) this.hitTimer -= dt;

    if (this.y < this.targetY) {
      this.y += 120 * dt;
      return;
    }

    this.phase = this.health <= this.maxHealth * 0.5 ? 2 : 1;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const driftSpeed = 60 + (this.phase === 2 ? 30 : 0);
    this.x += Math.sin(Date.now() / 2000) * driftSpeed * dt;
    this.y += Math.cos(Date.now() / 2500) * driftSpeed * dt * 0.5;
    this.x = Math.max(this.radius, Math.min(800 - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(600 - this.radius, this.y));

    const atkInterval = this.phase === 2 ? 1.8 : 2.5;
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.attackTimer = atkInterval;
      this.attackIndex = (this.attackIndex + 1) % (this.phase === 2 ? 4 : 3);
      return this.pickAttack(playerX, playerY);
    }
    return null;
  }

  pickAttack(playerX, playerY) {
    const attacks = [];
    attacks.push(() => this.spiralBurst());
    attacks.push(() => this.aimedVolley(playerX, playerY));
    attacks.push(() => this.summonMinions());
    if (this.phase === 2) attacks.push(() => this.crossBlast(playerX, playerY));
    return attacks[this.attackIndex % attacks.length]();
  }

  spiralBurst() {
    const count = this.phase === 2 ? 12 : 8;
    const result = [];
    for (let i = 0; i < count; i++) {
      const a = this.spiralAngle + (i / count) * Math.PI * 2;
      result.push({ bx: this.x, by: this.y, bvx: Math.cos(a), bvy: Math.sin(a), bspeed: 200 });
    }
    this.spiralAngle += 0.3;
    return result;
  }

  aimedVolley(playerX, playerY) {
    const count = this.phase === 2 ? 5 : 3;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const angle = Math.atan2(dy, dx);
    const spread = 0.15;
    const result = [];
    for (let i = 0; i < count; i++) {
      const a = angle + (i - (count - 1) / 2) * spread;
      result.push({ bx: this.x, by: this.y, bvx: Math.cos(a), bvy: Math.sin(a), bspeed: 350 });
    }
    return result;
  }

  summonMinions() {
    this.summonCount++;
    const result = [];
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 50;
      result.push({
        summon: true,
        type: 'swarmer',
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
      });
    }
    return result;
  }

  crossBlast(playerX, playerY) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const angle = Math.atan2(dy, dx);
    const result = [];
    for (let i = 0; i < 4; i++) {
      const a = angle + (i / 4) * Math.PI * 2;
      result.push({ bx: this.x, by: this.y, bvx: Math.cos(a), bvy: Math.sin(a), bspeed: 250 });
    }
    return result;
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

    const pulse = Math.sin(Date.now() / 300) * 0.15 + 0.85;
    ctx.globalAlpha = pulse;

    const useWhite = this.hitTimer > 0;
    const baseColor = this.phase === 2 ? '#ff2266' : '#cc00ff';

    ctx.fillStyle = useWhite ? '#ffffff' : baseColor;
    ctx.strokeStyle = useWhite ? '#ffffff' : baseColor;
    ctx.lineWidth = 3;

    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const r = this.radius;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 1;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('B', 0, 0);

    const barW = this.radius * 2.4, barH = 4;
    ctx.fillStyle = '#333';
    ctx.fillRect(-barW / 2, -this.radius - 12, barW, barH);
    ctx.fillStyle = this.phase === 2 ? '#ff2266' : '#cc00ff';
    ctx.fillRect(-barW / 2, -this.radius - 12, barW * (this.health / this.maxHealth), barH);

    ctx.restore();
  }
}

function spawnEnemy(type, canvasWidth, canvasHeight, playerX, playerY) {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const margin = 40;
  if (side === 0) { x = -margin; y = Math.random() * canvasHeight; }
  else if (side === 1) { x = canvasWidth + margin; y = Math.random() * canvasHeight; }
  else if (side === 2) { x = Math.random() * canvasWidth; y = -margin; }
  else { x = Math.random() * canvasWidth; y = canvasHeight + margin; }
  return new Enemy(type, x, y, playerX, playerY);
}

function spawnBoss(wave, canvasWidth, canvasHeight) {
  return new Boss(wave, canvasWidth, canvasHeight);
}
