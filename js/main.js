const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 960;
canvas.height = 540;

const MAX_ENEMIES = 40;
const metaProfile = loadMeta();

const state = {
  current: 'menu',
  score: 0,
  highScore: metaProfile.bestScore,
  isNewHighScore: false,
  paused: false,
  overlay: null,
  muted: false,
  upgradeCards: [],
  upgradeTimer: 0,
  bossIncomingTimer: 0,
  hangar: { selectedWeapon: 'pulse_cannon' },
  wavesCleared: 0,
  bossKills: 0,
  kills: 0,
  powerUpsCollected: 0,
  upgradesTaken: 0,
  currentZone: 'deep_space',
  zoneTransitionTimer: 0,
  shardsEarned: 0,
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let runSeed = 0;
let runRng = mulberry32(1);

function startRunRng(seed) {
  runSeed = seed >>> 0;
  runRng = mulberry32(runSeed);
}

function runRandom() {
  return runRng();
}

startRunRng((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);

const player = new Player(canvas);
const bulletPool = new BulletPool(200);
const waveManager = new WaveManager();
const ui = new UI(canvas);
const particles = new ParticleSystem();
const enemies = [];
const powerups = [];
const zoneHazards = new ZoneHazards(canvas.width, canvas.height);

let boss = null;
let streak = 0;
let streakTimer = 0;

const starLayers = [];
function initStars() {
  for (let layer = 0; layer < 3; layer++) {
    starLayers[layer] = [];
    const count = 50 + layer * 25;
    for (let i = 0; i < count; i++) {
      starLayers[layer].push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 0.5 + layer * 0.5 + Math.random() * 0.5,
        speed: 10 + layer * 15 + Math.random() * 10,
        alpha: 0.3 + layer * 0.25 + Math.random() * 0.2,
      });
    }
  }
}
initStars();

