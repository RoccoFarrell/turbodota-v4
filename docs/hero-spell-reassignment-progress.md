# Hero Spell Reassignment Progress

Status: COMPLETE (all 128 heroes reviewed)

## Legend
- `(keep)` = no change from current CSV
- `(as-is)` = entire hero unchanged
- `(multi)` = spell has multiple effects (needs multi-effect engine support)

## Final Distribution (256 spells across 128 heroes)
| Effect | Count |
|---|---|
| stun | 61 (incl. 6 all_enemies) |
| magic_damage | 58 (incl. 5 all_enemies) |
| bonus_damage | 26 |
| shield/damage_block | 19 |
| magic_dot | 16 |
| heal_ally | 16 |
| physical_damage | 14 (incl. 3 all_enemies) |
| evasion | 10 |
| armor_reduce | 10 |
| attack_speed_slow | 10 |
| attack_damage_reduce | 8 |
| lifesteal | 8 |
| magic_resist_reduce | 7 (incl. 1 all_enemies) |
| physical_dot | 5 |
| attack_speed_bonus | 4 |
| return_damage | 4 |

## Completed Heroes

### Hero 1: Anti-Mage (AGI)
- Spell 1: **Mana Break** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`
- Spell 2: **Blink** → `active, timer, evasion, self`

### Hero 2: Axe (STR)
- Spell 1: **Berserker's Call** — stun (keep)
- Spell 2: **Counter Helix** → `passive, on_damage_taken, return_damage, attacker, physical, , 0.18`

### Hero 3: Bane (UNIVERSAL)
- Spell 1: **Brain Sap** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Fiend's Grip** → `active, timer, stun, single_enemy` (long stun, slow cast)

### Hero 4: Bloodseeker (AGI)
- Spell 1: **Blood Rite** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Rupture** → `active, timer, magic_dot, single_enemy, magical, 25` (large DOT, slow cast)

### Hero 5: Crystal Maiden (INT)
- Spell 1: **Crystal Nova** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Frostbite** → `active, timer, stun, single_enemy`

### Hero 6: Drow Ranger (AGI)
- Spell 1: **Frost Arrows** → `active, timer, attack_speed_slow, single_enemy` (high value, slow cast)
- Spell 2: **Marksmanship** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`

### Hero 7: Earthshaker (STR)
- Spell 1: **Fissure** — stun (keep)
- Spell 2: **Enchant Totem** → `active, timer, physical_damage, single_enemy, physical, 70`

### Hero 8: Juggernaut (AGI)
- Spell 1: **Blade Fury** → `active, timer, magic_dot, single_enemy, magical, 15`
- Spell 2: **Omnislash** → `active, timer, physical_damage, single_enemy, physical, 100` (slow cast)

### Hero 9: Mirana (AGI)
- Spell 1: **Starstorm** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Sacred Arrow** → `active, timer, stun, single_enemy`

### Hero 10: Morphling (AGI)
- Spell 1: **Adaptive Strike** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Morph Agility** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`

### Hero 11: Shadow Fiend (AGI)
- Spell 1: **Shadowraze** — magic_damage 85 (keep)
- Spell 2: **Requiem of Souls** → `active, timer, physical_damage, all_enemies, physical, 100` (very long cast)

### Hero 12: Phantom Lancer (AGI)
- Spell 1: **Spirit Lance** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Doppelganger** → `active, timer, evasion, self`

### Hero 13: Puck (INT)
- Spell 1: **Illusory Orb** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Phase Shift** → `active, timer, shield, self`

### Hero 14: Pudge (STR)
- (as-is) Spell 1: Meat Hook — stun | Spell 2: Rot — magic_damage 85

### Hero 15: Razor (AGI)
- Spell 1: **Plasma Field** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Static Link** → `active, timer, attack_damage_reduce, single_enemy`

### Hero 16: Sand King (UNIVERSAL)
- Spell 1: **Burrowstrike** — stun (keep)
- Spell 2: **Sand Storm** → `active, timer, magic_dot, single_enemy, magical, 15`

### Hero 17: Storm Spirit (INT)
- Spell 1: **Static Remnant** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Electric Vortex** — stun (keep)

### Hero 18: Sven (STR)
- Spell 1: **Storm Hammer** — stun (keep)
- Spell 2: **God's Strength** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`

