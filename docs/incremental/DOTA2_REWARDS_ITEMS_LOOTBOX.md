# Dota 2 Integration: Rewards, Item System & Lootbox

**Status**: Design.  
**Related**: [BANK_SYSTEM.md](./BANK_SYSTEM.md) (currencies and item inventory live in the Bank), [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md), [LEVELING_SYSTEM.md](./LEVELING_SYSTEM.md), [ESSENCE_AND_BROWSER_ACTIONS.md](./ESSENCE_AND_BROWSER_ACTIONS.md).  
**API payload reference**: Run `npx tsx scripts/inspect-dota-match-apis.ts` → `scripts/dota-match-api-payloads.md`.

---

## 1. External Dota 2 APIs in this repo

| API | Usage in repo | Auth |
|-----|----------------|------|
| **OpenDota** | `GET /api/players/{account_id}` (profile), `GET /api/players/{account_id}/matches` (list), `GET /api/matches/{match_id}` (details), `GET /api/heroes` | None (rate-limited) |
| **Stratz** | `POST https://api.stratz.com/graphql` – player matches (Turbo/ranked), recent matches, hero matchups | `STRATZ_TOKEN` (Bearer) |

**Where used**:  
- **Match list**: `updateMatchesForUser` (OpenDota) and `players/[slug]/matches` (Stratz) populate `Match` table.  
- **Eligible wins**: `GET /api/incremental/roster/eligible-wins` reads from `Match` (last 10, win/loss from `player_slot` + `radiant_win`).  
- **Match details**: `GET /api/matches/[slug]` fetches OpenDota match detail and stores `MatchDetail` + `PlayersMatchDetail` (kills, deaths, assists, hero_damage, tower_damage, hero_healing, items, etc.).

**Script to inspect payloads**:  
`scripts/inspect-dota-match-apis.ts` – optional env: `OPENDOTA_ACCOUNT_ID`, `OPENDOTA_MATCH_ID`, `STRATZ_TOKEN`. Writes `scripts/dota-match-api-payloads.md` with endpoint shapes and which stats exist for rewards.

---

## 2. Stats available for rewards (from APIs and DB)

From `scripts/dota-match-api-payloads.md` and schema:

**Without extra match-detail fetch (list / our `Match` table):**  
`match_id`, `account_id`, `hero_id`, `player_slot`, `radiant_win`, `start_time`, `game_mode`, `kills`, `deaths`, `assists`, `duration`, `leaver_status`, `average_rank`.

**With match detail (OpenDota `/matches/{id}` or DB `MatchDetail` + `PlayersMatchDetail`):**  
Per player: `kills`, `deaths`, `assists`, `last_hits`, `denies`, `gold_per_min`, `xp_per_min`, `level`, `net_worth`, `hero_damage`, `tower_damage`, `hero_healing`, `item_0`…`item_5`, `backpack_0`…`2`, `item_neutral`, `aghanims_scepter`, `aghanims_shard`, `moonshard`, `gold`, `total_gold`, `total_xp`, `kda`, `benchmarks`, `win`, `lose`.

**Stratz (one GraphQL call, no detail):**  
Match: `id`, `durationSeconds`, `didRadiantWin`, `gameMode`, `averageRank`.  
Player: `heroId`, `kills`, `assists`, `deaths`, `heroDamage`, `towerDamage`, `heroHealing`, `award`, `imp`, `isVictory`, `leaverStatus`, `playerSlot`.

So we can drive rewards from: **outcome** (win/loss), **hero_id**, **KDA**, **duration**, **game_mode**, **rank**; and with one detail call or Stratz: **hero_damage**, **tower_damage**, **hero_healing**, **last_hits**, **net_worth**, **items**, **award/imp**, **first_blood**, **multi_kills**, etc.

---

## 3. Reward ideas (using actual API stats)

- **Convert-win (current)** – Spend Essence (from **Bank**) to add hero from a win to roster. Keep as-is; Bank holds all currencies (see [BANK_SYSTEM.md](./BANK_SYSTEM.md)).  
- **Performance bonus on convert** – When converting a win, grant extra Essence to **Bank** from that match: e.g. tier from KDA or `hero_damage`/`hero_healing` (Stratz or MatchDetail).  
- **Loss consolation** – Small Essence (or other currency) to Bank for a loss when stats are “good”.  
- **Duplicate win → Loot Coins + loot roll** – If hero already on roster, the win grants **Loot Coins** (Bank currency) and triggers a **loot roll** (see §5) for materials/items; materials and items are added to the **Bank item inventory**.  
- **Milestones from match detail** – First blood, multi-kills, etc.: one-time or repeatable small Essence (or Loot Coins) or material drops into Bank.  
- **Streaks** – Win streak → bonus Essence or Loot Coins on next convert, or bonus drop chance.  
- **Hero familiarity** – Games played on hero → training speed or drop-rate bonus (see LEVELING_SYSTEM).  
- **Ranked vs Turbo** – `game_mode`: e.g. ranked wins grant more Essence/Loot Coins or better loot tier.

