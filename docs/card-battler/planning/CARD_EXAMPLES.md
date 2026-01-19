# Card Design Examples

This document provides example card designs for the Card Battler feature, showing how Dota heroes translate into unique cards.

## Design Principles

1. **Hero Identity**: Each card should feel like playing that hero
2. **Rarity Progression**: Each rarity adds new effects or strengthens existing ones
3. **Balanced Costs**: Energy costs create meaningful decisions
4. **Synergies**: Cards work together in interesting ways
5. **Variety**: Mix of simple and complex effects

## Rarity System

Each hero has 4 card versions (one per rarity):

- **COMMON**: Just attack or block, no special effects
- **UNCOMMON**: Gains weak version of hero's unique power
- **RARE**: Stronger hero power + 50% stat boost
- **LEGENDARY**: Strongest hero power + 100% stat boost + cost reduction

---

## Example Cards by Type

### ATTACK Cards

#### Pudge - "Meat Hook" (All Rarities)

**COMMON:**
```
Cost: 2 Energy
Type: ATTACK
Attack: 12
Effect: None
Flavor: "Get over here!"
```
*Just damage, no special effects*

**UNCOMMON:**
```
Cost: 2 Energy
Type: ATTACK
Attack: 12
Effect: "If this kills an enemy, gain 2 Strength"
Flavor: "Fresh meat!"
```
*Weak version of executioner theme - small strength gain*

**RARE:**
```
Cost: 2 Energy
Type: ATTACK
Attack: 18 (+50%)
Effect: "If this kills an enemy, gain 5 Strength"
Flavor: "The butcher's work!"
```
*Stronger effect + better damage*

**LEGENDARY:**
```
Cost: 1 Energy (-1 cost)
Type: ATTACK
Attack: 24 (+100%)
Effect: "If this kills an enemy, gain 8 Strength"
Flavor: "Fresh meat!"
```
*Strongest effect + best stats + cost reduction*

#### Sven - "Storm Hammer" (All Rarities)

**COMMON:**
```
Cost: 1 Energy
Type: ATTACK
Attack: 8
Effect: None
Flavor: "For the honor!"
```
*Just damage*

**UNCOMMON:**
```
Cost: 1 Energy
Type: ATTACK
Attack: 8
Effect: "Apply 1 Stun to target enemy"
Flavor: "Feel the hammer!"
```
*Gains weak stun effect*

**RARE:**
```
Cost: 1 Energy
Type: ATTACK
Attack: 12 (+50%)
Effect: "Apply 1 Stun to target enemy. Deal 3 damage to enemy behind target."
Flavor: "The storm strikes!"
```
*Stronger effect (piercing damage) + better stats*

**LEGENDARY:**
```
Cost: 0 Energy (-1 cost, minimum 1, but could be 0 for legendary)
Type: ATTACK
Attack: 16 (+100%)
Effect: "Apply 2 Stun to target enemy. Deal 5 damage to all enemies."
Flavor: "The storm's fury!"
```
*Strongest effect (AOE + longer stun) + best stats + cost reduction*

#### Phantom Assassin - "Coup de Grace" (RARE)
```
Cost: 2 Energy
Type: ATTACK
Attack: 6
Effect: "25% chance to deal 3x damage"
Flavor: "Death comes unseen."
```
*Design Note: High variance, high reward, fits PA's crit theme*

#### Juggernaut - "Blade Fury" (COMMON)
```
Cost: 2 Energy
Type: ATTACK
Attack: 10
Effect: "Deal 3 damage to all enemies"
Flavor: "The blade dances!"
```
*Design Note: AOE damage, useful for multiple enemies*

#### Lina - "Dragon Slave" (COMMON)
```
Cost: 1 Energy
Type: ATTACK
Attack: 7
Effect: "Deal 2 damage to enemy behind target"
Flavor: "Feel the heat!"
```
*Design Note: Piercing damage, good for positioning*

---

### DEFENSE Cards

#### Axe - "Berserker's Call" (All Rarities)

**COMMON:**
```
Cost: 1 Energy
Type: DEFENSE
Block: 8
Effect: None
Flavor: "Axe is Axe!"
```
*Just block*

**UNCOMMON:**
```
Cost: 1 Energy
Type: DEFENSE
Block: 8
Effect: "When you take damage this turn, deal 2 damage to attacker"
Flavor: "Come at me!"
```
*Weak retaliation effect (thorns)*

