# Phase 5.1 – Start run and advance node (complete)

**Milestone 5.1** is done: run lifecycle (start → advance → enter encounter with battle state).

---

## Run service (`src/lib/incremental/run/run-service.ts`)

### DB interface
- **RunServiceDb**: Extends MapRunDb with `incrementalLineup.findUnique` (by id) and `incrementalRun.create`, and run `findUnique` returning **RunRecord** (includes lineupId, userId). Callers pass the app’s Prisma client.

### startRun(db, userId, lineupId, options?: { seed? })
- Validates lineup exists, belongs to user, and has **1–5 heroes** (throws otherwise).
- Creates **IncrementalRun** with placeholder `currentNodeId`, then calls **createRunMap(db, run.id, seed)** to create map nodes and set current node to first node.
- Returns **StartRunResult** `{ runState, runId }` (runState from getRunState).

### advanceRun(db, runId, userId, nextNodeId)
- Validates run exists, belongs to user, and is ACTIVE.
- Validates **nextNodeId** is in current node’s **nextNodeIds** (throws if invalid).
- Updates **run.currentNodeId** to nextNodeId.
- If the **new node** is COMBAT, ELITE, or BOSS and has **encounterId**, loads lineup, builds **BattleState** via **createBattleState(lineup.heroIds, encounterId)**, and returns **AdvanceRunResult** with **runState** and **encounter** `{ encounterId, heroIds, battleState }`. Battle state is in-memory for this request; persistence (e.g. Redis) can be added in Phase 7.

### Tests (`run/run-service.test.ts`)
- startRun creates run with map and returns run state (currentNodeId and nextNodeIds set).
- advanceRun moves to next node; on combat node returns encounter with encounterId, heroIds, and battleState.
- startRun throws when lineup has wrong user or invalid hero count (0 or &gt;5).
- advanceRun throws when nextNodeId is not in current node’s nextNodeIds.

---

## Next

**Phase 6** and **Phase 7** are complete. Next: **Phase 8** – Battle UI. See [DEVELOPMENT_ROADMAP.md](../DEVELOPMENT_ROADMAP.md).
