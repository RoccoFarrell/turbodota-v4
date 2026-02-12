# Development Roadmap – Incremental Lineup Battler

This roadmap breaks the incremental game into **short, discrete development chunks** that can be **tested in isolation**. Each phase delivers working, testable functionality so that parts can be integrated in later phases without big-bang merges.

**Roster-first launch**: Complete roster system **before** any battling or map UI so you can ship roster building first, then release battle/map later.

| Roster-first order | Section in doc | Content |
|--------------------|----------------|--------|
| Phase 5 | Phase 5 | API – Lineups and Heroes ✅ |
| Phase 6 | Phase 6 goal + **Phase 8** (8.1→6.1, 8.2→6.2, 8.3→6.3) | Essence, mining, roster, convert-win ✅ |
| Phase 7 | Phase 11 | UI – Lineup Builder ✅ |
| Phase 8–9 | Phase 6.2 (doc) | Runs/battle API (run & encounter flow) ✅ |
| Phase 10 | Phase 7 (doc) | PvE Integration ✅ |
| Phase 11 | Phase 9 (doc) | UI – Battle Screen ✅ |
| Phase 12 | Phase 10 (doc) | UI – Map & Run Flow ✅ |
| 13–16 | Phases 12–15 (doc) | Shops, Training, PvP, background |
| 17 | Phase 16 (doc) | User Onboarding (mine → recruit → train → lineup → run + rewards) |

Phases 0–4, run/battle/PvE (doc Phase 5 Run, 6.2 Runs API, Phase 7 PvE), **Phase 5 (Lineups API)**, **Phase 6 / Phase 8 (Essence, mining, roster, convert-win)**, **Phase 7 / Phase 11 (Lineup Builder)**, **Phase 9 (Battle Screen UI)**, and **Phase 10 (Map & Run Flow)** are implemented. Remaining: Phase 12+ (shops, training/leveling, PvP, background). **Phase 16 (User Onboarding)** after Phase 15 (or when 8, 9, 10, 11, 13 are done).

**Reference**: [ARCHITECTURE.md](./ARCHITECTURE.md), [BATTLE_MECHANICS.md](./BATTLE_MECHANICS.md), [CORE_CONCEPT.md](./CORE_CONCEPT.md), [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md), [ESSENCE_AND_BROWSER_ACTIONS.md](./ESSENCE_AND_BROWSER_ACTIONS.md), [HERO_TRAINING.md](./HERO_TRAINING.md), [TRAINING_UI_AND_TALENT_TREE.md](./TRAINING_UI_AND_TALENT_TREE.md) (training UI flow, talent tree plan). **Leveling system**: [LEVELING_SYSTEM.md](./LEVELING_SYSTEM.md) (Melvor-like progression: formula layer, building upgrades, talent application, mining level, skill tree expansion, multi-hero training). **Dota 2 integration**: [DOTA2_REWARDS_ITEMS_LOOTBOX.md](./DOTA2_REWARDS_ITEMS_LOOTBOX.md) (match API payloads, rewards from stats, item system, lootbox for roster-hero wins). **Bank**: [BANK_SYSTEM.md](./BANK_SYSTEM.md) (flexible per-save currencies + item inventory; replaces hardcoded Essence; integrates with idle, Dota, battle, shops).

---

## Development Philosophy

1. **Small chunks** – Each milestone is implementable and testable in a focused slice (types, formulas, one engine module, one API surface).
2. **Test in isolation** – Unit tests for pure logic (formulas, timers, resolution); simulation tests for the full battle loop; integration tests for API + engine.
3. **No hidden coupling** – Dependencies flow one way: foundation → engine → data → API → UI. Later phases integrate earlier deliverables.
4. **Ship incrementally** – **Roster-first**: Phases 5–7 deliver the full roster system (lineups API, Essence + mining + convert-win, lineup builder UI). Ship this as a discrete feature; users mine Essence, convert wins to roster, build lineups. **Later**: Phases 8–12 add run/battle backend and Battle/Map UI.

---

## Component Hierarchy

```
Phase 0–1: Types, constants, formulas     (no deps; unit-testable)
     ↓
Phase 2–3: Battle engine (state, timers, resolution, loop)  (depends on 0–1; simulation-testable)
     ↓
Phase 4:   Data layer (Prisma, run/map)    (depends on types)
     ↓
Phase 5–7: ROSTER SYSTEM (ship first)      Lineups API → Essence/roster/mining → Lineup Builder UI
     ↓
Phase 8–10: Run/battle backend             Run flow, Runs/battle API, PvE rewards (already implemented)
     ↓
Phase 11–12: Battle & Map UI               (depends on 9)
     ↓
Phase 13+: Training, Leveling system (formulas, buildings, talents), Shops, PvP, background
     ↓
Phase 16: User Onboarding (depends on 8, 9, 10, 11, 13)
```

---

## Phase 0: Foundation & Setup ✅ Complete

**Goal**: Folder structure, test setup, and shared types with no game logic.

**Before starting**: See [phase-0/PHASE_0_PENDING.md](./phase-0/PHASE_0_PENDING.md) for questions and items to clarify. **Decisions recorded.** See [phase-0/PHASE_0_COMPLETE.md](./phase-0/PHASE_0_COMPLETE.md) for implementation summary.

### Milestone 0.1: Folder structure and test config ✅
**Dependencies**: None

**Tasks**:
- [x] Create `src/lib/incremental/` (types, constants, engine, stats).
- [x] Create `src/routes/incremental/` and `src/routes/api/incremental/` placeholders (empty or minimal).
- [x] Add Vitest (or existing test runner) config to run tests under `src/lib/incremental/**/*.test.ts`.
- [x] Ensure incremental code is isolated (no imports from card-battler; can share auth/Prisma later).

**Deliverable**: Empty module layout; `npm run test` can run incremental tests.

**Testing**: Run a single placeholder test under `lib/incremental`.

---

### Milestone 0.2: Core types (no constants yet) ✅
**Dependencies**: 0.1

**Tasks**:
- [x] Define enums: `PrimaryAttribute` (STR, AGI, INT, UNIVERSAL), `NodeType` (combat, elite, boss, shop, event, rest, base), `BattleResult` (null, win, lose).
- [x] Define types: `HeroDef`, `AbilityDef`, `EnemyDef`, `EncounterDef` (reference data shapes from ARCHITECTURE and SPELLS_AND_ABILITIES).
- [x] Define runtime types: `HeroInstance`, `EnemyInstance`, `BattleState` (player side, enemy side, focusedHeroIndex, targetIndex, lastFocusChangeAt, elapsedTime, result).
- [x] Export from `src/lib/incremental/types.ts`.

**Files**: `src/lib/incremental/types.ts`

**Testing**:
- TypeScript compiles; types can be imported.
- Unit test: build a minimal `BattleState` (e.g. 1 hero, 1 enemy) and assert shape (focusedHeroIndex 0, result null, etc.).

**Deliverable**: All battle and run types needed for the engine and API.

---

## Phase 1: Constants & Stat Formulas ✅ Complete

