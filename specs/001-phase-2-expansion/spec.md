# Feature Specification: Phase 2 Expansion

**Feature Branch**: `N/A — no branch created`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "refer phase2.md" — the Phase 2 deterministic build specification for Void Breaker.

## Clarifications

### Session 2026-11-02

- Q: The current code uses 5 HP, 300 px/s, and a shorter dash, while `phase2.md` Operating Rule 6 states 3 HP, 250 px/s, 150 px dash distance, and a 1.5s cooldown. Which source governs? → A: Align to `phase2.md`: 3 HP, 250 px/s, 150 px dash distance, and a 1.5s base dash cooldown.
- Q: Do boss waves also spawn a regular enemy batch? → A: No. Boss waves are boss-only plus boss summons; the enemy-count formula applies to non-boss waves.
- Q: How should non-unique upgrades stack? → A: Linear/additive per stack: Overclock multiplies fire rate by 1.15; Armor Plating adds 1 max HP; Quick Dash subtracts 0.3s to a 0.1s floor; Scattershot splits into 2 projectiles per stack (2 at one stack, 4 at two); Magnet doubles pickup radius; Chain Lightning adds 1 arc target; Afterburn adds 1 trail damage; Ghost Dash adds 1 dash-contact damage; Bouncer adds 1 wall ricochet.
- Q: What does `waves_survived` mean when the player dies mid-wave? → A: Count only fully cleared waves; dying during wave 7 after clearing waves 1–6 awards 6.
- Q: How should the unspecified Shielded Drone, The Void, Black Hole, Overload, and Twin Ship values be resolved? → A: Use conservative defaults: Shielded Drone drifts at 60 px/s and does not shoot; The Void pulls player/enemies at 80 px/s² and projectiles at 40 px/s², capped at 120 px/s; Black Hole has 120 px radius, 1.5s duration, 160 px/s² pull, 1 damage per 0.25s per enemy; Overload deals 3 damage to all on-screen enemies every 10th kill; Twin Ship offsets 40 px, mirrors the player's movement, fire rate, and weapon damage, and triggers no extra upgrade effects.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Between-Wave Upgrade Draft (Priority: P1)

After clearing a wave, the player is offered three upgrade cards and must choose one. The offer
respects card rarity by wave, never repeats a card in the same offer, and resolves automatically
if the player does not choose within two seconds.

**Why this priority**: Upgrades are the core progression loop that makes repeated waves feel
different and gives the player agency over their build.

**Independent Test**: Clear a wave and verify the offer contains exactly three unique cards, that
only eligible tiers appear, that a selected card applies its effect immediately, and that waiting
two seconds produces an automatic pick.

**Acceptance Scenarios**:

1. **Given** the player has cleared a wave, **When** the upgrade screen opens, **Then** exactly
   three distinct cards are shown and no card appears twice in the same offer.
2. **Given** waves 1–4, **When** cards are offered, **Then** only Tier 1 cards appear.
3. **Given** waves 5–9, **When** cards are offered, **Then** Tier 1 cards appear with 60% weight
   and Tier 2 cards with 40% weight.
4. **Given** waves 10 and later, **When** cards are offered, **Then** Tier 1, Tier 2, and Tier 3
   cards appear with 30%, 40%, and 30% weights respectively.
5. **Given** a unique Tier 3 card has already been taken in the run, **When** a later offer is
   generated, **Then** that card cannot appear again.
6. **Given** the player takes a non-unique card more than once, **When** the effect is applied,
   **Then** the effects stack according to the card's modifier.
7. **Given** the player makes no selection for two seconds, **When** the timer expires, **Then**
   the system automatically picks one of the three shown cards.
8. **Given** the player owns Black Hole, Overload, or Twin Ship, **When** the effect triggers,
   **Then** it uses the documented defaults: Black Hole has a 120 px radius, 1.5-second duration,
   160 px/s² pull, and 1 damage per 0.25 seconds per enemy; Overload deals 3 damage to all
   on-screen enemies every 10th kill; Twin Ship offsets 40 px and mirrors the player's movement,
   fire rate, and weapon damage without triggering extra upgrade effects.
