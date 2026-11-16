# Data Model: Phase 2 Expansion

**Date**: 2026-11-02 | **Plan**: [plan.md](plan.md) | **Spec**: [spec.md](spec.md)

This model describes the runtime entities and their contracts. It is implementation-shaped but
not implementation code; exact numeric values live in the content registries described in
[contracts/content-schema.md](contracts/content-schema.md).

## Entity Overview

| Entity | Responsibility | Lifetime |
|---|---|---|
| Run | One play session from Hangar launch to game over or quit | One run |
| Player | Movement, health, dash, weapon state, upgrades | One run |
| Meta Profile | Persistent shards, unlocks, and best records | Across runs |
| Upgrade Card | One draftable reward and its stack behavior | Registry + run picks |
| Weapon Definition | One selectable weapon profile and fire mode | Registry |
| Enemy Definition | One enemy stat/behavior profile | Registry |
| Enemy Instance | One live enemy in the arena | Until death or despawn |
| Boss Definition | One boss profile, phases, and scaling | Registry |
| Boss Instance | One live boss encounter | Until defeat |
| Zone Definition | One wave range with hazards and visuals | Registry |
| Asteroid | One destructible Zone 2 hazard | One run |
| Hangar Upgrade | One permanent meta purchase | Registry + profile |
| Audio Layer | One soundtrack layer and its entry/mix rule | Session |
| Run Summary | End-of-run totals and shard breakdown | One game-over event |

## Run

Fields:

- `seed`: number generated once at run start and retained for reproducibility.
- `rng`: run-scoped deterministic gameplay random source.
- `state`: `menu | hangar | playing | upgrade_pick | gameover`.
- `overlay`: `null | boss_incoming | zone_transition | paused`.
- `paused`: boolean; freezes gameplay and timers while true. It is derived from
  `overlay === 'paused'`.
- `wave`: current wave number, starting at 1 or 2 with Head Start.
- `score`: non-negative integer.
- `currentZone`: zone id derived from wave.
- `isBossWave`: true when `wave % 5 === 0`.
- `boss`: live boss instance or null.
- `bossIncomingTimer`: 1.5-second countdown before boss spawn.
- `upgradeCards`: the current three-card offer.
- `upgradeTimer`: 2-second auto-pick countdown.
- `streak`: consecutive kills; multiplier is `min(1 + streak × 0.1, 3)`.
- `streakTimer`: 2-second window before the streak resets.
- `stats`: run totals for kills, boss kills, power-ups collected, upgrades taken, and fully
  cleared waves.
- `startingWeapon`: selected weapon id.

Invariants:

- `wave >= 0`; `score >= 0`; `bossIncomingTimer >= 0`; `upgradeTimer >= 0`.
- `state === 'upgrade_pick'` implies exactly three cards and a running auto-pick timer.
- `state === 'gameover'` ends all gameplay updates until restart.
- The run seed and all gameplay random choices are retained for the whole run.
- A boss wave never contains a separate regular enemy batch, only the boss and its summons.
- `stats.wavesSurvived` counts fully cleared waves, not the highest wave reached.

## Player

Fields:

- Position/radius/angle and movement speed.
- `health`, `maxHealth`; base 3 HP before Hangar and Armor Plating bonuses.
- `isDashing`, `dashTimer`, `dashCooldown`; base cooldown 1.5 seconds, dash distance 150 px.
- `invulnerable`, `invulnTimer`.
- `weaponId` and `weaponState` (fire timer, energy, reload, beam state).
- `upgrades`: ordered list of taken upgrade ids.
- `upgradeData`: derived modifiers used at the point of effect.
- `powerups`: temporary spread, rapid, shield, and health state.

Invariants:

- Base movement is 250 px/s; diagonal movement is normalized.
- Base dash is 150 px with a 1.5-second cooldown before upgrades or Hangar effects.
- Health never exceeds `maxHealth`; healing at full health is a no-op.
- Shield absorbs one hit before health.
- Dash invulnerability is brief and ends independently of position.
- Upgrade modifiers are not re-derived every frame; effects are applied when the relevant action
  occurs.

## Meta Profile

Fields:

- `shards`: non-negative integer.
- `unlocks`: object of purchased Hangar upgrades.
- `bestWave`: highest wave reached, independent of whether that wave was fully cleared.
- `bestScore`: highest score.

Invariants:

