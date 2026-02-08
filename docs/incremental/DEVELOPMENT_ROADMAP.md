# Development Roadmap – Incremental Lineup Battler

This roadmap breaks the incremental game into **short, discrete development chunks** that can be **tested in isolation**. Each phase delivers working, testable functionality so that parts can be integrated in later phases without big-bang merges.

**Reference**: [ARCHITECTURE.md](./ARCHITECTURE.md), [BATTLE_MECHANICS.md](./BATTLE_MECHANICS.md), [CORE_CONCEPT.md](./CORE_CONCEPT.md), [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md).

---

## Development Philosophy

1. **Small chunks** – Each milestone is implementable and testable in a focused slice (types, formulas, one engine module, one API surface).
2. **Test in isolation** – Unit tests for pure logic (formulas, timers, resolution); simulation tests for the full battle loop; integration tests for API + engine.
3. **No hidden coupling** – Dependencies flow one way: foundation → engine → data → API → UI. Later phases integrate earlier deliverables.
4. **Ship incrementally** – After Phase 5 you can run a battle via API; after Phase 6 you can run a full PvE encounter; after Phase 7 you have a playable battle UI.

---

## Component Hierarchy

```
Phase 0–1: Types, constants, formulas     (no deps; unit-testable)
     ↓
Phase 2–3: Battle engine (state, timers, resolution, loop)  (depends on 0–1; simulation-testable)
     ↓
Phase 4:   Data layer (Prisma, run/map)    (depends on types)
     ↓
Phase 5:   Run/Map logic                   (depends on 4 + engine)
     ↓
Phase 6:   API (lineups, runs, battle)      (depends on 4, 5, engine)
     ↓
Phase 7:   PvE integration (rewards, bases) (depends on 6)
     ↓
Phase 8–10: UI (battle, map, lineup)       (depends on API)
     ↓
Phase 11+: Shops, Training, PvP, background (depends on 7–10)
```

---

## Phase 0: Foundation & Setup

**Goal**: Folder structure, test setup, and shared types with no game logic.

**Before starting**: See [phase-0/PHASE_0_PENDING.md](./phase-0/PHASE_0_PENDING.md) for questions and items to clarify.

### Milestone 0.1: Folder structure and test config
**Dependencies**: None

**Tasks**:
- [ ] Create `src/lib/incremental/` (types, constants, engine, stats).
- [ ] Create `src/routes/incremental/` and `src/routes/api/incremental/` placeholders (empty or minimal).
- [ ] Add Vitest (or existing test runner) config to run tests under `src/lib/incremental/**/*.test.ts`.
- [ ] Ensure incremental code is isolated (no imports from card-battler; can share auth/Prisma later).

**Deliverable**: Empty module layout; `npm run test` can run incremental tests.

**Testing**: Run a single placeholder test under `lib/incremental`.

---

### Milestone 0.2: Core types (no constants yet)
**Dependencies**: 0.1

**Tasks**:
- [ ] Define enums: `PrimaryAttribute` (STR, AGI, INT, UNIVERSAL), `NodeType` (combat, elite, boss, shop, event, rest, base), `BattleResult` (null, win, lose).
- [ ] Define types: `HeroDef`, `AbilityDef`, `EnemyDef`, `EncounterDef` (reference data shapes from ARCHITECTURE and SPELLS_AND_ABILITIES).
- [ ] Define runtime types: `HeroInstance`, `EnemyInstance`, `BattleState` (player side, enemy side, focusedHeroIndex, targetIndex, lastFocusChangeAt, elapsedTime, result).
- [ ] Export from `src/lib/incremental/types.ts`.

**Files**: `src/lib/incremental/types.ts`

**Testing**:
- TypeScript compiles; types can be imported.
- Unit test: build a minimal `BattleState` (e.g. 1 hero, 1 enemy) and assert shape (focusedHeroIndex 0, result null, etc.).

**Deliverable**: All battle and run types needed for the engine and API.

---

## Phase 1: Constants & Stat Formulas

**Goal**: Reference data (heroes, abilities, enemies, encounters) and stat formulas; no engine yet.

