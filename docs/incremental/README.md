# Incremental Lineup Battler – Documentation

A **separate** game concept from the card-battler: an incremental/idle-style game where you **unlock and train** Dota heroes (via Dota 2 wins and passive Training), build a **lineup of 1–5** of them, and run StS-style PvE or battle other players’ lineups in PvP.

## Core Pillars

- **Dota 2 integration**: Unlock heroes by winning Dota 2 on that hero; forge-style integration; **Training** lets you passively boost a hero’s stats (e.g. Axe’s health, Void’s auto-attack, CM’s spell damage). Then add heroes to your lineup for runs or PvP.
- **Lineup**: 1–5 Dota heroes per roster (flexible; some events may use a single hero); each hero has **auto-attack** and **spell** timers.
- **Focus mechanic**: Only the **focused** (active) hero’s timers advance. **Timers reset** when you switch focus (progress discarded)—so tap accurately: don’t switch off before an attack or spell fires, or you lose progress and risk getting hit. **2s cooldown** on switching focus to encourage tactical rotations. Heroes **auto-rotate** focus every 10s if the player doesn’t tap.
- **Targeting**: Each team has one **active** hero (focus) and one **shared target** on the enemy team. Attacking the enemy’s **focus** hero is incentivized; attacking a non-focus enemy incurs a **stat penalty** (Dota-style backline protection).
- **Progression**: StS-style map (floors, branches, elites, boss, **bases/fountain** for healing); encounters vs. enemy packs or vs. another player’s lineup (PvP, separate queue). Post-fight: small health/mana restore, **XP** and **gold**; XP per-hero for skills (Training); shops for run boosts and relics.
- **Stats**: Base stats + **incremental Training** per hero; attack (speed, damage, modifiers) and spell (haste, magic damage) stats; run-only items and relics.

## Document Index

| Document | Purpose |
|----------|---------|
| [CORE_CONCEPT.md](./CORE_CONCEPT.md) | Vision, game loop, StS progression, PvP model |
| [HERO_AND_STATS.md](./HERO_AND_STATS.md) | Attributes (Str/Agi/Int), attack & spell stats, scaling |
| [BATTLE_MECHANICS.md](./BATTLE_MECHANICS.md) | Battle flow, focus/tap, timers, damage resolution |
| [SPELLS_AND_ABILITIES.md](./SPELLS_AND_ABILITIES.md) | Active vs passive abilities, hero examples (Bristleback, Lina, Dazzle) |
| [PROGRESSION_AND_ENCOUNTERS.md](./PROGRESSION_AND_ENCOUNTERS.md) | Map structure, PvE encounters, PvP battles |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Code layout, data models, timer engine, API surface |
| [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) | Phased implementation plan; short, testable chunks |
| [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md) | Resolved decisions and open questions |
| [phase-0/](./phase-0/) | Phase 0: [PHASE_0_PENDING.md](./phase-0/PHASE_0_PENDING.md), [PHASE_0_COMPLETE.md](./phase-0/PHASE_0_COMPLETE.md) |
| [phase-1/](./phase-1/) | Phase 1 completion: [PHASE_1_COMPLETE.md](./phase-1/PHASE_1_COMPLETE.md) |
| [phase-2/](./phase-2/) | Phase 2.1: [PHASE_2_1_COMPLETE.md](./phase-2/PHASE_2_1_COMPLETE.md) |

## Implementation status

- **Phase 0 (Foundation & Setup)**: ✅ Complete. See [phase-0/PHASE_0_COMPLETE.md](./phase-0/PHASE_0_COMPLETE.md).
- **Phase 1 (Constants & Stat Formulas)**: ✅ Complete. See [phase-1/PHASE_1_COMPLETE.md](./phase-1/PHASE_1_COMPLETE.md).
- **Phase 2 (Battle Engine)**: 2.1 ✅ (battle state initializer); 2.2 not started.

Code lives under `src/lib/incremental/`, `src/routes/incremental/`, and `src/routes/api/incremental/`.

## Quick Start

1. **Concept & loop**: [CORE_CONCEPT.md](./CORE_CONCEPT.md)  
2. **How heroes behave in battle**: [BATTLE_MECHANICS.md](./BATTLE_MECHANICS.md) + [SPELLS_AND_ABILITIES.md](./SPELLS_AND_ABILITIES.md)  
3. **What to build in code**: [ARCHITECTURE.md](./ARCHITECTURE.md)  
4. **How to implement in chunks**: [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)
