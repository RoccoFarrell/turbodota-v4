import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';

/** GET /api/incremental/roster – unlocked hero ids for current save. Query: saveId (optional). */
export const GET: RequestHandler = async (event) => {
	const saveId = event.url.searchParams.get('saveId') ?? undefined;
	const { saveId: resolvedSaveId } = await resolveIncrementalSave(event, { saveId });
	const rows = await prisma.incrementalRosterHero.findMany({
		where: { saveId: resolvedSaveId },
		select: { heroId: true },
		orderBy: { createdAt: 'asc' }
	});
	return json({ heroIds: rows.map((r) => r.heroId), saveId: resolvedSaveId });
};