9. **Given** the player owns Black Hole, **When** they press Q, **Then** a singularity launches
   and the 30-second cooldown begins; pressing Q while the cooldown is active does nothing.

---

### User Story 2 - Boss Encounters Every Fifth Wave (Priority: P1)

Every fifth wave introduces a boss with a distinct identity and attack pattern. A short
"BOSS INCOMING" card builds tension, a boss health bar appears, and later bosses add phases or
repeating escalation.

**Why this priority**: Bosses are the pacing peaks of the run and the primary test of the player's
accumulated build.

**Independent Test**: Reach wave 5, 10, and 15 in sequence and verify each boss's identity,
health, attack pattern, phase behavior, and health-bar presentation against the specified values.

**Acceptance Scenarios**:

1. **Given** the player reaches wave 5, **When** the wave begins, **Then** a 1.5-second
   full-screen flash and "BOSS INCOMING" title card play before the Dreadnought appears with
   150 HP.
2. **Given** the Dreadnought is active, **When** it attacks, **Then** it fires an 8-bullet spiral
   rotating 5° per 1/60s tick (300°/s), applied with delta time, at 150 px/s, and its glowing core
   takes 3× damage.
3. **Given** the Dreadnought falls below 50% HP, **When** phase 2 begins, **Then** the spiral
   fires every 0.5 seconds instead of every 1 second and it spawns 2 Swarmers every 8 seconds.
4. **Given** the player reaches wave 10, **When** the Nemesis appears, **Then** it has 200 HP and
   a 64 px hitbox, and it uses a snapshot of the player's upgrades and weapon taken at the start
   of the fight for its entire duration.
5. **Given** the player reaches wave 15, **When** The Void appears, **Then** it has 250 HP, pulls
   the player and enemies inward at 80 px/s² and projectiles at 40 px/s² capped at 120 px/s, and
   spawns 1 Splitter every 4 seconds from a random screen edge.
6. **Given** The Void appears again on waves 20, 25, and later, **When** it spawns, **Then** its
   HP is 250 plus 50 per repeat cycle, starting at cycle 0 on wave 15.
7. **Given** a boss becomes active, **When** the encounter starts, **Then** a boss health bar
   slides in from the top of the screen.

---

### User Story 3 - Zone Progression and Environmental Hazards (Priority: P1)

The run moves through three visually and mechanically distinct zones. Each zone introduces a
hazard layer and a short title card so the player understands that the rules of the arena changed.

**Why this priority**: Zones provide structure to long runs and force the player to adapt beyond
enemy stat changes.

**Independent Test**: Start a run and advance through waves 1, 6, and 11, verifying each zone
title card, the Phase 1 arena background, and the exact hazard values.

**Acceptance Scenarios**:

1. **Given** the player is on waves 1–5, **When** the arena is shown, **Then** Zone 1 "Deep Space"
   uses the Phase 1 arena with no hazards.
2. **Given** the player reaches wave 6, **When** Zone 2 "Asteroid Field" begins, **Then** a zone
   title card appears and 6–10 asteroids are placed using a count randomized once per run.
3. **Given** an asteroid is present, **When** a projectile hits it, **Then** the projectile is
   blocked; **When** the player touches it, **Then** the player loses 1 heart.
4. **Given** an asteroid with 8 HP is destroyed, **When** it breaks, **Then** it drops a power-up
   at the current global drop rate.
5. **Given** the player reaches wave 11, **When** Zone 3 "Nebula Core" begins, **Then** a zone
   title card appears, fog darkens the screen edges, and the player has a 180 px clear-vision
   radius.
6. **Given** the player is in Zone 3, **When** 30 seconds pass, **Then** all enemies gain 40%
   speed for 4 seconds as a nebula surge.

---

### User Story 4 - Expanded Enemy Roster (Priority: P2)

New enemy types enter the wave mix at defined waves, each requiring a different response:
splitting threats, directional shielding, and a mirror of the player's own build.

**Why this priority**: Enemy variety is the main source of moment-to-moment tactical decisions.

**Independent Test**: Reach waves 6 and 11 and verify each new enemy type's first appearance,
health, speed, and special behavior.

**Acceptance Scenarios**:

