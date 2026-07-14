class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.bgmPlaying = false;
    this.oscs = [];
    this.sfxVolume = 0.3;
    this.bgmVolume = 0.15;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.bgmVolume;
      this.bgmGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Audio unavailable:', e.message);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  playTone(freq, duration, type = 'square', volume = 1, slide = 0) {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playNoise(duration, volume = 1) {
    this.init();
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * this.sfxVolume * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  shoot() {
    this.playTone(880, 0.08, 'square', 0.4, 200);
    this.playTone(1320, 0.06, 'square', 0.2, 300);
  }

  playerHit() {
    this.playNoise(0.2, 0.8);
    this.playTone(150, 0.2, 'sawtooth', 0.5, -50);
  }

  enemyDeath() {
    this.playNoise(0.15, 0.5);
    this.playTone(300, 0.12, 'square', 0.3, -200);
  }

  dash() {
    this.playTone(400, 0.1, 'sine', 0.3, 600);
    this.playNoise(0.08, 0.3);
  }

  powerUp() {
    this.playTone(660, 0.1, 'sine', 0.4, 0);
    setTimeout(() => this.playTone(880, 0.1, 'sine', 0.4, 0), 80);
    setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.4, 0), 160);
  }

  waveStart() {
    this.playTone(440, 0.15, 'square', 0.3, 0);
    setTimeout(() => this.playTone(554, 0.15, 'square', 0.3, 0), 150);
    setTimeout(() => this.playTone(659, 0.15, 'square', 0.3, 0), 300);
    setTimeout(() => this.playTone(880, 0.25, 'square', 0.4, 0), 450);
  }

  gameOver() {
    this.playTone(440, 0.3, 'sawtooth', 0.5, 0);
    setTimeout(() => this.playTone(349, 0.3, 'sawtooth', 0.5, 0), 300);
    setTimeout(() => this.playTone(262, 0.5, 'sawtooth', 0.5, 0), 600);
    setTimeout(() => this.playTone(196, 0.8, 'sawtooth', 0.4, 0), 900);
  }

  bossAppear() {
    this.playTone(196, 0.3, 'sawtooth', 0.5, 0);
    setTimeout(() => this.playTone(262, 0.3, 'sawtooth', 0.5, 0), 200);
    setTimeout(() => this.playTone(330, 0.3, 'sawtooth', 0.5, 0), 400);
    setTimeout(() => this.playTone(440, 0.5, 'sawtooth', 0.6, 0), 600);
    setTimeout(() => this.playNoise(0.3, 0.6), 800);
  }

  startBGM() {
    this.init();
    if (!this.ctx || this.bgmPlaying) return;
    this.bgmPlaying = true;

    const notes = [262, 294, 330, 349, 392, 349, 330, 294, 262, 330, 392, 440, 392, 330, 294, 262];
    const noteLen = 0.2;
    const loopLen = notes.length * noteLen;
    let startTime = this.ctx.currentTime;

    const schedule = () => {
      if (!this.bgmPlaying) return;
      const now = this.ctx.currentTime;
      if (startTime < now + 0.5) {
        for (let i = 0; i < notes.length; i++) {
          const t = startTime + i * noteLen;
          if (t > now + 0.5) break;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(notes[i], t);
          gain.gain.setValueAtTime(this.bgmVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + noteLen * 0.8);
          osc.connect(gain);
          gain.connect(this.bgmGain);
          osc.start(t);
          osc.stop(t + noteLen);
        }
        startTime += loopLen;
      }
      requestAnimationFrame(schedule);
    };
    schedule();
  }

  toggleMute(muted) {
    if (!this.ctx) return;
    this.masterGain.gain.value = muted ? 0 : 1;
  }

  stopBGM() {
    this.bgmPlaying = false;
  }
}

const sound = new SoundManager();
