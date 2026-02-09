# Phase 4.2 – Map graph and run initialization (complete)

**Milestone 4.2** is done: minimal map graph, `createRunMap`, and `getRunState`.

---

## Map graph (`src/lib/incremental/map/graph.ts`)

- **Template**: Linear path – 3× COMBAT (wolf_pack) → 1× ELITE (wolf_pack) → 1× BOSS (wolf_pack). Each node has `nodeType`, `encounterId`, `nextTemplateIndices` (indices into the template array).
- **`generateMapForRun(runId, seed?)`**: Returns an array of **GeneratedMapNode** (id, runId, nodeType, encounterId, nextNodeIds, floor, act). Ids are generated per run; with `seed`, ids are deterministic for the same runId and seed.
- Node types use Prisma-style strings: COMBAT, ELITE, BOSS, etc.

---

## Run map data layer (`src/lib/incremental/data/run-map.ts`)

- **MapRunDb** interface: `incrementalRun.findUnique`, `update`; `incrementalMapNode.createMany`, `findUnique`. Callers pass the app’s Prisma client (which has these methods).
- **`createRunMap(db, runId, seed?)`**: Calls `generateMapForRun(runId, seed)`, creates all nodes via `createMany`, updates `run.currentNodeId` to the first node’s id. Run must already exist. Returns `{ firstNodeId, nodeCount }`.
- **`getRunState(db, runId)`**: Loads run by id, loads current node by `run.currentNodeId`, returns **RunState** `{ runId, status, currentNodeId, nextNodeIds }`. Status is normalized to `'active' | 'won' | 'dead'`. Returns `null` if run not found.

---

## Tests

- **`map/graph.test.ts`**: generateMapForRun yields 5 nodes in order; first node’s nextNodeIds points to second; with seed, ids are deterministic; all nodes have the same runId.
- **`data/run-map.test.ts`**: createRunMap creates nodes and updates run currentNodeId; getRunState returns state with current and next options; getRunState returns null for unknown runId.

---

## Next

**Phase 5.1** is complete (see [phase-5/PHASE_5_1_COMPLETE.md](../phase-5/PHASE_5_1_COMPLETE.md)). Next: **Phase 6** – API layer.
