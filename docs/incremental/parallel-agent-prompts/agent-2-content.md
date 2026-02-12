# Agent 2: Content – New Enemies, Encounters, Map Graph

**Goal:** Add new enemy definitions and encounter definitions, and update the map graph so the first run uses a variety of camps (wolf pack, armor camp, DPS camp, elite, boss). Do **not** implement the boss summon mechanic (no `summonAbility` yet); just add the enemy and encounter data. Another agent will add the summon system.

**Context:** Currently only `large_wolf`, `small_wolf`, and encounter `wolf_pack` exist; the map uses `wolf_pack` for every combat/elite/boss node. We want: new enemies (armored brute, arcane wisp, frenzy rat, lesser skull, skull lord), new encounters that use them, and the map template updated so each node has a distinct encounter.

**Task:**

1. **Enemy definitions** – In `src/lib/incremental/constants/encounters.ts`, add the following enemies to the `enemies` array (keep existing `large_wolf` and `small_wolf`). Use exact `id` strings as below; other fields (name, hp, attackInterval, damage, baseArmor, baseMagicResist) as specified. Do **not** add `summonAbility` to any enemy in this task.

   | id             | name          | hp   | attackInterval | damage | baseArmor | baseMagicResist |
   |----------------|---------------|------|----------------|--------|-----------|-----------------|
   | armored_brute  | Armored Brute | 600  | 3.5            | 3      | 35        | 0.05            |
   | arcane_wisp   | Arcane Wisp   | 400  | 2.2            | 2      | 5         | 0.40            |
   | frenzy_rat    | Frenzy Rat    | 200  | 1.2            | 8      | 5         | 0.10            |
   | lesser_skull  | Lesser Skull  | 150  | 1.0            | 10     | 0         | 0.20            |
   | skull_lord    | Skull Lord    | 2500 | 4.0            | 5      | 20        | 0.30            |

   Ensure `getEnemyDef(id)` and the `enemyById` map include all of these.

2. **Encounter definitions** – In the same file, add these encounters to the `encounters` array (keep existing `wolf_pack`). Use exact `id` strings.

   - **wolf_pack** (existing): 1 large_wolf, 2 small_wolf.
   - **armor_camp**: 2 armored_brute, 1 arcane_wisp.
   - **dps_camp**: 3 frenzy_rat.
   - **mixed_camp**: 1 armored_brute, 2 frenzy_rat.
   - **elite_camp**: 2 armored_brute, 2 arcane_wisp.
   - **skull_lord_boss**: 1 skull_lord only (no lesser_skull in the list; they will be added at runtime by the summon agent).

   Ensure `getEncounterDef(id)` and `encounterById` include all.

3. **Map graph** – In `src/lib/incremental/map/graph.ts`, update `DEFAULT_GRAPH_TEMPLATE` so each node uses the intended encounter (by `encounterId`):

   - Index 0: REST, `encounterId: null`.
   - Index 1: COMBAT, `encounterId: 'wolf_pack'`.
   - Index 2: COMBAT, `encounterId: 'armor_camp'`.
   - Index 3: COMBAT, `encounterId: 'dps_camp'` (or `mixed_camp` if you prefer).
   - Index 4: ELITE, `encounterId: 'elite_camp'`.
   - Index 5: BOSS, `encounterId: 'skull_lord_boss'`.

   Keep the same node types and `nextTemplateIndices` structure (linear path).

4. **Tests** – Update or add tests that rely on encounter/enemy ids (e.g. `constants.test.ts`, `map/graph.test.ts`, `battle-state.test.ts`, `run-service.test.ts`) so they still pass. If tests hardcode `wolf_pack` for the boss or other nodes, change them to use the new encounter ids where appropriate. Do not add or change summon logic in tests.

5. Do **not** modify `types.ts`, `resolution.ts`, `battle-loop.ts`, or `battle-state.ts`. Do not add `summonAbility` to `EnemyDef` or any enemy.

**Deliverable:** All new enemies and encounters in `encounters.ts`, updated `DEFAULT_GRAPH_TEMPLATE` in `map/graph.ts`, and any test updates so the suite still passes. No summon behavior yet.