**Goal**: Reference data (heroes, abilities, enemies, encounters) and stat formulas; no engine yet.

### Milestone 1.1: Hero, ability, and enemy definitions (minimal set) ✅
**Dependencies**: 0.2

**Tasks**:
- [x] Implement `abilities.ts`: at least 3 abilities (e.g. Bristleback passive return damage, Lina Laguna Blade active, Dazzle Shadow Wave). Auto-attack is intrinsic (HeroDef/EnemyDef attack interval + damage), not an ability.
- [x] Implement `heroes.ts`: Incremental game stats (base attack interval, damage, spell interval, ability id) keyed by **`Hero.id`** (Int) from existing `Hero` table. At least 3 heroes (e.g. Bristleback, Lina, Dazzle)—use their `Hero.id` from Prisma/DB.
- [x] Implement `encounters.ts`: enemy definitions for 2–3 unit types (e.g. Large Wolf, Small Wolf) with HP, attack interval, damage; one encounter “Wolf Pack” (1 large + 2 small).
- [x] Export lookup helpers: `getHeroDef(id)`, `getAbilityDef(id)`, `getEncounterDef(id)`.

**Files**: `src/lib/incremental/constants/heroes.ts`, `abilities.ts`, `encounters.ts`, `constants/index.ts`.

**Testing**:
- `getHeroDef(heroId)` (heroId = `Hero.id`) returns that hero’s incremental stats (spell interval, Laguna Blade ability id, etc.); hero identity/name from `Hero` table.
- `getEncounterDef('wolf_pack')` returns 3 enemies (1 large, 2 small) with intervals and damage.

**Deliverable**: Minimal reference data to drive the battle engine and API hero list.

---

### Milestone 1.2: Stat formulas ✅
**Dependencies**: 0.2

**Tasks**:
- [x] `attackInterval(baseInterval, attackSpeed)` – e.g. `base / (1 + AS)` with optional cap.
- [x] `spellInterval(baseInterval, spellHaste)` – same idea for spells.
- [x] `attackDamage(baseDamage, modifiers)` – flat damage for now; optional crit/armor later.
- [x] `spellDamage(baseDamage, spellPower)` – for active spells.
- [x] `nonFocusTargetPenalty(damage, isTargetEnemyFocus)` – return reduced damage (or multiplier) when attacking non-focus enemy.

**Files**: `src/lib/incremental/stats/formulas.ts`

**Testing**:
- Unit tests with known inputs: e.g. attackInterval(1, 0) = 1; attackInterval(1, 0.5) &lt; 1.
- nonFocusTargetPenalty(100, false) &lt; 100; nonFocusTargetPenalty(100, true) === 100 (or no penalty).

**Deliverable**: Reusable formulas used by the battle engine; no engine code yet.

---

## Phase 2: Battle Engine – State & Timers

**Goal**: Create battle state from lineup + encounter; advance only focused hero’s timers; focus change resets timers and enforces 2s cooldown; 10s auto-rotation.

### Milestone 2.1: Battle state initializer ✅
**Dependencies**: 0.2, 1.1

**Tasks**:
- [x] `createBattleState(lineupHeroIds, encounterId, options?)`: build `BattleState` with player side (hero instances from hero defs: max HP, current HP, attack/spell timer 0), enemy side (from encounter), focusedHeroIndex 0, targetIndex 0 (e.g. first enemy), lastFocusChangeAt 0, elapsedTime 0, result null.
- [x] Hero instances include hero id, current/max HP, attackTimer, spellTimer (and ability id for resolution later).

**Files**: `src/lib/incremental/engine/battle-state.ts`

**Testing**:
- createBattleState(['bristleback','lina','dazzle'], 'wolf_pack') returns state with 3 player heroes, 3 enemies, focusedHeroIndex 0, result null.
- All player hero timers are 0; enemy timers can be 0 or seeded.

**Deliverable**: Reproducible initial battle state for any lineup + encounter.

---

### Milestone 2.2: Timer advance and focus rules ✅
**Dependencies**: 2.1, 1.2

**Tasks**:
- [x] `advanceTimers(state, deltaTime)`: advance **only** `state.player[state.focusedHeroIndex]` attack and spell timers by deltaTime; advance all enemy timers by deltaTime. Do not modify other player heroes’ timers.
- [x] `applyFocusChange(state, newFocusedHeroIndex)`: if `newFocusedHeroIndex !== state.focusedHeroIndex` and cooldown elapsed (now - lastFocusChangeAt >= 2s): set state.focusedHeroIndex = newFocusedHeroIndex; **reset** previous focused hero’s attackTimer and spellTimer to 0; set new hero’s timers to 0; set lastFocusChangeAt = now. If cooldown not elapsed, return state unchanged (or return error/flag).
- [x] `applyAutoRotation(state, now)`: if (now - lastFocusChangeAt >= 10s), rotate focus to next hero (cycle), reset previous hero’s timers to 0, update lastFocusChangeAt. Call this from the tick loop when no manual focus change.

**Files**: `src/lib/incremental/engine/timers.ts`

**Testing**:
- advanceTimers: only focused hero’s timers increase; others stay 0.
- applyFocusChange: after change, old hero’s timers are 0, new hero’s timers 0; focus index updated. If called again within 2s, focus does not change.
- applyAutoRotation: after 10s without focus change, focusedHeroIndex cycles; timers of previous focus reset.

**Deliverable**: Timer and focus logic testable without resolution (no damage yet).

---

## Phase 3: Battle Engine – Resolution & Loop

**Goal**: Resolve auto-attack, spell, enemy actions, passives; apply damage and death; run full tick loop; support full battle simulation.

### Milestone 3.1: Action resolution ✅
**Dependencies**: 2.1, 2.2, 1.1, 1.2

**Tasks**:
- [x] `resolveAutoAttack(state, heroIndex)`: compute damage from hero def + formulas (attackDamage); apply **non-focus penalty** if state.targetIndex !== enemy’s focus index; subtract from enemy at state.targetIndex; if enemy has “on damage taken” passive (e.g. Bristleback), apply return damage to attacker (which may be enemy targeting player hero—clarify: for player hero attacking enemy, return damage is N/A; for enemy attacking player, player hero’s passive can reflect). Apply death (remove or mark dead).
- [x] `resolveSpell(state, heroIndex)`: if focused hero has active spell at interval, apply spell effect (e.g. Laguna Blade = big magic damage to target); use spellDamage formula; apply death.
- [x] `resolveEnemyActions(state, deltaTime)`: for each enemy, if attack (or spell) timer >= interval, resolve enemy attack (target player: e.g. front hero or shared target); apply player passive (e.g. Bristleback return damage) when player hero takes damage; reset enemy timer; apply death.
- [x] Order within tick: **player auto-attack → player spell → enemy actions**; passives fire when their trigger (e.g. damage taken) occurs during resolution.
- [x] After any resolution step: if all enemies dead → state.result = 'win'; if all player heroes dead → state.result = 'lose'.