- Exactly one persistent profile exists; no account or server sync.
- Missing or malformed data resolves to
  `{ shards: 0, unlocks: {}, bestWave: 0, bestScore: 0 }`.
- Purchase caps are enforced: Hull Reinforcement 2; Afterburner, Armory Access, Bonus Drop Rate,
  and Head Start 1 each.
- A legacy `voidbreaker_highscore` value seeds `bestScore` once if the new profile is absent.

## Upgrade Card

Fields:

- `id`, `name`, `tier` (1–3), `unique`, `description`.
- `stackRule`: `additive | multiplicative | target-count | split-count`.
- `effects`: one or more named modifiers consumed by the player, weapon, or combat systems.
- `weight`: derived from the wave tier weights, not stored per card.

Registry invariants:

- Exactly 12 cards: 5 Tier 1, 4 Tier 2, 3 Tier 3.
- Unique cards are Black Hole, Overload, and Twin Ship.
- A draft contains three distinct cards.
- Tier weights are exactly: waves 1–4 `{1: 1}`; waves 5–9 `{1: 0.6, 2: 0.4}`; waves 10+
  `{1: 0.3, 2: 0.4, 3: 0.3}`.
- A unique card is removed from the run pool after its first pick.
- All non-unique cards can be picked repeatedly and follow the stack rules in `research.md`.
- If fewer than three eligible cards exist, the offer contains only eligible cards; the auto-pick
  still resolves to one of them.

Tier 3 unique effects:

| Card | Effect |
|---|---|
| Black Hole | Press Q to launch a singularity on a 30s cooldown; creates a 120 px radius well for 1.5s with 160 px/s² pull and 1 damage per 0.25s per enemy inside; strips Shielded Drone shields immediately. |
| Overload | Every 10th kill deals 3 damage to all on-screen enemies. |
| Twin Ship | A drone offsets 40 px from the player and mirrors the player's movement, fire rate, and weapon damage, with no additional upgrade triggers. |

## Weapon Definition

Fields:

- `id`, `name`, `fireMode`: `projectile | pellets | beam | homing`.
- `damage`, `shotsPerSecond`, `projectileSpeed`, `pellets`, `spreadRadians`.
- `energyMax`, `energyDrainPerSecond`, `energyRegenPerSecond`, `forcedCooldownSeconds`.
- `reloadSeconds`, `turnRateDegreesPerSecond`, `targetRadius`.
- `unlockKey`: `default` or `armory_access`.

Exact profiles:

| Weapon | Damage | Fire rate | Speed | Notes |
|---|---|---|---|---|
| Pulse Cannon | 1/hit | 6 shots/s | 500 px/s | Default single bolt |
| Shotgun Blaster | 1/pellet × 5 | 2 shots/s | 450 px/s | 30° total cone |
| Laser Beam | 3/s continuous | held | n/a | 100 energy, 20/s drain, 15/s regen, 1s forced cooldown at 0 |
| Seeker Missiles | 4/hit | 1.2s reload | 300 px/s | 180°/s turn, 400 px target radius, straight if no target |

Invariants:

- Exactly one weapon is active per run.
- Armory Access unlocks only Laser Beam and Seeker Missiles.
- Scattershot affects Pulse Cannon and each Shotgun pellet individually.
- Chain Lightning counts every fifth projectile hit or every fifth Laser damage tick.
- A weapon's damage and timing cannot drift from this table through upgrade application; upgrades
  multiply or add at the point of effect.

## Enemy Definition and Instance

Definition fields:

- `id`, `health`, `speed`, `radius`, `points`, `firstWave`.
- `movement`: `seek | straight | stationary | mimic`.
- `attack`: `none | straight-shot | telegraph-bolt | player-mirror`.
- Optional special fields: split-on-death, shield arc, shield rotation, fire-rate cap.

Exact profiles:

| Enemy | HP | Speed | First wave | Special |
|---|---|---|---|---|
| Swarmer (Phase 1) | 1 | 200 px/s | 1 | Rams the player |
| Tank (Phase 1) | 3 | 80 px/s | 2 | Fires straight bullets |
| Sniper (Phase 1) | 2 | 40 px/s | 3 | Telegraphs then fires a fast bolt |
| Splitter | 3 | 90 px/s | 6 | Spawns 2 Swarmers (1 HP, 180 px/s) on death |
| Shielded Drone | 5 | 60 px/s | 6 | 180° shield arc rotates 45°/s; no ranged attack; Black Hole strips it |
| Mimic | 4 | mirrors player bursts | 11 | Copies ship shape and fire rate, capped at 2× base Pulse Cannon |

