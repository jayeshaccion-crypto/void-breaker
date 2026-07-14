class BulletPool {
  constructor(poolSize = 100) {
    this.playerBullets = [];
    this.enemyBullets = [];
    for (let i = 0; i < poolSize; i++) {
      this.playerBullets.push(this.createBullet('player'));
      this.enemyBullets.push(this.createBullet('enemy'));
    }
  }

  createBullet(owner) {
    return { x: 0, y: 0, vx: 0, vy: 0, radius: 3, active: false, owner, life: 0 };
  }

  firePlayer(x, y, angle, speed = 500) {
    const b = this.playerBullets.find(b => b && !b.active);
    if (!b) return;
    b.x = x;
    b.y = y;
    b.vx = Math.cos(angle) * speed;
    b.vy = Math.sin(angle) * speed;
    b.active = true;
    b.life = 1.5;
  }

  fireEnemy(x, y, vx, vy, speed = 300) {
    const b = this.enemyBullets.find(b => b && !b.active);
    if (!b) return;
    const len = Math.sqrt(vx * vx + vy * vy) || 1;
    b.x = x;
    b.y = y;
    b.vx = (vx / len) * speed;
    b.vy = (vy / len) * speed;
    b.active = true;
    b.life = 3;
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
