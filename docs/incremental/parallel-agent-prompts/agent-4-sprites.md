# Agent 4: Sprites – Placeholders for New Enemies

**Goal:** Register sprite (or placeholder) configs for all new enemy ids so the battle UI does not break when those enemies appear. Use existing sprite assets where reasonable (e.g. wolf) or a single generic placeholder for all new ids; no need to add new art files.

**Context:** `src/lib/incremental/constants/enemy-sprites.ts` maps enemy ids to sprite sheet configs. Currently only `large_wolf` and `small_wolf` are registered. New enemies from the Encounters plan: `armored_brute`, `arcane_wisp`, `frenzy_rat`, `lesser_skull`, `skull_lord`. The battle screen likely uses `getEnemySpriteConfig(enemyId)` or `hasEnemySpriteSheet(enemyId)`; missing ids may cause errors or blank slots.

**Task:**

1. **List of new enemy ids** (all must get a config):  
   `armored_brute`, `arcane_wisp`, `frenzy_rat`, `lesser_skull`, `skull_lord`.

2. In `src/lib/incremental/constants/enemy-sprites.ts`:
   - Add an entry in `enemySpriteConfigs` (or equivalent structure) for each of the five ids above.
   - Reuse existing assets where it makes sense:
     - Reusing `wolf_spritesheet` / `wolf_spritesheet.json` for some or all new ids is fine.
     - If the codebase has a generic “unknown” or “placeholder” sprite, use that for any new id that shouldn’t use the wolf.
   - If there is no generic placeholder, use the same wolf sprite sheet paths for every new id so the UI always has something to show. Document in a short comment that these are placeholders and can be replaced with specific art later.

3. Ensure `getEnemySpriteConfig(id)` returns a valid config for each of the five ids and that `hasEnemySpriteSheet(id)` returns true for them. Do not remove or change the existing `large_wolf` / `small_wolf` entries.

4. Do **not** add new image or JSON files under `static/` or `src/lib/assets/` unless you are only copying an existing placeholder. Prefer mapping new ids to existing sprite sheets.

**Deliverable:** Updated `enemy-sprites.ts` with a config for each of `armored_brute`, `arcane_wisp`, `frenzy_rat`, `lesser_skull`, `skull_lord`. No changes to encounters, types, resolution, or battle loop.