### Hero 19: Tiny (STR)
- (as-is) Spell 1: Avalanche — stun | Spell 2: Toss — physical_damage 70

### Hero 20: Vengeful Spirit (AGI)
- Spell 1: **Magic Missile** — stun (keep)
- Spell 2: **Wave of Terror** → `active, timer, armor_reduce, single_enemy`

### Hero 21: Windranger (UNIVERSAL)
- (as-is) Spell 1: Shackleshot — stun | Spell 2: Powershot — magic_damage 85

### Hero 22: Zeus (INT)
- (as-is) Spell 1: Arc Lightning — magic_damage 85 | Spell 2: Lightning Bolt — stun

### Hero 23: Kunkka (STR)
- Spell 1: **Torrent** — stun (keep)
- Spell 2: **Tidebringer** → `active, timer, physical_damage, all_enemies, physical, 70`

### Hero 25: Lina (INT)
- Spell 1: **Light Strike Array** → `active, timer, stun, single_enemy`
- Spell 2: **Laguna Blade** → `active, timer, magic_damage, single_enemy, magical, 120` (slow cast)

### Hero 26: Lion (INT)
- Spell 1: **Earth Spike** — stun (keep)
- Spell 2: **Finger of Death** → `active, timer, magic_damage, single_enemy, magical, 120` (slow cast)

### Hero 27: Shadow Shaman (INT)
- Spell 1: **Ether Shock** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Hex** → `active, timer, stun, single_enemy`

### Hero 28: Slardar (STR)
- Spell 1: **Slithereen Crush** → `active, timer, stun, single_enemy`
- Spell 2: **Amplify Damage** → `active, timer, armor_reduce, single_enemy`

### Hero 29: Tidehunter (STR)
- Spell 1: **Gush** → `active, timer, armor_reduce, single_enemy`
- Spell 2: **Ravage** → `active, timer, stun, single_enemy` (long stun, slow cast)

### Hero 30: Witch Doctor (INT)
- (as-is) Spell 1: Paralyzing Cask — stun | Spell 2: Voodoo Restoration — heal_ally

### Hero 31: Lich (INT)
- Spell 1: **Frost Shield** → `active, timer, damage_block, self`
- Spell 2: **Chain Frost** → `active, timer, magic_damage, all_enemies, magical, 85` (slow cast)

### Hero 32: Riki (AGI)
- Spell 1: **Smoke Screen** → `active, timer, evasion, self`
- Spell 2: **Backstab** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`

### Hero 33: Enigma (UNIVERSAL)
- Spell 1: **Malefice** — stun (keep)
- Spell 2: **Black Hole** → `active, timer, stun, all_enemies` (very long cast)

### Hero 34: Tinker (INT)
- Spell 1: **Laser** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Defensive Matrix** → `active, timer, shield, self`

### Hero 35: Sniper (AGI)
- Spell 1: **Headshot** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`
- Spell 2: **Assassinate** → `active, timer, magic_damage, single_enemy, magical, 100` (slow cast)

### Hero 36: Necrophos (INT)
- Spell 1: **Death Pulse** — heal_ally (keep)
- Spell 2: **Reaper's Scythe** → `active, timer, magic_damage, single_enemy, magical, 120` (slow cast)

### Hero 37: Warlock (INT)
- Spell 1: **Shadow Word** → `active, timer, heal_lowest_ally_damage_nearby, lowest_hp_ally`
- Spell 2: **Chaotic Offering** → `active, timer, stun, all_enemies` (long cast)

### Hero 38: Beastmaster (UNIVERSAL)
- Spell 1: **Call of the Wild** → `active, timer, attack_speed_slow, single_enemy`
- Spell 2: **Primal Roar** → `active, timer, stun, single_enemy` (long stun, slow cast)

### Hero 39: Queen of Pain (INT)
- Spell 1: **Shadow Strike** → `active, timer, magic_dot, single_enemy, magical, 15`
- Spell 2: **Sonic Wave** → `active, timer, magic_damage, all_enemies, magical, 85` (slow cast)

