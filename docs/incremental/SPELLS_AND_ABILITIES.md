# Spells and Abilities

How **active** and **passive** abilities work in the incremental battler, with concrete examples (Bristleback, Lina, Dazzle) aligned to Dota 2 and the card-battler themes.

---

## Ability Types

### Active (cast on a timer)

- Has its **own incremental timer** (spell interval). Only the **focused** hero’s spell timer advances; when it reaches the interval, the spell **fires** (damage, heal, debuff, etc.).
- **Scales with**: Spell haste (more casts per minute), spell power / magic damage (stronger effect).
- **Examples**: Lina’s Laguna Blade (big nuke), Lion’s Finger of Death, Dazzle’s Shadow Wave (heal/nuke).

### Passive (no cast timer)

- **Does not** have a timer. It modifies other behavior:
  - **On event**: e.g. “When this hero takes damage, deal X damage back to the attacker” (Bristleback).
  - **Modifier to auto-attack**: e.g. “Auto-attacks apply 1 stack of Burn,” or “Every 3rd attack deals double damage.”
  - **Modifier to another spell**: e.g. “When Laguna Blade hits, also apply 2 Burn.”
- Passive is **always on** for that hero when the condition is met (e.g. when they take damage, when they attack). They do **not** require focus to trigger; only the **trigger condition** (e.g. “this hero is hit”) must occur. So Bristleback’s return damage works when Bristleback is hit, whether or not he is currently focused.
- **Scales with**: Can still scale from spell power or attack damage depending on the passive (e.g. return damage = % of damage taken or flat + spell power).

---

## Spell Slots (Design Choice)

- **First version**: **One spell per hero**—either one active (with one timer) or one passive. Simple for UI and balance.
- **Extensibility**: The design should be **flexible** to support **up to 3 spells per hero** later (e.g. Q/W/E style), each slot active or passive, with corresponding timers for actives.

---

## Hero Examples

Themes are taken from Dota 2 and the card-battler’s HERO_SPECIFICS (see `docs/card-battler/planning/HERO_SPECIFICS.md`). (e.g. Bristleback = Quill Spray / return damage; Lina = Dragon Slave / Laguna; Dazzle = Poison Touch / Shadow Wave / save).

---

### Bristleback (Strength)

- **Primary attribute**: Strength.  
- **Auto-attack**: Moderate interval, moderate damage (tanky brawler).  
- **Spell slot – passive**: **Bristleback / Quill Spray (passive)**  
  - **Effect**: When this hero **takes damage**, deal X damage back to the **attacker** (thorns). X can scale with spell power or a fixed amount + % of damage taken.  
  - **No timer**: Works whenever Bristleback is hit, regardless of focus.  
- **Incremental feel**: Focus Bristleback when you want him to **attack** (his auto-attack timer runs); his passive is always there to punish enemies that hit him. Good to focus him when enemies are attacking your roster so his return damage fires often.

---

### Lina (Intelligence)

- **Primary attribute**: Intelligence.  
- **Auto-attack**: **Slower**, weaker (e.g. 1.0–1.2s interval, low damage)—Intelligence favors spells.  
- **Spell slot – active**: **Laguna Blade**  
  - **Effect**: After a **spell interval** (e.g. 10s base), deal a large amount of **magic damage** to the current target (or single target). Scales with spell power.  
  - **Timer**: Only advances when Lina is **focused**. So the player focuses Lina to “charge” Laguna Blade; when it fires, they may switch to another hero.  
- **Incremental feel**: Focus Lina to build up to the big nuke; then switch to another hero (e.g. Bristleback) while Laguna is on “cooldown.” Optional: a second passive (e.g. Fiery Soul) could add attack speed or spell damage after casting—could be a later slot.

---

### Dazzle (Universal)

- **Primary attribute**: Universal (support/caster theme).  
- **Auto-attack**: Moderate; can lean physical with a debuff (Poison Touch).  
- **Spell slot – active or passive (choose one for v1)**  
  - **Option 1 – Active**: **Shadow Wave** on a timer—heal lowest HP ally and deal damage to nearby enemies. Timer advances only when Dazzle is focused.  
  - **Option 2 – Passive**: **Poison Touch**—auto-attacks apply a DoT (Poison) or slow. No cast timer; modifies auto-attack.  
- For **first version**, pick one: e.g. **Shadow Wave (active)** so Dazzle has a clear “focus to get the heal/nuke off” moment, and keep Poison as an auto-attack modifier or a second slot later.

---

## More Heroes (Brief)

- **Lion**: Active = Finger of Death (big single-target nuke on timer), similar to Lina.  
- **Axe**: Passive = Berserker’s Call–style “when you take damage this turn, deal X back” (like Bristleback).  
- **Phantom Assassin**: Passive = crit on auto-attack; or active = short-cooldown nuke.  
- **Juggernaut**: Active = Blade Fury (AoE on timer) or passive = crit.  

Hero roster and full list can be expanded using the same **active = timer, passive = on-event or modifier** pattern and the [Liquipedia Dota 2 Heroes](https://liquipedia.net/dota2/Portal:Heroes) + card-battler HERO_SPECIFICS for flavor.

---

## Data Shape for an Ability

**Note**: Abilities are **spells and specials only**. Every entity (hero or enemy) has an **intrinsic auto-attack** (attack interval + damage on HeroDef/EnemyDef); the basic attack is not an ability and has no ability id. Abilities add timers (actives) or triggered effects (passives) on top of that.

- **id**: Unique ability id.  
- **type**: `active` | `passive`.  
- **trigger**: For active = “timer (spell interval)”; for passive = “on_damage_taken” | “on_attack” | “on_spell_hit” | etc.  
- **effect**: Reference to effect (damage, heal, debuff, return damage, etc.) and formula (base + spell power, or % of attack damage).  
- **target**: Self, single enemy, all enemies, lowest HP ally, attacker (for reflect), etc.  
- **damageType** (optional): For damaging abilities, one of **physical** (reduced by target armor), **magical** (reduced by target magic resist), or **pure** (bypasses resistances). Omit for heals/utility. Auto-attack is always physical and is not an ability.

This supports both the battle engine (when to fire, what to apply) and the UI (show one timer per active spell for the focused hero).