### Milestone 1.1: Hero, ability, and enemy definitions (minimal set)
**Dependencies**: 0.2

**Tasks**:
- [ ] Implement `abilities.ts`: at least 3 abilities (e.g. Bristleback passive return damage, Lina Laguna Blade active, one simple enemy attack).
- [ ] Implement `heroes.ts`: Incremental game stats (base attack interval, damage, spell interval, ability id) keyed by **`Hero.id`** (Int) from existing `Hero` table. At least 3 heroes (e.g. Bristleback, Lina, Dazzle)—use their `Hero.id` from Prisma/DB.
- [ ] Implement `encounters.ts`: enemy definitions for 2–3 unit types (e.g. Large Wolf, Small Wolf) with HP, attack interval, damage; one encounter “Wolf Pack” (1 large + 2 small).
- [ ] Export lookup helpers: `getHeroDef(id)`, `getAbilityDef(id)`, `getEncounterDef(id)`.

**Files**: `src/lib/incremental/constants/heroes.ts`, `abilities.ts`, `encounters.ts` (or single `constants/index.ts`).

**Testing**:
- `getHeroDef(heroId)` (heroId = `Hero.id`) returns that hero’s incremental stats (spell interval, Laguna Blade ability id, etc.); hero identity/name from `Hero` table.
- `getEncounterDef('wolf_pack')` returns 3 enemies (1 large, 2 small) with intervals and damage.

**Deliverable**: Minimal reference data to drive the battle engine and API hero list.

---

### Milestone 1.2: Stat formulas
**Dependencies**: 0.2

**Tasks**:
- [ ] `attackInterval(baseInterval, attackSpeed)` – e.g. `base / (1 + AS)` with optional cap.
- [ ] `spellInterval(baseInterval, spellHaste)` – same idea for spells.
- [ ] `attackDamage(baseDamage, modifiers)` – flat damage for now; optional crit/armor later.
- [ ] `spellDamage(baseDamage, spellPower)` – for active spells.
- [ ] `nonFocusTargetPenalty(damage, isTargetEnemyFocus)` – return reduced damage (or multiplier) when attacking non-focus enemy.

**Files**: `src/lib/incremental/stats/formulas.ts`

**Testing**:
- Unit tests with known inputs: e.g. attackInterval(1, 0) = 1; attackInterval(1, 0.5) &lt; 1.
- nonFocusTargetPenalty(100, false) &lt; 100; nonFocusTargetPenalty(100, true) === 100 (or no penalty).

**Deliverable**: Reusable formulas used by the battle engine; no engine code yet.

---

## Phase 2: Battle Engine – State & Timers

**Goal**: Create battle state from lineup + encounter; advance only focused hero’s timers; focus change resets timers and enforces 2s cooldown; 10s auto-rotation.

### Milestone 2.1: Battle state initializer
**Dependencies**: 0.2, 1.1

**Tasks**:
- [ ] `createBattleState(lineupHeroIds, encounterId, options?)`: build `BattleState` with player side (hero instances from hero defs: max HP, current HP, attack/spell timer 0), enemy side (from encounter), focusedHeroIndex 0, targetIndex 0 (e.g. first enemy), lastFocusChangeAt 0, elapsedTime 0, result null.
- [ ] Hero instances include hero id, current/max HP, attackTimer, spellTimer (and ability id for resolution later).

**Files**: `src/lib/incremental/engine/battle-state.ts`

**Testing**:
- createBattleState(['bristleback','lina','dazzle'], 'wolf_pack') returns state with 3 player heroes, 3 enemies, focusedHeroIndex 0, result null.
- All player hero timers are 0; enemy timers can be 0 or seeded.

**Deliverable**: Reproducible initial battle state for any lineup + encounter.

---

### Milestone 2.2: Timer advance and focus rules
**Dependencies**: 2.1, 1.2

