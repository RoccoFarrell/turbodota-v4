import { invalidateSession, deleteSessionCookie } from '$lib/server/session';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	const session = locals.session;
	if (!session) {
		throw redirect(302, '/');
	}

	await invalidateSession(session.id);
	deleteSessionCookie(cookies);

	throw redirect(302, '/');
};
