# Battle Mechanics & Enemy AI

This document details the battle system, enemy AI patterns, and encounter design for the Card Battler feature.

---

## Battle Flow

### Turn Structure

1. **Start of Turn**
   - Draw cards (if hand < 5, draw to 5)
   - Restore energy (to max, typically 3)
   - Apply start-of-turn effects (POWER cards, status effects)
   - Reveal enemy intent

2. **Player Turn**
   - Player plays cards (spend energy)
   - Apply card effects immediately
   - Cards go to discard pile

3. **End of Turn**
   - Apply end-of-turn effects (Poison, Burn, etc.)
   - Check win/loss conditions

4. **Enemy Turn**
   - Enemy performs action (based on intent)
   - Apply damage/effects to player
   - Update enemy state

5. **Repeat**

### Win/Loss Conditions

**Victory:**
- Enemy health reaches 0

**Defeat:**
- Player health reaches 0

**Flee:**
- Player can abandon encounter (loses run)

---

## Enemy AI Patterns

### Pattern Types

#### 1. Simple Attack Pattern
**Used by**: Basic enemies (Goblins, Wolves, etc.)

```
Turn 1: Attack (8 damage)
Turn 2: Attack (8 damage)
Turn 3: Attack (8 damage)
Repeat...
```

**Variants:**
- **Weak Attack**: 5 damage every turn
- **Strong Attack**: 12 damage every turn
- **Variable**: Random 6-10 damage

#### 2. Charge Pattern
**Used by**: Aggressive enemies (Dire Wolf, Orc Warrior)

```
Turn 1: Charge (gain 2 Strength)
Turn 2: Attack (10 damage)
Turn 3: Attack (10 damage)
Turn 4: Big Attack (18 damage)
Repeat from Turn 1...
```

**Design**: Predictable but dangerous if not blocked

#### 3. Defensive Pattern
**Used by**: Tanky enemies (Stone Golem, Shield Guardian)

```
Turn 1: Block (gain 8 Block)
Turn 2: Attack (6 damage)
Turn 3: Block (gain 8 Block)
Turn 4: Attack (6 damage)
Repeat...
```

**Design**: Low damage but hard to kill quickly

#### 4. Debuff Pattern
**Used by**: Caster enemies (Dark Mage, Shadow Priest)

```
Turn 1: Apply Weak (player deals 25% less damage)
Turn 2: Attack (7 damage)
Turn 3: Apply Vulnerable (player takes 50% more damage)
Turn 4: Attack (10 damage)
Repeat from Turn 1...
```

**Design**: Weakens player over time

#### 5. Buff Pattern
**Used by**: Scaling enemies (Cultist, Blood Mage)

```
Turn 1: Buff Self (gain 2 Strength)
Turn 2: Attack (8 damage)
Turn 3: Buff Self (gain 2 Strength)
Turn 4: Attack (10 damage)
Turn 5: Buff Self (gain 2 Strength)
Turn 6: Attack (12 damage)
...continues scaling...
```

**Design**: Gets stronger over time, race to kill

#### 6. Cycle Pattern
**Used by**: Complex enemies (Elite enemies)

```
Turn 1: Attack (10 damage)
Turn 2: Buff Self (gain 3 Strength)
Turn 3: Big Attack (15 damage)
Turn 4: Apply Weak to player
Turn 5: Attack (10 damage)
Repeat from Turn 1...
```

**Design**: Multiple phases, requires planning

---

## Enemy Examples

### Floor 1-2: Basic Enemies

#### Goblin Scout (COMMON)
```
Health: 40
Pattern: Simple Attack
Intent: "Attack 6"
```
*Easy first encounter, teaches basics*

#### Dire Wolf (COMMON)
```
Health: 55
Pattern: Charge Pattern
Intent: "Attack 10" or "Charge (+2 Strength)"
```
*Slightly harder, introduces pattern reading*

### Floor 3-5: Normal Enemies

#### Orc Warrior (COMMON)
```
Health: 70
Pattern: Simple Attack (stronger)
Intent: "Attack 12"
```
*Standard damage dealer*

#### Dark Mage (UNCOMMON)
```
Health: 60
Pattern: Debuff Pattern
Intent: "Apply Weak" or "Attack 7"
```
*Introduces status effects*

#### Stone Golem (UNCOMMON)
```
Health: 90
Pattern: Defensive Pattern
Intent: "Block 8" or "Attack 6"
```
*High health, teaches importance of damage over time*

### Floor 6-8: Harder Enemies