1. **Given** the player reaches wave 6, **When** a Splitter is defeated, **Then** it spawns 2
   Swarmers at its death position; the Splitter has 3 HP and 90 px/s speed, and each Swarmer has
   1 HP and 180 px/s speed.
2. **Given** a Shielded Drone is present, **When** a projectile hits its shielded 180° arc,
   **Then** the projectile is nullified; hits on the exposed side deal normal damage.
3. **Given** a Shielded Drone is present, **When** time passes, **Then** its shield rotates at
   45° per second.
4. **Given** a Black Hole effect hits a Shielded Drone, **When** it connects, **Then** the shield
   is stripped immediately.
5. **Given** the player reaches wave 11, **When** a Mimic appears, **Then** it has 4 HP, copies
   the player's ship shape and movement bursts, and mirrors the player's fire rate up to a hard
   cap of twice the base Pulse Cannon fire rate.
6. **Given** any wave begins, **When** enemies spawn, **Then** the wave enemy count is
   `4 + floor(wave × 1.5)` for non-boss waves and never exceeds 40 concurrent enemies.
7. **Given** a Shielded Drone is present, **When** it moves, **Then** it drifts at 60 px/s and
   does not fire ranged attacks.

---

### User Story 5 - Weapon Class Selection (Priority: P2)

Before a run, the player selects one weapon class. Each class has a distinct feel and exact combat
profile, and some classes are unlocked through persistent progression.

**Why this priority**: Weapon choice defines the player's baseline offense and changes how
upgrades are valued.

**Independent Test**: Start a run with each available weapon and verify damage, fire rate,
projectile speed, energy behavior, targeting, and upgrade interactions.

**Acceptance Scenarios**:

1. **Given** the player has no Armory Access, **When** the Hangar is shown, **Then** Pulse Cannon
   and Shotgun Blaster are selectable, and Laser Beam and Seeker Missiles are visibly locked.
2. **Given** Armory Access is purchased, **When** the Hangar is shown, **Then** Laser Beam and
   Seeker Missiles become selectable.
3. **Given** the player selects Pulse Cannon, **When** firing, **Then** it deals 1 damage per hit
   at 6 shots per second with 500 px/s projectiles.
4. **Given** the player selects Shotgun Blaster, **When** firing, **Then** it fires 5 pellets of
   1 damage each at 2 shots per second with 450 px/s projectiles in a 30° total cone.
5. **Given** the player selects Laser Beam, **When** firing, **Then** it deals 3 damage per second
   continuously, drains 20 energy per second from a 100-energy pool, regenerates 15 energy per
   second while idle, and forces a 1-second cooldown at zero energy.
6. **Given** the player selects Seeker Missiles, **When** firing, **Then** it deals 4 damage per
   hit, reloads in 1.2 seconds, travels at 300 px/s, turns at 180° per second, targets the nearest
   enemy within 400 px, and fires straight when no target is in range.
7. **Given** Scattershot is owned, **When** Pulse Cannon or Shotgun projectiles hit, **Then** those
   projectiles split individually.
8. **Given** Chain Lightning is owned, **When** every fifth Laser damage tick or every fifth
   projectile hit occurs, **Then** the effect arcs to a nearby enemy.

---

### User Story 6 - Persistent Meta Progression and Run Summary (Priority: P2)

At the end of a run, the player earns Void Shards based on performance, sees a breakdown of the
formula, and can spend shards in the Hangar on permanent upgrades that make future runs stronger.

**Why this priority**: Persistence gives failure a payoff and creates a reason to return.

**Independent Test**: Complete a run with known score, fully cleared waves, and boss kills; verify
the shard total and breakdown, purchase each Hangar upgrade, and confirm the effects and
persistence on the next run.

**Acceptance Scenarios**:

1. **Given** a run ends, **When** the summary appears, **Then** it shows final wave, final score,
   shards earned, the score/wave/boss formula breakdown, kill count, power-ups collected, and the
   list of upgrades taken.
2. **Given** a run ends with score, fully cleared waves, and boss kills, **When** shards are
   awarded, **Then** the total is
   `floor(score / 100) + (waves_survived × 5) + (boss_kills × 25)`.
3. **Given** the player has enough shards, **When** they buy Hull Reinforcement, **Then** they pay
   150 shards and gain +1 max HP, up to 2 purchases.
