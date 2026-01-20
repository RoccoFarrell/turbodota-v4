# Card Battler Development Progress

This document tracks the completion status of all milestones in the development roadmap.

**Last Updated**: 2025-01-18

---

## Phase 0: Foundation & Setup

### Milestone 0.1: Project Structure
- [x] Create documentation folder structure
- [x] Define database schema
- [x] Plan API structure
- [x] Set up test framework (Vitest) - Enhanced existing setup
- [x] Configure test database - Test utilities created
- [x] Reset Prisma migration system - Baseline migration created and marked as applied

**Status**: Completed  
**Date Completed**: 2025-01-18  
**Test Results**: Migration system verified - can create new migrations without reset prompts  
**Blockers/Issues**: None  
**Verification**: ✅ Migration status shows "Database schema is up to date!" ✅ Can create new migrations without reset prompts

**Files Created**:
- `src/lib/test/setup.ts` - Test database setup and cleanup utilities
- `src/lib/test/fixtures/battler.ts` - Test fixtures for card battler
- `src/lib/test/setup.test.ts` - Test to verify setup works
- `docs/card-battler/PRISMA_MIGRATION_RESET.md` - Guide for resetting migrations

**Notes**:
- Vitest configuration enhanced with test database support
- Test fixtures created for all card battler models
- Test setup includes automatic cleanup before each test
- Prisma migration reset guide created - needs manual execution

---

## Phase 1: Core Data Models & Utilities

### Milestone 1.1: Enums & Types
- [ ] Define `Rarity` enum (COMMON, UNCOMMON, RARE, LEGENDARY)
- [ ] Define `CardType` enum (ATTACK, DEFENSE, SKILL, POWER)
- [ ] Define TypeScript types for cards, battles, etc.

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/lib/types/battler.ts`
- `prisma/schema.prisma`

---

### Milestone 1.2: Card Stat Calculation Utilities
- [ ] `calculateCardStats(baseCard, rarity)` - Calculate stats for rarity
- [ ] `getCardCost(baseCost, rarity)` - Calculate energy cost
- [ ] `getCardAttack(baseAttack, rarity)` - Calculate attack value
- [ ] `getCardDefense(baseDefense, rarity)` - Calculate defense value

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/lib/utils/cardStats.ts`

---

### Milestone 1.3: Performance Score Calculation
- [ ] `calculatePerformanceScore(matchStats)` - Calculate score from match data
- [ ] `calculatePercentile(score, heroAverages)` - Calculate percentile vs hero averages (Stratz API)
- [ ] `calculateCopiesAwarded(percentile)` - Determine copies based on percentile
- [ ] Integration with Stratz API

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/lib/utils/performance.ts`
- `src/lib/server/stratz.ts` (Stratz API integration)

---

### Milestone 1.4: Status Effect Utilities
- [ ] `applyStatusEffect(target, effect, value)` - Apply status effect
- [ ] `processStatusEffects(target)` - Process end-of-turn effects
- [ ] `decayStatusEffects(target)` - Reduce status effect stacks
- [ ] `hasStatusEffect(target, effect)` - Check if target has effect
- [ ] Support infinite stacking

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/lib/utils/statusEffects.ts`

---

## Phase 2: Database & Data Layer

### Milestone 2.1: Database Schema
- [ ] Create Prisma schema for all models
- [ ] Define relationships and constraints
- [ ] Use JSONB for PostgreSQL (effects, battle state)
- [ ] Add `BattlerUserStats` model for lifetime statistics
- [ ] Add `BattlerCardStats` model for card usage statistics
- [ ] Create migration file
- [ ] Run migration on test database

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `prisma/schema.prisma`

**Models to Create**:
- BattlerCard
- UserBattlerCard
- BattlerDeck
- BattlerDeckCard
- BattlerRun
- BattlerEncounter
- BattlerTurn
- ClaimedMatch
- ForgeOperation
- BattlerUserStats (lifetime statistics)
- BattlerCardStats (card usage statistics)
- BattlerUserStats (lifetime statistics)
- BattlerCardStats (card usage statistics)