### Hero 40: Venomancer (UNIVERSAL)
- Spell 1: **Venomous Gale** → `active, timer, magic_dot, single_enemy, magical, 15`
- Spell 2: **Poison Sting** → `active, timer, physical_dot, single_enemy, physical, 15`

### Hero 41: Faceless Void (AGI)
- Spell 1: **Time Walk** → `active, timer, shield, self`
- Spell 2: **Chronosphere** → `active, timer, stun, all_enemies` (slow cast)

### Hero 42: Wraith King (STR)
- Spell 1: **Wraithfire Blast** — stun (keep)
- Spell 2: **Vampiric Spirit** → `passive, on_attack, lifesteal` (new mechanic)

### Hero 43: Death Prophet (UNIVERSAL)
- Spell 1: **Crypt Swarm** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Silence** → `active, timer, magic_resist_reduce, single_enemy`

### Hero 44: Phantom Assassin (AGI)
- Spell 1: **Stifling Dagger** → `active, timer, physical_damage, single_enemy, physical, 70`
- Spell 2: **Coup de Grace** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`

### Hero 45: Pugna (INT)
- Spell 1: **Nether Blast** — magic_damage 85 (keep)
- Spell 2: **Life Drain** → `active, timer, heal_lowest_ally_damage_nearby, lowest_hp_ally`

### Hero 46: Templar Assassin (AGI)
- Spell 1: **Refraction** → `active, timer, shield, self`
- Spell 2: **Psi Blades** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`

### Hero 47: Viper (AGI)
- Spell 1: **Poison Attack** → `active, timer, physical_dot, single_enemy, physical, 15`
- Spell 2: **Nethertoxin** → `active, timer, attack_speed_slow, single_enemy`

### Hero 48: Luna (AGI)
- Spell 1: **Lucent Beam** — magic_damage 85 (keep)
- Spell 2: **Moon Glaives** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`

### Hero 49: Dragon Knight (STR)
- Spell 1: **Breathe Fire** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Dragon Tail** → `active, timer, stun, single_enemy`

### Hero 50: Dazzle (UNIVERSAL)
- Spell 1: **Poison Touch** → `active, timer, physical_dot, single_enemy, physical, 15`
- Spell 2: **Shadow Weave** → `active, timer, heal_lowest_ally_damage_nearby, lowest_hp_ally`

### Hero 51: Clockwerk (STR)
- Spell 1: **Battery Assault** — stun (keep)
- Spell 2: **Power Cogs** → `active, timer, attack_damage_reduce, single_enemy`

### Hero 52: Leshrac (INT)
- Spell 1: **Split Earth** — stun (keep)
- Spell 2: **Pulse Nova** → `active, timer, magic_damage, all_enemies, magical, 55` (quick cast)

### Hero 53: Nature's Prophet (UNIVERSAL)
- Spell 1: **Sprout** — stun (keep)
- Spell 2: **Teleportation** → (multi) `shield, self` + `bonus_damage`

### Hero 54: Lifestealer (STR)
- Spell 1: **Rage** → `active, timer, shield, self`
- Spell 2: **Feast** → `passive, on_attack, lifesteal`

### Hero 55: Dark Seer (INT)
- (as-is) Spell 1: Vacuum — stun | Spell 2: Ion Shell — magic_damage 85

### Hero 56: Clinkz (AGI)
- Spell 1: **Strafe** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`
- Spell 2: **Tar Bomb** → `active, timer, physical_damage, single_enemy, physical, 70`

### Hero 57: Omniknight (STR)
- (as-is) Spell 1: Purification — heal_ally | Spell 2: Heavenly Grace — damage_block self

