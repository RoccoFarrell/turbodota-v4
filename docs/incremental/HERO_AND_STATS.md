# Heroes and Stats

This document defines how Dota heroes are represented in the incremental battler: **attributes**, **stats** that improve auto-attack and spells, and how they fit the incremental and auto-battler genres.

---

## Primary Attribute (Dota Alignment)

Heroes use Dota 2’s **primary attribute** (Strength, Agility, Intelligence, Universal) to bias base behavior and scaling:

| Attribute | Incremental role | Auto-attack | Spells |
|-----------|------------------|------------|--------|
| **Strength** | Tanky, sustain, survivability | Slower, higher base damage per hit; may have block/life gain | Fewer or defensive/utility spells |
| **Agility** | Fast, consistent DPS | **Faster attack interval** (e.g. 0.8–1.2s), moderate damage | Often passive modifiers (crit, armor reduction) or short-cooldown actives |
| **Intelligence** | Burst, magic, control | Slower, **weaker** auto-attack | **Strong spell** on a **parallel timer** (e.g. 8–12s); spell haste and magic damage scale well |
| **Universal** | Flexible; can lean physical or magical | Configurable per hero | Mix of active and passive |

This creates a clear **trade-off**: Agility = more attacks per minute; Intelligence = fewer attacks but a powerful spell on a separate timer. Players who “focus” an Intelligence hero are often waiting for the big spell; focusing Agility keeps steady pressure.

---

## Stat Categories

### Auto-Attack Stats

- **Attack speed (AS)**  
  - Lowers the **interval** between auto-attacks (e.g. “1 attack per second” → “1.2 per second” with more AS).  
  - Formula option: `interval = baseInterval / (1 + attackSpeedRating)` or equivalent so stacking AS has diminishing returns.  
  - Agility heroes typically have higher base AS or lower base interval.

- **Attack damage (AD)**  
  - Base damage per hit.  
  - Modified by **incremental Training** (passive per-hero stat growth), run items, and buffs.

- **Attack modifiers**  
  - Optional effects on hit: **armor reduction**, **lifesteal**, **cleave**, **crit multiplier**, **on-hit magic damage**.  
  - Can be hero-specific (e.g. PA crit) or from items.

- **Physical / armor**  
  - **Armor** reduces **physical** damage taken. Each hero and enemy has **base armor**. Formula (e.g. damage × 100 / (100 + armor)) so more armor = less physical damage. Auto-attacks are always physical.

### Spell Stats

- **Spell haste**  
  - Reduces the **cooldown / cast interval** of active spells (e.g. “spell every 10s” → “every 8s” with 25% haste).  
  - Same idea as “cooldown reduction” in incremental games: more casts per minute.

- **Magic damage / spell power**  
  - Multiplier or flat bonus to spell damage (and optionally healing).  
  - Intelligence heroes scale well with this.

- **Spell modifiers**  
  - Duration, radius, extra effects (slow, burn, stun). Can be hero-specific or from items.

### Defensive / Utility

- **Health**, **armor**, **magic resistance**  
  - Every hero and enemy has **base armor** and **base magic resistance** (0–1, e.g. 0.25 = 25%).  
  - **Physical** damage is reduced by armor. **Magical** damage is reduced by magic resist (e.g. damage × (1 - magicResist)). **Pure** damage bypasses both.  
  - Auto-attacks are always physical. Spells declare a **damage type** (physical, magical, or pure) per ability. Strength and tanks typically have higher base armor.

- **Healing received**, **debuff duration**  
  - For support heroes (e.g. Dazzle).

---

## Base Values Per Attribute (Guideline)

Example tuning so attributes feel distinct:

- **Agility**: Base attack interval e.g. 1.0s; base spell interval long or spell is passive (no cast timer).
- **Intelligence**: Base attack interval e.g. 1.4s; base spell interval e.g. 10s; spell hits hard.
- **Strength**: Base attack interval e.g. 1.2s; higher HP/block; spell interval moderate, often defensive.

Exact numbers are for balance pass; the important part is **Agility = attack tempo**, **Intelligence = spell tempo**, **Strength = tank/sustain**.

---

## How Stats Are Used in Battle

- **Auto-attack**: Every `attackInterval` seconds (derived from base + attack speed), the hero deals `attackDamage` (and modifiers) to the current target.
- **Spell**: If the hero has an **active** spell, every `spellInterval` seconds (derived from base + spell haste), the spell fires (damage/heal/effect from spell power and hero design). **Passive** spells don’t have a cast timer; they modify auto-attack or other spells (see [SPELLS_AND_ABILITIES.md](./SPELLS_AND_ABILITIES.md)).

Stats come from:

- **Hero base**: From primary attribute and hero definition.
- **Incremental Training**: Passive, per-hero stat growth (e.g. train Faceless Void’s auto-attack damage, Crystal Maiden’s spell damage). These gains persist across runs and PvP.
- **Run**: Items, buffs, shop boosts (regen, AD, spell damage, bonus XP), and relics (lineup-wide effects) picked up during the run.

---

## Hero Definition (Data Shape)

Each playable hero is defined at least by:

- **Hero id** (align with Dota 2 / card-battler hero list).
- **Primary attribute**: STR / AGI / INT / UNIVERSAL.
- **Base attack interval** (seconds).
- **Base attack damage** (or min/max). Auto-attack is always **physical**.
- **Base armor**: Reduces physical damage taken.
- **Base magic resistance**: 0–1 (e.g. 0.25 = 25%); reduces magical damage taken.
- **Base spell interval** (seconds), if the hero has an active spell; else N/A or “passive”.
- **Spell/ability definition**: Reference to ability id(s). Each damaging ability has a **damage type** (physical, magical, or pure). Start with **one spell per hero**; design is flexible to support **up to 3** spells per hero later. See SPELLS_AND_ABILITIES for active vs passive.

From these we can derive **effective** interval and damage using current stats (AS, AD, spell haste, spell power) in the battle engine; damage is then reduced by the target's armor or magic resist (or bypassed for pure).

---

## Incremental / Auto-Battler Best Practices Applied

- **Parallel timers**: Auto-attack and spell run **independently** so the player (or AI) can optimize “when” to focus which hero (e.g. spell about to fire vs auto-attack spam).
- **Clear scaling**: Attack speed and spell haste give a **visible** “more actions per minute” feel; damage and spell power give “bigger numbers.” Both are satisfying in incrementals.
- **Diminishing returns**: Formulas for AS and haste should avoid infinite scaling (e.g. cap or soft cap) so one stat doesn’t dominate.
- **Identity**: Each hero’s base intervals and spell design should make them **feel** different (fast hitter vs big nuke vs tank with passive).

This stat framework supports the **focus mechanic**: when you focus a hero, their timers advance; when you switch away, their timers **reset to 0** (progress discarded)—so tap accurately to avoid switching off before an attack or spell fires. A **2s cooldown** on focus switch encourages tactical rotations. Active management (who to focus, when to switch, and which enemy to target) plus Training and run rewards drive progression.
