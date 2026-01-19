# Pre-Development Questions & Brainstorming Items

This document captures open questions, design decisions, and items to resolve before beginning development of the card battler feature.

## Status
**Created**: Before development begins  
**Purpose**: Identify gaps, clarify requirements, and make final design decisions

---

## Critical Questions to Resolve

### 1. Database Schema & Migration ✅ RESOLVED

**Question**: Should we create a separate migration file or add to existing schema?
- [x] **Decision**: Reset Prisma migration system before beginning
- [x] **Decision**: Use PostgreSQL-appropriate types (JSONB for effects)
- [x] **Decision**: Full battle state stored in `BattlerRun.battleState` JSONB field
- [x] **Decision**: Resume abandoned runs capability required

**Question**: How to handle the `effects` field (JSON string)?
- [x] **Decision**: Use JSONB (PostgreSQL native type)
- [x] **Decision**: Extensible structure for future effects
- [x] **Note**: Type safety and validation to be implemented in TypeScript layer

**Question**: Should `BattlerRun` store full battle state or reference encounters?
- [x] **Decision**: Full battle state persisted after each action
- [x] **Decision**: Stored in `BattlerRun.battleState` JSONB field
- [x] **Decision**: Enables resume capability for abandoned runs

### 2. Card Acquisition & Performance Calculation ✅ RESOLVED

**Question**: How to handle users with very few matches (< 10)?
- [x] **Decision**: Use Stratz API to compare against hero averages (not user history)
- [x] **Decision**: No minimum match threshold needed
- [x] **Decision**: New users initialized with base game, need Dota 2 match to progress

