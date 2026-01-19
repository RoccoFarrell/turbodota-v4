# Card Battler Feature - Planning Document

## Feature Overview

A single-player card battler game (similar to Slay the Spire) where users:
1. Win COMMON cards by playing Dota 2 matches (1-4 copies based on performance)
2. Forge cards to upgrade rarity (3 of lower rarity → 1 of higher rarity)
3. Build a deck of up to 10 cards from their collection
4. Battle against AI opponents using their deck
5. Progress through encounters with increasing difficulty

**Key Difference from Existing DotaDeck**: 
- Current DotaDeck = Shared competitive pool game
- New Card Battler = Single-player roguelike deck builder

---

## Database Schema

### Prisma Migration Reset

**IMPORTANT**: Before beginning development, reset the Prisma migration system:
- Currently committing directly to schema
- Need to reset and begin using proper migrations
- This will be done before Phase 0: Foundation & Setup

### New Models

```prisma
// Card Collection System
// Each hero has 4 card versions (one per rarity) with different effects
model BattlerCard {
  id            String   @id @default(cuid())
  heroId        Int      // One card per hero per rarity
  rarity        Rarity   // COMMON, UNCOMMON, RARE, LEGENDARY
  hero          Hero     @relation(fields: [heroId], references: [id])
  
  // Card Stats
  name          String   // e.g., "Pudge - Butcher"
  cost          Int      // Energy cost
  attack        Int      // Attack damage (0 if DEFENSE/SKILL)
  defense       Int      // Block value (0 if ATTACK/SKILL)
  health        Int      // If card has health (for minions)
  
  // Card Type
  cardType      CardType // ATTACK, DEFENSE, SKILL, POWER
  
  // Effects (JSONB stored for PostgreSQL) - different per rarity
  // COMMON: No effects (just attack/block)
  // UNCOMMON: Weak hero power
  // RARE: Stronger hero power
  // LEGENDARY: Strongest hero power
  // Design: Extensible structure for future effects
  effects       Json?    // JSONB array of card effects (PostgreSQL)
  description   String   // Flavor text + ability description
  
  // Visual
  imageUrl      String?  // Hero portrait URL
  
  // Relations
  userCards     UserBattlerCard[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([heroId, rarity]) // One card per hero per rarity
  @@index([heroId])
  @@index([rarity])
}

enum CardType {
  ATTACK    // Deals damage
  DEFENSE   // Blocks damage
  SKILL     // Utility effects
  POWER     // Persistent effects
}

enum Rarity {
  COMMON
  UNCOMMON
  RARE
  LEGENDARY
}

// User's Card Collection
// Tracks quantity of each card at each rarity level
model UserBattlerCard {
  id           String   @id @default(cuid())
  userId       String
  cardId       String   // References specific BattlerCard (heroId + rarity)
  rarity       Rarity   // COMMON, UNCOMMON, RARE, LEGENDARY
  
  // Quantity of this card at this rarity
  quantity     Int      @default(0)
  
  // Relations
  user         User     @relation(fields: [userId], references: [id])
  card         BattlerCard @relation(fields: [cardId], references: [id])
  deckCards    BattlerDeckCard[] // Can be in multiple decks
  
  @@unique([userId, cardId]) // One record per user per card (card already has rarity)
  @@index([userId])
  @@index([cardId])
  @@index([rarity])
}

// Active Deck (up to 10 cards, max 5 decks per user)
model BattlerDeck {
  id          String   @id @default(cuid())
  userId      String
  name        String?  // Optional deck name
  isActive    Boolean  @default(false)  // Only one active deck per user
  
  cards       BattlerDeckCard[]  // Junction table for ordering
  
  user        User     @relation(fields: [userId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId])
}

// Deck-Card Junction (for ordering and duplicates)
// References UserBattlerCard (specific card instance), not BattlerCard template
model BattlerDeckCard {
  id          String   @id @default(cuid())
  deckId      String
  userCardId  String   // References specific UserBattlerCard instance
  position    Int      // Order in deck (0-9)
  
  deck        BattlerDeck @relation(fields: [deckId], references: [id], onDelete: Cascade)
  userCard    UserBattlerCard @relation(fields: [userCardId], references: [id])
  
  @@unique([deckId, position])
  @@index([deckId])
  @@index([userCardId])
}

// Battle/Run System
model BattlerRun {
  id              String        @id @default(cuid())
  userId          String
  deckId          String
  
  // Run State
  status          RunStatus     @default(ACTIVE)
  currentFloor    Int           @default(1)
  maxFloors       Int           @default(10)  // Configurable difficulty
  
  // Resources
  health          Int           @default(80)
  maxHealth       Int           @default(80)
  energy          Int           @default(3)  // Per turn
  maxEnergy       Int           @default(3)
  gold            Int           @default(0)
  
  // Progress
  enemiesDefeated Int           @default(0)
  cardsPlayed     Int           @default(0)
  
  // Battle State (full state persisted after each action for resume capability)
  battleState     Json?         // JSONB - Full battle state for resume
  
  // Relations
  user            User          @relation(fields: [userId], references: [id])
  deck            BattlerDeck   @relation(fields: [deckId], references: [id])
  encounters      BattlerEncounter[]
  
  startedAt       DateTime      @default(now())
  completedAt     DateTime?
  
  @@index([userId])
  @@index([status])
}

enum RunStatus {
  ACTIVE
  COMPLETED
  ABANDONED
  DEFEATED
}

// Individual Encounters (Battles)
model BattlerEncounter {
  id            String   @id @default(cuid())
  runId         String
  floor         Int
  encounterType EncounterType
  
  // Player State at Start
  playerHealth  Int
  playerEnergy  Int
  
  // Enemy
  enemyId       String?  // Reference to enemy template
  enemyName     String
  enemyHealth   Int
  enemyMaxHealth Int
  enemyIntent   Json?    // JSONB - what enemy will do next turn
  
  // Battle State
  status        EncounterStatus @default(IN_PROGRESS)
  turnNumber    Int      @default(1)
  
  // Results
  damageDealt   Int      @default(0)
  damageTaken   Int      @default(0)
  cardsPlayed   Int      @default(0)
  
  run            BattlerRun @relation(fields: [runId], references: [id], onDelete: Cascade)
  turns          BattlerTurn[]
  
  startedAt      DateTime @default(now())
  completedAt    DateTime?
  
  @@index([runId])
}

enum EncounterType {
  NORMAL_ENEMY
  ELITE_ENEMY
  BOSS
  EVENT
  SHOP
}

enum EncounterStatus {
  IN_PROGRESS
  VICTORY
  DEFEAT
  FLEE
}

// Turn-by-Turn Battle Log
model BattlerTurn {
  id            String   @id @default(cuid())
  encounterId   String
  turnNumber     Int
  
  // Player Actions
  cardsPlayed   Json     // JSONB array of card IDs played
  energyUsed    Int
  damageDealt   Int
  blockGained   Int
  
  // Enemy Actions
  enemyAction   Json     // JSONB - what enemy did
  damageTaken   Int
  statusEffects Json?    // JSONB - buffs/debuffs applied
  
  // State After Turn
  playerHealth  Int
  enemyHealth   Int
  
  encounter     BattlerEncounter @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  
  createdAt     DateTime @default(now())
  
  @@index([encounterId])
}

// Track which matches have been claimed for cards
model ClaimedMatch {
  id            String   @id @default(cuid())
  userId        String
  matchId       BigInt
  heroId        Int
  copiesAwarded Int      @default(1) // Number of COMMON copies awarded
  performancePercentile Float? // Top X% performance (for tracking)
  claimedAt     DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, matchId, heroId]) // One claim per match per hero
  @@index([userId])
  @@index([matchId])
}

// Track forging operations (single card forge, no batch)
model ForgeOperation {
  id            String   @id @default(cuid())
  userId        String
  cardId        String
  fromRarity    Rarity   // Rarity being consumed
  toRarity      Rarity   // Rarity being created (or null if dismantle)
  operationType ForgeOperationType @default(FORGE) // FORGE or DISMANTLE
  quantityUsed  Int      // Always 3 for forge, 1 for dismantle
  quantityCreated Int    // Always 1 for forge, 3 for dismantle
  forgedAt      DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id])
  card          BattlerCard @relation(fields: [cardId], references: [id])
  
  @@index([userId])
  @@index([cardId])
}

enum ForgeOperationType {
  FORGE      // 3 lower → 1 higher
  DISMANTLE  // 1 higher → 3 lower
}
```

