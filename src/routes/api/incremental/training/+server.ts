import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';

/** GET /api/incremental/training – all hero training values for current save. Query: saveId (optional). */
export const GET: RequestHandler = async (event) => {
	const saveId = event.url.searchParams.get('saveId') ?? undefined;
	const { saveId: resolvedSaveId } = await resolveIncrementalSave(event, { saveId });
	const rows = await prisma.incrementalHeroTraining.findMany({
		where: { saveId: resolvedSaveId },
		select: { heroId: true, statKey: true, value: true }
	});
	return json({
		saveId: resolvedSaveId,
		training: rows.map((r) => ({ heroId: r.heroId, statKey: r.statKey, value: r.value }))
	});
};
