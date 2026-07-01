# Void Breaker — Project Spec

A small top-down 2D arcade space shooter built with vanilla HTML5 Canvas + JavaScript. Wave-based survival with power-ups. No external assets or build tools required.

## Goal
Build a playable browser game where the player pilots a ship in a fixed arena, fights escalating waves of enemies, collects power-ups, and tries to survive as long as possible. Game over on death, with a restart flow and a localStorage high score.

## Tech Stack
- HTML5 Canvas
- Vanilla JavaScript (ES6 modules), no frameworks
- WebAudio for simple sound effects (generated tones, no audio files)
- No build step — runs by opening `index.html` or via a simple static server

## File Structure
```
index.html
style.css
js/
  main.js          # game loop, state machine: menu / playing / gameover
  player.js        # movement, shooting, dash/dodge
  enemies.js        # enemy classes and behaviors
  bullets.js        # projectile pooling for player + enemy bullets
  powerups.js        # power-up spawning and effects
  waveManager.js     # spawn timing and difficulty curve
  ui.js             # HUD: health bar, score, wave number
  particles.js       # death bursts, screen shake
```

## Core Mechanics

### Player
- Move with WASD or arrow keys.
- Aim with mouse, fire with left-click or spacebar (auto-fire while held).
- Health: 3–5 hits before game over.
- Dash/dodge on Shift, short cooldown (~1.5s), brief invulnerability during dash.
- Visual: simple triangle shape pointing toward aim direction.

### Enemies
Introduce one new type every few waves:
1. **Tank** — slow, shoots straight bullets at the player periodically.
2. **Swarmer** — fast, rams directly into the player.
3. **Sniper** — stationary-ish, telegraphs (flashes/grows) for ~0.5s, then fires a fast bolt straight at the player's position.

All enemies spawn from screen edges and path toward the player or a fixed pattern.

### Waves
- Wave manager spawns a batch of enemies, waits for clear or timer, then starts the next wave.
- Each wave increases enemy count and mixes in more enemy types.
- Wave number displayed in HUD.

### Power-ups
Drop from defeated enemies (~20% chance per kill):
- **Spread Shot** — fires 3 bullets in a fan for a limited time.
- **Rapid Fire** — increases fire rate for a limited time.
- **Shield** — absorbs the next hit.
- **Health Pickup** — restores 1 health point.

### Scoring
- Points per kill, bonus per wave survived.
- High score persisted via `localStorage`.

### Game States
- **Menu**: title, "Press Start" / click to begin.
- **Playing**: main loop.
- **Game Over**: shows final score, high score, restart button.

## Visual Style
Minimal geometric shapes, no image assets:
- Player: triangle
- Tank: square
- Swarmer: small triangle/diamond
- Sniper: hexagon
- Bullets: small circles
- Particle burst (simple square/circle particles) on enemy death
- Screen shake on player hit

## Build Order (recommended milestones)
1. **Milestone 1**: Player movement + shooting + single enemy type (Swarmer) + collision detection + health + game over screen.
2. **Milestone 2**: Wave manager + score display + restart flow.
3. **Milestone 3**: Add Tank and Sniper enemy types + power-up drops and effects.
4. **Milestone 4**: Polish — particle effects, screen shake, WebAudio sound effects (simple beep/tones for shoot/hit/explosion), high score persistence.

## Stretch Goals (not required for v1)
- Boss enemy every 5th wave.
- Local two-player co-op.
- Weapon upgrade tree / persistent meta-progression.
- Gamepad/controller support.

## Notes for the coding agent
- Keep everything in vanilla JS/Canvas — no npm install required, so the game runs by just opening `index.html`.
- Use `requestAnimationFrame` for the game loop with delta-time based movement.
- Use simple object pooling for bullets/particles to avoid garbage collection stutter.
- Keep enemy/player logic in small classes with an `update(dt)` and `draw(ctx)` method each.
- Total expected size: roughly 500–800 lines across all files for v1.
