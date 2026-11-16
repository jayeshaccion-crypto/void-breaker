# Tasks: Phase 2 Expansion

**Input**: Design documents from `/specs/001-phase-2-expansion/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: No automated test runner is added. The constitution and plan require manual browser
validation, so each milestone ends with a validation task tied to `quickstart.md`.

**Organization**: Phases follow the exact `phase2.md` milestone order required by Constitution
Principle III. `[US1]`–`[US7]` labels preserve user-story traceability, but execution order is
milestone order. Setup and Foundational tasks correspond to Milestone 0.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: User story label for milestone implementation tasks; omitted for Setup, Foundational,
  and Polish
- Every task includes an exact file path or a specific design document path

## Path Conventions

- Runtime code: `js/*.js`
- Entry point: `index.html`
- Feature docs: `specs/001-phase-2-expansion/`
- Validation: `specs/001-phase-2-expansion/quickstart.md`

## Milestone to User Story Map

| Milestone | Phase | Primary stories |
|---|---|---|
| M0 Foundations | Phase 1-2 | Shared |
| M1 Upgrade Draft | Phase 3 | US1 |
| M2 Boss Framework + Dreadnought | Phase 4 | US2 |
| M3 Zone 2 Asteroid Field | Phase 5 | US3 |
| M4 New Enemy Types | Phase 6 | US4 |
| M5 Weapons + Tier 2/3 | Phase 7 | US5, US1 |
| M6 Shards, Hangar, Persistence | Phase 8 | US6 |
| M7 Zone 3 + Nemesis + The Void | Phase 9 | US3, US2 |
| M8 Audio + Summary + Controls | Phase 10 | US7, US6 |
| Polish | Phase 11 | Cross-cutting |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the three new script files and load them without changing the zero-build layout.

- [X] T001 [P] Add ordered `<script>` tags for `js/zones.js`, `js/weapons.js`, and `js/metaProgress.js` in `index.html` before `js/main.js`.
- [X] T002 [P] Create `js/zones.js` with a `ZONE_DEFS` registry stub for Deep Space, Asteroid Field, and Nebula Core.
- [X] T003 [P] Create `js/weapons.js` with a `WEAPON_DEFS` registry stub for Pulse Cannon, Shotgun Blaster, Laser Beam, and Seeker Missiles.
- [X] T004 [P] Create `js/metaProgress.js` with `META_KEY = 'voidbreaker.meta'`, `LEGACY_KEY = 'voidbreaker_highscore'`, and the default profile constant.

---

## Phase 2: Foundational (Milestone 0)

**Purpose**: Shared state, deterministic randomness, baseline alignment, pooling, and persistence
foundations required by every milestone.

**CRITICAL**: Complete this phase before starting Milestone 1.

- [X] T005 Set the Phase 2 player baseline in `js/player.js`: `MAX_HEALTH = 3`, `MOVE_SPEED = 250`, dash distance 150 px over `DASH_DURATION = 0.15`, `DASH_SPEED = 1000`, and `DASH_COOLDOWN = 1.5`.
- [X] T006 Normalize player fire timing in `js/player.js` to a shots-per-second model so Pulse Cannon is exactly 6 shots/s and Overclock can apply a precise 1.15 multiplier.
- [X] T007 Add a seeded run RNG (`mulberry32` or equivalent) plus `runSeed` and `runRng` state in `js/main.js`; expose a helper that systems can call without using `Math.random`.
- [X] T008 [P] Replace gameplay `Math.random` calls in `js/waveManager.js` with the run RNG for enemy type and spawn cadence decisions.
- [X] T009 [P] Replace gameplay `Math.random` calls in `js/enemies.js` with the run RNG for spawn edge and spawn position.
- [X] T010 [P] Replace gameplay `Math.random` calls in `js/powerups.js` with the run RNG for power-up type and drop decisions; define the global 20% drop rate.
- [X] T011 [P] Replace gameplay `Math.random` calls in `js/upgradeManager.js` with the run RNG for weighted card selection and auto-pick.
- [X] T012 [P] Replace gameplay `Math.random` calls in `js/boss.js` with the run RNG for summon angles while leaving cosmetic randomness separate.
- [X] T013 Add run statistics and Phase 2 state fields in `js/main.js`: `wavesCleared`, `bossKills`, `kills`, `powerUpsCollected`, `upgradesTaken`, `currentZone`, `zoneTransitionTimer`, and `shardsEarned`.
- [X] T014 [P] Extend the pooled bullet record in `js/bullets.js` with `damage`, `weaponId`, `source`, `ricochets`, `splitDepth`, and `pierce` fields initialized on reuse.
- [X] T015 [P] Convert `js/particles.js` to a fixed-capacity pool with inactive-slot reuse and no array growth in `burst`, `bigBurst`, or `hitEffect`.
- [X] T016 [P] Implement `loadMeta`, `saveMeta`, purchase-count schema validation, default fallback, field coercion, and one-time legacy high-score migration in `js/metaProgress.js`.
- [X] T017 Add the `hangar` state and an explicit `overlay` field (`null | boss_incoming | zone_transition | paused`) with pause-safe bookkeeping in `js/main.js`.
- [X] T018 Add the 40-concurrent-enemy and 200-concurrent-projectile constants and enforcement hooks in `js/main.js` and `js/bullets.js`.

**Checkpoint**: Foundation ready. Stop and confirm the baseline values and zero-build load order before Milestone 1.

---

## Phase 3: Milestone 1 - Upgrade Draft (US1)

**Goal**: Implement the three-card draft, exact tier rules, unique-card removal, two-second
auto-pick, and all five Tier 1 effects. Tier 2/3 card effects are completed in Milestone 5.

**Independent Test**: Clear a wave, verify three distinct eligible cards, verify Tier 1 availability
and weights, verify each Tier 1 effect at one and two stacks, and verify two-second auto-pick.

- [X] T019 [US1] Define the exact 12-card registry with tiers, unique flags, descriptions, stack rules, and effect metadata in `js/upgradeManager.js`; preserve existing Tier 2/3 behavior until Milestone 5 completes the exact effects.
- [X] T020 [US1] Implement exact tier weights, no duplicates within an offer, unique-card removal, and fewer-than-three fallback in `js/upgradeManager.js` using `runRng`.
- [X] T021 [US1] Wire the two-second auto-pick timer, numeric 1-3 selection, and mouse selection through `js/main.js` and `js/ui.js`.
- [X] T022 [US1] Implement Tier 1 effects exactly in `js/upgradeManager.js` and `js/player.js`: Overclock fire-rate multiplier, Armor Plating max HP, Quick Dash cooldown reduction with 0.1s floor, Scattershot count, and Magnet pickup radius multiplier.
- [X] T023 [US1] Audit `js/player.js`, `js/bullets.js`, and `js/upgradeManager.js` so modifiers are applied at the point of effect and are not re-derived every frame.
- [X] T024 [US1] Validate Milestone 1 with `specs/001-phase-2-expansion/quickstart.md` scenario 2 and the tier/unique-card checks in scenario 3 using temporary DevTools probes; defer Black Hole Q and Tier 2/3 effect checks to Milestone 5, then stop for go-ahead.

**Checkpoint**: Milestone 1 is playable and is the first MVP increment. Full US1 acceptance waits for Milestone 5.

---

## Phase 4: Milestone 2 - Boss Framework and Dreadnought (US2)

**Goal**: Add the wave-driven boss framework, the Dreadnought encounter, boss-only wave composition,
incoming presentation, and health bar.

**Independent Test**: Reach wave 5 and verify the incoming card, Dreadnought stats, 300°/s spiral,
weak core, phase 2, health bar, and boss-only wave composition.

- [X] T025 [US2] Generalize `spawnBoss` in `js/boss.js` into a wave-driven factory that selects the Dreadnought at wave 5.
- [X] T026 [US2] Implement Dreadnought exactly in `js/boss.js`: 150 HP, 8-bullet spiral rotating 5A� per 1/60s tick (300A�/s) with delta time, 150 px/s bullets, 3x weak-core damage, and phase 2 below 50% with a 0.5s spiral interval plus 2 Swarmers every 8s.
- [X] T027 [US2] Wire the 1.5-second boss-incoming flash and title card plus the boss health-bar slide through `js/main.js` and `js/ui.js`.
- [X] T028 [US2] Enforce boss-only waves in `js/waveManager.js` and `js/main.js`: no regular batch on `wave % 5 === 0`; boss summons count as the wave's live enemies.
- [X] T029 [US2] Ensure boss defeat resolves wave clear, calls the upgrade draft, and does not double-count boss summons in `js/main.js` and `js/waveManager.js`.
- [X] T030 [US2] Add the boss identity label and phase-aware health-bar color for the Dreadnought in `js/ui.js`.
- [X] T031 [US2] Validate Milestone 2 with `specs/001-phase-2-expansion/quickstart.md` scenario 4; verify the Dreadnought, incoming card, health bar, and boss-only composition, then stop for go-ahead.

**Checkpoint**: Dreadnought milestone complete. Do not start Milestone 3 until approved.

---

## Phase 5: Milestone 3 - Zone 2 Asteroid Field (US3)

**Goal**: Add zone tracking, Zone 2 asteroids, collision behavior, drops, and the Zone 2 title card.

**Independent Test**: Reach wave 6 and verify the zone card, seeded asteroid count, 8 HP, projectile
blocking, 1-heart contact damage, drops, and unchanged count on later Zone 2 waves.

- [X] T032 [US3] Implement `ZONE_DEFS` entries for Deep Space waves 1-5 and Asteroid Field waves 6-10 in `js/zones.js`; leave Nebula Core for Milestone 7.
- [X] T033 [US3] Add zone lookup, current-zone updates, and the "Zone N - [Name]" title card in `js/main.js` and `js/ui.js`.
- [X] T034 [US3] Implement seeded asteroid placement in `js/zones.js`: 6-10 asteroids chosen once per run, 8 HP each, positioned outside the player's immediate start area.
- [X] T035 [US3] Implement asteroid collision in `js/main.js` and `js/zones.js`: block projectiles, deal 1 heart of contact damage, and drop a power-up on destruction at the current global drop rate.
- [X] T036 [US3] Draw the Phase 1 arena background and zone hazard layer beneath all entities in `js/main.js` and `js/zones.js`; do not add new background-art requirements.
- [X] T037 [US3] Validate Milestone 3 with `specs/001-phase-2-expansion/quickstart.md` scenario 5; verify Zone 2 only, then stop for go-ahead.

**Checkpoint**: Zone 2 complete. Do not start Milestone 4 until approved.

---

## Phase 6: Milestone 4 - New Enemy Types (US4)

**Goal**: Add Splitter, Shielded Drone, and Mimic, plus the non-boss wave count formula and spawn
profile support.

**Independent Test**: Reach waves 6 and 11, verify each new enemy's stats and behavior, and verify
`4 + floor(wave * 1.5)` with the 40-enemy cap.

- [ ] T038 [US4] Add Splitter to `ENEMY_TYPES` in `js/enemies.js`: 3 HP, 90 px/s, first wave 6, and 2 Swarmers at its death position with 1 HP and 180 px/s.
- [ ] T039 [US4] Add Shielded Drone to `ENEMY_TYPES` in `js/enemies.js`: 5 HP, 60 px/s, first wave 6, no ranged attack, 180-degree shield arc rotating 45 degrees/sec, nullified shielded hits, and normal exposed-side damage.
- [ ] T040 [US4] Add Mimic to `ENEMY_TYPES` in `js/enemies.js`: 4 HP, first wave 11, copied ship shape and movement bursts, and a fire-rate cap of twice the base Pulse Cannon rate.
- [ ] T041 [US4] Replace the wave count in `js/waveManager.js` with `4 + floor(wave * 1.5)` for non-boss waves and enforce the 40-concurrent-enemy cap there.
- [ ] T042 [US4] Add `spawnProfile` support in `js/enemies.js` and `js/main.js` so Splitter-spawned Swarmers use 180 px/s without changing the Phase 1 Swarmer baseline.
- [ ] T043 [US4] Add distinct canvas rendering for Splitter, Shielded Drone, and Mimic in `js/enemies.js`, including shield-arc and mimic-shape visuals.
- [ ] T044 [US4] Validate Milestone 4 with `specs/001-phase-2-expansion/quickstart.md` scenario 6; verify all three enemies and the wave formula, then stop for go-ahead.

**Checkpoint**: Enemy roster complete. Do not start Milestone 5 until approved.

---

## Phase 7: Milestone 5 - Weapon Classes and Tier 2/3 Cards (US5, US1)

**Goal**: Add all four weapons, Hangar weapon selection, Armory Access gating, Tier 2 card effects,
and the three Tier 3 unique effects.

**Independent Test**: Start a run with each weapon, verify exact profiles and gating, then verify
all 12 upgrade cards at one and two stacks.

- [ ] T045 [US5] Implement exact `WEAPON_DEFS` in `js/weapons.js` for Pulse Cannon, Shotgun Blaster, Laser Beam, and Seeker Missiles using the `data-model.md` weapon table.
- [ ] T046 [US5] Add the weapon-selection screen using the existing Hangar state in `js/main.js` and `js/ui.js`, with mouse and keyboard selection.
- [ ] T047 [US5] Implement Pulse Cannon firing in `js/weapons.js` and `js/bullets.js`: 1 damage per hit, 6 shots/s, 500 px/s projectiles.
- [ ] T048 [US5] Implement Shotgun Blaster firing in `js/weapons.js` and `js/bullets.js`: 5 pellets of 1 damage, 2 shots/s, 450 px/s, 30-degree total cone.
- [ ] T049 [US5] Implement Laser Beam in `js/weapons.js` and `js/player.js`: 3 damage/s while held, 100 energy, 20/s drain, 15/s regen while idle, and a 1s forced cooldown at zero energy.
- [ ] T050 [US5] Implement Seeker Missiles in `js/weapons.js` and `js/bullets.js`: 4 damage, 1.2s reload, 300 px/s, 180 degrees/sec turn, 400 px target radius, nearest-target selection, and straight-fire fallback.
- [ ] T051 [US5] Extend `js/bullets.js` to carry weapon-specific damage, pellet, beam, homing, and lifetime behavior without allocating in the fire path.
- [ ] T052 [US5] Gate Laser Beam and Seeker Missiles behind Armory Access in `js/weapons.js`, `js/ui.js`, and `js/metaProgress.js`, showing visible locked states.
- [ ] T053 [US5] Wire Scattershot only to Pulse Cannon and each Shotgun pellet; wire Chain Lightning to every fifth projectile hit and every fifth Laser damage tick in `js/weapons.js`, `js/bullets.js`, and `js/main.js`.
- [ ] T054 [US1] Implement Tier 2 combat hooks for Chain Lightning, Afterburn, Ghost Dash, and Bouncer in `js/upgradeManager.js`, `js/bullets.js`, `js/player.js`, and `js/main.js` using the exact per-stack values in FR-042.
- [ ] T055 [US1] Implement Black Hole ownership, Q-key activation, 30-second cooldown, and cooldown gating in `js/main.js` and `js/player.js`.
- [ ] T056 [US1] Implement the Black Hole singularity in `js/main.js` and `js/enemies.js`: 120 px radius, 1.5s duration, 160 px/s2 pull, 1 damage per 0.25s per enemy, and immediate Shielded Drone shield removal.
- [ ] T057 [US1] Implement the Overload 10th-kill screen-wide pulse in `js/main.js`, dealing 3 damage to all on-screen enemies.
- [ ] T058 [US1] Implement the Twin Ship drone in `js/main.js` and `js/player.js` with a 40 px offset, mirrored movement, mirrored fire rate and weapon damage, and no extra upgrade triggers.
- [ ] T059 [US5] Validate Milestone 5 with `specs/001-phase-2-expansion/quickstart.md` scenarios 2, 3, and 7, including the exact 12-card upgrade matrix; in scenario 7, use a temporary DevTools-seeded Armory Access unlock to verify the unlocked Laser Beam and Seeker Missiles branches, and defer the purchase-flow check to Milestone 6; complete US1 acceptance, then stop for go-ahead.

**Checkpoint**: Weapons, Tier 2/3, and full US1 acceptance complete. Do not start Milestone 6 until approved.

---

## Phase 8: Milestone 6 - Void Shards, Hangar, and Persistence (US6)

**Goal**: Track run totals, award shards, add all five Hangar purchases, persist the profile, and
apply Hangar effects on the next run.

**Independent Test**: Complete a run with known score, fully cleared waves, and boss kills; verify
shard data, purchases, caps, persistence, corrupt-data fallback, best-record semantics, and next-run
effects.

- [ ] T060 [US6] Define purchase-count validation for Hull Reinforcement and boolean unlock validation for one-time purchases in `js/metaProgress.js`; keep T016 as the only load/save path.
- [ ] T061 [US6] Add the five Hangar purchases to the Hangar UI in `js/ui.js` and `js/main.js`: Hull Reinforcement 150/max 2, Afterburner 200/max 1, Armory Access 250/max 1, Bonus Drop Rate 175/max 1, and Head Start 300/max 1.
- [ ] T062 [US6] Track run totals in `js/main.js`, using fully cleared waves for `waves_survived` and counting boss kills exactly once.
- [ ] T063 [US6] Implement the shard formula and three-part breakdown data in `js/main.js`: `floor(score / 100) + (waves_survived * 5) + (boss_kills * 25)`.
- [ ] T064 [US6] Update and persist best wave and best score in `js/main.js` and `js/metaProgress.js` only when exceeded; `bestWave` is the highest wave reached, not the highest fully cleared wave.
- [ ] T065 [US6] Apply Hangar effects at run start in `js/player.js` and `js/main.js`: max HP, dash cooldown, weapon unlocks, drop rate, and Head Start wave 2.
- [ ] T066 [US6] Validate Milestone 6 with `specs/001-phase-2-expansion/quickstart.md` scenario 8 using temporary DevTools probes for shard data, purchases, persistence, and best records; stop for go-ahead. Full summary UI validation occurs at Milestone 8.

**Checkpoint**: Shards, Hangar, and persistence complete. Do not start Milestone 7 until approved.

---

## Phase 9: Milestone 7 - Zone 3, Nemesis, and The Void (US3, US2)

**Goal**: Add Nebula Core hazards, Nemesis, The Void, repeat scaling, and the remaining boss
cadence.

**Independent Test**: Reach waves 11, 15, 20, and 25; verify fog, boundary spawning, surge, Nemesis
snapshot, The Void pull/summons, and repeat HP scaling.

- [ ] T067 [US3] Extend `ZONE_DEFS` in `js/zones.js` with Nebula Core waves 11+, including the 180 px vision radius and surge values.
- [ ] T068 [US3] Implement the Nebula Core fog in `js/zones.js` and `js/main.js` with darkened edges, a 180 px clear-vision radius around the player, and enemy spawning from the fog boundary.
- [ ] T069 [US3] Implement the nebula surge in `js/zones.js` and `js/main.js`: every 30s, grant all enemies +40% speed for 4s and reset the timer after each surge.
- [ ] T070 [US2] Implement Nemesis in `js/boss.js` with 200 HP, a 64 px hitbox, and a one-time wave-10 snapshot of the player's upgrades and weapon used for the entire fight.
- [ ] T071 [US2] Implement The Void in `js/boss.js` with `250 + 50 * cycle` HP, 80 px/s2 player/enemy pull, 40 px/s2 projectile pull capped at 120 px/s, and 1 Splitter every 4s from a seeded random edge.
- [ ] T072 [US2] Extend the boss factory in `js/boss.js` and `js/main.js` for Nemesis at wave 10 and The Void at wave 15 then every fifth wave, including repeat-cycle HP scaling.
- [ ] T073 [US2] Validate Nemesis and The Void with `specs/001-phase-2-expansion/quickstart.md` scenario 4; verify snapshot, pull, summons, and repeat scaling, then stop for go-ahead.
- [ ] T074 [US3] Validate Nebula Core with `specs/001-phase-2-expansion/quickstart.md` scenario 5; verify fog, boundary spawning, and surge, then stop for go-ahead.

**Checkpoint**: All bosses and zones complete. Do not start Milestone 8 until approved.

---

## Phase 10: Milestone 8 - Layered Audio, Summary, and Controls (US7, US6)

**Goal**: Add all four audio layers, pause/mute/quit controls, and the end-of-run summary screen.

**Independent Test**: Play from wave 1 through a boss, verify audio layers and controls, then quit
and complete a run to verify the summary and its actions.

- [ ] T075 [US7] Replace the single BGM loop in `js/audio.js` with four persistent layer buses and gain ramps: ambient, rhythm, intensity, and boss.
- [ ] T076 [US7] Implement the constant 55 Hz ambient sine layer in `js/audio.js`.
- [ ] T077 [US7] Implement the rhythm layer in `js/audio.js`, starting on wave 3 at `90 + wave * 2` BPM capped at 160 BPM.
- [ ] T078 [US7] Implement the intensity layer in `js/audio.js` and `js/main.js`: filter cutoff closes and darkens as enemy count rises, and opens and brightens as the screen clears.
- [ ] T079 [US7] Implement the boss layer in `js/audio.js` and `js/main.js`: detuned 110 Hz sawtooth root with 1.5-second crossfades in and out.
- [ ] T080 [US7] Complete Escape pause, M mute, and Q gating across states and overlays in `js/main.js`, `js/player.js`, and `js/ui.js`.
- [ ] T081 [US7] Implement Quit to Hangar from the pause overlay in `js/main.js` and `js/ui.js`; quitting ends the run without shards or best-record updates.
- [ ] T082 [US6] Implement the end-of-run summary in `js/ui.js` and `js/main.js`: final wave, final score, shards earned, score/wave/boss breakdown, kills, power-ups, upgrades, and Hangar/Play Again actions.
- [ ] T083 [US6] Wire the summary buttons and Hangar navigation in `js/main.js` and `js/ui.js` so Play Again and Hangar both reset state cleanly.
- [ ] T084 [US7] Validate Milestone 8 audio, controls, and quit with `specs/001-phase-2-expansion/quickstart.md` scenario 9; stop for go-ahead.
- [ ] T085 [US6] Validate the summary, shard breakdown, best-record semantics, and persistence with `specs/001-phase-2-expansion/quickstart.md` scenario 8; stop for go-ahead.

**Checkpoint**: All eight milestones complete. Proceed to Polish only after approval.

---

## Phase 11: Polish and Cross-Cutting Concerns

**Purpose**: Performance, regression, documentation, and full-run acceptance.

- [ ] T086 [P] Verify bullet and particle pooling in `js/bullets.js` and `js/particles.js` has no per-shot or per-frame allocation and respects fixed capacities.
- [ ] T087 Verify the 40-enemy and 200-projectile caps across `js/main.js`, `js/waveManager.js`, and `js/bullets.js`, including boss summons; this is a verification task, not a second cap implementation.
- [ ] T088 Audit pause safety in `js/main.js` and `js/ui.js` so gameplay, wave timers, zone timers, boss timers, upgrade timers, and audio state freeze and resume correctly.
- [ ] T089 [P] Update `README.md` with Phase 2 controls, Hangar flow, weapons, zones, and the zero-build launch instructions.
- [ ] T090 [P] Run all scenarios in `specs/001-phase-2-expansion/quickstart.md` and record pass/fail for every expected value.
- [ ] T091 [P] Run the Phase 1 regression pass from `specs/001-phase-2-expansion/quickstart.md` scenario 11, allowing only the FR-040 baseline changes.
- [ ] T092 [P] Verify zero console errors and uncaught promise rejections in Chrome, Firefox, and Edge using `specs/001-phase-2-expansion/quickstart.md`.
- [ ] T093 [P] Verify the 60 fps target with 40 enemies and 200 projectiles using the performance scenario in `specs/001-phase-2-expansion/quickstart.md`.

---

## Phase 12: Convergence

- [X] T094 Implement Zone 2 Asteroid Field hazards and zone transition per FR-015 to FR-018 and US3/AC2 to AC4 (missing): add seeded 6-10 asteroid entities, 8 HP, projectile blocking, 1-heart contact damage, drop-on-destruction, and the "Zone N - [Name]" title card in `js/zones.js`, `js/main.js`, and `js/ui.js`.
- [ ] T095 Implement Splitter, Shielded Drone, and Mimic plus the non-boss wave count formula per FR-021 to FR-024 and US4/AC1 to AC7 (missing): add exact stats and behavior in `js/enemies.js` and `4 + floor(wave * 1.5)` with the 40-enemy cap in `js/waveManager.js` and `js/main.js`.
- [ ] T096 Implement the four weapon classes and weapon selection/gating per FR-025 to FR-030 and US5/AC1 to AC6 (missing): wire Pulse Cannon, Shotgun Blaster, Laser Beam, and Seeker Missiles through `js/weapons.js`, `js/player.js`, `js/bullets.js`, `js/main.js`, and `js/ui.js`, including Laser energy and Seeker targeting.
- [ ] T097 Implement all Tier 2 and Tier 3 upgrade effects per FR-042 to FR-044 and US1/AC8 to AC9 (missing): add Chain Lightning, Afterburn, Ghost Dash, Bouncer, Black Hole Q with 30s cooldown, Overload every 10th kill, and Twin Ship mirroring in `js/upgradeManager.js`, `js/player.js`, `js/bullets.js`, and `js/main.js`.
- [ ] T098 Implement the five Hangar purchases and run-start effects per FR-032 and US6/AC3 to AC7 (missing): add purchase validation, shard deduction, caps, and Hull/Afterburner/Armory/Drop Rate/Head Start application in `js/metaProgress.js`, `js/ui.js`, `js/player.js`, and `js/main.js`.
- [ ] T099 Complete Void Shard awarding and best-record persistence per FR-031 and FR-033 and US6/AC2, AC8 to AC9 (partial): compute the three-part shard formula, persist `bestWave` as the highest wave reached, and write run results once at game over in `js/main.js` and `js/metaProgress.js`.
- [ ] T100 Implement the end-of-run summary and actions per FR-034 and US6/AC1 (missing): show final wave, score, shard breakdown, kills, power-ups, upgrades, and Hangar/Play Again actions in `js/ui.js` and `js/main.js`.
- [ ] T101 Implement Nebula Core fog, vision, boundary spawning, and surge per FR-019 and FR-020 and US3/AC5 to AC6 (missing): add 180 px clear vision, darkened edges, fog-boundary spawns, and the 30s/4s/+40% surge in `js/zones.js`, `js/enemies.js`, and `js/main.js`.
- [ ] T102 Implement Nemesis and The Void and remove the temporary Dreadnought fallback per FR-009, FR-012, and FR-013 and US2/AC4 to AC6 (partial): add Nemesis snapshot behavior, The Void pull/summons, repeat HP scaling, and wave-based boss selection in `js/boss.js` and `js/main.js`.
- [ ] T103 Implement the Menu to Hangar to playing state flow per the run-state contract and US5/AC1 to AC2 (missing): make Hangar reachable, add weapon selection and launch behavior, and route game-over Hangar actions through it in `js/main.js` and `js/ui.js`.
- [ ] T104 Complete pause, quit, and overlay behavior per FR-036 and US7/AC7 (partial): add Quit to Hangar from pause with no shard or best-record award and use the explicit `zone_transition` overlay in `js/main.js` and `js/ui.js`.
- [ ] T105 Implement the four-layer soundtrack per FR-035 and US7/AC1 to AC4 (missing): replace the single BGM loop with ambient 55 Hz, rhythm `90 + wave * 2` BPM capped at 160, enemy-count intensity filtering, and 1.5s boss crossfades in `js/audio.js` and `js/main.js`.
- [ ] T106 Complete browser validation, regression, documentation, and performance checks per SC-001, SC-003, SC-009, SC-010, and T090 to T093 (partial): run the quickstart scenarios and Phase 1 regression in Chrome/Firefox/Edge, update `README.md`, and verify the 60 fps target at the caps.

---

## User Story Coverage

| Story | Tasks | Independent Test |
|---|---|---|
| US1 Upgrade Draft | T019-T024, T054-T059 | Three-card draft, Tier 1 in M1; all 12 cards and Tier 3 completed in M5 |
| US2 Bosses | T025-T031, T070-T073 | Dreadnought in M2; Nemesis/The Void and repeat scaling in M7 |
| US3 Zones | T032-T037, T067-T069, T074 | Zone 2 in M3; Nebula Core in M7 |
| US4 Enemies | T038-T044 | All three enemy types and wave formula in M4 |
| US5 Weapons | T045-T053, T059 | Four weapons, gating, and interactions in M5 |
| US6 Meta | T060-T066, T082-T083, T085 | Shards/Hangar/persistence in M6; summary UI in M8 |
| US7 Audio/Controls | T075-T081, T084 | Audio layers, pause, mute, quit, and Q in M8 |

---

## Dependencies and Execution Order

### Milestone Dependencies

- **Setup (Phase 1)**: Starts immediately; creates the three new script files and load order.
- **Foundational (Phase 2)**: Depends on Setup; blocks all milestones.
- **M1 (Phase 3)**: Depends on Foundational; first MVP increment.
- **M2 (Phase 4)**: Depends on M1 for post-wave flow.
- **M3 (Phase 5)**: Depends on M2 because Zone 2 includes wave 10.
- **M4 (Phase 6)**: Depends on M3 for shared hazard and spawn behavior.
- **M5 (Phase 7)**: Depends on M4 for stable enemy and projectile behavior.
- **M6 (Phase 8)**: Depends on M5 for weapon unlocks and combat totals.
- **M7 (Phase 9)**: Depends on M4, M5, and M6 for enemies, weapons, and persistence.
- **M8 (Phase 10)**: Depends on M2, M3, M5, and M6 for boss, zone, weapon, and meta events.
- **Polish (Phase 11)**: Depends on all milestones being complete.

### Milestone Order

```text
Setup -> Foundational -> M1 -> M2 -> M3 -> M4 -> M5 -> M6 -> M7 -> M8 -> Polish
```

This order is mandatory under Constitution Principle III and `phase2.md` Operating Rule 1. Do not
skip, reorder, or merge milestones.

### Parallel Opportunities

- Setup T001-T004 touch different files and can run in parallel.
- Foundational T008-T012 and T014-T016 touch different files and can run in parallel after T007.
- Polish verification/documentation tasks T086 and T089-T093 can run in parallel after M8.

### Parallel Example: Foundational

```text
Task: "Replace gameplay Math.random in js/waveManager.js with runRng"
Task: "Replace gameplay Math.random in js/enemies.js with runRng"
Task: "Replace gameplay Math.random in js/powerups.js with runRng"
Task: "Replace gameplay Math.random in js/upgradeManager.js with runRng"
Task: "Replace gameplay Math.random in js/boss.js with runRng"
```

### Parallel Example: Polish

```text
Task: "Verify bullet and particle pooling in js/bullets.js and js/particles.js"
Task: "Update README.md with Phase 2 controls and flows"
Task: "Run all scenarios in specs/001-phase-2-expansion/quickstart.md"
```

---

## Implementation Strategy

### MVP First (Milestone 1)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: Milestone 1.
4. STOP and validate Milestone 1 with quickstart scenarios 2 and 3.
5. Report exact observed values and wait for go-ahead.

Full US1 acceptance, including Tier 2/3, is completed and validated at Milestone 5.

### Incremental Delivery

1. M0 foundation -> zero-build baseline and deterministic RNG.
2. M1 -> Tier 1 upgrade draft.
3. M2 -> Dreadnought and boss framework.
4. M3 -> Zone 2 and asteroids.
5. M4 -> Splitter, Shielded Drone, and Mimic.
6. M5 -> four weapons, Tier 2/3, and full US1.
7. M6 -> shards, Hangar, persistence, and best records.
8. M7 -> Nebula Core, Nemesis, and The Void.
9. M8 -> audio, pause/mute/quit, and run summary.
10. Polish -> performance, regression, docs, and full acceptance.

### Stop Rule

Every milestone ends with a validation and go-ahead task. Do not auto-continue into the next
milestone without explicit approval, per Constitution Principle III.

---

## Notes

- [P] tasks use different files and have no incomplete dependency.
- [Story] labels map directly to `spec.md` user stories while milestone order remains authoritative.
- No test tasks are generated because the project deliberately has no test runner; validation is
  manual and browser-based.
- No commit is implied by any task. Commit only when explicitly requested.
- Exact values live in `spec.md`, `data-model.md`, and `contracts/`; tasks reference those sources.
- The exact 12-card upgrade matrix is in `quickstart.md` scenario 3.
