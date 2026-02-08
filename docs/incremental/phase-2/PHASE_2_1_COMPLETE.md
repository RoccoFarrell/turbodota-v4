# Phase 2.1 – Battle state initializer (complete)

**Milestone 2.1** of Phase 2 is done: build initial battle state from lineup and encounter.

---

## Changes

### Types
- **HeroDef**: added `baseMaxHp: number` so hero instances get max/current HP at battle start.

### Constants
- **heroes.ts**: Bristleback `baseMaxHp: 150`, Lina `100`, Dazzle `120`.

### Engine
- **`src/lib/incremental/engine/battle-state.ts`**
  - `createBattleState(lineupHeroIds: number[], encounterId: string, options?)`: builds `BattleState` with:
    - **Player**: one `HeroInstance` per `lineupHeroIds` from `getHeroDef` (currentHp/maxHp = def.baseMaxHp, attackTimer/spellTimer 0, abilityIds, buffs []).
    - **Enemy**: expands `getEncounterDef(encounterId)` into `EnemyInstance[]` (count per roster entry from `getEnemyDef`; currentHp/maxHp = def.hp, timers 0).
    - focusedHeroIndex 0, targetIndex 0, enemyFocusedIndex 0, lastFocusChangeAt -2 by default (or from options) so first focus change is allowed; elapsedTime 0 (or from options), result null.
  - Throws if a hero id or encounter id is unknown.
  - **Options**: `elapsedTime`, `lastFocusChangeAt` for tests or replay.

### Tests
- **`engine/battle-state.test.ts`**: createBattleState([99, 25, 50], 'wolf_pack') → 3 player, 3 enemies, focus 0, result null; all timers 0; hero HP from def; enemy roster 1 large + 2 small; unknown hero/encounter throws; options set elapsedTime/lastFocusChangeAt.

---

## Next

**Milestone 2.2** is complete (see [PHASE_2_2_COMPLETE.md](./PHASE_2_2_COMPLETE.md)). Next: **Phase 3** – resolution and tick loop.