All of the above use only fields we already have or can get from OpenDota list + detail or Stratz.

---

## 4. Item system (roster heroes)

### 4.1 Purpose

Roster heroes have **equippable items** that modify base stats, spells, and other combat/idle effects. Items are earned from Dota 2 wins (lootbox/drops), crafting, or shops. This gives a direct link: “play Dota on this hero → get gear for them in the incremental.”

### 4.2 Slot layout (per hero)

Each roster hero has a fixed set of **equipment slots** (e.g. 6, like Dota). Suggested slots:

| Slot | Name (example) | Typical effect focus |
|------|----------------|-----------------------|
| 1 | Weapon | Attack damage, attack speed |
| 2 | Armor | HP, armor |
| 3 | Arcane | Spell power, spell haste |
| 4 | Accessory | Mixed (e.g. crit, lifesteal, utility) |
| 5 | Boots | Move speed (if we add positioning), or generic “speed” (attack/cast) |
| 6 | Neutral / Special | Unique effects (e.g. “spell applies slow”, “heal on kill”) |

Slots are **per hero per save**: each of your roster heroes has their own 6 slots. Same item definition can be equipped in one slot on one hero (no duplicate equip of same instance if we use instances).

### 4.3 Item definition (data)

- **ItemDef** (id, name, description, slot, rarity, requiredLevel?).  
- **Stats**: flat or percent modifiers to: `hp`, `attack_damage`, `spell_power`, `attack_speed`, `spell_haste`, `armor`, `magic_resist`.  
- **Spell/ability modifiers** (optional): e.g. “ability_1 cooldown -10%”, “ability_2 damage +15%”, “all spell damage +5%”.  
- **Special effects** (optional): e.g. “lifesteal 5%”, “on kill restore 2% max HP”, “non-focus damage penalty reduced by 10%”.

Stored in constants or DB; battle and training formulas read equipped items when computing effective stats (same formula layer as training/talents).

### 4.4 Persistence

- **Bank item inventory**: Unassigned items and materials are stored in the **Bank** (see [BANK_SYSTEM.md](./BANK_SYSTEM.md)). The Bank keeps count of both currencies and items per save.  
- **IncrementalHeroItem** (or similar): saveId, heroId, slotIndex, itemInstanceId (or itemDefId). Equipping moves (or copies) an item from Bank inventory to the hero slot; unequip returns it to Bank.  
- If items have durability or “material” upgrades, add fields as needed (e.g. tier, level).

### 4.5 Battle and training integration

- When building **battle state**: for each lineup hero, load base stats + training + **equipped item modifiers**; sum flat and percent per stat; pass to existing formulas.  
- **Spell modifiers**: resolution layer applies “ability X damage +Y%” from items when resolving that ability.  
- Training: items can optionally affect “training speed” for that hero (e.g. “Arcane slot: +5% spell_power training speed”).

### 4.6 Rarity and progression

- **Rarity**: common, uncommon, rare, epic, legendary (affects drop chance and stat ranges).  
- **Crafting/upgrades** (later): materials from lootbox + Essence → craft or upgrade items.  
- **Required level**: some items require hero training level or roster level to equip (optional).

---

## 5. Lootbox system (wins on roster heroes)

### 5.1 Trigger

- When the player **wins a Dota 2 game on a hero that is already on their roster**, that match can yield a **drop** (materials and/or items) for that hero (or for the “incremental account” to assign later).  
- No “convert-win” spend here: the win itself is the trigger. Optionally cap: e.g. “first N wins per hero per day count” or “first 3 wins per day across all roster heroes” to avoid farm abuse.

### 5.2 What drops

- **Materials** – Used in crafting or upgrading items (e.g. “Essence Shard”, “Weapon Fragment”, “Arcane Dust”). Drop table by rarity; higher performance (KDA, hero_damage, hero_healing from Stratz/detail) can improve chance or tier.  
- **Items** – Direct equipment; drop rate lower than materials. Can be slot-specific (e.g. “Weapon” table vs “Armor” table) or generic “any slot”.  
- **Duplicate wins (convert flow)** – When user tries to “convert” a win whose hero is already on roster, instead of erroring we can: (a) grant a **loot roll** for that hero (materials + chance at item), and (b) optionally still grant a small Essence bonus.

### 5.3 Roll logic (sketch)

- On “eligible drop” (win on roster hero, under daily cap):  
  - Grant **Loot Coins** (Bank currency) for that save.  
  - Roll 1: material drop (yes/no + tier from performance).  
  - Roll 2: item drop (yes/no; if yes, pick from pool by slot and rarity).  
- Performance modifiers: use `hero_damage`, `hero_healing`, `kda`, `deaths` from Stratz or MatchDetail to nudge tier or chance.  
- Store drops and grant materials/items into the **Bank** (see [BANK_SYSTEM.md](./BANK_SYSTEM.md)): Bank currency (Loot Coins) and Bank item inventory (material stacks, item instances). Hero equipment: “equip from Bank” by slot.

### 5.4 Bank inventory and “open” UX

