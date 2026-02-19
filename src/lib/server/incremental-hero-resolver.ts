/**
 * Resolve hero and ability definitions from DB (IncrementalHeroBaseStat, IncrementalHeroAbility).
 * Optionally merges training (IncrementalHeroTraining) for a save to produce effective stats.
 * Used by APIs and (when wired) by battle runner.
 */

import prisma from '$lib/server/prisma';
import type { HeroDef, AbilityDef, PrimaryAttribute } from '$lib/incremental/types';
import { PrimaryAttribute as PrimaryAttributeConst } from '$lib/incremental/types';

function primaryAttribute(value: string): PrimaryAttribute {
	if (value === 'str' || value === 'agi' || value === 'int' || value === 'universal') return value;
	return PrimaryAttributeConst.STR;
}

/** Derive statusEffectOnHit from DB ability when effect/target imply a stun. */
function statusEffectOnHitFromDb(effect: string | null, target: string | null): { statusEffectId: 'stun'; duration: number } | undefined {
	if (effect === 'stun' && target === 'single_enemy') return { statusEffectId: 'stun', duration: 1.5 };
	return undefined;
}

export interface HeroNameRow {
	heroId: number;
	localizedName: string;
}

/** Load all base stats and abilities from DB and build HeroDef[] + lookup. */
export async function getHeroDefsFromDb(saveId?: string | null): Promise<{
	heroes: HeroDef[];
	heroNames: HeroNameRow[];
	getHeroDef: (heroId: number) => HeroDef | undefined;
	getAbilityDef: (abilityId: string) => AbilityDef | undefined;
}> {
	const [baseStats, abilities, trainingRows] = await Promise.all([
		prisma.incrementalHeroBaseStat.findMany({ orderBy: { heroId: 'asc' } }),
		prisma.incrementalHeroAbility.findMany(),
		saveId
			? prisma.incrementalHeroTraining.findMany({
					where: { saveId },
					select: { heroId: true, statKey: true, value: true }
				})
			: Promise.resolve([])
	]);

	const trainingByHero = new Map<number, Map<string, number>>();
	for (const t of trainingRows) {
		let m = trainingByHero.get(t.heroId);
		if (!m) {
			m = new Map();
			trainingByHero.set(t.heroId, m);
		}
		m.set(t.statKey, t.value);
	}

	const abilityMap = new Map<string, AbilityDef>();
	for (const a of abilities) {
		const statusEffectOnHit = statusEffectOnHitFromDb(a.effect, a.target);
		abilityMap.set(a.id, {
			id: a.id,
			type: a.type as 'active' | 'passive',
			trigger: a.trigger,
			effect: a.effect,
			target: a.target,
			damageType: (a.damageType as AbilityDef['damageType']) ?? undefined,
			baseDamage: a.baseDamage ?? undefined,
			returnDamageRatio: a.returnDamageRatio ?? undefined,
			abilityName: a.abilityName,
			description: a.description ?? undefined,
			statusEffectOnHit
		});
	}

	const heroes: HeroDef[] = baseStats.map((b) => {
		const tr = trainingByHero.get(b.heroId);
		const baseMaxHp = b.baseMaxHp + (tr?.get('hp') ?? 0);
		const baseAttackDamage = b.baseAttackDamage + (tr?.get('attack_damage') ?? 0);
		const baseArmor = b.baseArmor + (tr?.get('armor') ?? 0);
		const baseMagicResist = b.baseMagicResist + (tr?.get('magic_resist') ?? 0);
		const attackSpeed = tr?.get('attack_speed') ?? 0;
		const spellPower = tr?.get('spell_power') ?? 0;
		const spellHaste = tr?.get('spell_haste') ?? 0;
		const abilityIds = [b.abilityId1, b.abilityId2].filter(Boolean);
		return {
			heroId: b.heroId,
			primaryAttribute: primaryAttribute(b.primaryAttribute),
			baseAttackInterval: b.baseAttackInterval,
			baseAttackDamage: Math.round(baseAttackDamage),
			baseMaxHp: Math.round(baseMaxHp),
			baseArmor: baseArmor,
			baseMagicResist: baseMagicResist,
			baseSpellInterval: b.baseSpellInterval,
			abilityIds,
			attackSpeed,
			spellPower,
			spellHaste
		};
	});

	const byHeroId = new Map(heroes.map((h) => [h.heroId, h]));
	const heroNames: HeroNameRow[] = baseStats.map((b) => ({
		heroId: b.heroId,
		localizedName: b.localizedName
	}));

	return {
		heroes,
		heroNames,
		getHeroDef: (heroId: number) => byHeroId.get(heroId),
		getAbilityDef: (abilityId: string) => abilityMap.get(abilityId)
	};
}

/** Set of hero IDs that exist in IncrementalHeroBaseStat (allowed for roster/lineup). */
export async function getAllowedHeroIds(): Promise<Set<number>> {
	const rows = await prisma.incrementalHeroBaseStat.findMany({
		select: { heroId: true }
	});
	return new Set(rows.map((r) => r.heroId));
}

/** Check whether a hero id exists in IncrementalHeroBaseStat (allowed for roster/lineup). */
export async function isHeroIdAllowed(heroId: number): Promise<boolean> {
	const allowed = await getAllowedHeroIds();
	return allowed.has(heroId);
}