Instance fields:

- `type`, `x`, `y`, `radius`, `health`, `maxHealth`, `active`, `points`.
- `vx`, `vy` or movement state.
- `fireTimer`, `chargeTimer`, `hasFired` where relevant.
- `shieldAngle`, `shieldArcRadians` for the Shielded Drone.
- `mimicFireRateCap` for the Mimic.
- `spawnProfile` for split-spawned Swarmers so they can use 180 px/s without changing the Phase 1
  Swarmer baseline.

Invariants:

- `4 + floor(wave × 1.5)` enemies per non-boss wave, capped at 40 concurrent.
- An enemy that leaves the arena is removed and counts as resolved for wave-clear logic.
- Split-on-death spawns exactly 2 Swarmers at the death position.
- Shielded Drone takes normal damage only on the exposed side.
- Mimic fire rate never exceeds twice the base Pulse Cannon rate.

## Boss Definition and Instance

Definition fields:

- `id`, `name`, `waveRule`, `health`, `hitboxRadius`, `points`.
- `patterns`: spiral, aimed, pull, summon, or phase-specific.
- `phaseThreshold`: 0.5 for the Dreadnought.
- `summons`: type, count, interval.
- `repeatScaling`: optional per-cycle HP increment.
- `snapshotPlayer`: boolean (Nemesis).

Exact profiles:

| Boss | Wave | HP | Key behavior |
|---|---|---|---|
| Dreadnought | 5 | 150 | 8-bullet spiral, 5° per 1/60s tick (300°/s) with delta time, 150 px/s; 3× core; phase 2 at <50%: 0.5s spiral and 2 Swarmers every 8s |
| Nemesis | 10 | 200 | 64 px hitbox; snapshots player upgrades and weapon at wave start |
| The Void | 15, then every 5 | 250 + 50 × cycle | Pulls player/enemies at 80 px/s² and projectiles at 40 px/s², capped at 120 px/s; 1 Splitter every 4s from a random edge |

Instance invariants:

- A 1.5-second boss-incoming card always precedes spawn.
- Health never exceeds max; phase 2 begins below 50% for the Dreadnought.
- The Nemesis snapshot is taken once at wave-10 start and never changes during the fight.
- The Void cycle is 0 at wave 15, 1 at wave 20, and so on.
- A boss health bar is present while the boss is active.
- Boss defeat resolves the wave and proceeds to the upgrade draft.

## Zone Definition and Hazards

Fields:

- `id`, `name`, `waveRange`, `background`, `hazardType`.
- `background` is always `phase1-arena`; no external background art is used.
- Zone 2 fields: asteroid count range, asteroid HP, contact damage, projectile blocking.
- Zone 3 fields: fog radius, surge interval, surge duration, surge speed multiplier.

Exact profiles:

| Zone | Waves | Background | Hazard |
|---|---|---|---|
| Deep Space | 1–5 | Phase 1 arena | None |
| Asteroid Field | 6–10 | Phase 1 arena | 6–10 seeded asteroids, 8 HP, block bullets, 1 heart contact damage, drop on destruction |
| Nebula Core | 11+ | Phase 1 arena | 180 px clear-vision radius, fog edges, surge every 30s for 4s at +40% enemy speed |

No new background art is required; hazard layers provide zone visual distinction.

Asteroid fields:

- `x`, `y`, `radius`, `health`, `maxHealth`, `active`, `dropEligible`.

Invariants:

- Asteroid count is chosen once per run and does not re-roll per wave.
- Asteroid drops use the current global drop rate: 20% base, 30% with Bonus Drop Rate.
- Zone changes at waves 6 and 11 and shows a title card.
- Fog does not hide the player or the immediate 180 px radius.
- Surge applies to all live enemies and expires after 4 seconds.

## Hangar Upgrade

Fields:

- `id`, `name`, `cost`, `maxPurchases`, `effectKey`, `effectValue`, `unlockKey`.

Exact profiles:

