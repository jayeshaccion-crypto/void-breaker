class ParticleSystem {
  constructor(capacity = 600) {
    this.capacity = capacity;
    this.particles = [];
    for (let i = 0; i < capacity; i++) {
      this.particles.push({
        active: false, x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 1, radius: 1, color: '#fff',
      });
    }
    this.cursor = 0;
    this.screenShake = 0;
  }

  spawn(x, y, vx, vy, life, radius, color) {
    for (let i = 0; i < this.capacity; i++) {
      const index = (this.cursor + i) % this.capacity;
      const p = this.particles[index];
      if (p.active) continue;
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = vx;
      p.vy = vy;
      p.life = life;
      p.maxLife = life;
      p.radius = radius;
      p.color = color;
      this.cursor = (index + 1) % this.capacity;
      return;
    }
  }

  burst(x, y, color, count = 15, speed = 200) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.5 + 0.5) * speed;
      const life = Math.random() * 0.5 + 0.3;
      this.spawn(
        x, y,
        Math.cos(angle) * spd, Math.sin(angle) * spd,
        life, Math.random() * 3 + 1, color
      );
    }
  }

  bigBurst(x, y, color, count = 40, speed = 350) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.5 + 0.5) * speed;
      const life = Math.random() * 0.8 + 0.5;
      this.spawn(
        x, y,
        Math.cos(angle) * spd, Math.sin(angle) * spd,
        life, Math.random() * 4 + 2,
        Math.random() < 0.5 ? color : '#ffffff'
      );
    }
    this.screenShake = 0.4;
  }

  hitEffect(x, y) {
    this.burst(x, y, '#ffffff', 10, 150);
    this.screenShake = 0.15;
  }

  reset() {
    for (const p of this.particles) p.active = false;
    this.cursor = 0;
    this.screenShake = 0;
  }

  update(dt) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life -= dt;
      if (p.life <= 0) p.active = false;
    }
    if (this.screenShake > 0) this.screenShake -= dt;
  }

  draw(ctx) {
    for (const p of this.particles) {
      if (!p.active) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.radius / 2, p.y - p.radius / 2, p.radius, p.radius);
    }
    ctx.globalAlpha = 1;
  }
}
