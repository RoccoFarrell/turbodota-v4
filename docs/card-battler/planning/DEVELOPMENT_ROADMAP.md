# Development Roadmap - Incremental Build Strategy

This document breaks down the card battler feature into small, testable, reusable components that can be built incrementally. Each component is designed to work independently and be testable before moving to the next.

**Progress Tracking**: See [PROGRESS.md](./PROGRESS.md) for milestone completion status.

## Development Philosophy

### Core Principles

1. **Build Small, Test Often** - Each component should be fully functional and tested before moving on
2. **Reusable Components** - Design components that can be reused across the system
3. **Incremental Value** - Each milestone should deliver working functionality
4. **Isolated Testing** - Components should be testable in isolation
5. **Clear Dependencies** - Understand what each component depends on

### Component Hierarchy

```
Foundation Layer (No dependencies)
  ↓
Data Layer (Depends on Foundation)
  ↓
Business Logic Layer (Depends on Data)
  ↓
API Layer (Depends on Business Logic)
  ↓
UI Layer (Depends on API)
```

---

## Phase 0: Foundation & Setup

**Goal**: Set up the development environment and foundational utilities

### Milestone 0.1: Project Structure ✅
- [x] Create documentation folder structure
- [x] Define database schema
- [x] Plan API structure
- [ ] Set up test framework (Vitest)
- [ ] Configure test database

**Deliverable**: Project structure ready for development

**Testing**: Verify test framework runs successfully

---

## Phase 1: Core Data Models & Utilities

**Goal**: Build the foundational data structures and utility functions

### Milestone 1.1: Enums & Types
**Dependencies**: None

**Components**:
- [ ] Define `Rarity` enum (COMMON, UNCOMMON, RARE, LEGENDARY)
- [ ] Define `CardType` enum (ATTACK, DEFENSE, SKILL, POWER)
- [ ] Define TypeScript types for cards, battles, etc.

**Files**:
- `src/lib/types/battler.ts` - Type definitions
- `prisma/schema.prisma` - Enum definitions

**Testing**:
```typescript
// Test enum values
test('Rarity enum has correct values', () => {
  expect(Rarity.COMMON).toBe('COMMON');
  expect(Rarity.UNCOMMON).toBe('UNCOMMON');
  expect(Rarity.RARE).toBe('RARE');
  expect(Rarity.LEGENDARY).toBe('LEGENDARY');
});
```

**Deliverable**: Type-safe enums and types

---

### Milestone 1.2: Card Stat Calculation Utilities
**Dependencies**: 1.1

**Components**:
- [ ] `calculateCardStats(baseCard, rarity)` - Calculate stats for rarity
- [ ] `getCardCost(baseCost, rarity)` - Calculate energy cost
- [ ] `getCardAttack(baseAttack, rarity)` - Calculate attack value
- [ ] `getCardDefense(baseDefense, rarity)` - Calculate defense value

**Files**:
- `src/lib/utils/cardStats.ts`

**Testing**:
```typescript
test('calculates COMMON card stats correctly', () => {
  const stats = calculateCardStats({ cost: 2, attack: 10, defense: 0 }, 'COMMON');
  expect(stats.cost).toBe(2);
  expect(stats.attack).toBe(10);
  expect(stats.defense).toBe(0);
});

test('calculates RARE card stats with +50% boost', () => {
  const stats = calculateCardStats({ cost: 2, attack: 10, defense: 8 }, 'RARE');
  expect(stats.attack).toBe(15); // 10 * 1.5
  expect(stats.defense).toBe(12); // 8 * 1.5
});

test('calculates LEGENDARY card with cost reduction', () => {
  const stats = calculateCardStats({ cost: 2, attack: 10, defense: 0 }, 'LEGENDARY');
  expect(stats.cost).toBe(1); // 2 - 1
  expect(stats.attack).toBe(20); // 10 * 2
});
```

**Deliverable**: Reusable card stat calculation functions

---

### Milestone 1.3: Performance Score Calculation
**Dependencies**: 1.1