**Files**: `src/lib/incremental/engine/resolution.ts`

**Testing**:
- Given state with focused hero attack timer >= interval, resolveAutoAttack reduces enemy HP; timer reset.
- Given state with focused hero spell timer >= interval, resolveSpell reduces enemy HP (or applies effect); timer reset.
- When enemy attacks player hero with Bristleback passive, attacker takes return damage.
- When all enemies HP <= 0, state.result === 'win'.

**Deliverable**: All resolution steps; battle can progress to win/loss with manual tick sequencing.

---

### Milestone 3.2: Battle loop (tick) ✅
**Dependencies**: 2.2, 3.1

**Tasks**:
- [x] `tick(state, deltaTime, options?)`: (1) Apply optional focus change from options (if provided and cooldown OK). (2) Apply auto-rotation if 10s since lastFocusChangeAt. (3) Advance timers (advanceTimers). (4) If focused hero attack timer >= interval, resolve auto-attack then reset timer. (5) If focused hero spell timer >= interval, resolve spell then reset timer. (6) Resolve enemy actions (advance enemy timers already done; for each that reached interval, resolve and reset). (7) If state.result set, return. Return new state (immutable or mutated clone).
- [x] Support `options: { focusChange?: number, targetChange?: number }` for tests and API.

**Files**: `src/lib/incremental/engine/battle-loop.ts`

**Testing**:
- **Simulation test**: Create state (3 heroes, wolf_pack); loop tick(state, 0.1) until state.result !== null; assert result is 'win' or 'lose' and battle runs to completion (e.g. no infinite loop). Optionally use fixed seed if RNG introduced.
- **Focus test**: tick with focusChange to different hero; assert timers reset and 2s cooldown blocks immediate second change.
- **Auto-rotation test**: tick 10s without focusChange; assert focusedHeroIndex changes.

**Deliverable**: Full battle engine testable in isolation; can simulate entire battle from start to finish.

---

## Phase 4: Data Layer

**Goal**: Persist lineups, runs, and map state; no battle state persistence required for initial PvE (battle can be in-memory per request).

### Milestone 4.1: Prisma schema and migrations ✅
**Dependencies**: 0.2 (types only; no engine)

**Tasks**:
- [x] Add `IncrementalLineup`: id, userId, name, **heroIds** (ordered array of **Int** = `Hero.id` from existing `Hero` table; Option A per ARCHITECTURE), createdAt, updatedAt.
- [x] Add `IncrementalRun`: id, userId, lineupId, status (active | won | dead), currentNodeId, startedAt, finishedAt; optional seed.
- [x] Add `IncrementalMapNode`: id, runId, nodeType (enum), encounterId (nullable), nextNodeIds (JSON), floor/act (optional). Or embed map as JSON on run for v1.
- [x] Run migration; ensure existing auth (User) can own lineups and runs.

**Files**: `prisma/schema.prisma`, migration.

**Testing**:
- Create lineup, run; query by userId. No battle state in DB yet.

**Deliverable**: DB can store lineups and runs; map can be stored per run (e.g. JSON map graph or rows).

---

### Milestone 4.2: Map graph and run initialization ✅
**Dependencies**: 4.1

**Tasks**:
- [x] Define a minimal **map graph** (e.g. 3 combat nodes → 1 elite → 1 boss; or linear). Node type, encounterId for combat/elite/boss, nextNodeIds.
- [x] `createRunMap(runId, seed?)`: generate or assign map nodes to run (write to DB or return in-memory graph for run).
- [x] `getRunState(runId)`: return run + current node + next node choices (for API).

**Files**: `src/lib/incremental/map/graph.ts` (or under engine/), plus run service that uses Prisma.

**Testing**:
- createRunMap produces a valid path; getRunState returns current node and next options.

**Deliverable**: Starting a run creates a run record and map; API can read run state.

---

## Phase 5: API – Lineups and Heroes

**Goal**: REST API for lineups and hero list. Enables roster system and lineup builder. (Runs/battle API are Phase 9.)

### Milestone 5.1: Lineups and heroes API ✅
**Dependencies**: 4.1, 1.1

**Tasks**:
- [x] `GET /api/incremental/lineups` – list current user's lineups (from Prisma).
- [x] `POST /api/incremental/lineups` – body `{ name, heroIds }` (heroIds = array of `Hero.id` Int); create lineup (validate 1–5, ids exist in Hero/IncrementalHeroBaseStat). Roster validation added in Phase 6.
- [x] `GET /api/incremental/lineups/[id]` – get lineup by id (auth: own only).
- [x] `PATCH /api/incremental/lineups/[id]` – update name or heroIds.
- [x] `DELETE /api/incremental/lineups/[id]` – delete lineup.
- [x] `GET /api/incremental/heroes` – return hero definitions (DB: IncrementalHeroBaseStat + abilities; optional saveId for effective stats with training).

**Files**: `src/routes/api/incremental/lineups/+server.ts`, `lineups/[id]/+server.ts`, `heroes/+server.ts`.

**Testing**: Integration: create lineup, get, update, delete; get heroes returns list.

**Deliverable**: Lineup CRUD and hero list available via API. **Roster-first launch** uses this.

---

## Phase 6: Essence, Browser Actions & Roster ✅ Complete

**Goal**: Meta-currency (Essence), passive browser action system (mining with bar-per-strike), and roster building by converting one win from last 10 Dota 2 games into a roster hero. Design: [ESSENCE_AND_BROWSER_ACTIONS.md](./ESSENCE_AND_BROWSER_ACTIONS.md).

**Roster-first order**: Implement Essence/roster/mining right after Phase 5. Full milestone list: **Phase 8** below (8.1→6.1, 8.2→6.2, 8.3→6.3). The milestones listed next (6.1 Lineups API, 6.2 Runs API) are **already implemented**; in roster-first order they are Phase 5 and Phase 9 respectively.

### Milestone 6.1: Lineups and heroes API ✅ (roster-first: Phase 5)
**Dependencies**: 4.1, 1.1

**Tasks**:
- [x] `GET /api/incremental/lineups` – list current user's lineups (from Prisma).
- [x] `POST /api/incremental/lineups` – body `{ name, heroIds }` (heroIds = array of `Hero.id` Int); create lineup (validate 1–5, ids exist in Hero/IncrementalHeroBaseStat).
- [x] `GET /api/incremental/lineups/[id]` – get lineup by id (auth: own only).
- [x] `PATCH /api/incremental/lineups/[id]` – update name or heroIds.
- [x] `DELETE /api/incremental/lineups/[id]` – delete lineup.
- [x] `GET /api/incremental/heroes` – return hero definitions (DB-backed; optional saveId for training).

**Files**: `src/routes/api/incremental/lineups/+server.ts`, `lineups/[id]/+server.ts`, `heroes/+server.ts`.

**Testing**:
- Integration: create lineup, get, update, delete; get heroes returns list.

**Deliverable**: Lineup CRUD and hero list available via API.

---

