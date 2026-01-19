# Card Battler Feature - Overview

A single-player roguelike card battler where users win cards by playing Dota 2 matches and use them to battle AI opponents.

## Quick Links

### Planning Documents (Pre-Development)
All planning documents are in the **[planning/](./planning/)** folder:

- **[PLANNING.md](./planning/PLANNING.md)** - Complete feature specification (database, APIs, UI flow)
- **[DEVELOPMENT_ROADMAP.md](./planning/DEVELOPMENT_ROADMAP.md)** - Incremental development strategy with bite-sized components
- **[TESTING_STRATEGY.md](./planning/TESTING_STRATEGY.md)** - Comprehensive testing approach for complex interactions
- **[CARD_EXAMPLES.md](./planning/CARD_EXAMPLES.md)** - Example card designs and balancing
- **[BATTLE_MECHANICS.md](./planning/BATTLE_MECHANICS.md)** - Battle system and enemy AI patterns
- **[HERO_SPECIFICS.md](./planning/HERO_SPECIFICS.md)** - Complete card designs for all 127 heroes
- **[PRE_DEVELOPMENT_QUESTIONS.md](./planning/PRE_DEVELOPMENT_QUESTIONS.md)** - All design questions and resolutions
- **[DECISIONS_SUMMARY.md](./planning/DECISIONS_SUMMARY.md)** - Quick reference for all design decisions
- **[DETERMINISTIC_BATTLES.md](./planning/DETERMINISTIC_BATTLES.md)** - Strategies for deterministic battles
- **[CONCURRENT_BATTLE_ACTIONS.md](./planning/CONCURRENT_BATTLE_ACTIONS.md)** - Concurrent action scenarios

### Development Phase Documents
- **[PROGRESS.md](./PROGRESS.md)** - Milestone tracking (updated throughout all phases)
- **[phase-0/](./phase-0/)** - Foundation & Setup phase documentation
  - [PHASE_0_COMPLETE.md](./phase-0/PHASE_0_COMPLETE.md) - Phase 0 completion summary
  - [PRISMA_MIGRATION_RESET.md](./phase-0/PRISMA_MIGRATION_RESET.md) - Migration reset guide
  - [SAFE_MIGRATION_RESET.md](./phase-0/SAFE_MIGRATION_RESET.md) - Safe migration approach

---

## Feature Summary

### Core Loop

1. **Play Dota 2** → Win matches with heroes
2. **Claim Cards** → Every win awards 1-4 COMMON cards (quantity based on performance)
3. **Forge Cards** → Combine 3 cards of same rarity to create 1 of next rarity
4. **Build Deck** → Select up to 10 cards from your collection
5. **Battle AI** → Fight through 10 floors of enemies
6. **Repeat** → Collect more cards, forge better rarities, build better decks

### Card Acquisition

**Every win = COMMON cards awarded (quantity based on performance)**
- Win a match with any hero → Get 1-4 COMMON cards for that hero
- Number of copies based on performance percentile (using Stratz API):
  - **Top 5%**: 4 COMMON copies
  - **Top 20%**: 3 COMMON copies
  - **Top 50%**: 2 COMMON copies
  - **Bottom 50%**: 1 COMMON copy
- All cards start as COMMON - upgrade through forging

### Forge System

**Upgrade cards by combining copies:**
- **3 COMMON** → **1 UNCOMMON**
- **3 UNCOMMON** → **1 RARE**
- **3 RARE** → **1 LEGENDARY**
- **Dismantle**: 1 higher → 3 lower (reverse forge)

**Total needed for LEGENDARY:**
- 27 COMMON cards = 1 LEGENDARY card

**Rarity Benefits:**
- COMMON: Base stats
- UNCOMMON: +20% attack/defense
- RARE: +50% attack/defense
- LEGENDARY: +100% attack/defense, -1 cost (minimum 1)

### Key Features

- **120+ Unique Cards** - One card per Dota hero
- **Deck Building** - Build custom decks of up to 10 cards (max 5 decks per user)
- **Turn-Based Combat** - Energy system, card effects, status effects
- **Progressive Difficulty** - 10 floors with elites and bosses
- **Roguelike Elements** - Each run is unique, permanent progression through card collection

