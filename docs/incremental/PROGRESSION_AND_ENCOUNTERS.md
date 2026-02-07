# Progression and Encounters

**Slay the Spire–style map**, **PvE encounters** (e.g. wolf pack), and **PvP** structure. No code—design only.

---

## Map Structure (StS-Style)

- **Nodes**: Each node is one of: Combat, Elite, Boss, Shop, Event, Rest, **Base (fountain)**. **Bases** allow the player to heal throughout the run; multiple bases can appear on the map.
- **Paths**: From each node, the player chooses one of several next nodes (branching). Typical: 2–3 choices per node.
- **Floors / acts**: Nodes are arranged in rows (floors). One or more **boss** nodes at the end of an act; beating the boss completes the act (or the run if it’s the final act).
- **Visibility**: Next nodes are visible so the player can plan (e.g. “go to rest then elite”).
- **Run**: A run is a **full climb** through the map until death or final boss kill; bases provide healing along the way.

**Minimal v1**: Linear or simple branch (e.g. 3–5 combats → 1 elite → boss). Expand to full StS-style branching once core battle works.

---

## PvE Encounters

### Encounter definition

- **Encounter id**: Unique key.
- **Enemy roster**: List of **enemy units** (e.g. “1 Large Wolf, 2 Small Wolves”). Each unit uses the **same timer model** as player heroes:
  - HP, optional armor/resist.
  - **Attack interval** (e.g. attack every 2s for 8 damage).
  - **Optional spell**: Same idea as hero spells—interval-based or passive. **Bosses** can be as complex as a hero (multiple abilities, timers).
  - Enemies have their own “active” (focus) hero for **targeting** purposes (so the player’s “attack enemy focus” incentive applies: penalty when attacking non-focus).

### Example: Wolf Pack

- **Large Wolf**: High HP, attacks every ~2s for moderate damage.  
- **Small Wolf 1 & 2**: Lower HP, attack every ~1.5s for less damage.  

When the battle starts, the player’s lineup (e.g. Bristleback, Lina, Dazzle) faces these three. Player focuses one hero (timers **reset** on switch; **2s cooldown** on focus switch; 10s auto-rotation if no tap). Each team has one **shared target** on the enemy; attacking the enemy’s **focus** hero avoids a stat penalty. When all wolves are dead, the encounter is won.

### Encounter pools

- **Combat**: Pull from a pool of “normal” encounters (e.g. wolf pack, bandits, goblins) by floor or act.
- **Elite**: Harder pool (e.g. “Dire Wolf Pack” with more HP/damage, or a mini-boss style unit).
- **Boss**: Single predefined boss per act (e.g. big HP, multiple phases or abilities).

Difficulty can scale by **floor number** or **act** (e.g. +% HP/damage per floor).

---

## PvP

- **Separate from PvE**: PvP is **not** part of the StS map. It is its own mode (queue or challenge) to test 5v5 lineups.
- **Lineup vs lineup**: Player A’s 1–5 heroes vs Player B’s 1–5 heroes. Same battle rules: each side has a **focused** hero (timers advance only for that hero; pause/resume on switch) and one **shared target** on the enemy; penalty for attacking non-focus enemy.
- **Purpose**: (a) Who has a better **roster and spell synergies** (improved by StS runs and passive Training), and (b) who is better at **active** focus/target management.
- **Sync**: **Both players** must have the battle window in focus or the battle **pauses**. No background resolution for PvP.
- **Rewards**: No specific PvP rewards are defined; emphasis is on competition and skill testing.

---

## Post-Encounter (Rewards and Map Progress)

- **On victory**:  
  - Advance map state: mark node complete, allow player to choose next node.  
  - Restore a **small amount of health and mana**.  
  - Grant **XP** and **gold**. XP is **per-hero** and grows skills that tie into the **incremental Training** system (passive stat growth).  
  - **Shops** (when the player reaches a shop node): Spend gold on **run boosts** (bonus XP, regen, attack damage, spell damage, etc.) and **relics** that add lineup-wide effects (e.g. “all spells cast 25% faster,” “all auto attacks add a stack of poison”).
- **On defeat**:  
  - Run ends. No node progress; possible partial rewards (e.g. “reach floor 3”) depending on design.

---

## Lineup Size

- **Flexible (1–5)**. Encounters can vary in size. Some **game events** may require the player to select **a single hero** for a special encounter.

---

## Summary

| Topic | Content |
|-------|---------|
| **Map** | StS-style nodes (Combat, Elite, Boss, Shop, Event, Rest, **Base/fountain**), branching paths, acts/floors; run = full climb; bases heal. |
| **PvE** | Encounter = list of enemy units with **same timer model** as heroes (attack/spell intervals); bosses as complex as a hero. |
| **PvP** | Separate from PvE; lineup vs lineup; both players must have window in focus or battle pauses; test roster + active management. |
| **Rewards** | Post-fight: small health/mana restore, **XP** (per-hero, ties to Training), **gold**; shops: run boosts and **relics**. |
| **Lineup size** | 1–5 flexible; some events use a single hero. |
