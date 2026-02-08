# Phase 0 – Pending Questions & Items to Clarify

Items to resolve **before** starting actual code changes for Phase 0 (Foundation & Setup). Update this file as decisions are made.

**Phase 0 scope** (from [DEVELOPMENT_ROADMAP.md](../DEVELOPMENT_ROADMAP.md)):  
- **Milestone 0.1**: Folder structure and test config  
- **Milestone 0.2**: Core types (no constants yet)

---

## Milestone 0.1: Folder structure and test config

### 1. Exact folder layout under `src/lib/incremental/`

- Roadmap says: “Create `src/lib/incremental/` (types, constants, engine, stats).”
- **Clarify**: Should `types.ts` live at **root** of `incremental/` (`src/lib/incremental/types.ts`) or inside a `types/` folder (`src/lib/incremental/types/index.ts`)? ARCHITECTURE shows `types.ts` at root.
- **Proposal**: Single file `src/lib/incremental/types.ts` at root; subfolders `constants/`, `engine/`, `stats/` only. Confirm.

### 2. Route placeholders – how minimal?

- “Create `src/routes/incremental/` and `src/routes/api/incremental/` placeholders (empty or minimal).”
- **Clarify**: For SvelteKit, do we need:
  - `routes/incremental/+layout.svelte` (and optionally `+page.svelte`) with minimal content (e.g. “Incremental – coming soon”) so the route exists and doesn’t 404?
  - `api/incremental/` – empty folder, or one placeholder route (e.g. `api/incremental/health/+server.ts` returning 200) so the API prefix is reserved?
- **Proposal**: Minimal `+layout.svelte` and `+page.svelte` for `/incremental`; no API files until Phase 6. Confirm or adjust.

### 3. Vitest configuration

- Project **already has Vitest** (`vitest.config.ts`) with `setupFiles: ['./vitest-setup.ts']`, `environment: 'jsdom'`, and default include for `src/**/*.test.ts`.
- **Clarify**: Do we need to **add** anything for incremental tests (e.g. a dedicated `include` pattern like `src/lib/incremental/**/*.test.ts`), or is the existing setup enough so that any `*.test.ts` under `src/lib/incremental/` is picked up by `npm run test`?
- **Proposal**: No config change; add a single placeholder test under `src/lib/incremental/` (e.g. `types.test.ts` or `placeholder.test.ts`) and verify `npm run test` runs it. If we later want “only incremental” runs, add a script like `test:incremental` with a separate include. Confirm.

### 4. Isolation – what counts as “card-battler”?

- “Ensure incremental code is isolated (no imports from card-battler; can share auth/Prisma later).”
- **Clarify**: There is no single `card-battler` package; there are battler-related files (e.g. `src/lib/test/fixtures/battler.ts`, `src/lib/server/dotadeck.ts`, card types). Should “no imports from card-battler” mean:
  - (a) No imports from any path that is clearly battler-specific (e.g. `test/fixtures/battler.ts`, battler API routes)?
  - (b) No imports from `src/lib` modules that are **only** used by the card-battler feature?
- **Proposal**: (a): do not import battler-specific modules. Allowed: shared `@lib/utils`, `config`, Prisma (later), auth (later). Document the list of “banned” paths for Phase 0 if needed. Confirm.

---

## Milestone 0.2: Core types

### 5. `BattleResult` and `result` field type

- Roadmap: “`BattleResult` (null, win, lose).”
- **Clarify**: Should the type be:
  - `type BattleResult = 'win' | 'lose'` and the battle state has `result: BattleResult | null`, or
  - `type BattleResult = null | 'win' | 'lose'` and `result: BattleResult`?
- **Proposal**: `result: 'win' | 'lose' | null` (no separate enum if we only need these three). If we add more states later (e.g. ‘fled’), we can introduce an enum. Confirm.

### 6. HeroDef – ability id(s) shape

- ARCHITECTURE: “ability id(s). One spell per hero at start; design for up to 3.”
- **Clarify**: Should `HeroDef` have:
  - `abilityId: string` (single), or  
  - `abilityIds: string[]` (length 1 now, up to 3 later)?
- **Proposal**: `abilityIds: string[]` so we don’t change the shape later; Phase 1 constants use length 1. Confirm.

### 7. Enemy “focus” for targeting (enemy team’s active hero)