4. **Given** the player has enough shards, **When** they buy Afterburner, **Then** they pay 200
   shards once and start every run with a 1-second dash cooldown instead of 1.5 seconds.
5. **Given** the player has enough shards, **When** they buy Armory Access, **Then** they pay 250
   shards once and unlock Laser Beam and Seeker Missiles.
6. **Given** the player has enough shards, **When** they buy Bonus Drop Rate, **Then** they pay
   175 shards once and raise the global power-up drop chance from 20% to 30%.
7. **Given** the player has enough shards, **When** they buy Head Start, **Then** they pay 300
   shards once and start each run at wave 2.
8. **Given** saved progress is missing or corrupt, **When** the game loads, **Then** it falls back
   to zero shards, no unlocks, best wave 0, and best score 0 without crashing.
9. **Given** the player returns after a prior run, **When** the Hangar opens, **Then** purchased
   upgrades, unlocks, best wave, and best score are still present.

---

### User Story 7 - Layered Audio and Run Controls (Priority: P2)

The game builds atmosphere with a layered synthesized soundtrack that responds to wave, enemy
pressure, and boss presence. The player can pause at any time and mute audio.

**Why this priority**: Audio feedback and pause/mute are required for a shippable, comfortable
play experience.

**Independent Test**: Play from wave 1 through a boss while verifying each audio layer enters and
crossfades as specified, then verify Escape pauses, M mutes, and Quit to Hangar exits without an
award.

**Acceptance Scenarios**:

1. **Given** the game is running, **When** any wave is active, **Then** a constant 55 Hz ambient
   sine layer plays.
2. **Given** the player reaches wave 3, **When** the rhythm layer starts, **Then** its tempo is
   `90 + wave × 2` BPM, capped at 160 BPM.
3. **Given** enemies are on screen, **When** their count changes, **Then** the intensity layer
   darkens and closes as the enemy count rises and brightens and opens as the screen clears.
4. **Given** a boss becomes active, **When** the boss layer enters, **Then** a detuned sawtooth at
   110 Hz root crossfades in over 1.5 seconds; when the boss ends, it crossfades out over 1.5
   seconds.
5. **Given** the game is playing, **When** the player presses Escape, **Then** the game pauses;
   pressing Escape again resumes it.
6. **Given** audio is on, **When** the player presses M, **Then** audio mutes; pressing M again
   unmutes it.
7. **Given** the game is paused, **When** the player selects Quit to Hangar, **Then** the run ends
   and returns to the Hangar without awarding shards or updating best records.

---

### Edge Cases

- If the player has taken all available unique cards, later offers contain only stackable cards.
- If the upgrade timer expires while the player has made no input, a shown card is always picked;
  the offer never resolves to no upgrade.
- If saved meta progress is malformed or absent, the game resets to safe defaults without blocking
  play.
- If The Void repeats, each repeat cycle increases HP by exactly 50 over the previous cycle.
- If an asteroid count is randomized, the count is fixed for the entire run and does not re-roll
  between waves.
- If a Mimic mirrors an upgraded fire rate, its fire rate never exceeds twice the base Pulse
  Cannon fire rate.
- If a Shielded Drone is hit by Black Hole, the shield is removed before damage resolution.
- If the player pauses during normal gameplay, the game state and all timers stop until resumed.
- If a boss wave is active, no separate regular enemy batch spawns; only the boss and its summons
  are present.
- If the player dies partway through a wave, only fully cleared waves count toward
  `waves_survived` and the shard reward; `bestWave` still records the highest wave reached.
- If the player quits from the pause overlay, the run ends immediately, no summary award is
  granted, and best records are unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Phase 2 MUST preserve all Phase 1 functionality and MUST NOT regress existing play,
  scoring, waves, power-ups, controls, or game-over flow, except for the clarified player baseline
  in FR-040.
- **FR-002**: The upgrade draft MUST present exactly three distinct cards after every wave clear.
- **FR-003**: The upgrade draft MUST enforce tier availability and weights by wave: waves 1–4 Tier
  1 only; waves 5–9 Tier 1 at 60% and Tier 2 at 40%; waves 10+ Tier 1 at 30%, Tier 2 at 40%, and
  Tier 3 at 30%.
