class UI {
  constructor(canvas) {
    this.canvas = canvas;
  }

  drawHUD(ctx, player, wave, score, highScore) {
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 16, 28);

    ctx.textAlign = 'right';
    ctx.fillText(`Wave: ${wave}`, this.canvas.width - 16, 28);

    ctx.textAlign = 'left';
    ctx.fillText(`High: ${highScore}`, 16, 50);

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

    if (player.powerups.spread > 0) {
      ctx.fillStyle = '#ff00ff';
      ctx.textAlign = 'right';
      ctx.font = '12px monospace';
      ctx.fillText(`SPREAD ${Math.ceil(player.powerups.spread)}s`, this.canvas.width - 16, 50);
    }
    if (player.powerups.rapid > 0) {
      ctx.fillStyle = '#ffff00';
      ctx.textAlign = 'right';
      ctx.font = '12px monospace';
      ctx.fillText(`RAPID ${Math.ceil(player.powerups.rapid)}s`, this.canvas.width - 16, 68);
    }
    if (player.powerups.shield) {
      ctx.fillStyle = '#00ffff';
      ctx.textAlign = 'right';
      ctx.font = '12px monospace';
      ctx.fillText('SHIELD', this.canvas.width - 16, 86);
    }
  }

  drawMenu(ctx, highScore) {
    ctx.fillStyle = '#00ccff';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VOID BREAKER', this.canvas.width / 2, this.canvas.height / 2 - 60);

    ctx.fillStyle = '#aaa';
    ctx.font = '18px monospace';
    ctx.fillText('WASD / Arrows to move', this.canvas.width / 2, this.canvas.height / 2 + 10);
    ctx.fillText('Mouse to aim, Click / Space to fire', this.canvas.width / 2, this.canvas.height / 2 + 36);
    ctx.fillText('Shift to dash', this.canvas.width / 2, this.canvas.height / 2 + 62);

    if (highScore > 0) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = '16px monospace';
      ctx.fillText(`High Score: ${highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 100);
    }

    ctx.fillStyle = '#fff';
    ctx.font = '22px monospace';
    const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('Click or press Enter to start', this.canvas.width / 2, this.canvas.height / 2 + 150);
    ctx.globalAlpha = 1;
  }

  drawGameOver(ctx, score, highScore, isNewHighScore) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
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