### Hero 58: Enchantress (INT)
- Spell 1: **Impetus** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`
- Spell 2: **Nature's Attendants** → `active, timer, heal_lowest_ally_damage_nearby, lowest_hp_ally`

### Hero 59: Huskar (STR)
- Spell 1: **Inner Fire** → `active, timer, attack_damage_reduce, single_enemy`
- Spell 2: **Burning Spear** → `active, timer, physical_dot, single_enemy, physical, 15`

### Hero 60: Night Stalker (STR)
- Spell 1: **Void** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Crippling Fear** → `active, timer, magic_resist_reduce, single_enemy`

### Hero 61: Broodmother (AGI)
- Spell 1: **Insatiable Hunger** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`
- Spell 2: **Spin Web** → `active, timer, evasion, self`

### Hero 62: Bounty Hunter (AGI)
- Spell 1: **Shuriken Toss** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Jinada** → `active, timer, armor_reduce, single_enemy`

### Hero 63: Weaver (AGI)
- Spell 1: **The Swarm** → `active, timer, armor_reduce, single_enemy`
- Spell 2: **Shukuchi** → `active, timer, evasion, self`

### Hero 64: Jakiro (INT)
- Spell 1: **Dual Breath** → `active, timer, attack_speed_slow, single_enemy`
- Spell 2: **Ice Path** → `active, timer, stun, single_enemy`

### Hero 65: Batrider (UNIVERSAL)
- Spell 1: **Sticky Napalm** → `active, timer, attack_speed_slow, single_enemy`
- Spell 2: **Flamebreak** → `active, timer, magic_damage, single_enemy, magical, 85`

### Hero 66: Chen (INT)
- Spell 1: **Penitence** → `active, timer, armor_reduce, single_enemy`
- Spell 2: **Hand of God** → `active, timer, heal_lowest_ally_damage_nearby, lowest_hp_ally` (small heal, quick cast)

### Hero 67: Spectre (AGI)
- Spell 1: **Spectral Dagger** → `active, timer, physical_damage, single_enemy, physical, 70`
- Spell 2: **Desolate** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`

### Hero 68: Ancient Apparition (INT)
- Spell 1: **Cold Feet** — stun (keep)
- Spell 2: **Ice Blast** → `active, timer, magic_damage, all_enemies, magical, 85`

### Hero 69: Doom (STR)
- Spell 1: **Scorched Earth** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Doom** → (multi) `magic_dot` + `attack_speed_slow` + `magic_resist_reduce` + `attack_damage_reduce` (very long cast)

### Hero 70: Ursa (AGI)
- Spell 1: **Overpower** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`
- Spell 2: **Enrage** → `active, timer, damage_block, self`

### Hero 71: Spirit Breaker (STR)
- Spell 1: **Charge of Darkness** — stun (keep)
- Spell 2: **Nether Strike** → `active, timer, stun, single_enemy` (longer stun, slower cast)

### Hero 72: Gyrocopter (AGI)
- Spell 1: **Rocket Barrage** → `active, timer, magic_dot, single_enemy, magical, 15`
- Spell 2: **Flak Cannon** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`

### Hero 73: Alchemist (STR)
- Spell 1: **Acid Spray** → `active, timer, magic_dot, single_enemy, magical, 15`
- Spell 2: **Chemical Rage** → `active, timer, attack_speed_bonus, self` (new mechanic)

### Hero 74: Invoker (INT)
- Spell 1: **Chaos Meteor** → `active, timer, magic_damage, single_enemy, magical, 120` (slow cast)
- Spell 2: **Cataclysm** → `active, timer, magic_damage, all_enemies, magical, 85`

### Hero 75: Silencer (INT)
- Spell 1: **Arcane Curse** → `active, timer, magic_dot, single_enemy, magical, 15`
- Spell 2: **Global Silence** → `active, timer, magic_resist_reduce, all_enemies`

### Hero 76: Outworld Destroyer (INT)
- Spell 1: **Arcane Orb** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`
- Spell 2: **Astral Imprisonment** → `active, timer, stun, single_enemy`

### Hero 77: Lycan (STR)
- Spell 1: **Howl** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`
- Spell 2: **Shapeshift** → (multi) `attack_speed_bonus, self` + `lifesteal`

### Hero 78: Brewmaster (UNIVERSAL)
- Spell 1: **Thunder Clap** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Drunken Brawler** → `active, timer, evasion, self`

### Hero 79: Shadow Demon (INT)
- Spell 1: **Disruption** → `active, timer, stun, single_enemy`
- Spell 2: **Demonic Purge** → (multi) `attack_speed_slow` + `attack_damage_reduce` on single enemy

### Hero 80: Lone Druid (AGI)
- Spell 1: **Summon Spirit Bear** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`
- Spell 2: **Spirit Link** → `passive, on_attack, lifesteal`