- **FR-004**: Unique cards Black Hole, Overload, and Twin Ship MUST be removable after one pick and
  MUST NOT reappear in that run.
- **FR-005**: All non-unique upgrade effects MUST stack indefinitely using the card-specific
  linear or multiplicative rules in FR-042.
- **FR-006**: The upgrade draft MUST auto-pick one of the three shown cards after two seconds of
  no selection.
- **FR-007**: The upgrade pool MUST contain exactly the 12 specified cards with their exact tier
  and effect values, and no additional cards.
- **FR-008**: Upgrade modifiers MUST be applied at the point of effect when relevant rather than
  re-derived from scratch every frame.
- **FR-009**: Boss waves MUST occur every fifth wave, with the Dreadnought on wave 5, the Nemesis
  on wave 10, and The Void on wave 15 and every fifth wave thereafter.
- **FR-010**: Every boss encounter MUST begin with a 1.5-second full-screen flash and "BOSS
  INCOMING" title card before the boss spawns.
- **FR-011**: The Dreadnought MUST use 150 HP, an 8-bullet spiral rotating 5° per 1/60s tick
  (300°/s, applied with delta time) at 150 px/s, a 3× damage weak core, and phase-2 behavior below
  50% HP: 0.5-second spiral interval and 2 Swarmers every 8 seconds.
- **FR-012**: The Nemesis MUST use 200 HP, a 64 px hitbox, and a snapshot of the player's upgrade
  set and weapon taken at the start of wave 10, without gaining upgrades during the fight.
- **FR-013**: The Void MUST use base 250 HP plus 50 HP per repeat cycle, pull the player and
  enemies inward at 80 px/s² and projectiles at 40 px/s² capped at 120 px/s, and spawn 1 Splitter
  every 4 seconds from a random screen edge.
- **FR-014**: A boss health bar MUST slide in from the top when a boss encounter begins.
- **FR-015**: Zone 1 MUST cover waves 1–5 with no hazards; Zone 2 MUST cover waves 6–10; Zone 3
  MUST cover wave 11 onward. All zones MUST reuse the Phase 1 arena background; zone visual
  distinction comes from hazard layers, not new background art.
- **FR-016**: Zone transitions MUST show a short "Zone N — [Name]" title card on entry.
- **FR-017**: Zone 2 MUST spawn 6–10 asteroids with 8 HP each, chosen once per run from the run's
  random source.
- **FR-018**: Asteroids MUST block projectiles, deal 1 heart of contact damage, and drop a power-up
  on destruction at the current global drop rate.
- **FR-019**: Zone 3 MUST darken screen edges with fog, give the player a 180 px clear-vision
  radius, and make enemies emerge from the fog boundary.
- **FR-020**: Zone 3 MUST trigger a nebula surge every 30 seconds that grants all enemies +40%
  speed for 4 seconds.
- **FR-021**: The Splitter MUST have 3 HP and 90 px/s speed and spawn 2 Swarmers with 1 HP and
  180 px/s speed on death.
- **FR-022**: The Shielded Drone MUST have 5 HP and 60 px/s speed, MUST NOT fire ranged attacks,
  MUST have a 180° shield arc rotating at 45° per second, MUST nullify hits on the shielded side,
  MUST take normal damage on the exposed side, and MUST lose its shield immediately to Black Hole.
- **FR-023**: The Mimic MUST have 4 HP, copy the player's ship shape and movement bursts, and
  mirror the player's fire rate up to twice the base Pulse Cannon fire rate.
- **FR-024**: For non-boss waves, enemy count MUST be `4 + floor(wave × 1.5)` and MUST never
  exceed 40 concurrent enemies.
- **FR-025**: The player MUST select one weapon per run from Pulse Cannon, Shotgun Blaster, Laser
  Beam, and Seeker Missiles, with Laser Beam and Seeker Missiles locked until Armory Access is
  purchased.
- **FR-026**: Pulse Cannon MUST deal 1 damage per hit at 6 shots per second with 500 px/s
  projectiles.
- **FR-027**: Shotgun Blaster MUST fire 5 pellets of 1 damage at 2 shots per second with 450 px/s
  projectiles in a 30° total cone.
