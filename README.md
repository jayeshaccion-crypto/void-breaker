# Void Breaker

A top-down 2D arcade space shooter built with vanilla HTML5 Canvas + JavaScript. No frameworks, no build tools, no external assets.

## Quick Start

Open `index.html` in a browser, or serve with any static server:

```bash
npx serve .
# or
python -m http.server 3000
```

## Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Move | WASD / Arrow keys | Left virtual joystick |
| Aim | Mouse | Right side touch |
| Fire | Left-click / Space | Hold right side (auto-fire) |
| Dash | Shift | Dash button (bottom-right) |
| Pause | Escape | — |

## Features

- **3 enemy types**: Swarmer (rams), Tank (shoots), Sniper (telegraphed fast bolt)
- **Boss every 5th wave**: Large octagon boss with 4 attack patterns and 2 phases
- **4 power-ups**: Spread Shot, Rapid Fire, Shield, Health Pickup (20% drop chance)
- **Wave-based difficulty**: Escalating enemy count and type mix
- **Kill streak multiplier**: Consecutive kills boost score (up to 3x)
- **Procedural audio**: WebAudio-generated sound effects + looping BGM
- **Mobile touch controls**: Virtual joystick + aim/fire + dash button
- **Visual polish**: Parallax starfield, thruster flame, muzzle flash, screen shake, hit flash
- **Persistence**: High score saved to localStorage
- **Edge indicators**: Arrows point to off-screen enemies

## File Structure

```
index.html          — Entry point
style.css           — Full-viewport canvas styling
js/
  main.js           — Game loop, state machine, collisions, starfield
  player.js         — Movement, shooting, dash, touch controls, visuals
  enemies.js        — Enemy classes (Swarmer, Tank, Sniper, Boss)
  bullets.js        — Object-pooled projectiles
  powerups.js       — Power-up drops and effects
  waveManager.js    — Wave spawning and difficulty curve
  particles.js      — Particle bursts and screen shake
  ui.js             — HUD, menus, edge indicators, boss health bar
  audio.js          — WebAudio sound effects and BGM
```

## Build Order

1. **Phase 1** — Player movement + shooting + Swarmer enemy + collision + health + game over + wave manager + power-ups + audio + mobile controls
2. **Phase 2** — Boss enemy, starfield background, thruster flame, muzzle flash, shield visual, hit flash, edge indicators, pause, kill streak multiplier

## Tech Stack

- HTML5 Canvas
- Vanilla JavaScript (ES6)
- Web Audio API (procedural sounds)
- No build step, no dependencies
