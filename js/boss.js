const BOSS_DEFS = [
  {
    id: 'dreadnought',
    name: 'The Dreadnought',
    waveRule: 'fixed',
    fixedWave: 5,
    health: 150,
    hitboxRadius: 35,
    points: 5000,
    attackPattern: 'spiral',
    phaseThreshold: 0.5,
    summons: { type: 'swarmer', count: 2, intervalSeconds: 8 },
  },
];

const DREADNOUGHT_SPIRAL_ROTATION = (300 * Math.PI) / 180;

class Dreadnought {
  constructor(canvasWidth, canvasHeight, def = BOSS_DEFS[0]) {
    this.def = def;
    this.name = def.name;
    this.x = canvasWidth / 2;
    this.y = -60;
    this.targetY = canvasHeight * 0.3;
    this.radius = def.hitboxRadius;
    this.health = def.health;
    this.maxHealth = def.health;
    this.color = '#cc00ff';
    this.points = def.points;
    this.active = true;
    this.isBoss = true;
    this.hitTimer = 0;
    this.angle = 0;
    this.phase = 1;
    this.spiralAngle = 0;
    this.fireTimer = 1.0;
    this.summonTimer = def.summons ? def.summons.intervalSeconds : 8;
    this.weakPointAngle = Math.PI / 2;
    this.weakPointRadius = 10;
    this.entering = true;
    this.healthBarSlide = 0;
    this.cw = canvasWidth;
    this.ch = canvasHeight;
  }

  update(dt, playerX, playerY) {
    if (!this.active) return null;
    if (this.hitTimer > 0) this.hitTimer -= dt;

    if (this.entering) {
      this.y += 120 * dt;
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.entering = false;
      }
      return null;
    }

    if (this.healthBarSlide < 1) this.healthBarSlide = Math.min(1, this.healthBarSlide + dt * 4);

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    this.angle = Math.atan2(dy, dx);

    this.x += Math.sin(Date.now() / 2000) * 40 * dt;
    this.y += Math.cos(Date.now() / 2500) * 20 * dt;
    this.x = Math.max(this.radius, Math.min(this.cw - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(this.ch * 0.5, this.y));

    this.phase = this.health < this.maxHealth * this.def.phaseThreshold ? 2 : 1;
    const fireInterval = this.phase === 2 ? 0.5 : 1.0;
    this.spiralAngle += DREADNOUGHT_SPIRAL_ROTATION * dt;
    this.fireTimer -= dt;

    const attacks = [];

    if (this.fireTimer <= 0) {
      this.fireTimer = fireInterval;
      const count = 8;
      for (let i = 0; i < count; i++) {
        const a = this.spiralAngle + (i / count) * Math.PI * 2;
        attacks.push({
          bx: this.x, by: this.y,
          bvx: Math.cos(a), bvy: Math.sin(a),
          bspeed: 150,
        });
      }
    }

    if (this.phase === 2 && this.def.summons) {
      this.summonTimer -= dt;
      if (this.summonTimer <= 0) {
        this.summonTimer = this.def.summons.intervalSeconds;
        for (let i = 0; i < this.def.summons.count; i++) {
          const sa = runRandom() * Math.PI * 2;
          attacks.push({
            summon: true, type: this.def.summons.type,
            x: this.x + Math.cos(sa) * 50,
            y: this.y + Math.sin(sa) * 50,
          });
        }
      }
    }

    return attacks.length > 0 ? attacks : null;
  }

  takeDamage(amount = 1, bx, by) {
    const dx = bx - this.x;
    const dy = by - this.y;
    const angleToBullet = Math.atan2(dy, dx);
    const relAngle = angleToBullet - this.angle;
    const diff = Math.abs(Math.atan2(Math.sin(relAngle), Math.cos(relAngle)) - this.weakPointAngle);
    if (diff < Math.PI / 4) amount *= 3;

    this.health -= amount;
    this.hitTimer = 0.08;
    if (this.health <= 0) { this.active = false; return true; }
    return false;
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const useWhite = this.hitTimer > 0;
    const baseColor = this.phase === 2 ? '#ff2266' : '#cc00ff';
    const fillColor = useWhite ? '#ffffff' : baseColor;

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = fillColor;
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

    const wpX = Math.cos(this.weakPointAngle) * this.radius * 0.7;
    const wpY = Math.sin(this.weakPointAngle) * this.radius * 0.7;
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(wpX, wpY, this.weakPointRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('D', 0, 0);

    ctx.restore();
  }
}

function getBossDefForWave(wave) {
  const fixed = BOSS_DEFS.find(def => def.waveRule === 'fixed' && def.fixedWave === wave);
  return fixed || BOSS_DEFS[0];
}

function spawnBoss(wave, cw, ch) {
  const def = getBossDefForWave(wave);
  return new Dreadnought(cw, ch, def);
}
