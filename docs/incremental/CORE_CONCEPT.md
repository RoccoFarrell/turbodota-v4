# Core Concept – Incremental Lineup Battler

## Vision

A **browser-based incremental game** with two layers: **passive incremental growth** tied to Dota 2, and **active** StS-style runs and PvP.

- **Passive**: Unlock heroes by **playing and winning Dota 2** on that hero; use a **forge-style** system to deepen integration. **Training** lets you passively improve specific stats per hero (e.g. Axe’s health, Faceless Void’s auto-attack, Crystal Maiden’s spell damage). These gains persist and make your lineup stronger in runs and PvP.
- **Active**: Build a **lineup of 1–5** Dota heroes (flexible size; some events may use a single hero) and run them through **Slay the Spire–style** PvE (map, combat, elites, boss, **bases/fountain** for healing) or enter **PvP** (separate from PvE) to test lineups and focus/target management.

Battles are **incremental**: heroes attack and cast spells on **timers**. Only the **focused** (active) hero’s timers advance. **Timers reset** when you switch focus (progress discarded)—so tap accurately: don’t switch off before an attack or spell fires, or you lose progress and risk getting hit. There is a **2s cooldown** on switching focus to encourage tactical rotations. If the player doesn’t tap, heroes **auto-rotate** focus every 10 seconds. Each team has one **shared target** on the enemy; attacking the enemy’s **focus** hero is incentivized, and attacking a non-focus enemy incurs a **stat penalty** (Dota-style backline protection).

The game is **separate from the card-battler** but reuses **themes and hero identity** from the existing card designs and from Dota 2 (e.g. [Liquipedia Dota 2 Heroes](https://liquipedia.net/dota2/Portal:Heroes)).

---

## Game Loop (High Level)

1. **Unlock and train heroes**: Win Dota 2 on a hero to unlock or boost them; use **forge**-style integration. Use **Training** to passively improve that hero’s stats (e.g. health, auto-attack damage, spell damage). These gains persist across runs.
2. **Build lineup**: Choose 1–5 Dota heroes for your roster (flexible; some events require a single hero). Only heroes you’ve unlocked (and optionally trained) can be used.
3. **Start a run** (or enter PvP): Enter the StS-style map for PvE, or queue for **PvP** (separate mode).
4. **Navigate map** (PvE): Choose path (combat / elite / boss / shop / event / rest / **base (fountain)** for healing).
5. **Enter encounter**: Your lineup faces an **enemy pack** (PvE) or **another player’s lineup** (PvP). PvE enemies use the same timer model as heroes (attack/spell intervals); bosses can be as complex as a hero.
6. **Battle**: Incremental battle. Only the **focused** hero’s timers advance; **tap to focus** another hero (that hero’s timers **reset**; **2s cooldown** before switching focus again). Default: **auto-rotate** focus every 10s. Each team has one **shared target** on the enemy; penalty for attacking non-focus enemy. When a timer completes: **auto-attack** resolves first, then **spells** (same tick). Battles can continue in the background for PvE (e.g. auto-rotation); PvP **pauses** if either player leaves.
7. **Resolution**: Reduce enemy (or opponent) HP to zero to win; lose if your roster is defeated.
8. **Post-encounter** (PvE): Restore **small health and mana**; grant **XP** and **gold**. XP is **per-hero** and grows skills that tie into **Training**. **Shops** (on map): spend gold on run boosts (regen, attack/spell damage, bonus XP) and **relics** (e.g. “all spells 25% faster,” “auto attacks add poison”). Then continue on the map or end run. **PvP** is separate; emphasis on testing lineups and active management rather than run rewards.

---

## Slay the Spire–Style Progression

- **Map**: Branching nodes (e.g. multiple paths per floor). Node types include:
  - **Combat**: Standard encounter (e.g. wolf pack, bandits).
  - **Elite**: Harder encounter; better rewards.
  - **Boss**: End-of-act boss; run completion or advancement.
  - **Shop**: Spend gold on **run boosts** (regen, attack/spell damage, bonus XP) and **relics** (lineup-wide effects, e.g. “all spells 25% faster,” “auto attacks add poison”).
  - **Event**: Random event (risk/reward).
  - **Rest**: Heal or upgrade.
  - **Base (fountain)**: Heal throughout the run; multiple bases available on the map.
- **Acts**: Optional multi-act structure (e.g. Act 1 → Act 2 → Act 3) with increasing difficulty and a boss per act.
- **Run lifecycle**: One “run” = full climb through the map until death or final boss kill. Bases provide healing along the way. Meta-progression: hero unlocks and **Training** (passive stat growth) persist across runs.

---

## PvP

- **Separate from PvE**: PvP is its own mode (queue or challenge), not part of the StS map. Your lineup of 1–5 heroes fights **another player’s lineup** (1–5 heroes). Same mechanics: each side has a **focused** hero and one **shared target** on the enemy; penalty for attacking non-focus enemy.
- **Purpose**: Test (a) who has a better **roster and spell synergies** (improved by StS runs and passive Training), and (b) who is better at **active** focus/target management during the battle.
- **Sync**: Both players must have the battle window in focus or the battle **pauses**. No separate PvP rewards are specified; emphasis is on competition and skill.

---

## Thematic Alignment

- **Dota hero identity**: Each hero’s auto-attack and spell(s) should match their Dota 2 and card-battler themes (e.g. Bristleback = tanky, return damage; Lina = nuker with a big ultimate; Dazzle = heal/debuff/save).
- **Attributes**: Strength / Agility / Intelligence (and Universal if we include it) inform **base stats**: e.g. Agility → faster base attack, Intelligence → stronger spells / spell haste, Strength → survivability. Details in [HERO_AND_STATS.md](./HERO_AND_STATS.md).

---

## Summary

| Aspect | Description |
|--------|-------------|
| **Passive layer** | Unlock heroes via Dota 2 wins + forge; Training for passive stat growth per hero. |
| **Core loop** | Build lineup (1–5, flexible) → run map or PvP → encounter → incremental battle (focus + shared target, pause/resume timers) → rewards (PvE: XP, gold, shop, relics) → repeat. |
| **Progression** | StS-like map (combat, elite, boss, shop, event, rest, **bases/fountain**); run = full climb. |
| **PvP** | Separate from PvE; test lineups and active management; battle pauses if either player leaves. |
| **Focus** | Only focused hero’s timers advance; **timers reset** on switch (accurate tapping); **2s cooldown** on focus switch; **10s auto-rotation** default. |
| **Targeting** | One shared target per team on enemy; **penalty** for attacking non-focus enemy (backline protection). |
