# Phase 0 Research: Phase 2 Expansion

**Date**: 2026-11-02 | **Plan**: [plan.md](plan.md) | **Spec**: [spec.md](spec.md)

All unknowns are resolved from `phase2.md`, the existing codebase, and the project constitution.
No external dependencies or web research are required because the runtime is the browser's
Canvas and Web Audio APIs.

## Decision 1 — Keep the static ordered-script architecture

**Decision**: Keep the current plain browser script files loaded in dependency order from
`index.html`; add `zones.js`, `weapons.js`, and `metaProgress.js` the same way.

**Rationale**: This preserves the zero-build requirement and still allows `index.html` to be
opened directly. Native ES modules would break direct `file://` loading in common browsers because
of module CORS rules.

**Alternatives considered**: Native ES modules with `<script type="module">` (rejected: breaks
direct-open workflow without a server); a bundler or module loader (rejected: violates zero-build).

## Decision 2 — One seeded run RNG for gameplay, separate source for cosmetics

**Decision**: Generate a run seed once at run start and use a small deterministic PRNG
(mulberry32-style) for wave composition, spawn edges, power-up drops, asteroid count, boss
summon angles, Mimic movement bursts, and upgrade-card selection. Keep a separate
non-deterministic source for particles, screen shake, and audio noise.

**Rationale**: The constitution requires a single run-scoped source for gameplay-affecting
randomness while cosmetic effects do not need reproduction. This also makes bug reports and
manual validation repeatable.

**Alternatives considered**: `Math.random()` everywhere (rejected: not reproducible);
a full third-party PRNG (rejected: unnecessary dependency).

## Decision 3 — Content registries instead of behavior branches

**Decision**: Represent upgrades, enemies, bosses, zones, weapons, and Hangar items as data
registries consumed by generic systems. Branches are limited to genuinely distinct behavior
strategies such as movement or firing patterns.

**Rationale**: Phase 2 requires data-driven definitions so Phase 3 can extend content without
rewriting systems. It also keeps exact values auditable in one place per content type.

**Alternatives considered**: Per-enemy and per-upgrade `if`/`else` chains (rejected: violates the
constitution and makes Phase 3 extension expensive).

## Decision 4 — Reconcile the player baseline to the Phase 2 restatement

**Decision**: Set the base player to 3 HP, 250 px/s movement, 150 px dash distance, and a
1.5-second dash cooldown. Keep the existing 0.15-second dash window and derive dash velocity from
the required 150 px distance. Normalize weapon timing to shots per second so Pulse Cannon is
exactly 6 shots/s.

**Rationale**: `phase2.md` Operating Rule 6 is authoritative and the current code uses 5 HP,
300 px/s, a shorter dash, and a 6.67 shots/s fire rate. The values must match exactly for Phase 2
acceptance.

**Alternatives considered**: Preserve current values (rejected: contradicts the active spec);
add a tuning layer with both values (rejected: creates two sources of truth).

## Decision 5 — Boss waves are boss-only plus boss summons

**Decision**: Apply the `4 + floor(wave × 1.5)` enemy-count formula to non-boss waves. A boss wave
spawns its boss and any bosses' own summons, not a separate regular-enemy batch.

**Rationale**: `phase2.md` defines boss cadence and boss summons but does not specify a second
regular wave on boss waves. This preserves current behavior and keeps boss encounters readable.

**Alternatives considered**: Apply the formula plus a boss (rejected: far above the intended
concurrency and not specified); treat boss waves as normal waves with three placeholder enemies
(rejected: current placeholder behavior is not a contract).

## Decision 6 — Deterministic stack rules for non-unique cards

**Decision**:
- Overclock: multiply shots per second by 1.15 per stack.
- Armor Plating: add 1 max HP per stack.
- Quick Dash: subtract 0.3 seconds per stack, clamped to a 0.1-second minimum.
- Scattershot: split into `2 × stacks` total projectiles on impact.
- Magnet: multiply pickup radius by 2 per stack.
- Chain Lightning: keep the every-fifth-hit trigger and add one extra arc target per stack.
- Afterburn: add 1 trail damage per stack on each trail tick.
- Ghost Dash: add 1 dash-contact damage per stack.
- Bouncer: allow one wall ricochet per stack.

**Rationale**: Phase 2 requires all non-unique cards to stack infinitely but does not define each
stack's numeric effect. These rules are additive or multiplicative, bounded, and testable.

**Alternatives considered**: Treat all re-picks as no-ops after the first (rejected: violates
"stack infinitely"); use unexplained exponential growth (rejected: harder to validate and balance).

## Decision 7 — Persist a single meta profile and migrate the legacy score

**Decision**: Use `voidbreaker.meta` as the only persistent key with
`{ shards, unlocks, bestWave, bestScore }`. On load, wrap parsing in try/catch and fall back to
zeroed defaults. If the new key is absent, seed `bestScore` from the legacy
`voidbreaker_highscore` key once and then write the new profile.

