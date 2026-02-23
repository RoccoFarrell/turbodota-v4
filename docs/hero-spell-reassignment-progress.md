# Hero Spell Reassignment Progress

Status: In Progress (paused at Hero 27: Shadow Shaman)

## Legend
- `(keep)` = no change from current CSV
- `(as-is)` = entire hero unchanged

## Completed Heroes

### Hero 1: Anti-Mage (AGI)
- Spell 1: **Mana Break** → rename to bonus_damage passive
  - `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`
- Spell 2: **Blink** → rename/change to evasion
  - `active, timer, evasion, self`

### Hero 2: Axe (STR)
- Spell 1: **Berserker's Call** — stun (keep)
- Spell 2: **Battle Hunger** → rename to **Counter Helix**, return_damage passive
  - `passive, on_damage_taken, return_damage, attacker, physical, , 0.18`

### Hero 3: Bane (UNIVERSAL)
- Spell 1: **Enfeeble** → rename to **Brain Sap**, magic_damage
  - `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Brain Sap** → rename to **Fiend's Grip**, stun (long stun, slow cast)
  - `active, timer, stun, single_enemy`

### Hero 4: Bloodseeker (AGI)
- Spell 1: **Bloodrage** → rename to **Blood Rite**, magic_damage
  - `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Blood Rite** → rename to **Rupture**, magic_dot (large, slow cast)
  - `active, timer, magic_dot, single_enemy, magical, 25`

### Hero 5: Crystal Maiden (INT)
- Spell 1: **Crystal Nova** — magic_damage
  - `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Frostbite** — stun
  - `active, timer, stun, single_enemy`

### Hero 6: Drow Ranger (AGI)
- Spell 1: **Frost Arrows** — attack_speed_slow (high value, slow cast)
  - `active, timer, attack_speed_slow, single_enemy`
- Spell 2: **Marksmanship** — passive bonus_damage
  - `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`

### Hero 7: Earthshaker (STR)
- Spell 1: **Fissure** — stun (keep)
- Spell 2: **Enchant Totem** — physical_damage burst
  - `active, timer, physical_damage, single_enemy, physical, 70`

### Hero 8: Juggernaut (AGI)
- Spell 1: **Blade Fury** — magic_dot, average cast/damage
  - `active, timer, magic_dot, single_enemy, magical, 15`
- Spell 2: **Omnislash** — physical_damage, high damage slow cast
  - `active, timer, physical_damage, single_enemy, physical, 100`

### Hero 9: Mirana (AGI)
- Spell 1: **Starstorm** — magic_damage (swapped from spell 2's effect)
  - `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Sacred Arrow** — stun (swapped from spell 1's effect)
  - `active, timer, stun, single_enemy`

### Hero 10: Morphling (AGI)
- Spell 1: **Adaptive Strike** — magic_damage
  - `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Morph Agility** — passive bonus_damage
  - `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`

### Hero 11: Shadow Fiend (AGI)
- Spell 1: **Shadowraze** — magic_damage (keep)
- Spell 2: **Requiem of Souls** — physical_damage, all_enemies, very long cast
  - `active, timer, physical_damage, all_enemies, physical, 100`

### Hero 12: Phantom Lancer (AGI)
- Spell 1: **Spirit Lance** — magic_damage
  - `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Doppelganger** — evasion self-buff
  - `active, timer, evasion, self`

### Hero 13: Puck (INT)
- Spell 1: **Illusory Orb** — magic_damage
  - `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Phase Shift** — shield self-buff
  - `active, timer, shield, self`

### Hero 14: Pudge (STR)
- (as-is) Spell 1: Meat Hook — stun | Spell 2: Rot — magic_damage 85

### Hero 15: Razor (AGI)
- Spell 1: **Plasma Field** — magic_damage
  - `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Static Link** — attack_damage_reduce
  - `active, timer, attack_damage_reduce, single_enemy`

### Hero 16: Sand King (UNIVERSAL)
- Spell 1: **Burrowstrike** — stun (keep)
- Spell 2: **Sand Storm** — magic_dot
  - `active, timer, magic_dot, single_enemy, magical, 15`

### Hero 17: Storm Spirit (INT)
- Spell 1: **Static Remnant** — magic_damage
  - `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Electric Vortex** — stun (keep)

### Hero 18: Sven (STR)
- Spell 1: **Storm Hammer** — stun (keep)
- Spell 2: **God's Strength** — passive bonus_damage
  - `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`

### Hero 19: Tiny (STR)
- (as-is) Spell 1: Avalanche — stun | Spell 2: Toss — physical_damage 70

### Hero 20: Vengeful Spirit (AGI)
- Spell 1: **Magic Missile** — stun (keep)
- Spell 2: **Wave of Terror** — armor_reduce
  - `active, timer, armor_reduce, single_enemy`

### Hero 21: Windranger (UNIVERSAL)
- (as-is) Spell 1: Shackleshot — stun | Spell 2: Powershot — magic_damage 85

### Hero 22: Zeus (INT)
- (as-is) Spell 1: Arc Lightning — magic_damage 85 | Spell 2: Lightning Bolt — stun

### Hero 23: Kunkka (STR)
- Spell 1: **Torrent** — stun (keep)
- Spell 2: **Tidebringer** — physical_damage, **all_enemies**
  - `active, timer, physical_damage, all_enemies, physical, 70`

### Hero 25: Lina (INT)
- Spell 1: **Light Strike Array** — stun
  - `active, timer, stun, single_enemy`
- Spell 2: **Laguna Blade** — massive magic_damage, slow cast
  - `active, timer, magic_damage, single_enemy, magical, 120`

### Hero 26: Lion (INT)
- Spell 1: **Earth Spike** — stun (keep)
- Spell 2: **Finger of Death** — massive magic_damage, slow cast
  - `active, timer, magic_damage, single_enemy, magical, 120`

## Not Yet Reviewed
Heroes 27+ (Shadow Shaman onwards)

## Follow-up Tasks
- [ ] Implement `all_enemies` targeting in resolveSpell engine
- [ ] Implement `bonus_damage` effect mechanically
- [ ] Write all changes to hero_abilities.csv
- [ ] Re-seed database after CSV update
- [ ] StatusEffectBadge UI support for new effects
