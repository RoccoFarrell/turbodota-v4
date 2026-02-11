# Training UI & Talent Tree – Brainstorm

**Status**: Brainstorm / planning.  
**Related**: [HERO_TRAINING.md](./HERO_TRAINING.md), [ESSENCE_AND_BROWSER_ACTIONS.md](./ESSENCE_AND_BROWSER_ACTIONS.md), [BANK_SYSTEM.md](./BANK_SYSTEM.md), [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md).

---

## 1. Player flow (training in context)

1. **Mine Essence** – Player uses the idle mining bar on the Incremental page. Bar fills; each completion grants Essence. (Already implemented.)
2. **Unlock first hero** – Player spends Essence to **convert a win** from their last 10 Dota 2 games. That hero is added to their **roster**. (Already implemented.)
3. **Hero is now available for training** – Roster heroes can be used in lineups **and** sent to **idle training** to improve their base stats. No separate “creation” step; unlock = available for both.
4. **Send hero to idle training** – Player chooses **one** roster hero and **one** training ground (stat). The same idle system runs: one progress bar, same tick loop. When the bar completes, that hero gains +1 (or +X) to that stat. Player can switch to Mining or to a different (hero, stat) at any time; current action pauses and resumes later.

So: **Mine → Unlock hero → Hero appears in roster and in training UI → Assign hero to a training ground (stat) → Idle bar fills → Stat improves.** Training is “send a hero to a building”; only one hero trains at a time (one active action).

---

## 2. Training UI brainstorm

### 2.1 Core idea: “Send a hero to a building”

- **Training grounds** = seven buildings (one per stat): Barracks (HP), Weapon Smithy (attack damage), Arcane Sanctum (spell power), Swift Forge (attack speed), Cooldown Grotto (spell haste), Blacksmith (armor), Cloak Pavilion (magic resist). See HERO_TRAINING.md §3.
- **Flow**: Player opens “Training” (tab/section on Incremental page or dedicated `/incremental/training`). They see the seven buildings. For each building they see:
  - Name and short description (“Arcane Sanctum – increases spell damage”).
  - **Current trainer**: “Lina +12” or “Idle”.
  - **Assign**: “Send hero here” → pick one roster hero from a list/grid → confirm. That becomes the active action: Training(Lina, spell_power). The **shared** idle bar (same as mining) now shows “Training Lina – Spell Power” and fills; on complete, Lina’s spell_power value goes up.
- **One active action**: Only one thing can be “running” at a time: either Mining or Training(heroId, statKey). So only one hero trains at a time; switching to another hero/stat or back to Mining pauses the current one (progress saved).

### 2.2 Where training lives in the app

- **Option A**: Section on the main Incremental page (`/incremental`) – e.g. “Training” collapsible or tab next to Mining and Convert-win. Same page, one bar: either “Mining” or “Training Hero X – Stat Y”.
- **Option B**: Dedicated page `/incremental/training` – full “Training grounds” view with all seven buildings, hero picker, and the same shared bar at top. Navigation: Incremental → Lineups | **Training** (or “Town”).
- **Option C**: “Town” or “Camp” as a hub – Mining, Convert-win, and Training grounds are all in one scrollable view (e.g. `/incremental` with sections: **Bank** (currencies + item inventory), Mining, Convert-win, **Training grounds**). One bar for current action.

Recommendation: Start with **Option A or C** (training on the same page as mining) so the single progress bar is obviously shared; add a clear “Training” section with the seven buildings and “Send hero here” per building. Later, a dedicated Training page (Option B) can mirror the same flow if the main page gets crowded.

### 2.3 “Send hero” UX

- **Per building**: Each building card has a “Train here” or “Assign hero” control. Click → roster hero list (avatars + names). Select one hero → active action becomes Training(heroId, this statKey). Bar updates to “Training [Hero] – [Stat]”.
- **From bar**: The shared bar could have a dropdown or “Change” link: “Training Lina – Spell Power [Change]” → opens a small modal or inline picker: choose different hero or different building (stat), or switch to Mining.
- **Per-hero view** (optional): “My heroes” list; click Lina → see her seven stat values and “Train [Stat]” per stat (links to the building). Assigning from here sets active action to Training(Lina, chosenStat).

### 2.4 What the player sees

- **Buildings**: Seven cards. Each shows: icon/art placeholder, name, one-line description, current trainer (e.g. “Lina +12” or “Idle”), and “Send hero here” (or “Assign”). If a building is **locked** (talent tree – see below), show “Locked – unlock in Talent tree” and grey out.
- **Shared bar**: One bar at top of Incremental (or Training section). Label: “Mining” or “Training [Hero name] – [Stat name]”. Same fill behavior as current mining bar (smooth fill over interval). “Next completion in X.Xs” and “+1 [Stat]” or “+1 Essence”.
- **Roster in training**: Only roster heroes can be assigned. Show roster size or “Unlock more heroes with Essence (Convert win)” if roster is small.

