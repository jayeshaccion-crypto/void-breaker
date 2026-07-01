class ParticleSystem {
  constructor() {
    this.particles = [];
    this.screenShake = 0;
  }

  burst(x, y, color, count = 15, speed = 200) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.5 + 0.5) * speed;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: Math.random() * 0.5 + 0.3,
        maxLife: Math.random() * 0.5 + 0.3,
        radius: Math.random() * 3 + 1,
        color,
      });
    }
  }

  hitEffect(x, y) {
    this.burst(x, y, '#ffffff', 10, 150);
    this.screenShake = 0.15;
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    if (this.screenShake > 0) this.screenShake -= dt;
  }

  draw(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.radius / 2, p.y - p.radius / 2, p.radius, p.radius);
    }
    ctx.globalAlpha = 1;
  }
}