| Upgrade | Cost | Effect | Max |
|---|---|---|---|
| Hull Reinforcement | 150 | +1 max HP | 2 |
| Afterburner | 200 | Start runs with 1s dash cooldown | 1 |
| Armory Access | 250 | Unlock Laser Beam and Seeker Missiles | 1 |
| Bonus Drop Rate | 175 | Global drop chance 20% → 30% | 1 |
| Head Start | 300 | Start at wave 2 | 1 |

Invariants:

- Shards are deducted only on a successful purchase.
- A purchase beyond the cap or without enough shards is rejected without side effects.
- Effects apply at run start, not mid-run.
- Purchases persist immediately under the meta profile.

## Audio Layer

Fields:

- `id`: `ambient | rhythm | intensity | boss`.
- `waveform`, `rootFrequency`, `entryCondition`.
- `gain`, `targetGain`, `crossfadeSeconds`.
- `tempo` for rhythm; `filterMapping` for intensity.

Invariants:

- Ambient is always on at 55 Hz sine.
- Rhythm starts at wave 3 with `90 + wave × 2` BPM, capped at 160.
- Intensity filter cutoff closes (darker) as on-screen enemy count rises and opens (brighter) as
  the screen clears, scaling inversely with enemy count.
- Boss layer is a detuned sawtooth at 110 Hz root with 1.5-second in/out crossfades.
- Mute silences the master gain without stopping the game loop.
- No audio files or network requests are used.

## Run Summary

Fields:

- `finalWave`, `finalScore`, `wavesSurvived`, `bossKills`, `kills`, `powerUpsCollected`,
  `upgradesTaken`.
- `shardsEarned`: integer result of the formula.
- `breakdown`: `scoreComponent`, `waveComponent`, `bossComponent`.

Invariants:

- `scoreComponent = floor(score / 100)`.
- `wavesSurvived` counts fully cleared waves, not the highest wave reached.
- `waveComponent = wavesSurvived × 5`.
- `bossComponent = bossKills × 25`.
- `shardsEarned = scoreComponent + waveComponent + bossComponent`.
- The displayed breakdown always sums to `shardsEarned`.
- The summary is generated exactly once per run at game over.

## State Transitions

```text
menu
  -> hangar                    (start/click)
hangar
  -> playing                   (launch run with selected weapon)

playing
  -> upgrade_pick              (wave cleared, including boss waves)
  -> zone_transition overlay   (wave 6 and wave 11 entry)
  -> boss_incoming overlay     (wave divisible by 5)
  -> gameover                  (player health reaches 0)
  -> paused overlay            (Escape while playing)

upgrade_pick
  -> playing                   (card selected or auto-picked)

boss_incoming overlay
  -> playing (boss active)     (1.5s timer expires)

zone_transition overlay
  -> playing                   (title card ends)

paused overlay
  -> playing                   (Escape again)
  -> hangar                    (Quit to Hangar, no award)

gameover
  -> hangar                    (Hangar action)
  -> playing                   (Play Again action, fresh run)
```

Invariants:

- Pausing stops gameplay, zone timers, boss timers, and the upgrade auto-pick timer.
- The upgrade draft cannot be skipped without a card.
- Boss incoming always resolves before the boss exists.
- Zone transition occurs before hazard entities are active.
- A run ends through health reaching 0 or Quit to Hangar; quitting returns to the Hangar without a
  summary award and does not update shards or best records.

## Validation Rules Traceability

| Rule | Requirement |
|---|---|
| Three distinct cards per draft | FR-002 |
| Tier weights and availability | FR-003 |
| Unique-card removal | FR-004 |
| Stackable non-unique cards | FR-005 |
| Two-second auto-pick | FR-006 |
| 12-card registry only | FR-007 |
| Effects applied at point of effect | FR-008 |
| Boss cadence and identities | FR-009 to FR-014 |
| Zone ranges and hazards | FR-015 to FR-020 |
| New enemy stats and behavior | FR-021 to FR-024 |
| Weapon table and interactions | FR-025 to FR-030 |
| Shard formula and Hangar table | FR-031 to FR-034 |
| Layered audio and controls | FR-035 to FR-036 |
| Data-driven content | FR-037 |
| Performance caps | FR-038 |
| Zero-build runtime | FR-039 |
| Phase 2 player baseline | FR-040 |
| Boss-only boss waves | FR-041 |
| Exact non-unique stack rules | FR-042 |
| Conservative defaults for unspecified effects | FR-043 |
| Black Hole Q-key activation and cooldown | FR-044 |
