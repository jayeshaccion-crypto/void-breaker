class UI {
  constructor(canvas) {
    this.canvas = canvas;
  }

  drawHUD(ctx, player, wave, score, highScore, streak) {
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 16, 28);

    ctx.textAlign = 'right';
    ctx.fillText(`Wave: ${wave}`, this.canvas.width - 16, 28);

    ctx.textAlign = 'left';
    ctx.fillText(`High: ${highScore}`, 16, 50);

    if (streak > 1) {
      ctx.fillStyle = streak >= 10 ? '#ff4444' : streak >= 5 ? '#ffaa00' : '#ffff00';
      ctx.textAlign = 'left';
      ctx.font = 'bold 14px monospace';
      const mult = Math.min(1 + streak * 0.1, 3);
      ctx.fillText(`🔥 ${streak}x (x${mult.toFixed(1)})`, 16, 72);
    }

    const barX = this.canvas.width / 2 - 60;
    const barY = 16;
    const barW = 120;
    const barH = 12;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    const hpRatio = player.health / player.maxHealth;
    ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : hpRatio > 0.25 ? '#ffaa00' : '#ff0000';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`HP ${player.health}/${player.maxHealth}`, this.canvas.width / 2, barY + 30);

    let pY = 50;
    if (player.powerups.spread > 0) {
      ctx.fillStyle = '#ff00ff';
      ctx.textAlign = 'right';
      ctx.font = '12px monospace';
      ctx.fillText(`SPREAD ${Math.ceil(player.powerups.spread)}s`, this.canvas.width - 16, pY);
      pY += 18;
    }
    if (player.powerups.rapid > 0) {
      ctx.fillStyle = '#ffff00';
      ctx.textAlign = 'right';
      ctx.font = '12px monospace';
      ctx.fillText(`RAPID ${Math.ceil(player.powerups.rapid)}s`, this.canvas.width - 16, pY);
      pY += 18;
    }
    if (player.powerups.shield) {
      ctx.fillStyle = '#00ffff';
      ctx.textAlign = 'right';
      ctx.font = '12px monospace';
      ctx.fillText('SHIELD', this.canvas.width - 16, pY);
    }
  }

  drawEdgeIndicators(ctx, enemies, player) {
    const w = this.canvas.width, h = this.canvas.height;
    for (const e of enemies) {
      if (!e.active) continue;
      if (e.x >= 0 && e.x <= w && e.y >= 0 && e.y <= h) continue;
      const dx = e.x - player.x, dy = e.y - player.y;
      const angle = Math.atan2(dy, dx);
      const margin = 30;
      let ix = w / 2 + Math.cos(angle) * w * 0.5;
      let iy = h / 2 + Math.sin(angle) * h * 0.5;
      ix = Math.max(margin, Math.min(w - margin, ix));
      iy = Math.max(margin, Math.min(h - margin, iy));

      ctx.save();
      ctx.translate(ix, iy);
      ctx.rotate(angle);
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = e.isBoss ? '#ff2266' : e.color;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-4, -5);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  drawPauseOverlay(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    ctx.font = '16px monospace';
    ctx.fillText('Press Escape to resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
  }

  drawBossHealth(ctx, boss) {
    if (!boss || !boss.active) return;
    const barW = 300;
    const barH = 8;
    const barX = (this.canvas.width - barW) / 2;
    const barY = 56;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

    const hpRatio = boss.health / boss.maxHealth;
    ctx.fillStyle = boss.phase === 2 ? '#ff2266' : '#cc00ff';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BOSS', this.canvas.width / 2, barY + barH + 14);
  }

  drawMenu(ctx, highScore) {
    ctx.fillStyle = '#00ccff';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VOID BREAKER', this.canvas.width / 2, this.canvas.height / 2 - 80);

    ctx.fillStyle = '#aaa';
    ctx.font = '16px monospace';
    ctx.fillText('WASD / Arrows to move  |  Mouse to aim', this.canvas.width / 2, this.canvas.height / 2 - 20);
    ctx.fillText('Click / Space to fire  |  Shift to dash', this.canvas.width / 2, this.canvas.height / 2 + 6);
    ctx.fillText('Escape to pause  |  Boss every 5th wave', this.canvas.width / 2, this.canvas.height / 2 + 32);

    if (highScore > 0) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = '16px monospace';
      ctx.fillText(`High Score: ${highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 72);
    }

    ctx.fillStyle = '#fff';
    ctx.font = '22px monospace';
    const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('Click or press Enter to start', this.canvas.width / 2, this.canvas.height / 2 + 130);
    ctx.globalAlpha = 1;
  }

  drawGameOver(ctx, score, highScore, isNewHighScore) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 60);

    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.fillText(`Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2);

    if (isNewHighScore) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = '20px monospace';
      ctx.fillText('NEW HIGH SCORE!', this.canvas.width / 2, this.canvas.height / 2 + 36);
    }

    ctx.fillStyle = '#aaa';
    ctx.font = '16px monospace';
    ctx.fillText(`High Score: ${highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 72);

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('Click or press Enter to restart', this.canvas.width / 2, this.canvas.height / 2 + 120);
    ctx.globalAlpha = 1;
  }
}
