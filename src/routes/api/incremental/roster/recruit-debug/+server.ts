import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';

/** POST /api/incremental/roster/recruit-debug – body { saveId?, heroId }.
 * Debug-only: add any hero to roster without a match and without spending essence.
 * Only available when import.meta.env.DEV is true.
 */
export const POST: RequestHandler = async (event) => {
	if (!import.meta.env.DEV) {
		error(404, 'Not found');
	}

	const { request } = event;
	let body: { saveId?: string; heroId?: number };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const { saveId } = await resolveIncrementalSave(event, { saveId: body.saveId });
	const user = event.locals.user;
	if (!user) error(401, 'Unauthorized');

	const heroId = body.heroId;
	if (heroId == null || typeof heroId !== 'number') error(400, 'heroId is required');

	const [save, existing] = await Promise.all([
		prisma.incrementalSave.findUnique({
			where: { id: saveId },
			select: { id: true }
		}),
		prisma.incrementalRosterHero.findUnique({
			where: { saveId_heroId: { saveId, heroId } }
		})
	]);

	if (!save) error(404, 'Save not found');
	if (existing) error(400, 'Hero already on roster');

	await prisma.incrementalRosterHero.create({
		data: { saveId, heroId }
	});

	const roster = await prisma.incrementalRosterHero.findMany({
		where: { saveId },
		select: { heroId: true },
		orderBy: { createdAt: 'asc' }
	});

	return json({
		saveId,
		roster: roster.map((r) => r.heroId)
	});
};