**Tasks**:
- [ ] `advanceTimers(state, deltaTime)`: advance **only** `state.player[state.focusedHeroIndex]` attack and spell timers by deltaTime; advance all enemy timers by deltaTime. Do not modify other player heroes’ timers.
- [ ] `applyFocusChange(state, newFocusedHeroIndex)`: if `newFocusedHeroIndex !== state.focusedHeroIndex` and cooldown elapsed (now - lastFocusChangeAt >= 2s): set state.focusedHeroIndex = newFocusedHeroIndex; **reset** previous focused hero’s attackTimer and spellTimer to 0; set new hero’s timers to 0; set lastFocusChangeAt = now. If cooldown not elapsed, return state unchanged (or return error/flag).
- [ ] `applyAutoRotation(state, now)`: if (now - lastFocusChangeAt >= 10s), rotate focus to next hero (cycle), reset previous hero’s timers to 0, update lastFocusChangeAt. Call this from the tick loop when no manual focus change.

**Files**: `src/lib/incremental/engine/timers.ts`

**Testing**:
- advanceTimers: only focused hero’s timers increase; others stay 0.
- applyFocusChange: after change, old hero’s timers are 0, new hero’s timers 0; focus index updated. If called again within 2s, focus does not change.
- applyAutoRotation: after 10s without focus change, focusedHeroIndex cycles; timers of previous focus reset.

**Deliverable**: Timer and focus logic testable without resolution (no damage yet).

---

## Phase 3: Battle Engine – Resolution & Loop

**Goal**: Resolve auto-attack, spell, enemy actions, passives; apply damage and death; run full tick loop; support full battle simulation.

### Milestone 3.1: Action resolution
**Dependencies**: 2.1, 2.2, 1.1, 1.2

**Tasks**:
- [ ] `resolveAutoAttack(state, heroIndex)`: compute damage from hero def + formulas (attackDamage); apply **non-focus penalty** if state.targetIndex !== enemy’s focus index; subtract from enemy at state.targetIndex; if enemy has “on damage taken” passive (e.g. Bristleback), apply return damage to attacker (which may be enemy targeting player hero—clarify: for player hero attacking enemy, return damage is N/A; for enemy attacking player, player hero’s passive can reflect). Apply death (remove or mark dead).
- [ ] `resolveSpell(state, heroIndex)`: if focused hero has active spell at interval, apply spell effect (e.g. Laguna Blade = big magic damage to target); use spellDamage formula; apply death.
- [ ] `resolveEnemyActions(state, deltaTime)`: for each enemy, if attack (or spell) timer >= interval, resolve enemy attack (target player: e.g. front hero or shared target); apply player passive (e.g. Bristleback return damage) when player hero takes damage; reset enemy timer; apply death.
- [ ] Order within tick: **player auto-attack → player spell → enemy actions**; passives fire when their trigger (e.g. damage taken) occurs during resolution.
- [ ] After any resolution step: if all enemies dead → state.result = 'win'; if all player heroes dead → state.result = 'lose'.

**Files**: `src/lib/incremental/engine/resolution.ts`

**Testing**:
- Given state with focused hero attack timer >= interval, resolveAutoAttack reduces enemy HP; timer reset.
- Given state with focused hero spell timer >= interval, resolveSpell reduces enemy HP (or applies effect); timer reset.
- When enemy attacks player hero with Bristleback passive, attacker takes return damage.
- When all enemies HP <= 0, state.result === 'win'.

**Deliverable**: All resolution steps; battle can progress to win/loss with manual tick sequencing.

---

### Milestone 3.2: Battle loop (tick)
**Dependencies**: 2.2, 3.1

**Tasks**:
- [ ] `tick(state, deltaTime, options?)`: (1) Apply optional focus change from options (if provided and cooldown OK). (2) Apply auto-rotation if 10s since lastFocusChangeAt. (3) Advance timers (advanceTimers). (4) If focused hero attack timer >= interval, resolve auto-attack then reset timer. (5) If focused hero spell timer >= interval, resolve spell then reset timer. (6) Resolve enemy actions (advance enemy timers already done; for each that reached interval, resolve and reset). (7) If state.result set, return. Return new state (immutable or mutated clone).
- [ ] Support `options: { focusChange?: number, targetChange?: number }` for tests and API.

**Files**: `src/lib/incremental/engine/battle-loop.ts`

