# Encounters and Map

Short reference for how **encounters** are defined and how the **run’s encounter order** is determined.

---

## What an encounter is

An **encounter** is one camp composition: which enemies appear and how many of each.

In code it is represented by an **`EncounterDef`**: an id plus a list of `{ enemyDefId, count }` entries. Encounter definitions live in `src/lib/incremental/constants/encounters.ts`. A single encounter can be reused on many map nodes (e.g. the same “wolf pack” camp on several combats), or you can define different encounters and assign one per node.

---

## What the run’s encounter order is

The **run’s encounter order** is the ordered list of camps the player will face in that run (first combat → … → elite → boss).

This is **not** a separate data structure. The order comes from the **path through the map**: start node → combat nodes → elite → boss. The **map graph template** in `src/lib/incremental/map/graph.ts` is the single source of truth. Each node has an `encounterId`; the sequence of nodes in the template is the encounter sequence. So the “run encounter list” is implicit: it’s the sequence of `encounterId`s along that path.

---

## Mix-and-match

To create varied runs, assign different `encounterId`s per node in the graph template. For example: node 1 = `wolf_pack`, node 2 = `armor_camp`, node 3 = `dps_camp`, elite = `elite_camp`, boss = `skull_lord_boss`. No separate “run encounter list” type is needed—the graph template defines both the order of steps and which camp is used at each step.
