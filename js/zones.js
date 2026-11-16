const ZONE_DEFS = [
  {
    id: 'deep_space',
    name: 'Deep Space',
    minWave: 1,
    maxWave: 5,
    background: 'phase1-arena',
    hazard: 'none',
  },
  {
    id: 'asteroid_field',
    name: 'Asteroid Field',
    minWave: 6,
    maxWave: 10,
    background: 'phase1-arena',
    hazard: 'asteroids',
    asteroid: { countMin: 6, countMax: 10, health: 8, contactDamage: 1 },
  },
  {
    id: 'nebula_core',
    name: 'Nebula Core',
    minWave: 11,
    maxWave: null,
    background: 'phase1-arena',
    hazard: 'nebula',
    nebula: {
      visionRadius: 180,
      surgeIntervalSeconds: 30,
      surgeDurationSeconds: 4,
      surgeSpeedMultiplier: 1.4,
    },
  },
];

function getZoneForWave(wave) {
  for (const zone of ZONE_DEFS) {
    if (wave >= zone.minWave && (zone.maxWave === null || wave <= zone.maxWave)) return zone;
  }
  return ZONE_DEFS[ZONE_DEFS.length - 1];
}

function getZoneIndex(zoneId) {
  return ZONE_DEFS.findIndex(zone => zone.id === zoneId);
}

function isZoneHazardImplemented(zone) {
  return !!zone && (zone.hazard === 'none' || zone.hazard === 'asteroids');
}

const ZONE_TRANSITION_SECONDS = 2.0;
const ASTEROID_START_CLEAR_RADIUS = 170;
const ASTEROID_MARGIN = 40;

class ZoneHazards {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.layout = [];
    this.hasLayout = false;
  }

  reset() {
    this.layout = [];
    this.hasLayout = false;
  }

  update(dt) {}

  enterZone(zone, random, playerX, playerY) {
    if (!zone || zone.hazard !== 'asteroids') {
      this.deactivateAll();
      return;
    }
    const avoidX = Number.isFinite(playerX) ? playerX : this.width / 2;
    const avoidY = Number.isFinite(playerY) ? playerY : this.height / 2;
    this.ensureLayout(zone, random, avoidX, avoidY);
    for (const asteroid of this.layout) {
      asteroid.health = asteroid.maxHealth;
      asteroid.active = true;
    }
  }

  ensureLayout(zone, random, avoidX, avoidY) {
    if (this.hasLayout) return;
    const config = zone.asteroid;
    const count = config.countMin + Math.floor(random() * (config.countMax - config.countMin + 1));
    const layout = [];
    for (let i = 0; i < count; i++) {
      let asteroid = null;
      for (let attempt = 0; attempt < 40; attempt++) {
        const radius = 20 + Math.floor(random() * 13);
        const x = ASTEROID_MARGIN + radius + random() * (this.width - ASTEROID_MARGIN * 2 - radius * 2);
        const y = ASTEROID_MARGIN + radius + random() * (this.height - ASTEROID_MARGIN * 2 - radius * 2);
        if (this.isClear(x, y, radius, layout, avoidX, avoidY)) {
          asteroid = { x, y, radius, maxHealth: config.health, health: config.health, active: false };
          break;
        }
      }
      if (!asteroid) {
        const radius = 20 + Math.floor(random() * 13);
        const x = ASTEROID_MARGIN + radius + random() * (this.width - ASTEROID_MARGIN * 2 - radius * 2);
        const y = ASTEROID_MARGIN + radius + random() * (this.height - ASTEROID_MARGIN * 2 - radius * 2);
        asteroid = { x, y, radius, maxHealth: config.health, health: config.health, active: false };
      }
      layout.push(asteroid);
    }
    this.layout = layout;
    this.hasLayout = true;
  }

  isClear(x, y, radius, layout, avoidX, avoidY) {
    if (Math.hypot(x - avoidX, y - avoidY) < ASTEROID_START_CLEAR_RADIUS + radius) return false;
    for (const asteroid of layout) {
      if (Math.hypot(x - asteroid.x, y - asteroid.y) < radius + asteroid.radius + 12) return false;
    }
    return true;
  }

  deactivateAll() {
    for (const asteroid of this.layout) asteroid.active = false;
  }

  activeCount() {
    let count = 0;
    for (const asteroid of this.layout) if (asteroid.active) count++;
    return count;
  }

  findCollision(x, y, radius) {
    for (const asteroid of this.layout) {
      if (!asteroid.active) continue;
      const dx = x - asteroid.x;
      const dy = y - asteroid.y;
      const reach = radius + asteroid.radius;
      if (dx * dx + dy * dy < reach * reach) return asteroid;
    }
    return null;
  }

  getPlayerCollision(player) {
    return this.findCollision(player.x, player.y, player.radius);
  }

  blockProjectiles(bulletPool, onDestroyed) {
    for (const bullet of bulletPool.playerBullets) {
      if (!bullet || !bullet.active) continue;
      const asteroid = this.findCollision(bullet.x, bullet.y, bullet.radius);
      if (!asteroid) continue;
      bullet.active = false;
      asteroid.health -= bullet.damage || 1;
      if (asteroid.health <= 0) {
        asteroid.health = 0;
        asteroid.active = false;
        if (onDestroyed) onDestroyed(asteroid);
      }
    }
    for (const bullet of bulletPool.enemyBullets) {
      if (!bullet || !bullet.active) continue;
      if (this.findCollision(bullet.x, bullet.y, bullet.radius)) bullet.active = false;
    }
  }

  draw(ctx) {
    for (const asteroid of this.layout) {
      if (!asteroid.active) continue;
      ctx.save();
      ctx.translate(asteroid.x, asteroid.y);
      ctx.fillStyle = '#3a3f4b';
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const points = 10;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wobble = 0.86 + ((i * 37 + Math.floor(asteroid.x + asteroid.y)) % 17) / 100;
        const r = asteroid.radius * wobble;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#262a33';
      for (let i = 0; i < 3; i++) {
        const angle = (i * 2.3 + asteroid.x * 0.01) % (Math.PI * 2);
        const dist = asteroid.radius * 0.42;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, asteroid.radius * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
