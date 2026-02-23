# Architecture – Incremental Lineup Battler

Proposed **code layout**, **data models**, **timer engine**, and **API surface** for the incremental game on the existing website (SvelteKit, Prisma). No code changes are made in this phase; this is a planning document.

---

## High-Level Layers

1. **Data / persistence**: Lineups, runs, map state, battle state (if we persist mid-battle), user progress.  
2. **Game logic**: Hero definitions, encounter definitions, stat formulas, ability effects.  
3. **Battle engine**: Timers, focus, action resolution (attack, spell, passive), win/loss.  
4. **API**: Endpoints for lineup CRUD, run start/advance, battle actions (focus, get state), map, PvP.  
5. **UI**: Pages and components for lineup builder, map, battle screen (tap-to-focus, timer display).

The website already uses **SvelteKit** (`src/routes`), **Prisma** (`prisma/schema.prisma`), and **API routes** under `src/routes/api`. The incremental game should live as a **separate feature** (e.g. under a route prefix like `/darkrift` or `/lineup`) and can share auth and user identity with the rest of the app.

---

## Suggested Folder / Module Layout

All paths are relative to the repo root. New code only; existing structure unchanged.

```
src/
  lib/
    incremental/                    # Shared game logic (no Svelte)
      types.ts                      # Hero, Lineup, BattleState, Encounter, etc.
      constants/
        heroes.ts                   # Hero definitions (id, attribute, base intervals, ability id)
        abilities.ts                # Ability definitions (active/passive, effect, target)
        encounters.ts                # PvE encounter definitions (enemy roster, patterns)
      engine/
        battle-state.ts             # Battle state structure and initializer
        timers.ts                   # Timer advance (delta time, interval check)
        resolution.ts               # Resolve attack, spell, passive; apply damage; death check
        battle-loop.ts              # High-level: tick(delta), handle focus, run resolution
      stats/
        formulas.ts                 # attackInterval( base, AS ), spellDamage( base, spellPower ), etc.
  routes/
    incremental/                    # SvelteKit routes for the feature
      +layout.svelte
      +page.svelte                  # Landing / lineup / map entry
      lineup/
        +page.svelte                # Build lineup (1–5 heroes)
      run/
        [runId]/
          +page.svelte              # Map view (nodes, path choice)
          battle/
            +page.svelte            # Battle UI (tap focus, timers, enemy HP)
    api/
      incremental/                  # API routes (REST or JSON)
        lineups/
          +server.ts                # GET (list), POST (create)
        lineups/
          [id]/
            +server.ts              # GET, PATCH, DELETE
        runs/
          +server.ts                # POST (start run)
        runs/
          [runId]/
            +server.ts              # GET (run + map state)
        runs/
          [runId]/
            battle/
              +server.ts            # GET (battle state), PATCH (focus change, or tick)
        encounters/
          [encounterId]/
            +server.ts              # GET (encounter definition; optional)
```

**Notes:**

- **Battle loop**: For **PvE**, the battle can **continue when the player leaves** (server or background tick with 10s auto-rotation), so the architecture must support server-side (or headless) timer advance and persistence. For **PvP**, both players must be present or the battle pauses. Server authority is preferred for PvP and for background PvE completion.
- **Timer tick**: Server (or background job) advances time since last tick; when no focus change from player, apply auto-rotation every 10s. Client can display state and send focus/target changes; server applies penalty for attacking non-focus enemy.
- **RNG**: Some RNG is acceptable; battles need not be fully deterministic. The engine must be able to **simulate a battle from start to finish** (e.g. for background PvE or replay).

---

## Data Models (Conceptual)

These map to **Prisma models** or **JSON in DB**; exact schema is for implementation phase.

### User and lineup

- **User**: Existing auth user (no change).
- **Hero unlock / Training**: Heroes are **unlocked** and boosted by **Dota 2 wins** (and forge-style integration). **Training** is a passive incremental layer: per-hero stat growth (e.g. Axe health, Void auto-attack, CM spell damage). Persist training progress (e.g. `IncrementalHeroTraining` or similar) so lineup strength reflects both base stats and trained stats.
- **IncrementalLineup** (or `Lineup`):  
  - `id`, `userId`, `name`, **heroIds** (ordered array of **hero ids**, 1–5; see “Roster and hero ids” below), `createdAt`, `updatedAt`.  
  - One “active” lineup per user for runs, or allow multiple named lineups.  
  - **Hero ids** are **integers** matching the existing **`Hero`** table in `prisma/schema.prisma` (`Hero.id`), so we can join with that table for name, `localized_name`, `primary_attr`, etc., and reuse it across the app.

#### Roster and hero ids (Option A – decided)

We use **Option A**: lineup stores hero ids; training is per (userId, heroId). User A’s Lina and User B’s Lina are different because each user has their own training row per hero.

