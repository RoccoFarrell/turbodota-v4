import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

export type AtlasHeroRow = {
	heroId: number;
	localizedName: string;
	primaryAttribute: string;
	baseAttackInterval: number;
	baseAttackDamage: number;
	baseMaxHp: number;
	baseArmor: number;
	baseMagicResist: number;
	baseSpellInterval: number | null;
	ability1: {
		id: string;
		abilityName: string;
		description: string | null;
		type: string;
		trigger: string;
		effect: string;
		target: string;
		damageType: string | null;
		baseDamage: number | null;
		returnDamageRatio: number | null;
	} | null;
	ability2: {
		id: string;
		abilityName: string;
		description: string | null;
		type: string;
		trigger: string;
		effect: string;
		target: string;
		damageType: string | null;
		baseDamage: number | null;
		returnDamageRatio: number | null;
	} | null;
};

/** GET /api/incremental/atlas – all heroes with base stats and abilities for Atlas view */
export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	const baseStats = await prisma.incrementalHeroBaseStat.findMany({
		orderBy: { heroId: 'asc' }
	});
	if (baseStats.length === 0) {
		return json({ heroes: [] });
	}

	const allAbilityIds = new Set<string>();
	for (const b of baseStats) {
		allAbilityIds.add(b.abilityId1);
		allAbilityIds.add(b.abilityId2);
	}
	const abilities = await prisma.incrementalHeroAbility.findMany({
		where: { id: { in: [...allAbilityIds] } }
	});
	const abilityMap = new Map(abilities.map((a) => [a.id, a]));

	const heroes: AtlasHeroRow[] = baseStats.map((b) => ({
		heroId: b.heroId,
		localizedName: b.localizedName,
		primaryAttribute: b.primaryAttribute,
		baseAttackInterval: b.baseAttackInterval,
		baseAttackDamage: b.baseAttackDamage,
		baseMaxHp: b.baseMaxHp,
		baseArmor: b.baseArmor,
		baseMagicResist: b.baseMagicResist,
		baseSpellInterval: b.baseSpellInterval,
		ability1: mapAbility(abilityMap.get(b.abilityId1)),
		ability2: mapAbility(abilityMap.get(b.abilityId2))
	}));

	return json({ heroes });
};

function mapAbility(
	a: { id: string; abilityName: string; description: string | null; type: string; trigger: string; effect: string; target: string; damageType: string | null; baseDamage: number | null; returnDamageRatio: number | null } | undefined
): AtlasHeroRow['ability1'] {
	if (!a) return null;
	return {
		id: a.id,
		abilityName: a.abilityName,
		description: a.description,
		type: a.type,
		trigger: a.trigger,
		effect: a.effect,
		target: a.target,
		damageType: a.damageType,
		baseDamage: a.baseDamage,
		returnDamageRatio: a.returnDamageRatio
	};
}
