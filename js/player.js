const PLAYER_RADIUS = 14;
const MOVE_SPEED = 300;
const FIRE_RATE = 0.15;
const DASH_SPEED = 600;
const DASH_DURATION = 0.15;
const DASH_COOLDOWN = 1.5;
const MAX_HEALTH = 5;
const JOYSTICK_RADIUS = 55;
const DASH_BTN_RADIUS = 30;

class Player {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.radius = PLAYER_RADIUS;
    this.angle = 0;
    this.speed = MOVE_SPEED;
    this.health = MAX_HEALTH;
    this.maxHealth = MAX_HEALTH;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashDir = { x: 0, y: 0 };
    this.invulnerable = false;
    this.invulnTimer = 0;
    this.fireTimer = 0;
    this.fireRate = FIRE_RATE;
    this.keys = {};
    this.powerups = {};
    this.inputBlocked = false;

    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    this.joystick = { active: false, id: -1, sx: 0, sy: 0, cx: 0, cy: 0, dx: 0, dy: 0 };
    this.aimTouch = { active: false, id: -1, x: 0, y: 0 };
    this.touchAimX = this.x;
    this.touchAimY = this.y;
    this.dashTouched = false;

    this.moveDx = 0;
    this.moveDy = 0;
    this.muzzleFlash = 0;
    this.thrusterTimer = 0;