**Components**:
- [ ] `calculatePerformanceScore(matchStats)` - Calculate score from match data
- [ ] `calculatePercentile(score, history)` - Calculate percentile rank
- [ ] `calculateCopiesAwarded(percentile)` - Determine copies based on percentile

**Files**:
- `src/lib/utils/performance.ts`

**Testing**:
```typescript
test('calculates performance score correctly', () => {
  const matchStats = {
    kills: 10,
    deaths: 2,
    assists: 15,
    hero_damage: 25000,
    hero_healing: 5000,
    net_worth: 20000
  };
  
  const score = calculatePerformanceScore(matchStats);
  expect(score).toBeGreaterThan(0);
  expect(typeof score).toBe('number');
});

test('awards 4 copies for top 5%', () => {
  const copies = calculateCopiesAwarded(97); // 97th percentile
  expect(copies).toBe(4);
});

test('awards 1 copy for bottom 50%', () => {
  const copies = calculateCopiesAwarded(30); // 30th percentile
  expect(copies).toBe(1);
});
```

**Deliverable**: Performance calculation utilities

---

### Milestone 1.4: Status Effect Utilities
**Dependencies**: 1.1

**Components**:
- [ ] `applyStatusEffect(target, effect, value)` - Apply status effect
- [ ] `processStatusEffects(target)` - Process end-of-turn effects
- [ ] `decayStatusEffects(target)` - Reduce status effect stacks
- [ ] `hasStatusEffect(target, effect)` - Check if target has effect

**Files**:
- `src/lib/utils/statusEffects.ts`

**Testing**:
```typescript
test('applies status effect correctly', () => {
  const enemy = { statusEffects: {} };
  applyStatusEffect(enemy, 'POISON', 3);
  expect(enemy.statusEffects.POISON).toBe(3);
});

test('status effects decay at end of turn', () => {
  const enemy = { statusEffects: { POISON: 3, BURN: 2 } };
  decayStatusEffects(enemy);
  expect(enemy.statusEffects.POISON).toBe(2);
  expect(enemy.statusEffects.BURN).toBe(1);
});

test('removes expired status effects', () => {
  const enemy = { statusEffects: { POISON: 1 } };
  decayStatusEffects(enemy);
  expect(enemy.statusEffects.POISON).toBeUndefined();
});
```

**Deliverable**: Status effect management utilities

---

## Phase 2: Database & Data Layer

**Goal**: Set up database models and data access layer

### Milestone 2.1: Database Schema
**Dependencies**: 1.1

**Components**:
- [ ] Create Prisma schema for all models
- [ ] Define relationships and constraints
- [ ] Create migration file
- [ ] Run migration on test database

**Files**:
- `prisma/schema.prisma` - All BattlerCard models

**Testing**:
```typescript
test('database schema is valid', async () => {
  // Verify schema compiles
  const schema = await readPrismaSchema();
  expect(schema).toBeDefined();
});

test('can create BattlerCard', async () => {
  const card = await prisma.battlerCard.create({
    data: {
      heroId: 1,
      rarity: 'COMMON',
      name: 'Test Card',
      cost: 2,
      attack: 10,
      defense: 0,
      cardType: 'ATTACK',
      effects: '[]',
      description: 'Test'
    }
  });
  expect(card.id).toBeDefined();
});
```

**Deliverable**: Working database schema

---

### Milestone 2.2: Card Seed Data
**Dependencies**: 2.1

**Components**:
- [ ] Create seed script for all 127 heroes × 4 rarities
- [ ] Generate base card data from HERO_SPECIFICS.md
- [ ] Seed test database

**Files**:
- `prisma/seed/battlerCards.ts`
- `prisma/seed.ts` - Update to include battler cards

**Testing**:
```typescript
test('seeds all 127 heroes', async () => {
  const heroes = await prisma.hero.findMany();
  const cards = await prisma.battlerCard.findMany({
    where: { rarity: 'COMMON' }
  });
  expect(cards.length).toBe(127);
});

test('each hero has 4 rarities', async () => {
  const heroId = 1;
  const cards = await prisma.battlerCard.findMany({
    where: { heroId }
  });
  expect(cards.length).toBe(4);
  expect(cards.map(c => c.rarity).sort()).toEqual(['COMMON', 'LEGENDARY', 'RARE', 'UNCOMMON']);
});
```