### Hero 81: Chaos Knight (STR)
- Spell 1: **Chaos Bolt** — stun (keep)
- Spell 2: **Reality Rift** → `active, timer, armor_reduce, single_enemy`

### Hero 82: Meepo (AGI)
- Spell 1: **Earthbind** — stun (keep)
- Spell 2: **Divided We Stand** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`

### Hero 83: Treant Protector (STR)
- Spell 1: **Leech Seed** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Living Armor** → `active, timer, heal_lowest_ally_damage_nearby, lowest_hp_ally`

### Hero 84: Ogre Magi (STR)
- Spell 1: **Fireblast** — stun (keep)
- Spell 2: **Ignite** → `active, timer, magic_dot, single_enemy, magical, 15`

### Hero 85: Undying (STR)
- Spell 1: **Decay** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Soul Rip** → `active, timer, heal_lowest_ally_damage_nearby, lowest_hp_ally`

### Hero 86: Rubick (INT)
- Spell 1: **Telekinesis** → `active, timer, stun, single_enemy`
- Spell 2: **Fade Bolt** → `active, timer, attack_damage_reduce, single_enemy`

### Hero 87: Disruptor (INT)
- Spell 1: **Thunder Strike** → `active, timer, magic_dot, single_enemy, magical, 15`
- Spell 2: **Static Storm** → (multi) `magic_damage` + `magic_dot` + `magic_resist_reduce` on single enemy

### Hero 88: Nyx Assassin (UNIVERSAL)
- Spell 1: **Impale** — stun (keep)
- Spell 2: **Spiked Carapace** → `passive, on_damage_taken, return_damage, attacker, physical, , 0.18`

### Hero 89: Naga Siren (AGI)
- Spell 1: **Mirror Image** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`
- Spell 2: **Ensnare** → `active, timer, stun, single_enemy`

### Hero 90: Keeper of the Light (INT)
- Spell 1: **Illuminate** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Blinding Light** → `active, timer, attack_damage_reduce, single_enemy`

### Hero 91: Io (UNIVERSAL)
- Spell 1: **Tether** → `active, timer, heal_lowest_ally_damage_nearby, lowest_hp_ally`
- Spell 2: **Relocate** → `active, timer, shield, self`

### Hero 92: Visage (UNIVERSAL)
- Spell 1: **Grave Chill** → `active, timer, attack_speed_slow, single_enemy`
- Spell 2: **Soul Assumption** — magic_damage 85 (keep)

### Hero 93: Slark (AGI)
- Spell 1: **Dark Pact** → `active, timer, evasion, self`
- Spell 2: **Essence Shift** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`

### Hero 94: Medusa (AGI)
- Spell 1: **Split Shot** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`
- Spell 2: **Mystic Snake** — magic_damage 85 (keep)

### Hero 95: Troll Warlord (AGI)
- Spell 1: **Whirling Axes** → `active, timer, attack_speed_slow, single_enemy`
- Spell 2: **Fervor** → (multi) `attack_speed_bonus, self` + `lifesteal`

### Hero 96: Centaur Warrunner (STR)
- Spell 1: **Hoof Stomp** — stun (keep)
- Spell 2: **Retaliate** → `passive, on_damage_taken, return_damage, attacker, physical, , 0.18`

### Hero 97: Magnus (UNIVERSAL)
- Spell 1: **Shockwave** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Reverse Polarity** → `active, timer, stun, all_enemies`

### Hero 98: Timbersaw (STR)
- Spell 1: **Whirling Death** → (multi) `magic_damage` + `armor_reduce` on single enemy
- Spell 2: **Timber Chain** → (multi) `magic_damage` + `evasion` (self)

