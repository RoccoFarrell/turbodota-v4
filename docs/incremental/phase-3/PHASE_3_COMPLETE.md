# Phase 3 – Resolution & Battle Loop (complete)

**Milestones 3.1 and 3.2** are done: action resolution (auto-attack, spell, enemy actions, passives, win/lose) and the full tick loop.

---

## 3.1 Action resolution

### Types
- **AbilityDef**: optional `baseDamage?: number` (active nukes, e.g. Laguna Blade 100), `returnDamageRatio?: number` (passives, e.g. Bristleback 0.2).

### Constants
- **abilities.ts**: `laguna_blade` has `baseDamage: 100`; `bristleback_return` has `returnDamageRatio: 0.2`.

### Engine – `src/lib/incremental/engine/resolution.ts`
- **`resolveAutoAttack(state, heroIndex)`**: Uses hero def and formulas (attackDamage, nonFocusTargetPenalty, applyDamageByType physical). Deals damage to `state.enemy[state.targetIndex]`, resets that hero’s attackTimer, removes dead enemies, clamps targetIndex/enemyFocusedIndex, sets result to `'win'` if all enemies dead.
- **`resolveSpell(state, heroIndex)`**: Uses first active (timer) ability with baseDamage; spellDamage + applyDamageByType by ability damageType to current target; resets spellTimer; removes dead enemies and sets result.
- **`resolveEnemyActions(state)`**: For each enemy with attackTimer >= interval, deals physical damage to player’s focused hero; applies that hero’s `on_damage_taken` passive (e.g. return damage to attacker); resets that enemy’s timer. Removes dead enemies once at end; sets result to `'win'` or `'lose'`.

Order in tick: **player auto-attack → player spell → enemy actions**. Passives fire during resolution (e.g. return damage when hero takes damage).

### Tests – `engine/resolution.test.ts`
- resolveAutoAttack reduces target HP and resets timer; non-focus target takes reduced damage.
- resolveSpell (Laguna) reduces enemy HP and resets spell timer.
- All enemies dead → result `'win'`.
- Enemy attacking Bristleback → attacker takes return damage.

---

## 3.2 Battle loop

### Engine – `src/lib/incremental/engine/battle-loop.ts`
- **`tick(state, deltaTime, options?)`**: (1) Update `elapsedTime`. (2) Optional `focusChange` and `targetChange` from options. (3) applyAutoRotation. (4) advanceTimers. (5) If focused hero attack ready, resolveAutoAttack. (6) If spell ready, resolveSpell. (7) resolveEnemyActions. Returns new state; early exit if result set.
- **`TickOptions`**: `focusChange?: number`, `targetChange?: number` (clamped to valid enemy index).

### Tests – `engine/battle-loop.test.ts`
- Simulation: create state (3 heroes, wolf_pack), loop tick(0.1) until result; assert result is `'win'` or `'lose'`, no infinite loop.
- focusChange: timers reset, 2s cooldown blocks immediate second change.
- Auto-rotation: tick ~10s without focusChange; elapsedTime ≥ 9.9, focus index valid.
- targetChange: sets targetIndex, clamped.

---

## Next

**Phase 4.1** is complete (see [phase-4/PHASE_4_1_COMPLETE.md](../phase-4/PHASE_4_1_COMPLETE.md)). Next: **Phase 4.2** – map graph and run initialization.