**Deliverable**: Complete card database

---

### Milestone 2.3: Data Access Layer
**Dependencies**: 2.1, 2.2

**Components**:
- [ ] `getBattlerCard(heroId, rarity)` - Get card definition
- [ ] `getAllBattlerCards()` - Get all cards
- [ ] `getUserCollection(userId)` - Get user's cards
- [ ] `addCardsToCollection(userId, cardId, quantity)` - Add cards
- [ ] `removeCardsFromCollection(userId, cardId, quantity)` - Remove cards

**Files**:
- `src/lib/server/db/battlerCards.ts`
- `src/lib/server/db/userCollection.ts`

**Testing**:
```typescript
test('gets card by hero and rarity', async () => {
  const card = await getBattlerCard(1, 'COMMON');
  expect(card.heroId).toBe(1);
  expect(card.rarity).toBe('COMMON');
});

test('adds cards to collection', async () => {
  const userId = 'test-user';
  const card = await getBattlerCard(1, 'COMMON');
  await addCardsToCollection(userId, card.id, 3);
  
  const collection = await getUserCollection(userId);
  const userCard = collection.find(c => c.cardId === card.id);
  expect(userCard.quantity).toBe(3);
});
```

**Deliverable**: Data access functions

---

## Phase 3: Business Logic Layer

**Goal**: Build core game logic that doesn't depend on API/UI

### Milestone 3.1: Card Claiming Logic
**Dependencies**: 1.3, 2.3

**Components**:
- [ ] `findUnclaimedMatches(userId)` - Find matches that haven't been claimed
- [ ] `claimCardsForMatch(userId, matchId)` - Claim cards for a match
- [ ] `calculateMatchRewards(matchStats, userHistory)` - Calculate rewards

**Files**:
- `src/lib/server/battler/cardClaiming.ts`

**Testing**:
```typescript
test('finds unclaimed matches', async () => {
  const userId = 'test-user';
  const matches = await findUnclaimedMatches(userId);
  expect(Array.isArray(matches)).toBe(true);
});

test('claims cards for won match', async () => {
  const userId = 'test-user';
  const match = createWonMatch({ heroId: 1 });
  
  const result = await claimCardsForMatch(userId, match.id);
  expect(result.cardsAwarded).toBeGreaterThan(0);
  expect(result.cards[0].heroId).toBe(1);
  expect(result.cards[0].rarity).toBe('COMMON');
});
```

**Deliverable**: Card claiming logic

---

### Milestone 3.2: Forge System Logic
**Dependencies**: 2.3

**Components**:
- [ ] `canForge(userId, heroId, fromRarity, toRarity)` - Check if forge is possible
- [ ] `getForgeRequirements(heroId, fromRarity, toRarity)` - Get requirements
- [ ] `forgeCards(userId, heroId, fromRarity, toRarity)` - Execute forge

**Files**:
- `src/lib/server/battler/forge.ts`

**Testing**:
```typescript
test('checks forge requirements', async () => {
  const userId = 'test-user';
  await addCardsToCollection(userId, { heroId: 1, rarity: 'COMMON', quantity: 3 });
  
  const canForge = await canForge(userId, 1, 'COMMON', 'UNCOMMON');
  expect(canForge).toBe(true);
});

test('forges 3 COMMON to 1 UNCOMMON', async () => {
  const userId = 'test-user';
  await addCardsToCollection(userId, { heroId: 1, rarity: 'COMMON', quantity: 3 });
  
  const result = await forgeCards(userId, 1, 'COMMON', 'UNCOMMON');
  expect(result.success).toBe(true);
  
  const collection = await getUserCollection(userId);
  const common = collection.find(c => c.heroId === 1 && c.rarity === 'COMMON');
  const uncommon = collection.find(c => c.heroId === 1 && c.rarity === 'UNCOMMON');
  expect(common.quantity).toBe(0);
  expect(uncommon.quantity).toBe(1);
});
```

**Deliverable**: Forge system logic

---

### Milestone 3.3: Deck Management Logic
**Dependencies**: 2.3

