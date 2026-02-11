import type { EncounterDef, EnemyDef } from '../types';

/** Scaled so ~30s of auto-attacks from 3 heroes clears the pack without killing the roster (enemies focus Front Liner). */
const enemies: EnemyDef[] = [
	{
		id: 'large_wolf',
		name: 'Large Wolf',
		hp: 700,
		attackInterval: 3,
		damage: 4,
		baseArmor: 2,
		baseMagicResist: 0
	},
	{
		id: 'small_wolf',
		name: 'Small Wolf',
		hp: 250,
		attackInterval: 2.5,
		damage: 2,
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
