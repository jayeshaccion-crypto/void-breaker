# Void Breaker — Phase 2 Deterministic Build Prompt

This document has two parts:
1. **Gap Analysis** — every place the original spec was qualitative/underspecified, and the exact value I assigned to close it.
2. **The Prompt** — a fully locked build prompt with those values embedded, so any LLM/agent run produces the same implementation.

---

## Part 1: Gap Analysis

| # | Gap in original spec | Assumption filled in |
|---|---|---|
| 1 | No canvas/logical resolution stated | 960×540 logical resolution, scaled to fit viewport |
| 2 | Phase 1 player baseline stats not restated | HP 3, speed 250px/s, dash distance 150px, base dash cooldown 1.5s |
| 3 | No card-selection algorithm (weighted? duplicates allowed?) | Weighted random, no duplicate cards within a single 3-card offer; unique cards (Black Hole, Overload, Twin Ship) capped at 1 pick ever; all other cards stack infinitely |
| 4 | No rule for which tier appears on which wave | Waves 1–4: Tier 1 only. Waves 5–9: Tier 1 (60%) / Tier 2 (40%). Waves 10+: Tier 1 (30%) / Tier 2 (40%) / Tier 3 (30%) |
| 5 | Splitter: no HP/speed/spawned-Swarmer stats | Splitter HP 3, speed 90px/s, spawns 2 Swarmers (HP 1, speed 180px/s) on death. First appears wave 6+ |
| 6 | Shielded Drone: no HP, shield arc, rotation speed | HP 5, shield blocks a 180° arc, rotates at 45°/s. First appears wave 6+ |
| 7 | Mimic: no HP, spawn wave, fire-rate cap | HP 4, first appears wave 11+, fire rate mirrors player but capped at 2× baseline to avoid runaway difficulty |
| 8 | Dreadnought (Boss 1): no HP, bullet speed/pattern numbers | HP 150; spiral fires 8 bullets, rotating 5°/frame, bullet speed 150px/s; core weak point takes 3× damage; below 50% HP, spiral fires every 0.5s (was 1s) and spawns 2 Swarmers every 8s |
| 9 | Nemesis (Boss 2): no HP, hitbox scale, ability-copy timing | HP 200; hitbox 64px (2× player's 32px); snapshots the player's upgrade set at the moment wave 10 starts (does not gain new upgrades mid-fight — keeps the fight deterministic and fair) |
| 10 | The Void (Boss 3): no HP scaling across repeats, spawn cadence | Base HP 250, +50 HP each repeat cycle (wave 15, 20, 25…); spawns 1 Splitter every 4s from a random screen edge |
| 11 | Asteroids: no HP, contact damage, count randomization method | HP 8, deals 1 heart of contact damage to the player, 6–10 spawned per Zone 2 run (seeded by run RNG, not per-wave) |
| 12 | Nebula fog: no visibility radius, surge magnitude | Visible radius 180px around player; "nebula surge" increases enemy speed 40% for 4 seconds, every 30s |
| 13 | Weapons: no damage/fire-rate/energy numbers | See full weapon table in prompt below (Part 2, §5) |
| 14 | Void Shard earn formula: not specified | `shards = floor(score / 100) + (waves_survived × 5) + (boss_kills × 25)` |
| 15 | Hangar upgrade costs: not specified | Hull Reinforcement 150/purchase (max 2), Afterburner 200, Armory Access 250, Bonus Drop Rate 175, Head Start 300 |
| 16 | localStorage schema / corruption handling: not specified | Single key `voidbreaker.meta`, JSON shape `{shards, unlocks: {}, bestWave, bestScore}`; wrapped in try/catch, falls back to defaults on parse failure |
| 17 | Difficulty scaling per wave: not specified | Enemy count per wave = `4 + floor(wave × 1.5)`, capped at 40 concurrent enemies |
| 18 | Performance targets: not specified | 60fps target; enemy cap 40; bullet cap 200 (object-pooled/recycled, not GC-churned) |
| 19 | Audio layer specifics: only described qualitatively | Ambient: 55Hz sine, constant. Rhythm: starts wave 3, BPM = `90 + wave×2` capped at 160. Intensity: low-pass filter cutoff scales inversely with on-screen enemy count. Boss: detuned sawtooth at 110Hz root, 1.5s gain-ramp crossfade in/out |
| 20 | Pause/mute controls: not mentioned | In scope for Phase 2 — Esc pauses, `M` toggles mute; required for a shippable build even though spec didn't ask |
| 21 | Colorblind/accessibility: not mentioned | Out of scope for Phase 2 — explicitly deferred, not silently added, so it doesn't get treated as a missed requirement later |
| 22 | Mobile/touch: spec lists it under Phase 3 | Confirmed out of scope — desktop keyboard/mouse only for Phase 2 |

---

## Part 2: The Prompt

```
You are implementing Phase 2 of "Void Breaker," a browser-based arcade shooter, 
built entirely in vanilla JS + Canvas + WebAudio (no external game engine, no 
build step beyond what Phase 1 already uses). Phase 1 is complete and must not 
regress.

═══════════════════════════════════════════
OPERATING RULES (apply to every milestone)
═══════════════════════════════════════════
1. Build milestones in the exact order listed in §9. Do not skip, reorder, 
   or merge milestones.
2. Do not add any feature, enemy, upgrade, weapon, or screen not explicitly 
   listed below. If you believe something is missing, stop and ask — do not 
   invent it.
3. Every numeric value below is final and must be implemented exactly as 
   written (no rounding, no "roughly," no placeholder values).
4. All new game data (upgrades, enemies, weapons, zones, hangar items) must 
   be defined as data structures (arrays/objects) that a system reads — not 
   hardcoded if/else branches — so Phase 3 can extend them without rewrites.
5. Canvas logical resolution: 960×540, scaled to fit viewport (letterboxed, 
   maintain aspect ratio).
6. Player base stats (carried over from Phase 1, restated for reference): 
   HP 3, move speed 250px/s, dash distance 150px, base dash cooldown 1.5s.
7. Target 60fps. Hard caps: 40 concurrent enemies, 200 concurrent bullets 
   (pool and recycle bullet objects — do not allocate/GC per shot).
8. Persist meta-progress under a single localStorage key: `voidbreaker.meta`, 
   shape: `{ shards: number, unlocks: {}, bestWave: number, bestScore: number }`. 
   Wrap all reads in try/catch; fall back to `{shards:0, unlocks:{}, bestWave:0, 
   bestScore:0}` on missing/corrupt data.
9. Esc pauses the game. `M` toggles mute. These are required even though not 
   in the original spec — flag them as an added minimum-viable requirement, 
   don't skip them.
10. Do NOT implement anything from "Phase 3 Preview" (leaderboard, daily 
    seed, ship skins, mobile touch). If asked mid-build to add these, refuse 
    and point back to this constraint.
11. Colorblind/accessibility support is explicitly OUT of scope for Phase 2 
    — note it as deferred, do not silently add or silently skip it.

═══════════════════════════════════════════
FILE STRUCTURE — create/modify exactly these
═══════════════════════════════════════════
js/upgradeManager.js   — new
js/boss.js             — new
js/zones.js            — new
js/weapons.js          — new
js/metaProgress.js     — new
js/audio.js            — new
js/ui.js               — modify in place
js/main.js             — modify in place

═══════════════════════════════════════════
§1. UPGRADE SYSTEM
═══════════════════════════════════════════
Trigger: after every wave clear, pause and show 3 upgrade cards.

Selection algorithm:
- Weighted random, NO duplicate cards within a single 3-card offer.
- Unique cards (Black Hole, Overload, Twin Ship) can be picked at most ONCE 
  per run — remove from pool after taken.
- All other cards stack infinitely (effects are additive/multiplicative per 
  the modifier, applied at point of effect).
- Tier availability by wave:
  - Waves 1–4: Tier 1 only.
  - Waves 5–9: Tier 1 (60% weight) / Tier 2 (40% weight).
  - Waves 10+: Tier 1 (30%) / Tier 2 (40%) / Tier 3 (30%).
- If player doesn't pick within 2 seconds, auto-pick a random card from the 
  3 shown (do not skip — always resolve to a pick).

Card pool (implement exactly these 12, exact values, no more):

Tier 1:
- Overclock — fire rate +15%
- Armor Plating — max HP +1
- Quick Dash — dash cooldown −0.3s
- Scattershot — bullets split into 2 on impact
- Magnet — power-up pickup radius ×2

Tier 2:
- Chain Lightning — every 5th bullet arcs to a nearby enemy
- Afterburn — bullets leave a fire trail dealing area damage
- Ghost Dash — dash passes through enemies and damages them
- Bouncer — bullets ricochet off walls once

Tier 3 (unique, max 1 pick each):
- Black Hole — Q key launches a singularity pulling/crushing enemies, 30s cooldown
- Overload — every 10th kill triggers a screen-wide damage pulse
- Twin Ship — a drone mirrors player movement and fires alongside them

Store as `playerUpgrades[]`. Apply modifiers at point of effect (multiply 
fire rate, adjust dash timer constant, etc.) — never re-derive stats from 
scratch each frame.

═══════════════════════════════════════════
§2. ENEMY TYPES (exact stats — none of this was in the original spec, 
now finalized)
═══════════════════════════════════════════

**Splitter** (first appears wave 6+)
- HP: 3, Speed: 90px/s
- On death: spawns 2 Swarmers (HP 1, Speed 180px/s) at death position

**Shielded Drone** (first appears wave 6+)
- HP: 5
- Shield blocks a 180° arc, rotates at 45°/s
- Bullets hitting the shielded side are nullified; hits on the exposed 
  side deal normal damage
- Black Hole upgrade strips the shield instantly if it hits

**Mimic** (first appears wave 11+)
- HP: 4
- Copies player ship shape and movement pattern (randomized directional 
  bursts matching player's average speed)
- Fire rate mirrors the player's current fire rate, HARD CAPPED at 2× 
  the base Pulse Cannon fire rate (prevents runaway difficulty from 
  stacked Overclock cards)

Difficulty scaling: enemy count per wave = `4 + floor(wave × 1.5)`, hard 
capped at 40 concurrent enemies. Enemy type weighting per zone as described 
in §4.

═══════════════════════════════════════════
§3. BOSS WAVES (every 5th wave — exact numbers finalized)
═══════════════════════════════════════════

**Boss 1 — The Dreadnought (wave 5)**
- HP: 150
- Attack: fires an 8-bullet spiral, rotating 5°/frame, bullet speed 150px/s
- Weak point: glowing core on one side, takes 3× damage
- Phase 2 (below 50% HP): spiral fires every 0.5s (was 1s); spawns 2 
  Swarmers every 8s

**Boss 2 — Nemesis (wave 10)**
- HP: 200
- Hitbox: 64px (2× player's 32px)
- At the moment wave 10 begins, SNAPSHOT the player's current 
  `playerUpgrades[]` and weapon — Nemesis uses exactly that build for the 
  entire fight (does not gain further upgrades mid-fight; keeps the 
  encounter deterministic and testable)
- Fire rate matches the player's fire rate at time of snapshot

**Boss 3 — The Void (wave 15, repeats every 5 waves after: 15, 20, 25…)**
- HP: `250 + 50 × cycle_number` (cycle_number starts at 0 on wave 15)
- Central black hole pulls all entities inward at a constant force
- Spawns 1 Splitter every 4s from a random screen edge

Boss Incoming screen: full-screen flash + "BOSS INCOMING" title card, 
1.5s duration, before boss spawns. Boss health bar slides in from top.

═══════════════════════════════════════════
§4. ZONE SYSTEM
═══════════════════════════════════════════

**Zone 1 — Deep Space (waves 1–5)**: Phase 1 arena, no hazards.

**Zone 2 — Asteroid Field (waves 6–10)**
- 6–10 asteroids (count randomized once per run via run RNG seed, not 
  re-rolled per wave), HP 8 each
- Bullets blocked by asteroids (usable as cover)
- Contact with player deals 1 heart of damage
- On destruction: drops a power-up at the current global drop rate 
  (base 20%, see §6 for the Hangar upgrade that raises this to 30%)

**Zone 3 — Nebula Core (waves 11+)**
- Fog overlay darkens screen edges; player has a clear-vision radius 
  of 180px, enemies emerge from fog at that boundary
- "Nebula surge" every 30s: all enemies gain +40% speed for 4 seconds

Zone transition: short "Zone N — [Name]" title card on entry. Zone is a 
background + hazard layer drawn beneath all entities. Track `currentZone` 
and swap on wave threshold.

═══════════════════════════════════════════
§5. WEAPON CLASSES (exact stats — finalized)
═══════════════════════════════════════════

Selectable at menu/Hangar. One active per run (Armory Access hangar upgrade 
unlocks Laser Beam and Seeker Missiles as selectable).

| Weapon | Damage | Fire Rate | Projectile Speed | Notes |
|---|---|---|---|---|
| Pulse Cannon (default) | 1/hit | 6 shots/s | 500px/s | Single bolt, Phase 1 baseline |
| Shotgun Blaster | 1/pellet × 5 pellets | 2 shots/s | 450px/s | 30° total cone spread |
| Laser Beam | 3/s continuous | held-fire | n/a (beam) | Energy pool 100, drains 20/s while firing, regenerates 15/s while idle; hitting 0 energy forces a 1s forced cooldown |
| Seeker Missiles | 4/hit | reload 1.2s | 300px/s | Turn rate 180°/s, targets nearest enemy within 400px radius; fires straight if no target in range |

Upgrade interactions: Scattershot affects Pulse Cannon and Shotgun pellets 
individually. Chain Lightning triggers off every 5th Laser Beam damage tick 
as well as every 5th bullet for projectile weapons.

═══════════════════════════════════════════
§6. META CURRENCY — VOID SHARDS
═══════════════════════════════════════════

Earn formula (exact, applied at end of run):
```
shards = floor(score / 100) + (waves_survived × 5) + (boss_kills × 25)
```

Hangar upgrades (persist across runs, purchased with accumulated shards):

| Upgrade | Cost | Effect | Max purchases |
|---|---|---|---|
| Hull Reinforcement | 150/purchase | +1 max HP per purchase | 2 |
| Afterburner | 200 | Start every run with dash cooldown at 1s (not 1.5s) | 1 |
| Armory Access | 250 | Unlocks Laser Beam + Seeker Missiles as starting weapon options | 1 |
| Bonus Drop Rate | 175 | Power-up drop chance raised from 20% to 30% globally | 1 |
| Head Start | 300 | Start each run at wave 2 instead of wave 1 | 1 |

═══════════════════════════════════════════
§7. UI SCREENS
═══════════════════════════════════════════

**Hangar (pre-run)**: spend shards per §6 table, select starting weapon 
(locked options grayed out until unlocked), display best wave / best score.

**Upgrade Pick (between waves)**: 3 cards per §1 algorithm, 2s auto-pick 
countdown.

**Boss Incoming**: per §3.

**End of Run**: final wave, final score, shards earned this run (show the 
§6 formula breakdown: score component / wave component / boss component), 
kill count, power-ups collected, upgrades taken list. Buttons: Hangar / 
Play Again.

═══════════════════════════════════════════
§8. AUDIO — LAYERED WEBAUDIO SOUNDTRACK
═══════════════════════════════════════════

Generated entirely via WebAudio API, no audio files. Four layers, 
crossfaded with `AudioContext.createGain()` ramp functions:

- **Ambient layer**: 55Hz sine oscillator, constant, always playing
- **Rhythm layer**: starts wave 3, pulsing beat, tempo = `90 + wave × 2` 
  BPM, capped at 160 BPM
- **Intensity layer**: low-pass filter cutoff frequency scales inversely 
  with current on-screen enemy count (more enemies = darker/closed filter,
  fewer enemies = brighter/open filter)
- **Boss layer**: swaps to a detuned sawtooth oscillator at 110Hz root 
  while a boss is active, 1.5s gain-ramp crossfade in and out

═══════════════════════════════════════════
§9. BUILD ORDER — implement in this exact sequence
═══════════════════════════════════════════
1. Upgrade pick screen (§1) — 3-card choice, all 5 Tier 1 cards implemented, 
   `playerUpgrades[]` wired up.
2. Boss 1 Dreadnought (§3) + boss health bar UI.
3. Zone 2 Asteroid Field (§4) — destructible asteroids, transition card.
4. New enemy types: Splitter, Shielded Drone, Mimic (§2), exact stats.
5. Weapon class selection, all 4 weapons (§5) + Tier 2 upgrade cards.
6. Void Shard system + Hangar screen + permanent upgrades (§6).
7. Zone 3 Nebula Core + Boss 2 Nemesis + Boss 3 The Void (§3, §4).
8. Layered WebAudio soundtrack (§8) + End of Run breakdown screen (§7).

═══════════════════════════════════════════
ACCEPTANCE CRITERIA — per milestone
═══════════════════════════════════════════
A milestone is complete only when:
- Every numeric value matches this document exactly (no approximation).
- Phase 1 functionality is unmodified and still passes a full run-through.
- No console errors across a full playthrough: Hangar → Wave 1 → death/quit.
- New systems are data-driven (see Operating Rule #4), not hardcoded branches.

═══════════════════════════════════════════
OUTPUT FORMAT — after each milestone, report:
═══════════════════════════════════════════
1. Files changed/created
2. One-paragraph summary of what was implemented
3. Checklist: values match spec exactly ✅ / Phase 1 unaffected ✅ / no 
   invented features added ✅
4. Explicit "ready to proceed to Milestone N+1 — awaiting go-ahead" — do 
   not auto-continue to the next milestone without confirmation.

If you encounter any value or behavior not covered by this document, STOP 
and ask a single clarifying question. Do not guess.
```

---

**Why this version is fully deterministic**, not just structured: every quantity that was previously an adjective ("slow," "fast," "reduced visibility," "raised drop rate") is now a number with units, every system that could branch two different ways (card duplicates? boss ability timing? asteroid count re-rolling?) has one explicit rule, and the milestone checkpoint format prevents silent scope drift across a long build.
