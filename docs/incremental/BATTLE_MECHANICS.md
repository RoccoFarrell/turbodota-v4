# Battle Mechanics

How battles run: **timer model**, **focus (tap) mechanic**, **action resolution**, and **win/loss conditions**. This supports both PvE (vs enemy packs) and PvP (vs another player’s lineup).

---

## Battle Setup

- **Player side**: Lineup of 1–5 heroes (roster). Each hero has:
  - Current HP (and max), **base armor**, **base magic resistance** (for damage reduction).
  - Auto-attack timer (interval, time until next attack). Auto-attacks deal **physical** damage.
  - Spell timer(s) if the hero has active spell(s). Spells have a **damage type** (physical, magical, or pure) per ability.
- **Enemy side**: Either:
  - **PvE**: 1–N enemies (e.g. 1 large wolf + 2 small wolves), each with HP and the **same timer model** as heroes (attack interval, optional spell interval); they can have spells, and **bosses** can be as complex as a hero; or
  - **PvP**: 1–5 enemy heroes (same structure as player heroes); the opponent has their own focused hero and shared target, controlled in real time (battle pauses if either player leaves).

When the battle **starts**, the player must have one hero **focused** (default: e.g. first in lineup). Only that hero’s timers advance (see Focus Mechanic).

---

## Focus (Tap) Mechanic

- **Active (focused) hero**: The hero currently “in battle” for the **player**. Only the focused hero’s incremental timers run (auto-attack and active spell).
- **Tap to focus**: When the player taps/clicks a hero in **their** lineup, that hero becomes focused. All other player heroes’ timers **do not advance** while unfocused.
- **On focus change**:
  - **Timers reset when switching focus.** When you switch away from a hero, that hero’s timers **reset to 0** (progress discarded). When you switch back to that hero, their timers start from 0 again. This encourages **accurate tapping**: don’t switch off a hero before their attack or spell fires, or you lose that progress and risk getting hit by the other team.
  - The **newly focused** hero’s timers start from **0** and begin advancing.
- **2s cooldown on switching focus.** The player cannot change focus again for **2 seconds** after switching. This discourages spam-tapping and encourages **tactical rotations** (commit to a hero for at least 2s before switching).
- **Default / fallback**: If the player does not tap anyone, the game **auto-rotates** focus every **10 seconds** (e.g. next hero in lineup order). This allows PvE runs to continue in the background (e.g. when the player leaves the battle screen).

---

## Timer Model

- **Game time**: Battle runs in **real time** (or scaled time). A global battle clock advances (e.g. every 100 ms or every frame).
- **Focused hero only**:
  - **Auto-attack timer**: Increments by delta time. When it reaches `attackInterval`, the hero performs an auto-attack, then the timer is reset to 0 (or set to “overflow” time if we want exact intervals).
  - **Spell timer**: Same idea: when it reaches `spellInterval`, the spell fires, then reset to 0.
- **Unfocused heroes**: Their timers **do not advance** and were **reset to 0** when they were last unfocused. They do not attack or cast while unfocused; when focused again, their timers start from 0.
- **Enemies**: PvE enemies use the **same timer model** as heroes: attack interval, optional spell interval. They can have spells; **bosses** can be as complex as a hero on your team. PvP: the opponent’s side has its own focused hero and timers. See PROGRESSION_AND_ENCOUNTERS.

**Order within a tick**: When both auto-attack and spell are ready on the same tick, resolve **auto-attack first**, then **spells**. This order may be extended as mechanics become more complex (see [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md) for decisions).

---

## Damage Types

- **Physical**: Reduced by target's **armor** (e.g. damage × 100 / (100 + armor)). All **auto-attacks** are physical.
- **Magical**: Reduced by target's **magic resistance** (0–1; e.g. damage × (1 - magicResist)). Many spells are magical.
- **Pure**: Bypasses armor and magic resist; full damage. Some spells are pure.

Every hero and enemy has **base armor** and **base magic resistance**. The engine applies the correct reduction when resolving damage based on the damage type (auto-attack = physical; spells declare their type per ability).

---

## Action Resolution

### Auto-attack

- **Trigger**: Focused hero’s auto-attack timer reaches interval.
- **Effect**: Deal **physical** `attackDamage` (after modifiers) to **current target** (see Targeting). Target's **armor** reduces the damage.
- **Then**: Reset auto-attack timer for that hero.

