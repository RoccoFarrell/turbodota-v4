# Phase 2.2 – Timer advance and focus rules (complete)

**Milestone 2.2** of Phase 2 is done: timer advance (focused hero + all enemies), focus change with 2s cooldown and timer resets, and 10s auto-rotation.

---

## Changes

### Engine
- **`src/lib/incremental/engine/timers.ts`**
  - **`advanceTimers(state, deltaTime)`**: Advances only `state.player[state.focusedHeroIndex]` attack and spell timers by `deltaTime`; advances all `state.enemy` timers by `deltaTime`. Returns new state (immutable).
  - **`applyFocusChange(state, newFocusedHeroIndex)`**: If index differs and cooldown elapsed (`state.elapsedTime - state.lastFocusChangeAt >= 2`): updates `focusedHeroIndex`, resets previous and new hero timers to 0, sets `lastFocusChangeAt = state.elapsedTime`. Otherwise returns state unchanged.
  - **`applyAutoRotation(state)`**: Uses `state.elapsedTime` as “now”. If `elapsedTime - lastFocusChangeAt >= 10`, rotates focus to next hero (cycle), resets previous hero timers, sets `lastFocusChangeAt = elapsedTime`. Otherwise returns state unchanged.

### Battle state
- **`src/lib/incremental/engine/battle-state.ts`**
  - **`FOCUS_CHANGE_COOLDOWN = 2`** (seconds) exported for tests/docs.
  - Initial **`lastFocusChangeAt`** set to **`-FOCUS_CHANGE_COOLDOWN`** in `createBattleState` so the first focus change at elapsedTime 0 is allowed (cooldown already “elapsed”).

### Tests
- **`engine/timers.test.ts`**: advanceTimers (only focused hero + all enemies); applyFocusChange (timers reset, index updated; within 2s cooldown no change); applyAutoRotation (after 10s focus cycles and timers reset; &lt; 10s no change).
- **`engine/battle-state.test.ts`**: Expects initial `lastFocusChangeAt === -2` (first focus change allowed).

---

## Next

**Phase 3** is complete (see [phase-3/PHASE_3_COMPLETE.md](../phase-3/PHASE_3_COMPLETE.md)). Next: **Phase 4** – Data layer.