---

### Milestone 2.2: Card Seed Data
- [ ] Create seed script for all 127 heroes × 4 rarities (508 cards)
- [ ] Generate base card data from HERO_SPECIFICS.md
- [ ] Seed test database
- [ ] Verify all cards created correctly

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `prisma/seed/battlerCards.ts`
- `prisma/seed.ts` (update to include battler cards)

---

### Milestone 2.3: Data Access Layer
- [ ] `getBattlerCard(heroId, rarity)` - Get card definition
- [ ] `getAllBattlerCards()` - Get all cards
- [ ] `getUserCollection(userId)` - Get user's cards
- [ ] `addCardsToCollection(userId, cardId, quantity)` - Add cards
- [ ] `removeCardsFromCollection(userId, cardId, quantity)` - Remove cards
- [ ] Optimization for large collections

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/lib/server/db/battlerCards.ts`
- `src/lib/server/db/userCollection.ts`

---

## Phase 3: Business Logic Layer

### Milestone 3.1: Card Claiming Logic
- [ ] `findUnclaimedMatches(userId)` - Find matches that haven't been claimed
- [ ] `claimCardsForMatch(userId, matchId)` - Claim cards for a match
- [ ] `calculateMatchRewards(matchStats, heroAverages)` - Calculate rewards using Stratz API
- [ ] Integration with existing Match/PlayersMatchDetail tables
- [ ] Support claiming any number of past games

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/lib/server/battler/cardClaiming.ts`
- `src/lib/server/stratz.ts`

---

### Milestone 3.2: Forge System Logic
- [ ] `canForge(userId, heroId, fromRarity, toRarity)` - Check if forge is possible
- [ ] `getForgeRequirements(heroId, fromRarity, toRarity)` - Get requirements
- [ ] `forgeCards(userId, heroId, fromRarity, toRarity)` - Execute forge
- [ ] `dismantleCards(userId, heroId, fromRarity, toRarity)` - Execute dismantle (reverse forge)
- [ ] Remove cards from active decks when forged/dismantled
- [ ] No quantity caps

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/lib/server/battler/forge.ts`

---

### Milestone 3.3: Deck Management Logic
- [ ] `createDeck(userId, name, cardIds)` - Create deck (max 5 decks per user)
- [ ] `validateDeck(cardIds)` - Validate deck (max 10 cards, user owns cards)
- [ ] `getUserDecks(userId)` - Get all user decks
- [ ] `updateDeck(deckId, cardIds)` - Update deck
- [ ] `deleteDeck(deckId)` - Delete deck
- [ ] `setActiveDeck(deckId)` - Set active deck (only one active per user)

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/lib/server/battler/decks.ts`

---

### Milestone 3.4: Battle State Management
- [ ] `createBattleState(deck, enemy)` - Initialize battle
- [ ] `startTurn(battleState)` - Start new turn (draw cards, restore energy)
- [ ] `playCard(battleState, cardId, target)` - Play a card
- [ ] `endTurn(battleState)` - End turn (process effects)
- [ ] `checkBattleEnd(battleState)` - Check win/loss
- [ ] Full state persistence after each action
- [ ] Deterministic battle calculations
- [ ] Track card usage and damage for statistics

### Milestone 3.6: Statistics Tracking
- [ ] `updateUserStats(userId, battleResult)` - Update lifetime stats
- [ ] `updateCardStats(userId, cardId, damage, block, kill)` - Update card usage stats
- [ ] `getUserStats(userId)` - Get aggregated lifetime stats
- [ ] `getCardStats(userId, cardId)` - Get card usage stats
- [ ] Aggregate stats from encounters and runs
- [ ] Calculate win rates and averages

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/lib/server/battler/battleState.ts`

---

### Milestone 3.5: Enemy AI Logic
- [ ] `getEnemyAction(enemy, battleState)` - Get enemy's action
- [ ] `executeEnemyAction(battleState, enemy, action)` - Execute action
- [ ] AI patterns: SIMPLE, CHARGE, DEFENSIVE, DEBUFF, BUFF, CYCLE
- [ ] Deterministic but not obvious to users
- [ ] Simple and deterministic to start

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/lib/server/battler/enemyAI.ts`

