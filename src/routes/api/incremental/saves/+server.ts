import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

/** GET /api/incremental/saves – list current user's saves */
export const GET: RequestHandler = async (event) => {
	const session = await event.locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const userId = session.user.userId;
	const saves = await prisma.incrementalSave.findMany({
		where: { userId },
		select: { id: true, name: true, essence: true, createdAt: true },
		orderBy: { createdAt: 'asc' }
	});
	return json(saves);
};

/** POST /api/incremental/saves – create a new save. Body: { name? } */
export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const userId = session.user.userId;
	let body: { name?: string };
	try {
		body = await event.request.json();
	} catch {
		body = {};
	}
	const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null;
	const save = await prisma.incrementalSave.create({
		data: { userId, name },
		select: { id: true, name: true, essence: true, createdAt: true }
	});
	return json(save);
};