#### Blood Cultist (RARE)
```
Health: 80
Pattern: Buff Pattern
Intent: "Buff Self (+2 Strength)" or "Attack 8"
```
*Scaling threat, race condition*

#### Shadow Assassin (RARE)
```
Health: 65
Pattern: Cycle Pattern
Intent: "Attack 12" or "Apply Vulnerable" or "Big Attack 18"
```
*Complex pattern, requires planning*

### Floor 3, 6, 9: Elite Enemies

#### Elite Orc Chieftain
```
Health: 120
Pattern: Enhanced Cycle
Intent: Rotates through:
  - "Attack 15"
  - "Buff Self (+3 Strength)"
  - "Big Attack 20"
  - "Apply Weak + Vulnerable"
```
*Multi-phase fight, significant challenge*

#### Elite Dark Archmage
```
Health: 100
Pattern: Advanced Debuff
Intent: Rotates through:
  - "Apply Weak"
  - "Apply Vulnerable"
  - "Attack 10"
  - "Big Attack 15 + Apply Frail"
```
*Status effect nightmare, requires cleanse*

### Floor 10: Boss Enemies

#### Roshan - "The Immortal" (BOSS)
```
Health: 200
Phases: 3

Phase 1 (200-150 HP):
  Pattern: "Attack 12" every turn
  Special: None

Phase 2 (150-75 HP):
  Pattern: Rotates:
    - "Attack 15"
    - "Buff Self (+3 Strength)"
    - "Big Attack 20"
  Special: Gains 1 Strength at start of each turn

Phase 3 (75-0 HP):
  Pattern: "Enraged!"
    - Every turn: "Attack 18 + Apply Weak"
    - Gains 2 Strength at start of each turn
  Special: Cannot be stunned
```
*Multi-phase boss, tests deck strength*

#### Ancient Dragon (BOSS)
```
Health: 180
Phases: 2

Phase 1 (180-90 HP):
  Pattern: Rotates:
    - "Breath Attack 12" (hits all)
    - "Fly" (immune to damage, gains 5 Block)
    - "Claw Attack 15"
  Special: Immune to status effects

Phase 2 (90-0 HP):
  Pattern: "Fury Mode"
    - Every turn: "Breath Attack 15 + Apply Burn"
  Special: Applies 2 Burn at start of each turn
```
*AOE damage, status effects, tests deck versatility*

---

## Status Effects System

### Player Buffs

#### Strength
- **Effect**: +1 Attack per stack
- **Duration**: Until end of combat
- **Max Stacks**: None (but rare to get many)
- **Example Sources**: Pudge "The Butcher", Omniknight "Guardian Angel"

#### Dexterity
- **Effect**: +1 Block per stack
- **Duration**: Until end of combat
- **Max Stacks**: None
- **Example Sources**: Omniknight "Guardian Angel"

#### Focus
- **Effect**: +1 Energy per stack (this combat only)
- **Duration**: Until end of combat
- **Max Stacks**: None
- **Example Sources**: Invoker "Quas"

### Player Debuffs

#### Weak
- **Effect**: Deal 25% less damage
- **Duration**: Until removed or end of combat
- **Removal**: Can be cleansed
- **Example Sources**: Enemy attacks, Dark Mage

#### Vulnerable
- **Effect**: Take 50% more damage
- **Duration**: Until removed or end of combat
- **Removal**: Can be cleansed
- **Example Sources**: Enemy attacks, Shadow Assassin

#### Frail
- **Effect**: Gain 25% less block
- **Duration**: Until removed or end of combat
- **Removal**: Can be cleansed
- **Example Sources**: Elite Dark Archmage

### Enemy Status Effects

#### Poison
- **Effect**: Take X damage at end of each turn
- **Duration**: Until removed or enemy dies
- **Stacking**: Yes (adds damage)
- **Example Sources**: Venomancer cards (future)

#### Burn
- **Effect**: Take X damage at start of each turn
- **Duration**: Until removed or enemy dies
- **Stacking**: Yes
- **Example Sources**: Lina cards, Ancient Dragon

#### Stun
- **Effect**: Skip next turn
- **Duration**: 1 turn
- **Stacking**: No (refreshes duration)
- **Example Sources**: Sven "Storm Hammer"

---

## Battle Calculations

### Damage Calculation

```
Final Damage = Base Damage × Modifiers

Modifiers:
- Weak: ×0.75
- Strength: +1 per stack
- Vulnerable (on target): ×1.5
```

**Example:**
- Base Attack: 10
- Player has 2 Strength: +2 = 12
- Player has Weak: ×0.75 = 9
- Enemy has Vulnerable: ×1.5 = 13.5 → 14 (rounded)