- **Bank** holds per-save **currencies** (Essence, Loot Coins, Gold, Wood) and **item inventory** (material counts, item instances). All drops and rewards credit the Bank.  
- “Open” lootbox can be implicit (drop granted immediately into Bank) or explicit (e.g. “You have 2 unopened drops” → click to roll and reveal; then grant to Bank).  
- Equip flow: Bank (item inventory) → select hero → select slot → assign item; unequip returns item to Bank.

---

## 6. End-to-end flow (Dota → incremental)

1. Player plays Dota; matches are fetched (OpenDota or Stratz) and stored in `Match` (and optionally MatchDetail when needed).  
2. **New hero win** → eligible for convert-win → spend **Essence from Bank** → hero added to roster.  
3. **Roster hero win** → grants **Loot Coins** (Bank currency) and eligible for loot roll → materials/items added to **Bank item inventory**; optionally performance bonus Essence to Bank.  
4. Player uses **Bank** (item inventory) to equip items on roster heroes; battle and training use base + training + items.  
5. Materials in Bank can later fuel **crafting** (e.g. 10 Weapon Fragments + Essence → random Weapon item); spending deducts from Bank.

All currencies and items flow through the **Bank** (see [BANK_SYSTEM.md](./BANK_SYSTEM.md)); Dota rewards and incremental mechanics (mining, battles, shops) read and write Bank only.

---

## 7. Using Cursor to investigate in parallel (multi-agent)

Cursor doesn’t expose a formal “multi-agent” API; you can still **run several investigations in parallel** by hand or with a small amount of structure.

### 7.1 Multiple chats / agents

- **Separate Chat tabs** – Open 2–3 Chat panels (e.g. Cursor Chat + another Chat or Composer). In each, give a **different**, focused task that doesn’t depend on the other. Each chat has its own context; they run in parallel.  
- **Composer (Agent)** – Start a Composer/Agent session with a clear, single objective (e.g. “Implement GET /api/incremental/drops and the drop table from DOTA2_REWARDS_ITEMS_LOOTBOX”). That agent can edit and run; run another Composer with a different objective in parallel in another tab.

### 7.2 One agent, explicit sub-tasks (todo list)

- In **one** Composer/Agent session, give a **list of sub-tasks** and say: “Do these in order; for each, implement and then move to the next.”  
- Use the **Todo** feature (e.g. “Add todo list: 1) Item slot schema, 2) Loot roll service, 3) Drops API”) so the agent tracks and you can see progress.  
- This is “parallel” only in the sense that you’re not blocking on human steps between tasks; the agent does them one after another.

### 7.3 Parallel investigations (by you)

- **You** run multiple investigations in parallel by opening multiple Cursor windows (or workspaces), each with a different question:  
  - Window 1: “Review OpenDota match detail response and list every field we could use for loot tier.”  
  - Window 2: “Design the Prisma schema for IncrementalHeroItem and IncrementalDrop.”  
  - Window 3: “Implement getEffectiveStats(heroId, saveId) including item modifiers.”  
- Each window has its own chat/agent; you get independent answers and merge later.

### 7.4 Suggested split for *this* feature set

- **Agent A (or Chat 1):** “Using scripts/dota-match-api-payloads.md and the code in src/routes/api/incremental/roster and src/routes/api/matches, add a ‘performance tier’ for convert-win (e.g. from KDA or hero_damage) and grant bonus Essence. Document which API we call (list vs detail vs Stratz) and where.”  
- **Agent B (or Chat 2):** “From docs/incremental/BANK_SYSTEM.md and DOTA2_REWARDS_ITEMS_LOOTBOX.md, add Prisma models for Bank (currencies + item inventory), item definitions, and IncrementalHeroItem (equipped per hero per save); add GET /api/incremental/bank (balances + item inventory) and PATCH /api/incremental/heroes/[heroId]/equip (move item from Bank to slot).”  
- **Agent C (or Chat 3):** “Implement the loot roll: when a match is a win and the hero is on the roster, grant Loot Coins to Bank and roll materials/items into Bank item inventory. Integrate with eligible-wins or a new endpoint that marks a match as ‘claimed’ for loot.”

Give each agent the **same** doc (this file + payloads) and the **relevant** file paths so they stay aligned; then merge PRs or edits when done.

---

## 8. Summary

| Topic | Summary |
|-------|--------|
| **APIs** | OpenDota (list + detail), Stratz (GraphQL); script in `scripts/inspect-dota-match-apis.ts` documents payloads. |
| **Rewards** | Use list + detail/Stratz for performance bonus, loss consolation, duplicate-win loot, streaks, hero familiarity, ranked vs Turbo. |
| **Items** | Per-hero slots (e.g. 6); ItemDef with stat/spell modifiers; IncrementalHeroItem; battle and training read items in formula layer. |
| **Lootbox** | Win on roster hero → Loot Coins + material/item drop into **Bank**; roll by performance; equip from Bank to hero slots. |
| **Cursor** | Multiple Chat/Composer tabs or windows with separate tasks; or one agent with a todo list; suggest splitting performance bonus, schema+inventory+equip, and loot roll into three parallel tracks. |