### Milestone 6.2: Runs and battle API ✅ (roster-first: Phase 9)
**Dependencies**: 5.1 (Phase 8 Run), 3.2

**Tasks**:
- [x] `POST /api/incremental/runs` – body `{ lineupId }`; start run (run-service.startRun).
- [x] `GET /api/incremental/runs/[runId]` – return run + map state (current node, next nodes).
- [x] `POST /api/incremental/runs/[runId]/advance` – body `{ nextNodeId }`; advance run; if new node is combat/elite/boss, create battle state (in-memory or cache keyed by runId) and return encounter started.
- [x] `GET /api/incremental/runs/[runId]/battle` – return current battle state for run (if in encounter).
- [x] `PATCH /api/incremental/runs/[runId]/battle` – body `{ focusedHeroIndex?, targetIndex?, deltaTime }`. Apply focus/target change (with 2s cooldown); run tick(state, deltaTime) and persist state back to cache/run; return new battle state. If result win/lose, update run (e.g. status, or mark node complete) and clear battle.

**Files**: `src/routes/api/incremental/runs/+server.ts`, `runs/[runId]/+server.ts`, `runs/[runId]/advance/+server.ts`, `runs/[runId]/battle/+server.ts`.

**Testing**:
- Integration: start run → advance to combat → get battle → PATCH with focus + deltaTime multiple times → battle ends win/lose → run state updated.

**Deliverable**: Full PvE flow callable from client: start run, advance, fight battle via API, battle resolves.

---

## Phase 7: PvE Integration – Rewards & Bases ✅ Complete

**Roster-first order**: This is **Phase 10** (implement after Run flow and Runs API). Ship roster (Phases 5–6 + Lineup Builder) first.

**Goal**: After battle win: apply small heal, grant XP and gold; base node heals; run status and map progress persist.

### Milestone 7.1: Post-encounter rewards and base healing ✅
**Dependencies**: 6.2, 4.1

**Tasks**:
- [x] On battle **win**: apply small health (and mana if modeled) restore to lineup; grant XP (per-hero) and gold. Store run-level gold/XP or attach to run (e.g. run.gold, run.xpByHeroId).
- [x] On **advance** to a **base** node: apply fountain heal (e.g. full heal or large restore) to lineup for next encounter.
- [x] On battle **lose**: set run status to dead; no advance; optionally partial rewards (e.g. “reached floor 3”).
- [x] Persist run state (current node, gold, XP, hero current HP for next encounter) in DB or run record.

**Files**: Run service + battle PATCH handler (when result is set, apply rewards and update run).

**Testing**:
- Win battle → run has updated gold/XP and hero HP restored for next node.
- Advance to base node → lineup HP restored for next encounter.

**Deliverable**: PvE run feels complete: fight → rewards → advance → base heals; defeat ends run.

---

## Phase 8: Essence, Browser Actions & Roster ✅ Complete

**Roster-first order**: Implement this **as Phase 6** (8.1→6.1, 8.2→6.2, 8.3→6.3). Content below is the full Essence/roster/mining scope.

**Goal**: Meta-currency (Essence), passive browser action system (mining with bar-per-strike), and roster building by converting one win from last 10 Dota 2 games into a roster hero. Design: [ESSENCE_AND_BROWSER_ACTIONS.md](./ESSENCE_AND_BROWSER_ACTIONS.md).

### Milestone 8.1: Browser action system, Essence, and Mining (backend) ✅
**Dependencies**: 4.1 (Prisma; add bank/action state)

**Tasks**:
- [x] Prisma: Essence per save (`IncrementalSave.essence`); `IncrementalActionState` (saveId, actionType, progress, lastTickAt, actionHeroId, actionStatKey) for server-side reconciliation.
- [x] Types: action type (mining, training), action state (progress 0–1, lastTickAt); mining constants (base duration per strike, Essence per strike).
- [x] Server action engine (pure): given (actionType, progress, lastTickAt, now, rateModifier), compute new progress and completions. Unit-testable (`idle-timer.ts`, `action-engine.ts`).
- [x] `GET /api/incremental/bank` – return current save's Essence balance (query: saveId optional; uses resolveIncrementalSave).
- [x] `POST /api/incremental/action` – body `{ saveId?, lastTickAt, progress, actionType?, actionHeroId?, actionStatKey? }`. Server advances action, grants Essence for mining completions (or training progress), persists state; server-authoritative.

**Files**: `prisma/schema.prisma`, `src/lib/incremental/actions/` (idle-timer, action-engine, action-definitions, constants), `src/routes/api/incremental/bank/+server.ts`, `src/routes/api/incremental/action/+server.ts`.

**Testing**: Unit tests for action engine. Integration: tick mining for N seconds, assert Essence granted; GET bank returns updated balance.

**Deliverable**: Server can tick mining and grant Essence; client can call tick and GET bank.

---

