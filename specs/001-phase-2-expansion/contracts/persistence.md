# Persistence Contract

**Feature**: Phase 2 Expansion | **Plan**: [../plan.md](../plan.md) | **Spec**: [../spec.md](../spec.md)

## Storage Key

The game uses exactly one persistent key:

```text
voidbreaker.meta
```

No other Phase 2 progress key is written. The legacy `voidbreaker_highscore` key is read once for
migration and then may be removed.

## Value Shape

```json
{
  "shards": 0,
  "unlocks": {},
  "bestWave": 0,
  "bestScore": 0
}
```

Field rules:

- `shards`: non-negative integer.
- `unlocks`: object keyed by Hangar upgrade id; values record purchase counts or unlock booleans.
- `bestWave`: non-negative integer; the highest wave reached, regardless of whether that wave was
  fully cleared.
- `bestScore`: non-negative integer.
- No additional required fields. The exact four-field shape above is the contract.

## Read Contract

1. Read the raw value inside a try/catch.
2. If the key is missing, parse-fails, is null, or is not an object, use:
   `{ shards: 0, unlocks: {}, bestWave: 0, bestScore: 0 }`.
3. If individual fields are missing or not valid numbers, coerce them to their zero defaults.
4. If the new key is absent and `voidbreaker_highscore` contains a valid number, use that value as
   `bestScore` for the initial profile.
5. A read failure must never block the game from starting.

## Write Contract

1. Serialize the full profile and write it to `voidbreaker.meta`.
2. Wrap the write in try/catch; a write failure is non-fatal and must not interrupt gameplay.
3. Write after a run ends and after every successful Hangar purchase.
4. `bestWave` and `bestScore` update only when a run exceeds the stored value.
5. Shards are awarded once per completed run using the exact formula:

```text
shards = floor(score / 100) + (waves_survived × 5) + (boss_kills × 25)
```

`waves_survived` is the number of fully cleared waves, not the highest wave reached.

## Corruption and Recovery

- Corrupt JSON resets to the zeroed default profile.
- A partially valid object keeps valid fields and defaults invalid ones.
- A storage quota or permission error is ignored after logging a non-fatal warning.
- Recovery never deletes the legacy high score before the new profile is successfully written.

## Run and Profile Relationship

- A run reads the profile once at run start to apply unlocks and starting bonuses.
- Hangar purchases update the profile immediately.
- Run results update shards, best wave, and best score only at game over.
- Mid-run refreshes do not award shards or persist run-scoped upgrades.
- Quitting a run without reaching game over does not award shards or update bests.

## Acceptance Checks

- Cold start with no storage: game opens with zeroed profile and valid Hangar.
- Corrupt JSON: game opens with zeroed profile and no console crash.
- Purchase a Hangar upgrade, reload the page: purchase and shard deduction persist.
- Complete a run with known score/waves/boss kills: shard total matches the formula exactly.
- Die during wave 7 after clearing waves 1–6: `waves_survived` is 6, `shard` wave component is 30,
  and `bestWave` is 7.
- Existing legacy high score appears as `bestScore` after first load.