---

## Phase 4: API Layer

### Milestone 4.1: Card Catalog API
- [ ] `GET /api/battler/cards` - List all cards
- [ ] `GET /api/battler/cards/[cardId]` - Get card details
- [ ] `GET /api/battler/cards/hero/[heroId]` - Get cards for hero

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/routes/api/battler/cards/+server.ts`
- `src/routes/api/battler/cards/[cardId]/+server.ts`
- `src/routes/api/battler/cards/hero/[heroId]/+server.ts`

---

### Milestone 4.2: Collection API
- [ ] `GET /api/battler/collection` - Get user's collection
- [ ] `GET /api/battler/collection/stats` - Get collection statistics
- [ ] Optimization for large collections

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/routes/api/battler/collection/+server.ts`
- `src/routes/api/battler/collection/stats/+server.ts`

---

### Milestone 4.3: Card Claiming API
- [ ] `POST /api/battler/cards/claim` - Claim cards for matches
- [ ] `GET /api/battler/cards/claim/status` - Get claim status
- [ ] Support claiming any number of past games
- [ ] Integration with Stratz API

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/routes/api/battler/cards/claim/+server.ts`
- `src/routes/api/battler/cards/claim/status/+server.ts`

---

### Milestone 4.4: Forge API
- [ ] `POST /api/battler/forge` - Execute forge
- [ ] `POST /api/battler/forge/dismantle` - Execute dismantle
- [ ] `GET /api/battler/forge/requirements/[cardId]` - Get forge requirements

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/routes/api/battler/forge/+server.ts`
- `src/routes/api/battler/forge/dismantle/+server.ts`
- `src/routes/api/battler/forge/requirements/[cardId]/+server.ts`

---

### Milestone 4.5: Deck API
- [ ] `GET /api/battler/decks` - List user's decks
- [ ] `POST /api/battler/decks` - Create deck
- [ ] `PUT /api/battler/decks/[deckId]` - Update deck
- [ ] `DELETE /api/battler/decks/[deckId]` - Delete deck
- [ ] `POST /api/battler/decks/[deckId]/set-active` - Set active deck

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/routes/api/battler/decks/+server.ts`
- `src/routes/api/battler/decks/[deckId]/+server.ts`

---

### Milestone 4.6: Battle API
- [ ] `POST /api/battler/runs` - Start new run
- [ ] `GET /api/battler/runs/[runId]` - Get run state
- [ ] `POST /api/battler/runs/[runId]/play-card` - Play card
- [ ] `POST /api/battler/runs/[runId]/end-turn` - End turn
- [ ] `POST /api/battler/runs/[runId]/complete` - Complete encounter
- [ ] Full state persistence after each action
- [ ] Resume capability for abandoned runs
- [ ] Update lifetime stats after each battle action

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/routes/api/battler/runs/+server.ts`
- `src/routes/api/battler/runs/[runId]/+server.ts`
- `src/routes/api/battler/runs/[runId]/play-card/+server.ts`
- `src/routes/api/battler/runs/[runId]/end-turn/+server.ts`

---

### Milestone 4.7: Statistics API
- [ ] `GET /api/battler/stats` - Get user lifetime statistics
- [ ] `GET /api/battler/stats/cards` - Get card usage statistics
- [ ] Aggregate stats from all runs/encounters
- [ ] Calculate win rate, averages, etc.

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/routes/api/battler/stats/+server.ts`
- `src/routes/api/battler/stats/cards/+server.ts`

---

## Phase 5: UI Components

### Milestone 5.1: Card Display Components
- [ ] `Card.svelte` - Display single card
- [ ] `CardList.svelte` - Display list of cards
- [ ] `CardGrid.svelte` - Display cards in grid
- [ ] `CardTooltip.svelte` - Card hover tooltip
- [ ] Icons and colors for effects
- [ ] Mobile-first design

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/lib/components/battler/Card.svelte`
- `src/lib/components/battler/CardList.svelte`
- `src/lib/components/battler/CardGrid.svelte`
- `src/lib/components/battler/CardTooltip.svelte`