- **Lineup**: `heroIds: number[]` (ordered 1–5). Each value is a **`Hero.id`** from the existing Prisma `Hero` table.  
- **Training**: Stored per **(userId, heroId)** where `heroId` is `Hero.id`. “User A’s Lina” = hero from `Hero` table + User A’s training for that hero id.  
- **Battle**: When building battle state, resolve each lineup slot: look up hero by id (from `Hero` + incremental game stats), then apply that user’s training for that heroId → effective stats.  
- **Hero reference**: Use the existing **`Hero`** model (`id`, `name`, `localized_name`, `primary_attr`, etc.) for identity and display. Incremental-specific data (base attack interval, base damage, spell interval, ability ids) lives in code constants or a small table keyed by `heroId` (referencing `Hero.id`), so we don’t duplicate hero identity.

### Run and map

- **IncrementalRun**:  
  - `id`, `userId`, `lineupId`, `status` (active | won | dead), `currentNodeId`, `startedAt`, `finishedAt`.  
  - Optional: `seed` for deterministic map/encounters.
- **IncrementalMapNode** (or embedded in run):  
  - Node id, type (combat | elite | boss | shop | event | rest | **base**), encounter id (if combat/elite/boss), next node ids, floor/act. **Bases** provide fountain-style healing throughout the run.  
  - Can be generated at run start from a graph definition (see PROGRESSION_AND_ENCOUNTERS).

### Battle (in-memory or persisted)

- **BattleState**:  
  - **Player side**: List of hero instances (hero id = `Hero.id`, current HP, max HP, attack timer, spell timer, buffs). **Timers reset to 0** when a hero is unfocused (progress discarded on switch).  
  - **Enemy side**: List of enemy instances (enemy def id, current HP, attack timer, optional spell timer)—same timer model as heroes; bosses can be as complex as a hero.  
  - **Focus**: `focusedHeroIndex` (which of the player’s heroes is currently active; only this hero’s timers advance). **Focus switch cooldown**: `lastFocusChangeAt` (or equivalent)—player cannot switch focus again for **2 seconds**. **Auto-rotation**: if no player input, advance focus every 10s.  
  - **Target**: `targetIndex` (or equivalent) for the **shared target** on the enemy side. Each team has one active (focus) hero and one shared target; **penalty** when attacking a non-focus enemy.  
  - **Battle clock**: `elapsedTime` or `lastTickAt` for delta-based timer advance.  
  - **Result**: `null` | `win` | `lose` when battle ends.  
- **PvE in background**: Battle can continue when the player is away (e.g. server tick or background job using auto-rotation). Persist or cache state (e.g. by `runId` + `encounterId`) so runs can complete without the window open.  
- **PvP**: Both players must have the window in focus or the battle **pauses** (no background resolution for PvP).

### Reference data (no per-user state)

- **Hero**: Use the existing **`Hero`** table in `prisma/schema.prisma` (`id`, `name`, `localized_name`, `primary_attr`, etc.) for hero identity. All lineup and training references use **`Hero.id`** (integer).
- **Incremental hero stats** (game-only): Base attack interval, base attack damage, **base armor**, **base magic resistance**, base spell interval (or null), ability id(s). **Spell slots**: one per hero at start; design for up to 3. Stored in code (e.g. `lib/incremental/constants/heroes.ts`) keyed by `Hero.id`, or in a small table that references `Hero.id`, so we don’t add columns to the shared `Hero` table.
- **Damage types**: **Physical** (reduced by armor), **magical** (reduced by magic resist), **pure** (bypasses resistances). All **auto-attacks** are physical. **Spells** can be physical, magical, or pure (per ability definition). Each hero and enemy has base armor and base magic resist (0–1) for incoming damage.
- **Auto-attack**: Intrinsic to every entity (hero or enemy). Defined by attack interval + damage on HeroDef/EnemyDef; no ability id; always **physical** damage. In battle, each entity has an **attack timer** that advances; when it reaches the interval, the engine resolves the basic attack (then applies target’s armor). **Abilities** are separate (spell timers or passives) and have an optional **damage type**.
- **Ability definition**: id, type (active | passive), trigger, effect (formula + target), optional **damageType** (physical | magical | pure). Spells and specials only; not used for basic attack. Code or DB.
- **Encounter definition**: id, list of (enemy def id, count or instance config). Code or DB.
- **Enemy definition**: id, name, HP, attack pattern (e.g. interval + damage), **base armor**, **base magic resist**, optional spell. Same model as heroes: intrinsic auto-attack (physical) + optional ability(ies). Code or DB.

---

## Timer Engine (Logical)

