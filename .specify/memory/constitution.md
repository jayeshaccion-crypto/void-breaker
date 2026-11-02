<!--
Sync Impact Report
==================
Version change: TEMPLATE (unadopted) → 1.0.0
Bump rationale: Initial ratification; all five principles and both governance sections
are new, so the first concrete version is 1.0.0.

Modified principles:
- Added I. Vanilla-Only, Zero-Build Runtime (NON-NEGOTIABLE)
- Added II. Deterministic Gameplay Contracts
- Added III. Phase-Scoped Delivery
- Added IV. Performance and Resource Discipline
- Added V. Playable, Testable Acceptance

Added sections:
- Additional Constraints
- Development Workflow and Quality Gates
- Governance

Removed sections: None (template placeholders replaced).

Templates requiring updates:
- ✅ .specify/templates/plan-template.md — Constitution Check gates made concrete
- ✅ .specify/templates/spec-template.md — Reviewed; no mandatory-section changes required
- ✅ .specify/templates/tasks-template.md — Reviewed; existing task categories remain compatible
- ✅ README.md — Reviewed; tech stack and run instructions already align
- ✅ void-breaker-spec.md and phase2.md — Reviewed; principles derived from these sources

Follow-up TODOs: None. All placeholders resolved.
-->

# Void Breaker Constitution

## Core Principles

### I. Vanilla-Only, Zero-Build Runtime (NON-NEGOTIABLE)

The game MUST run using only HTML5 Canvas, vanilla ES6 JavaScript modules, and the Web Audio
API. Frameworks, game engines, build steps, bundlers, npm runtime dependencies, external
image/audio/font assets, and network services MUST NOT be introduced. The project MUST remain
runnable by opening `index.html` directly or serving the repository with any static file server.

Rationale: The zero-build, zero-asset constraint is the defining property of Void Breaker. It
keeps the game instantly playable, auditable, and portable, and prevents dependency drift from
changing game behavior.

### II. Deterministic Gameplay Contracts

Every gameplay value defined by the active specification MUST be implemented exactly as written:
health, speeds, cooldowns, fire rates, damage, enemy counts, drop rates, score and shard formulas,
boss phases, and hard caps. Approximation, silent tuning, or substitution of "reasonable" values
is prohibited. Gameplay data (enemies, upgrades, weapons, zones, bosses, hangar items) MUST be
defined as data structures consumed by systems, not as scattered hardcoded conditionals.
Gameplay-affecting randomness MUST flow through a single run-scoped random source so a run can be
reproduced from its seed; cosmetic-only effects MAY use a separate source.

Rationale: Deterministic contracts make features testable, balance changes reviewable, and future
phases extensible without rewrites.

### III. Phase-Scoped Delivery

Work MUST follow the milestone order of the active phase specification. Milestones MUST NOT be
skipped, reordered, or merged without explicit user approval. Features, enemies, upgrades,
weapons, screens, and systems not listed in the active scope MUST NOT be added; when a requirement
is ambiguous or missing, the agent MUST stop and ask one clarifying question rather than invent a
behavior. Explicitly deferred items MUST remain deferred and MUST be recorded as deferred, not
silently implemented or silently omitted. Each completed milestone MUST end with an explicit
"ready for go-ahead" report; work MUST NOT auto-continue into the next milestone without approval.

Rationale: The project is delivered through deliberately locked phases. Scope discipline preserves
the deterministic build order and prevents late-stage surprises.

### IV. Performance and Resource Discipline

The game MUST target 60 frames per second at a 960x540 logical resolution, scaled and letterboxed
to preserve aspect ratio, with movement driven by delta time. Hard caps MUST be enforced at a
maximum of 40 concurrent enemies and 200 concurrent bullets. Bullets and particles MUST be
object-pooled and recycled; hot paths MUST NOT allocate per shot, per particle spawn, or per
frame. Persistent state MUST use the single localStorage key `voidbreaker.meta` with the documented
JSON shape, and every read MUST be wrapped in error handling that falls back to defaults on
missing or corrupt data. Audio MUST be generated at runtime through Web Audio gain ramps and MUST
NOT block the game loop.

Rationale: Arcade feel depends on stable frame pacing. Fixed caps and pooling keep the experience
predictable on modest hardware without a build or asset pipeline.