**RARE:**
```
Cost: 1 Energy
Type: DEFENSE
Block: 12 (+50%)
Effect: "When you take damage this turn, deal 4 damage to attacker. Gain 1 Strength."
Flavor: "Axe is Axe!"
```
*Stronger retaliation + strength gain + better block*

**LEGENDARY:**
```
Cost: 0 Energy (-1 cost, minimum 1, but could be 0 for legendary)
Type: DEFENSE
Block: 16 (+100%)
Effect: "When you take damage this turn, deal 6 damage to attacker. Gain 2 Strength. Gain 2 Block."
Flavor: "The ultimate call!"
```
*Strongest retaliation + strength gain + bonus block + best stats + cost reduction*

#### Omniknight - "Guardian Angel" (All Rarities)

**COMMON:**
```
Cost: 2 Energy
Type: DEFENSE
Block: 15
Effect: None
Flavor: "By the light!"
```
*Just block*

**UNCOMMON:**
```
Cost: 2 Energy
Type: DEFENSE
Block: 15
Effect: "Gain 1 Dexterity"
Flavor: "Protected by light!"
```
*Weak buff*

**RARE:**
```
Cost: 2 Energy
Type: DEFENSE
Block: 22 (+50%)
Effect: "Gain 2 Dexterity"
Flavor: "By the light!"
```
*Stronger buff + better block*

**LEGENDARY:**
```
Cost: 1 Energy (-1 cost)
Type: DEFENSE
Block: 30 (+100%)
Effect: "Gain 3 Dexterity. At start of next turn, gain 5 Block."
Flavor: "Divine protection!"
```
*Strongest buff + best block + bonus effect + cost reduction*

---

### SKILL Cards

#### Crystal Maiden - "Frostbite" (All Rarities)

**COMMON:**
```
Cost: 1 Energy
Type: SKILL
Effect: None (just utility, no damage/block)
Flavor: "The cold never bothered me anyway."
```
*Note: SKILL cards at COMMON might have minimal effect or just be placeholder*

**UNCOMMON:**
```
Cost: 1 Energy
Type: SKILL
Effect: "Apply 1 Weak to target enemy. Draw 1 card."
Flavor: "Feel the chill!"
```
*Weak debuff + card draw*

**RARE:**
```
Cost: 1 Energy
Type: SKILL
Effect: "Apply 2 Weak to target enemy. Draw 2 cards."
Flavor: "The cold never bothered me anyway."
```
*Stronger debuff + more card draw*

**LEGENDARY:**
```
Cost: 0 Energy (-1 cost)
Type: SKILL
Effect: "Apply 3 Weak to target enemy. Draw 3 cards. Gain 1 Focus."
Flavor: "The eternal winter!"
```
*Strongest debuff + most card draw + bonus effect + cost reduction*

#### Invoker - "Quas" (All Rarities)

**COMMON:**
```
Cost: 0 Energy
Type: SKILL
Effect: "Draw 1 card"
Flavor: "The elements..."
```
*Basic card draw*

**UNCOMMON:**
```
Cost: 0 Energy
Type: SKILL
Effect: "Draw 1 card. Gain 1 Focus (this combat only)."
Flavor: "The elements flow..."
```
*Card draw + weak energy generation*

**RARE:**
```
Cost: 0 Energy
Type: SKILL
Effect: "Draw 2 cards. Gain 1 Focus (this combat only)."
Flavor: "The elements..."
```
*More card draw + energy generation*

**LEGENDARY:**
```
Cost: 0 Energy
Type: SKILL
Effect: "Draw 3 cards. Gain 2 Focus (this combat only)."
Flavor: "Master of the elements!"
```
*Most card draw + stronger energy generation*

---

### POWER Cards

#### Drow Ranger - "Marksmanship" (RARE)
```
Cost: 2 Energy
Type: POWER
Effect: "At the start of each turn, gain +2 Attack"
Flavor: "Precision is key."
```
*Design Note: Scaling damage, snowball effect*

#### Zeus - "Thundergod's Wrath" (RARE)
```
Cost: 3 Energy
Type: POWER
Effect: "At the start of each turn, deal 5 damage to all enemies"
Flavor: "The heavens strike!"
```
*Design Note: Persistent AOE, strong but expensive*

#### Warlock - "Fatal Bonds" (UNCOMMON)
```
Cost: 2 Energy
Type: POWER
Effect: "When you deal damage, deal 25% of that damage to all other enemies"
Flavor: "We are bound by fate."
```
*Design Note: Damage amplification, scales with other cards*

