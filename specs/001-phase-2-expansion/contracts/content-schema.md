# Content Schema Contract

**Feature**: Phase 2 Expansion | **Plan**: [../plan.md](../plan.md) | **Spec**: [../spec.md](../spec.md)

This contract defines the registry shapes consumed by gameplay systems. Exact values are in
[../data-model.md](../data-model.md) and `phase2.md`; this file defines the interface between data
and systems.

## Common Rules

- Every registry is an array or object of plain data entries with a stable `id`.
- Systems look up entries by `id`; no gameplay system may branch on a display name.
- Numeric values use the units named in the field.
- Display strings are data and may change without changing behavior.
- Registry entries are immutable during a run; only run-scoped state changes.
- All registry-driven randomness uses the run RNG, never `Math.random()`.

## Upgrade Registry

**Shape**:

```text
{
  id: string,
  name: string,
  tier: 1 | 2 | 3,
  unique: boolean,
  desc: string,
  stackRule: "additive" | "multiplicative" | "target-count" | "split-count",
  effect: { ...named modifiers }
}
```

**Required entries**: exactly the 12 cards named in the spec. Tier 1 has 5, Tier 2 has 4, Tier 3
has 3. `unique` is true only for `black_hole`, `overload`, and `twin_ship`.

**Effect contract**:

- Non-unique stack values are exact: Overclock ×1.15 fire rate; Armor Plating +1 max HP;
  Quick Dash -0.3s to a 0.1s floor; Scattershot 2 split projectiles per stack; Magnet ×2 pickup
  radius;
  Chain Lightning +1 arc target; Afterburn +1 trail damage; Ghost Dash +1 dash-contact damage;
  Bouncer +1 ricochet.
- Black Hole: Q-key activation with a 30s cooldown; 120 px radius, 1.5s duration, 160 px/s² pull,
  1 damage per 0.25s per enemy.
- Overload: 3 damage to all on-screen enemies every 10th kill.
- Twin Ship: 40 px offset, mirrors the player's movement, fire rate, and weapon damage, no extra
  upgrade triggers.

**Draft contract**:

- Input: wave number, current run state, current taken-upgrade set.
- Output: 1–3 eligible cards, never duplicate ids within the offer.
- Weight selection: Tier 1 only for waves 1–4; `{1: 0.6, 2: 0.4}` for waves 5–9;
  `{1: 0.3, 2: 0.4, 3: 0.3}` for waves 10+.
- Unique cards are absent from the run pool after selection.
- If fewer than three eligible cards remain, return all eligible cards.
- The auto-pick chooses one of the displayed cards after 2 seconds of no input.

## Enemy Registry

**Shape**:

```text
{
  id: string,
  health: number,
  speed: number,
  radius: number,
  points: number,
  firstWave: number,
  movement: "seek" | "straight" | "stationary" | "mimic",
  attack: "none" | "straight-shot" | "telegraph-bolt" | "player-mirror",
  attackInterval?: number,
  chargeTime?: number,
  splitOnDeath?: { type: string, count: number, health: number, speed: number },
  shield?: { arcDegrees: number, rotationDegreesPerSecond: number },
  fireRateCapMultiplier?: number,
  spawnProfile?: string
}
```

**Validation**:

- Phase 1 entries keep their existing values: Swarmer 1 HP / 200 px/s; Tank 3 HP / 80 px/s; Sniper
  2 HP / 40 px/s.
- Splitter is 3 HP / 90 px/s, first wave 6, and spawns exactly 2 Swarmers at 1 HP / 180 px/s.
- Shielded Drone is 5 HP / 60 px/s, first wave 6, with a 180° arc at 45°/s and no ranged attack.
- Mimic is 4 HP, first wave 11, with a fire-rate cap of 2× base Pulse Cannon.
- Spawned Swarmers use `spawnProfile` so the Phase 1 Swarmer baseline does not change.