- **FR-028**: Laser Beam MUST deal 3 damage per second while held, use a 100-energy pool, drain 20
  energy per second while firing, regenerate 15 energy per second while idle, and force a
  1-second cooldown when energy reaches zero.
- **FR-029**: Seeker Missiles MUST deal 4 damage per hit, reload in 1.2 seconds, travel at 300 px/s,
  turn at 180° per second, target the nearest enemy within 400 px, and fire straight when no target
  is in range.
- **FR-030**: Scattershot MUST split Pulse Cannon and Shotgun pellets individually on impact, and
  Chain Lightning MUST trigger every fifth projectile hit or every fifth Laser damage tick.
- **FR-031**: Void Shards earned per run MUST equal
  `floor(score / 100) + (waves_survived × 5) + (boss_kills × 25)`, where `waves_survived` is the
  number of fully cleared waves, not the highest wave reached.
- **FR-032**: The Hangar MUST offer exactly five permanent upgrades with the specified costs,
  effects, and purchase caps: Hull Reinforcement 150 (max 2), Afterburner 200 (max 1), Armory
  Access 250 (max 1), Bonus Drop Rate 175 (max 1), and Head Start 300 (max 1).
- **FR-033**: Meta progress MUST persist shards, unlocks, best wave (the highest wave reached,
  independent of fully cleared waves), and best score across sessions and MUST fall back to zeroed
  defaults when saved data is missing or corrupt.
- **FR-034**: The end-of-run summary MUST show final wave, final score, shards earned with the
  three-part formula breakdown, kill count, power-ups collected, and upgrades taken, with Hangar
  and Play Again actions.
- **FR-035**: The soundtrack MUST include a constant 55 Hz ambient layer, a rhythm layer starting
  on wave 3 with tempo `90 + wave × 2` capped at 160 BPM, an intensity layer that darkens and
  closes as enemy count rises and brightens and opens as the screen clears, and a boss layer using
  a detuned 110 Hz sawtooth with 1.5-second crossfades.
- **FR-036**: Escape MUST pause and resume the game, M MUST toggle mute, and the pause overlay
  MUST offer Quit to Hangar; quitting MUST end the run without awarding shards or updating best
  records.
- **FR-037**: New upgrades, enemies, bosses, zones, weapons, and Hangar items MUST be addable by
  extending content definitions without changing existing behavior.
- **FR-038**: The game MUST remain responsive at the 60 frames-per-second target with up to 40
  concurrent enemies and 200 concurrent projectiles.
- **FR-039**: The game MUST run directly in a browser with no installation, build step, or
  downloaded assets.
- **FR-040**: The player baseline MUST be 3 HP, 250 px/s movement, 150 px dash distance, and a
  1.5-second base dash cooldown, matching `phase2.md` rather than the current implementation.
- **FR-041**: Boss waves MUST spawn only the active boss and any summons created by that boss;
  they MUST NOT add a separate regular enemy batch.
- **FR-042**: Non-unique upgrade stacks MUST resolve as follows: Overclock multiplies fire rate by
  1.15 per stack; Armor Plating adds 1 max HP per stack; Quick Dash subtracts 0.3 seconds per stack
  to a 0.1-second floor; Scattershot splits into 2 projectiles per stack (2 at one stack, 4 at two);
  Magnet doubles pickup radius per stack; Chain Lightning keeps its every-fifth-hit trigger and
  adds 1 arc target per stack; Afterburn adds 1 trail damage per stack; Ghost Dash adds 1
  dash-contact damage per stack; Bouncer adds 1 wall ricochet per stack.
- **FR-043**: Unspecified effect values MUST use the following conservative defaults: the Shielded
  Drone drifts at 60 px/s and has no ranged attack; The Void pulls the player and enemies inward
  at 80 px/s² and projectiles at 40 px/s², capped at 120 px/s; Black Hole has a 120 px radius,
  1.5-second duration, 160 px/s² pull, and deals 1 damage per 0.25 seconds per enemy inside;
  Overload deals 3 damage to all on-screen enemies every 10th kill; Twin Ship offsets 40 px from
  the player, mirrors the player's movement, fire rate, and weapon damage, and triggers no
  additional upgrade effects.
