# Testing Strategy for Card Battler

This document outlines the comprehensive testing approach for the card battler feature, covering all complex interactions, game flows, and edge cases.

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Test Categories](#test-categories)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Battle System Testing](#battle-system-testing)
7. [Card Acquisition & Forge Testing](#card-acquisition--forge-testing)
8. [Performance Testing](#performance-testing)
9. [Edge Cases & Complex Interactions](#edge-cases--complex-interactions)
10. [Test Data Management](#test-data-management)
11. [Mocking & Test Fixtures](#mocking--test-fixtures)

---

## Testing Overview

The card battler feature involves complex interactions between:
- **Dota 2 match data** (external API)
- **Card acquisition** (performance-based rewards)
- **Forge system** (card rarity upgrades)
- **Deck building** (collection management)
- **Battle system** (turn-based combat with status effects)
- **Enemy AI** (multiple behavior patterns)

### Testing Philosophy

1. **Test in isolation** - Each component should be testable independently
2. **Test interactions** - Verify complex flows work together
3. **Test edge cases** - Handle boundary conditions and error states
4. **Test performance** - Ensure calculations are efficient
5. **Test determinism** - Battle outcomes should be reproducible for debugging

---

## Test Categories

### 1. Unit Tests
- Individual functions and methods
- Card stat calculations
- Performance score calculations
- Status effect applications
- Energy management
- Card cost validation

### 2. Integration Tests
- API endpoints
- Database operations
- Card acquisition flow
- Forge operations
- Deck management
- Battle state transitions

### 3. End-to-End Tests
- Complete game flows
- User journeys
- Multi-turn battles
- Card claiming process
- Deck building to battle

### 4. Battle System Tests
- Turn order
- Status effect stacking
- Enemy AI patterns
- Win/loss conditions
- Floor progression
- Elite and boss encounters

---

## Unit Testing

### Card Stat Calculations

**Test: Base Card Stats**
```typescript
// Test that base card stats are correct for each rarity
test('COMMON cards have base stats only', () => {
  const card = getBattlerCard(heroId, 'COMMON');
  expect(card.cost).toBe(baseCost);
  expect(card.attack).toBe(baseAttack);
  expect(card.defense).toBe(baseDefense);
  expect(card.effects).toBeNull();
});

test('UNCOMMON cards have weak effects', () => {
  const card = getBattlerCard(heroId, 'UNCOMMON');
  expect(card.effects).toBeDefined();
  expect(card.effects.length).toBeGreaterThan(0);
});

test('RARE cards have +50% stats and stronger effects', () => {
  const card = getBattlerCard(heroId, 'RARE');
  expect(card.attack).toBe(baseAttack * 1.5);
  expect(card.defense).toBe(baseDefense * 1.5);
  expect(card.effects).toBeDefined();
});

test('LEGENDARY cards have +100% stats, cost reduction, and strongest effects', () => {
  const card = getBattlerCard(heroId, 'LEGENDARY');
  expect(card.attack).toBe(baseAttack * 2);
  expect(card.defense).toBe(baseDefense * 2);
  expect(card.cost).toBeLessThanOrEqual(baseCost - 1);
  expect(card.effects).toBeDefined();
});
```

**Test: All 127 Heroes Have Cards**
```typescript
test('all 127 heroes have cards for all 4 rarities', () => {
  const allHeroes = getAllHeroes();
  expect(allHeroes.length).toBe(127);
  
  allHeroes.forEach(hero => {
    ['COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY'].forEach(rarity => {
      const card = getBattlerCard(hero.id, rarity);
      expect(card).toBeDefined();
      expect(card.heroId).toBe(hero.id);
      expect(card.rarity).toBe(rarity);
    });
  });
});
```

### Performance Score Calculations

**Test: Performance Score Formula**
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
  const expectedKDA = (10 + 15) / 2; // 12.5
  const expectedScore = 
    expectedKDA * 0.4 +
    (25000 / 20000) * 0.3 +
    (5000 / 10000) * 0.2 +
    (20000 / 15000) * 0.1;
  
  expect(score).toBeCloseTo(expectedScore, 2);
});

test('handles zero deaths in KDA calculation', () => {
  const matchStats = {
    kills: 5,
    deaths: 0,
    assists: 10,
    hero_damage: 15000,
    hero_healing: 3000,
    net_worth: 12000
  };
  
  const score = calculatePerformanceScore(matchStats);
  expect(score).toBeGreaterThan(0);
  expect(isNaN(score)).toBe(false);
});
```

### Copies Awarded Calculation

**Test: Copies Based on Percentile**
```typescript
test('awards 4 copies for top 5% performance', () => {
  const userHistory = generateMatchHistory(100); // 100 matches
  const topMatch = createTopPercentileMatch(userHistory, 0.03); // Top 3%
  
  const copies = calculateCopiesAwarded(topMatch, userHistory);
  expect(copies).toBe(4);
});

test('awards 3 copies for top 20% performance', () => {
  const userHistory = generateMatchHistory(100);
  const goodMatch = createTopPercentileMatch(userHistory, 0.15); // Top 15%
  
  const copies = calculateCopiesAwarded(goodMatch, userHistory);
  expect(copies).toBe(3);
});

test('awards 2 copies for top 50% performance', () => {
  const userHistory = generateMatchHistory(100);
  const averageMatch = createTopPercentileMatch(userHistory, 0.40); // Top 40%
  
  const copies = calculateCopiesAwarded(averageMatch, userHistory);
  expect(copies).toBe(2);
});

test('awards 1 copy for bottom 50% performance', () => {
  const userHistory = generateMatchHistory(100);
  const poorMatch = createTopPercentileMatch(userHistory, 0.60); // Top 60% (bottom 40%)
  
  const copies = calculateCopiesAwarded(poorMatch, userHistory);
  expect(copies).toBe(1);
});

test('handles user with no match history', () => {
  const firstMatch = createMatchStats();
  const copies = calculateCopiesAwarded(firstMatch, []);
  expect(copies).toBe(1); // Default to 1 copy for first match
});
```

### Status Effect Calculations

**Test: Status Effect Stacking**
```typescript
test('applies multiple status effects correctly', () => {
  const enemy = createEnemy({ health: 100 });
  
  applyStatusEffect(enemy, 'POISON', 3);
  applyStatusEffect(enemy, 'BURN', 2);
  applyStatusEffect(enemy, 'STUN', 1);
  
  expect(enemy.statusEffects.POISON).toBe(3);
  expect(enemy.statusEffects.BURN).toBe(2);
  expect(enemy.statusEffects.STUN).toBe(1);
});

test('status effects decay at end of turn', () => {
  const enemy = createEnemy({ statusEffects: { POISON: 3, BURN: 2 } });
  
  processEndOfTurn(enemy);
  
  expect(enemy.statusEffects.POISON).toBe(2);
  expect(enemy.statusEffects.BURN).toBe(1);
});

test('status effects expire when reaching 0', () => {
  const enemy = createEnemy({ statusEffects: { POISON: 1 } });
  
  processEndOfTurn(enemy);
  
  expect(enemy.statusEffects.POISON).toBeUndefined();
});
```

### Energy Management

**Test: Energy System**
```typescript
test('starts with 3 energy per turn', () => {
  const battleState = createBattleState();
  expect(battleState.currentEnergy).toBe(3);
  expect(battleState.maxEnergy).toBe(3);
});

test('energy resets at start of turn', () => {
  const battleState = createBattleState();
  battleState.currentEnergy = 0;
  
  startNewTurn(battleState);
  
  expect(battleState.currentEnergy).toBe(3);
});

test('cannot play card if insufficient energy', () => {
  const battleState = createBattleState();
  battleState.currentEnergy = 1;
  const card = createCard({ cost: 3 });
  
  const result = canPlayCard(battleState, card);
  expect(result).toBe(false);
});

test('energy is consumed when playing card', () => {
  const battleState = createBattleState();
  battleState.currentEnergy = 3;
  const card = createCard({ cost: 2 });
  
  playCard(battleState, card);
  
  expect(battleState.currentEnergy).toBe(1);
});
```

---

## Integration Testing

### Card Acquisition Flow

**Test: Claim Cards from Match**
```typescript
test('claims cards for won matches', async () => {
  const user = createTestUser();
  const match = createWonMatch({ heroId: 1, performance: 'top_5_percent' });
  
  const result = await claimCardsForMatch(user.id, match.id);
  
  expect(result.cardsAwarded).toBe(4); // Top 5% = 4 copies
  expect(result.cards[0].heroId).toBe(1);
  expect(result.cards[0].rarity).toBe('COMMON');
  expect(result.cards[0].quantity).toBe(4);
});

test('does not claim cards for lost matches', async () => {
  const user = createTestUser();
  const match = createLostMatch({ heroId: 1 });
  
  const result = await claimCardsForMatch(user.id, match.id);
  
  expect(result.cardsAwarded).toBe(0);
});

test('prevents duplicate claims', async () => {
  const user = createTestUser();
  const match = createWonMatch({ heroId: 1 });
  
  await claimCardsForMatch(user.id, match.id);
  const result = await claimCardsForMatch(user.id, match.id);
  
  expect(result.error).toBe('Match already claimed');
});
```

### Forge System

**Test: Forge Operations**
```typescript
test('forges 3 COMMON cards into 1 UNCOMMON', async () => {
  const user = createTestUser();
  await addCardsToCollection(user.id, { heroId: 1, rarity: 'COMMON', quantity: 3 });
  
  const result = await forgeCards(user.id, { heroId: 1, fromRarity: 'COMMON', toRarity: 'UNCOMMON' });
  
  expect(result.success).toBe(true);
  expect(result.cardsConsumed).toBe(3);
  expect(result.cardCreated.rarity).toBe('UNCOMMON');
  
  const collection = await getUserCollection(user.id);
  expect(collection.find(c => c.rarity === 'COMMON' && c.heroId === 1)?.quantity).toBe(0);
  expect(collection.find(c => c.rarity === 'UNCOMMON' && c.heroId === 1)?.quantity).toBe(1);
});

test('prevents forging with insufficient cards', async () => {
  const user = createTestUser();
  await addCardsToCollection(user.id, { heroId: 1, rarity: 'COMMON', quantity: 2 });
  
  const result = await forgeCards(user.id, { heroId: 1, fromRarity: 'COMMON', toRarity: 'UNCOMMON' });
  
  expect(result.success).toBe(false);
  expect(result.error).toBe('Insufficient cards');
});

test('forges through all rarity tiers', async () => {
  const user = createTestUser();
  // Start with 27 COMMON cards (enough for 1 LEGENDARY: 3^3 = 27)
  await addCardsToCollection(user.id, { heroId: 1, rarity: 'COMMON', quantity: 27 });
  
  // Forge to UNCOMMON (9 UNCOMMON cards)
  await forgeCards(user.id, { heroId: 1, fromRarity: 'COMMON', toRarity: 'UNCOMMON' });
  
  // Forge to RARE (3 RARE cards)
  await forgeCards(user.id, { heroId: 1, fromRarity: 'UNCOMMON', toRarity: 'RARE' });
  
  // Forge to LEGENDARY (1 LEGENDARY card)
  const result = await forgeCards(user.id, { heroId: 1, fromRarity: 'RARE', toRarity: 'LEGENDARY' });
  
  expect(result.cardCreated.rarity).toBe('LEGENDARY');
  
  const collection = await getUserCollection(user.id);
  expect(collection.find(c => c.rarity === 'LEGENDARY' && c.heroId === 1)?.quantity).toBe(1);
});
```

### Deck Building

**Test: Deck Management**
```typescript
test('creates deck with up to 10 cards', async () => {
  const user = createTestUser();
  await addCardsToCollection(user.id, [
    { heroId: 1, rarity: 'COMMON', quantity: 5 },
    { heroId: 2, rarity: 'COMMON', quantity: 5 }
  ]);
  
  const deck = await createDeck(user.id, {
    name: 'Test Deck',
    cardIds: [/* 10 card IDs */]
  });
  
  expect(deck.cards.length).toBe(10);
});

test('prevents deck with more than 10 cards', async () => {
  const user = createTestUser();
  
  const result = await createDeck(user.id, {
    name: 'Test Deck',
    cardIds: [/* 11 card IDs */]
  });
  
  expect(result.error).toBe('Deck cannot exceed 10 cards');
});

test('prevents adding cards not in collection', async () => {
  const user = createTestUser();
  
  const result = await createDeck(user.id, {
    name: 'Test Deck',
    cardIds: [/* card ID user doesn't own */]
  });
  
  expect(result.error).toBe('Card not in collection');
});
```

---

## End-to-End Testing

### Complete Game Flow

**Test: Full User Journey**
```typescript
test('complete flow: claim cards -> forge -> build deck -> battle', async () => {
  const user = createTestUser();
  
  // 1. Win matches and claim cards
  const match1 = createWonMatch({ heroId: 1, performance: 'top_5_percent' });
  await claimCardsForMatch(user.id, match1.id);
  
  const match2 = createWonMatch({ heroId: 1, performance: 'top_5_percent' });
  await claimCardsForMatch(user.id, match2.id);
  
  // Should have 8 COMMON cards for hero 1
  
  // 2. Forge some cards
  await forgeCards(user.id, { heroId: 1, fromRarity: 'COMMON', toRarity: 'UNCOMMON' });
  // Should have 2 UNCOMMON, 2 COMMON
  
  // 3. Build deck
  const deck = await createDeck(user.id, {
    name: 'My Deck',
    cardIds: [/* mix of COMMON and UNCOMMON */]
  });
  
  // 4. Start battle
  const battle = await startBattle(user.id, deck.id);
  
  // 5. Play through battle
  await playCardInBattle(battle.id, deck.cards[0].id);
  await endTurn(battle.id);
  
  // 6. Complete battle
  await completeBattle(battle.id);
  
  // Verify battle was recorded
  const battleHistory = await getBattleHistory(user.id);
  expect(battleHistory.length).toBe(1);
});
```

---

## Battle System Testing

### Turn Order

**Test: Turn Sequence**
```typescript
test('correct turn order: player -> enemy', () => {
  const battle = createBattle();
  
  expect(battle.currentTurn).toBe('PLAYER');
  expect(battle.turnNumber).toBe(1);
  
  endTurn(battle);
  
  expect(battle.currentTurn).toBe('ENEMY');
  expect(battle.turnNumber).toBe(1);
  
  endTurn(battle);
  
  expect(battle.currentTurn).toBe('PLAYER');
  expect(battle.turnNumber).toBe(2);
});
```

### Card Effects

**Test: Card Effect Execution**
```typescript
test('ATTACK card deals damage', () => {
  const battle = createBattle();
  const enemy = battle.enemies[0];
  const initialHealth = enemy.health;
  const card = createCard({ type: 'ATTACK', attack: 10 });
  
  playCard(battle, card, { target: enemy });
  
  expect(enemy.health).toBe(initialHealth - 10);
});

test('DEFENSE card blocks damage', () => {
  const battle = createBattle();
  const player = battle.player;
  const initialHealth = player.health;
  const card = createCard({ type: 'DEFENSE', defense: 8 });
  
  playCard(battle, card);
  
  // Enemy attacks
  enemyAttack(battle, battle.enemies[0], 10);
  
  expect(player.health).toBe(initialHealth - 2); // 10 damage - 8 block = 2
});

test('SKILL card applies effects', () => {
  const battle = createBattle();
  const enemy = battle.enemies[0];
  const card = createCard({ 
    type: 'SKILL', 
    effects: [{ type: 'APPLY_POISON', value: 3 }] 
  });
  
  playCard(battle, card, { target: enemy });
  
  expect(enemy.statusEffects.POISON).toBe(3);
});
```

### Status Effect Interactions

**Test: Status Effect Damage**
```typescript
test('POISON deals damage at end of turn', () => {
  const battle = createBattle();
  const enemy = battle.enemies[0];
  enemy.statusEffects = { POISON: 5 };
  const initialHealth = enemy.health;
  
  processEndOfTurn(battle);
  
  expect(enemy.health).toBe(initialHealth - 5);
  expect(enemy.statusEffects.POISON).toBe(4);
});

test('BURN deals damage at end of turn', () => {
  const battle = createBattle();
  const enemy = battle.enemies[0];
  enemy.statusEffects = { BURN: 3 };
  const initialHealth = enemy.health;
  
  processEndOfTurn(battle);
  
  expect(enemy.health).toBe(initialHealth - 3);
  expect(enemy.statusEffects.BURN).toBe(2);
});

test('STUN prevents enemy action', () => {
  const battle = createBattle();
  const enemy = battle.enemies[0];
  enemy.statusEffects = { STUN: 1 };
  
  const action = enemyAI.getAction(battle, enemy);
  
  expect(action.type).toBe('SKIP');
  expect(enemy.statusEffects.STUN).toBe(0);
});
```

### Player Buffs/Debuffs

**Test: Player Status Effects**
```typescript
test('STRENGTH increases attack damage', () => {
  const battle = createBattle();
  battle.player.statusEffects = { STRENGTH: 2 };
  const enemy = battle.enemies[0];
  const initialHealth = enemy.health;
  const card = createCard({ type: 'ATTACK', attack: 10 });
  
  playCard(battle, card, { target: enemy });
  
  expect(enemy.health).toBe(initialHealth - 12); // 10 + 2 STRENGTH
});

test('WEAK reduces attack damage', () => {
  const battle = createBattle();
  battle.player.statusEffects = { WEAK: 2 };
  const enemy = battle.enemies[0];
  const initialHealth = enemy.health;
  const card = createCard({ type: 'ATTACK', attack: 10 });
  
  playCard(battle, card, { target: enemy });
  
  expect(enemy.health).toBe(initialHealth - 8); // 10 - 2 WEAK
});

test('VULNERABLE increases damage taken', () => {
  const battle = createBattle();
  battle.player.statusEffects = { VULNERABLE: 2 };
  const player = battle.player;
  const initialHealth = player.health;
  
  enemyAttack(battle, battle.enemies[0], 10);
  
  expect(player.health).toBe(initialHealth - 12); // 10 + 2 VULNERABLE
});
```

### Enemy AI Patterns

**Test: Enemy AI Behaviors**
```typescript
test('SIMPLE AI attacks every turn', () => {
  const battle = createBattle();
  const enemy = createEnemy({ aiPattern: 'SIMPLE' });
  const player = battle.player;
  const initialHealth = player.health;
  
  for (let i = 0; i < 3; i++) {
    enemyAI.executeTurn(battle, enemy);
    endTurn(battle);
  }
  
  expect(player.health).toBeLessThan(initialHealth);
});

test('CHARGE AI builds up for big attack', () => {
  const battle = createBattle();
  const enemy = createEnemy({ aiPattern: 'CHARGE', chargeTurns: 2 });
  const player = battle.player;
  const initialHealth = player.health;
  
  // First turn: charge
  enemyAI.executeTurn(battle, enemy);
  expect(enemy.charge).toBe(1);
  
  // Second turn: charge
  enemyAI.executeTurn(battle, enemy);
  expect(enemy.charge).toBe(2);
  
  // Third turn: big attack
  enemyAI.executeTurn(battle, enemy);
  const damageDealt = initialHealth - player.health;
  expect(damageDealt).toBeGreaterThan(enemy.baseAttack);
});

test('DEFENSIVE AI blocks and heals', () => {
  const battle = createBattle();
  const enemy = createEnemy({ aiPattern: 'DEFENSIVE' });
  const initialHealth = enemy.health;
  
  // Player attacks
  const card = createCard({ type: 'ATTACK', attack: 15 });
  playCard(battle, card, { target: enemy });
  
  // Enemy should have blocked some damage
  expect(enemy.health).toBeGreaterThan(initialHealth - 15);
  
  // Enemy turn: should heal
  enemyAI.executeTurn(battle, enemy);
  expect(enemy.health).toBeGreaterThan(initialHealth - 15);
});
```

### Win/Loss Conditions

**Test: Battle Outcomes**
```typescript
test('player wins when all enemies defeated', () => {
  const battle = createBattle();
  battle.enemies.forEach(enemy => enemy.health = 0);
  
  const result = checkBattleEnd(battle);
  
  expect(result.won).toBe(true);
  expect(result.completed).toBe(true);
});

test('player loses when health reaches 0', () => {
  const battle = createBattle();
  battle.player.health = 0;
  
  const result = checkBattleEnd(battle);
  
  expect(result.won).toBe(false);
  expect(result.completed).toBe(true);
});

test('battle continues when both sides alive', () => {
  const battle = createBattle();
  battle.player.health = 50;
  battle.enemies[0].health = 30;
  
  const result = checkBattleEnd(battle);
  
  expect(result.completed).toBe(false);
});
```

### Floor Progression

**Test: Encounter Progression**
```typescript
test('progresses through floors correctly', () => {
  const run = createBattlerRun();
  
  // Floor 1: Normal encounter
  const encounter1 = await startEncounter(run.id, 1);
  await completeEncounter(encounter1.id, { won: true });
  
  expect(run.currentFloor).toBe(1);
  expect(run.encountersCompleted).toBe(1);
  
  // Floor 2: Normal encounter
  const encounter2 = await startEncounter(run.id, 2);
  await completeEncounter(encounter2.id, { won: true });
  
  expect(run.currentFloor).toBe(2);
  
  // Floor 3: Elite encounter
  const encounter3 = await startEncounter(run.id, 3);
  expect(encounter3.type).toBe('ELITE');
  
  // Floor 4: Boss encounter
  const encounter4 = await startEncounter(run.id, 4);
  expect(encounter4.type).toBe('BOSS');
});
```

---

## Card Acquisition & Forge Testing

### Performance Percentile Calculation

**Test: Percentile Accuracy**
```typescript
test('calculates percentile correctly with large dataset', () => {
  const userHistory = generateMatchHistory(1000);
  const testMatch = createMatchStats({
    kills: 20,
    deaths: 1,
    assists: 25,
    hero_damage: 50000,
    hero_healing: 10000,
    net_worth: 40000
  });
  
  const percentile = calculatePercentile(testMatch, userHistory);
  
  // Should be very high percentile for such good stats
  expect(percentile).toBeGreaterThan(95);
});

test('handles edge cases in percentile calculation', () => {
  // Test with single match
  const singleMatch = createMatchStats();
  const percentile1 = calculatePercentile(singleMatch, [singleMatch]);
  expect(percentile1).toBe(50); // Median of one value
  
  // Test with identical scores
  const identicalMatches = Array(10).fill(createMatchStats({ kills: 10, deaths: 5 }));
  const percentile2 = calculatePercentile(identicalMatches[0], identicalMatches);
  expect(percentile2).toBe(50);
});
```

### Forge Requirements Validation

**Test: Forge Requirements**
```typescript
test('validates forge requirements correctly', async () => {
  const user = createTestUser();
  await addCardsToCollection(user.id, { heroId: 1, rarity: 'COMMON', quantity: 3 });
  
  const requirements = await getForgeRequirements(user.id, {
    heroId: 1,
    fromRarity: 'COMMON',
    toRarity: 'UNCOMMON'
  });
  
  expect(requirements.canForge).toBe(true);
  expect(requirements.cardsRequired).toBe(3);
  expect(requirements.cardsAvailable).toBe(3);
});

test('prevents forging to invalid rarity', async () => {
  const user = createTestUser();
  
  const result = await forgeCards(user.id, {
    heroId: 1,
    fromRarity: 'COMMON',
    toRarity: 'RARE' // Skipping UNCOMMON
  });
  
  expect(result.success).toBe(false);
  expect(result.error).toBe('Invalid rarity progression');
});
```

---

## Performance Testing

### Database Query Performance

**Test: Collection Query Performance**
```typescript
test('queries large collection efficiently', async () => {
  const user = createTestUser();
  
  // Add cards for all 127 heroes, 4 rarities each
  for (let heroId = 1; heroId <= 127; heroId++) {
    for (const rarity of ['COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY']) {
      await addCardsToCollection(user.id, { heroId, rarity, quantity: 10 });
    }
  }
  
  const startTime = Date.now();
  const collection = await getUserCollection(user.id);
  const endTime = Date.now();
  
  expect(collection.length).toBe(127 * 4); // 508 card entries
  expect(endTime - startTime).toBeLessThan(500); // Should complete in < 500ms
});
```

### Battle Calculation Performance

**Test: Battle Turn Performance**
```typescript
test('processes battle turn quickly', () => {
  const battle = createComplexBattle(); // Multiple enemies, status effects
  
  const startTime = Date.now();
  processBattleTurn(battle);
  const endTime = Date.now();
  
  expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
});

test('handles large status effect stacks efficiently', () => {
  const enemy = createEnemy({
    statusEffects: {
      POISON: 50,
      BURN: 30,
      STUN: 10
    }
  });
  
  const startTime = Date.now();
  processStatusEffects(enemy);
  const endTime = Date.now();
  
  expect(endTime - startTime).toBeLessThan(50);
});
```

---

## Edge Cases & Complex Interactions

### Complex Status Effect Interactions

**Test: Multiple Status Effects**
```typescript
test('handles all status effects simultaneously', () => {
  const enemy = createEnemy({
    statusEffects: {
      POISON: 5,
      BURN: 3,
      STUN: 1
    }
  });
  
  processEndOfTurn({ enemies: [enemy] });
  
  // Should process all effects
  expect(enemy.statusEffects.POISON).toBe(4);
  expect(enemy.statusEffects.BURN).toBe(2);
  expect(enemy.statusEffects.STUN).toBe(0);
});

test('handles status effect overflow', () => {
  const enemy = createEnemy();
  
  // Apply massive status effects
  for (let i = 0; i < 100; i++) {
    applyStatusEffect(enemy, 'POISON', 1);
  }
  
  // Should cap or handle gracefully
  expect(enemy.statusEffects.POISON).toBeLessThanOrEqual(999); // Reasonable cap
});
```

### Card Effect Edge Cases

**Test: Card Effect Interactions**
```typescript
test('handles cards that modify other cards', () => {
  const battle = createBattle();
  const card1 = createCard({ effects: [{ type: 'REDUCE_COST_NEXT_CARD' }] });
  const card2 = createCard({ cost: 3 });
  
  playCard(battle, card1);
  const newCost = getCardCost(battle, card2);
  
  expect(newCost).toBeLessThan(3);
});

test('handles cards that draw cards', () => {
  const battle = createBattle();
  const initialHandSize = battle.playerHand.length;
  const card = createCard({ effects: [{ type: 'DRAW_CARDS', value: 2 }] });
  
  playCard(battle, card);
  
  expect(battle.playerHand.length).toBe(initialHandSize + 1); // +2 draw -1 played
});
```

### Battle State Edge Cases

**Test: Battle State Consistency**
```typescript
test('maintains state consistency during complex turns', () => {
  const battle = createBattle();
  
  // Play multiple cards with complex interactions
  playCard(battle, createCard({ type: 'ATTACK', attack: 10 }));
  playCard(battle, createCard({ type: 'DEFENSE', defense: 8 }));
  playCard(battle, createCard({ effects: [{ type: 'DRAW_CARDS', value: 1 }] }));
  
  // Verify state is consistent
  expect(battle.currentEnergy).toBeGreaterThanOrEqual(0);
  expect(battle.currentEnergy).toBeLessThanOrEqual(3);
  expect(battle.playerHand.length).toBeGreaterThanOrEqual(0);
  expect(battle.playerHand.length).toBeLessThanOrEqual(10);
});
```

### Data Integrity

**Test: Database Constraints**
```typescript
test('prevents negative card quantities', async () => {
  const user = createTestUser();
  await addCardsToCollection(user.id, { heroId: 1, rarity: 'COMMON', quantity: 2 });
  
  const result = await removeCardsFromCollection(user.id, {
    heroId: 1,
    rarity: 'COMMON',
    quantity: 5
  });
  
  expect(result.success).toBe(false);
  
  const collection = await getUserCollection(user.id);
  const card = collection.find(c => c.heroId === 1 && c.rarity === 'COMMON');
  expect(card.quantity).toBe(2); // Should remain unchanged
});

test('enforces unique constraints', async () => {
  const user = createTestUser();
  
  await createDeck(user.id, { name: 'Deck 1', cardIds: [] });
  
  // Should fail to create duplicate
  const result = await createDeck(user.id, { name: 'Deck 1', cardIds: [] });
  
  expect(result.success).toBe(false);
});
```

---

## Test Data Management

### Test Fixtures

**Create Reusable Test Data**
```typescript
// test/fixtures/battler.ts

export function createTestUser(overrides = {}) {
  return {
    id: generateId(),
    email: 'test@example.com',
    ...overrides
  };
}

export function createWonMatch(overrides = {}) {
  return {
    id: generateId(),
    matchId: generateId(),
    heroId: 1,
    won: true,
    kills: 10,
    deaths: 2,
    assists: 15,
    hero_damage: 25000,
    hero_healing: 5000,
    net_worth: 20000,
    ...overrides
  };
}

export function createBattlerCard(overrides = {}) {
  return {
    id: generateId(),
    heroId: 1,
    rarity: 'COMMON',
    cost: 2,
    attack: 10,
    defense: 0,
    type: 'ATTACK',
    effects: null,
    ...overrides
  };
}

export function createBattle(overrides = {}) {
  return {
    id: generateId(),
    player: {
      health: 80,
      maxHealth: 80,
      energy: 3,
      statusEffects: {}
    },
    enemies: [createEnemy()],
    currentTurn: 'PLAYER',
    turnNumber: 1,
    playerHand: [],
    playerDeck: [],
    ...overrides
  };
}

export function createEnemy(overrides = {}) {
  return {
    id: generateId(),
    name: 'Test Enemy',
    health: 50,
    maxHealth: 50,
    attack: 10,
    aiPattern: 'SIMPLE',
    statusEffects: {},
    ...overrides
  };
}
```

### Test Database Setup

**Isolated Test Database**
```typescript
// test/setup.ts

beforeEach(async () => {
  // Reset test database
  await resetTestDatabase();
  
  // Seed base data
  await seedHeroes();
  await seedBattlerCards();
});

afterEach(async () => {
  // Clean up
  await cleanupTestData();
});
```

---

## Mocking & Test Fixtures

### Mock External APIs

**Mock Dota 2 API**
```typescript
// test/mocks/dota-api.ts

export const mockDotaAPI = {
  getMatchDetails: vi.fn().mockResolvedValue({
    players: [{
      hero_id: 1,
      kills: 10,
      deaths: 2,
      assists: 15,
      hero_damage: 25000,
      hero_healing: 5000,
      net_worth: 20000
    }]
  }),
  
  getUserMatches: vi.fn().mockResolvedValue([
    createWonMatch(),
    createWonMatch(),
    createLostMatch()
  ])
};
```

### Mock Battle RNG

**Deterministic Random for Testing**
```typescript
// test/mocks/rng.ts

let seed = 12345;

export function mockRandom() {
  // Linear congruential generator for deterministic randomness
  seed = (seed * 1664525 + 1013904223) % Math.pow(2, 32);
  return seed / Math.pow(2, 32);
}

export function resetRNG(newSeed = 12345) {
  seed = newSeed;
}

// Use in tests
test('deterministic battle outcome', () => {
  resetRNG(12345);
  const battle1 = runBattle();
  
  resetRNG(12345);
  const battle2 = runBattle();
  
  expect(battle1.outcome).toBe(battle2.outcome);
});
```

---

## Test Coverage Goals

### Target Coverage

- **Unit Tests**: 90%+ coverage for all utility functions
- **Integration Tests**: 80%+ coverage for all API endpoints
- **E2E Tests**: Cover all major user flows
- **Battle System**: 100% coverage for core battle logic

### Critical Paths to Test

1. ✅ Card acquisition from match wins
2. ✅ Performance percentile calculation
3. ✅ Forge system (all rarity progressions)
4. ✅ Deck building constraints
5. ✅ Battle turn execution
6. ✅ Status effect application and decay
7. ✅ Enemy AI patterns
8. ✅ Win/loss conditions
9. ✅ Floor progression
10. ✅ Energy management

---

## Continuous Testing

### Pre-Commit Hooks

- Run unit tests
- Run linter
- Check test coverage thresholds

### CI/CD Pipeline

1. **Unit Tests** - Fast feedback (< 30 seconds)
2. **Integration Tests** - Database operations (< 2 minutes)
3. **E2E Tests** - Full flows (< 5 minutes)
4. **Performance Tests** - Benchmark critical paths

### Test Reporting

- Generate coverage reports
- Track test execution time
- Monitor flaky tests
- Report on test trends

---

## Debugging Tools

### Battle Replay System

**Save and Replay Battles**
```typescript
// Save battle state at each turn
const battleLog = {
  initialState: battle,
  turns: [
    { turnNumber: 1, actions: [...], state: battle },
    { turnNumber: 2, actions: [...], state: battle }
  ]
};

// Replay battle from log
function replayBattle(battleLog) {
  // Reconstruct battle step by step
  // Useful for debugging complex interactions
}
```

### Test Utilities

**Helper Functions for Testing**
```typescript
// test/utils/battle-helpers.ts

export function simulateBattleUntilEnd(battle) {
  while (!checkBattleEnd(battle).completed) {
    if (battle.currentTurn === 'PLAYER') {
      // Auto-play cards
      const playableCards = getPlayableCards(battle);
      if (playableCards.length > 0) {
        playCard(battle, playableCards[0]);
      } else {
        endTurn(battle);
      }
    } else {
      // Enemy turn
      enemyAI.executeTurn(battle, battle.enemies[0]);
      endTurn(battle);
    }
  }
  return battle;
}
```

---

## Conclusion

This testing strategy ensures:

1. **Reliability** - All game mechanics work correctly
2. **Consistency** - Complex interactions behave predictably
3. **Performance** - System handles load efficiently
4. **Maintainability** - Tests serve as documentation
5. **Confidence** - Changes can be made safely

The combination of unit, integration, and E2E tests provides comprehensive coverage of the card battler feature, from card acquisition through battle completion.
