# Bank System – Currencies & Item Inventory

**Status**: Design (schema not yet changed; current Essence remains on `IncrementalSave` until Bank is implemented).  
**Related**: [DOTA2_REWARDS_ITEMS_LOOTBOX.md](./DOTA2_REWARDS_ITEMS_LOOTBOX.md) (items, lootbox), [LEVELING_SYSTEM.md](./LEVELING_SYSTEM.md), [ESSENCE_AND_BROWSER_ACTIONS.md](./ESSENCE_AND_BROWSER_ACTIONS.md), [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md).

---

## 1. Purpose

The **Bank** is the single per-save place that keeps count of **currencies** and **item inventory**. It replaces the hardcoded `IncrementalSave.essence` field and provides:

- **Currencies**: Essence, Loot Coins, Gold, Wood, and any future currency (one balance per currency per save).
- **Item inventory**: Materials and equipable items (from Dota 2 loot, crafting, or shops) that can be spent, equipped to roster heroes, or used in recipes.

All gains and spends (idle mining, convert-win, Dota wins, battle rewards, shops, loot rolls) go through the Bank so we can add new currencies and items without new columns or one-off logic.

---

## 2. Scope

| Stored in Bank | Description | Sources (examples) |
|----------------|-------------|--------------------|
| **Currencies** | Numeric balances keyed by currency id (e.g. `essence`, `loot_coins`, `gold`, `wood`). | Idle mining (Essence), Dota roster-hero wins (Loot Coins), battles (Gold), idle/battles (Wood), Dota (Gold). |
| **Items** | Counts or instances of materials and equipable items (see [DOTA2_REWARDS_ITEMS_LOOTBOX](./DOTA2_REWARDS_ITEMS_LOOTBOX.md) item system). | Loot drops (Dota wins on roster heroes), crafting, shops, battle rewards. |

- **Per save**: Each save has its own Bank (currencies + inventory). No cross-save sharing.
- **Spending**: Convert-win spends Essence from Bank; shops spend Gold/Wood; equipping moves an item from Bank inventory to a hero slot (or copies depending on design).
- **Earning**: Mining, action rewards, battle rewards, Dota win processing, and loot rolls all credit the Bank (currencies or item stacks).

---

## 3. Data model (planned)

When we implement, the schema will look like this (no migration applied yet):

**Bank currency balances**

- **IncrementalBankCurrency** (or equivalent): `saveId`, `currencyKey` (e.g. `essence`, `loot_coins`, `gold`, `wood`), `amount` (Int).  
- Unique per `(saveId, currencyKey)`. Missing row = 0.  
- Currency keys and display metadata live in constants (e.g. `src/lib/incremental/constants/currencies.ts`).

**Bank item inventory**

- **IncrementalBankItem** (or equivalent): `saveId`, item reference (e.g. `itemDefId` for stackable materials/consumables, or `itemInstanceId` for unique equipable items), `quantity` (for stacks) or one row per instance.  
- Supports both stackable (materials, consumables) and non-stackable (equipped gear with instance-specific stats) as in [DOTA2_REWARDS_ITEMS_LOOTBOX](./DOTA2_REWARDS_ITEMS_LOOTBOX.md).  
- Equipping an item moves it (or a copy) from Bank to the hero’s equipment slot; unequip returns it to Bank.

**Migration**

- Add Bank tables; backfill `essence` from `IncrementalSave.essence` into Bank currency `essence`; then remove `essence` from `IncrementalSave`.  
- All reads/writes of Essence (Bank API, action rewards, convert-win, saves list) use Bank currency APIs.

---

## 4. Integration with existing mechanics

| Mechanic | Current | With Bank |
|----------|---------|-----------|
| **Mining** | Grants Essence; stored on `IncrementalSave.essence`. | Grant to Bank currency `essence` (same amount). |
| **Convert-win** | Deducts Essence from save; adds hero to roster. | Deduct `essence` from Bank for that save; add hero to roster. |
| **Eligible wins / Tavern** | UI shows Essence balance and convert cost. | UI reads Bank balance for `essence`; convert cost unchanged. |
| **Saves list** | Shows `essence` per save for selector. | Show Bank balance for `essence` (or primary currency) per save. |
| **Bank API** | Returns `essence` and action state. | Returns Bank balances (all currencies) and action state; response shape can stay backward compatible with `essence` key. |
| **Dota roster-hero win** | (Planned) Loot roll. | Grant Loot Coins (and/or items) to Bank for that save. |
| **Battle rewards** | Run-level gold today; optional persist. | Gold (and Wood if desired) can be granted to Bank when run ends or per encounter. |
| **Shops / crafting** | (Planned) Spend gold, materials. | Spend from Bank (currencies and/or item stacks). |
| **Item system** | (Planned) Equip from inventory. | Equip from Bank item inventory; unequip returns to Bank. |

No change to: roster, lineups, action state, training, talent tree, or run/battle flow—only the **storage and API for balances and items** move to the Bank.

---

## 5. API surface (planned)

- **GET /api/incremental/bank**: Query `saveId` (optional). Returns all Bank currency balances (e.g. `{ essence, loot_coins, gold, wood }`) and optionally a summary of item inventory (counts by type or list). Also return current action state so the idle UI does not need a second call.
- **Internal server API**: `getBankBalance(saveId, currencyKey)`, `getBankBalances(saveId)`, `addBankCurrency(saveId, currencyKey, amount)`, `deductBankCurrency(saveId, currencyKey, amount)`, `addBankItem(...)`, `removeBankItem(...)`. Used by action rewards, convert-win, loot roll, battle rewards, shops.

Spending (convert-win, shop, equip) always goes through deduct/add so we never double-credit or double-spend.

---

## 6. Currencies (canonical list in constants)

Planned currencies, all stored in Bank:

| Key | Name | Primary sources |
|-----|------|------------------|
| `essence` | Essence | Idle mining. |
| `loot_coins` | Loot Coins | Dota 2 wins on heroes already on roster. |
| `gold` | Gold | Idle, incremental battles, Dota 2. |
| `wood` | Wood | Idle, incremental battles. |

New currencies: add a row in Bank (new `currencyKey`) and an entry in constants; no schema change for currency table.

---

## 7. Item inventory (summary)

- Bank holds **materials** (stackable) and **equipable items** (from [DOTA2_REWARDS_ITEMS_LOOTBOX](./DOTA2_REWARDS_ITEMS_LOOTBOX.md)).  
- Loot drops and rewards add to Bank; equipping moves (or copies) to hero slots; crafting consumes materials from Bank.  
- Detailed item definitions, slots, and equip flow are in DOTA2_REWARDS_ITEMS_LOOTBOX; Bank is the storage layer for “inventory” there.

---

## 8. Roadmap

- **Phase**: Implement Bank (currencies first, then item inventory) after current roster/action/training work; can be part of or just after “Phase 13” leveling/Dota integration.  
- **Steps**: (1) Add Bank currency table + migration (backfill essence, drop column). (2) Add Bank service and switch action/convert-win/saves to use it. (3) Add Loot Coins grant when processing roster-hero win. (4) Add Bank item table and loot/craft/equip integration.  
- See [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) for placement and dependencies.
