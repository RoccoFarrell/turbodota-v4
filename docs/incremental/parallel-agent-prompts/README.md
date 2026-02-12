# Parallel Agent Prompts – Encounters & Enemy Lineups

These prompts split the **Encounters and Enemy Lineups** implementation plan so **four agents can run in parallel**. Handoff is minimal: **Agent Content** and **Agent Summon** both touch the codebase but different files (constants + graph vs types + engine); **Agent Summon** assumes enemy ids `skull_lord` and `lesser_skull` exist (Agent Content adds them).

| Agent | Focus | Main files | Depends on |
|-------|--------|------------|------------|
| **Agent Docs** | Encounter model documentation | `docs/incremental/ENCOUNTERS_AND_MAP.md` | None |
| **Agent Content** | New enemies, encounters, map graph | `encounters.ts`, `map/graph.ts` | None |
| **Agent Summon** | Boss summon mechanic (types, resolution, loop) | `types.ts`, `battle-state.ts`, `resolution.ts`, `battle-loop.ts` + tests | Assumes `skull_lord` / `lesser_skull` defs exist |
| **Agent Sprites** | Sprite placeholders for new enemies | `enemy-sprites.ts` | None (uses enemy id list from plan) |

**Suggested order to assign:** Start all four in parallel. If you run integration after: run Content and Summon first (or Summon after Content so `lesser_skull`/`skull_lord` exist), then Sprites and Docs anytime.

---

- **Agent 1 prompt:** [agent-1-docs.md](./agent-1-docs.md)  
- **Agent 2 prompt:** [agent-2-content.md](./agent-2-content.md)  
- **Agent 3 prompt:** [agent-3-summon.md](./agent-3-summon.md)  
- **Agent 4 prompt:** [agent-4-sprites.md](./agent-4-sprites.md)