#### Necrophos - "Heartstopper Aura" (RARE)
```
Cost: 2 Energy
Type: POWER
Effect: "At the end of each turn, all enemies lose 3 health"
Flavor: "Life fades..."
```
*Design Note: Passive damage, chip away*

---

## Card Synergies

### Strength Synergy
- **Axe** + **Centaur**: Both gain block, Centaur retaliates
- **Sven** + **Omniknight**: Sven stuns, Omniknight protects

### Combo Synergies
- **Pudge Hook** (pull enemy) + **Axe Berserker's Call** (retaliation damage)
- **Crystal Maiden Frostbite** (weak) + **Phantom Assassin** (crit damage amplified)

### Power Card Synergies
- **Drow Marksmanship** + **Zeus Thundergod's Wrath**: Scaling damage every turn
- **Warlock Fatal Bonds** + any attack card: Amplified damage

---

## Rarity Distribution Examples

### COMMON (60% of cards)
- Simple, reliable effects
- Examples: Sven Storm Hammer, Axe Berserker's Call, Crystal Maiden Frostbite

### UNCOMMON (25% of cards)
- Better stats or simple combos
- Examples: Omniknight Guardian Angel, Centaur Retaliate, Pudge Meat Hook

### RARE (12% of cards)
- Strong effects or unique mechanics
- Examples: Pudge The Butcher, Phantom Assassin Coup de Grace, Drow Marksmanship

### LEGENDARY (3% of cards)
- Game-changing effects
- Examples: Rubick Spell Steal, Invoker Quas Wex Exort (if implemented)

---

## Hero Role → Card Type Mapping

### Carry Heroes → ATTACK Cards
- Phantom Assassin, Juggernaut, Sven, Lina
- Focus on damage output

### Support Heroes → SKILL Cards
- Crystal Maiden, Rubick, Tinker
- Focus on utility and card advantage

### Tank Heroes → DEFENSE Cards
- Axe, Centaur, Omniknight, Tidehunter
- Focus on blocking and protection

### Utility Heroes → Mixed Types
- Invoker (SKILL/POWER)
- Pudge (ATTACK/SKILL)
- Warlock (POWER)

---

## Balancing Notes

### Energy Costs
- 0 cost: Very weak effects (Invoker Quas)
- 1 cost: Standard effects (most commons)
- 2 cost: Strong effects (most rares)
- 3 cost: Game-changing effects (legendaries, some rares)

### Attack Values
- 1 cost: 6-8 damage
- 2 cost: 10-12 damage
- 3 cost: 15+ damage

### Block Values
- 1 cost: 6-8 block
- 2 cost: 10-15 block
- 3 cost: 20+ block

### Effect Power
- Card draw: Very powerful (worth ~1 energy)
- Status effects: Weak/Vulnerable = ~1 energy value
- Scaling effects: Worth 2+ energy over time

---

## Future Card Ideas

### Status Effect Cards
- **Venomancer - "Poison Sting"**: Apply 3 Poison
- **Jakiro - "Dual Breath"**: Apply 2 Burn

### Combo Cards
- **Invoker - "Sun Strike"**: Deal damage equal to cards in hand
- **Tinker - "March of the Machines"**: Deal 1 damage per card played this turn

### Transformation Cards
- **Lycan - "Shapeshift"**: Transform into POWER card for rest of combat
- **Alchemist - "Chemical Rage"**: Gain energy but take damage each turn

---

## Card Generation Strategy

### Phase 1: Template-Based
Create card templates based on:
- Hero role (carry/support/tank)
- Primary attribute (str/agi/int)
- Signature ability

### Phase 2: Manual Tuning
Review and adjust:
- Energy costs
- Damage/block values
- Effect power levels

### Phase 3: Playtesting
Balance based on:
- Win rates
- Deck inclusion rates
- Player feedback

---

## Questions to Resolve

1. **Duplicate Cards**: Can users have multiple copies of same card in deck?
   - **Recommendation**: Yes, but limit to 2-3 copies max

2. **Card Upgrades**: Should winning with a hero multiple times upgrade the card?
   - **Recommendation**: Future feature - upgrade system

3. **Hero Variants**: Should heroes have multiple card variants?
   - **Recommendation**: Start with one per hero, add variants later

4. **Neutral Cards**: Should there be non-hero cards?
   - **Recommendation**: Future feature - items as cards