### V. Playable, Testable Acceptance

A milestone is complete only when a full playthrough from entry screen through gameplay to death
or quit can be completed with no console errors, all specified numeric values match the active
specification, and previously shipped behavior still works. State transitions (menu, hangar,
playing, upgrade selection, boss encounter, pause, end of run) MUST be explicit, recoverable, and
testable. Input contracts MUST match the active specification; keyboard, mouse, and any shipped
touch controls MUST remain functional unless the active phase explicitly removes them. Every
acceptance claim MUST identify what was exercised and what was observed.

Rationale: A browser game is accepted by playing it. Explicit state transitions and full-run
checks catch regressions that isolated unit checks miss.

## Additional Constraints

- **Runtime stack**: HTML5 Canvas, vanilla ES6 modules, and Web Audio only. `requestAnimationFrame`
  drives the loop; game logic uses delta time. No TypeScript, no transpilation, and no package
  manager runtime dependency.
- **Resolution**: 960x540 logical canvas, scaled to fit the viewport while maintaining aspect
  ratio and letterboxing unused space.
- **Persistence**: Exactly one key, `voidbreaker.meta`, with shape
  `{ shards: number, unlocks: object, bestWave: number, bestScore: number }`. Missing or corrupt
  data MUST resolve to `{ shards: 0, unlocks: {}, bestWave: 0, bestScore: 0 }`.
- **Controls and accessibility**: Escape pauses; `M` toggles mute. Existing Phase 1 touch controls
  are preserved unless the active specification removes them. New accessibility or colorblind
  modes are out of scope for Phase 2 and MUST be recorded as deferred rather than added or ignored.
- **Scope boundary**: Phase 3 items such as leaderboards, daily seeds, ship skins, and new mobile
  features MUST NOT be implemented during Phase 2, even if requested mid-build; the agent MUST
  point back to the active phase specification.
- **Assets**: All visuals are drawn with canvas primitives. All audio is synthesized. No fetched
  images, fonts, sound files, or remote data.

## Development Workflow and Quality Gates

1. **Specify first**: Establish or update the feature specification before implementation. Any
   missing numeric or behavioral contract MUST be resolved with the user before coding.
2. **Plan with gates**: Every implementation plan MUST include a Constitution Check covering all
   five principles. Violations MUST be recorded in Complexity Tracking with a concrete justification
   and a rejected simpler alternative.
3. **Task by milestone**: Tasks MUST map to the active phase milestone order and MUST preserve
   independently verifiable increments. No milestone is complete while a prior milestone regresses.
4. **Verify by playing**: Before declaring completion, run the game through the affected paths and
   confirm zero console errors, exact numeric behavior, preserved prior-phase behavior, and
   data-driven definitions.
5. **Report every milestone**: State files changed, a one-paragraph implementation summary, and a
   checklist covering exact values, prior-phase integrity, and no invented features. End by asking
   for go-ahead; do not continue automatically.
6. **No unreviewed drift**: If implementation reveals a conflict between specification, plan, and
   code, stop and surface the conflict. Precedence is business rules, then API or data contracts,
   then architecture constraints, then coding standards, then user preference.

## Governance

This constitution supersedes conflicting practices, prompts, and conventions. Amendments require a
written proposal describing the change, the affected principles or sections, the migration impact
on existing code and specifications, and the version bump type. Amendments take effect only after
the constitution is updated, the Sync Impact Report is refreshed, and dependent templates and
guidance documents are reconciled.

Versioning follows semantic versioning:
- **MAJOR**: A principle is removed, or its meaning changes in a backward-incompatible way.
- **MINOR**: A principle or section is added, or guidance is materially expanded.
- **PATCH**: Clarifications, wording fixes, or non-semantic refinements.

Every implementation plan, task list, and code review MUST verify compliance with this
constitution. Deviations block completion until corrected or explicitly justified in the plan's
Complexity Tracking. Runtime guidance lives in `README.md`, `void-breaker-spec.md`, and the active
phase specification such as `phase2.md`; where those conflict with this constitution, this
constitution prevails.

**Version**: 1.0.0 | **Ratified**: 2026-11-02 | **Last Amended**: 2026-11-02
