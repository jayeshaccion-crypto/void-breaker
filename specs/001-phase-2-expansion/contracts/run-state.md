# Run State Contract

**Feature**: Phase 2 Expansion | **Plan**: [../plan.md](../plan.md) | **Spec**: [../spec.md](../spec.md)

This contract defines the observable game states, transitions, input events, and render order.

## States

| State | Meaning | Gameplay updates |
|---|---|---|
| `menu` | Title screen before a run | No |
| `hangar` | Pre-run weapon selection and permanent upgrades | No |
| `playing` | Active run | Yes, unless paused |
| `upgrade_pick` | Three-card draft after a wave clear | Only the draft timer |
| `gameover` | End-of-run summary | No |

Overlays on `playing`:

- `boss_incoming`: 1.5-second flash and title card before the boss exists.
- `zone_transition`: short zone title card on wave 6 and wave 11 entry.
- `paused`: Escape overlay; freezes gameplay, boss timers, zone timers, and the upgrade timer.

## Transitions

```text
menu -> hangar                       Enter, Space, or click
hangar -> playing                    Launch action with a valid weapon
playing -> upgrade_pick              Wave cleared (regular or boss)
upgrade_pick -> playing              Card chosen or 2-second auto-pick
playing -> gameover                  Player health reaches 0
playing -> paused overlay            Escape
paused overlay -> playing            Escape
paused overlay -> hangar             Quit to Hangar (no award)
gameover -> hangar                   Hangar action
gameover -> playing                  Play Again action (fresh run)
```

Rules:

- Boss-incoming and zone-transition overlays resolve before normal gameplay resumes.
- A boss cannot spawn before its incoming card finishes.
- A zone hazard layer cannot activate before its title card ends.
- The upgrade draft never resolves with no card; if fewer than three cards are eligible, the
  shown cards are still valid picks.
- Pausing during normal play freezes the upgrade auto-pick timer.
- Pausing during `upgrade_pick` is not a new Phase 2 requirement; if supported, it must freeze the
  timer rather than let it expire invisibly.

## Input Contract

| Input | Context | Effect |
|---|---|---|
| W/A/S/D or arrows | `playing` | Move |
| Mouse move | `playing` | Aim |
| Left mouse or Space | `playing` | Fire while held |
| Shift | `playing` | Dash |
| Q / q | `playing` | Launch Black Hole when owned and off cooldown |
| Escape | `playing` | Toggle pause |
| M / m | Any state | Toggle mute |
| 1 / 2 / 3 | `upgrade_pick` | Pick the corresponding card |
| Click card | `upgrade_pick` | Pick the clicked card |
| Enter / Space / click | `menu` | Enter Hangar |
| Click Hangar controls | `hangar` | Purchase upgrade or select weapon |
| Click Quit to Hangar | `paused` | End the run without shards or best-record updates |
| Click summary buttons | `gameover` | Hangar or Play Again |
| Touch controls | `playing` | Preserve Phase 1 movement, aim/fire, and dash |

Input invariants:

- Input must not leak from an overlay into gameplay.
- Keyboard and mouse remain the primary Phase 2 validation path.
- Touch behavior is preserved, but no new touch feature is added.
- Muting does not pause the game.
- Q does nothing when Black Hole is not owned or its 30-second cooldown is active.
- The game must not start a second run from a click on an overlay control.

## Update Order

For `playing` with no pause:

1. Player movement, dash, aim, and fire intent.
2. Boss-incoming countdown or normal wave spawning.
3. Zone hazard update (asteroid state, fog, surge timer).
4. Enemy updates and off-screen resolution.
5. Boss update and attacks/summons.
6. Collision resolution: player/enemy, player/boss, player bullets/enemy, player bullets/boss,
   enemy bullets/player, power-up pickup.
7. Bullet pool update.
8. Particle update.
9. Power-up update.
10. Streak timer update.
11. Wave-clear detection and upgrade-draft trigger.

For `upgrade_pick`:

1. Decrement the 2-second timer.
2. If it reaches zero, auto-pick one shown card.
3. Apply the card and start the next wave.

## Render Order

For `playing`:

1. Arena background and stars.
2. Zone background and hazard layer (asteroids, fog).
3. Player.
4. Enemies.
5. Boss.
6. Projectiles.
7. Power-ups.
8. Particles.
9. Edge indicators, boss health bar, and HUD.
10. Overlays: boss incoming, zone transition, pause, mute indicator.

For `upgrade_pick`, render the frozen playfield and then the card overlay. For `gameover`, render
the frozen playfield and then the summary. For `menu` and `hangar`, render the menu/hangar surface
without gameplay entities.

## UI Surfaces

- **Menu**: title, controls, best score, start action.
- **Hangar**: shard balance, best wave/score, weapon selection with locked states, five Hangar
  upgrades with cost, effect, cap, and affordability state, launch action.
- **HUD**: health, score, wave, high score, streak multiplier, active power-ups, boss bar when a
  boss is active.
- **Upgrade draft**: three cards with tier, name, description, unique marker, countdown, and
  auto-pick hint.
- **Boss incoming**: full-screen flash and "BOSS INCOMING" title card.
- **Zone transition**: "Zone N — [Name]" title card.
- **Pause overlay**: resume hint, mute state, and Quit to Hangar.
- **Game over**: final wave, final score, shard total, three-part breakdown, kills, power-ups,
  upgrades taken, Hangar, and Play Again.

## Pause, Mute, and Audio Contract

- Escape pauses only during active gameplay and shows the pause overlay.
- Mute toggles master audio without changing the game state.
- Audio layers enter and crossfade without blocking the frame loop.
- Pausing should not leave a scheduled audio note playing over silence; the mute path must remain
  safe in either state.

## Acceptance Checks

- The state flow can be completed from menu through Hangar, a full run, and summary.
- Overlays never allow gameplay input to leak.
- Wave 6 and wave 11 show their zone cards.
- Wave 5, 10, and 15 show boss incoming before the boss.
- Escape and M behave consistently in all states where they are defined.
- Quit to Hangar from the pause overlay ends the run without awarding shards or updating bests.
- The end-of-run summary is shown once and its actions start the correct next state.