**Components**:
- [ ] `createDeck(userId, name, cardIds)` - Create deck
- [ ] `validateDeck(cardIds)` - Validate deck (max 10 cards, user owns cards)
- [ ] `getUserDecks(userId)` - Get all user decks
- [ ] `updateDeck(deckId, cardIds)` - Update deck
- [ ] `deleteDeck(deckId)` - Delete deck

**Files**:
- `src/lib/server/battler/decks.ts`

**Testing**:
```typescript
test('creates valid deck', async () => {
  const userId = 'test-user';
  const cardIds = [/* 10 card IDs user owns */];
  
  const deck = await createDeck(userId, 'Test Deck', cardIds);
  expect(deck.cards.length).toBe(10);
});

test('rejects deck with more than 10 cards', async () => {
  const userId = 'test-user';
  const cardIds = [/* 11 card IDs */];
  
  await expect(createDeck(userId, 'Test Deck', cardIds))
    .rejects.toThrow('Deck cannot exceed 10 cards');
});
```

**Deliverable**: Deck management logic

---

### Milestone 3.4: Battle State Management
**Dependencies**: 1.4, 2.3

**Components**:
- [ ] `createBattleState(deck, enemy)` - Initialize battle
- [ ] `startTurn(battleState)` - Start new turn (draw cards, restore energy)
- [ ] `playCard(battleState, cardId, target)` - Play a card
- [ ] `endTurn(battleState)` - End turn (process effects)
- [ ] `checkBattleEnd(battleState)` - Check win/loss

**Files**:
- `src/lib/server/battler/battleState.ts`

**Testing**:
```typescript
test('creates battle state correctly', () => {
  const deck = createTestDeck();
  const enemy = createTestEnemy();
  const battle = createBattleState(deck, enemy);
  
  expect(battle.player.health).toBeGreaterThan(0);
  expect(battle.enemies.length).toBeGreaterThan(0);
  expect(battle.currentEnergy).toBe(3);
});

test('plays card and consumes energy', () => {
  const battle = createBattleState(deck, enemy);
  const card = battle.playerHand[0];
  const initialEnergy = battle.currentEnergy;
  
  playCard(battle, card.id, enemy.id);
  
  expect(battle.currentEnergy).toBe(initialEnergy - card.cost);
});
```

**Deliverable**: Battle state management

---

### Milestone 3.5: Enemy AI Logic
**Dependencies**: 3.4

**Components**:
- [ ] `getEnemyAction(enemy, battleState)` - Get enemy's action
- [ ] `executeEnemyAction(battleState, enemy, action)` - Execute action
- [ ] AI patterns: SIMPLE, CHARGE, DEFENSIVE, DEBUFF, BUFF, CYCLE

**Files**:
- `src/lib/server/battler/enemyAI.ts`

**Testing**:
```typescript
test('SIMPLE AI attacks every turn', () => {
  const enemy = createEnemy({ aiPattern: 'SIMPLE' });
  const battle = createBattleState(deck, enemy);
  const initialHealth = battle.player.health;
  
  const action = getEnemyAction(enemy, battle);
  executeEnemyAction(battle, enemy, action);
  
  expect(battle.player.health).toBeLessThan(initialHealth);
});

test('CHARGE AI builds up for big attack', () => {
  const enemy = createEnemy({ aiPattern: 'CHARGE' });
  const battle = createBattleState(deck, enemy);
  
  // First turn: charge
  const action1 = getEnemyAction(enemy, battle);
  expect(action1.type).toBe('CHARGE');
  
  // Second turn: big attack
  const action2 = getEnemyAction(enemy, battle);
  expect(action2.type).toBe('ATTACK');
  expect(action2.damage).toBeGreaterThan(enemy.baseAttack);
});
```

**Deliverable**: Enemy AI system

---

## Phase 4: API Layer

**Goal**: Build RESTful API endpoints

### Milestone 4.1: Card Catalog API
**Dependencies**: 2.3

**Components**:
- [ ] `GET /api/battler/cards` - List all cards
- [ ] `GET /api/battler/cards/[cardId]` - Get card details
- [ ] `GET /api/battler/cards/hero/[heroId]` - Get cards for hero