**Testing**:
- **Simulation test**: Create state (3 heroes, wolf_pack); loop tick(state, 0.1) until state.result !== null; assert result is 'win' or 'lose' and battle runs to completion (e.g. no infinite loop). Optionally use fixed seed if RNG introduced.
- **Focus test**: tick with focusChange to different hero; assert timers reset and 2s cooldown blocks immediate second change.
- **Auto-rotation test**: tick 10s without focusChange; assert focusedHeroIndex changes.

**Deliverable**: Full battle engine testable in isolation; can simulate entire battle from start to finish.

---

## Phase 4: Data Layer

**Goal**: Persist lineups, runs, and map state; no battle state persistence required for initial PvE (battle can be in-memory per request).

### Milestone 4.1: Prisma schema and migrations
**Dependencies**: 0.2 (types only; no engine)

**Tasks**:
- [ ] Add `IncrementalLineup`: id, userId, name, **heroIds** (ordered array of **Int** = `Hero.id` from existing `Hero` table; Option A per ARCHITECTURE), createdAt, updatedAt.
- [ ] Add `IncrementalRun`: id, userId, lineupId, status (active | won | dead), currentNodeId, startedAt, finishedAt; optional seed.
- [ ] Add `IncrementalMapNode`: id, runId, nodeType (enum), encounterId (nullable), nextNodeIds (JSON), floor/act (optional). Or embed map as JSON on run for v1.
- [ ] Run migration; ensure existing auth (User) can own lineups and runs.

**Files**: `prisma/schema.prisma`, migration.

**Testing**:
- Create lineup, run; query by userId. No battle state in DB yet.

**Deliverable**: DB can store lineups and runs; map can be stored per run (e.g. JSON map graph or rows).

---

### Milestone 4.2: Map graph and run initialization
**Dependencies**: 4.1

**Tasks**:
- [ ] Define a minimal **map graph** (e.g. 3 combat nodes → 1 elite → 1 boss; or linear). Node type, encounterId for combat/elite/boss, nextNodeIds.
- [ ] `createRunMap(runId, seed?)`: generate or assign map nodes to run (write to DB or return in-memory graph for run).
- [ ] `getRunState(runId)`: return run + current node + next node choices (for API).

**Files**: `src/lib/incremental/map/graph.ts` (or under engine/), plus run service that uses Prisma.

**Testing**:
- createRunMap produces a valid path; getRunState returns current node and next options.

**Deliverable**: Starting a run creates a run record and map; API can read run state.

---

## Phase 5: Run & Encounter Flow

**Goal**: Advance run to next node; start battle when entering combat/elite/boss; no rewards or base healing yet.

### Milestone 5.1: Start run and advance node
**Dependencies**: 4.1, 4.2, 2.1

**Tasks**:
- [ ] `startRun(userId, lineupId)`: create IncrementalRun, create/assign map, set currentNodeId to first node. Validate lineup has 1–5 heroes.
- [ ] `advanceRun(runId, userId, nextNodeId)`: validate nextNodeId is in current node’s nextNodeIds; set run.currentNodeId = nextNodeId. If new node is combat/elite/boss, return encounterId and lineup so caller can create battle state.
- [ ] When entering combat node: create battle state (createBattleState(lineup.heroIds, encounterId)) and either attach to run in memory/cache or return to client for this request. Battle state persistence (e.g. Redis or DB) can be added in Phase 7 for “resume battle.”

**Files**: `src/lib/incremental/run/run-service.ts` (or under server/), using Prisma and battle-state.

**Testing**:
- startRun creates run with map; advanceRun moves to next node; when node is combat, advanceRun returns encounterId and battle can be created.

**Deliverable**: Run lifecycle: start → advance → enter encounter (battle state created).

---

## Phase 6: API Layer

**Goal**: REST API for lineups, runs, battle (get state, set focus/target, tick); auth on all endpoints.

### Milestone 6.1: Lineups and heroes API
**Dependencies**: 4.1, 1.1