---

## Architecture Overview

### Database Models

**Core Models:**
- `BattlerCard` - Card definitions (one per hero per rarity)
- `UserBattlerCard` - User's card collection
- `BattlerDeck` - User's decks (up to 10 cards each, max 5 decks)
- `BattlerRun` - Active/completed runs
- `BattlerEncounter` - Individual battles
- `BattlerTurn` - Turn-by-turn battle log
- `ClaimedMatch` - Track which matches awarded cards
- `ForgeOperation` - Track forge/dismantle operations

### API Structure

```
/api/battler/
  ├── cards/          # Card catalog, collection, claiming
  ├── decks/          # Deck CRUD operations
  ├── forge/          # Forge and dismantle operations
  └── runs/           # Battle system
```

### Route Structure

```
/battler              # Main hub
/battler/cards        # Card catalog
/battler/collection   # My cards
/battler/deck-builder # Build decks
/battler/play         # Active battle
/battler/history      # Past runs
```

---

## Card System

### Card Types

- **ATTACK** - Deal damage (Pudge, Sven, PA)
- **DEFENSE** - Block damage (Axe, Omniknight)
- **SKILL** - Utility effects (Crystal Maiden, Rubick)
- **POWER** - Persistent effects (Drow, Zeus)

### Rarity System

Rarity is **upgraded through forging**, not match performance:
- All cards start as **COMMON** when awarded
- Forge 3 copies to upgrade to next rarity
- Performance determines how many COMMON copies you get (1-4)

**Forge Requirements:**
- 3 COMMON → 1 UNCOMMON
- 3 UNCOMMON → 1 RARE  
- 3 RARE → 1 LEGENDARY

**Rarity Card Versions:**
Each hero has 4 different card versions (one per rarity):

- **COMMON**: Just attack or block, no special effects
- **UNCOMMON**: Gains weak version of hero's unique power
- **RARE**: Stronger hero power + 50% stat boost
- **LEGENDARY**: Strongest hero power + 100% stat boost + cost reduction

**Example - Pudge "Meat Hook":**
- COMMON: 2 cost, 12 damage, no effect
- UNCOMMON: 2 cost, 12 damage, "If kills enemy, gain 2 Strength" (weak)
- RARE: 2 cost, 18 damage (+50%), "If kills enemy, gain 5 Strength" (stronger)
- LEGENDARY: 1 cost (-1), 24 damage (+100%), "If kills enemy, gain 8 Strength" (strongest)

### Example Cards

**Pudge - "The Butcher" (RARE)**
- Cost: 2 Energy
- Attack: 12
- Effect: "If this kills an enemy, gain 5 Strength"

**Crystal Maiden - "Frostbite" (COMMON)**
- Cost: 1 Energy
- Effect: "Apply 2 Weak to target enemy. Draw 1 card."

See [planning/CARD_EXAMPLES.md](./planning/CARD_EXAMPLES.md) for more examples.

---

## Battle System

### Turn Structure

1. Draw cards (to 5)
2. Restore energy (to 3)
3. Player plays cards
4. Enemy acts (based on intent)
5. Repeat until victory/defeat

### Enemy AI Patterns

- **Simple Attack** - Basic enemies (Goblin, Wolf)
- **Charge** - Aggressive (Orc Warrior)
- **Defensive** - Tanky (Stone Golem)
- **Debuff** - Caster (Dark Mage)
- **Buff** - Scaling (Blood Cultist)
- **Cycle** - Complex (Elite enemies)

### Status Effects

**Player Buffs:** Strength, Dexterity, Focus
**Player Debuffs:** Weak, Vulnerable, Frail
**Enemy Status:** Poison, Burn, Stun

See [planning/BATTLE_MECHANICS.md](./planning/BATTLE_MECHANICS.md) for detailed enemy patterns.

---

## Implementation Phases

See **[planning/DEVELOPMENT_ROADMAP.md](./planning/DEVELOPMENT_ROADMAP.md)** for detailed incremental development strategy.

### High-Level Phases

**Phase 0: Foundation & Setup** ✅ COMPLETE
- Project structure, test framework, database setup