**Files**:
- `src/routes/api/battler/cards/+server.ts`
- `src/routes/api/battler/cards/[cardId]/+server.ts`
- `src/routes/api/battler/cards/hero/[heroId]/+server.ts`

**Testing**:
```typescript
test('GET /api/battler/cards returns all cards', async () => {
  const response = await fetch('/api/battler/cards');
  const cards = await response.json();
  expect(cards.length).toBe(127 * 4); // 508 cards
});

test('GET /api/battler/cards/[cardId] returns card details', async () => {
  const card = await getBattlerCard(1, 'COMMON');
  const response = await fetch(`/api/battler/cards/${card.id}`);
  const cardData = await response.json();
  expect(cardData.heroId).toBe(1);
  expect(cardData.rarity).toBe('COMMON');
});
```

**Deliverable**: Card catalog API

---

### Milestone 4.2: Collection API
**Dependencies**: 2.3

**Components**:
- [ ] `GET /api/battler/collection` - Get user's collection
- [ ] `GET /api/battler/collection/stats` - Get collection statistics

**Files**:
- `src/routes/api/battler/collection/+server.ts`
- `src/routes/api/battler/collection/stats/+server.ts`

**Testing**:
```typescript
test('GET /api/battler/collection returns user cards', async () => {
  const userId = 'test-user';
  await addCardsToCollection(userId, { heroId: 1, rarity: 'COMMON', quantity: 5 });
  
  const response = await fetch('/api/battler/collection', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const collection = await response.json();
  expect(collection.length).toBeGreaterThan(0);
});
```

**Deliverable**: Collection API

---

### Milestone 4.3: Card Claiming API
**Dependencies**: 3.1

**Components**:
- [ ] `POST /api/battler/cards/claim` - Claim cards for matches
- [ ] `GET /api/battler/cards/claim/status` - Get claim status

**Files**:
- `src/routes/api/battler/cards/claim/+server.ts`
- `src/routes/api/battler/cards/claim/status/+server.ts`

**Testing**:
```typescript
test('POST /api/battler/cards/claim claims cards', async () => {
  const response = await fetch('/api/battler/cards/claim', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const result = await response.json();
  expect(result.cardsAwarded).toBeGreaterThan(0);
});
```

**Deliverable**: Card claiming API

---

### Milestone 4.4: Forge API
**Dependencies**: 3.2

**Components**:
- [ ] `POST /api/battler/forge` - Execute forge
- [ ] `GET /api/battler/forge/requirements/[cardId]` - Get forge requirements

**Files**:
- `src/routes/api/battler/forge/+server.ts`
- `src/routes/api/battler/forge/requirements/[cardId]/+server.ts`

**Testing**:
```typescript
test('POST /api/battler/forge forges cards', async () => {
  await addCardsToCollection(userId, { heroId: 1, rarity: 'COMMON', quantity: 3 });
  
  const response = await fetch('/api/battler/forge', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      heroId: 1,
      fromRarity: 'COMMON',
      toRarity: 'UNCOMMON'
    })
  });
  const result = await response.json();
  expect(result.success).toBe(true);
});
```

**Deliverable**: Forge API

---

### Milestone 4.5: Deck API
**Dependencies**: 3.3

**Components**:
- [ ] `GET /api/battler/decks` - List user's decks
- [ ] `POST /api/battler/decks` - Create deck
- [ ] `PUT /api/battler/decks/[deckId]` - Update deck
- [ ] `DELETE /api/battler/decks/[deckId]` - Delete deck

**Files**:
- `src/routes/api/battler/decks/+server.ts`
- `src/routes/api/battler/decks/[deckId]/+server.ts`

**Deliverable**: Deck API

---

### Milestone 4.6: Battle API
**Dependencies**: 3.4, 3.5

**Components**:
- [ ] `POST /api/battler/runs` - Start new run
- [ ] `GET /api/battler/runs/[runId]` - Get run state
- [ ] `POST /api/battler/runs/[runId]/play-card` - Play card
- [ ] `POST /api/battler/runs/[runId]/end-turn` - End turn
- [ ] `POST /api/battler/runs/[runId]/complete` - Complete encounter

