# Phase 4.1 – Prisma schema and migrations (complete)

**Milestone 4.1** is done: schema and migration for lineups, runs, and map nodes; data layer and tests for create/query by userId.

---

## Schema (`prisma/schema.prisma`)

### Enums
- **IncrementalRunStatus**: ACTIVE, WON, DEAD.
- **IncrementalNodeType**: COMBAT, ELITE, BOSS, SHOP, EVENT, REST, BASE.

### Models
- **IncrementalLineup**: id (cuid), userId (→ User.id), name, heroIds (Int[] = Hero.id), createdAt, updatedAt. Index on userId.
- **IncrementalRun**: id (cuid), userId (→ User.id), lineupId (→ IncrementalLineup), status (default ACTIVE), currentNodeId (string), startedAt, finishedAt, seed (optional), createdAt, updatedAt. Indexes on userId, lineupId.
- **IncrementalMapNode**: id (cuid), runId (→ IncrementalRun), nodeType, encounterId (nullable), nextNodeIds (String[]), floor, act (optional). Index on runId.

User relations: `User.incrementalLineups`, `User.incrementalRuns`. Cascade delete from User to lineups and runs, from lineup to runs, from run to map nodes.

---

## Migration

- **`prisma/migrations/migration_lock.toml`**: provider = "postgresql".
- **`prisma/migrations/20250208180000_add_incremental_lineup_run_mapnode/migration.sql`**: CREATE TYPE for the two enums; CREATE TABLE for the three models; CREATE INDEX; AddForeignKey for User, IncrementalLineup, IncrementalRun, IncrementalMapNode.

**Apply locally**: Run `npx prisma migrate dev` (interactive) or `npx prisma migrate deploy` to apply. Then `npx prisma generate` to regenerate the client.

---

## Data layer

- **`src/lib/incremental/data/lineup.ts`**: Minimal **IncrementalDb** interface (no Prisma import in incremental lib). Functions: **createLineup(db, { userId, name, heroIds })**, **getLineupsByUserId(db, userId)**, **createRun(db, { userId, lineupId, currentNodeId, seed? })**, **getRunsByUserId(db, userId)**. Callers pass the app’s Prisma client (e.g. from `src/lib/server/prisma`).

### Tests

- **`src/lib/incremental/data/lineup.test.ts`**: In-memory mock of IncrementalDb; tests create lineup → getLineupsByUserId; create run → getRunsByUserId. No real DB required.

---

## Next

**Milestone 4.2** is complete (see [PHASE_4_2_COMPLETE.md](./PHASE_4_2_COMPLETE.md)). Next: **Phase 5** – start run and advance node.