function resizeCanvas() {
  const maxW = window.innerWidth;
  const maxH = window.innerHeight;
  const ratio = canvas.width / canvas.height;
  let w, h;
  if (maxW / maxH > ratio) { h = maxH; w = h * ratio; }
  else { w = maxW; h = w / ratio; }
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function firePlayerBullet() {
  sound.resume();
  sound.shoot();
  if (player.powerups.spread > 0) {
    for (let i = -1; i <= 1; i++) bulletPool.firePlayer(player.x, player.y, player.angle + i * 0.2);
  } else {
    bulletPool.firePlayer(player.x, player.y, player.angle);
  }
}

function handleBossAttack(attacks) {
  if (!attacks) return;
  for (const a of attacks) {
    if (a.summon) {
      if (enemies.length >= MAX_ENEMIES) continue;
      const e = new Enemy(a.type, a.x, a.y, player.x, player.y);
      enemies.push(e);
      waveManager.onEnemySpawned();
    } else {
      bulletPool.fireEnemy(a.bx, a.by, a.bvx, a.bvy, a.bspeed);
    }
  }
}

function applyUpgrade(card) {
  if (!card) return;
  player.upgrades.push(card.id);
  upgradeManager.apply(card, player);
  state.upgradesTaken++;
}

function beginUpgradePick() {
  state.wavesCleared++;
  state.current = 'upgrade_pick';
  state.upgradeCards = upgradeManager.selectCards(waveManager.wave);
  state.upgradeTimer = 2;
}

function beginWave() {
  const previousZone = state.currentZone;
  waveManager.startNextWave();
  const zone = getZoneForWave(waveManager.wave);
  const zoneChanged = zone.id !== previousZone;
  state.currentZone = zone.id;
  state.overlay = null;
  state.paused = false;
  if (zoneChanged && isZoneHazardImplemented(zone)) {
    state.zoneTransitionTimer = ZONE_TRANSITION_SECONDS;
    state.overlay = 'zone_transition';
    zoneHazards.deactivateAll();
  } else {
    state.zoneTransitionTimer = 0;
    if (zoneChanged) zoneHazards.deactivateAll();
    sound.waveStart();
  }
}

function completeUpgradePick(card) {
  if (card) applyUpgrade(card);
  state.current = 'playing';
  beginWave();
}

function checkCollisions() {
  zoneHazards.blockProjectiles(bulletPool, asteroid => {
    if (runRandom() < getDropRate(metaProfile.unlocks)) {
      powerups.push(new PowerUp(asteroid.x, asteroid.y));
    }
  });

  if (!player.invulnerable) {
    const asteroid = zoneHazards.getPlayerCollision(player);
    if (asteroid) {
      sound.playerHit();
      if (player.takeDamage()) { gameOver(); return; }
      particles.hitEffect(player.x, player.y);
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e.active) continue;

    const dx = player.x - e.x, dy = player.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < player.radius + e.radius) {
      sound.playerHit();
      if (player.takeDamage()) { gameOver(); return; }
      particles.hitEffect(player.x, player.y);
      e.active = false;
      waveManager.onEnemyKilled();
    }

    for (const b of bulletPool.playerBullets) {
      if (!b || !b.active) continue;
      const bdx = b.x - e.x, bdy = b.y - e.y;
      if (bdx * bdx + bdy * bdy < (b.radius + e.radius) * (b.radius + e.radius)) {
        b.active = false;
        if (player.upgradeData.scattershotStacks > 0 && b.splitDepth === 0) {
          const splitCount = 2 * player.upgradeData.scattershotStacks;
          const baseAngle = Math.atan2(b.vy, b.vx);
          for (let s = 0; s < splitCount; s++) {
            const offset = (s - (splitCount - 1) / 2) * 0.15;
            bulletPool.firePlayer(
              b.x, b.y, baseAngle + offset, 500,
              b.damage, b.weaponId, 'scattershot', b.splitDepth + 1
            );
          }
        }
        if (e.takeDamage(b.damage || 1)) {
          sound.enemyDeath();
          const mult = Math.min(1 + streak * 0.1, 3);
          const pts = Math.floor(e.points * mult);
          state.score += pts;
          streak++;
          streakTimer = 2;
          state.kills++;
          if (e.isBoss) {
            particles.bigBurst(e.x, e.y, e.color);
            for (let p = 0; p < 3; p++) powerups.push(new PowerUp(e.x, e.y));
          } else {
            particles.burst(e.x, e.y, e.color);
          }
          waveManager.onEnemyKilled();
          if (!e.isBoss && runRandom() < getDropRate(metaProfile.unlocks)) {
            powerups.push(new PowerUp(e.x, e.y));
          }
        }
      }
    }

    if (e.shouldFire()) {
      if (e.type === 'tank') {
        const tdx = player.x - e.x, tdy = player.y - e.y;
        bulletPool.fireEnemy(e.x, e.y, tdx, tdy, 250);
      } else if (e.type === 'sniper') {
        const sdx = player.x - e.x, sdy = player.y - e.y;
        bulletPool.fireEnemy(e.x, e.y, sdx, sdy, 500);
        e.hasFired = true;
      }
    }
  }

  if (boss && boss.active) {
    const bdx = player.x - boss.x, bdy = player.y - boss.y;
    if (bdx * bdx + bdy * bdy < (player.radius + boss.radius) * (player.radius + boss.radius)) {
      sound.playerHit();
      if (player.takeDamage()) { gameOver(); return; }
      particles.hitEffect(player.x, player.y);
    }

    for (const b of bulletPool.playerBullets) {
      if (!b || !b.active) continue;
      const bdx2 = b.x - boss.x, bdy2 = b.y - boss.y;
      if (bdx2 * bdx2 + bdy2 * bdy2 < (b.radius + boss.radius) * (b.radius + boss.radius)) {
        b.active = false;
        if (boss.takeDamage(b.damage || 1, b.x, b.y)) {
          sound.enemyDeath();
          const mult = Math.min(1 + streak * 0.1, 3);
          state.score += Math.floor(boss.points * mult);
          streak++;
          streakTimer = 2;
          state.bossKills++;
          particles.bigBurst(boss.x, boss.y, boss.color);
          for (let p = 0; p < 3; p++) powerups.push(new PowerUp(boss.x, boss.y));
          for (const e of enemies) e.active = false;
          enemies.length = 0;
          waveManager.onBossDefeated();
          boss = null;
        }
      }
    }
  }

  for (const b of bulletPool.enemyBullets) {
    if (!b || !b.active) continue;
    const bdx = b.x - player.x, bdy = b.y - player.y;
    if (bdx * bdx + bdy * bdy < (b.radius + player.radius) * (b.radius + player.radius)) {
      b.active = false;
      sound.playerHit();
      if (player.takeDamage()) { gameOver(); return; }
      particles.hitEffect(player.x, player.y);
    }
  }

  const pickupRange = player.radius * player.upgradeData.pickupRange;
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    if (!p.active) { powerups.splice(i, 1); continue; }
    const pdx = player.x - p.x, pdy = player.y - p.y;
    if (pdx * pdx + pdy * pdy < (pickupRange + p.radius) * (pickupRange + p.radius)) {
      sound.powerUp();
      p.apply(player);
      state.powerUpsCollected++;
      powerups.splice(i, 1);
    }
  }
}

