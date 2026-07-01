class WaveManager {
  constructor() {
    this.wave = 0;
    this.enemiesPerWave = 5;
    this.enemiesSpawned = 0;
    this.enemiesAlive = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1.0;
    this.waveDelay = 2;
    this.waveTimer = 0;
    this.waitingForNextWave = false;
    this.totalEnemiesThisWave = 0;
    this.isBossWave = false;
    this.bossSpawned = false;
  }

  startNextWave() {
    this.wave++;
    this.isBossWave = this.wave % 5 === 0;
    this.enemiesSpawned = 0;
    this.enemiesAlive = 0;
    this.bossSpawned = false;

    if (this.isBossWave) {
      this.totalEnemiesThisWave = 3;
      this.enemiesPerWave = 3;
    } else {
      this.enemiesPerWave = 5 + (this.wave - 1) * 3;
      this.totalEnemiesThisWave = this.enemiesPerWave;
    }
    this.spawnTimer = 0;
    this.waitingForNextWave = false;
  }

  update(dt, canvasWidth, canvasHeight, playerX, playerY) {
    if (this.waitingForNextWave) {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) this.startNextWave();
      return null;
    }

    if (this.isBossWave && !this.bossSpawned) {
      this.bossSpawned = true;
      this.enemiesAlive = 1 + this.totalEnemiesThisWave;
      this.enemiesSpawned = 0;
      return { boss: true, wave: this.wave, w: canvasWidth, h: canvasHeight };
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.enemiesSpawned < this.totalEnemiesThisWave) {
      this.spawnTimer = this.spawnInterval;
      this.enemiesSpawned++;
      this.enemiesAlive++;

      let type = 'swarmer';
      if (this.wave >= 3 && this.wave < 6) {
        type = Math.random() < 0.5 ? 'swarmer' : 'tank';
      } else if (this.wave >= 6) {
        const r = Math.random();
        if (r < 0.33) type = 'swarmer';
        else if (r < 0.66) type = 'tank';
        else type = 'sniper';
      } else if (this.wave >= 2) {
        type = Math.random() < 0.3 ? 'tank' : 'swarmer';
      }

      return { enemy: { type, x: canvasWidth, y: canvasHeight, px: playerX, py: playerY } };
    }
    return null;
  }

  onEnemyKilled() {
    this.enemiesAlive--;
    if (this.enemiesAlive <= 0 && this.enemiesSpawned >= this.totalEnemiesThisWave && !this.isBossWave) {
      this.waitingForNextWave = true;
      this.waveTimer = this.waveDelay;
    }
    if (this.isBossWave && this.enemiesAlive <= 0) {
      this.waitingForNextWave = true;
      this.waveTimer = this.waveDelay + 1;
    }
  }

  isLastBoss() {
    return this.isBossWave && this.bossSpawned;
  }

  reset() {
    this.wave = 0;
    this.enemiesPerWave = 5;
    this.enemiesSpawned = 0;
    this.enemiesAlive = 0;
    this.spawnTimer = 0;
    this.waitingForNextWave = false;
    this.totalEnemiesThisWave = 0;
    this.isBossWave = false;
    this.bossSpawned = false;
  }
}
