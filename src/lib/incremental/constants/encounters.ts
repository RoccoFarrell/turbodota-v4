import type { EncounterDef, EnemyDef } from '../types';

/** Scaled so ~30s of auto-attacks from 3 heroes clears the pack without killing the roster (enemies focus Front Liner). */
const enemies: EnemyDef[] = [
	{
		id: 'large_wolf',
		name: 'Large Wolf',
		hp: 700,
		attackInterval: 3,
		damage: 4,
		baseArmor: 15,
		baseMagicResist: 0.25
	},
	{
		id: 'small_wolf',
		name: 'Small Wolf',
		hp: 250,
		attackInterval: 2.5,
		damage: 2,
		baseArmor: 8,
		baseMagicResist: 0.15
	},
	{
		id: 'armored_brute',
		name: 'Armored Brute',
		hp: 600,
		attackInterval: 3.5,
		damage: 3,
		baseArmor: 35,
		baseMagicResist: 0.05
	},
	{
		id: 'arcane_wisp',
		name: 'Arcane Wisp',
		hp: 400,
		attackInterval: 2.2,
		damage: 2,
		baseArmor: 5,
		baseMagicResist: 0.4
	},
	{
		id: 'frenzy_rat',
		name: 'Frenzy Rat',
		hp: 200,
		attackInterval: 1.2,
		damage: 8,
		baseArmor: 5,
		baseMagicResist: 0.1
	},
	{
		id: 'lesser_skull',
		name: 'Lesser Skull',
		hp: 150,
		attackInterval: 1,
		damage: 10,
		baseArmor: 0,
		baseMagicResist: 0.2
	},
	{
		id: 'skull_lord',
		name: 'Skull Lord',
		hp: 2500,
		attackInterval: 4,
		damage: 5,
		baseArmor: 20,
		baseMagicResist: 0.3,
		summonAbility: { enemyDefId: 'lesser_skull', interval: 12 }
	}
];

const encounters: EncounterDef[] = [
	{
		id: 'wolf_pack',
		enemies: [
			{ enemyDefId: 'large_wolf', count: 1 },
			{ enemyDefId: 'small_wolf', count: 2 }
		]
	},
	{
		id: 'armor_camp',
		enemies: [
			{ enemyDefId: 'armored_brute', count: 2 },
			{ enemyDefId: 'arcane_wisp', count: 1 }
		]
	},
	{
		id: 'dps_camp',
		enemies: [{ enemyDefId: 'frenzy_rat', count: 3 }]
	},
	{
		id: 'mixed_camp',
		enemies: [
			{ enemyDefId: 'armored_brute', count: 1 },
			{ enemyDefId: 'frenzy_rat', count: 2 }
		]
	},
	{
		id: 'elite_camp',
		enemies: [
			{ enemyDefId: 'armored_brute', count: 2 },
			{ enemyDefId: 'arcane_wisp', count: 2 }
		]
	},
	{
		id: 'skull_lord_boss',
		enemies: [{ enemyDefId: 'skull_lord', count: 1 }]
	}
];

const enemyById = new Map(enemies.map((e) => [e.id, e]));
const encounterById = new Map(encounters.map((e) => [e.id, e]));

export function getEnemyDef(id: string): EnemyDef | undefined {
	return enemyById.get(id);
}

export function getEncounterDef(id: string): EncounterDef | undefined {
	return encounterById.get(id);
}

export { enemies, encounters };
