class WaveManager {
  constructor() {
    this.wave = 0;
    this.enemiesPerWave = 3;
    this.enemiesSpawned = 0;
    this.enemiesAlive = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1.0;
    this.waveDelay = 2;
    this.waveTimer = 0;
    this.waitingForNextWave = false;
    this.totalEnemiesThisWave = 0;
  }

  startNextWave() {
    this.wave++;
    this.enemiesPerWave = 5 + (this.wave - 1) * 3;
    this.enemiesSpawned = 0;
    this.enemiesAlive = 0;
    this.totalEnemiesThisWave = this.enemiesPerWave;
    this.spawnTimer = 0;
    this.waitingForNextWave = false;
  }

  update(dt, canvasWidth, canvasHeight, playerX, playerY) {
    if (this.waitingForNextWave) {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) {
        this.startNextWave();
      }
      return;
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

      return spawnEnemy(type, canvasWidth, canvasHeight, playerX, playerY);
    }
    return null;
  }

  onEnemyKilled() {
    this.enemiesAlive--;
    if (this.enemiesAlive <= 0 && this.enemiesSpawned >= this.totalEnemiesThisWave) {
      this.waitingForNextWave = true;
      this.waveTimer = this.waveDelay;
    }
  }

  reset() {
    this.wave = 0;
    this.enemiesPerWave = 3;
    this.enemiesSpawned = 0;
    this.enemiesAlive = 0;
    this.spawnTimer = 0;
    this.waitingForNextWave = false;
    this.totalEnemiesThisWave = 0;
  }
}