    this.setupInput();
  }

  canvasCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (this.canvas.width / rect.width),
      y: (clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }

  setupInput() {
    document.addEventListener('keydown', e => { this.keys[e.key.toLowerCase()] = true; });
    document.addEventListener('keyup', e => { this.keys[e.key.toLowerCase()] = false; });
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    });
    this.canvas.addEventListener('mousedown', e => {
      if (e.button === 0) this.mouseDown = true;
    });
    document.addEventListener('mouseup', e => {
      if (e.button === 0) this.mouseDown = false;
    });

    if (!this.isTouchDevice) return;

    this.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const p = this.canvasCoords(t.clientX, t.clientY);
        const dashBtnX = this.canvas.width - 50;
        const dashBtnY = this.canvas.height - 55;
        if (Math.sqrt((p.x - dashBtnX) ** 2 + (p.y - dashBtnY) ** 2) < DASH_BTN_RADIUS + 10) {
          this.dashTouched = true; this.touchDash(); continue;
        }
        if (p.x < this.canvas.width * 0.45 && !this.joystick.active) {
          this.joystick.active = true; this.joystick.id = t.identifier;
          this.joystick.sx = p.x; this.joystick.sy = p.y;
          this.joystick.cx = p.x; this.joystick.cy = p.y;
          this.joystick.dx = 0; this.joystick.dy = 0;
        } else if (!this.aimTouch.active) {
          this.aimTouch.active = true; this.aimTouch.id = t.identifier;
          this.aimTouch.x = p.x; this.aimTouch.y = p.y;
          this.touchAimX = p.x; this.touchAimY = p.y;
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const p = this.canvasCoords(t.clientX, t.clientY);
        if (t.identifier === this.joystick.id && this.joystick.active) {
          this.joystick.cx = p.x; this.joystick.cy = p.y;
          let dx = p.x - this.joystick.sx, dy = p.y - this.joystick.sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > JOYSTICK_RADIUS) {
            dx = (dx / dist) * JOYSTICK_RADIUS; dy = (dy / dist) * JOYSTICK_RADIUS;
            this.joystick.cx = this.joystick.sx + dx; this.joystick.cy = this.joystick.sy + dy;
          }
          this.joystick.dx = dx / JOYSTICK_RADIUS; this.joystick.dy = dy / JOYSTICK_RADIUS;
        }
        if (t.identifier === this.aimTouch.id && this.aimTouch.active) {
          this.aimTouch.x = p.x; this.aimTouch.y = p.y;
          this.touchAimX = p.x; this.touchAimY = p.y;
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.joystick.id && this.joystick.active) {
          this.joystick.active = false; this.joystick.id = -1; this.joystick.dx = 0; this.joystick.dy = 0;
        }
        if (t.identifier === this.aimTouch.id && this.aimTouch.active) {
          this.aimTouch.active = false; this.aimTouch.id = -1;
        }
        this.dashTouched = false;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchcancel', e => {
      this.joystick.active = false; this.joystick.id = -1; this.joystick.dx = 0; this.joystick.dy = 0;
      this.aimTouch.active = false; this.aimTouch.id = -1; this.dashTouched = false;
    }, { passive: false });
  }

  touchDash() {
    if (this.isDashing || this.dashCooldown > 0) return;
    const dx = this.joystick.dx || 0, dy = this.joystick.dy || 0;
    if (dx === 0 && dy === 0) return;
    this.isDashing = true; this.dashTimer = DASH_DURATION; this.dashCooldown = DASH_COOLDOWN;
    this.dashDir = { x: dx, y: dy };
    this.invulnerable = true; this.invulnTimer = DASH_DURATION + 0.1;
    sound.dash();
  }

  update(dt) {
    if (this.inputBlocked) return;

    if (this.invulnerable) {
      this.invulnTimer -= dt;
      if (this.invulnTimer <= 0) this.invulnerable = false;
    }

    this.dashCooldown -= dt;
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;

    if (this.isDashing) {
      this.dashTimer -= dt;
      this.x += this.dashDir.x * DASH_SPEED * dt;
      this.y += this.dashDir.y * DASH_SPEED * dt;
      if (this.dashTimer <= 0) this.isDashing = false;
    } else {
      let dx = 0, dy = 0;

      if (this.joystick.active) {
        dx = this.joystick.dx; dy = this.joystick.dy;
      } else {
        if (this.keys['w'] || this.keys['arrowup']) dy = -1;
        if (this.keys['s'] || this.keys['arrowdown']) dy = 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx = -1;
        if (this.keys['d'] || this.keys['arrowright']) dx = 1;
        if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
      }

      this.moveDx = dx;
      this.moveDy = dy;
      this.x += dx * this.speed * dt;
      this.y += dy * this.speed * dt;

      if (this.joystick.active && (this.keys['shift'] || this.dashTouched) && this.dashCooldown <= 0 && (dx !== 0 || dy !== 0)) {
        this.isDashing = true; this.dashTimer = DASH_DURATION; this.dashCooldown = DASH_COOLDOWN;
        this.dashDir = { x: dx, y: dy };
        this.invulnerable = true; this.invulnTimer = DASH_DURATION + 0.1;
        sound.dash();
      }
    }

    this.x = Math.max(this.radius, Math.min(this.canvas.width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(this.canvas.height - this.radius, this.y));

    if (this.joystick.active) {
      const aimDx = this.touchAimX - this.x, aimDy = this.touchAimY - this.y;
      this.angle = Math.atan2(aimDy, aimDx);
    } else {
      const aimDx = this.mouseX - this.x, aimDy = this.mouseY - this.y;
      this.angle = Math.atan2(aimDy, aimDx);
    }

    this.fireTimer -= dt;
    this.shooting = (this.mouseDown || this.keys[' '] || this.aimTouch.active) && this.fireTimer <= 0;
    if (this.shooting) {
      this.fireTimer = this.fireRate;
      this.muzzleFlash = 0.06;
    }
  }

  takeDamage() {
    if (this.invulnerable) return false;
    if (this.powerups.shield) {
      this.powerups.shield = false;
      this.invulnerable = true;
      this.invulnTimer = 0.5;
      return false;
    }
    this.health--;
    this.invulnerable = true;
    this.invulnTimer = 1.0;
    return this.health <= 0;
  }

  reset() {
    this.x = this.canvas.width / 2;
    this.y = this.canvas.height / 2;
    this.health = MAX_HEALTH;
    this.isDashing = false;
    this.invulnerable = false;
    this.invulnTimer = 0;
    this.dashCooldown = 0;
    this.dashTimer = 0;
    this.fireTimer = 0;
    this.powerups = {};
    this.joystick.active = false;
    this.joystick.id = -1;
    this.joystick.dx = 0;
    this.joystick.dy = 0;
    this.aimTouch.active = false;
    this.aimTouch.id = -1;
    this.moveDx = 0;
    this.moveDy = 0;
    this.muzzleFlash = 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.powerups.shield) {
      ctx.globalAlpha = 0.15 + Math.sin(Date.now() / 200) * 0.08;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (this.invulnerable && Math.floor(this.invulnTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    if (this.moveDx !== 0 || this.moveDy !== 0) {
      const tAngle = Math.atan2(-this.moveDy, -this.moveDx);
      ctx.save();
      ctx.rotate(tAngle - this.angle);
      ctx.globalAlpha = 0.5 + Math.random() * 0.3;
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.5, -3);
      ctx.lineTo(-this.radius - 8 - Math.random() * 6, 0);
      ctx.lineTo(-this.radius * 0.5, 3);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    if (this.muzzleFlash > 0) {
      ctx.fillStyle = '#ffff88';
      ctx.globalAlpha = this.muzzleFlash / 0.06;
      ctx.beginPath();
      ctx.arc(this.radius + 4, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = '#00ccff';
    ctx.beginPath();
    ctx.moveTo(this.radius + 4, 0);
    ctx.lineTo(-this.radius, -this.radius * 0.7);
    ctx.lineTo(-this.radius * 0.5, 0);
    ctx.lineTo(-this.radius, this.radius * 0.7);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawTouchControls(ctx) {
    if (!this.isTouchDevice) return;

    if (this.joystick.active) {
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.joystick.sx, this.joystick.sy, JOYSTICK_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.joystick.cx, this.joystick.cy, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (this.aimTouch.active) {
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.aimTouch.x, this.aimTouch.y, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const dashBtnX = this.canvas.width - 50;
    const dashBtnY = this.canvas.height - 55;
    const cd = this.dashCooldown;
    ctx.globalAlpha = cd > 0 ? 0.3 : 0.5;
    ctx.fillStyle = '#00ccff';
    ctx.beginPath();
    ctx.arc(dashBtnX, dashBtnY, DASH_BTN_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = cd > 0 ? 0.4 : 0.9;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DASH', dashBtnX, dashBtnY);
    if (cd > 0) {
      ctx.font = '10px monospace';
      ctx.fillStyle = '#ff4444';
      ctx.fillText(Math.ceil(cd) + 's', dashBtnX, dashBtnY + 16);
    }
    ctx.globalAlpha = 1;
  }
}
