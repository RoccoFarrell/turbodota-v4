# Concurrent Battle Actions - Example Scenarios

This document provides examples of concurrent battle action scenarios to help determine the appropriate handling strategy.

## Scenario 1: Multiple Browser Tabs

**Situation**: User has the same battle open in two browser tabs.

**Example Flow**:
1. User opens `/battler/play` in Tab A (battle at turn 3)
2. User opens `/battler/play` in Tab B (same battle, turn 3)
3. User plays a card in Tab A → API call updates battle state to turn 4
4. User tries to play a card in Tab B → What happens?

**Potential Issues**:
- Tab B has stale state (still thinks it's turn 3)
- Tab B's action might be based on outdated information
- Could lead to invalid game state

**Possible Solutions**:
1. **Optimistic Locking**: Check battle state version/timestamp before applying action
2. **Pessimistic Locking**: Lock battle state during action processing
3. **State Refresh**: Tab B refreshes state before allowing action
4. **Single Active Session**: Only allow one active session per battle

## Scenario 2: Rapid Card Plays

**Situation**: User clicks multiple cards very quickly in succession.

**Example Flow**:
1. User clicks Card A (cost: 2 energy, current energy: 3)
2. Before response, user clicks Card B (cost: 2 energy)
3. Both API calls sent simultaneously
4. Both think they have enough energy

**Potential Issues**:
- Both cards might be played even though only 3 energy available
- Could result in negative energy or invalid state

**Possible Solutions**:
1. **Queue Actions**: Process actions sequentially on server
2. **Optimistic UI**: Disable cards immediately on click, re-enable if action fails
3. **Energy Validation**: Server validates energy before each action
4. **Transaction Locking**: Lock battle state during action processing

## Scenario 3: Network Latency

**Situation**: User's network is slow, causing delayed responses.

**Example Flow**:
1. User plays Card A → API call sent (takes 2 seconds)
2. User thinks nothing happened, clicks Card A again
3. First request completes → Card A played
4. Second request arrives → Tries to play Card A again (but card already played)

**Potential Issues**:
- Duplicate actions
- Invalid game state
- User confusion

**Possible Solutions**:
1. **Request Deduplication**: Track in-flight requests, ignore duplicates
2. **Optimistic UI**: Show action immediately, rollback if fails
3. **Action IDs**: Each action has unique ID, server ignores duplicates
4. **State Polling**: Poll for state updates instead of relying on response

## Scenario 4: Abandon and Resume

**Situation**: User abandons battle, then tries to resume while another action is processing.

**Example Flow**:
1. User is in battle (turn 5)
2. User closes browser (state saved)
3. User reopens browser, resumes battle
4. While loading, old request from before close completes
5. State conflict: old turn 5 action vs. new resume

**Potential Issues**:
- State conflicts
- Lost actions
- Inconsistent battle state

**Possible Solutions**:
1. **Action Timestamps**: Ignore actions older than last saved state
2. **State Versioning**: Each state has version number, reject old versions
3. **Action Queue**: Queue actions with timestamps, process in order
4. **Resume Validation**: On resume, validate no pending actions exist

## Recommended Approach

Based on the requirement for deterministic battles and full state persistence:

### Primary Strategy: Optimistic Locking with State Versioning

1. **State Versioning**: Each battle state has a version number (increments with each action)
2. **Version Check**: Before processing action, check current state version matches client's version
3. **Conflict Resolution**: If versions don't match, return current state to client for refresh
4. **Action Queue**: Process actions sequentially (one at a time per battle)

### Implementation Details

```typescript
// Battle state includes version
interface BattleState {
  version: number;
  turn: number;
  // ... other state
}

// API endpoint checks version
async function playCard(battleId: string, cardId: string, clientVersion: number) {
  const battle = await getBattle(battleId);
  
  if (battle.state.version !== clientVersion) {
    // State has changed, return current state
    return { error: 'STATE_CHANGED', currentState: battle.state };
  }
  
  // Process action
  const newState = processCardPlay(battle.state, cardId);
  newState.version = battle.state.version + 1;
  
  // Save state
  await saveBattleState(battleId, newState);
  
  return { success: true, newState };
}
```

### Additional Safeguards

1. **Client-Side**: Disable cards/buttons while action is processing
2. **Server-Side**: Transaction locking for battle state updates
3. **Polling**: Client polls for state updates if action takes too long
4. **Timeout**: Actions timeout after reasonable time (5-10 seconds)

## Questions for User

1. Should we prevent multiple tabs from accessing the same battle?
2. How should we handle the UI when state conflicts occur?
3. Should we show a "syncing" indicator when state is being updated?
4. What's the acceptable delay for battle actions? (affects timeout settings)