**Files**:
- `src/routes/api/battler/runs/+server.ts`
- `src/routes/api/battler/runs/[runId]/+server.ts`
- `src/routes/api/battler/runs/[runId]/play-card/+server.ts`
- `src/routes/api/battler/runs/[runId]/end-turn/+server.ts`

**Deliverable**: Battle API

---

## Phase 5: UI Components

**Goal**: Build reusable UI components

### Milestone 5.1: Card Display Components
**Dependencies**: 4.1

**Components**:
- [ ] `Card.svelte` - Display single card
- [ ] `CardList.svelte` - Display list of cards
- [ ] `CardGrid.svelte` - Display cards in grid
- [ ] `CardTooltip.svelte` - Card hover tooltip

**Files**:
- `src/lib/components/battler/Card.svelte`
- `src/lib/components/battler/CardList.svelte`
- `src/lib/components/battler/CardGrid.svelte`
- `src/lib/components/battler/CardTooltip.svelte`

**Testing**:
- Visual testing: Render cards with different rarities
- Interaction testing: Hover, click events

**Deliverable**: Reusable card display components

---

### Milestone 5.2: Collection UI Components
**Dependencies**: 4.2, 5.1

**Components**:
- [ ] `CollectionView.svelte` - Main collection view
- [ ] `CollectionFilter.svelte` - Filter by hero/rarity
- [ ] `CollectionStats.svelte` - Display collection statistics

**Files**:
- `src/lib/components/battler/CollectionView.svelte`
- `src/lib/components/battler/CollectionFilter.svelte`
- `src/lib/components/battler/CollectionStats.svelte`

**Deliverable**: Collection UI

---

### Milestone 5.3: Forge UI Components
**Dependencies**: 4.4, 5.1

**Components**:
- [ ] `ForgeButton.svelte` - Forge action button
- [ ] `ForgeModal.svelte` - Forge confirmation modal
- [ ] `ForgeRequirements.svelte` - Display forge requirements

**Files**:
- `src/lib/components/battler/ForgeButton.svelte`
- `src/lib/components/battler/ForgeModal.svelte`
- `src/lib/components/battler/ForgeRequirements.svelte`

**Deliverable**: Forge UI

---

### Milestone 5.4: Deck Builder Components
**Dependencies**: 4.5, 5.1

**Components**:
- [ ] `DeckBuilder.svelte` - Main deck builder
- [ ] `DeckSlot.svelte` - Individual deck slot
- [ ] `DeckCardSelector.svelte` - Card selection modal
- [ ] `DeckValidation.svelte` - Deck validation display

**Files**:
- `src/lib/components/battler/DeckBuilder.svelte`
- `src/lib/components/battler/DeckSlot.svelte`
- `src/lib/components/battler/DeckCardSelector.svelte`
- `src/lib/components/battler/DeckValidation.svelte`

**Deliverable**: Deck builder UI

---

### Milestone 5.5: Battle UI Components
**Dependencies**: 4.6, 5.1

**Components**:
- [ ] `BattleView.svelte` - Main battle view
- [ ] `PlayerStatus.svelte` - Player health/energy display
- [ ] `EnemyDisplay.svelte` - Enemy display
- [ ] `HandDisplay.svelte` - Player hand
- [ ] `BattleLog.svelte` - Battle action log

**Files**:
- `src/lib/components/battler/BattleView.svelte`
- `src/lib/components/battler/PlayerStatus.svelte`
- `src/lib/components/battler/EnemyDisplay.svelte`
- `src/lib/components/battler/HandDisplay.svelte`
- `src/lib/components/battler/BattleLog.svelte`

**Deliverable**: Battle UI

---

## Phase 6: Pages & Routes

**Goal**: Build complete user-facing pages

### Milestone 6.1: Card Catalog Page
**Dependencies**: 4.1, 5.1

**Components**:
- [ ] `/battler/cards` - Card catalog page
- [ ] Filter by hero, rarity, type
- [ ] Search functionality