### Block Calculation

```
Damage Taken = Enemy Damage - Block - Modifiers

Modifiers:
- Frail: Block ×0.75
- Dexterity: +1 Block per stack
```

**Example:**
- Enemy Attack: 15
- Player Block: 10
- Player has 2 Dexterity: +2 = 12 Block
- Player has Frail: ×0.75 = 9 Block
- Damage Taken: 15 - 9 = 6

### Energy Calculation

```
Available Energy = Base Energy + Focus Stacks
```

**Example:**
- Base Energy: 3
- Focus: 2
- Available: 5 energy

---

## Encounter Generation

### Floor-Based Scaling

```
Enemy Health = Base Health × (1 + Floor × 0.1)
Enemy Damage = Base Damage × (1 + Floor × 0.05)
```

**Example (Floor 5):**
- Base Health: 60
- Scaled: 60 × 1.5 = 90
- Base Damage: 8
- Scaled: 8 × 1.25 = 10

### Enemy Selection

**Floor 1-2:**
- 100% Basic enemies (Goblin, Dire Wolf)

**Floor 3-5:**
- 70% Normal enemies
- 30% Uncommon enemies

**Floor 6-8:**
- 50% Normal enemies
- 40% Uncommon enemies
- 10% Rare enemies

**Floor 9:**
- 30% Uncommon enemies
- 70% Rare enemies

**Floor 10:**
- 100% Boss

**Elite Floors (3, 6, 9):**
- Replace one encounter with Elite enemy

---

## Battle UI States

### Pre-Battle
- Show enemy type and health
- Show player deck
- "Start Battle" button

### In-Battle
- Enemy health bar (with max)
- Enemy intent display
- Player health bar
- Player energy display
- Hand of cards (5 cards)
- Deck count
- Discard pile count
- "End Turn" button
- "Flee" button (abandon encounter)

### Post-Battle (Victory)
- Victory message
- Damage dealt/taken summary
- Cards played count
- "Continue" button (next floor)
- "View Rewards" (future)

### Post-Battle (Defeat)
- Defeat message
- Floor reached
- Run summary
- "Try Again" button
- "Return to Hub" button

---

## Future Battle Features

### Events
- Random events between battles
- Choices that affect run
- Example: "Rest" (heal 20 HP) vs "Upgrade Card"

### Shops
- Spend gold on cards
- Remove cards from deck
- Upgrade cards

### Relics
- Permanent bonuses for the run
- Example: "Start each combat with +1 Energy"
- Example: "Draw 1 extra card per turn"

### Card Upgrades
- Upgrade cards during run
- Example: "Storm Hammer+" (deal 10 damage instead of 8)

---

## Balancing Notes

### Enemy Health
- Floor 1: 40-50 HP (easy)
- Floor 5: 70-90 HP (medium)
- Floor 10: 180-200 HP (boss)

### Enemy Damage
- Basic: 6-8 per turn
- Normal: 10-12 per turn
- Elite: 15-18 per turn
- Boss: 12-20 per turn (varies by phase)

### Player Health
- Starting: 80 HP
- Max: 80 HP (can be increased by relics/future features)
- Healing: Rare (events, future cards)

### Energy Economy
- Base: 3 energy per turn
- Average card cost: 1.5 energy
- Allows 2 cards per turn on average
- High-cost cards (3 energy) should be powerful

---

## Testing Scenarios

### Scenario 1: Aggressive Deck
- **Deck**: All attack cards
- **Test**: Can it kill enemies before taking too much damage?
- **Expected**: Works on early floors, struggles on elites/boss

### Scenario 2: Defensive Deck
- **Deck**: All defense cards
- **Test**: Can it survive long enough to chip enemies down?
- **Expected**: Struggles with scaling enemies, good vs burst

### Scenario 3: Balanced Deck
- **Deck**: Mix of attack, defense, skill
- **Test**: Can it handle all enemy types?
- **Expected**: Most versatile, should perform well

### Scenario 4: Combo Deck
- **Deck**: Synergistic cards (e.g., Pudge + Axe)
- **Test**: Do combos work as intended?
- **Expected**: High skill ceiling, powerful when executed

---

## Implementation Priority

### Phase 1: Basic Combat
- Simple attack pattern enemies
- Basic damage/block calculation
- Win/loss conditions

### Phase 2: Patterns
- Multiple enemy patterns
- Intent system
- Status effects (basic)

### Phase 3: Elites & Bosses
- Elite enemies
- Boss encounters
- Multi-phase fights

### Phase 4: Polish
- Status effect system (full)
- Animations
- Sound effects (future)