## Boss Registry

**Shape**:

```text
{
  id: string,
  name: string,
  waveRule: "everyFifth" | "fixed",
  fixedWave?: number,
  health: number,
  hitboxRadius: number,
  points: number,
  attackPattern: string,
  phaseThreshold?: number,
  summons?: { type: string, count: number, intervalSeconds: number },
  repeatScaling?: { healthPerCycle: number },
  snapshotPlayer?: boolean
}
```

**Validation**:

- Dreadnought: wave 5, 150 HP, spiral of 8 bullets at 150 px/s, 5° per 1/60s tick (300°/s) with
  delta time, weak core 3×, phase 2 at <50% with 0.5s fire interval and 2 Swarmers every 8s.
- Nemesis: wave 10, 200 HP, 64 px hitbox, `snapshotPlayer: true`.
- The Void: wave 15 then every fifth wave, base 250 HP, `healthPerCycle: 50`, 1 Splitter every
  4s, pulls player/enemies at 80 px/s² and projectiles at 40 px/s² capped at 120 px/s.
- A boss can have at most one active instance per run.

## Zone Registry

**Shape**:

```text
{
  id: string,
  name: string,
  minWave: number,
  maxWave: number | null,
  hazard: "none" | "asteroids" | "nebula",
  asteroid?: { countMin: number, countMax: number, health: number, contactDamage: number },
  nebula?: { visionRadius: number, surgeIntervalSeconds: number, surgeDurationSeconds: number,
             surgeSpeedMultiplier: number }
}
```

**Validation**:

- Deep Space: 1–5, no hazard.
- Asteroid Field: 6–10, asteroid count 6–10 chosen once per run, 8 HP, 1 heart contact damage.
- Nebula Core: 11+, 180 px vision, surge every 30s for 4s at +40% enemy speed.
- Zone lookup is by wave; ranges do not overlap or leave gaps.

## Weapon Registry

**Shape**:

```text
{
  id: string,
  name: string,
  fireMode: "projectile" | "pellets" | "beam" | "homing",
  damage: number,
  shotsPerSecond?: number,
  projectileSpeed?: number,
  pellets?: number,
  spreadRadians?: number,
  energy?: { max: number, drainPerSecond: number, regenPerSecond: number, forcedCooldown: number },
  reloadSeconds?: number,
  turnRateDegreesPerSecond?: number,
  targetRadius?: number,
  unlock: "default" | "armory_access"
}
```

**Validation**:

- Pulse Cannon: 1 damage, 6 shots/s, 500 px/s, default.
- Shotgun Blaster: 1 damage × 5 pellets, 2 shots/s, 450 px/s, 30° total cone, default.
- Laser Beam: 3 damage/s, 100 energy, 20/s drain, 15/s regen, 1s forced cooldown,
  `armory_access`.
- Seeker Missiles: 4 damage, 1.2s reload, 300 px/s, 180°/s turn, 400 px target radius,
  `armory_access`.
- Exactly one weapon is active per run.

## Hangar Registry

**Shape**:

```text
{
  id: string,
  name: string,
  cost: number,
  maxPurchases: number,
  effect: { key: string, value: number | boolean }
}
```

**Validation**:

- Hull Reinforcement: 150, max 2, +1 max HP each.
- Afterburner: 200, max 1, dash cooldown becomes 1s.
- Armory Access: 250, max 1, unlocks Laser Beam and Seeker Missiles.
- Bonus Drop Rate: 175, max 1, global drop chance 20% → 30%.
- Head Start: 300, max 1, start at wave 2.

## Cross-Registry Invariants

- Boss wave numbers, zone ranges, and enemy first-appearance waves are consistent with the wave
  manager's schedule.
- Every attacked/attacking entity has a registry entry; no anonymous gameplay constants.
- All new content is addable by extending a registry without editing an unrelated system.
- No registry entry may reference an external asset, URL, or network resource.