**Files**:
- `src/routes/battler/cards/+page.svelte`
- `src/routes/battler/cards/+page.server.ts`

**Deliverable**: Card catalog page

---

### Milestone 6.2: Collection Page
**Dependencies**: 4.2, 5.2

**Components**:
- [ ] `/battler/collection` - Collection page
- [ ] Display user's cards
- [ ] Filter and sort

**Files**:
- `src/routes/battler/collection/+page.svelte`
- `src/routes/battler/collection/+page.server.ts`

**Deliverable**: Collection page

---

### Milestone 6.3: Claim Cards Page
**Dependencies**: 4.3, 5.2

**Components**:
- [ ] `/battler/claim` - Claim cards page
- [ ] Show unclaimed matches
- [ ] Claim button

**Files**:
- `src/routes/battler/claim/+page.svelte`
- `src/routes/battler/claim/+page.server.ts`

**Deliverable**: Claim cards page

---

### Milestone 6.4: Deck Builder Page
**Dependencies**: 4.5, 5.4

**Components**:
- [ ] `/battler/deck-builder` - Deck builder page
- [ ] Create/edit decks
- [ ] Save functionality

**Files**:
- `src/routes/battler/deck-builder/+page.svelte`
- `src/routes/battler/deck-builder/+page.server.ts`

**Deliverable**: Deck builder page

---

### Milestone 6.5: Battle Page
**Dependencies**: 4.6, 5.5

**Components**:
- [ ] `/battler/play` - Active battle page
- [ ] Battle UI
- [ ] Turn management

**Files**:
- `src/routes/battler/play/+page.svelte`
- `src/routes/battler/play/+page.server.ts`

**Deliverable**: Battle page

---

## Phase 7: Integration & Polish

**Goal**: Integrate all components and polish

### Milestone 7.1: End-to-End Flow
**Dependencies**: All previous milestones

**Components**:
- [ ] Test complete user journey
- [ ] Fix integration issues
- [ ] Performance optimization

**Testing**:
- Full flow: Claim → Forge → Build Deck → Battle
- Edge cases and error handling

**Deliverable**: Working end-to-end system

---

### Milestone 7.2: Status Effects UI
**Dependencies**: 5.5

**Components**:
- [ ] Status effect icons
- [ ] Status effect tooltips
- [ ] Status effect animations

**Deliverable**: Status effects UI

---

### Milestone 7.3: Enemy AI Visualization
**Dependencies**: 5.5

**Components**:
- [ ] Enemy intent display
- [ ] Enemy action preview
- [ ] Enemy pattern indicators

**Deliverable**: Enemy AI visualization

---

### Milestone 7.4: Run History
**Dependencies**: 4.6

**Components**:
- [ ] `/battler/history` - Run history page
- [ ] Run statistics
- [ ] Replay functionality

**Deliverable**: Run history

---

## Development Workflow

### For Each Milestone

1. **Plan** - Review requirements and dependencies
2. **Design** - Design component interface
3. **Implement** - Write code
4. **Test** - Write and run tests
5. **Verify** - Manual testing
6. **Document** - Update documentation
7. **Review** - Code review (if applicable)
8. **Merge** - Integrate into main branch

### Testing Strategy

- **Unit Tests**: Every utility function
- **Integration Tests**: Every API endpoint
- **Component Tests**: Every UI component
- **E2E Tests**: Every user flow

### Reusability Checklist

For each component, ask:
- [ ] Can this be reused elsewhere?
- [ ] Is the interface clear and simple?
- [ ] Are dependencies minimal?
- [ ] Is it testable in isolation?
- [ ] Is it well-documented?

---

## Dependency Graph