### Milestone 8.2: Roster and convert-win API ✅
**Dependencies**: 8.1, existing match history (Stratz or app's match fetch)

**Tasks**:
- [x] Prisma: `IncrementalRosterHero` (saveId, heroId); `IncrementalConvertedMatch` (saveId, matchId) so each win is converted at most once per save.
- [x] `GET /api/incremental/roster` – return current save's unlocked hero ids (query: saveId optional).
- [x] `GET /api/incremental/roster/eligible-wins` – return last 10 games for user with win/loss and hero; only wins eligible; exclude already-converted matchIds; flag already-on-roster.
- [x] `POST /api/incremental/roster/convert-win` – body `{ saveId?, matchId }`. Validate match in last 10, win, not converted, enough Essence, hero not already on roster. Deduct Essence, add hero to roster, record converted. Return updated roster and bank (essence balance).
- [x] Lineup API: when creating/updating lineup, validate each heroId is in the user's roster for that save. Reject if not.

**Files**: `prisma/schema.prisma`, `src/routes/api/incremental/roster/+server.ts`, `roster/eligible-wins/+server.ts`, `roster/convert-win/+server.ts`; lineups API validates heroIds against roster.

**Testing**: Convert a win → roster contains hero, Essence decreased; same matchId cannot be converted again. Create lineup with non-roster hero → reject.

**Deliverable**: User can spend Essence to convert one win from last 10 into a roster hero; lineups only allow roster heroes.

---

### Milestone 8.3: Mining and convert-win UI ✅
**Dependencies**: 8.1, 8.2

**Tasks**:
- [x] Mining UI: progress bar (0–100%) for current strike; label "Mining" (or "Training Hero – Stat"); optional "Next strike in X.Xs" and "+Y Essence per strike." Client tick loop (e.g. every 200 ms): POST action with lastTickAt/progress; refresh bank and progress from response.
- [x] Bank display: show current Essence balance (from GET bank or tick response); save selector when multiple saves exist.
- [x] Convert-win UI: Tavern page (`/incremental/tavern`) loads eligible wins (GET eligible-wins); shows list of wins (game, hero, result). Per win: "Convert to roster" (Essence cost). POST convert-win with matchId; refresh roster and bank; success or error (e.g. "Already on roster").

**Files**: `src/routes/incremental/+page.svelte` (action bar, bank, training section), `src/routes/incremental/tavern/+page.svelte` (convert-win, roster display).

**Testing**: Manual: mine until bar fills, see Essence increase; convert a win, see hero on roster and Essence decrease; try converting same win again (rejected).

**Deliverable**: User can mine Essence in the browser and convert a Dota 2 win to add a hero to their roster.

---

## Phase 9: UI – Battle Screen

**Roster-first order**: This is **Phase 11** (after Run flow, Runs API, PvE). Deps in roster-first: 9.1 (Runs/battle API).

**Goal**: Minimal playable battle UI: display lineup, focus, timers, target, enemies; tap to focus (with 2s cooldown); change target; poll or push battle state from API.

### Milestone 9.1: Battle view and focus/target actions ✅
**Dependencies**: 6.2

**Tasks**:
- [x] Page or component: load battle state from `GET /api/incremental/runs/[runId]/battle`. Display player heroes (1–5), current focus (highlight), attack and spell timer progress (bars or countdowns), 2s cooldown indicator after focus switch.
- [x] Display enemy list with HP and which is enemy “focus”; show shared target selection.
- [x] Tap hero to set focus (call PATCH with focusedHeroIndex); tap enemy to set target (call PATCH with targetIndex). Enforce 2s cooldown in UI (disable or show cooldown).
- [x] Poll or interval: every 100–200 ms send PATCH with deltaTime to advance battle; update local state from response. Or use a single “tick” button for testing.
- [x] When result win/lose, show outcome and redirect or offer “continue” (advance to next node).

**Files**: `src/routes/incremental/run/[runId]/battle/+page.svelte`, optional components for hero row, enemy row, timer bar.

**Testing**:
- Manual: start run, advance to combat, complete battle on UI (focus, target, tick until win/loss). Verify 2s cooldown and timer reset on focus change.

**Deliverable**: Playable battle on the website with correct focus/target and timers.

---

## Phase 10: UI – Map & Run Flow

**Roster-first order**: This is **Phase 12**. Deps: 9.1 (Runs API), 11.1 (Battle UI).

**Goal**: Map view shows current node and choices; advance to next node (combat → battle screen; base → heal then next).

### Milestone 10.1: Map page and navigation ✅
**Dependencies**: 6.2, 9.1

**Tasks**:
- [x] Page `incremental/run/[runId]`: load run state via **GET `/api/incremental/runs/[runId]/map`** (returns runState + full path nodes for visual display). Display current node type (combat, elite, boss, base, shop, etc.) and next node choices (tap nodes on the path).
- [x] For **encounter nodes** (combat/elite/boss): tap node → **POST `battle/enter`** with nextNodeId → navigate to `run/[runId]/battle?nodeId=`. For **base/shop**: tap node → POST advance → show “Healed” (or shop) and refresh to show next choices.
- [x] After battle win: battle page calls **POST `battle/complete`** (advances run, records clearance) → redirect back to map (run/[runId]) with updated state and next choices.

**Files**: `src/routes/incremental/run/[runId]/+page.svelte`, navigation from battle to map.

**Testing**:
- Manual: start run from lineup → see map → advance to combat → battle → win → back to map → advance to next node or base.

**Deliverable**: Full PvE run playable in browser: lineup → start run → map → battle → rewards → map → …

---

## Phase 11: UI – Lineup Builder ✅ Complete

**Roster-first order**: This is **Phase 7**. Ship with Phases 5–6 for roster launch (build lineups; Start run when Phase 12 ships). Dependencies in roster-first: 5.1 (Lineups API), 6.2 (roster/convert-win).

**Goal**: User can pick 1–5 heroes from their **roster** (unlocked via Phase 6 convert-win or other paths), save lineup, and start run.

### Milestone 11.1: Lineup builder page ✅
**Dependencies**: 6.1, 8.2 (roster)

**Tasks**:
- [x] Page to list user's lineups (from GET lineups) and “Create lineup” or “Edit.”
- [x] Lineup editor: fetch GET roster (unlocked hero ids) and hero definitions (GET heroes with saveId); show **only roster heroes** as selectable (1–5 slots); save via POST (create) or PATCH (update). Validate 1–5 and heroIds in roster.
- [x] From lineup list or detail, “Start run” button → POST /api/incremental/runs with lineupId → redirect to run/[runId] (map).

**Files**: `src/routes/incremental/lineup/+page.svelte`, `lineup/[id]/+page.svelte`, `lineup/new/+page.svelte`.

**Testing**: Create lineup with 3 heroes, start run, land on map with that lineup for first combat.

**Deliverable**: End-to-end: build lineup → start run → map → battle → rewards.

---

## Other implemented features (current codebase)

These are in the app but not called out as separate phases in the roster-first table; they support the roster/training experience.

### Saves (multi-save per user) ✅
- **API**: `GET /api/incremental/saves` – list current user's saves (id, name, essence, createdAt). `POST /api/incremental/saves` – create save (body: `{ name? }`).
- **Usage**: Roster, training, lineups, and talent tree all accept optional `saveId`; UI uses save selector when multiple saves exist. Currently Essence is stored on `IncrementalSave.essence`; a future **Bank** (see below) will hold all currencies and item inventory per save.

**Files**: `src/routes/api/incremental/saves/+server.ts`.

### Bank system (planned)
- **Design**: [BANK_SYSTEM.md](./BANK_SYSTEM.md). The **Bank** is the single per-save store for **currencies** (Essence, Loot Coins, Gold, Wood, etc.) and **item inventory** (materials, equipable items from loot/crafting/shops).
- **Replaces**: Hardcoded `IncrementalSave.essence`; migration will backfill Essence into Bank currency table and drop the column.
- **Integrates with**: Mining (grant Essence to Bank), convert-win (spend Essence from Bank), Dota roster-hero wins (grant Loot Coins + items to Bank), battles (grant Gold/Wood to Bank), shops (spend from Bank), item system (equip from Bank inventory). Bank API returns balances + optional item summary.
- **Implementation**: Add Bank currency table + Bank item inventory table; Bank service (get/add/deduct); switch action rewards, convert-win, and saves to use Bank; then add Loot Coins and item drops. See BANK_SYSTEM.md §8 for roadmap steps.

### Atlas (hero reference) ✅
- **API**: `GET /api/incremental/atlas` – all heroes with base stats and abilities from DB (`IncrementalHeroBaseStat`, `IncrementalHeroAbility`). Auth required.
- **UI**: `/incremental/atlas` – browse all heroes with base stats and ability cards (for reference when building lineups or viewing roster).

**Files**: `src/routes/api/incremental/atlas/+server.ts`, `src/routes/incremental/atlas/+page.svelte`.

### Heroes API (DB-backed) ✅
- `GET /api/incremental/heroes` returns hero definitions from **DB** (IncrementalHeroBaseStat + abilities); optional `saveId` includes training for effective stats. Used by lineup builder, Tavern, and training UI.

---

## Phase 12: Shops & Relics (Optional / Later)

**Goal**: Shop node: spend gold (from **Bank**) on run boosts and relics; apply modifiers in battle (spell haste, attack poison, etc.). Bank holds currencies and item inventory (see [BANK_SYSTEM.md](./BANK_SYSTEM.md)).

### Milestone 12.1: Shop data and run modifiers
**Dependencies**: 7.1

**Tasks**:
- [ ] Define run boosts (e.g. +regen, +attack damage, +spell damage) and relics (e.g. “all spells 25% faster,” “auto attacks add poison stack”). Store run’s purchased boosts/relics (e.g. JSON on run or small table).
- [ ] When creating battle state, apply run modifiers to hero stats (formulas read run modifiers).
- [ ] Shop node: on advance, show shop UI; spend gold; update run’s boosts/relics; then show next map choices.

**Files**: Constants for boosts/relics; run schema extension; battle-state or formulas use modifiers; shop UI.

**Deliverable**: Gold has meaning; shop node modifies run and battle.

---

## Phase 13: Hero Training & Incremental Leveling (Optional / Later)

**Goal**: (1) **Hero training**: After unlocking a hero with Essence (convert-win, spent from **Bank**), the player trains that hero’s base stats in the idle game. One active action = Mining OR Training(heroId, statKey). Seven stats per hero, Dota 2 themed buildings. (2) **Leveling system**: Melvor-like progression – levels/XP for stats, Essence scaling (Bank), building upgrades (costs from Bank), skill tree with interlocking mechanics, and progressively bigger numbers. Design for extensibility (new stats, trees, currencies without rewrites).

**Design**: [HERO_TRAINING.md](./HERO_TRAINING.md), [TRAINING_UI_AND_TALENT_TREE.md](./TRAINING_UI_AND_TALENT_TREE.md), [LEVELING_SYSTEM.md](./LEVELING_SYSTEM.md), [BANK_SYSTEM.md](./BANK_SYSTEM.md).

### Milestone 13.1: Training data and API ✅
**Dependencies**: 4.1, 8.1 (action system), 8.2 (roster)

**Tasks**:
- [x] Prisma: `IncrementalHeroTraining` (saveId, heroId, statKey, value). Unique (saveId, heroId, statKey). Only roster heroes can have training rows.
- [x] `GET /api/incremental/training` – return all (heroId, statKey, value) for current save (for UI and battle). Optional: `GET /api/incremental/heroes/[heroId]/training` for single-hero view.
- [x] Constants: define seven `statKey`s (hp, attack_damage, spell_power, attack_speed, spell_haste, armor, magic_resist) and mapping to formula hooks (see HERO_TRAINING.md).

**Files**: `prisma/schema.prisma`, `src/routes/api/incremental/training/+server.ts`, `src/lib/incremental/constants/training.ts` (or under actions).

**Deliverable**: Training progress persisted per save/hero/stat; API to read it.

---

### Milestone 13.2: Action engine and tick for training ✅
**Dependencies**: 8.1, 13.1

**Tasks**:
- [x] Extend action type to `training` with params (heroId, statKey). Same progress bar and tick loop; effective duration per training tick (constant or per-stat).
- [x] On training completion: increment `IncrementalHeroTraining.value` for (saveId, heroId, statKey). Validate hero is on roster for this save.
- [x] Tick endpoint: accept `actionType: 'training'`, `heroId`, `statKey` when not mining; apply completions to training table; return new progress and optional training snapshot.
- [x] **One active action**: switching to Training pauses (or resets) Mining; switching to Mining pauses Training. Persist current action type and params (saveId, actionType, heroId?, statKey?, progress, lastTickAt).

**Files**: `src/lib/incremental/actions/` (action-engine, constants), `src/routes/api/incremental/action/+server.ts`, Prisma IncrementalActionState (or equivalent) with action params.

**Deliverable**: User can choose “Train Lina – Spell Power”; bar fills; on complete, Lina’s spell_power training value increases; battle can read it.

---

### Milestone 13.3: Battle integration (effective stats) ✅
**Dependencies**: 13.1, 6.2 (battle state)

**Tasks**:
- [x] When building battle state (createBattleState or run service): for each lineup hero, load HeroDef(heroId) and training(saveId, heroId). Compute **effective** baseMaxHp, attack flat, spell power, attack speed, spell haste, armor, magic resist (base + trained).
- [x] Resolution and formulas already accept modifiers; pass effective stats (or base + modifier object) so damage/interval/resist use trained values. No change to formula signatures beyond where numbers come from.

**Files**: `src/lib/incremental/engine/battle-state.ts`, run service or battle PATCH handler that builds state, `src/lib/incremental/stats/formulas.ts` (if needed for modifier application).

**Deliverable**: Battles use trained stats; lineup strength reflects training.

---

### Milestone 13.4: Training UI – buildings and training grounds ✅
**Dependencies**: 13.2, 13.3 (optional for display-only), 8.3 (incremental page)

**Tasks**:
- [x] **Training grounds**: One section/card per **building** (stat). Seven buildings: Barracks (HP), Weapon Smithy (attack_damage), Arcane Sanctum (spell_power), Swift Forge (attack_speed), Cooldown Grotto (spell_haste), Blacksmith (armor), Cloak Pavilion (magic_resist). Each shows name, short description, “Current trainer: Hero +N” or “Idle”.
- [x] **Start training**: From each building, user selects a **roster hero** and “Train here”; active action becomes Training(heroId, statKey). Same progress bar as mining (one bar, label e.g. “Training Lina – Spell Power”).
- [x] **Switch action**: From bar or a “Mining” / “Training” toggle: switch between Mining and Training (and between Training targets). Pause/resume or reset per design choice.
- [x] **Per-hero view** (optional): “My heroes” – list roster with each hero’s seven stat values and link to “Train” per stat (building).
- [x] Lineup builder / roster view: show trained stats per hero (e.g. “Lina +5 spell power, +2 spell haste”) so build expression is visible.

**Files**: `src/routes/incremental/+page.svelte` or dedicated `incremental/training/+page.svelte`, components for building cards, hero selector, shared action bar.

**Deliverable**: Full training loop in UI with Dota 2 themed buildings; clear expression (magic vs tank vs hybrid).

---

### Milestone 13.5 (optional): Unlock and Training polish
**Dependencies**: 13.4

**Tasks**:
- [ ] (Optional) Additional hero unlock paths (Dota 2 / forge) if desired; integrate with roster.
- [ ] Building icons or art placeholders; tooltips for each stat and building.
- [ ] Balance: base duration per training tick, value per completion (e.g. +1 per tick), caps or diminishing returns if desired.

---

### Milestone 13.6: Leveling formula layer (XP, level, progressive stats)
**Dependencies**: 13.1

**Tasks**:
- [ ] Treat training `value` as total XP; add level curve: `xpForLevel(L)`, `levelFromTotalXp(xp)` (constants or formula). Optionally cache `level` on IncrementalHeroTraining.
- [ ] Add `statGainForLevel(statKey, level)` (or table) so effective stat in battle = base + gain(level); tune for “progressively bigger numbers” (e.g. polynomial or table).
- [ ] Single module: e.g. `src/lib/incremental/stats/leveling-formulas.ts` used by battle (effective stats) and by training reward display (level from XP).
- [ ] Battle integration: effective stats = base + level-derived gain (already have training; switch to level-based gain from same XP value).

**Files**: `src/lib/incremental/stats/leveling-formulas.ts`, constants for XP curve and stat gain per level; battle-state or formulas.

**Deliverable**: Training progress expressed as level (from XP); battles use level for stat scaling; one formula layer for future content.

---

### Milestone 13.7: Wire talents into action tick (rate modifiers)
**Dependencies**: 8.1, 13.1 (talents and training exist)

**Tasks**:
- [ ] Implement `getRateModifier(saveId, actionType, statKey?)`: load purchased talent node IDs for save; sum `percent` from nodes that apply (mining_speed for mining; training_speed for statKey or “all”). Return `1 + sum(percent)`.
- [ ] Action API: when ticking, pass `rateModifier` from `getRateModifier` into idle timer (replace current fixed 1). Mining and training duration both respect talents.
- [ ] Optional: `getRewardMultiplier(saveId, actionType?)` for future “double XP” etc.

**Files**: `src/lib/incremental/actions/` or server helper that reads IncrementalTalentNode + talent-nodes.ts; `src/routes/api/incremental/action/+server.ts`.

**Deliverable**: Purchased talent nodes (e.g. Mining +10%, Barracks +10%) actually reduce action duration.

---

### Milestone 13.8: Mining level / Essence scaling
**Dependencies**: 8.1, 13.7

**Tasks**:
- [ ] Add `miningLevel` (Int, default 0) to IncrementalSave, or small table IncrementalUpgrade (saveId, upgradeType, level). Cost to upgrade: Essence (formula or table, e.g. 50 * 2^level).
- [ ] `essencePerStrike = baseEssence * miningMultiplier(miningLevel)` (e.g. 1.15^level). Apply in applyRewards for mining.
- [ ] API: e.g. POST /api/incremental/upgrades/mining (or PATCH save) to spend Essence and increment mining level (validate cost).

**Files**: `prisma/schema.prisma`, migration; action-definitions applyRewards; new or existing upgrade endpoint.

**Deliverable**: Essence income scales with mining level; upgrades bought with Essence.

---

### Milestone 13.9: Building upgrades (per-stat efficiency)
**Dependencies**: 13.1, 13.7

**Tasks**:
- [ ] Data: IncrementalBuildingLevel (saveId, statKey, level) or JSON on save. Level 0 = unupgraded; cost curve (e.g. Essence) per level.
- [ ] Effect: effective training duration for stat = baseDuration / (1 + buildingSpeedBonus(level)). Stack with talent modifiers in same formula.
- [ ] Resolve building level when computing rateModifier for training (or in duration formula). Purchase endpoint: spend Essence to raise building level for one stat.

**Files**: Prisma schema or save JSON; leveling-formulas or action duration resolution; upgrade endpoint.

**Deliverable**: Each of the seven buildings can be upgraded; higher level = faster training for that stat.

---

### Milestone 13.10: Skill tree expansion (new node types)
**Dependencies**: 13.7

**Tasks**:
- [ ] Add node types: e.g. `training_double_xp`, `essence_per_strike`, `parallel_training` (unlock second training slot or “train 2 heroes same stat”). Definitions in talent-nodes.ts with payload (percent, etc.).
- [ ] Apply reward multipliers in applyRewards: e.g. if “double XP” node purchased, grant 2× training value/XP per completion. Essence node: multiply essence per strike.
- [ ] Add new nodes to TALENT_NODES with prerequisiteIds; document tree shape for “train 2 at once” and double XP branches.

**Files**: `src/lib/incremental/constants/talent-nodes.ts`, action-definitions applyRewards, talent resolution helper.

**Deliverable**: Talent tree has double XP, essence bonus, and path to multi-hero training; rewards scale with purchases.

---

### Milestone 13.11: Multi-hero training (one bar, two heroes same stat)
**Dependencies**: 13.10 (parallel_training or equivalent node)

**Tasks**:
- [ ] Option B (simpler): one action “Training [Stat]” with two heroes. Bar fills once; on completion, both heroes get +XP for that stat. Action state: e.g. actionHeroIds (length 1 or 2), actionStatKey.
- [ ] Schema: extend IncrementalActionState to store second hero (e.g. actionHeroId2) when unlocked; or single JSON array actionHeroIds. Validate both heroes on roster.
- [ ] applyRewards: when training with two heroes, upsert training for (saveId, hero1, statKey) and (saveId, hero2, statKey) with same completion value.
- [ ] UI: when “train 2 at once” unlocked, allow selecting a second hero for same building; show “Training Hero A & B – Stat”.

**Files**: Prisma (optional new column or JSON); action API and applyRewards; training UI.

**Deliverable**: User can train two roster heroes in the same stat with one progress bar (when talent purchased).

---

### Milestone 13.12: Leveling system UI
**Dependencies**: 13.6–13.11

**Tasks**:
- [ ] Mining upgrade: button/section to spend Essence to raise mining level; show current level and next cost.
- [ ] Building upgrades: per-building “Upgrade” (show level, cost, effect); purchase calls upgrade API.
- [ ] Talent tree page: ensure new node types (double XP, essence, parallel) are visible and purchasable; show effect in tooltips.
- [ ] Training UI: show level (and XP) per hero per stat where applicable; optional “train 2 heroes” selector when unlocked.

**Files**: `src/routes/incremental/+page.svelte`, `incremental/talents/+page.svelte`, training/buildings components.

**Deliverable**: Full leveling loop visible and playable: upgrade mining and buildings, spend talent points, train one or two heroes with scaling rewards.

---

## Phase 14: PvP (Optional / Later)

**Goal**: Separate PvP mode: two players, two lineups; both send focus/target; battle pauses if either leaves.

### Milestone 14.1: PvP battle flow
**Dependencies**: 6.2, 9.1

**Tasks**:
- [ ] PvP match creation (queue or challenge): create battle state with two “player” sides (each has lineup, focus, target). No run/map.
- [ ] API: e.g. POST pvp/match, GET pvp/match/[id], PATCH pvp/match/[id]/battle (each player sends their focus + target + deltaTime or server ticks when both connected). When either player disconnects or leaves, set battle to “paused” and stop ticking.
- [ ] UI: PvP battle screen (same as PvE but two human sides); show “waiting for opponent” or “paused” when other left.

**Files**: PvP-specific API and battle state (two lineups); engine already supports “enemy side = hero lineup” from BATTLE_MECHANICS.

**Deliverable**: Playable PvP battles with pause when either player leaves.

---

## Phase 15: Background PvE (Optional / Later)

**Goal**: When player leaves battle screen, battle continues on server (auto-rotation every 10s); on return, show current state; persist battle state.

### Milestone 15.1: Persistent battle and background tick
**Dependencies**: 6.2, 7.1

**Tasks**:
- [ ] Persist battle state (e.g. Redis or DB) keyed by runId when in encounter. On GET battle, load from store.
- [ ] Background job or on-next-request: if run has active battle and last tick was N seconds ago, run tick with deltaTime and auto-rotation until result or max iterations; persist state. So “leave and come back” can show battle already won/lost.
- [ ] Optional: real-time tick (cron or queue) every 1s for active battles with no recent client tick.

**Files**: Battle state persistence; background tick (e.g. serverless function or cron); GET battle loads from store.

**Deliverable**: PvE runs can complete even if the player closes the tab (using auto-rotation).

---

## Phase 16: User Onboarding Flow (Optional / Later)

**Goal**: Guided first-time flow: new player completes (1) Mine Essence → (2) Recruit a hero (convert Dota 2 win) → (3) Train a hero → (4) Build a lineup → (5) Start and begin a dungeon run. Each completed step grants rewards (e.g. currency, talent points, or unlocking a talent tree branch).

**Dependencies**: Phase 8.1, 8.2, 8.3 (Essence, roster, mining/convert UI); Phase 9 (Battle UI); Phase 10 (Map & Run Flow); Phase 11 (Lineup Builder); Phase 13 (Training: data, action, battle integration, UI). Optionally Phase 13.7+ (talents wired) if rewards unlock talent nodes.

**Design (to be detailed):** Reward curve (e.g. how much Essence per step), which talent nodes or branches unlock at which step, and whether “begin run” means “start run” only or “complete first combat” (recommend “start run” for clarity). [TRAINING_UI_AND_TALENT_TREE.md](./TRAINING_UI_AND_TALENT_TREE.md) and [LEVELING_SYSTEM.md](./LEVELING_SYSTEM.md) define talent points and tree shape; onboarding can grant points or auto-purchase specific nodes.

### Milestone 16.1: Onboarding state and progress
**Dependencies**: 8.1, 8.2, 8.3, 9, 10, 11, 13.1–13.4

**Tasks**:
- [ ] Persist onboarding progress per save (e.g. `IncrementalOnboardingProgress` or JSON on save: steps completed, e.g. `firstMineDone`, `firstRecruitDone`, `firstTrainDone`, `firstLineupCreated`, `firstRunStarted`).
- [ ] API: e.g. `GET /api/incremental/onboarding` returns current step and completed steps; updates implicit when player does the action (first mining completion, first convert-win, first training completion, first lineup save, first run start).

**Files**: Prisma schema or save JSON; `src/routes/api/incremental/onboarding/+server.ts`.

**Deliverable**: Server tracks which onboarding steps are done per save; client can read progress.

---

### Milestone 16.2: Step completion detection and rewards
**Dependencies**: 16.1

**Tasks**:
- [ ] When a step is completed (detected server-side or via existing APIs), mark it in onboarding state and grant rewards. Rewards per step (design to tune): currency (e.g. bonus Essence from Bank), and/or talent points or auto-unlock of specific talent nodes (e.g. “Unlock Barracks” after first recruit). Define reward table (step id → reward type and payload).
- [ ] If talent tree is not yet wired (Phase 13.7), rewards can be currency-only initially; talent unlocks added when 13.7+ is done.

**Files**: Onboarding service or action handlers (mining completion, convert-win, training completion, lineup create, run start); reward table constants or config.

**Deliverable**: Completing each onboarding step grants defined rewards; progress and rewards persist per save.

---

### Milestone 16.3: Onboarding UI
**Dependencies**: 16.1, 16.2

**Tasks**:
- [ ] Checklist or linear flow UI (e.g. on `/incremental` or dedicated `/incremental/onboarding`): show the five steps with done/current/locked; highlight “next” action (e.g. “Mine your first Essence”, “Convert a win at the Tavern”, “Train a hero”, “Build a lineup”, “Start a run”).
- [ ] After each step: show reward (e.g. “+50 Essence”, “Talent branch unlocked”) and advance to next step. Optional: dismissible or collapsible so returning players are not stuck in onboarding.

**Files**: `src/routes/incremental/+page.svelte` or `src/routes/incremental/onboarding/+page.svelte`; components for onboarding checklist.

**Deliverable**: New players can follow a single guided path through mining → recruit → train → lineup → run, with clear rewards at each step; progress and rewards persist per save.

---

## Summary Table

| Phase | Focus | Test in isolation | Integrates with |
|-------|--------|-------------------|------------------|
| 0 ✅ | Setup, types | Placeholder test, type shape | All |
| 1 ✅ | Constants, formulas | Unit tests | Engine |
| 2 ✅ | State, timers | Unit + small integration | Resolution |
| 3 ✅ | Resolution, loop | Simulation (full battle) | API |
| 4 ✅ | Prisma, map | DB + map tests | Run flow |
| 5 ✅ | **Lineups API** (roster-first) | Integration | Phase 6, 7 |
| 6 ✅ | **Essence, actions, roster** | Unit + integration | Lineup, Training |
| 7 ✅ | **Lineup Builder UI** (roster-first) | Manual + E2E | Full roster system |
| 8 ✅ | Run/encounter flow | Service tests | API |
| 9 ✅ | Runs/battle API | Integration | UI |
| 10 ✅ | Rewards, bases | Integration | UI flow |
| 11 | Battle UI | Manual + E2E | Map UI |
| 12 | Map UI | Manual + E2E | Full game |
| 13 | Training (data, engine, battle, UI) + Leveling (formulas, talents wired, mining/building upgrades, skill tree, multi-hero, UI) | Per-milestone | Battle, roster |
| 14–15 | Shops, PvP, background | Per-milestone | Existing |
| 16 | User Onboarding (state, step rewards, checklist UI) | Per-milestone | Mining, roster, training, lineup, run |

---

## Recommended Order and Checkpoints

- **Checkpoint A (playable battle in code)**: Complete Phases 0–3. You can simulate a full battle and test focus/timers/resolution in tests.
- **Checkpoint B (playable via API)**: Complete Phases 4, 8, 9. You can start a run, advance to combat, and run a battle via API (e.g. Postman or Bruno).
- **Checkpoint C (roster-first launch)**: Complete Phases 5–7. **Ship here.** User can mine Essence, convert a win from last 10 games to roster, build lineups (no run/battle/map UI yet).
- **Checkpoint D (playable battle in browser)**: Complete Phases 8–12. Full PvE loop: lineup → start run → map → battle → rewards → map.
- **Checkpoint E (full vision)**: Add Phase 13 (Training + Incremental Leveling: formula layer, talents wired, mining/building upgrades, skill tree expansion, multi-hero training, UI), then Phases 14–15 (shops, PvP, background PvE).
- **Checkpoint F (onboarding)**: Add Phase 16 after 13 (and optionally 14–15). New players get a guided path with rewards; onboarding state and reward table can be extended (e.g. more steps or reward types) without changing core systems.

Use this roadmap to implement in short chunks; run tests after each milestone so integration in later phases stays straightforward.
