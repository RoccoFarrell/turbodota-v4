# Lifetime Statistics Tracking

This document details the lifetime statistics tracking system for the card battler feature.

## Overview

The system tracks aggregated statistics across all user battles to provide insights into:
- Overall battle performance
- Card usage patterns
- Damage dealt per card
- Win rates and progression

## Database Models

### BattlerUserStats

Tracks aggregated statistics at the user level across all runs.

**Fields**:
- `totalRuns` - Total number of runs started
- `totalBattlesWon` - Total battles won (encounters with VICTORY status)
- `totalBattlesLost` - Total battles lost (encounters with DEFEAT status)
- `totalBattlesFled` - Total battles fled (encounters with FLEE status)
- `totalEnemiesKilled` - Total enemies defeated across all encounters
- `totalDamageDealt` - Sum of all damage dealt in all battles
- `totalDamageTaken` - Sum of all damage taken in all battles
- `totalBlockGained` - Sum of all block gained in all battles
- `totalCardsPlayed` - Total number of cards played across all battles
- `totalEnergySpent` - Total energy spent across all battles
- `runsCompleted` - Runs that reached floor 10 (COMPLETED status)
- `runsAbandoned` - Runs abandoned by user (ABANDONED status)
- `runsDefeated` - Runs where user was defeated (DEFEATED status)
- `highestFloorReached` - Highest floor number reached in any run
- `winRate` - Calculated: `battlesWon / (battlesWon + battlesLost)`

**Relations**:
- One-to-one with `User`
- One-to-many with `BattlerCardStats`

### BattlerCardStats

Tracks usage statistics for each card per user.

**Fields**:
- `timesPlayed` - Number of times this card was played
- `totalDamageDealt` - Total damage dealt by this card
- `totalBlockGained` - Total block gained from this card
- `totalKills` - Number of enemies killed by this card
- `avgDamagePerPlay` - Calculated: `totalDamageDealt / timesPlayed`
- `avgBlockPerPlay` - Calculated: `totalBlockGained / timesPlayed`

**Relations**:
- Many-to-one with `User`
- Many-to-one with `BattlerUserStats`
- Many-to-one with `BattlerCard`

**Unique Constraint**: `[userId, cardId]` - One stat record per user per card

## Statistics Update Flow

### During Battle

1. **Card Played**:
   - Increment `BattlerCardStats.timesPlayed`
   - Add damage to `BattlerCardStats.totalDamageDealt`
   - Add block to `BattlerCardStats.totalBlockGained`
   - Update `BattlerUserStats.totalCardsPlayed`
   - Update `BattlerUserStats.totalEnergySpent`

2. **Enemy Killed**:
   - If killed by a card, increment `BattlerCardStats.totalKills` for that card
   - Increment `BattlerUserStats.totalEnemiesKilled`
   - Increment `BattlerUserStats.totalBattlesWon`

3. **Battle Ended**:
   - Update `BattlerUserStats.totalBattlesWon/Lost/Fled` based on encounter status
   - Add encounter totals to user stats:
     - `totalDamageDealt` += encounter `damageDealt`
     - `totalDamageTaken` += encounter `damageTaken`
   - Update `highestFloorReached` if current floor is higher

4. **Run Completed/Abandoned/Defeated**:
   - Update `BattlerUserStats.runsCompleted/Abandoned/Defeated`
   - Recalculate `winRate`

### Initialization

When a user first plays a battle:
- Create `BattlerUserStats` record with all fields at 0
- Create `BattlerCardStats` records as cards are played (lazy initialization)

## API Endpoints

### `GET /api/battler/stats`

Get user's lifetime statistics.

**Response**:
```typescript
{
  totalRuns: number;
  totalBattlesWon: number;
  totalBattlesLost: number;
  totalBattlesFled: number;
  totalEnemiesKilled: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalBlockGained: number;
  totalCardsPlayed: number;
  totalEnergySpent: number;
  runsCompleted: number;
  runsAbandoned: number;
  runsDefeated: number;
  highestFloorReached: number;
  winRate: number | null;
}
```

### `GET /api/battler/stats/cards`

Get card usage statistics.

**Query Parameters**:
- `sortBy`: 'damage' | 'usage' | 'kills' (default: 'damage')
- `limit`: number (default: 50)

**Response**:
```typescript
Array<{
  cardId: string;
  cardName: string;
  timesPlayed: number;
  totalDamageDealt: number;
  totalBlockGained: number;
  totalKills: number;
  avgDamagePerPlay: number | null;
  avgBlockPerPlay: number | null;
}>
```

## Implementation Notes

### Performance Considerations

1. **Lazy Initialization**: Create `BattlerCardStats` records only when a card is first played
2. **Batch Updates**: Consider batching stat updates for multiple cards in a turn
3. **Indexing**: Ensure indexes on `userId` and `cardId` for fast queries
4. **Caching**: Consider caching user stats for frequently accessed data

### Data Integrity

1. **Atomic Updates**: Use database transactions for stat updates
2. **Recalculation**: Provide admin function to recalculate stats from raw data if needed
3. **Validation**: Ensure stats are always non-negative

### Future Enhancements

- **Time-based Stats**: Track stats per day/week/month
- **Card Rarity Stats**: Aggregate stats by card rarity
- **Deck Stats**: Track stats per deck
- **Achievement System**: Use stats for achievements/unlocks

## Example Queries

### Get Top Damage Cards
```sql
SELECT 
  bc.name,
  bcs.times_played,
  bcs.total_damage_dealt,
  bcs.avg_damage_per_play
FROM battler_card_stats bcs
JOIN battler_card bc ON bcs.card_id = bc.id
WHERE bcs.user_id = $1
ORDER BY bcs.total_damage_dealt DESC
LIMIT 10;
```

### Calculate Win Rate
```sql
SELECT 
  total_battles_won::float / 
  NULLIF(total_battles_won + total_battles_lost, 0) as win_rate
FROM battler_user_stats
WHERE user_id = $1;
```

## Testing

- Test stat updates after each battle action
- Test stat aggregation across multiple runs
- Test card stats initialization on first play
- Test win rate calculation (including edge cases: 0 wins, 0 losses)
- Test stat queries with large datasets
