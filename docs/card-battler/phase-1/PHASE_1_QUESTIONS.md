# Phase 1: Core Data Models & Utilities - Open Questions

This document tracks any open questions or clarifications needed before beginning Phase 1 development.

**Status**: Pre-Development  
**Last Updated**: 2025-01-18

---

## Questions & Clarifications

### 1. TypeScript Type Definitions Structure

**Question**: What should the TypeScript type structure look like for:
- Card effects (JSONB structure)
- Battle state (JSONB structure)
- Status effects
- Enemy intents

**Context**: 
- Planning docs specify JSONB for effects and battle state
- Need TypeScript types for type safety
- Should types match Prisma-generated types or be custom?

**Status**: ⏳ **NEEDS CLARIFICATION**

**Options**:
1. Use Prisma-generated types directly
2. Create custom TypeScript types that extend/transform Prisma types
3. Create separate type definitions that match JSONB structure

**Recommendation**: Create custom TypeScript types for JSONB structures (effects, battle state) that provide type safety while remaining flexible for future extensions.

---

### 2. Card Effects JSONB Structure

**Question**: What is the exact JSONB structure for card effects?

**Context**:
- Planning docs mention "extensible structure for future effects"
- COMMON cards have no effects
- UNCOMMON/RARE/LEGENDARY have different effect strengths
- Need to define the structure for type safety

**Status**: ⏳ **NEEDS CLARIFICATION**

**Proposed Structure**:
```typescript
type CardEffect = {
  type: 'DAMAGE' | 'BLOCK' | 'DRAW' | 'STATUS' | 'HEAL' | 'ENERGY' | 'CUSTOM';
  value?: number;
  target?: 'SELF' | 'ENEMY' | 'ALL_ENEMIES' | 'RANDOM_ENEMY';
  statusEffect?: {
    type: StatusEffectType;
    stacks: number;
    duration?: number; // turns
  };
  condition?: {
    type: 'KILL' | 'DAMAGE_DEALT' | 'CARD_PLAYED' | 'TURN_START' | 'TURN_END';
    value?: number;
  };
};

type CardEffects = CardEffect[];
```

**Question**: Is this structure acceptable, or should it be different?

---

### 3. Battle State JSONB Structure

**Question**: What is the exact JSONB structure for battle state?

**Context**:
- Full battle state persisted after each action
- Needs to include: player state, enemy state, deck state, hand, discard, status effects
- Must be resumable

**Status**: ⏳ **NEEDS CLARIFICATION**

**Proposed Structure**:
```typescript
type BattleState = {
  // Player State
  player: {
    health: number;
    maxHealth: number;
    energy: number;
    maxEnergy: number;
    statusEffects: StatusEffect[];
  };
  
  // Enemy State
  enemy: {
    id: string;
    name: string;
    health: number;
    maxHealth: number;
    intent: EnemyIntent;
    statusEffects: StatusEffect[];
  };
  
  // Deck State
  deck: {
    drawPile: string[]; // card IDs
    hand: string[]; // card IDs
    discardPile: string[]; // card IDs
    exhaustPile: string[]; // card IDs (if needed)
  };
  
  // Turn State
  turn: {
    number: number;
    phase: 'PLAYER_TURN' | 'ENEMY_TURN' | 'END_TURN';
  };
  
  // Battle Metadata
  metadata: {
    encounterId: string;
    floor: number;
    startedAt: string; // ISO timestamp
  };
};
```

**Question**: Is this structure acceptable, or should it be different?

---

### 4. Status Effect Type Definitions

**Question**: What are the exact TypeScript types for status effects?

**Context**:
- Planning docs list status effects (Strength, Weak, Poison, etc.)
- Status effects stack infinitely
- Need type definitions for type safety

**Status**: ⏳ **NEEDS CLARIFICATION**

**Proposed Structure**:
```typescript
type StatusEffectType = 
  // Player Buffs
  | 'STRENGTH'      // +1 attack per stack
  | 'DEXTERITY'     // +1 block per stack
  | 'FOCUS'         // +1 energy per stack
  // Player Debuffs
  | 'WEAK'          // Deal 25% less damage
  | 'VULNERABLE'    // Take 50% more damage
  | 'FRAIL'         // Gain 25% less block
  // Enemy Status
  | 'POISON'        // Take damage at end of turn
  | 'BURN'          // Take damage each turn
  | 'STUN'          // Skip next turn
  | 'WEAKENED'      // Deal less damage (enemy version)
  | 'VULNERABLE_ENEMY' // Take more damage (enemy version);

type StatusEffect = {
  type: StatusEffectType;
  stacks: number; // Infinite stacking
  source?: string; // Card ID or source that applied it
};
```