- Battle state has “shared target” (player’s target on enemy side) and “penalty when attacking non-focus enemy.” So we need “which enemy is the **enemy team’s** focus.”
- **Clarify**: For **PvE**, how is the enemy’s “active (focus)” hero defined? Options:
  - (a) First enemy in list (index 0) is always the “frontliner” focus.
  - (b) Each encounter definition specifies an `enemyFocusedIndex` (e.g. 0 for front).
  - (c) Store `enemyFocusedIndex` on `BattleState` (e.g. 0 by default), and PvE logic or encounter def can set it.
- **Proposal**: (c) `BattleState.enemyFocusedIndex: number` (default 0). Phase 0 types include it; Phase 1/2 set it from encounter or default. Confirm.

### 8. HeroInstance / EnemyInstance – “buffs”

- ARCHITECTURE: “buffs” on hero instances.
- **Clarify**: For Phase 0, do we need a `buffs` field on `HeroInstance` (and optionally `EnemyInstance`)? If yes, shape: `Buff[]` with a minimal `Buff` type (e.g. `{ id: string, duration?: number }`), or leave as `unknown[]` / `Record<string, unknown>[]`?
- **Proposal**: Include `buffs: unknown[]` or `buffs: { id: string }[]` on `HeroInstance` so the shape is stable; resolution can ignore it until we add buff logic. Optional on `EnemyInstance` for symmetry. Confirm.

### 9. Battle clock: `elapsedTime` vs `lastTickAt`

- ARCHITECTURE mentions both “elapsedTime or lastTickAt for delta-based timer advance.”
- **Clarify**: For the **engine** (simulation and API tick), which do we use in Phase 0?
  - `elapsedTime`: cumulative seconds since battle start (simpler for pure simulation).
  - `lastTickAt`: timestamp of last tick (better for real-time when we have “now”).
- **Proposal**: Phase 0 types use `elapsedTime: number` (seconds since start). If we add real-time background ticks later, we can add `lastTickAt` alongside or switch; engine in Phase 2–3 can compute delta from `elapsedTime` or from (now - lastTickAt). Confirm.

### 10. Run and map types in Phase 0 vs Phase 4

- Roadmap 0.2: “All battle and run types needed for the engine and API.”
- **Clarify**: Should Phase 0 **include** run/map-related types (e.g. `RunStatus`, `NodeType` already listed, `MapNode`, `RunState` for API) so they exist before Phase 4, or only **battle** types in Phase 0 and add run/map types in Phase 4?
- **Proposal**: Include in Phase 0: `NodeType` (already in 0.2), `RunStatus` (‘active’ | ‘won’ | ‘dead’), and minimal `MapNode` / `RunState` shapes (id, nodeType, nextNodeIds, etc.) so API and run flow can use them without a second types phase. Confirm.

### 11. Hero id format (string vs number) — **Resolved**

- **Decision**: Use **integer** hero ids matching the existing **`Hero`** table in `prisma/schema.prisma` (`Hero.id`). Lineup `heroIds`, training keys, and battle state all use `Hero.id` so we can join with that table for names, `primary_attr`, and reuse across the app. Incremental game stats (base intervals, abilities) are keyed by `Hero.id` in constants or a small table.

---

## Summary checklist before coding

- [ ] 1. Folder layout: `types.ts` at root vs `types/` folder – decided.
- [ ] 2. Route placeholders: what to add under `routes/incremental` and `api/incremental` – decided.
- [ ] 3. Vitest: any config change or only add placeholder test – decided.
- [ ] 4. Isolation: definition of “card-battler” and allowed shared imports – decided.
- [ ] 5. BattleResult / result type – decided.
- [ ] 6. HeroDef ability id single vs array – decided.
- [ ] 7. Enemy focus: how and where stored (enemyFocusedIndex) – decided.
- [ ] 8. Buffs on HeroInstance/EnemyInstance – shape or defer – decided.
- [ ] 9. elapsedTime vs lastTickAt for battle state – decided.
- [ ] 10. Run/map types in Phase 0 vs Phase 4 – decided.
- [x] 11. Hero id format (string vs number) – **decided: integer `Hero.id` from existing Prisma `Hero` table.**

---

*Resolve these items and update this file with decisions (and any new questions) before implementing Phase 0 code.*