---

### Milestone 5.2: Collection UI Components
- [ ] `CollectionView.svelte` - Main collection view
- [ ] `CollectionFilter.svelte` - Filter by hero/rarity
- [ ] `CollectionStats.svelte` - Display collection statistics
- [ ] Optimization for large collections

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/lib/components/battler/CollectionView.svelte`
- `src/lib/components/battler/CollectionFilter.svelte`
- `src/lib/components/battler/CollectionStats.svelte`

---

### Milestone 5.3: Forge UI Components
- [ ] `ForgeButton.svelte` - Forge action button
- [ ] `ForgeModal.svelte` - Forge confirmation modal
- [ ] `DismantleButton.svelte` - Dismantle action button
- [ ] `ForgeRequirements.svelte` - Display forge requirements

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/lib/components/battler/ForgeButton.svelte`
- `src/lib/components/battler/ForgeModal.svelte`
- `src/lib/components/battler/DismantleButton.svelte`
- `src/lib/components/battler/ForgeRequirements.svelte`

---

### Milestone 5.4: Deck Builder Components
- [ ] `DeckBuilder.svelte` - Main deck builder
- [ ] `DeckSlot.svelte` - Individual deck slot
- [ ] `DeckCardSelector.svelte` - Card selection modal
- [ ] `DeckValidation.svelte` - Deck validation display
- [ ] Mobile-first design

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/lib/components/battler/DeckBuilder.svelte`
- `src/lib/components/battler/DeckSlot.svelte`
- `src/lib/components/battler/DeckCardSelector.svelte`
- `src/lib/components/battler/DeckValidation.svelte`

---

### Milestone 5.5: Battle UI Components
- [ ] `BattleView.svelte` - Main battle view
- [ ] `PlayerStatus.svelte` - Player health/energy display
- [ ] `EnemyDisplay.svelte` - Enemy display
- [ ] `HandDisplay.svelte` - Player hand
- [ ] `BattleLog.svelte` - Battle action log
- [ ] Simple fade animations
- [ ] Mobile-first design

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/lib/components/battler/BattleView.svelte`
- `src/lib/components/battler/PlayerStatus.svelte`
- `src/lib/components/battler/EnemyDisplay.svelte`
- `src/lib/components/battler/HandDisplay.svelte`
- `src/lib/components/battler/BattleLog.svelte`

---

## Phase 6: Pages & Routes

### Milestone 6.1: Card Catalog Page
- [ ] `/battler/cards` - Card catalog page
- [ ] Filter by hero, rarity, type
- [ ] Search functionality
- [ ] Mobile-first design

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/routes/battler/cards/+page.svelte`
- `src/routes/battler/cards/+page.server.ts`

---

### Milestone 6.2: Collection Page
- [ ] `/battler/collection` - Collection page
- [ ] Display user's cards
- [ ] Filter and sort
- [ ] Mobile-first design

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/routes/battler/collection/+page.svelte`
- `src/routes/battler/collection/+page.server.ts`

---

### Milestone 6.3: Claim Cards Page
- [ ] `/battler/claim` - Claim cards page
- [ ] Show unclaimed matches
- [ ] Claim button
- [ ] Support claiming any number of past games
- [ ] Mobile-first design

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/routes/battler/claim/+page.svelte`
- `src/routes/battler/claim/+page.server.ts`

---

### Milestone 6.4: Deck Builder Page
- [ ] `/battler/deck-builder` - Deck builder page
- [ ] Create/edit decks
- [ ] Save functionality
- [ ] Mobile-first design

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/routes/battler/deck-builder/+page.svelte`
- `src/routes/battler/deck-builder/+page.server.ts`