```
Phase 0: Foundation
  ↓
Phase 1: Core Utilities
  ├─→ 1.1 Enums & Types
  ├─→ 1.2 Card Stats (depends on 1.1)
  ├─→ 1.3 Performance (depends on 1.1)
  └─→ 1.4 Status Effects (depends on 1.1)
  ↓
Phase 2: Database
  ├─→ 2.1 Schema (depends on 1.1)
  ├─→ 2.2 Seed Data (depends on 2.1)
  └─→ 2.3 Data Access (depends on 2.1, 2.2)
  ↓
Phase 3: Business Logic
  ├─→ 3.1 Card Claiming (depends on 1.3, 2.3)
  ├─→ 3.2 Forge (depends on 2.3)
  ├─→ 3.3 Decks (depends on 2.3)
  ├─→ 3.4 Battle State (depends on 1.4, 2.3)
  └─→ 3.5 Enemy AI (depends on 3.4)
  ↓
Phase 4: API
  ├─→ 4.1 Card Catalog (depends on 2.3)
  ├─→ 4.2 Collection (depends on 2.3)
  ├─→ 4.3 Claiming (depends on 3.1)
  ├─→ 4.4 Forge (depends on 3.2)
  ├─→ 4.5 Decks (depends on 3.3)
  └─→ 4.6 Battle (depends on 3.4, 3.5)
  ↓
Phase 5: UI Components
  ├─→ 5.1 Card Display (depends on 4.1)
  ├─→ 5.2 Collection UI (depends on 4.2, 5.1)
  ├─→ 5.3 Forge UI (depends on 4.4, 5.1)
  ├─→ 5.4 Deck Builder (depends on 4.5, 5.1)
  └─→ 5.5 Battle UI (depends on 4.6, 5.1)
  ↓
Phase 6: Pages
  ├─→ 6.1 Catalog Page (depends on 4.1, 5.1)
  ├─→ 6.2 Collection Page (depends on 4.2, 5.2)
  ├─→ 6.3 Claim Page (depends on 4.3, 5.2)
  ├─→ 6.4 Deck Builder Page (depends on 4.5, 5.4)
  └─→ 6.5 Battle Page (depends on 4.6, 5.5)
  ↓
Phase 7: Integration
  └─→ All previous phases
```

---

## Milestone Checklist Template

For each milestone, use this checklist:

- [ ] **Requirements**: Requirements clearly defined
- [ ] **Dependencies**: All dependencies identified and met
- [ ] **Implementation**: Code written and working
- [ ] **Unit Tests**: All functions tested
- [ ] **Integration Tests**: API/component integration tested
- [ ] **Documentation**: Code documented
- [ ] **Manual Testing**: Manually tested functionality
- [ ] **Code Review**: Code reviewed (if applicable)
- [ ] **Merged**: Integrated into main branch

---

## Quick Start Guide

### Starting Development

1. **Begin with Phase 0** - Set up foundation
2. **Work through Phase 1** - Build utilities one at a time
3. **Test each utility** - Don't move on until it works
4. **Continue incrementally** - Follow dependency graph

### Example: Building Card Stats Utility

```typescript
// 1. Write the function
export function calculateCardStats(baseCard, rarity) {
  // Implementation
}

// 2. Write tests
test('calculates COMMON stats', () => {
  // Test
});

// 3. Run tests
npm test

// 4. Verify it works
// 5. Move to next utility
```

### Example: Building API Endpoint

```typescript
// 1. Use existing data layer
import { getAllBattlerCards } from '$lib/server/db/battlerCards';

// 2. Create endpoint
export async function GET() {
  const cards = await getAllBattlerCards();
  return json(cards);
}

// 3. Test endpoint
test('GET /api/battler/cards', async () => {
  // Test
});

// 4. Verify it works
// 5. Move to next endpoint
```

---

## Success Criteria

### For Each Component

- ✅ Works in isolation
- ✅ Has comprehensive tests
- ✅ Is well-documented
- ✅ Follows code standards
- ✅ Is reusable

### For Each Phase

- ✅ All milestones complete
- ✅ All tests passing
- ✅ Integration verified
- ✅ Ready for next phase

### For Complete System

- ✅ All phases complete
- ✅ End-to-end flow works
- ✅ Performance acceptable
- ✅ User experience polished
- ✅ Ready for production

---

## Notes

- **Don't skip tests** - Every component needs tests
- **Don't skip documentation** - Future you will thank you
- **Don't build too much at once** - Small increments are better
- **Do verify each step** - Make sure it works before moving on
- **Do reuse components** - Build once, use everywhere

This roadmap ensures we build a solid, testable, maintainable system one piece at a time.
