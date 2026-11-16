const MAX_PROJECTILES = 200;

class BulletPool {
  constructor(poolSize = 200) {
    this.playerBullets = [];
    this.enemyBullets = [];
    for (let i = 0; i < poolSize; i++) {
      this.playerBullets.push(this.createBullet('player'));
      this.enemyBullets.push(this.createBullet('enemy'));
    }
  }

  createBullet(owner) {
    return {
      x: 0, y: 0, vx: 0, vy: 0, radius: 3, active: false, owner, life: 0,
      damage: 1, weaponId: 'pulse_cannon', source: 'pulse_cannon',
      ricochets: 0, splitDepth: 0, pierce: 0,
    };
  }

  activeCount() {
    let count = 0;
    for (const b of this.playerBullets) if (b.active) count++;
    for (const b of this.enemyBullets) if (b.active) count++;
    return count;
  }

  firePlayer(x, y, angle, speed = 500, damage = 1, weaponId = 'pulse_cannon', source = 'pulse_cannon', splitDepth = 0, ricochets = 0, pierce = 0) {
    if (this.activeCount() >= MAX_PROJECTILES) return null;
    const b = this.playerBullets.find(b => b && !b.active);
    if (!b) return null;
    b.x = x;
    b.y = y;
    b.vx = Math.cos(angle) * speed;
    b.vy = Math.sin(angle) * speed;
    b.radius = 3;
    b.active = true;
    b.life = 1.5;
    b.damage = damage;
    b.weaponId = weaponId;
    b.source = source;
    b.ricochets = ricochets;
    b.splitDepth = splitDepth;
    b.pierce = pierce;
    return b;
  }

  fireEnemy(x, y, vx, vy, speed = 300, damage = 1) {
    if (this.activeCount() >= MAX_PROJECTILES) return null;
    const b = this.enemyBullets.find(b => b && !b.active);
    if (!b) return null;
    const len = Math.sqrt(vx * vx + vy * vy) || 1;
    b.x = x;
    b.y = y;
    b.vx = (vx / len) * speed;
    b.vy = (vy / len) * speed;
    b.radius = 3;
    b.active = true;
    b.life = 3;
    b.damage = damage;
    b.weaponId = 'enemy';
    b.source = 'enemy';
    b.ricochets = 0;
    b.splitDepth = 0;
    b.pierce = 0;
    return b;
  }

  update(dt) {
    for (const arr of [this.playerBullets, this.enemyBullets]) {
      for (const b of arr) {
        if (!b || !b.active) continue;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        if (b.life <= 0 || b.x < -50 || b.x > canvas.width + 50 || b.y < -50 || b.y > canvas.height + 50) {
          b.active = false;
        }
      }
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#fff';
    for (const b of this.playerBullets) {
      if (!b || !b.active) continue;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ff4444';
    for (const b of this.enemyBullets) {
      if (!b || !b.active) continue;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
