# Phase 0 – Complete

Phase 0 (Foundation & Setup) is implemented. All decisions were recorded in [PHASE_0_PENDING.md](./PHASE_0_PENDING.md) before coding.

---

## Milestone 0.1: Folder structure and test config

**Implemented**:

- **`src/lib/incremental/`**
  - `types.ts` – core types (placeholder in 0.1; full types in 0.2)
  - `constants/`, `engine/`, `stats/` – empty folders (`.gitkeep`)
- **`src/routes/incremental/`**
  - `+layout.svelte` – minimal layout
  - `+page.svelte` – “Incremental – coming soon”
- **`src/routes/api/incremental/health/+server.ts`** – GET returns `{ ok: true }` to reserve the API prefix
- **`src/lib/incremental/placeholder.test.ts`** – placeholder test; no Vitest config change (existing `src/**/*.test.ts` picks it up)
- Incremental code is isolated (no imports from card-battler).

**Verify**: `npm run test` (or `npm run test -- --run src/lib/incremental`) runs incremental tests.

---

## Milestone 0.2: Core types

**Implemented** in `src/lib/incremental/types.ts`:

- **Enums / unions**: `PrimaryAttribute`, `NodeType`, `BattleResult` (`'win' | 'lose' | null`), `RunStatus`
- **Reference types**: `HeroDef` (heroId number, abilityIds string[]), `AbilityDef`, `EnemyDef`, `EncounterDef`
- **Runtime (battle)**: `Buff`, `HeroInstance`, `EnemyInstance`, `BattleState` (includes `enemyFocusedIndex`, `lastFocusChangeAt`, `elapsedTime`, `result`)
- **Run/map**: `MapNode`, `RunState`

Hero ids use **integer** `Hero.id` from Prisma (per Phase 0 decisions).

**Tests** in `src/lib/incremental/types.test.ts`:

- Build minimal `BattleState` (1 hero, 1 enemy); assert `focusedHeroIndex`, `targetIndex`, `enemyFocusedIndex`, `result`, `elapsedTime`, player/enemy shape
- Assert `PrimaryAttribute` and `NodeType` const values
- Build minimal `MapNode` and `RunState` and assert shape

---

## Files touched (summary)

| Path | Purpose |
|------|--------|
| `src/lib/incremental/types.ts` | All Phase 0 types |
| `src/lib/incremental/constants/.gitkeep` | Keep folder in git |
| `src/lib/incremental/engine/.gitkeep` | Keep folder in git |
| `src/lib/incremental/stats/.gitkeep` | Keep folder in git |
| `src/lib/incremental/placeholder.test.ts` | Placeholder test for 0.1 |
| `src/lib/incremental/types.test.ts` | BattleState and type shape tests |
| `src/routes/incremental/+layout.svelte` | Minimal layout |
| `src/routes/incremental/+page.svelte` | Coming-soon page |
| `src/routes/api/incremental/health/+server.ts` | API prefix placeholder |

---

## Next

Proceed to **Phase 1** (Constants & Stat Formulas): [DEVELOPMENT_ROADMAP.md](../DEVELOPMENT_ROADMAP.md#phase-1-constants--stat-formulas).
