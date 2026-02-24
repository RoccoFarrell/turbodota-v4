import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { getBankBalance } from '$lib/incremental/bank/bank.service.server';

/** GET /api/incremental/saves – list current user's saves (with essence from Bank) */
export const GET: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) error(401, 'Unauthorized');
	const userId = user.id;
	const saves = await prisma.incrementalSave.findMany({
		where: { userId },
		select: {
			id: true,
			name: true,
			createdAt: true,
			seasonId: true,
			season: { select: { name: true } }
		},
		orderBy: { createdAt: 'asc' }
	});
	// Fetch essence from Bank for each save (backward compat with UI that reads .essence)
	const result = await Promise.all(
		saves.map(async (s) => ({
			...s,
			essence: await getBankBalance(s.id, 'essence'),
			seasonName: s.season?.name ?? null
		}))
	);
	return json(result);
};

/** POST /api/incremental/saves – create a new save. Body: { name?, seasonId? } */
export const POST: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) error(401, 'Unauthorized');
	const userId = user.id;
	let body: { name?: string; seasonId?: number };
	try {
		body = await event.request.json();
	} catch {
		body = {};
	}
	const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null;
	const seasonId =
		typeof body.seasonId === 'number' && Number.isInteger(body.seasonId)
			? body.seasonId
			: null;
	const save = await prisma.incrementalSave.create({
		data: { userId, name, seasonId },
		select: { id: true, name: true, createdAt: true, seasonId: true }
	});
	return json({ ...save, essence: 0, seasonName: null });
};
