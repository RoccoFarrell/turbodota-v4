# Incremental Leveling System (Melvor-like Progression)

**Status**: Design; implementation in [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) Phase 13 (milestones 13.6–13.12).  
**Related**: [BANK_SYSTEM.md](./BANK_SYSTEM.md) (Essence, Gold, Wood and other currencies live in the Bank), [HERO_TRAINING.md](./HERO_TRAINING.md), [TRAINING_UI_AND_TALENT_TREE.md](./TRAINING_UI_AND_TALENT_TREE.md), [ESSENCE_AND_BROWSER_ACTIONS.md](./ESSENCE_AND_BROWSER_ACTIONS.md).

---

## 1. Goal

Extend the incremental game into a **Melvor Idle–style** system with:

- **Levels and XP** for hero stats (progressively bigger numbers; level derived from training XP).
- **Essence scaling** (mining level or upgrades: more essence per strike).
- **Building upgrades** (per-stat training buildings level up; faster training and optionally “train 2 heroes”).
- **Skill tree** with **interlocking mechanics**: talents that actually apply (rate modifiers, double XP, essence bonus, parallel training), and clear extension points for new node types.
- **Single formula layer** so all effective values (duration, stat in battle, essence per strike) come from one place; easy to rebalance and add content.

---

## 2. Pillars

| Pillar | Meaning |
|--------|--------|
| Levels + XP | Where useful, introduce level (and optional XP) so progress is staged and numbers scale (e.g. stat gain per level). |
| Single formula layer | One set of modules (e.g. `leveling-formulas.ts`) for XP→level, stat from level, effective duration, reward amount. |
| Modifiers stack predictably | Duration = base / (1 + sum of rate modifiers). Reward = base × product of reward multipliers. |
| Data-driven | New stats, buildings, talent nodes = new rows in constants/DB, not new code paths. |
| Interlocking | Essence → building upgrades and talent points; buildings/talents → faster training and more slots; hero strength → runs. |

---

## 3. Main systems (summary)

- **Hero stats**: Training `value` = total XP; level = `levelFromTotalXp(xp)`. Effective stat in battle = base + `statGainForLevel(statKey, level)`. One formula module for curves.
- **Essence**: Mining level (or upgrade table) on save; cost to upgrade = Essence (from **Bank**). `essencePerStrike = base * miningMultiplier(level)`. Bank holds all currencies (see [BANK_SYSTEM.md](./BANK_SYSTEM.md)).
- **Building upgrades**: Per-stat building level (table or JSON); cost in Essence or Gold (Bank); effect = training duration for that stat reduced, stacking with talents.
- **Talents**: Implement `getRateModifier(saveId, actionType, statKey)` using purchased nodes; action tick uses it so mining/training speed respects tree. New node types: double XP, essence per strike, parallel training (train 2 heroes same stat).
- **Multi-hero**: One bar, two heroes, same stat (when talent unlocked); one completion grants XP to both heroes.

---

## 4. Where it lives in the roadmap

Phase 13 in [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) is **Hero Training & Incremental Leveling**. Milestones:

- 13.1–13.5: Training data, action engine, battle integration, training UI, polish.
- **13.6**: Leveling formula layer (XP, level, progressive stats).
- **13.7**: Wire talents into action tick (rate modifiers).
- **13.8**: Mining level / Essence scaling.
- **13.9**: Building upgrades (per-stat efficiency).
- **13.10**: Skill tree expansion (new node types and reward multipliers).
- **13.11**: Multi-hero training (one bar, two heroes same stat).
- **13.12**: Leveling system UI (mining/building upgrade buttons, talent tree, level display).

Implement in that order so formulas and talent application underpin upgrades and UI.
