import type { EncounterDef, EnemyDef } from '../types';

const enemies: EnemyDef[] = [
	{
		id: 'large_wolf',
		name: 'Large Wolf',
		hp: 80,
		attackInterval: 2,
		damage: 12,
		baseArmor: 2,
		baseMagicResist: 0
	},
	{
		id: 'small_wolf',
		name: 'Small Wolf',
		hp: 30,
		attackInterval: 1.5,
		damage: 5,
		baseArmor: 0,
		baseMagicResist: 0
	}
];

const encounters: EncounterDef[] = [
	{
		id: 'wolf_pack',
		enemies: [
			{ enemyDefId: 'large_wolf', count: 1 },
			{ enemyDefId: 'small_wolf', count: 2 }
		]
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
