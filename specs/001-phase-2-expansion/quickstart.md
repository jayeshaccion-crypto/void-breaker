# Phase 2 Validation Quickstart

**Feature**: Phase 2 Expansion | **Plan**: [plan.md](plan.md) | **Spec**: [spec.md](spec.md)

This guide proves the feature works end to end. It is a manual validation guide, not an
implementation checklist. Exact content values are in [data-model.md](data-model.md) and
[contracts/](contracts/).

## Prerequisites

- A current desktop browser: Chrome, Firefox, or Edge.
- The repository checked out locally.
- No install step, build step, or environment variables.
- A static file server is recommended; direct `index.html` open is also supported.

## Run the Game

From the repository root, choose one:

```bash
npx serve .
```

```bash
python -m http.server 3000
```

Open the printed local URL, or open `index.html` directly. The game must render the title screen
at a 960x540 logical resolution scaled to the window.

## Validation Scenarios

### 1. Smoke Run

1. Open the game.
2. Enter the Hangar, select Pulse Cannon, and launch.
3. Play through at least one wave, take damage, and reach game over.
4. Choose Hangar, then Play Again.

**Expected**: Every state transition is reachable, the game does not freeze, and the browser
console has zero errors or uncaught promise rejections. The player starts with 3 HP, moves at
250 px/s, and dashes 150 px on a 1.5-second cooldown.

### 2. Upgrade Draft

1. Clear wave 1.
2. Inspect the three offered cards.
3. Wait two seconds without input.
4. Repeat a wave clear and pick a card with the mouse; repeat and pick with keys 1–3.

**Expected**: Exactly three distinct cards appear; only Tier 1 is offered on waves 1–4; an
unanswered draft auto-picks one shown card at two seconds; the chosen effect applies immediately.

### 3. Tier Availability and Unique Cards

Use temporary DevTools probes against the live registries to inspect drafts at waves 5, 10, and
later. For example:

```js
upgradeManager.reset();
upgradeManager.selectCards(10).map(c => `${c.name}:T${c.tier}`);
```

Repeat for wave 4 and wave 5. For weight checking, reset and draw many samples, then compare the
observed tier mix to 60/40 and 30/40/30. Acquire Black Hole, press Q, and try Q again before the
cooldown expires.

**Expected**: Waves 1–4 are Tier 1 only; waves 5–9 mix Tier 1 and Tier 2 at 60/40; waves 10+ mix
Tier 1/2/3 at 30/40/30. A unique card never appears after it has been taken in the same run.
Black Hole launches once, starts a 30-second cooldown, and ignores Q while cooling down.

**Exact upgrade matrix**: Use temporary DevTools probes to take each card once and twice, then
verify:

| Card | One stack | Two stacks |
|---|---|---|
| Overclock | Fire rate ×1.15 | Fire rate ×1.3225 |
| Armor Plating | +1 max HP | +2 max HP |
| Quick Dash | Cooldown 1.5s → 1.2s | 1.5s → 0.9s |
| Scattershot | 2 total split projectiles | 4 total split projectiles |
| Magnet | Pickup radius ×2 | Pickup radius ×4 |
| Chain Lightning | Every 5th hit arcs to 1 target | Every 5th hit arcs to 2 targets |
| Afterburn | +1 trail damage | +2 trail damage |
| Ghost Dash | +1 dash-contact damage | +2 dash-contact damage |
| Bouncer | +1 wall ricochet | +2 wall ricochets |
| Black Hole | Q, 30s cooldown, 120 px, 1.5s, 160 px/s², 1 damage/0.25s | Not repeatable |
| Overload | Every 10th kill, 3 damage to all on-screen enemies | Not repeatable |
| Twin Ship | 40 px offset, mirrors movement/fire rate/weapon damage, no extra triggers | Not repeatable |

### 4. Boss Encounters

Reach wave 5 normally, or use a temporary DevTools wave jump to reach the boss milestone faster.
Do not ship the jump.

**Expected at wave 5**: A 1.5-second flash and "BOSS INCOMING" card precede the Dreadnought.
The Dreadnought has a 150 HP bar, fires an 8-bullet spiral rotating 5° per 1/60s tick (300°/s),
exposes a 3× weak core, and below 50% HP fires twice as often and summons 2 Swarmers every 8
seconds.

**Expected at wave 10**: Nemesis has 200 HP, a 64 px hitbox, and uses the player's upgrade and
weapon snapshot for the entire fight.