function gameOver() {
  state.current = 'gameover';
  state.overlay = null;
  state.paused = false;
  state.isNewHighScore = state.score > metaProfile.bestScore;
  if (state.isNewHighScore) {
    metaProfile.bestScore = state.score;
    saveMeta(metaProfile);
    state.highScore = metaProfile.bestScore;
  }
  sound.stopBGM();
  sound.gameOver();
}

function resetGame() {
  startRunRng((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
  state.current = 'playing';
  state.overlay = null;
  state.paused = false;
  state.score = 0;
  state.isNewHighScore = false;
  state.bossIncomingTimer = 0;
  state.wavesCleared = 0;
  state.bossKills = 0;
  state.kills = 0;
  state.powerUpsCollected = 0;
  state.upgradesTaken = 0;
  state.currentZone = 'deep_space';
  state.zoneTransitionTimer = 0;
  state.shardsEarned = 0;
  streak = 0;
  streakTimer = 0;
  boss = null;
  upgradeManager.reset();
  player.reset();
  enemies.length = 0;
  powerups.length = 0;
  particles.reset();
  waveManager.reset();
  zoneHazards.reset();
  sound.resume();
  beginWave();
  sound.startBGM();
}

function update(dt) {
  if (state.overlay === 'paused') return;

  if (state.current === 'upgrade_pick') {
    state.upgradeTimer -= dt;
    if (state.upgradeTimer <= 0) {
      const card = upgradeManager.autoPick();
      completeUpgradePick(card);
    }
    return;
  }

  if (state.current !== 'playing') return;

  if (state.overlay === 'zone_transition') {
    state.zoneTransitionTimer -= dt;
    if (state.zoneTransitionTimer <= 0) {
      const zone = getZoneForWave(waveManager.wave);
      zoneHazards.enterZone(zone, runRandom, player.x, player.y);
      state.overlay = null;
      state.zoneTransitionTimer = 0;
      sound.waveStart();
    }
    return;
  }

  if (state.bossIncomingTimer > 0) {
    state.bossIncomingTimer -= dt;
    if (state.bossIncomingTimer <= 0) {
      boss = spawnBoss(waveManager.wave, canvas.width, canvas.height);
      state.overlay = null;
      sound.bossAppear();
    }
    return;
  }

  player.update(dt);
  if (player.shooting) firePlayerBullet();

  const spawnResult = waveManager.update(dt, canvas.width, canvas.height, player.x, player.y);

  if (spawnResult) {
    if (spawnResult.boss) {
      state.bossIncomingTimer = 1.5;
      state.overlay = 'boss_incoming';
    } else if (spawnResult.enemy) {
      const e = spawnResult.enemy;
      if (enemies.length < MAX_ENEMIES) {
        enemies.push(spawnEnemy(e.type, e.x, e.y, e.px, e.py));
      } else {
        waveManager.onEnemyKilled();
      }
    }
  }

  zoneHazards.update(dt);

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e.active) { enemies.splice(i, 1); continue; }
    e.update(dt, player.x, player.y);
    if (e.x < -120 || e.x > canvas.width + 120 || e.y < -120 || e.y > canvas.height + 120) {
      e.active = false;
      waveManager.onEnemyKilled();
    }
  }

  if (boss && boss.active) {
    const bossAttacks = boss.update(dt, player.x, player.y);
    if (bossAttacks) handleBossAttack(bossAttacks);
  }

  checkCollisions();
  bulletPool.update(dt);
  particles.update(dt);

  for (let i = powerups.length - 1; i >= 0; i--) {
    powerups[i].update(dt);
    if (!powerups[i].active) powerups.splice(i, 1);
  }

  if (streakTimer > 0) streakTimer -= dt;
  else streak = 0;

  if (waveManager.waitingForNextWave) {
    beginUpgradePick();
  }
}