### Updates to Existing Models

```prisma
model User {
  // ... existing fields ...
  battlerCards     UserBattlerCard[]
  battlerDecks     BattlerDeck[]
  battlerRuns      BattlerRun[]
  claimedMatches   ClaimedMatch[]
}
```

---

## API Endpoints

### Card Collection

#### `GET /api/battler/cards`
- **Purpose**: Get all available cards (card catalog)
- **Response**: Array of `BattlerCard` with descriptions, stats, abilities
- **Auth**: Public (or user-specific if showing owned status)

#### `GET /api/battler/cards/my-collection`
- **Purpose**: Get user's collected cards
- **Response**: Array of `UserBattlerCard` with card details
- **Auth**: Required

#### `POST /api/battler/cards/claim`
- **Purpose**: Claim cards for any unclaimed wins (allows claiming past games)
- **Body**: `{ matchIds?: BigInt[] }` (optional: specific matches, or all unclaimed if omitted)
- **Logic**:
  1. Find all unclaimed matches where user won (from `Match` and `PlayersMatchDetail` tables)
  2. For each win, check if card already claimed for that match (via `ClaimedMatch`)
  3. For each match, fetch performance data from Stratz API (https://api.stratz.com/graphiql)
  4. Compare match performance to hero's average performance from Stratz API
  5. Determine number of copies based on performance percentile:
     - **Top 5%**: 4 COMMON copies
     - **Top 20%**: 3 COMMON copies
     - **Top 50%**: 2 COMMON copies
     - **Bottom 50%**: 1 COMMON copy
  6. Add copies to user's COMMON card collection (create or update `UserBattlerCard`)
  7. Create `ClaimedMatch` record for each claimed match
- **Response**: `{ cardsAwarded: { cardId: string, copies: number, rarity: 'COMMON', heroId: number }[], count: number }`
- **Auth**: Required
- **Note**: Performance calculation uses Stratz API to compare against hero averages, eliminating need for user match history calculation

**Copy Calculation Formula:**
```typescript
async function calculateCopiesAwarded(matchStats: PlayersMatchDetail, heroId: number): Promise<number> {
  // Fetch hero average performance from Stratz API
  const heroAverages = await fetchStratzHeroAverages(heroId);
  
  // Calculate performance score for this match
  const matchScore = calculatePerformanceScore(matchStats);
  
  // Compare to hero averages to determine percentile
  const percentile = calculatePercentileVsHeroAverage(matchScore, heroAverages);
  
  if (percentile >= 95) return 4; // Top 5%
  if (percentile >= 80) return 3; // Top 20%
  if (percentile >= 50) return 2; // Top 50%
  return 1; // Bottom 50%
}

// Performance calculation uses Stratz API data
// No need to recalculate user history - uses hero averages instead
```

### Forge System

#### `POST /api/battler/forge`
- **Purpose**: Combine 3 cards of same rarity to create 1 of next rarity (single card forge, no batch)
- **Body**: `{ cardId: string, fromRarity: Rarity }`
- **Logic**:
  1. Check user has at least 3 copies of the card at `fromRarity`
  2. Check if any copies are in active decks - remove from decks if found
  3. Determine target rarity (COMMON→UNCOMMON, UNCOMMON→RARE, RARE→LEGENDARY)
  4. Deduct 3 from `fromRarity` quantity
  5. Add 1 to target rarity quantity (create if doesn't exist)
  6. Create `ForgeOperation` record with type FORGE
- **Response**: `{ success: boolean, newRarity: Rarity, quantity: number }`
- **Auth**: Required

**Forge Requirements:**
- 3 COMMON → 1 UNCOMMON
- 3 UNCOMMON → 1 RARE
- 3 RARE → 1 LEGENDARY
- Cannot forge LEGENDARY (max rarity)
- **Note**: No quantity caps - users can accumulate unlimited cards of each rarity

#### `POST /api/battler/forge/dismantle`
- **Purpose**: Dismantle 1 higher rarity card into 3 lower rarity cards (reverse forge)
- **Body**: `{ cardId: string, fromRarity: Rarity }`
- **Logic**:
  1. Check user has at least 1 copy of the card at `fromRarity`
  2. Check if copy is in active deck - remove from deck if found
  3. Determine target rarity (LEGENDARY→RARE, RARE→UNCOMMON, UNCOMMON→COMMON)
  4. Deduct 1 from `fromRarity` quantity
  5. Add 3 to target rarity quantity (create if doesn't exist)
  6. Create `ForgeOperation` record with type DISMANTLE
- **Response**: `{ success: boolean, newRarity: Rarity, quantity: number }`
- **Auth**: Required

#### `GET /api/battler/forge/requirements/[cardId]`
- **Purpose**: Get forge requirements for a card
- **Response**: `{ canForge: boolean, currentQuantity: { [rarity]: number }, requirements: { [rarity]: number } }`
- **Auth**: Required

### Deck Management

#### `GET /api/battler/decks`
- **Purpose**: Get user's decks
- **Response**: Array of `BattlerDeck` with cards
- **Auth**: Required

#### `POST /api/battler/decks/create`
- **Purpose**: Create new deck (max 5 decks per user)
- **Body**: `{ name?: string, userCardIds: string[] }` (max 10 cards, references UserBattlerCard IDs)
- **Logic**:
  1. Check user has fewer than 5 decks
  2. Validate deck has 1-10 cards
  3. Validate all cards are in user's collection
- **Response**: Created `BattlerDeck`
- **Auth**: Required

#### `PUT /api/battler/decks/[deckId]`
- **Purpose**: Update deck (add/remove/reorder cards)
- **Body**: `{ userCardIds: string[], name?: string }` (references UserBattlerCard IDs)
- **Response**: Updated `BattlerDeck`
- **Auth**: Required

#### `POST /api/battler/decks/[deckId]/set-active`
- **Purpose**: Set deck as active (only one active per user)
- **Response**: Success
- **Auth**: Required

#### `DELETE /api/battler/decks/[deckId]`
- **Purpose**: Delete deck
- **Response**: Success
- **Auth**: Required

### Battle System

#### `POST /api/battler/runs/start`
- **Purpose**: Start a new run
- **Body**: `{ deckId: string }`
- **Logic**:
  1. Validate deck has cards
  2. Create `BattlerRun` with initial state
  3. Generate first encounter
- **Response**: `BattlerRun` with first encounter
- **Auth**: Required

#### `GET /api/battler/runs/[runId]`
- **Purpose**: Get run state
- **Response**: `BattlerRun` with current encounter
- **Auth**: Required (own runs only)

#### `POST /api/battler/runs/[runId]/encounters/[encounterId]/play-turn`
- **Purpose**: Play cards for a turn (deterministic battles, state persisted after each action)
- **Body**: `{ cardIds: string[] }` (cards to play this turn)
- **Logic**:
  1. Validate cards are in deck and energy is sufficient
  2. Calculate damage/block/effects (deterministic calculations)
  3. Apply enemy action (deterministic AI)
  4. Check win/loss conditions
  5. Create `BattlerTurn` record
  6. Update encounter state
  7. **Persist full battle state to database** (for resume capability)
  8. Update `BattlerRun.battleState` JSONB field
- **Response**: Updated encounter state, turn result
- **Auth**: Required
- **Note**: Battle state is fully persisted after each action to allow users to leave and resume

#### `POST /api/battler/runs/[runId]/encounters/[encounterId]/end-turn`
- **Purpose**: End turn without playing cards (pass)
- **Response**: Enemy turn result, updated state
- **Auth**: Required

#### `POST /api/battler/runs/[runId]/abandon`
- **Purpose**: Abandon current run
- **Response**: Success
- **Auth**: Required

---

## UI/UX Flow

### Route Structure

```
/battler
  ├── /battler (main hub)
  ├── /battler/cards (card catalog - all cards)
  ├── /battler/collection (my collected cards)
  ├── /battler/deck-builder (build/edit decks)
  ├── /battler/play (active run view)
  └── /battler/history (past runs)
```

### Page 1: Main Hub (`/battler`)

**Layout:**
- Header: User stats (total cards, runs completed, win rate)
- "Claim Cards" button (checks for new wins)
- Active run section (if any)
- Deck selection (quick start with active deck)
- Recent runs list

**Features:**
- Big "Start Run" button (uses active deck)
- "Claim Cards" button with notification badge
- Stats dashboard

### Page 2: Card Catalog (`/battler/cards`)

**Layout:**
- Grid of all 120+ hero cards
- Filter by: Card Type, Rarity, Primary Attribute
- Search by hero name
- Card detail modal on click

**Card Display:**
- Hero portrait
- Card name, type, rarity
- Cost, Attack, Defense
- Ability description
- "Owned" badge if user has it

### Page 3: Collection (`/battler/collection`)

**Layout:**
- Grid of user's collected cards
- Group by hero, show quantity at each rarity
- Sort by: Name, Total quantity, Highest rarity
- Show quantities: "3 COMMON, 1 UNCOMMON, 0 RARE, 0 LEGENDARY"

**Features:**
- "Add to Deck" quick action (select which rarity to add)
- "Forge" button (if 3+ copies available at a rarity)
- Card detail view with forge requirements
- Quantity display per rarity

### Page 4: Deck Builder (`/battler/deck-builder`)

**Layout:**
- Left: Available cards from collection (searchable/filterable)
- Right: Deck slots (10 slots, drag-and-drop)
- Top: Deck name, save button, set active button

**Features:**
- Drag cards from collection to deck
- Reorder cards in deck
- Remove cards (drag out or click X)
- Validation: Max 10 cards, must have cards to save
- Deck list sidebar (switch between decks)

### Page 5: Battle View (`/battler/play`)

**Layout:**
```
┌─────────────────────────────────────┐
│  Floor 3 | Health: 45/80 | Energy: 3│
├─────────────────────────────────────┤
│                                     │
│         ENEMY: Dire Wolf            │
│         Health: 120/150             │
│         Intent: [Attack 15]         │
│                                     │
├─────────────────────────────────────┤
│  HAND (5 cards)                     │
│  [Card] [Card] [Card] [Card] [Card] │
├─────────────────────────────────────┤
│  DECK: 8 cards remaining            │
│  DISCARD: 2 cards                   │
└─────────────────────────────────────┘
```

**Features:**
- Turn-based combat
- Play cards by clicking (energy validation)
- Enemy intent preview
- Health bars with animations
- Card hover tooltips
- End turn button
- Flee option (abandon encounter)

**Battle Flow:**
1. Draw 5 cards from deck
2. Player plays cards (spend energy)
3. Apply effects (damage, block, etc.)
4. Enemy action (based on AI pattern)
5. Check win/loss
6. If win: Choose reward, proceed to next floor
7. If loss: End run, show summary

### Page 6: Run History (`/battler/history`)

**Layout:**
- List of past runs
- Filters: Status, Date range
- Run details: Floor reached, cards used, enemies defeated
- Replay option (view turn-by-turn log)

---

## Card Game Mechanics

### Core Mechanics (Slay the Spire inspired)

#### Energy System
- Start with 3 energy per turn
- Cards cost 1-3 energy
- Some cards may grant energy

#### Card Types

**ATTACK Cards:**
- Deal damage to enemy
- Examples:
  - "Pudge Hook" (2 cost, 12 damage)
  - "Sven Storm Hammer" (1 cost, 8 damage, stun)

**DEFENSE Cards:**
- Gain block (reduces incoming damage)
- Examples:
  - "Axe Berserker's Call" (1 cost, 8 block, retaliation damage)
  - "Omniknight Guardian Angel" (2 cost, 15 block)

**SKILL Cards:**
- Utility effects
- Examples:
  - "Crystal Maiden Frostbite" (1 cost, apply Weak)
  - "Invoker Quas" (0 cost, draw 1 card)

**POWER Cards:**
- Persistent effects (last entire combat)
- Examples:
  - "Drow Ranger Marksmanship" (2 cost, +2 attack per turn)
  - "Zeus Thundergod's Wrath" (3 cost, deal 5 damage to all enemies each turn)

#### Status Effects

**Player Buffs:**
- Strength (+1 attack per stack)
- Dexterity (+1 block per stack)
- Focus (+1 energy per stack)

**Player Debuffs:**
- Weak (deal 25% less damage)
- Vulnerable (take 50% more damage)
- Frail (gain 25% less block)

**Enemy Status:**
- Poison (take damage at end of turn)
- Burn (take damage each turn)
- Stun (skip next turn)

#### Enemy AI Patterns

**Simple Enemies:**
- Pattern: Attack every turn
- Variant: Attack 2 turns, then big attack

**Elite Enemies:**
- Pattern: Cycle through abilities
- Example: Attack → Buff Self → Big Attack → Repeat

**Bosses:**
- Multi-phase fights
- Unique mechanics per boss
- Example: "Roshan" - Gains strength each turn, enrages at 50% health

#### Progression System

**Floors:**
- 10 floors per run (configurable)
- Floor 3, 6, 9: Elite enemies
- Floor 10: Boss
- Floors 2, 5, 8: Events/Shops (future)

**Rewards:**
- Gold (for future shop system)
- Card upgrades (future)
- New cards (future)

---

## Card Design Philosophy

### Hero → Card Translation

Each Dota hero becomes a unique card based on their:
- **Lore/Theme**: Card name and flavor
- **Abilities**: Card effects mirror hero abilities
- **Role**: Influences card type (carry = attack, support = skill, etc.)
- **Primary Attribute**: Affects card stats/rarity

### Example Cards

#### Pudge - "The Butcher" (RARE)
- **Type**: ATTACK
- **Cost**: 2
- **Attack**: 12
- **Effect**: "If this kills an enemy, gain 5 Strength"
- **Flavor**: "Fresh meat!"

#### Crystal Maiden - "Frostbite" (COMMON)
- **Type**: SKILL
- **Cost**: 1
- **Effect**: "Apply 2 Weak to target enemy. Draw 1 card."
- **Flavor**: "The cold never bothered me anyway."

#### Axe - "Berserker's Call" (COMMON)
- **Type**: DEFENSE
- **Cost**: 1
- **Defense**: 8
- **Effect**: "When you take damage this turn, deal 2 damage to attacker"
- **Flavor**: "Axe is Axe!"

#### Invoker - "Quas Wex Exort" (LEGENDARY)
- **Type**: POWER
- **Cost**: 3
- **Effect**: "At start of turn, choose: Deal 8 damage, Gain 8 block, or Draw 2 cards"
- **Flavor**: "The elements obey me."

### Rarity Distribution

- **COMMON** (60%): Basic effects, low stats
- **UNCOMMON** (25%): Better stats, simple combos
- **RARE** (12%): Strong effects, unique mechanics
- **LEGENDARY** (3%): Game-changing effects

### Balancing Considerations

- Energy costs should create interesting decisions
- No card should be auto-include in every deck
- Synergies between cards should be rewarding
- Power level should scale with rarity but not be oppressive

---

## Implementation Phases

**Note**: See [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) for detailed incremental development strategy with bite-sized, testable components.

### High-Level Overview

**Phase 0: Foundation & Setup**
- Project structure, test framework, database setup

**Phase 1: Core Utilities**
- Enums, types, card stat calculations, performance scoring, status effects

**Phase 2: Database & Data Layer**
- Schema, seed data (127 heroes × 4 rarities = 508 cards), data access functions

**Phase 3: Business Logic**
- Card claiming, forge system, deck management, battle state, enemy AI

**Phase 4: API Layer**
- RESTful endpoints for cards, collection, claiming, forge, decks, battles

**Phase 5: UI Components**
- Reusable Svelte components (Card, Collection, Forge, Deck Builder, Battle)

**Phase 6: Pages & Routes**
- Complete user-facing pages (/battler/cards, /battler/collection, etc.)

**Phase 7: Integration & Polish**
- End-to-end integration, status effects UI, enemy visualization, run history

Each phase is broken down into small milestones that can be built and tested independently.

---

## Technical Considerations

### Performance
- Battle state should be server-side (prevent cheating)
- Cache card definitions (rarely change)
- Optimize deck queries (include cards in single query)

### Security
- Validate all battle actions server-side
- Prevent energy/damage manipulation
- Rate limit battle actions

### Scalability
- Battle logic could be moved to background jobs for complex calculations
- Consider WebSocket for real-time battle updates (future)

---

## Card Acquisition & Forge System

### How Cards Are Awarded

**Every win = COMMON cards awarded (quantity based on performance)**
- User wins a Dota match with a hero
- System calculates match performance percentile (compared to user's match history)
- Awards 1-4 COMMON copies based on performance:
  - **Top 5%**: 4 COMMON copies
  - **Top 20%**: 3 COMMON copies
  - **Top 50%**: 2 COMMON copies
  - **Bottom 50%**: 1 COMMON copy
- All cards start as COMMON - rarity is upgraded through forging

### Performance-Based Copy Rewards

**Performance Percentile Calculation:**
```
1. Calculate performance score for the match
2. Compare to user's historical match performance
3. Determine percentile ranking
4. Award copies based on percentile
```

**Performance Score Formula:**
```
Score = (KDA × 0.4) + (Damage/20000 × 0.3) + (Healing/10000 × 0.2) + (NetWorth/15000 × 0.1)
```

**Copy Rewards:**
- **Top 5%** (95th percentile+): 4 COMMON copies
- **Top 20%** (80th-94th percentile): 3 COMMON copies
- **Top 50%** (50th-79th percentile): 2 COMMON copies
- **Bottom 50%** (0-49th percentile): 1 COMMON copy

### Forge System

**Rarity is upgraded through forging, not match performance**

**Forge Requirements:**
- **3 COMMON** → **1 UNCOMMON**
- **3 UNCOMMON** → **1 RARE**
- **3 RARE** → **1 LEGENDARY**

**Total Cards Needed for LEGENDARY:**
- 3 COMMON → 1 UNCOMMON
- 3 UNCOMMON (9 COMMON) → 1 RARE
- 3 RARE (27 COMMON) → 1 LEGENDARY
- **Total: 27 COMMON cards = 1 LEGENDARY card**

**Forge Process:**
1. User selects a card and target rarity
2. System checks if user has 3 copies of the lower rarity
3. Deducts 3 copies, creates 1 of higher rarity
4. Creates `ForgeOperation` record for tracking

### Card Versions by Rarity

Each hero has **4 different card versions** (one per rarity) with different effects and stats. **"Cost" refers to energy cost** - the amount of energy required to play the card during battle (players start with 3 energy per turn).

**Rarity Card Versions:**

- **COMMON**: Basic version
  - **Effects**: None (just attack or block)
  - **Stats**: Base attack/defense, base cost
  - **Example**: "Pudge Hook" - 2 cost, 12 damage, no special effect
  
- **UNCOMMON**: Gains weak hero power
  - **Effects**: Weak version of hero's unique ability
  - **Stats**: Same cost, same or slightly better attack/defense
  - **Example**: "Pudge Hook" - 2 cost, 12 damage, "If this kills an enemy, gain 2 Strength" (weak version)
  
- **RARE**: Stronger hero power + stat boost
  - **Effects**: Stronger version of hero's unique ability
  - **Stats**: Same cost, +50% attack/defense
  - **Example**: "Pudge Hook" - 2 cost, 18 damage (+50%), "If this kills an enemy, gain 5 Strength" (stronger)
  
- **LEGENDARY**: Strongest hero power + stat boost + cost reduction
  - **Effects**: Strongest version of hero's unique ability
  - **Stats**: -1 cost (minimum 1), +100% attack/defense
  - **Example**: "Pudge Hook" - 1 cost (-1), 24 damage (+100%), "If this kills an enemy, gain 8 Strength" (strongest)

**Key Differences:**
- **COMMON**: Pure stats, no effects
- **UNCOMMON**: Adds hero power (weak version)
- **RARE**: Stronger hero power + better stats
- **LEGENDARY**: Strongest hero power + best stats + cost reduction

### Examples

**Example 1: Card Acquisition**
- User wins with Pudge: 15 kills, 3 deaths, 10 assists, 25k damage
- Performance score: 3.7
- Percentile: Top 20% (compared to user's history)
- **Reward**: 3 COMMON Pudge cards added to collection

**Example 2: Forging Process (COMMON → UNCOMMON)**
- User has 5 COMMON Pudge cards
- User forges: 3 COMMON → 1 UNCOMMON
- **Result**: 2 COMMON remaining, 1 UNCOMMON created
- **COMMON Pudge**: 2 cost, 12 damage, no effect
- **UNCOMMON Pudge**: 2 cost, 12 damage, "If this kills an enemy, gain 2 Strength" (weak hero power)

**Example 3: Forging Process (UNCOMMON → RARE)**
- User has 3 UNCOMMON Pudge cards
- User forges: 3 UNCOMMON → 1 RARE
- **Result**: 0 UNCOMMON remaining, 1 RARE created
- **RARE Pudge**: 2 cost, 18 damage (+50%), "If this kills an enemy, gain 5 Strength" (stronger hero power)

**Example 4: Creating a LEGENDARY**
- User needs 27 COMMON cards total
- Forge path: 27 COMMON → 9 UNCOMMON → 3 RARE → 1 LEGENDARY
- **LEGENDARY Pudge**: 1 cost (-1), 24 damage (+100%), "If this kills an enemy, gain 8 Strength" (strongest hero power)

**Why Lower Cost is Better:**
- With 3 energy per turn, a 1-cost card can be played 3 times
- A 2-cost card can only be played once (with 1 energy left)
- Lower cost = more flexibility and combo potential

## Design Decisions (Resolved)

1. ✅ **Card Acquisition**: Every win awards cards, users can claim any past games
   - Uses Stratz API for performance comparison against hero averages
   - Manual claiming (users visit site to claim)

2. ✅ **Deck Size**: Fixed 10 cards, max 5 decks per user

3. ✅ **Run Persistence**: Full battle state persisted after each action
   - Users can leave and resume at any time
   - State stored in `BattlerRun.battleState` JSONB field

4. ✅ **Difficulty Scaling**: 
   - Target: ~100 matches (50 wins at 50% win rate) to beat final level
   - Simple deterministic enemies to start
   - Fixed encounters to start (can add variety later)

5. ✅ **Forge System**:
   - Single card forge (no batch operations)
   - No quantity caps (users can accumulate unlimited cards)
   - Dismantle feature (reverse forge: 1 higher → 3 lower)
   - Cards removed from active decks when forged

6. ✅ **Battle System**:
   - Deterministic (but not obvious to users)
   - Full state persistence after each action
   - Server-side calculations (SvelteKit server functions)
   - Status effects stack infinitely

7. ✅ **Effects System**:
   - Extensible JSONB structure for future effects
   - Graceful degradation (cards can be played even if effect does nothing)
   - Display with icons and colors for game-like feel

8. ✅ **User Experience**:
   - Mobile-first design (scalable to desktop)
   - Simple fade animations
   - Separate feature with nav icon
   - New users initialized with base game

9. ✅ **Testing**:
   - Deterministic battles aid testing
   - Test mode for robust testing
   - Seed database once with all 127 × 4 cards

10. ✅ **Future Features**:
    - Design for extensibility (shops, events, etc.)
    - Card balance updates via database updates
    - Leaderboard similar to Turbotown leagues

---

## Next Steps

1. ✅ Review and refine this plan
2. ✅ Create detailed card designs for all 127 heroes (see HERO_SPECIFICS.md)
3. ✅ Design enemy AI patterns (see BATTLE_MECHANICS.md)
4. ✅ Create testing strategy (see TESTING_STRATEGY.md)
5. ✅ Create development roadmap (see DEVELOPMENT_ROADMAP.md)
6. ✅ Resolve critical design questions (see PRE_DEVELOPMENT_QUESTIONS.md)
7. ✅ **Phase 0: Foundation & Setup** - COMPLETE (see [phase-0/PHASE_0_COMPLETE.md](./phase-0/PHASE_0_COMPLETE.md))
8. **Phase 1.1**: Add enums and types to Prisma schema
9. Create database migration for card battler models
10. Build MVP following incremental roadmap
11. Playtest and iterate

## Development Approach

**See [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) for detailed incremental development strategy.**

The system will be built in small, testable, reusable components:
- **Foundation first**: Types, utilities, data models
- **Business logic**: Core game mechanics
- **API layer**: RESTful endpoints
- **UI components**: Reusable Svelte components
- **Pages**: Complete user-facing pages
- **Integration**: Polish and end-to-end testing

Each component is designed to work independently and be fully tested before moving to the next.
