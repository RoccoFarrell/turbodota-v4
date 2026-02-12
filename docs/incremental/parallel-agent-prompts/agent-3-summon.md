# Agent 3: Summon System – Boss Summons Lesser Skulls

**Goal:** Implement the mechanic where an enemy (Skull Lord) can summon another enemy (Lesser Skull) on a timer. Assume that `skull_lord` and `lesser_skull` already exist in `src/lib/incremental/constants/encounters.ts` (Agent 2 adds them). You will: extend types, initialize enemy `spellTimer` when they have a summon ability, add `resolveEnemySummons`, call it from the battle loop, and add combat log support for summon events. Add or update tests as needed.

**Context:** Enemies currently only auto-attack. We need a single “summon” ability: after a fixed interval, the enemy adds a new `EnemyInstance` (e.g. lesser_skull) to `state.enemy`. The battle loop already advances `enemy.spellTimer` in `advanceTimers`; we need to resolve summons when `spellTimer >= interval` and then reset that enemy’s `spellTimer` to 0.

**Task:**

1. **Types** – In `src/lib/incremental/types.ts`:
   - Extend `EnemyDef` with an optional field:  
     `summonAbility?: { enemyDefId: string; interval: number }`.
   - Extend `CombatLogEntry` so it can represent a summon:
     - Add `'summon'` to the union of `type` values (e.g. `type: 'auto_attack' | 'spell' | 'enemy_attack' | 'return_damage' | 'death' | 'status_effect' | 'summon'`).
     - Add optional fields for summon events, e.g. `attackerEnemyDefId?: string`, `attackerEnemyIndex?: number`, `summonedEnemyDefId?: string`, so the UI can show “Skull Lord summoned Lesser Skull”.
   - Confirm `EnemyInstance` has optional `spellTimer?: number` (it should already; if not, add it).

2. **Constants** – In `src/lib/incremental/constants/encounters.ts`, add to the **skull_lord** enemy definition:  
   `summonAbility: { enemyDefId: 'lesser_skull', interval: 12 }`.  
   (If Agent 2 already added `skull_lord` without this, add only this property. If you are the only one touching encounters, add the full skull_lord def including `summonAbility`.)

3. **Battle state** – In `src/lib/incremental/engine/battle-state.ts`, when building each `EnemyInstance` from an `EncounterDef` entry: if the enemy’s `EnemyDef` has `summonAbility`, set that instance’s `spellTimer: 0` (so the summon timer can advance). Other enemies can leave `spellTimer` undefined.

4. **Resolution** – In `src/lib/incremental/engine/resolution.ts`:
   - Add a new exported function `resolveEnemySummons(state: BattleState, defs?: BattleDefsProvider): BattleState`.
   - Behavior: for each living enemy (currentHp > 0) whose def has `summonAbility` and whose `spellTimer >= summonAbility.interval`:
     - Look up the summoned enemy def with `getEnemyDef(summonAbility.enemyDefId)`. If missing, skip that enemy.
     - Push a new `EnemyInstance` onto `state.enemy`: `enemyDefId`, `currentHp`/`maxHp` from def, `attackTimer: 0`, `buffs: []`, no `spellTimer` (or undefined).
     - Set the summoning enemy’s `spellTimer` to 0.
     - Optionally append a combat log entry with `type: 'summon'` and the attacker/summoned ids (and indices if useful).
   - Do not remove dead enemies inside this function; that’s already done elsewhere. Return the updated state.

5. **Battle loop** – In `src/lib/incremental/engine/battle-loop.ts`:
   - After `resolveEnemyActions(s, defs)` and before `ensureFocusOnLivingHero`, call `resolveEnemySummons(s, defs)` and use the result as the next `s`. So order is: … → resolveEnemyActions → resolveEnemySummons → ensureFocusOnLivingHero.
   - Import `resolveEnemySummons` from `./resolution`.

6. **Tests** – Add or update tests:
   - **resolution.test.ts**: e.g. create a state with one enemy that has `summonAbility` and `spellTimer >= interval`; call `resolveEnemySummons`; assert state.enemy length increased by 1, new enemy has correct enemyDefId, summoning enemy’s spellTimer is 0.
   - **battle-state.test.ts**: if you init spellTimer for summon enemies, add a short test that a battle state created for an encounter containing skull_lord has that enemy with spellTimer 0.
   - **battle-loop.test.ts** (if present): optionally one test that over many ticks a summon eventually appears (or that resolveEnemySummons is called). Prefer unit tests on `resolveEnemySummons` for determinism.

7. Do **not** change the map graph or add new encounters; only add `summonAbility` to the existing skull_lord def (or add skull_lord if missing). Do not change enemy-sprites.

**Deliverable:** Types extended, skull_lord has `summonAbility`, battle-state inits `spellTimer` for summon enemies, `resolveEnemySummons` implemented and called from the loop, combat log support for summon, and tests added/updated. All existing tests should still pass.