### Hero 99: Bristleback (STR)
- Spell 1: **Viscous Nasal Goo** → `active, timer, armor_reduce, single_enemy`
- Spell 2: **Bristleback** → `passive, on_damage_taken, return_damage, attacker, physical, , 0.18`

### Hero 100: Tusk (STR)
- Spell 1: **Snowball** → `active, timer, shield, self`
- Spell 2: **Walrus Punch** → (multi) `physical_damage` + `stun` on single enemy

### Hero 101: Skywrath Mage (INT)
- Spell 1: **Arcane Bolt** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Mystic Flare** → `active, timer, magic_damage, single_enemy, magical, 120` (slow cast)

### Hero 102: Abaddon (UNIVERSAL)
- (as-is) Spell 1: Mist Coil — heal_ally | Spell 2: Aphotic Shield — damage_block self

### Hero 103: Elder Titan (STR)
- (as-is) Spell 1: Echo Stomp — stun | Spell 2: Astral Spirit — magic_damage 85

### Hero 104: Legion Commander (STR)
- Spell 1: **Overwhelming Odds** → `active, timer, physical_damage, single_enemy, physical, 70`
- Spell 2: **Press the Attack** → `active, timer, shield, self`

### Hero 105: Techies (UNIVERSAL)
- Spell 1: **Sticky Bomb** — stun (keep)
- Spell 2: **Remote Mines** → (multi) `magic_damage` + `magic_resist_reduce` on single enemy

### Hero 106: Ember Spirit (AGI)
- Spell 1: **Searing Chains** → `active, timer, stun, single_enemy`
- Spell 2: **Sleight of Fist** → `active, timer, physical_damage, all_enemies, physical, 70`

### Hero 107: Earth Spirit (STR)
- Spell 1: **Boulder Smash** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Rolling Boulder** → `active, timer, stun, single_enemy`

### Hero 108: Underlord (STR)
- Spell 1: **Firestorm** → `active, timer, magic_dot, single_enemy, magical, 15`
- Spell 2: **Pit of Malice** → `active, timer, stun, single_enemy`