**Question**: Are these status effects correct? Any missing?

---

### 5. Card Stat Calculation Formulas

**Question**: Are the exact formulas for card stat calculations correct?

**Context**: 
- Planning docs mention:
  - COMMON: Base stats
  - UNCOMMON: +20% attack/defense
  - RARE: +50% attack/defense
  - LEGENDARY: +100% attack/defense, -1 cost (minimum 1)

**Status**: ✅ **COVERED IN PLANNING**

**Clarification Needed**: 
- Should cost reduction happen before or after stat calculation?
- Should we round stats (floor, ceiling, or round)?
- Example: If base cost is 1, can LEGENDARY go to 0 or stay at 1?

**Answer Needed**: Cost reduction happens after stat calculation, minimum cost is always 1.

---

### 6. Performance Score Calculation Details

**Question**: What is the exact formula for performance score calculation?

**Context**:
- Uses Stratz API for hero averages
- Compares user match stats to hero averages
- Calculates percentile
- Awards 1-4 copies based on percentile

**Status**: ⏳ **NEEDS CLARIFICATION**

**Questions**:
1. What stats are included in performance calculation?
   - Kills, deaths, assists?
   - Hero damage, healing?
   - Net worth, last hits?
   - All of the above with weights?

2. What is the exact percentile calculation?
   - How to compare against Stratz API hero averages?
   - What percentile thresholds for copies?
     - Top 5% = 4 copies
     - Top 20% = 3 copies
     - Top 50% = 2 copies
     - Bottom 50% = 1 copy

3. How to handle edge cases?
   - User performs better than average in all stats?
   - User performs worse than average in all stats?
   - Mixed performance (good in some, bad in others)?

---

### 7. TypeScript Type Organization

**Question**: How should TypeScript types be organized in `src/lib/types/battler.ts`?

**Status**: ⏳ **NEEDS CLARIFICATION**

**Proposed Organization**:
```typescript
// Enums (re-export from Prisma or define separately?)
export type { Rarity, CardType, RunStatus, EncounterType, EncounterStatus, ForgeOperationType } from '@prisma/client';

// Card Types
export type BattlerCard = { ... };
export type CardEffect = { ... };
export type CardEffects = CardEffect[];

// Battle Types
export type BattleState = { ... };
export type StatusEffect = { ... };
export type EnemyIntent = { ... };

// Collection Types
export type UserBattlerCard = { ... };
export type BattlerDeck = { ... };

// Run Types
export type BattlerRun = { ... };
export type BattlerEncounter = { ... };
```

**Question**: Should we:
1. Re-export Prisma types directly?
2. Create custom types that extend Prisma types?
3. Create separate type definitions?

---

### 8. Prisma Enum Import Strategy

**Question**: How should we import Prisma enums in TypeScript?

**Status**: ⏳ **NEEDS CLARIFICATION**

**Options**:
1. Import directly from `@prisma/client`: `import { Rarity } from '@prisma/client'`
2. Re-export from `src/lib/types/battler.ts`
3. Create const enums for better tree-shaking

**Recommendation**: Import directly from `@prisma/client` for consistency, but document the pattern.

---

## Already Covered in Planning Docs ✅

The following items are **already covered** and don't need clarification:

1. ✅ **Enum Values**: All enums defined (Rarity, CardType, RunStatus, EncounterType, EncounterStatus, ForgeOperationType)
2. ✅ **Database Schema**: Complete schema defined in PLANNING.md
3. ✅ **Card Stat Multipliers**: Defined (COMMON=base, UNCOMMON=+20%, RARE=+50%, LEGENDARY=+100%)
4. ✅ **Cost Reduction**: LEGENDARY gets -1 cost (minimum 1)
5. ✅ **Status Effect List**: All status effects listed in PLANNING.md
6. ✅ **Performance Calculation**: Uses Stratz API (mentioned in DECISIONS_SUMMARY.md)
7. ✅ **Copy Awards**: Percentile thresholds defined (Top 5%=4, Top 20%=3, Top 50%=2, Bottom 50%=1)

---

## Next Steps

Once these questions are resolved:

1. Create `src/lib/types/battler.ts` with all type definitions
2. Add enums to `prisma/schema.prisma`
3. Create migration for enums
4. Write tests for types
5. Proceed to Milestone 1.2: Card Stat Calculation Utilities

---

## Notes

- All questions should be resolved before beginning implementation
- Answers should be documented in this file
- Once resolved, questions can be marked as ✅ RESOLVED
- This document will be updated as Phase 1 progresses
