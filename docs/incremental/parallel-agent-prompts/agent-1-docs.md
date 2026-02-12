# Agent 1: Documentation – Encounters and Map

**Goal:** Add a short doc that defines “encounters” and how the run’s encounter order works. No code changes.

**Context:** In the incremental game, an **encounter** is one camp composition (which enemies and how many). The **run’s encounter sequence** is the order of camps the player faces, determined by the map graph (each node has an `encounterId`). We want this written down so it’s clear for future content (mix-and-match camps per node).

**Task:**

1. Create **one** new file: `docs/incremental/ENCOUNTERS_AND_MAP.md`.

2. In that file, document the following in clear, concise sections:

   - **What an encounter is**  
     One camp composition: an `EncounterDef` (id + list of `{ enemyDefId, count }`). Defined in code in `src/lib/incremental/constants/encounters.ts`. One encounter can be reused on multiple map nodes (e.g. same camp on several combats) or different encounters per node.

   - **What the run’s encounter order is**  
     The ordered list of camps the player will face in a run. This is **not** a separate data structure: it is the sequence of `encounterId`s along the path through the map (start node → combat nodes → elite → boss). The map graph template (in `src/lib/incremental/map/graph.ts`) is the single source of truth: each node has an `encounterId`; the order of nodes in the template is the encounter order.

   - **Mix-and-match**  
     To create engaging runs, assign different `encounterId`s per node in the graph template (e.g. node 1 = wolf_pack, node 2 = armor_camp, node 3 = dps_camp, elite = elite_camp, boss = skull_lord_boss). No new “run encounter list” type is added; the graph template defines both order and which camp at each step.

3. Optionally add a 1–2 sentence pointer from `docs/incremental/ARCHITECTURE.md` or `docs/incremental/README.md` to this new doc (e.g. “Encounter model and run order: see ENCOUNTERS_AND_MAP.md”). Do not duplicate long content into ARCHITECTURE.

4. Do **not** change any TypeScript or Prisma files.

**Deliverable:** New `docs/incremental/ENCOUNTERS_AND_MAP.md` (and optional one-line link from ARCHITECTURE or README). No other edits.