### Hero 109: Terrorblade (AGI)
- Spell 1: **Conjure Image** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`
- Spell 2: **Sunder** → (multi) `shield, self` + `lifesteal`

### Hero 110: Phoenix (STR)
- Spell 1: **Fire Spirits** → `active, timer, magic_dot, single_enemy, magical, 15`
- Spell 2: **Supernova** → `active, timer, stun, all_enemies`

### Hero 111: Oracle (INT)
- Spell 1: **Fate's Edict** → `active, timer, magic_resist_reduce, single_enemy`
- Spell 2: **False Promise** → (multi) `heal_lowest_ally_damage_nearby` + `shield`

### Hero 112: Winter Wyvern (INT)
- Spell 1: **Arctic Burn** → `active, timer, magic_dot, single_enemy, magical, 15`
- Spell 2: **Cold Embrace** → `active, timer, heal_lowest_ally_damage_nearby, lowest_hp_ally`

### Hero 113: Arc Warden (UNIVERSAL)
- Spell 1: **Flux** → `active, timer, magic_dot, single_enemy, magical, 15`
- Spell 2: **Magnetic Field** → (multi) `evasion, self` + `attack_speed_bonus`

### Hero 114: Monkey King (AGI)
- Spell 1: **Boundless Strike** — stun (keep)
- Spell 2: **Jingu Mastery** → (multi) `passive, on_attack, bonus_damage` + `lifesteal`

### Hero 119: Dark Willow (INT)
- (as-is) Spell 1: Bramble Maze — stun | Spell 2: Shadow Realm — magic_damage 85

### Hero 120: Pangolier (UNIVERSAL)
- Spell 1: **Swashbuckle** → `active, timer, physical_damage, single_enemy, physical, 70`
- Spell 2: **Shield Crash** → (multi) `magic_damage` + `shield` (self)

### Hero 121: Grimstroke (INT)
- Spell 1: **Stroke of Fate** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Phantom's Embrace** → (multi) `attack_speed_slow` + `attack_damage_reduce` on single enemy

### Hero 123: Hoodwink (AGI)
- Spell 1: **Acorn Shot** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Bushwhack** → `active, timer, stun, single_enemy`

### Hero 126: Void Spirit (UNIVERSAL)
- Spell 1: **Aether Remnant** → `active, timer, stun, single_enemy`
- Spell 2: **Resonant Pulse** → (multi) `magic_damage` + `shield` (self)

### Hero 128: Snapfire (UNIVERSAL)
- Spell 1: **Scatterblast** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Firesnap Cookie** → `active, timer, stun, single_enemy`

### Hero 129: Mars (STR)
- Spell 1: **Spear of Mars** — stun (keep)
- Spell 2: **God's Rebuke** → (multi) `physical_damage` + `armor_reduce` on single enemy

### Hero 131: Ringmaster (INT)
- Spell 1: **Tame the Beasts** → `active, timer, stun, single_enemy`
- Spell 2: **Escape Act** → (multi) `shield` (self) + `heal_lowest_ally_damage_nearby`

### Hero 135: Dawnbreaker (STR)
- Spell 1: **Starbreaker** → `active, timer, stun, single_enemy`
- Spell 2: **Celestial Hammer** → `active, timer, physical_dot, single_enemy, physical, 15`

### Hero 136: Marci (UNIVERSAL)
- (as-is) Spell 1: Dispose — stun | Spell 2: Rebound — magic_damage 85

### Hero 137: Primal Beast (STR)
- (as-is) Spell 1: Onslaught — stun | Spell 2: Trample — magic_damage 85

### Hero 138: Muerta (INT)
- Spell 1: **Dead Shot** → `active, timer, magic_damage, single_enemy, magical, 85`
- Spell 2: **Gunslinger** → `passive, on_attack, bonus_damage, attacked_enemy, physical, 20`

### Hero 145: Kez (AGI)
- Spell 1: **Echo Slash** → (multi) `physical_damage` + `lifesteal` on single enemy
- Spell 2: **Raptor Dance** → (multi) `magic_damage` + `evasion` (self)

### Hero 155: Largo (STR)
- Spell 1: **Catchy Lick** → (multi) `shield` (self) + `heal_lowest_ally_damage_nearby`
- Spell 2: **Frogstomp** → `active, timer, magic_damage, single_enemy, magical, 85`

## Follow-up Tasks
- [ ] Implement `all_enemies` targeting in resolveSpell engine
- [ ] Implement `bonus_damage` effect mechanically
- [ ] Implement `lifesteal` effect mechanically
- [ ] Implement `attack_speed_bonus` effect mechanically
- [ ] Implement multi-effect spells (spells with 2+ effects)
- [ ] Write all changes to hero_abilities.csv
- [ ] Re-seed database after CSV update
- [ ] StatusEffectBadge UI support for new effects

## Multi-Effect Spells (need engine support)
- Nature's Prophet spell 2: shield + bonus_damage
- Doom spell 2: magic_dot + attack_speed_slow + magic_resist_reduce + attack_damage_reduce
- Lycan spell 2: attack_speed_bonus + lifesteal
- Shadow Demon spell 2: attack_speed_slow + attack_damage_reduce
- Troll Warlord spell 2: attack_speed_bonus + lifesteal
- Timbersaw spell 1: magic_damage + armor_reduce
- Timbersaw spell 2: magic_damage + evasion
- Tusk spell 2: physical_damage + stun
- Techies spell 2: magic_damage + magic_resist_reduce
- Disruptor spell 2: magic_damage + magic_dot + magic_resist_reduce
- Terrorblade spell 2: shield + lifesteal
- Oracle spell 2: heal_ally + shield
- Arc Warden spell 2: evasion + attack_speed_bonus
- Monkey King spell 2: bonus_damage + lifesteal
- Pangolier spell 2: magic_damage + shield
- Grimstroke spell 2: attack_speed_slow + attack_damage_reduce
- Void Spirit spell 2: magic_damage + shield
- Mars spell 2: physical_damage + armor_reduce
- Ringmaster spell 2: shield + heal_ally
- Kez spell 1: physical_damage + lifesteal
- Kez spell 2: magic_damage + evasion
- Largo spell 1: shield + heal_ally
