# Implementation Plan: Phase 2 Expansion

**Branch**: `N/A — no branch created (working on master)` | **Date**: 2026-11-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-phase-2-expansion/spec.md`

## Summary

Implement the Phase 2 expansion on top of the existing Phase 1 game and the partially complete
Milestones 1–2. The work adds the full 12-card upgrade system, three bosses, three zones, three
new enemy types, four weapon classes, persistent Void Shard progression and Hangar upgrades, a
layered synthesized soundtrack, and the end-of-run summary.

The technical approach is to preserve the zero-build browser architecture while replacing
scattered conditionals with data-driven registries, routing gameplay randomness through one
run-scoped seed, extending the existing state machine for Hangar and zone transitions, and
keeping all rendering and audio inside the current Canvas and Web Audio pipeline. Existing
Milestone 1–2 code is reconciled and completed rather than rebuilt.

## Technical Context

**Language/Version**: JavaScript ES6 browser script files loaded in dependency order by
`index.html`; HTML5 Canvas; Web Audio API. No transpilation, bundler, or package runtime.

**Primary Dependencies**: None. Browser APIs only.

**Storage**: Browser `localStorage`, single key `voidbreaker.meta`, with legacy high-score
migration from `voidbreaker_highscore`.

**Testing**: Manual end-to-end browser playthroughs in current Chrome, Firefox, and Edge, with a
zero-console-error gate. No automated test runner is added because it would violate the
zero-build, zero-dependency runtime constraint. Deterministic checks use temporary DevTools
probes against the live run state; no debug UI ships.

**Target Platform**: Desktop browsers at 960x540 logical resolution, scaled and letterboxed to the
viewport. Existing Phase 1 touch controls are preserved but receive no new Phase 2 features.

**Project Type**: Single-page static browser game. No backend and no service API.

**Performance Goals**: Sustained 60 fps target; hard caps of 40 concurrent enemies and 200
concurrent projectiles; pooled bullets and particles; no per-shot or per-frame allocation in hot
paths.

**Constraints**: No build step, no external assets, no network services, and no features beyond
`phase2.md`. All numeric gameplay values are exact. The game must remain runnable by opening
`index.html` directly or serving the repository statically.

**Scale/Scope**: Eight Phase 2 milestones (with Milestones 1–2 already partially implemented),
12 upgrades, 3 bosses, 3 zones, 3 new enemy types, 4 weapons, 5 Hangar upgrades, 1 persistent meta
profile, and 1 layered soundtrack.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Vanilla-Only, Zero-Build Runtime**: PASS. The plan adds `zones.js`, `weapons.js`, and
  `metaProgress.js` as plain ES6 browser scripts loaded in dependency order plus matching
  `<script>` entries; no framework, engine, build tool, dependency, or external asset is
  introduced. This matches Constitution v1.0.1.
- **Deterministic Gameplay Contracts**: PASS. All values are taken from `phase2.md` and the
  Phase 2 spec; content becomes registry data; a seeded run RNG replaces gameplay `Math.random`
  use while cosmetic randomness remains separate.
- **Phase-Scoped Delivery**: PASS. Work follows the Milestone 1–8 order and reconciles the
  existing Milestones 1–2 before later work. No unlisted content is planned; deferred Phase 3 and
  accessibility items remain deferred.
- **Performance and Resource Discipline**: PASS. The plan keeps the 960x540 letterboxed canvas,
  delta-time loop, 40-enemy/200-bullet caps, and adds particle pooling alongside the existing
  bullet pool; persistence uses the required key and fallback behavior.
- **Playable, Testable Acceptance**: PASS. Every milestone ends with a full playthrough, exact
  value checklist, Phase 1 regression pass, and explicit go-ahead gate.

### Post-Design Re-evaluation

Re-checked after research and design: PASS. The design keeps all new content in registry data,
adds one seeded RNG, and does not introduce a build step or external dependency. Two
reconciliation items are recorded as implementation constraints rather than violations: the
existing player baseline must align to the clarified Phase 2 values, and the current high-score
key must migrate into `voidbreaker.meta`.

## Project Structure

### Documentation (this feature)

```text
specs/001-phase-2-expansion/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 2 entity and state model
├── quickstart.md        # Phase 2 validation guide
├── contracts/
│   ├── content-schema.md
│   ├── persistence.md
│   └── run-state.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Created by /speckit.tasks, not by this command
```

### Source Code (repository root)

```text
index.html              # Script load order; add new Phase 2 scripts here
style.css               # Existing full-viewport canvas styling
js/
├── main.js             # Loop, state machine, collisions, run orchestration
├── player.js           # Movement, dash, health, input, player visuals
├── enemies.js          # Enemy registry and behavior dispatch
├── boss.js             # Boss registry, Dreadnought, Nemesis, The Void
├── bullets.js          # Pooled player/enemy projectiles, weapon variants
├── powerups.js         # Drop generation and temporary effects
├── waveManager.js      # Wave counts, composition, boss cadence, zone thresholds
├── particles.js        # Particle bursts, screen shake, pooled particles
├── ui.js               # HUD, Hangar, upgrade draft, boss bar, run summary
├── audio.js            # Four-layer synthesized soundtrack and SFX
├── upgradeManager.js   # 12-card registry and draft logic
├── zones.js            # Zone registry, asteroids, fog, surge hazards
├── weapons.js          # Four weapon definitions and fire controllers
└── metaProgress.js     # Void Shards, Hangar purchases, persistence migration
```

**Structure Decision**: Single static browser project at the repository root. Existing file
boundaries are kept; three new files hold the new systems. No `src/` or `tests/` tree is added
because that would change the zero-build layout and add unrequested structure.

## Implementation Strategy

### Milestone 0 — Baseline Reconciliation and Shared Foundations

This is preparatory work, not a Phase 2 feature milestone.

- Align the player baseline to the Phase 2 restatement: 3 HP, 250 px/s movement, 150 px dash
  distance over the existing 0.15-second dash window, and 1.5-second base dash cooldown.
- Normalize weapon timing to shots per second so Pulse Cannon is exactly 6 shots/s and Overclock
  can apply an exact +15% multiplier.
- Introduce a run-scoped seeded RNG and route wave composition, spawn edges, drops, asteroid
  count, boss summon angles, and card selection through it.
- Introduce run statistics and a central content registry shape used by later milestones.
- Replace the legacy high-score read/write path with the `voidbreaker.meta` profile and a
  one-time legacy migration.

### Milestone 1 — Complete the Upgrade Draft

- Keep the existing 12-card registry and upgrade screen.
- Enforce exact tier weights, no duplicates per offer, unique-card removal, two-second auto-pick,
  and the documented stacking rules.
- Replace the approximate Overclock multiplier with the exact fire-rate multiplier.
- Apply all Tier 1 effects, including immediate health and dash changes.

### Milestone 2 — Boss Framework and Dreadnought

- Generalize the existing boss path into a wave-driven boss factory while keeping the Dreadnought
  behavior and health-bar slide.
- Keep the Dreadnought's 5° per 1/60s tick (300°/s) spiral rotation, applied with delta time.
- Keep the 1.5-second boss incoming card.
- Add boss identity display and phase-aware health bar coloring.
- Ensure boss defeats feed the wave-clear and upgrade flow.

### Milestone 3 — Zone 2 Asteroid Field

- Add the zone registry and current-zone tracking to the run.
- Add the zone title card on entry.
- Add seeded 6–10 asteroid placement, 8 HP, projectile blocking, 1-heart contact damage, and
  destruction drops at the current global rate.
- Draw the Phase 1 arena background and hazard layer beneath all entities; do not add new
  background art.

### Milestone 4 — New Enemy Types

- Add Splitter, Shielded Drone, and Mimic as registry entries with exact stats and first
  appearance waves; the Shielded Drone uses 60 px/s and has no ranged attack.
- Add split-on-death Swarmers at 1 HP and 180 px/s without changing the Phase 1 Swarmer baseline.
- Add shield-arc collision, Black Hole shield stripping, Mimic shape/movement mirroring, and the
  hard fire-rate cap.
- Replace the current wave-count formula with `4 + floor(wave × 1.5)`, capped at 40 concurrent
  enemies. Boss waves remain boss-only plus boss summons.

### Milestone 5 — Weapon Classes and Tier 2/3 Cards

- Add Pulse Cannon, Shotgun Blaster, Laser Beam, and Seeker Missiles as data-driven weapon
  definitions with fire controllers.
- Add weapon selection to the Hangar, with locked states until Armory Access is purchased.
- Validate the unlocked weapon branches in M5 with a temporary seeded Armory Access unlock; the
  purchase flow is validated in M6.
- Implement energy drain/regeneration and forced cooldown for the Laser Beam.
- Implement missile nearest-target search, turn rate, and straight-fire fallback.
- Complete Chain Lightning, Afterburn, Ghost Dash, and Bouncer effects and their stack behavior.
- Implement the Tier 3 unique effects with the FR-043 defaults: Black Hole launches on Q with a
  30-second cooldown and 120 px/1.5s/160 px/s² behavior, Overload triggers every 10th kill for
  3 damage, and Twin Ship uses a 40 px offset mirroring the player's movement, fire rate, and
  weapon damage.
- Keep Scattershot on Pulse Cannon and Shotgun projectiles only; keep Chain Lightning on every fifth
  projectile hit or every fifth Laser damage tick.

### Milestone 6 — Void Shards, Hangar, and Persistent Upgrades

- Track score, fully cleared waves, boss kills, kills, power-ups, and upgrades for the run
  summary.
- Award shards with the exact formula and compute/persist the three-part breakdown, using fully
  cleared waves for `waves_survived` rather than the highest wave reached.
- Add Hangar spending for Hull Reinforcement, Afterburner, Armory Access, Bonus Drop Rate, and
  Head Start with exact costs, effects, and caps.
- Persist shards, unlocks, best wave (highest wave reached), and best score under
  `voidbreaker.meta`, including corrupt data fallback and legacy high-score migration.
- Apply Hangar effects at run start: max HP, dash cooldown, weapon unlocks, drop rate, and wave.

### Milestone 7 — Zone 3, Nemesis, and The Void

- Add the Nebula Core fog layer, 180 px visibility radius, and 30-second/4-second/40% surge.
- Add Nemesis with 200 HP, 64 px hitbox, and the wave-10 snapshot of upgrades and weapon.
- Add The Void with an 80 px/s² player/enemy pull, 40 px/s² projectile pull capped at 120 px/s,
  Splitter summons every 4 seconds, and 250 + 50 × cycle HP.
- Generalize boss spawning by wave and repeat cycle.
- Ensure zone and boss transitions compose cleanly with the upgrade draft.

### Milestone 8 — Layered Audio and End-of-Run Summary

- Replace the single-loop BGM with ambient, rhythm, intensity, and boss layers using gain ramps.
- Keep existing SFX and the M mute toggle.
- Add the end-of-run summary screen with final wave, score, shard breakdown, kills, power-ups,
  upgrades, and Hangar/Play Again actions.
- Keep Escape pause and the existing pause overlay working across all new states.
- Add Quit to Hangar from the pause overlay; quitting ends the run without shards or best-record
  updates.

### Cross-Cutting Work

- **State machine**: Extend the current states with `hangar` and zone-transition handling; keep
  the upgrade draft and boss incoming overlays explicit and pause-safe.
- **Update order**: Zone hazards, enemies, bosses, collisions, projectiles, particles, power-ups,
  then wave-clear detection. Draw the Phase 1 arena background, hazard layer, entities, projectiles,
  particles, then UI overlays.
- **Pooling**: Expand the bullet pool for weapon variants and add a fixed-capacity particle pool;
  never allocate in per-shot or per-frame hot paths.
- **Determinism**: Store the run seed and route gameplay randomness through it. Cosmetic
  particles, screen shake, and audio noise remain on a separate source.
- **Regression**: At every milestone, run the Phase 1 movement, aim, fire, dash, power-up, wave,
  score, pause, mute, and game-over checks.

## Risks and Mitigations

- **Restated baseline conflict**: Resolved by clarification. The current code uses 5 HP, 300 px/s,
  a shorter dash, and a 6.67 shots/s fire rate; Phase 2 Operating Rule 6 is authoritative, so
  Milestone 0 aligns to 3 HP, 250 px/s, a 150 px dash, 1.5s cooldown, and exactly 6 shots/s.
- **Boss-wave enemy count**: Resolved by clarification. Boss waves spawn only the boss plus its
  summons; the `4 + floor(wave × 1.5)` formula applies to non-boss waves.
- **Stack semantics**: Resolved by clarification. Non-unique cards use the deterministic
  linear/additive rules recorded in the spec (FR-042) and research.
- **Unspecified effect values**: Resolved by clarification. Shielded Drone, The Void, Black Hole,
  Overload, and Twin Ship use the conservative defaults in FR-043.
- **Long validation loops**: Later waves and bosses are reached through temporary DevTools state
  changes during validation; no debug controls ship.
- **Audio load**: Persistent oscillators and gain nodes are created once; no per-frame node
  creation, and the layer count is fixed at four.

## Validation Gates

- G1: Full run from entry screen through Hangar, all milestones, and game over or quit completes
  with zero console errors.
- G2: Every affected numeric value matches `phase2.md` exactly.
- G3: Phase 1 regression pass succeeds at every milestone.
- G4: The game holds the 60 fps target with 40 enemies and 200 projectiles on the reference
  desktop.
- G5: Each milestone stops with a report and waits for explicit go-ahead.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. No complexity exceptions are required.
