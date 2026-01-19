# Deterministic Battles - Implementation Strategy

This document outlines strategies for implementing deterministic battles that don't feel obviously deterministic to users.

## Goal

Battles should be deterministic (for testing and consistency) but feel natural and unpredictable to users.

## Strategies

### 1. Seeded Random with Hidden Seeds

**Approach**: Use seeded random number generators with seeds derived from battle state.

**Implementation**:
```typescript
// Seed based on battle ID + turn number + player actions
function getBattleSeed(battleId: string, turn: number, actions: Action[]): number {
  const seedString = `${battleId}-${turn}-${JSON.stringify(actions)}`;
  return hashStringToNumber(seedString);
}

// Use seeded RNG for "random" events
function getEnemyAction(enemy: Enemy, battleState: BattleState): Action {
  const seed = getBattleSeed(battleState.id, battleState.turn, battleState.playerActions);
  const rng = new SeededRandom(seed);
  
  // Deterministic but feels random
  if (rng.next() < 0.3) {
    return { type: 'ATTACK', damage: enemy.baseAttack };
  } else {
    return { type: 'BUFF', strength: 2 };
  }
}
```

**Benefits**:
- Deterministic (same inputs = same outputs)
- Feels random to users
- Reproducible for testing

### 2. Pattern-Based with Variation

**Approach**: Enemies follow patterns but with slight variations based on battle state.

**Implementation**:
```typescript
// Enemy has base pattern
const enemyPattern = ['ATTACK', 'ATTACK', 'BUFF', 'BIG_ATTACK'];

// Variation based on player health, turn number, etc.
function getEnemyAction(enemy: Enemy, battleState: BattleState): Action {
  const patternIndex = battleState.turn % enemyPattern.length;
  const baseAction = enemyPattern[patternIndex];
  
  // Add variation based on state
  const variation = calculateVariation(battleState);
  
  return applyVariation(baseAction, variation);
}

function calculateVariation(state: BattleState): number {
  // Deterministic calculation based on state
  const factors = [
    state.player.health / state.player.maxHealth,
    state.turn,
    state.enemiesDefeated
  ];
  return hashFactors(factors) % 3; // 0-2 variation
}
```

**Benefits**:
- Predictable patterns for testing
- Feels varied to users
- Easy to balance

### 3. State-Dependent Decisions

**Approach**: Enemy decisions based on deterministic evaluation of battle state.

**Implementation**:
```typescript
function getEnemyAction(enemy: Enemy, battleState: BattleState): Action {
  // Deterministic evaluation
  const playerHealthPercent = battleState.player.health / battleState.player.maxHealth;
  const enemyHealthPercent = enemy.health / enemy.maxHealth;
  const playerBlock = battleState.player.currentBlock;
  
  // Decision tree (deterministic)
  if (playerHealthPercent < 0.3 && playerBlock < 5) {
    return { type: 'BIG_ATTACK', damage: enemy.baseAttack * 1.5 };
  } else if (enemyHealthPercent < 0.5) {
    return { type: 'DEFENSIVE', block: 10 };
  } else {
    return { type: 'ATTACK', damage: enemy.baseAttack };
  }
}
```

**Benefits**:
- Completely deterministic
- Feels intelligent (reacts to situation)
- Easy to test and balance

### 4. Hybrid Approach (Recommended)

**Approach**: Combine pattern-based with state-dependent decisions and seeded variation.

**Implementation**:
```typescript
function getEnemyAction(enemy: Enemy, battleState: BattleState): Action {
  // Base pattern
  const pattern = enemy.pattern;
  const patternAction = pattern[battleState.turn % pattern.length];
  
  // State-dependent modification
  const stateModifier = evaluateBattleState(battleState);
  
  // Seeded variation for unpredictability
  const seed = getBattleSeed(battleState.id, battleState.turn, battleState.playerActions);
  const rng = new SeededRandom(seed);
  const variation = rng.next() * 0.2 - 0.1; // ±10% variation
  
  // Combine all factors
  return combineAction(patternAction, stateModifier, variation);
}
```

**Benefits**:
- Deterministic (reproducible)
- Feels varied and intelligent
- Easy to test
- Flexible for balancing

## Making It Feel Non-Deterministic

### Visual/UI Techniques

1. **Animation Timing**: Vary animation speeds slightly (deterministic but feels random)
2. **Particle Effects**: Use seeded RNG for particle positions
3. **Sound Variations**: Play different sound variations based on seed
4. **Visual Feedback**: Add slight delays/variations in UI updates

### Gameplay Techniques

1. **Hidden Information**: Don't show enemy patterns explicitly
2. **Multiple Patterns**: Enemies can have multiple patterns, switch based on state
3. **Emergent Behavior**: Complex interactions create emergent patterns
4. **Player Agency**: Player choices affect outcomes, making it feel less scripted

## Testing Benefits

Deterministic battles enable:
- **Reproducible Tests**: Same inputs always produce same outputs
- **Regression Testing**: Can verify battles haven't changed
- **Balance Testing**: Can test specific scenarios repeatedly
- **Debugging**: Can replay exact battle sequences

## Implementation Notes

1. **Seed Management**: Store seed in battle state for reproducibility
2. **Version Control**: If battle logic changes, version the seed algorithm
3. **Replay System**: Can replay battles exactly using stored seeds
4. **Test Mode**: Use fixed seeds for testing, variable seeds for production

## Example: Simple Enemy Pattern

```typescript
// Simple enemy with deterministic but varied behavior
const goblinPattern = {
  basePattern: ['ATTACK', 'ATTACK', 'CHARGE', 'BIG_ATTACK'],
  evaluateState: (state: BattleState) => {
    // Deterministic state evaluation
    if (state.player.currentBlock > 10) {
      return 'DEFENSIVE'; // Switch to defensive if player has block
    }
    return null; // Use base pattern
  },
  getAction: (turn: number, state: BattleState): Action => {
    const patternIndex = turn % goblinPattern.basePattern.length;
    const baseAction = goblinPattern.basePattern[patternIndex];
    
    // Check for state-dependent override
    const stateAction = goblinPattern.evaluateState(state);
    if (stateAction) {
      return { type: stateAction, ... };
    }
    
    // Apply seeded variation
    const seed = hashBattleState(state);
    const rng = new SeededRandom(seed);
    const variation = rng.next() * 0.15; // ±15% variation
    
    return applyVariation(baseAction, variation);
  }
};
```

## Questions for User

1. Should enemy patterns be completely hidden or partially visible (e.g., "Enemy is charging")?
2. How much variation is acceptable? (too much = feels random, too little = feels scripted)
3. Should we show enemy "intent" (what they'll do next turn) to add strategy?
4. Do you want a "seed" visible in test mode for debugging?