**Phase 1: Core Utilities**
- Enums, types, card stat calculations, performance scoring, status effects

**Phase 2: Database & Data Layer**
- Schema, seed data, data access functions

**Phase 3: Business Logic**
- Card claiming, forge system, deck management, battle state, enemy AI

**Phase 4: API Layer**
- RESTful endpoints for all features

**Phase 5: UI Components**
- Reusable Svelte components

**Phase 6: Pages & Routes**
- Complete user-facing pages

**Phase 7: Integration & Polish**
- End-to-end integration, polish, run history

Each phase is broken down into small, testable milestones that build on each other incrementally.

---

## Key Design Decisions

### 1. One Card Per Hero
- Each hero = one unique card
- Can win same hero multiple times (accumulate cards)
- Prevents deck bloat

### 2. Fixed 10-Card Decks (Max 5 Decks)
- Simple to understand
- Forces meaningful choices
- Can adjust later if needed

### 3. Energy System (3 base)
- Standard for deck builders
- Creates resource management
- Average card cost: 1.5 energy

### 4. Turn-Based Combat
- Server-side state (prevents cheating)
- Deterministic battles (but not obvious to users)
- Strategic depth

### 5. Progressive Difficulty
- 10 floors with scaling
- Elites at floors 3, 6, 9
- Boss at floor 10
- Target: ~100 matches (50 wins) to beat final level

See [planning/BATTLE_MECHANICS.md](./planning/BATTLE_MECHANICS.md) for detailed battle system design.

---

## Integration with Existing System

### Match Tracking
- Uses existing `Match` and `PlayersMatchDetail` models
- `ClaimedMatch` tracks which matches awarded cards
- Performance calculation uses Stratz API (hero averages)

### User System
- Uses existing `User` model
- Links via `userId` (String)
- No changes to auth system

### Hero Data
- Uses existing `Hero` model
- Links via `heroId` (Int)
- One `BattlerCard` per hero per rarity

### Separation from DotaDeck
- Completely separate feature
- Different database models
- Different routes (`/battler` vs `/dotadeck`)
- Can coexist without conflicts

---

## Design Decisions ✅

All critical design questions have been resolved. See:
- **[planning/DECISIONS_SUMMARY.md](./planning/DECISIONS_SUMMARY.md)** - Quick reference for all decisions
- **[planning/PRE_DEVELOPMENT_QUESTIONS.md](./planning/PRE_DEVELOPMENT_QUESTIONS.md)** - Detailed Q&A

**Key Decisions**:
- ✅ Card acquisition via Stratz API (hero averages)
- ✅ Manual claiming, any past games
- ✅ Forge system with dismantle feature
- ✅ 5 decks max, 10 cards per deck
- ✅ Deterministic battles (not obvious to users)
- ✅ Full state persistence after each action
- ✅ Mobile-first design
- ✅ Test mode for robust testing

---

## Next Steps

1. ✅ Review planning documents
2. ✅ Create detailed card designs for all 127 heroes (see [planning/HERO_SPECIFICS.md](./planning/HERO_SPECIFICS.md))
3. ✅ Design enemy AI patterns (see [planning/BATTLE_MECHANICS.md](./planning/BATTLE_MECHANICS.md))
4. ✅ Resolve all critical design questions
5. ✅ **Phase 0: Foundation & Setup** - COMPLETE
6. **Phase 1.1**: Add enums and types to Prisma schema
7. Build MVP following [planning/DEVELOPMENT_ROADMAP.md](./planning/DEVELOPMENT_ROADMAP.md)
8. Playtest and iterate

---

## Resources

### Inspiration
- **Slay the Spire** - Core mechanics, energy system, deck building
- **Hearthstone** - Card design, rarity system
- **Monster Train** - Enemy patterns, status effects

### Technical References
- Existing codebase: `/dotadeck` (different feature, but similar patterns)
- Match tracking: `/api/matches/check`
- Card system: `/api/cards/*`

---

## Notes

- This is a **planning document** - see phase folders for development progress
- All designs are subject to change based on playtesting
- Focus on MVP first, then iterate
- Keep it fun and balanced!
