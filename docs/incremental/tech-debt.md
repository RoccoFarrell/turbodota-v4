# Incremental System — Tech Debt

## Action Pipeline

### items/use parallel dispatch
**File:** `src/routes/api/incremental/items/use/+server.ts`
**Issue:** Contains a completely separate if-chain duplicating action-type dispatch outside of `applyRewards`. Adding a new action that should be item-targetable (e.g. woodcutting for arcane runes) requires a new branch here in addition to the `REWARD_HANDLERS` table.
**Fix:** Refactor `handleIdleInstant1h` to call `applyRewards` directly instead of reimplementing dispatch. Requires unifying the response shape.

### action-engine.ts legacy wrapper
**File:** `src/lib/incremental/actions/action-engine.ts`
**Issue:** `ActionType = 'mining' | 'training'` is a hard two-member union. The file is not called by the live server path (the POST endpoint calls `advanceIdleTimer` directly), making it redundant dead code.
**Fix:** Delete `action-engine.ts`. Any consumers should import `advanceIdleTimer` and `getActionDef` directly.

### talent-rate-modifier.ts if-chain
**File:** `src/lib/incremental/actions/talent-rate-modifier.ts`
**Issue:** `computeRateModifier` uses a literal string if-chain to map talent node types to action types. Adding a new speed talent (e.g. `woodcutting_speed`) requires a new branch here.
**Fix:** Make dispatch data-driven from a `TalentNode.actionType` field mapping to a modifier lookup.

### Building upgrade speed bonus is dead code
**File:** `src/lib/incremental/stats/upgrade-formulas.ts`
**Issue:** `getSpeedBonus(upgradeType, level)` returns `0.1 * level` for building upgrades, but this return value is never consumed in the action tick pipeline. Players can buy building upgrades with no training speed effect.
**Fix:** Read `getSpeedBonus` in `/api/incremental/action/+server.ts` when computing the rate modifier for training actions, combining it with the talent modifier and affinity modifier.
