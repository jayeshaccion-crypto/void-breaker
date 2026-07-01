const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const state = {
  current: 'menu',
  score: 0,
  highScore: parseInt(localStorage.getItem('voidbreaker_highscore') || '0', 10),
  isNewHighScore: false,
  paused: false,
};

const player = new Player(canvas);
const bulletPool = new BulletPool(200);
const waveManager = new WaveManager();
const ui = new UI(canvas);
const particles = new ParticleSystem();
const enemies = [];
const powerups = [];

let boss = null;
let streak = 0;
let streakTimer = 0;
let prevWave = 0;

const starLayers = [];
function initStars() {
  for (let layer = 0; layer < 3; layer++) {
    starLayers[layer] = [];
    const count = 40 + layer * 20;
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
      const e = new Enemy(a.type, a.x, a.y, player.x, player.y);
      e.radius = 8; e.speed = 220; e.health = 1; e.color = '#ffaa00'; e.points = 50;
      enemies.push(e);
      waveManager.onEnemyKilled();
      waveManager.onEnemyKilled();
    } else {
      bulletPool.fireEnemy(a.bx, a.by, a.bvx, a.bvy, a.bspeed);
    }
  }
}

function checkCollisions() {
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
      if (!b.active) continue;
      const bdx = b.x - e.x, bdy = b.y - e.y;
      if (bdx * bdx + bdy * bdy < (b.radius + e.radius) * (b.radius + e.radius)) {
        b.active = false;
        if (e.takeDamage()) {
          sound.enemyDeath();
          const mult = Math.min(1 + streak * 0.1, 3);
          const pts = Math.floor(e.points * mult);
          state.score += pts;
          streak++;
          streakTimer = 2;
          if (e.isBoss) {
            particles.bigBurst(e.x, e.y, e.color);
            for (let p = 0; p < 3; p++) powerups.push(new PowerUp(e.x, e.y));
          } else {
            particles.burst(e.x, e.y, e.color);
          }
          waveManager.onEnemyKilled();
          if (!e.isBoss && Math.random() < 0.2) powerups.push(new PowerUp(e.x, e.y));
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
      if (!b.active) continue;
      const bdx2 = b.x - boss.x, bdy2 = b.y - boss.y;
      if (bdx2 * bdx2 + bdy2 * bdy2 < (b.radius + boss.radius) * (b.radius + boss.radius)) {
        b.active = false;
        if (boss.takeDamage()) {
          sound.enemyDeath();
          const mult = Math.min(1 + streak * 0.1, 3);
          state.score += Math.floor(boss.points * mult);
          streak++;
          streakTimer = 2;
          particles.bigBurst(boss.x, boss.y, boss.color);
          for (let p = 0; p < 3; p++) powerups.push(new PowerUp(boss.x, boss.y));
          waveManager.onEnemyKilled();
          boss = null;
        }
      }
    }

  }

  for (const b of bulletPool.enemyBullets) {
    if (!b.active) continue;
    const bdx = b.x - player.x, bdy = b.y - player.y;
    if (bdx * bdx + bdy * bdy < (b.radius + player.radius) * (b.radius + player.radius)) {
      b.active = false;
      sound.playerHit();
      if (player.takeDamage()) { gameOver(); return; }
      particles.hitEffect(player.x, player.y);
    }
  }

  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    if (!p.active) { powerups.splice(i, 1); continue; }
    const pdx = player.x - p.x, pdy = player.y - p.y;
    if (pdx * pdx + pdy * pdy < (player.radius + p.radius) * (player.radius + p.radius)) {
      sound.powerUp();
      p.apply(player);
      powerups.splice(i, 1);
    }
  }
}

function gameOver() {
  state.current = 'gameover';
  state.isNewHighScore = state.score > state.highScore;
  if (state.isNewHighScore) {
    state.highScore = state.score;
    localStorage.setItem('voidbreaker_highscore', String(state.highScore));
  }
  sound.stopBGM();
  sound.gameOver();
}

function resetGame() {
  state.current = 'playing';
  state.paused = false;
  state.score = 0;
  state.isNewHighScore = false;
  streak = 0;
  streakTimer = 0;
  boss = null;
  player.reset();
  enemies.length = 0;
  powerups.length = 0;
  particles.particles = [];
  particles.screenShake = 0;
  waveManager.reset();
  waveManager.startNextWave();
  sound.resume();
  sound.waveStart();
  sound.startBGM();
}

function update(dt) {
  if (state.current !== 'playing' || state.paused) return;

  player.update(dt);
  if (player.shooting) firePlayerBullet();

  prevWave = waveManager.wave;
  const spawnResult = waveManager.update(dt, canvas.width, canvas.height, player.x, player.y);

  if (spawnResult) {
    if (spawnResult.boss) {
      boss = spawnBoss(spawnResult.wave, spawnResult.w, spawnResult.h);
      sound.bossAppear();
    } else if (spawnResult.enemy) {
      const e = spawnResult.enemy;
      enemies.push(spawnEnemy(e.type, e.x, e.y, e.px, e.py));
    }
  }
  if (waveManager.wave > prevWave && !waveManager.isBossWave) sound.waveStart();

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
  } else if (state.current === 'playing' || state.current === 'gameover') {
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

  if (state.current === 'gameover') ui.drawGameOver(ctx, state.score, state.highScore, state.isNewHighScore);

  if (state.current === 'playing' && state.paused) ui.drawPauseOverlay(ctx);

  if (state.current === 'playing') player.drawTouchControls(ctx);
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

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    if (state.current === 'menu' || state.current === 'gameover') handleStart();
  }
  if (e.key === 'Escape' && state.current === 'playing') {
    state.paused = !state.paused;
  }
});

canvas.addEventListener('click', () => { handleStart(); });
canvas.addEventListener('touchend', e => {
  if (state.current === 'menu' || state.current === 'gameover') handleStart();
});

requestAnimationFrame(gameLoop);