**Tasks**:
- [ ] `GET /api/incremental/lineups` – list current user’s lineups (from Prisma).
- [ ] `POST /api/incremental/lineups` – body `{ name, heroIds }` (heroIds = array of `Hero.id` Int); create lineup (validate 1–5, ids exist in `Hero` table).
- [ ] `GET /api/incremental/lineups/[id]` – get lineup by id (auth: own only).
- [ ] `PATCH /api/incremental/lineups/[id]` – update name or heroIds.
- [ ] `DELETE /api/incremental/lineups/[id]` – delete lineup.
- [ ] `GET /api/incremental/heroes` – return hero definitions from constants (for lineup builder UI).

**Files**: `src/routes/api/incremental/lineups/+server.ts`, `lineups/[id]/+server.ts`, `heroes/+server.ts`.

**Testing**:
- Integration: create lineup, get, update, delete; get heroes returns list.

**Deliverable**: Lineup CRUD and hero list available via API.

---

### Milestone 6.2: Runs and battle API
**Dependencies**: 5.1, 3.2

**Tasks**:
- [ ] `POST /api/incremental/runs` – body `{ lineupId }`; start run (run-service.startRun).
- [ ] `GET /api/incremental/runs/[runId]` – return run + map state (current node, next nodes).
- [ ] `POST /api/incremental/runs/[runId]/advance` – body `{ nextNodeId }`; advance run; if new node is combat/elite/boss, create battle state (in-memory or cache keyed by runId) and return encounter started.
- [ ] `GET /api/incremental/runs/[runId]/battle` – return current battle state for run (if in encounter).
- [ ] `PATCH /api/incremental/runs/[runId]/battle` – body `{ focusedHeroIndex?, targetIndex?, deltaTime }`. Apply focus/target change (with 2s cooldown); run tick(state, deltaTime) and persist state back to cache/run; return new battle state. If result win/lose, update run (e.g. status, or mark node complete) and clear battle.

**Files**: `src/routes/api/incremental/runs/+server.ts`, `runs/[runId]/+server.ts`, `runs/[runId]/advance/+server.ts`, `runs/[runId]/battle/+server.ts`.

**Testing**:
- Integration: start run → advance to combat → get battle → PATCH with focus + deltaTime multiple times → battle ends win/lose → run state updated.

**Deliverable**: Full PvE flow callable from client: start run, advance, fight battle via API, battle resolves.

---

## Phase 7: PvE Integration – Rewards & Bases

**Goal**: After battle win: apply small heal, grant XP and gold; base node heals; run status and map progress persist.

### Milestone 7.1: Post-encounter rewards and base healing
**Dependencies**: 6.2, 4.1

**Tasks**:
- [ ] On battle **win**: apply small health (and mana if modeled) restore to lineup; grant XP (per-hero) and gold. Store run-level gold/XP or attach to run (e.g. run.gold, run.xpByHeroId).
- [ ] On **advance** to a **base** node: apply fountain heal (e.g. full heal or large restore) to lineup for next encounter.
- [ ] On battle **lose**: set run status to dead; no advance; optionally partial rewards (e.g. “reached floor 3”).
- [ ] Persist run state (current node, gold, XP, hero current HP for next encounter) in DB or run record.

**Files**: Run service + battle PATCH handler (when result is set, apply rewards and update run).

**Testing**:
- Win battle → run has updated gold/XP and hero HP restored for next node.
- Advance to base node → lineup HP restored for next encounter.

**Deliverable**: PvE run feels complete: fight → rewards → advance → base heals; defeat ends run.

---

## Phase 8: UI – Battle Screen

**Goal**: Minimal playable battle UI: display lineup, focus, timers, target, enemies; tap to focus (with 2s cooldown); change target; poll or push battle state from API.

### Milestone 8.1: Battle view and focus/target actions
**Dependencies**: 6.2

**Tasks**:
- [ ] Page or component: load battle state from `GET /api/incremental/runs/[runId]/battle`. Display player heroes (1–5), current focus (highlight), attack and spell timer progress (bars or countdowns), 2s cooldown indicator after focus switch.
- [ ] Display enemy list with HP and which is enemy “focus”; show shared target selection.
- [ ] Tap hero to set focus (call PATCH with focusedHeroIndex); tap enemy to set target (call PATCH with targetIndex). Enforce 2s cooldown in UI (disable or show cooldown).
- [ ] Poll or interval: every 100–200 ms send PATCH with deltaTime to advance battle; update local state from response. Or use a single “tick” button for testing.
- [ ] When result win/lose, show outcome and redirect or offer “continue” (advance to next node).

