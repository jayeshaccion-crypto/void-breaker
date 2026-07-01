const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const state = {
  current: 'menu',
  score: 0,
  highScore: parseInt(localStorage.getItem('voidbreaker_highscore') || '0', 10),
  isNewHighScore: false,
};

const player = new Player(canvas);
const bulletPool = new BulletPool(150);
const waveManager = new WaveManager();
const ui = new UI(canvas);
const particles = new ParticleSystem();
const enemies = [];
const powerups = [];

function resizeCanvas() {
  const maxW = window.innerWidth;
  const maxH = window.innerHeight;
  const ratio = canvas.width / canvas.height;
  let w, h;
  if (maxW / maxH > ratio) {
    h = maxH;
    w = h * ratio;
  } else {
    w = maxW;
    h = w / ratio;
  }
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function firePlayerBullet() {
  sound.resume();
  sound.shoot();
  if (player.powerups.spread > 0) {
    for (let i = -1; i <= 1; i++) {
      bulletPool.firePlayer(player.x, player.y, player.angle + i * 0.2);
    }
  } else {
    bulletPool.firePlayer(player.x, player.y, player.angle);
  }
}

function checkCollisions() {
  for (const e of enemies) {
    if (!e.active) continue;

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < player.radius + e.radius) {
      sound.playerHit();
      if (player.takeDamage()) {
        gameOver();
        return;
      }
      particles.hitEffect(player.x, player.y);
      e.active = false;
      waveManager.onEnemyKilled();
    }

    for (const b of bulletPool.playerBullets) {
      if (!b.active) continue;
      const bdx = b.x - e.x;
      const bdy = b.y - e.y;
      if (bdx * bdx + bdy * bdy < (b.radius + e.radius) * (b.radius + e.radius)) {
        b.active = false;
        if (e.takeDamage()) {
          sound.enemyDeath();
          state.score += e.points;
          particles.burst(e.x, e.y, e.color);
          waveManager.onEnemyKilled();
          if (Math.random() < 0.2) {
            powerups.push(new PowerUp(e.x, e.y));
          }
        }
      }
    }

    if (e.shouldFire()) {
      if (e.type === 'tank') {
        const tdx = player.x - e.x;
        const tdy = player.y - e.y;
        bulletPool.fireEnemy(e.x, e.y, tdx, tdy, 250);
      } else if (e.type === 'sniper') {
        const sdx = player.x - e.x;
        const sdy = player.y - e.y;
        bulletPool.fireEnemy(e.x, e.y, sdx, sdy, 500);
        e.hasFired = true;
      }
    }
  }

  for (const b of bulletPool.enemyBullets) {
    if (!b.active) continue;
    const bdx = b.x - player.x;
    const bdy = b.y - player.y;
    if (bdx * bdx + bdy * bdy < (b.radius + player.radius) * (b.radius + player.radius)) {
      b.active = false;
      sound.playerHit();
      if (player.takeDamage()) {
        gameOver();
        return;
      }
      particles.hitEffect(player.x, player.y);
    }
  }

  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    if (!p.active) { powerups.splice(i, 1); continue; }
    const pdx = player.x - p.x;
    const pdy = player.y - p.y;
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
  state.score = 0;
  state.isNewHighScore = false;
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
  if (state.current !== 'playing') return;

  player.update(dt);
  if (player.shooting) firePlayerBullet();

  const prevWave = waveManager.wave;
  const newEnemy = waveManager.update(dt, canvas.width, canvas.height, player.x, player.y);
  if (newEnemy) enemies.push(newEnemy);
  if (waveManager.wave > prevWave) sound.waveStart();

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e.active) { enemies.splice(i, 1); continue; }
    e.update(dt, player.x, player.y);
    if (e.x < -100 || e.x > canvas.width + 100 || e.y < -100 || e.y > canvas.height + 100) {
      e.active = false;
      waveManager.onEnemyKilled();
    }
  }

  checkCollisions();

  bulletPool.update(dt);
  particles.update(dt);

  for (let i = powerups.length - 1; i >= 0; i--) {
    powerups[i].update(dt);
    if (!powerups[i].active) powerups.splice(i, 1);
  }
}

function draw() {
  ctx.save();

  if (particles.screenShake > 0) {
    const intensity = particles.screenShake * 20;
    ctx.translate(
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity
    );
  }

  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state.current === 'menu') {
    ui.drawMenu(ctx, state.highScore);
  } else if (state.current === 'playing' || state.current === 'gameover') {
    player.draw(ctx);
    for (const e of enemies) e.draw(ctx);
    bulletPool.draw(ctx);
    for (const p of powerups) p.draw(ctx);
    particles.draw(ctx);

    if (state.current === 'playing') {
      ui.drawHUD(ctx, player, waveManager.wave, state.score, state.highScore);
    }
  }

  ctx.restore();

  if (state.current === 'gameover') {
    ui.drawGameOver(ctx, state.score, state.highScore, state.isNewHighScore);
  }

  if (state.current === 'playing') {
    player.drawTouchControls(ctx);
  }
}

let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

function handleStart(e) {
  if (state.current === 'menu' || state.current === 'gameover') {
    sound.resume();
    resetGame();
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    if (state.current === 'menu' || state.current === 'gameover') {
      handleStart();
    }
  }
});

canvas.addEventListener('click', () => {
  handleStart();
});

canvas.addEventListener('touchend', e => {
  if (state.current === 'menu' || state.current === 'gameover') {
    handleStart();
  }
});

requestAnimationFrame(gameLoop);
