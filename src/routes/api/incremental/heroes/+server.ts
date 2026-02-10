import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { AbilityDef } from '$lib/incremental/types';
import { getHeroDefsFromDb } from '$lib/server/incremental-hero-resolver';

/** GET /api/incremental/heroes – hero definitions from DB (base + optional training).
 * Query: saveId – if provided, returned hero defs include training (effective stats).
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const saveId = url.searchParams.get('saveId')?.trim() || null;
	const { heroes, heroNames, getAbilityDef } = await getHeroDefsFromDb(saveId);
	const abilityIds = [...new Set(heroes.flatMap((h) => h.abilityIds).filter(Boolean))];
	const abilityDefs: Record<string, AbilityDef> = {};
	for (const id of abilityIds) {
		const def = getAbilityDef(id);
		if (def) abilityDefs[id] = def;
	}
	return json({
		heroes,
		heroNames,
		abilityDefs
	});
};