function updateStars(dt) {
  for (const layer of starLayers) {
    for (const s of layer) {
      s.y += s.speed * dt;
      if (s.y > canvas.height) { s.y = -2; s.x = Math.random() * canvas.width; }
    }
  }
}

function drawStars() {
  for (let l = 0; l < starLayers.length; l++) {
    for (const s of starLayers[l]) {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#fff';
      const r = s.size;
      ctx.fillRect(s.x - r / 2, s.y - r / 2, r, r);
    }
  }
  ctx.globalAlpha = 1;
}

function draw() {
  ctx.save();

  if (particles.screenShake > 0) {
    const intensity = particles.screenShake * 20;
    ctx.translate((Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity);
  }

  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawStars();

  if (state.current === 'menu') {
    ui.drawMenu(ctx, state.highScore);
  } else if (state.current === 'playing' || state.current === 'gameover' || state.current === 'upgrade_pick') {
    zoneHazards.draw(ctx);
    player.draw(ctx);
    for (const e of enemies) e.draw(ctx);
    if (boss && boss.active) boss.draw(ctx);
    bulletPool.draw(ctx);
    for (const p of powerups) p.draw(ctx);
    particles.draw(ctx);

    if (state.current === 'playing') {
      ui.drawEdgeIndicators(ctx, enemies, player);
      if (boss && boss.active) { ui.drawEdgeIndicators(ctx, [boss], player); ui.drawBossHealth(ctx, boss); }
      ui.drawHUD(ctx, player, waveManager.wave, state.score, state.highScore, streak);
    }
  }

  ctx.restore();

  if (state.current === 'upgrade_pick') {
    ui.drawUpgradePick(ctx, state.upgradeCards, state.upgradeTimer);
  }

  if (state.current === 'gameover') ui.drawGameOver(ctx, state.score, state.highScore, state.isNewHighScore);

  if (state.current === 'playing' && state.bossIncomingTimer > 0) ui.drawBossIncoming(ctx, state.bossIncomingTimer, waveManager.wave);

  if (state.current === 'playing' && state.overlay === 'zone_transition') {
    ui.drawZoneTransition(ctx, getZoneForWave(waveManager.wave), state.zoneTransitionTimer, ZONE_TRANSITION_SECONDS);
  }

  if (state.current === 'playing' && state.overlay === 'paused') ui.drawPauseOverlay(ctx);

  if (state.current === 'playing') player.drawTouchControls(ctx);

  if (state.muted) {
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.globalAlpha = 0.5;
    ctx.fillText('MUTED', canvas.width - 16, canvas.height - 16);
    ctx.globalAlpha = 1;
  }
}

let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  updateStars(dt);
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

function handleStart() {
  if (state.current === 'menu' || state.current === 'gameover') {
    sound.resume();
    resetGame();
  }
}

canvas.addEventListener('click', e => {
  if (state.current === 'menu' || state.current === 'gameover') {
    handleStart();
    return;
  }
  if (state.current === 'upgrade_pick') {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const idx = ui.hitTestUpgradeCard(mx, my, state.upgradeCards);
    if (idx >= 0) {
      const card = upgradeManager.pick(idx);
      if (card) completeUpgradePick(card);
    }
    return;
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    if (state.current === 'menu' || state.current === 'gameover') handleStart();
  }
  if (e.key === 'Escape' && state.current === 'playing' && (state.overlay === null || state.overlay === 'paused')) {
    state.overlay = state.overlay === 'paused' ? null : 'paused';
    state.paused = state.overlay === 'paused';
  }
  if (e.key === 'm' || e.key === 'M') {
    state.muted = !state.muted;
    sound.toggleMute(state.muted);
  }
  if (state.current === 'upgrade_pick') {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 3) {
      const card = upgradeManager.pick(n - 1);
      if (card) completeUpgradePick(card);
    }
  }
});

canvas.addEventListener('touchend', e => {
  if (state.current === 'menu' || state.current === 'gameover') handleStart();
});

requestAnimationFrame(gameLoop);
