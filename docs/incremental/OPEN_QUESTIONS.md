# Open Questions & Decisions – Incremental Lineup Battler

Resolved design questions are recorded as **Decisions** below. New ambiguities can be added under **Open Questions** at the end.

---

## Decisions Summary

### Overall: Passive incremental + Dota 2 integration

The game has a **passive incremental** layer alongside active play: players **unlock heroes** by playing and winning Dota 2 on that hero; they can **queue Training** (e.g. Axe’s health) to passively improve hero stats; then they **add heroes to their lineup** to do either **StS-style PvE runs** or **PvP** battles. Hero acquisition and progression are deeply tied to actually playing Dota 2 (wins, forge-style integration).

### Focus / tap mechanic

- **Timers reset when switching focus.** When you switch away from a hero, that hero’s timers **reset to 0**. When you switch back to them, their timers start from 0 again. This encourages **accurate tapping**: don’t switch off a hero before their attack or spell fires, or you lose that progress and risk getting hit by the other team.
- **2s cooldown on switching active focus.** The player cannot change focus again for 2 seconds after switching. This discourages spam-tapping and encourages **tactical rotations** (commit to a hero for at least 2s).
- **Default behavior**: If the player does nothing, heroes **cycle focus every 10 seconds** (auto-rotation) as a fallback.

### Targeting and “active” hero per team

- **Each team** has:
  - An **active (focused)** hero: the one whose timers advance.
  - One **shared target** on the **enemy** team: the whole team attacks the same target.
- **Incentive**: There is a **stat penalty** when attacking an enemy hero that is **not** the other team’s focused (active) hero. This simulates Dota 2 teamfights: you want to hit the squishy backline carry, but they are protected by frontliners; focusing the backline is rewarding but harder (penalty when not targeting their “focus” hero).

### Battle resolution

- **Enemy timers (PvE)**: PvE enemies use the **same timer model** as heroes: attack interval, optional spell interval. They can have spells; **bosses** can be as complex as a hero on your team.
- **Simultaneous actions**: On the same tick, resolve in order: **auto-attack first**, then **spells**. Keep this order in mind for future mechanic expansion.

### Progression and rewards

- **Between encounters**: Restore a **small amount of health and mana**; grant **XP** and **gold**.
- **XP**: Used **per-hero** to grow specific skills of that hero, tying into the **incremental Training** part of the game.
- **Shops**: Spend **gold** on run-only boosts (bonus XP, regen, attack damage, spell damage, etc.) and **relics** that add lineup-wide effects (e.g. “all spells cast 25% faster,” “all auto attacks add a stack of poison”).

### Run structure

- A **run** is a full climb through the map (StS-style). There are **bases** (fountain) where the player can heal throughout the run.

### PvP

- **Separate from PvE.** PvP is for testing 5v5 lineups: (a) who has a better roster and spell synergies (improved by StS runs and passive incremental Training), and (b) who is better at **active** focus/target management during the battle. No separate PvP rewards specified; emphasis is on competition and skill testing.

### Lineup size

- **Flexible (1–5)**. Encounters can vary in size; some **game events** may require selecting a **single hero** for a special encounter.

### Hero acquisition

- **Deep connection to Dota 2**: Players receive a **large boost** for heroes they **win on** in Dota 2. The **forge concept** (from card-battler) is borrowed to strengthen integration with real Dota 2 wins/losses.

### Stats and scaling

- **Both** base stats and incremental sources:
  - **Base**: Hero base + attribute (Str/Agi/Int).
  - **Incremental Training**: Passive mechanic to train specific stats per hero (e.g. Faceless Void’s auto-attack damage, Crystal Maiden’s spell damage). These improvements persist outside runs.

### Spell slots

- **Start with one spell per hero**; design should be **flexible** to support **up to 3** spells per hero later.

### Technical

- **Determinism**: Some **RNG is acceptable**; battles do not need to be fully deterministic. We must be able to **simulate a battle from start to finish** (e.g. for background PvE completion).
- **Offline / background**:
  - **PvE**: If the player leaves the battle screen, the **battle continues** (e.g. server or background tick). The team can complete a PvE run using **auto-rotation** of focus (e.g. every 10s).
  - **PvP**: **Both** players must have the window in focus or the battle **pauses**.

---

## Resolved Q&A (Reference)

*(Original questions and answers kept for traceability.)*

1. **Timer reset on focus switch?** → **Timers reset** when switching focus (progress discarded). Encourages accurate tapping (don’t switch off before attack/spell fires). **2s cooldown** on switching focus to encourage tactical rotations. Auto-rotate focus every 10s by default.
2. **Can player focus an enemy?** → No; each team has an “active” hero (focus) and one shared **target** on the enemy team. Penalty for attacking non-focus enemy.
3. **Targeting?** → Each team has active hero + one shared target on enemy team; penalty when attacking non-focus enemy.
4. **Enemy timers?** → PvE enemies use same timer model; can have spells; bosses can be as complex as a hero.
5. **Simultaneous actions?** → Auto-attack first, then spells (same tick).
6. **Between encounters?** → Small health/mana restore; XP and gold; XP per-hero for skills (Training); shops for run boosts and relics.
7. **Run vs permanent?** → Run = full climb; bases/fountain heal throughout run.
8. **PvP rewards?** → PvP separate from PvE; test lineups and active management; no specific rewards defined.
9. **Lineup size?** → Flexible 1–5; events can require single-hero encounter.
10. **Hero acquisition?** → Dota 2 wins give large boost; forge concept for integration.
11. **Stat sources?** → Base stats + full incremental Training per hero (passive).
12. **Spell slots?** → One per hero at start; flexible for up to 3.
13. **Determinism?** → Some RNG OK; must be able to simulate battle start to finish.
14. **Offline/background?** → PvE continues (auto-rotation); PvP pauses if either player leaves.

---

## Open Questions

*(None at this time. Add new items here as they arise.)*

*Update this file as new questions are answered or new ones arise.*
