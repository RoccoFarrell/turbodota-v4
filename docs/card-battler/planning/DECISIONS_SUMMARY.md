# Card Battler - Design Decisions Summary

This document provides a quick reference for all key design decisions made before development begins.

## Database & Schema

- **Migration System**: Reset Prisma migration system before beginning (currently committing directly to schema)
- **Database**: PostgreSQL
- **JSON Fields**: Use JSONB for PostgreSQL (effects, battle state, etc.)
- **Battle State**: Full state persisted in `BattlerRun.battleState` JSONB field after each action
- **Resume Capability**: Full state persistence enables resume of abandoned runs

## Card Acquisition

- **Performance Calculation**: Use Stratz API (https://api.stratz.com/graphiql) to compare against hero averages
- **Claiming**: Manual claiming (users visit site to claim)
- **Retroactive Claims**: Users can claim any number of past games
- **Match Data**: Use existing `Match` and `PlayersMatchDetail` tables
- **Testing**: Add test methods to simulate matches (any hero, random stats, win/loss)

## Forge System

- **Batch Operations**: No batch forging - single card forge only
- **Quantity Caps**: No caps - users can accumulate unlimited cards of each rarity
- **Dismantle**: Reverse forge feature (1 higher → 3 lower rarity)
- **Deck Impact**: Cards automatically removed from active decks when forged/dismantled
- **Operation Types**: Track via `ForgeOperationType` enum (FORGE or DISMANTLE)

## Deck Building

- **Deck Limit**: 5 decks max per user (may change in future)
- **Cards Per Deck**: 10 cards max per deck
- **Duplicate Cards**: Allowed (no quantity restrictions)
- **Collection**: No caps on card quantities

## Battle System

- **Determinism**: Deterministic battles (but not obvious to users)
- **State Persistence**: Full state persisted after each action
- **Resume**: Users can leave and resume at any time
- **Calculations**: Server-side only (SvelteKit server functions)
- **Concurrent Actions**: Need to determine handling strategy (see CONCURRENT_BATTLE_ACTIONS.md)
- **Deterministic Methods**: Need to brainstorm (see DETERMINISTIC_BATTLES.md)

## Enemy AI & Encounters

- **Complexity**: Simple and deterministic to start
- **Scaling**: Target ~100 matches (50 wins at 50% win rate) to beat final level
- **Encounters**: Fixed encounters to start (can add variety later)
- **Future**: Can make more complex later

## Effects & Status

- **Effect Structure**: Extensible JSONB structure for future effects
- **Status Stacking**: Infinite stacking to start
- **Graceful Degradation**: Cards can always be played, even if effect does nothing
- **Display**: Icons and colors for game-like feel

## Performance & Optimization

- **Core Tenet**: Optimization is core tenet from beginning
- **Server-Side**: All battle calculations server-side
- **SvelteKit RPC**: Use SvelteKit server functions for calculations
- **Large Collections**: Need optimization strategies (pagination, caching, etc.)

## User Experience

- **Claiming**: Manual (users visit site)
- **Effects Display**: Icons and colors
- **Animations**: Simple Svelte fade-in (not too complicated)
- **Design**: Mobile-first, scalable to desktop
- **Navigation**: Separate feature with small icon in nav
- **New Users**: Initialize with base game, need Dota 2 match to progress

## Testing

- **Deterministic**: Aids testing significantly
- **Test Mode**: Yes, for robust testing
- **Seed Data**: Seed database once with all 127 × 4 cards (508 cards)
- **Test Matches**: Methods to simulate matches for testing

## Integration

- **Match Tables**: Use existing `Match` and `PlayersMatchDetail` tables
- **Feature Separation**: Completely separate feature
- **Navigation**: Small icon in existing nav
- **New Users**: Base game initialization

## Future Features

- **Extensibility**: Design for future features (shops, events, etc.)
- **Balance Updates**: Card balance updates via database updates
- **Leaderboard**: Similar to Turbotown leagues/seasons (limited to league users)

## Outstanding Items

1. **Concurrent Battle Actions**: Need decision on handling strategy (see CONCURRENT_BATTLE_ACTIONS.md)
2. **Deterministic Methods**: Need to brainstorm implementation (see DETERMINISTIC_BATTLES.md)
3. **Prisma Migration Reset**: Must be done before Phase 0
4. **PROGRESS.md**: Create for milestone tracking
5. **Scaling Formula**: Need to determine enemy scaling to achieve ~100 match target

## Key Files

- **PLANNING.md**: Complete feature specification
- **DEVELOPMENT_ROADMAP.md**: Incremental development strategy
- **PRE_DEVELOPMENT_QUESTIONS.md**: All questions and resolutions
- **CONCURRENT_BATTLE_ACTIONS.md**: Concurrent action scenarios
- **DETERMINISTIC_BATTLES.md**: Deterministic battle strategies
- **TESTING_STRATEGY.md**: Comprehensive testing approach
- **BATTLE_MECHANICS.md**: Battle system details
- **HERO_SPECIFICS.md**: All 127 hero card designs