**Rationale**: Phase 2 specifies the key and fallback behavior, and the existing Phase 1 build
already stores a high score under the legacy key. Migration avoids losing player progress.

**Alternatives considered**: Keep both keys permanently (rejected: violates the single-key
contract); drop the legacy score (rejected: regresses Phase 1 persistence).

## Decision 8 — Extend the current state machine instead of replacing it

**Decision**: Keep `menu`, `playing`, `upgrade_pick`, and `gameover`; add `hangar` for pre-run
selection. Model boss-incoming, zone-transition, and pause as overlays or flags on `playing`.
Upgrade auto-pick remains paused when the game is paused.

**Rationale**: The existing loop already handles these states and overlays. Extending it minimizes
regression risk and keeps the run lifecycle explicit.

**Alternatives considered**: A new scene-graph or state library (rejected: adds dependency and
complexity); separate pages per screen (rejected: breaks the single-canvas game and persistence
flow).

## Decision 9 — Zone system as a data layer plus hazard entities

**Decision**: Define zones as registry entries with a wave range, name, background treatment, and
hazard type. Track `currentZone` on the run. The background treatment is always the existing Phase 1
arena; draw that arena plus the fog/hazard layer beneath entities, with no external background art.
Represent asteroids as hazard entities with position, radius, and HP; use the seeded RNG for their
count and placement once per run. Nebula surge is a timed modifier on enemy speed.

**Rationale**: This satisfies the zone, asteroid, and fog contracts while keeping hazards
separable from enemy AI and UI.

**Alternatives considered**: Hardcode zone checks in `main.js` (rejected: not data-driven); make
asteroids enemies (rejected: wrong collision and drop semantics).

## Decision 10 — Weapon classes as definitions plus fire controllers

**Decision**: Store the four weapons as data definitions and pair each with a small fire behavior
for projectile, pellet, continuous beam, or homing missile. Extend the bullet pool to support
weapon variants and add energy state to the player. Laser damage ticks count toward Chain
Lightning every fifth tick.

**Rationale**: The weapon table has four fundamentally different firing models, so a pure data
table is not enough; a shared definition plus a fire strategy keeps values centralized and
behavior explicit.

**Alternatives considered**: One generic bullet function with many branches (rejected: hard to
maintain and audit); separate unrelated weapon classes with duplicated damage logic (rejected:
diverges from the exact shared table).

## Decision 11 — Boss factory with snapshot support

**Decision**: Generalize `spawnBoss(wave, ...)` to select Dreadnought, Nemesis, or The Void from a
boss registry and wave/cycle. The Nemesis receives a deep snapshot of `player.upgrades`, the
derived upgrade modifiers, and the selected weapon at wave-10 start. The Void receives a repeat
cycle number derived from its wave.

**Rationale**: Bosses share the "spawn, update, draw, take damage, health bar" lifecycle but differ
in attack patterns and scaling. A factory keeps `main.js` stable.

**Alternatives considered**: Keep one boss class with mode flags (rejected: makes exact per-boss
behavior harder to audit); separate boss modules (rejected: unnecessary file sprawl for a
zero-build project).

## Decision 12 — Manual validation with deterministic DevTools probes

**Decision**: Validate with a documented manual playthrough matrix in Chrome, Firefox, and Edge,
plus temporary DevTools state changes to reach late waves and bosses. Do not ship a debug menu or
add a test runner.

**Rationale**: The project intentionally has no build step or dependencies, and the constitution's
acceptance gate is a full playthrough with zero console errors. Temporary probes give fast access
to late-game states without expanding the shipped surface.

**Alternatives considered**: Add a test framework (rejected: violates zero-build); ship a debug
menu (rejected: unlisted feature); only test early waves manually (rejected: cannot verify bosses
or Zone 3).

## Decision 13 — Conservative defaults for unspecified effect magnitudes

**Decision**: Use the clarified defaults: Shielded Drone 60 px/s and no ranged attack; The Void
pulls player/enemies at 80 px/s² and projectiles at 40 px/s², capped at 120 px/s; Black Hole
120 px radius, 1.5s duration, 160 px/s² pull, 1 damage per 0.25s per enemy; Overload 3 damage to
all on-screen enemies every 10th kill; Twin Ship 40 px offset, mirroring the player's fire rate
and weapon damage with no extra upgrade triggers.

**Rationale**: These values make every effect testable and deterministic without expanding scope
or introducing hidden balance assumptions. They are conservative enough to avoid trivializing
boss encounters.

**Alternatives considered**: Block implementation until exact values are supplied (rejected:
unnecessary delay); use minimal placeholder values (rejected: weak, forgettable effects).

## Decision 14 — `waves_survived` counts fully cleared waves

**Decision**: The shard formula's `waves_survived` term counts waves the player fully cleared.
Dying during wave 7 after clearing waves 1–6 awards 6 waves.

**Rationale**: The reward then matches completed milestones and never pays for a wave the player
did not survive.

**Alternatives considered**: Count the highest wave reached (rejected: over-rewards mid-wave
deaths and makes the summary ambiguous).