- **FR-044**: When Black Hole is owned, pressing Q MUST launch the singularity and start a
  30-second cooldown; pressing Q while the cooldown is active or before Black Hole is owned MUST
  do nothing.

### Key Entities *(include if feature involves data)*

- **Run**: A single play session from weapon selection to game over, carrying wave, score, kills,
  power-ups, upgrades, current zone, and boss state.
- **Upgrade Card**: A selectable reward with a name, tier, weight, stacking rule, unique flag, and
  effect.
- **Enemy Type**: A definition carrying health, speed, movement behavior, attack behavior, and
  first-appearance wave.
- **Boss Encounter**: A boss definition carrying health, hitbox, attack pattern, phase threshold,
  summons, and repeat scaling.
- **Zone**: A wave range with a name, hazard rules, visual treatment, and transition card.
- **Weapon Class**: A selectable starting weapon with damage, fire rate, projectile behavior, and
  unlock state.
- **Meta Profile**: Persistent shards, unlocks, best wave (highest reached), and best score that
  survive across runs.
- **Run Summary**: The end-of-run record containing score, waves, boss kills, shards, and collected
  items.
- **Audio Layer**: An ambient, rhythm, intensity, or boss sound layer with its own entry condition
  and mix behavior.

### Scope Boundaries

- In scope: the seven user stories above, the 12 specified upgrades, three new enemy types, three
  bosses, three zones, four weapons, five Hangar upgrades, the shard economy, the end-of-run
  summary, the layered soundtrack, and pause/mute controls.
- Out of scope for Phase 2: leaderboards, daily seeds, ship skins, new mobile/touch features, local
  co-op, gamepad support, persistent weapon upgrade trees, and colorblind/accessibility modes.
- Existing shipped touch controls MUST not regress, but Phase 2 is designed and validated for
  desktop keyboard and mouse.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can start a run from the Hangar, play through every zone and boss milestone,
  and reach game over or quit with zero console errors.
- **SC-002**: Across 20 consecutive wave clears, every upgrade offer contains exactly three unique
  cards, every card matches the wave's eligible tier and weight rules, and an unanswered offer is
  always auto-picked at two seconds.
- **SC-003**: All 12 upgrade cards, 3 new enemy types, 3 bosses, 4 weapons, 3 zones, and 5 Hangar
  upgrades exhibit the exact values and behaviors in this specification on first verification.
- **SC-004**: Boss waves 5, 10, and 15 always introduce the correct boss, and repeated Void cycles
  increase HP by exactly 50 each time.
- **SC-005**: A run with known score, fully cleared waves, and boss kills awards the exact
  formula result, and the summary breakdown sums to that result.
- **SC-006**: Purchased Hangar upgrades and recorded bests remain available after reloading, and
  corrupt saved data resets to defaults without blocking play.
- **SC-007**: The rhythm, intensity, and boss audio layers enter, respond, and crossfade at the
  specified thresholds during a full run.
- **SC-008**: Escape pauses and resumes gameplay, M mutes and unmutes audio, and Quit to Hangar
  exits without an award, every time.
- **SC-009**: A Phase 1 regression pass covering movement, aiming, firing, dash, power-ups, wave
  progression, scoring, and game over passes with only the FR-040 baseline changes; all other
  Phase 1 behavior remains unchanged.
- **SC-010**: A full run sustains the target frame rate with up to 40 enemies and 200 projectiles
  active on the reference desktop environment without visible stutter.

## Assumptions

- `phase2.md` is the authoritative Phase 2 contract; its numeric values and ordering rules are
  final and MUST NOT be approximated.
- Phase 1 is complete and playable, and its existing behavior is the regression baseline except
  for the clarified player baseline in FR-040.
- The player is on desktop with a keyboard and mouse for Phase 2 validation; existing touch
  controls are preserved but receive no new Phase 2 features.
- The game remains a zero-build, no-external-asset browser experience.
- Meta progress is stored locally in the browser; there is no account, server sync, or
  cross-device progression.
- Colorblind/accessibility support is deferred and is not a Phase 2 acceptance criterion.
- Phase 3 preview items remain out of scope even if requested during the build.