---

### Milestone 6.5: Battle Page
- [ ] `/battler/play` - Active battle page
- [ ] Battle UI
- [ ] Turn management
- [ ] Resume capability
- [ ] Mobile-first design

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/routes/battler/play/+page.svelte`
- `src/routes/battler/play/+page.server.ts`

---

## Phase 7: Integration & Polish

### Milestone 7.1: End-to-End Flow
- [ ] Test complete user journey
- [ ] Fix integration issues
- [ ] Performance optimization
- [ ] Full flow: Claim → Forge → Build Deck → Battle

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

---

### Milestone 7.2: Status Effects UI
- [ ] Status effect icons
- [ ] Status effect tooltips
- [ ] Status effect animations

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

---

### Milestone 7.3: Enemy AI Visualization
- [ ] Enemy intent display
- [ ] Enemy action preview
- [ ] Enemy pattern indicators

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

---

### Milestone 7.4: Run History
- [ ] `/battler/history` - Run history page
- [ ] Run statistics
- [ ] Replay functionality

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

**Files**:
- `src/routes/battler/history/+page.svelte`
- `src/routes/battler/history/+page.server.ts`

---

## Testing & Quality Assurance

### Test Framework Setup
- [ ] Vitest configured
- [ ] Test database configured
- [ ] Test fixtures created
- [ ] Mock data generators

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

---

### Test Mode
- [ ] Test mode implementation
- [ ] Developer tools
- [ ] Debug capabilities
- [ ] Balance testing tools

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

---

## Integration Tasks

### Navigation Integration
- [ ] Add small icon to existing nav
- [ ] Separate feature routing
- [ ] Mobile navigation support

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

---

### Match Simulation for Testing
- [ ] Test methods to simulate matches
- [ ] Random stats generation
- [ ] Win/loss simulation
- [ ] Integration with existing Match tables

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

---

### New User Initialization
- [ ] Base game initialization
- [ ] Starter cards/collection
- [ ] Tutorial/onboarding (if needed)

**Status**: Not Started  
**Date Completed**: TBD  
**Test Results**: TBD  
**Blockers/Issues**: None  
**Verification**: TBD

---

## Notes

### Development Principles
- Optimization is a core tenet from the beginning
- Mobile-first design, scalable to desktop
- Deterministic battles (but not obvious to users)
- Full state persistence after each action
- Server-side calculations only

### Key Decisions
- Use Stratz API for performance calculation
- Manual card claiming
- No quantity caps on cards
- Dismantle feature (reverse forge)
- 5 decks max per user
- Test mode for robust testing

### Outstanding Items
- Concurrent battle action handling strategy
- Deterministic battle method implementation
- Enemy scaling formula (target: ~100 matches to beat final level)

---

## Progress Summary

**Total Milestones**: 40+  
**Completed**: 1 (Phase 0.1)  
**In Progress**: 0  
**Not Started**: 39+

**Current Phase**: Phase 0 - Foundation & Setup ✅ **COMPLETE**  
**Next Milestone**: Phase 1.1 - Enums & Types

---

## Phase 0 Complete! 🎉

All foundation tasks completed:
- ✅ Test framework enhanced
- ✅ Test database configured
- ✅ Test fixtures created
- ✅ Prisma migration system reset (baseline migration created)

**Ready to begin Phase 1: Core Data Models & Utilities**

---

## How to Update This Document

When completing a milestone:

1. Check off all completed items
2. Update Status to "Completed"
3. Add Date Completed
4. Document Test Results
5. Note any Blockers/Issues encountered
6. Mark Verification status
7. Update Progress Summary at bottom

Example:
```markdown
**Status**: Completed  
**Date Completed**: 2024-01-15  
**Test Results**: All unit tests passing (15/15), integration tests passing (8/8)  
**Blockers/Issues**: None  
**Verification**: Manual testing completed, code reviewed
```
