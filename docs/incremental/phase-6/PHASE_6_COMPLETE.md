# Phase 6 – API Layer (complete)

**Milestones 6.1 and 6.2** are done: lineups CRUD, heroes list, runs start/get/advance, and battle get/tick with auth.

---

## 6.1 Lineups and heroes

- **GET /api/incremental/lineups** – List current user's lineups (auth required). Uses `getLineupsByUserId(prisma, userId)`.
- **POST /api/incremental/lineups** – Body `{ name, heroIds }`. Validates 1–5 heroes and that each id exists via `getHeroDef`. Creates via `createLineup(prisma, ...)`.
- **GET /api/incremental/lineups/[id]** – Get lineup by id; 403 if not owner.
- **PATCH /api/incremental/lineups/[id]** – Update name and/or heroIds (same validation as create).
- **DELETE /api/incremental/lineups/[id]** – Delete lineup (own only).
- **GET /api/incremental/heroes** – Return hero definitions from constants (for lineup builder). Auth required.

All endpoints use `locals.auth.validate()`; 401 if unauthenticated.

---

## 6.2 Runs and battle

- **POST /api/incremental/runs** – Body `{ lineupId, seed? }`. Calls `startRun(prisma, userId, lineupId, { seed })`. Returns `{ runState, runId }`.
- **GET /api/incremental/runs/[runId]** – Run + map state (current node, nextNodeIds) via `getRunState`. Own only.
- **POST /api/incremental/runs/[runId]/advance** – Body `{ nextNodeId }`. Calls `advanceRun`; when new node is combat/elite/boss, stores battle state in **in-memory cache** (`src/lib/server/incremental-battle-cache.ts`) and returns `{ runState, encounter: { encounterId, heroIds, started: true } }`.
- **GET /api/incremental/runs/[runId]/battle** – Returns current battle state from cache, or 404 if no active battle.
- **PATCH /api/incremental/runs/[runId]/battle** – Body `{ focusedHeroIndex?, targetIndex?, deltaTime? }` (default deltaTime 0.1). Applies focus/target and runs `tick(state, deltaTime, options)`. Persists state back to cache. When `state.result` is win/lose: clears cache, updates run `status` (WON/DEAD) and `finishedAt`, then returns final state.

Battle state is stored in a process-local `Map<runId, BattleState>`. Persistence (e.g. Redis) can be added in Phase 7 for “resume battle”.

---

## Files

- `src/routes/api/incremental/lineups/+server.ts` – GET, POST.
- `src/routes/api/incremental/lineups/[id]/+server.ts` – GET, PATCH, DELETE.
- `src/routes/api/incremental/heroes/+server.ts` – GET.
- `src/routes/api/incremental/runs/+server.ts` – POST.
- `src/routes/api/incremental/runs/[runId]/+server.ts` – GET.
- `src/routes/api/incremental/runs/[runId]/advance/+server.ts` – POST.
- `src/routes/api/incremental/runs/[runId]/battle/+server.ts` – GET, PATCH.
- `src/lib/server/incremental-battle-cache.ts` – get/set/clear battle state by runId.

---

## Next

**Phase 7** is complete. See [phase-7/PHASE_7_COMPLETE.md](../phase-7/PHASE_7_COMPLETE.md). Next: **Phase 8** – Battle UI.
