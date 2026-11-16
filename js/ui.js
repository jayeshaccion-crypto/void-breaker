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

  drawUpgradePick(ctx, cards, timer) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CHOOSE AN UPGRADE', this.canvas.width / 2, 70);

    const cardW = 200;
    const cardH = 200;
    const gap = 30;
    const totalW = cards.length * cardW + (cards.length - 1) * gap;
    const startX = (this.canvas.width - totalW) / 2;
    const cardY = (this.canvas.height - cardH) / 2 + 20;

    const tierColors = { 1: '#4a9eff', 2: '#ffaa00', 3: '#ff44ff' };
    const tierNames = { 1: 'TIER 1', 2: 'TIER 2', 3: 'TIER 3' };

    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const cx = startX + i * (cardW + gap);
      const color = tierColors[c.tier] || '#fff';

      ctx.fillStyle = 'rgba(20,20,40,0.95)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      roundRect(ctx, cx, cardY, cardW, cardH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(tierNames[c.tier] || '', cx + cardW / 2, cardY + 20);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(c.name, cx + cardW / 2, cardY + 55);

      ctx.fillStyle = '#ccc';
      ctx.font = '13px monospace';
      wrapText(ctx, c.desc, cx + 15, cardY + 90, cardW - 30, 18);

      if (c.unique) {
        ctx.fillStyle = '#ffaa00';
        ctx.font = '10px monospace';
        ctx.fillText('UNIQUE', cx + cardW / 2, cardY + cardH - 18);
      }
    }

    const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Auto-pick in ${Math.max(0, Math.ceil(timer))}s  |  Press 1-3`, this.canvas.width / 2, this.canvas.height - 40);
    ctx.globalAlpha = 1;
  }

  hitTestUpgradeCard(mx, my, cards) {
    const cardW = 200;
    const cardH = 200;
    const gap = 30;
    const totalW = cards.length * cardW + (cards.length - 1) * gap;
    const startX = (this.canvas.width - totalW) / 2;
    const cardY = (this.canvas.height - cardH) / 2 + 20;
    for (let i = 0; i < cards.length; i++) {
      const cx = startX + i * (cardW + gap);
      if (mx >= cx && mx <= cx + cardW && my >= cardY && my <= cardY + cardH) return i;
    }
    return -1;
  }

  drawBossIncoming(ctx, timer, wave) {
    ctx.fillStyle = timer > 1.3 ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const scale = Math.min(1, 1.5 - timer);
    ctx.save();
    ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#ff2266';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BOSS INCOMING', 0, -20);

    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText('Wave ' + wave, 0, 36);

    ctx.restore();
  }

  drawZoneTransition(ctx, zone, timer, duration) {
    const progress = Math.max(0, Math.min(1, 1 - timer / duration));
    const fade = Math.sin(progress * Math.PI);
    ctx.fillStyle = `rgba(0,0,0,${0.35 + fade * 0.35})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const index = getZoneIndex(zone.id) + 1;
    ctx.save();
    ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    ctx.scale(0.94 + fade * 0.06, 0.94 + fade * 0.06);
    ctx.globalAlpha = 0.55 + fade * 0.45;
    ctx.fillStyle = '#00ccff';
    ctx.font = 'bold 38px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Zone ${index} \u2014 ${zone.name}`, 0, 0);
    ctx.restore();
    ctx.globalAlpha = 1;
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
    const slide = boss.healthBarSlide || 0;
    const eased = slide < 1 ? 1 - (1 - slide) * (1 - slide) : 1;
    const barY = 56 - (1 - eased) * 80;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

    const hpRatio = boss.health / boss.maxHealth;
    ctx.fillStyle = boss.phase === 2 ? '#ff2266' : '#cc00ff';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    const label = (boss.name || 'BOSS').toUpperCase();
    ctx.fillText(label, this.canvas.width / 2, barY + barH + 14);
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
    ctx.fillText('Escape to pause  |  M to mute  |  Boss every 5th wave', this.canvas.width / 2, this.canvas.height / 2 + 32);

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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let ly = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, ly);
      line = w;
      ly += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, ly);
}