### Spell (active)

- **Trigger**: Focused hero’s spell timer reaches interval.
- **Effect**: Apply spell effect (damage, heal, debuff, etc.) according to [SPELLS_AND_ABILITIES.md](./SPELLS_AND_ABILITIES.md). Spell power and modifiers apply. Damaging spells have a **damage type** (physical, magical, or pure); target's armor or magic resist reduces physical/magical, pure bypasses.
- **Then**: Reset spell timer for that hero.

### Passive abilities

- **No timer**: Passives (e.g. Bristleback’s return damage) are applied when their condition is met (e.g. “when this hero takes damage, deal X back”). They don’t have a “focus” timer; they are always active for that hero when the event happens (e.g. when Bristleback is hit, whether or not he is focused).  
  Clarification: “always active” can mean “active for any hero in the lineup” or “only when that hero is on the field”; typically “when this hero takes damage” implies that hero must be in the lineup and be the one taking damage.

### Targeting and “active” hero per team

- **Each team** has two concepts:
  - **Active (focused) hero**: The one whose timers advance (see Focus Mechanic). Only the player’s side has player-controlled focus; the enemy side (PvE or PvP) has its own active hero for targeting purposes.
  - **Shared target**: The **whole team** attacks the **same** enemy unit. There is one “current target” on the enemy team (e.g. selected by player, or by rule like “enemy’s focused hero”).
- **Incentive for targeting the enemy’s focus**: Attacking the **enemy’s active (focused)** hero is incentivized. Attacking any **non-focus** enemy incurs a **stat penalty** (e.g. reduced damage or hit chance). This simulates Dota 2 teamfights: your team wants to focus the squishy backline carry or caster, but that hero is protected by frontliners; hitting the backline is high-value but “harder” (penalty when not targeting their focus), while hitting their frontliner (their focus) is the default. Design can tune the penalty to encourage tactical target switching (e.g. burst the backline despite penalty when the payoff is worth it).
- **Spell target**: Spells use the same targeting model where applicable—e.g. single-target spells hit the shared target; AoE hits all enemies or an area per ability definition.

---

## Damage and Death

- **Dealing damage**: Subtract from target’s current HP (after armor/resist if we have them). Apply lifesteal, on-hit effects, etc. per hero/ability design.
- **Death**: When HP ≤ 0, the unit (hero or enemy) is removed from battle (or marked dead). If all enemies are dead → **player wins**. If all player heroes are dead → **player loses**.
- **Order of operations**: When multiple actions occur in one tick, use a strict order: **player auto-attack → player spell → enemy actions** (and passives when conditions fire). Some RNG is acceptable; battles need not be fully deterministic, but the engine must be able to simulate a battle from start to finish (e.g. for background PvE).

---

## Battle UI Requirements (Summary)

- **Lineup display**: Show all 1–5 player heroes; indicate which is **focused** (active) (e.g. highlight, border).
- **Tap to focus**: Tapping a hero sets them as focused; their timers **start from 0**. The previous focused hero’s timers **reset to 0**. **2s cooldown**: the player cannot switch focus again for 2 seconds (show cooldown indicator).
- **Timer feedback**: Show progress for the focused hero’s auto-attack and spell (e.g. fill bars or countdowns) so the player can time switching (e.g. “almost Laguna—don’t switch off Lina or you lose progress”).
- **Target selection**: Show the **shared target** on the enemy side; allow the player to change target (with the understanding that attacking the enemy’s **focus** hero avoids the non-focus penalty).
- **Enemy display**: Show enemy unit(s), their HP, and which is the enemy’s **active** (focus) hero; optional: next action or timer.

---

## PvE vs PvP (Mechanical Difference)

- **PvE**: Enemy side uses a predefined encounter (e.g. wolf pack). Enemies use the **same timer model** as heroes (attack/spell intervals); they can have spells, and bosses can be as complex as a hero. The **player** chooses focus (or relies on 10s auto-rotation). If the player **leaves the battle screen**, the battle **continues** (e.g. server or background tick with auto-rotation)—so a PvE run can complete without the window focused.
- **PvP**: Both sides have lineups; each side has an active (focused) hero and one shared target. **Both players** must have the battle window in focus or the battle **pauses** (no background resolution for PvP).

This document does not implement anything; it defines the behavior the architecture and code must support.
