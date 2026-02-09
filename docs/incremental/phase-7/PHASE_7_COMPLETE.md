# Phase 7 – PvE Integration: Rewards & Bases (complete)

**Milestone 7.1** is done: post-encounter rewards (heal, gold, XP), base-node fountain heal, run state persistence, and run complete on final node win.

---

## Schema

**IncrementalRun** (new fields):

- **gold** (Int, default 0) – run-level gold from encounter wins.
- **heroHp** (Json?, optional) – `number[]` HP per lineup index after last encounter; `null` = full HP (e.g. after base or start).
- **xpByHeroId** (Json?, optional) – `Record<string, number>` heroId → XP.

Migration: `prisma/migrations/20250208000000_phase7_run_rewards/migration.sql`.

Apply with: `npx prisma migrate deploy` (or `prisma db push` for dev). Then `npx prisma generate`.

---

## Rewards (win)

- **Gold**: +25 per encounter win (`GOLD_PER_ENCOUNTER_WIN`).
- **XP**: +10 per hero per encounter win (`XP_PER_HERO_WIN`), stored in `xpByHeroId`.
- **Heal**: 10% of each hero’s max HP after win (`HEAL_PERCENT_ON_WIN`); saved in `heroHp` for the next encounter.

Constants: `src/lib/incremental/constants/rewards.ts`.

---

## Battle PATCH on result

- **Lose**: run `status` = DEAD, `finishedAt` = now (unchanged from Phase 6).
- **Win**:
  1. Apply heal to current battle state (in memory).
  2. Persist: `gold`, `heroHp` (healed HP array), `xpByHeroId` (merged with new XP).
  3. If current node has **no next nodes** (final node): set `status` = WON and `finishedAt` = now. Otherwise run stays ACTIVE.

---

## Base node

- On **advance** to a node with `nodeType === 'BASE'`, run is updated with `heroHp: null`.
- Next encounter then starts with **full HP** (createBattleState uses `initialHeroHp` only when `run.heroHp` is a valid array; otherwise full HP).

Logic: `src/lib/incremental/run/run-service.ts` (`advanceRun`).

---

## Initial HP for next encounter

- When starting an encounter, **createBattleState** accepts optional **initialHeroHp** (from `run.heroHp`).
- If `run.heroHp` is an array of length matching the lineup, heroes start at those HP values (capped at max); otherwise they start at full HP.

Logic: `src/lib/incremental/engine/battle-state.ts` (`CreateBattleStateOptions.initialHeroHp`).

---

## Files touched

- `prisma/schema.prisma` – IncrementalRun: gold, heroHp, xpByHeroId.
- `prisma/migrations/20250208000000_phase7_run_rewards/migration.sql` – new migration.
- `src/lib/incremental/constants/rewards.ts` – reward constants.
- `src/lib/incremental/constants/index.ts` – export rewards.
- `src/lib/incremental/engine/battle-state.ts` – `initialHeroHp` option.
- `src/lib/incremental/data/run-map.ts` – MapRunDb: heroHp on findUnique, heroHp in update data.
- `src/lib/incremental/run/run-service.ts` – RunRecord rewards fields; advanceRun: base → heroHp null, encounter → initialHeroHp from run.
- `src/routes/api/incremental/runs/[runId]/battle/+server.ts` – on win: heal, gold, XP, persist; WON + finishedAt if final node.

---

## Next

**Phase 8**: UI – Battle screen (display lineup, focus, timers, target, enemies; focus/target actions; poll PATCH for tick). See [DEVELOPMENT_ROADMAP.md](../DEVELOPMENT_ROADMAP.md#phase-8-ui--battle-screen).