**Question**: Should performance calculation be cached?
- [x] **Decision**: Use Stratz API (https://api.stratz.com/graphiql) for hero averages
- [x] **Decision**: No need to recalculate user history - uses hero averages instead
- [x] **Note**: Stratz API provides performance data, alleviating cache concerns

**Question**: How to handle retroactive card claiming?
- [x] **Decision**: Users can claim any number of past games
- [x] **Decision**: Manual claiming (users visit site to claim)
- [x] **Decision**: Use existing `Match` and `PlayersMatchDetail` tables
- [x] **Note**: Test methods needed to simulate matches for testing

### 3. Forge System ✅ RESOLVED

**Question**: Can users forge multiple cards at once?
- [x] **Decision**: Single card forge only (no batch operations)
- [x] **Decision**: Each forge action forges one card

**Question**: What happens if user has partial sets (e.g., 2 COMMON, 1 UNCOMMON)?
- [x] **Decision**: Dismantle feature implemented (reverse forge)
- [x] **Decision**: 1 higher rarity → 3 lower rarity
- [x] **Decision**: No quantity caps - users can accumulate unlimited cards of each rarity

**Question**: Should forge operations be reversible?
- [x] **Decision**: Yes - Dismantle feature allows reverse forge
- [x] **Decision**: Tracked via `ForgeOperationType` enum (FORGE or DISMANTLE)
- [x] **Decision**: Cards removed from active decks when forged/dismantled

### 4. Deck Building ✅ RESOLVED

**Question**: Can users have multiple copies of the same card in a deck?
- [x] **Decision**: Yes, users can have multiple copies (no cap on collection quantities)
- [x] **Decision**: Users can accumulate unlimited cards of each rarity

**Question**: What happens if user forges a card that's in an active deck?
- [x] **Decision**: Card automatically removed from active deck when forged
- [x] **Decision**: Since card is consumed in forge, it's removed from deck

**Question**: Should there be a limit on number of decks per user?
- [x] **Decision**: 5 decks max to start (may change in future)
- [x] **Decision**: Each deck can have up to 10 cards

### 5. Battle System ✅ RESOLVED

**Question**: How to handle battle state persistence?
- [x] **Decision**: Full battle state persisted in database after each action
- [x] **Decision**: Stored in `BattlerRun.battleState` JSONB field
- [x] **Decision**: Enables resume capability for abandoned runs

**Question**: Should battles be deterministic or allow RNG?
- [x] **Decision**: Deterministic battles (but not obvious to users)
- [x] **Decision**: Need to brainstorm methods to achieve deterministic but not obvious gameplay
- [x] **Note**: Deterministic approach aids testing significantly

**Question**: How to handle concurrent battle actions?
- [ ] **Need Example**: User requested more info - see CONCURRENT_BATTLE_ACTIONS.md
- [ ] **Consider**: Locking strategy for race conditions
- [ ] **Consider**: User experience with multiple tabs

**Question**: What happens if user closes browser mid-battle?
- [x] **Decision**: Full state persisted after each battle action
- [x] **Decision**: User can resume from last action
- [x] **Decision**: No timeout needed - state always saved

### 6. Enemy AI & Encounter Generation ✅ RESOLVED

**Question**: Should enemy selection be deterministic or random?
- [x] **Decision**: Simple and deterministic to start (simplifies development)
- [x] **Decision**: Can make more complex later

**Question**: How to handle enemy scaling across floors?
- [x] **Decision**: Target ~100 matches (50 wins at 50% win rate) to beat final level
- [x] **Decision**: Need to determine proper scaling formula during development
- [x] **Note**: Balance testing will be needed to achieve target

**Question**: Should elite/boss encounters be fixed or random?
- [x] **Decision**: Fixed encounters to start (simplifies development)
- [x] **Decision**: Can add variety/complexity later

### 7. Status Effects & Card Effects ✅ RESOLVED

**Question**: How to structure the `effects` JSON field?
- [x] **Decision**: Extensible JSONB structure for future effects
- [x] **Decision**: Type safety to be implemented in TypeScript layer
- [x] **Decision**: Design for extensibility from the start

**Question**: Should status effects stack infinitely or have caps?
- [x] **Decision**: Status effects stack infinitely to start
- [x] **Decision**: Can add caps later if needed for balance

**Question**: How to handle complex card interactions (e.g., "draw cards" when deck is empty)?
- [x] **Decision**: Graceful degradation - user can always play card
- [x] **Decision**: If effect has no target/does nothing, card still plays but effect is skipped
- [x] **Example**: Draw cards when deck empty → card plays, no cards drawn

### 8. Performance & Scalability ✅ RESOLVED

**Question**: How to optimize card collection queries?
- [x] **Decision**: Optimization is core tenet from beginning
- [x] **Decision**: Need to assist with optimization strategies
- [x] **Note**: Will need to determine caching, query optimization, pagination during development

**Question**: Should battle calculations be server-side only?
- [x] **Decision**: Server-side calculations only
- [x] **Decision**: Use SvelteKit server functions (RPC functions)
- [x] **Decision**: Prevents cheating, ensures deterministic results

**Question**: How to handle large collections (500+ cards)?
- [x] **Decision**: Optimization is core tenet from beginning
- [x] **Decision**: Need to assist with optimization strategies
- [x] **Note**: Will need to determine pagination/filtering during development

### 9. User Experience & UI ✅ RESOLVED

**Question**: Should card claiming be automatic or manual?
- [x] **Decision**: Manual claiming (users visit site to claim)
- [x] **Decision**: Users can claim any number of past games

**Question**: How to display card effects in UI?
- [x] **Decision**: Display with small icons
- [x] **Decision**: Utilize color and icons to make it feel more game-like
- [x] **Decision**: Visual, game-like presentation

**Question**: Should there be animations for card plays?
- [x] **Decision**: Simple Svelte fade-in animation to start
- [x] **Decision**: Don't make it too complicated
- [x] **Decision**: Keep animations simple

**Question**: How to handle mobile responsiveness?
- [x] **Decision**: Mobile-first design as primary
- [x] **Decision**: Scalable to desktop
- [x] **Decision**: Responsive design approach

### 10. Testing & Quality Assurance ✅ RESOLVED

**Question**: How to test complex battle interactions?
- [x] **Decision**: Deterministic battles significantly aid testing
- [x] **Decision**: Need to be expert on testing complex battle actions
- [x] **Note**: Deterministic approach makes testing much easier

**Question**: Should we have a "test mode" for battle mechanics?
- [x] **Decision**: Yes, test mode for robust testing
- [x] **Decision**: Very interested in robust testing
- [x] **Decision**: Test mode to be implemented

**Question**: How to handle test data for 127 heroes × 4 rarities?
- [x] **Decision**: Seed database once with all 127 × 4 cards (508 cards)
- [x] **Decision**: Use seeded data moving forward
- [x] **Decision**: One-time seed, then reuse

### 11. Integration with Existing System ✅ RESOLVED

**Question**: How to integrate with existing match tracking?
- [x] **Decision**: Use existing `Match` and `PlayersMatchDetail` tables
- [x] **Decision**: Add test methods to simulate matches for testing
- [x] **Decision**: Matches can be played on any hero, with random stats, win or loss
- [x] **Note**: Review Prisma schema for match details structure

**Question**: Should card battler be a separate feature or integrated into main nav?
- [x] **Decision**: Completely separate feature
- [x] **Decision**: Small icon in existing nav
- [x] **Decision**: Separate from other features

**Question**: How to handle users who haven't played Dota 2 matches?
- [x] **Decision**: Initialize with base game
- [x] **Decision**: Need to play Dota 2 match to progress
- [x] **Decision**: Starter/base game provided

### 12. Future Features & Extensibility ✅ RESOLVED

**Question**: Should we design for future features (shops, events, relics)?
- [x] **Decision**: Yes, design for extensibility
- [x] **Decision**: May eventually add shop
- [x] **Decision**: Plan for future features in schema/API design

**Question**: How to handle card balance updates?
- [x] **Decision**: Card balance updates change cards in database
- [x] **Decision**: Plan for database updates
- [x] **Decision**: Cards updated directly in database

**Question**: Should there be a leaderboard or achievements?
- [x] **Decision**: Yes, leaderboard similar to Turbotown leagues/seasons
- [x] **Decision**: Limits leaderboard to users in league
- [x] **Decision**: Similar to existing league system

---

## Design Decisions Needed

### High Priority

1. **Effect JSON Schema** - Need to finalize structure before implementation
2. **Battle State Persistence** - Critical for resume functionality
3. **Performance Calculation Caching** - Impacts scalability
4. **Card Claiming Flow** - Core user experience
5. **Deck Update Behavior** - When cards are forged/removed

### Medium Priority

6. **Enemy Selection Strategy** - Affects replayability
7. **Status Effect Stacking** - Balance implications
8. **Mobile Support Scope** - Development effort
9. **Test Data Strategy** - Development velocity

### Low Priority (Can be decided during development)

10. **Animation Scope** - Polish feature
11. **Leaderboard Features** - Future enhancement
12. **Tutorial System** - Can be added post-MVP

---

## Technical Debt Considerations

### Known Technical Challenges

1. **Effect Parsing** - JSON string parsing needs type safety
2. **Battle State Size** - May grow large with full state storage
3. **Match History Queries** - Performance for percentile calculation
4. **Card Collection Queries** - Optimization for large collections

### Areas Requiring Research

1. **Skeleton UI Components** - Which components to use for card display
2. **SvelteKit Form Actions** - Best practices for deck building
3. **Prisma Performance** - Query optimization strategies
4. **Vitest Testing** - Mocking strategies for complex interactions

---

## Action Items Before Development

### Must Resolve (Blocking)

- [x] Finalize effect JSON schema → **RESOLVED**: Extensible JSONB structure
- [x] Decide on battle state persistence approach → **RESOLVED**: Full state in JSONB after each action
- [x] Determine performance calculation caching strategy → **RESOLVED**: Use Stratz API (no caching needed)
- [x] Finalize card claiming flow (auto vs. manual) → **RESOLVED**: Manual claiming, any past games
- [ ] Create PROGRESS.md file for tracking
- [ ] Reset Prisma migration system (before beginning development)
- [ ] Determine concurrent battle action handling (see CONCURRENT_BATTLE_ACTIONS.md)
- [ ] Brainstorm deterministic battle methods (not obvious to users)

### Should Resolve (Important)

- [ ] Design enemy selection algorithm
- [ ] Finalize status effect stacking rules
- [ ] Plan test data generation strategy
- [ ] Design card effect display format

### Nice to Have (Can defer)

- [ ] Plan animation system
- [ ] Design tutorial flow
- [ ] Plan future feature hooks

---

## Notes

- Most questions have recommendations in existing docs, but need final decisions
- Some questions can be answered during development with iterative approach
- Focus on MVP first, then iterate based on playtesting
- Keep design flexible for future enhancements

---

## Next Steps

1. Review this document with stakeholders
2. Make final decisions on blocking items
3. Create PROGRESS.md for milestone tracking
4. Begin Phase 0: Foundation & Setup
