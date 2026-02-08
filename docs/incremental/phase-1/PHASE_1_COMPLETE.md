# Phase 1 – Complete

Phase 1 (Constants & Stat Formulas) is implemented. No engine code; reference data and formulas only.

---

## Milestone 1.1: Hero, ability, and enemy definitions

**Implemented**:

- **`src/lib/incremental/constants/abilities.ts`**
  - Spells/specials only (auto-attack is **intrinsic** on every entity via HeroDef/EnemyDef attack interval + damage; it is not an ability).
  - Each damaging ability has a **damageType**: physical, magical, or pure. Auto-attack is always physical.
  - Bristleback passive (`bristleback_return`, physical), Lina Laguna Blade (`laguna_blade`, magical), Dazzle Shadow Wave (`shadow_wave`, magical)
  - `getAbilityDef(id)` lookup
- **`src/lib/incremental/constants/heroes.ts`**
  - Bristleback (heroId 99), Lina (25), Dazzle (50) – Dota 2 / OpenDota hero IDs
  - Base attack/spell intervals, damage, **baseArmor**, **baseMagicResist** (0–1), `abilityIds` per Phase 0 types
  - `getHeroDef(heroId)` lookup
- **`src/lib/incremental/constants/encounters.ts`**
  - Enemy defs: `large_wolf` (80 HP, 2s interval, 12 dmg, armor 2, resist 0), `small_wolf` (30 HP, 1.5s, 5 dmg, armor 0, resist 0)
  - Encounter `wolf_pack`: 1 large + 2 small wolves
  - `getEnemyDef(id)`, `getEncounterDef(id)` lookups
- **`src/lib/incremental/constants/index.ts`** – re-exports all getters and arrays

**Tests**: `constants/constants.test.ts` – getHeroDef (Bristleback, Lina, Dazzle, unknown), getAbilityDef, getEncounterDef (wolf_pack roster).

---

## Milestone 1.2: Stat formulas

**Implemented** in `src/lib/incremental/stats/formulas.ts`:

- `attackInterval(baseInterval, attackSpeed, options?)` – base / (1 + AS); optional `minInterval`
- `spellInterval(baseInterval, spellHaste, options?)` – same for spells
- `attackDamage(baseDamage, modifiers?)` – flat base + optional `flat` modifier
- `spellDamage(baseDamage, spellPower)` – base + spell power
- `nonFocusTargetPenalty(damage, isTargetEnemyFocus)` – full damage when target is enemy focus, 0.5× when not
- **Damage types**: `applyPhysicalDamage(damage, targetArmor)`, `applyMagicalDamage(damage, targetMagicResist)`, `applyPureDamage(damage)`, `applyDamageByType(damage, damageType, target)` – physical reduced by armor, magical by magic resist (0–1), pure bypasses

**Tests**: `stats/formulas.test.ts` – unit tests for all five functions and edge cases.

---

## Files touched

| Path | Purpose |
|------|--------|
| `src/lib/incremental/constants/abilities.ts` | Ability definitions + getAbilityDef |
| `src/lib/incremental/constants/heroes.ts` | Hero defs (99, 25, 50) + getHeroDef |
| `src/lib/incremental/constants/encounters.ts` | Enemy defs, wolf_pack + getEnemyDef, getEncounterDef |
| `src/lib/incremental/constants/index.ts` | Re-exports |
| `src/lib/incremental/constants/constants.test.ts` | Constant lookup tests |
| `src/lib/incremental/stats/formulas.ts` | Interval, damage, non-focus penalty |
| `src/lib/incremental/stats/formulas.test.ts` | Formula unit tests |

Removed: `constants/.gitkeep`, `stats/.gitkeep` (replaced by real files).

---

## Next

Proceed to **Phase 2** (Battle Engine – State & Timers): [DEVELOPMENT_ROADMAP.md](../DEVELOPMENT_ROADMAP.md#phase-2-battle-engine--state--timers).