---

## 3. Talent tree – high-level plan

A **talent tree** gives long-term progression: nodes unlock training grounds and add **modifiers** to training (e.g. “15% faster spell damage training”). This section is a **planning** scaffold; exact structure and balance come later.

### 3.1 Purpose

- **Unlock training grounds**: Some buildings (e.g. Swift Forge, Cooldown Grotto) start **locked**. The player spends **talent points** on a node like “Unlock Swift Forge” to make that building available. So the first few heroes might only train HP and attack damage (Barracks, Weapon Smithy); later they unlock attack speed and spell haste.
- **Boosts / modifiers**: Nodes like “Spell damage training +15% speed” reduce the effective duration for that stat’s training (same reward per completion, less time per completion). Other examples: “HP training +10%”, “All training +5%”, “Mining +10%”.
- **Expression and pacing**: Players choose which branch to invest in first (e.g. caster path vs tank path). The tree gates and amplifies the existing training loop.

### 3.2 Structure (to be detailed later)

- **Nodes**: A set of talent nodes. Each node has:
  - **Id** (e.g. `unlock_swift_forge`, `spell_power_training_15`).
  - **Type**: `unlock_building` | `training_speed` | `mining_speed` | `other`.
  - **Payload**: e.g. `statKey` or `buildingId` for which stat/building; `percent` for modifier.
  - **Prerequisites**: parent node(s) that must be taken first.
- **Tree shape**: Branches that unlock buildings and add modifiers. Example (illustrative):
  - **Left branch**: Barracks (HP) + Weapon Smithy (attack damage) available by default. → Unlock Blacksmith (armor) → Unlock Cloak Pavilion (magic resist). Nodes along the way: “HP training +10%”, “Armor training +15%”.
  - **Right branch**: Unlock Arcane Sanctum (spell power) → Unlock Cooldown Grotto (spell haste) → Unlock Swift Forge (attack speed). Nodes: “Spell power training +15%”, “Spell haste training +10%”.
  - **Root or shared**: “Mining +10%”, “All training +5%”.
- **Talent points**: Earned by something persistent (e.g. “1 point per hero unlocked”, “1 point per N Essence spent”, “1 point per run completed”, or a mix). Stored per save (e.g. `IncrementalSave.talentPointsSpent` and a table `IncrementalTalentNode` with `saveId`, `nodeId`, `purchasedAt`). Unspent points = earned − spent.

### 3.3 How it plugs into training

- **Unlock building**: When resolving “can this player train stat X?”, check if the building for X is unlocked (either always available, or a talent node “unlock_<building>” is purchased). If locked, UI shows “Locked” and API rejects assigning that stat.
- **Training speed modifier**: When computing **effective duration** for a training tick, look up all purchased nodes that apply to this (heroId, statKey) or to “all training”. Example: “Spell power training +15%” → `effectiveDuration = baseDuration / (1 + 0.15)` for `statKey === 'spell_power'`. Same formula as mining rate modifier: duration divided by (1 + modifier).

### 3.4 Data (for later implementation)

- **Talent definition** (constants or DB): List of nodes with id, type, payload, prerequisite node ids. No persistence of the tree shape itself per user; only “which nodes are purchased” per save.
- **Per-save**: `IncrementalTalentNode` (saveId, nodeId) or a JSON array of purchased node ids on `IncrementalSave`. Plus a source for “talent points earned” (e.g. from hero count, Essence spent, runs completed).

### 3.5 UI (future)

- **Talent tree page** (e.g. `/incremental/talents`): Visual tree (graph or list of branches). Purchased nodes highlighted; available (prereqs met, points enough) clickable; locked nodes greyed. Spending a point = purchase one node; deduct point and persist.
- **Training UI**: Buildings that are locked show “Unlock in Talent tree” and are not selectable for “Send hero here”.

---

## 4. Summary

| Topic | Summary |
|-------|--------|
| **Flow** | Mine Essence → Unlock hero (convert win) → Hero on roster and available for training → Send hero to a training ground (idle) → Bar fills → Stat improves. One active action (Mining or one Training). |
| **Training UI** | Seven buildings (stats). “Send hero here” per building; one shared bar; only roster heroes. Live on Incremental page or dedicated Training page. |
| **Talent tree (plan)** | Nodes unlock buildings (e.g. Swift Forge) and add training speed modifiers (e.g. +15% spell power training). Points earned per hero unlock / Essence / runs; spent on nodes. Gates and amplifies training. |
| **Next steps** | Implement training data + action engine + training UI (Phase 13); then add talent definitions and “unlock building” + “training speed modifier” logic; then talent tree UI. |

This doc can be updated as you lock in talent point sources, tree shape, and exact node list.