**Files**: `src/routes/incremental/run/[runId]/battle/+page.svelte`, optional components for hero row, enemy row, timer bar.

**Testing**:
- Manual: start run, advance to combat, complete battle on UI (focus, target, tick until win/loss). Verify 2s cooldown and timer reset on focus change.

**Deliverable**: Playable battle on the website with correct focus/target and timers.

---

## Phase 9: UI – Map & Run Flow

**Goal**: Map view shows current node and choices; advance to next node (combat → battle screen; base → heal then next).

### Milestone 9.1: Map page and navigation
**Dependencies**: 6.2, 8.1

**Tasks**:
- [ ] Page `incremental/run/[runId]`: load run state (current node, next nodes). Display current node type (combat, elite, boss, base, shop, etc.) and next node choices (e.g. buttons or links).
- [ ] On “choose next node”: call POST advance with nextNodeId. If response indicates battle started, redirect to `run/[runId]/battle`. If base, show “healed” and then show next choices again.
- [ ] After battle win from battle screen, redirect back to map (run/[runId]) with updated state and next choices.

**Files**: `src/routes/incremental/run/[runId]/+page.svelte`, navigation from battle to map.

**Testing**:
- Manual: start run from lineup → see map → advance to combat → battle → win → back to map → advance to next node or base.

**Deliverable**: Full PvE run playable in browser: lineup → start run → map → battle → rewards → map → …

---

## Phase 10: UI – Lineup Builder

**Goal**: User can pick 1–5 heroes from a list (unlocked heroes; for v1 can be “all defined heroes”) and save lineup; start run from lineup.

### Milestone 10.1: Lineup builder page
**Dependencies**: 6.1

**Tasks**:
- [ ] Page to list user’s lineups (from GET lineups) and “Create lineup” or “Edit.”
- [ ] Lineup editor: fetch GET heroes; show selectable heroes (1–5 slots); save via POST (create) or PATCH (update). Validate 1–5.
- [ ] From lineup list or detail, “Start run” button → POST runs with lineupId → redirect to run/[runId] (map).

**Files**: `src/routes/incremental/lineup/+page.svelte`, `lineup/[id]/+page.svelte` (or single page with create/edit).

**Testing**:
- Create lineup with 3 heroes, start run, land on map with that lineup for first combat.

**Deliverable**: End-to-end: build lineup → start run → map → battle → rewards.

---

## Phase 11: Shops & Relics (Optional / Later)

**Goal**: Shop node: spend gold on run boosts and relics; apply modifiers in battle (spell haste, attack poison, etc.).

### Milestone 11.1: Shop data and run modifiers
**Dependencies**: 7.1

**Tasks**:
- [ ] Define run boosts (e.g. +regen, +attack damage, +spell damage) and relics (e.g. “all spells 25% faster,” “auto attacks add poison stack”). Store run’s purchased boosts/relics (e.g. JSON on run or small table).
- [ ] When creating battle state, apply run modifiers to hero stats (formulas read run modifiers).
- [ ] Shop node: on advance, show shop UI; spend gold; update run’s boosts/relics; then show next map choices.

**Files**: Constants for boosts/relics; run schema extension; battle-state or formulas use modifiers; shop UI.

**Deliverable**: Gold has meaning; shop node modifies run and battle.

---

## Phase 12: Hero Unlock & Training (Optional / Later)

**Goal**: Heroes unlocked via Dota 2 wins (and forge); Training for passive stat growth per hero; battle uses trained stats.

### Milestone 12.1: Unlock and Training data
**Dependencies**: 4.1, 6.1