**Expected at wave 15**: The Void has 250 HP, pulls player/enemies at 80 px/s² and projectiles at
40 px/s² capped at 120 px/s, and spawns 1 Splitter every 4 seconds. On wave 20 it has 300 HP; on
wave 25 it has 350 HP.

### 5. Zone Progression

Reach wave 6 and wave 11.

**Expected at wave 6**: "Zone 2 — Asteroid Field" title card; 6–10 asteroids with 8 HP; asteroids
block projectiles, deal 1 heart on contact, and can drop power-ups when destroyed. The asteroid
count stays the same on later Zone 2 waves.

**Expected at wave 11**: "Zone 3 — Nebula Core" title card; fog at the screen edges; 180 px clear
vision around the player; every 30 seconds a 4-second surge gives all enemies +40% speed.

**Expected in all zones**: The Phase 1 arena background remains visible; zone visual distinction
comes from hazards, and no external background art is introduced.

### 6. New Enemy Types

Reach waves 6 and 11 and identify each enemy.

**Expected**: Splitter has 3 HP, moves at 90 px/s, and spawns 2 Swarmers at 1 HP / 180 px/s.
Shielded Drone has 5 HP, drifts at 60 px/s, has no ranged attack, and carries a rotating 180°
shield that nullifies shielded hits; Black Hole strips it. Mimic has 4 HP, mirrors ship shape and
movement bursts, and never fires faster than 2x base Pulse Cannon.

### 7. Weapon Classes

Visit the Hangar with no Armory Access, then with Armory Access. Before the M6 purchase flow
exists, temporarily seed the Armory Access unlock in `voidbreaker.meta` via DevTools for the
unlocked branch; validate the purchase flow in scenario 8.

**Expected**: Only Pulse Cannon and Shotgun Blaster are selectable before Armory Access; Laser
Beam and Seeker Missiles unlock after purchase. Verify each weapon against the table in
[data-model.md](data-model.md), including Laser energy drain/regen/forced cooldown and Seeker
nearest-target/turn/straight-fire behavior.

### 8. Void Shards, Hangar, and Persistence

1. Complete a run with a known score, boss kills, and count of fully cleared waves.
2. Record the shard total and the three-part breakdown.
3. Buy one Hangar upgrade, reload the page, and open the Hangar again.
4. Corrupt `voidbreaker.meta` in DevTools, reload, and open the Hangar.

**Expected**: `floor(score / 100) + (waves × 5) + (bossKills × 25)` matches the total, where
`waves` counts only fully cleared waves; the breakdown sums to the total; purchases and best
records survive reload; `bestWave` records the highest wave reached even if the player died during
it; corrupt data resets to zeroed defaults without blocking play; an existing legacy high score
appears as the initial best score.

### 9. Audio and Controls

1. Start a run and listen through waves 1, 3, and a boss.
2. Change the on-screen enemy count and listen to the intensity layer.
3. Press Escape, then Escape again.
4. Press Escape and select Quit to Hangar.
5. Press M, then M again.

**Expected**: Ambient 55 Hz plays constantly; rhythm starts at wave 3 at `90 + wave × 2` BPM
capped at 160; intensity darkens and closes as enemy count rises and brightens and opens as the
screen clears; the boss layer crossfades in and out over 1.5 seconds. Escape pauses and resumes;
Quit to Hangar returns without awarding shards or updating bests; M mutes and unmutes.

### 10. Performance

Use DevTools to temporarily raise the live enemy and projectile counts toward the caps.

**Expected**: The game stays responsive at the 60 fps target with 40 enemies and 200 projectiles;
no visible stutter or growing memory pressure. Restore the live state after the check.

### 11. Phase 1 Regression

Run the original checks: movement in all directions, mouse aim, fire, dash and invulnerability,
power-up pickup and expiry, wave progression, score and streak, pause, mute, game over, and
restart.

**Expected**: All prior behavior still works; no Phase 1 screen or control is missing.

## Pass Criteria

- Every scenario above matches its expected outcome.
- Every numeric value matches `phase2.md` exactly.
- The console remains free of errors through a complete run.
- The 60 fps target holds at the specified caps on the reference desktop.
- No Phase 3 feature, accessibility mode, or unlisted content appears.

## Reporting

After each milestone, record:

1. Files changed or created.
2. A one-paragraph summary of what was implemented.
3. Checklist: exact values match / Phase 1 unaffected / no invented features.
4. An explicit "ready for go-ahead" note; do not proceed automatically.
