# Hero Training – Design & Development Plan

**Status**: Design (to be incorporated into Phase 13).  
**Related**: [ESSENCE_AND_BROWSER_ACTIONS.md](./ESSENCE_AND_BROWSER_ACTIONS.md), [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [TRAINING_UI_AND_TALENT_TREE.md](./TRAINING_UI_AND_TALENT_TREE.md) (flow, training UI brainstorm, talent tree plan).

---

## 1. How Heroes Are Created and What Base Stats They Have

### 1.1 Hero source and “creation”

- **Roster** = the set of heroes a player has **unlocked** for lineups and training. Heroes are not “created” from scratch; they are **unlocked** and then **trained**.
- **Unlock path (current)**: Spend **Essence** to **convert one win** from the player’s last 10 Dota 2 games → that match’s **hero** (by `Hero.id`, e.g. Lina = 25, Bristleback = 99) is added to the roster. One conversion per match; only wins eligible.
- **Identity**: Each hero is keyed by **`Hero.id`** (integer from the existing Prisma `Hero` table / Dota 2 hero ID). Name and identity come from that table; **incremental game stats** come from **reference data** in `src/lib/incremental/constants/heroes.ts` (`HeroDef` per `heroId`).

So: **Hero “creation” = add a Dota 2 hero (by id) to the roster via convert-win.** After that, the player can use that hero in lineups and train their stats.

### 1.2 Base stats (HeroDef)

Each roster hero is backed by a **HeroDef** (reference data keyed by `Hero.id`). Base stats used in battle:

| Stat | Type | Role in battle |
|------|------|----------------|
| **primaryAttribute** | STR / AGI / INT / UNIVERSAL | Flavor / future scaling; not yet used in formulas. |
| **baseAttackInterval** | seconds | Time between auto-attacks; reduced by **attack speed**. |
| **baseAttackDamage** | number | Base physical auto-attack damage; increased by **flat attack bonus**. |
| **baseMaxHp** | number | Max (and starting) HP in battle; increased by **trained HP**. |
| **baseArmor** | number | Reduces incoming **physical** damage (formula: damage × 100/(100+armor)). |
| **baseMagicResist** | 0–1 | Reduces **magical** damage (e.g. 0.25 = 25%). |
| **baseSpellInterval** | seconds or null | Time between spell casts; reduced by **spell haste**. |
| **abilityIds** | string[] | Which abilities the hero has (active/passive); damage type and base damage from AbilityDef. |

Battle formulas (see `stats/formulas.ts`) use:

- **attackInterval(base, attackSpeed)** → effective time between attacks.
- **attackDamage(baseDamage, { flat })** → effective attack damage.
- **spellDamage(baseDamage, spellPower)** → effective spell damage.
- **spellInterval(base, spellHaste)** → effective time between spells.
- **applyPhysicalDamage(damage, armor)** / **applyMagicalDamage(damage, magicResist)** for defense.

So **trainable dimensions** are the **modifiers** that these formulas accept: HP (max), attack flat, spell power, attack speed, spell haste, armor, magic resist. That gives **seven** stats to train for build expression.

---

## 2. Incorporating Hero Training into the Idle Game

### 2.1 Same action system as mining

- **One active action per save** at a time: either **Mining** (earn Essence) or **Training** (progress one hero’s one stat). Switching action **pauses** the current one (progress saved; resume when switching back) or resets it (TBD; recommend pause/resume for better UX).
- **Training action** is parameterized by `(heroId, statKey)`. Same progress bar and tick loop:
  - **Duration**: e.g. base N seconds per “training tick” (tunable; can differ per stat or be global).
  - **Reward**: on completion, grant **+1** (or +X) to that hero’s **trained value** for that stat (persisted per save).

So the idle loop stays: **one bar, one active action, server-authoritative tick**. Only the **reward** changes: Essence for mining, stat progress for training.

### 2.2 Persistence

- **Table**: e.g. `IncrementalHeroTraining` (or `IncrementalHeroStat`): `saveId`, `heroId`, `statKey`, `value` (integer or float). Optional: `updatedAt` for “last trained.”
- **Uniqueness**: one row per `(saveId, heroId, statKey)`. “Train Lina – Spell Power” increments the `value` for that row.
- **Eligibility**: Training is only allowed for heroes on the player’s **roster** for that save (roster is already per-save via `IncrementalRosterHero`).

### 2.3 API and action engine

- **Action engine** (existing `advanceAction`): extend to support action type `training` with `(heroId, statKey)`. Completions = number of training ticks; **reward** = apply N × (progress per tick) to `IncrementalHeroTraining` for that (saveId, heroId, statKey).
- **Tick endpoint**: same `POST /api/incremental/action` (or equivalent). Body includes `actionType`, and when `actionType === 'training'`, `heroId` and `statKey`. Server advances progress, on completion increments training row, returns new progress and (e.g.) updated training snapshot.
- **Read APIs**:  
  - `GET /api/incremental/roster` (existing) – roster hero ids.  
  - `GET /api/incremental/training` or `GET /api/incremental/heroes/[heroId]/training` – return per-hero, per-stat trained values for the current save (for UI and for battle resolution).

### 2.4 Battle integration

- When building **battle state** (e.g. `createBattleState` or the run service):
  - For each lineup hero: resolve **HeroDef(heroId)** and **trained stats(saveId, heroId)**.
  - **Effective stats** = base from HeroDef + trained bonuses (see table below).
- Resolution and formulas already accept “modifiers”; we pass the **effective** base or the modifiers (flat attack, spell power, etc.) so no change to formula signatures is required—only the **source** of the numbers (base + training).

So: **each stat of each hero is trainable**; the same idle action system drives both mining and training; battle uses base + trained values.

---

## 3. Trainable Stats and Dota 2 Themed Buildings

Each trainable stat gets a **building** (training ground) so the UI can show “where” you train and add flavor. One building per stat; player selects hero + building (stat) to start training.

| statKey | Effect in battle | Formula hook | Dota 2 themed building name (short) |
|--------|-------------------|--------------|-------------------------------------|
| **hp** | More max HP | baseMaxHp + trainedHp → maxHp/currentHp | **Barracks** / **Citadel** – “Barracks” |
| **attack_damage** | Higher auto-attack damage | attackDamage(base, { flat: trained }) | **Weapon Smithy** / **Armory** – “Weapon Smithy” |
| **spell_power** | Higher spell damage | spellDamage(base, spellPower) with spellPower = trained | **Sanctum** / **Arcane Tower** – “Arcane Sanctum” |
| **attack_speed** | Faster attacks | attackInterval(base, attackSpeed) with attackSpeed = trained (e.g. 0.1 per level) | **Swift Forge** / **Yasha Pavilion** – “Swift Forge” |
| **spell_haste** | Faster spells | spellInterval(base, spellHaste) with spellHaste = trained | **Cooldown Grotto** / **Arcane Grove** – “Cooldown Grotto” |
| **armor** | Less physical damage taken | applyPhysicalDamage(damage, baseArmor + trainedArmor) | **Blacksmith** / **Armor Forge** – “Blacksmith” |
| **magic_resist** | Less magical damage taken | applyMagicalDamage(damage, baseMagicResist + trained), cap e.g. 0.75 | **Cloak Pavilion** / **Shrine of Resistance** – “Cloak Pavilion” |

So you get **seven** training buildings. One user might focus **Arcane Sanctum** (spell power) and **Cooldown Grotto** (spell haste) for a caster build; another might focus **Barracks** (HP) and **Blacksmith** (armor) for a tank. Build expression comes from which heroes you train and which stats you prioritize.

### 3.1 UI concept (training screen)

- **Training grounds** (or “Town”): one card/section per **building** (stat). Each shows:
  - Building name and short description (e.g. “Arcane Sanctum – increases spell damage”).
  - **Current trainer**: “Training: Lina +2” or “Idle” (no active training).
  - **Select hero + start**: dropdown or grid of **roster heroes**; “Train here” starts action (heroId, this statKey). Same progress bar as mining (one active action).
- **Per-hero view** (optional): “Lina’s stats” – list all seven stats with current trained value and which building trains it; quick “Train this” per stat.
- **Active action bar**: Same as mining—one bar, label “Training Lina – Spell Power” or “Mining”. Switch between Mining and Training (and between Training targets) from this bar or from the training grounds.

This fits the existing “one active action” rule and gives clear expression: pick a hero, pick a building (stat), train there; repeat for different heroes/stats over time.

---

## 4. Summary Table

| Topic | Design |
|-------|--------|
| **Hero creation** | Unlock = add Hero.id to roster via convert-win (Essence). No “creation” from scratch. |
| **Base stats** | From HeroDef (heroes.ts): attack interval/damage, max HP, armor, magic resist, spell interval, abilities. |
| **Trainable stats** | 7: hp, attack_damage, spell_power, attack_speed, spell_haste, armor, magic_resist. |
| **Idle integration** | One active action: Mining OR Training(heroId, statKey). Same bar, same tick, reward = Essence or +training value. |
| **Persistence** | IncrementalHeroTraining(saveId, heroId, statKey, value). One row per (save, hero, stat). |
| **Battle** | Effective stats = HeroDef base + trained values; formulas unchanged. |
| **Build expression** | User chooses which hero and which stat(s) to train; seven Dota 2 themed buildings, one per stat. |

---

## 5. Suggested implementation order (for roadmap)

1. **Data**: Add `IncrementalHeroTraining` (saveId, heroId, statKey, value). API: GET training for save (and optionally per hero).
2. **Action engine**: Extend action type to `training` with (heroId, statKey); on completion, increment training row; tick endpoint accepts and applies training.
3. **Battle**: When building battle state, load training for lineup heroes; compute effective stats (base + trained); pass to existing formulas.
4. **Training UI**: “Training grounds” – seven buildings (stats); select hero + building, start training; show same progress bar as mining; show current trainer per building and per-hero stats.
5. **Polish**: Building descriptions, icons, optional “per-hero summary” view.

This can be folded into **Phase 13** of the development roadmap as a dedicated “Hero Training” sub-phase (data, engine, battle, then UI).