**Tasks**:
- [ ] Define how Dota 2 wins map to hero unlock/boost (reuse or mirror card-battler forge/claim if applicable). Persist “unlocked heroes” and optionally “hero progress” per user.
- [ ] Training: per **(userId, heroId)** where heroId = `Hero.id` (Option A); persist (e.g. IncrementalHeroTraining table). Training can be “queued” and advance over time or on login (design choice).
- [ ] When building battle state, resolve each lineup slot: heroId → Hero + incremental stats + that user’s training for that heroId.
- [ ] Lineup builder: only show unlocked heroes (from `Hero` table); show training progress per hero in UI.

**Files**: Prisma models for unlock/training; run/battle state uses trained stats; API for training queue and progress; UI for training.

**Deliverable**: Progression tied to Dota 2 and passive Training; lineup strength reflects unlocks and training.

---

## Phase 13: PvP (Optional / Later)

**Goal**: Separate PvP mode: two players, two lineups; both send focus/target; battle pauses if either leaves.

### Milestone 13.1: PvP battle flow
**Dependencies**: 6.2, 8.1

**Tasks**:
- [ ] PvP match creation (queue or challenge): create battle state with two “player” sides (each has lineup, focus, target). No run/map.
- [ ] API: e.g. POST pvp/match, GET pvp/match/[id], PATCH pvp/match/[id]/battle (each player sends their focus + target + deltaTime or server ticks when both connected). When either player disconnects or leaves, set battle to “paused” and stop ticking.
- [ ] UI: PvP battle screen (same as PvE but two human sides); show “waiting for opponent” or “paused” when other left.

**Files**: PvP-specific API and battle state (two lineups); engine already supports “enemy side = hero lineup” from BATTLE_MECHANICS.

**Deliverable**: Playable PvP battles with pause when either player leaves.

---

## Phase 14: Background PvE (Optional / Later)

**Goal**: When player leaves battle screen, battle continues on server (auto-rotation every 10s); on return, show current state; persist battle state.

### Milestone 14.1: Persistent battle and background tick
**Dependencies**: 6.2, 7.1

**Tasks**:
- [ ] Persist battle state (e.g. Redis or DB) keyed by runId when in encounter. On GET battle, load from store.
- [ ] Background job or on-next-request: if run has active battle and last tick was N seconds ago, run tick with deltaTime and auto-rotation until result or max iterations; persist state. So “leave and come back” can show battle already won/lost.
- [ ] Optional: real-time tick (cron or queue) every 1s for active battles with no recent client tick.

**Files**: Battle state persistence; background tick (e.g. serverless function or cron); GET battle loads from store.

**Deliverable**: PvE runs can complete even if the player closes the tab (using auto-rotation).

---

## Summary Table

| Phase | Focus | Test in isolation | Integrates with |
|-------|--------|-------------------|------------------|
| 0 | Setup, types | Placeholder test, type shape | All |
| 1 | Constants, formulas | Unit tests | Engine |
| 2 | State, timers | Unit + small integration | Resolution |
| 3 | Resolution, loop | Simulation (full battle) | API |
| 4 | Prisma, map | DB + map tests | Run flow |
| 5 | Run/encounter flow | Service tests | API |
| 6 | API | Integration (curl/Playwright) | UI |
| 7 | Rewards, bases | Integration | UI flow |
| 8 | Battle UI | Manual + E2E | Map UI |
| 9 | Map UI | Manual + E2E | Lineup |
| 10 | Lineup UI | Manual + E2E | Full game |
| 11–14 | Shops, Training, PvP, background | Per-milestone | Existing |

---

## Recommended Order and Checkpoints

- **Checkpoint A (playable battle in code)**: Complete Phases 0–3. You can simulate a full battle and test focus/timers/resolution in tests.
- **Checkpoint B (playable via API)**: Complete Phases 4–6. You can start a run, advance to combat, and run a battle via API (e.g. Postman or Bruno).
- **Checkpoint C (playable in browser)**: Complete Phases 7–10. Full PvE loop in UI: lineup → run → map → battle → rewards → map.
- **Checkpoint D (full vision)**: Add Phases 11–14 as needed (shops, Training, PvP, background PvE).

Use this roadmap to implement in short chunks; run tests after each milestone so integration in later phases stays straightforward.