- **Input**: Current battle state, `deltaTime` (seconds since last tick), `focusedHeroIndex`.  
- **Process**:  
  1. Advance **only** the focused hero’s `attackTimer` and `spellTimer` by `deltaTime`. When focus **changes**, reset the **newly unfocused** hero’s timers to 0; the **newly focused** hero’s timers start from 0. Enforce **2s cooldown** on focus switch (ignore focus-change requests within 2s of last change). If no focus change for 10s, apply **auto-rotation** (switch focus to next hero; reset previous hero’s timers to 0).  
  2. If `attackTimer >= attackInterval`: resolve **auto-attack first** (physical damage; apply **armor** reduction on target; apply **non-focus penalty** if target is not the enemy’s focus hero), reset `attackTimer`.  
  3. If `spellTimer >= spellInterval`: resolve **spell** (apply effect per ability; use ability’s **damage type** and target’s armor/magic resist for damage reduction; pure bypasses), reset `spellTimer`.  
  4. Advance **enemy** timers by `deltaTime`; for each enemy that reaches its interval, resolve enemy action (same timer model as heroes; bosses can have multiple abilities).  
  5. Apply **passives** when conditions fire (e.g. on damage taken → Bristleback reflect).  
  6. Check death (remove dead units); check win/loss (all enemies dead / all player heroes dead).  
- **Output**: Updated battle state (timers, HP, result if any).  
- **Order**: **Auto-attack → spell** on the same tick; then enemy actions; then passives. Some RNG is acceptable; engine must support **full simulation** of a battle from start to finish (e.g. for background PvE).

---

## API Surface (Summary)

| Method | Path (conceptual) | Purpose |
|--------|-------------------|--------|
| GET    | `/api/incremental/lineups` | List current user’s lineups |
| POST   | `/api/incremental/lineups` | Create lineup (body: name, heroIds[] where each is `Hero.id` Int) |
| GET    | `/api/incremental/lineups/[id]` | Get lineup |
| PATCH  | `/api/incremental/lineups/[id]` | Update lineup (e.g. hero order, name) |
| DELETE | `/api/incremental/lineups/[id]` | Delete lineup |
| POST   | `/api/incremental/runs` | Start run (body: lineupId); create run + initial map node |
| GET    | `/api/incremental/runs/[runId]` | Get run + map state (current node, choices) |
| POST   | `/api/incremental/runs/[runId]/advance` | Choose next node (body: nextNodeId); may start battle |
| GET    | `/api/incremental/runs/[runId]/battle` | Get current battle state (if in encounter) |
| PATCH  | `/api/incremental/runs/[runId]/battle` | Set focus (body: focusedHeroIndex) and/or tick (body: deltaTime); return new state |
| GET    | `/api/incremental/heroes` | List hero definitions (for lineup builder) |
| GET    | `/api/incremental/encounters/[id]` | Get encounter definition (optional) |

PvP endpoints (e.g. queue, match, result) can be added later and follow the same pattern (battle state + focus/tick).

---

## Integration with Existing Codebase

- **Auth**: Use existing session/auth in SvelteKit (`hooks.server.ts`, user in `locals`). Protect all `/api/incremental/*` and `/incremental/*` routes by user.  
- **Prisma**: Add new models to `prisma/schema.prisma` for lineups, runs, and optionally battle snapshot; run migrations when implementing.  
- **Hero id**: Use **integer** `Hero.id` from the existing `Hero` table in `prisma/schema.prisma` everywhere (lineups, training, battle state). Hero assets and names come from that table.  
- **No coupling to card-battler**: No shared tables or battle logic; only thematic alignment (hero names, abilities). Separate docs and feature flags so the incremental game can be developed and shipped independently.

---

## Testing Considerations

- **Simulation**: Battles need not be fully deterministic (some RNG is acceptable), but the engine must be able to **simulate a battle from start to finish** (e.g. fixed or random seed, given focus/target sequence or auto-rotation). Use this for background PvE completion and for tests that assert “battle ends in win/loss” under given conditions.  
- **Formulas**: Unit-test stat formulas (interval, damage, **non-focus target penalty**) with known inputs.  
- **Integration**: Test API: create lineup → start run → enter battle → set focus and target → tick (or auto-rotate) → assert state changes and win/loss.

---

## Summary

| Layer | Content |
|-------|---------|
| **Modules** | `lib/incremental/` (types, constants, engine, stats); `routes/incremental/` (pages); `routes/api/incremental/` (API). |
| **Data** | Lineup (hero ids), Run (map state, currentNode), BattleState (hero/enemy instances, focus, timers); reference data for heroes, abilities, encounters. |
| **Engine** | Timer advance for focused hero only; **timers reset** on focus switch; **2s cooldown** on focus switch; 10s auto-rotation; shared target + non-focus penalty; resolution order (attack → spell → enemies → passives); full simulation support; PvE continues in background, PvP pauses if either player leaves. |
| **API** | Lineups CRUD; run start/advance; battle get/update (focus + tick). |
| **Integration** | Same auth and Prisma; hero ids = `Hero.id` from existing `Hero` table; feature separate from card-battler. |

Implement when ready; this doc is the blueprint.
