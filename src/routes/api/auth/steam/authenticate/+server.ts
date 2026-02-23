import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { createSession, setSessionCookie } from '$lib/server/session';
import { deriveAccountId } from '$lib/server/steam-utils';
import steam from '../steam';

//helpers
import { createDotaUser } from '../../../helpers';

export const GET: RequestHandler = async ({ request, cookies }) => {
	console.log('received GET to authenticate');

	const steamUser = await steam.authenticate(request);

	if (!steamUser || !steamUser.steamid) {
		throw error(400, 'Failed to authenticate with Steam');
	}

	// Derive account_id from steam_id
	const account_id = deriveAccountId(steamUser.steamid);

	// Find user by steam_id
	let dbUser = await prisma.user.findUnique({
		where: { steam_id: BigInt(steamUser.steamid) }
	});

	if (!dbUser) {
		console.log(`User ${steamUser.steamid} - ${steamUser.username} not found, creating...`);

		// Create DotaUser for the new user
		const createDUResult = await createDotaUser(account_id);

		console.log(`[/authenticate] createDUResult: `, createDUResult);

		if (createDUResult.account_id) {
			// Create new user
			dbUser = await prisma.user.create({
				data: {
					id: crypto.randomUUID(),
					name: steamUser.name || '',
					username: steamUser.username,
					steam_id: BigInt(steamUser.steamid),
					account_id: account_id,
					profile_url: steamUser.profile,
					avatar_url: steamUser.avatar?.small,
					createdDate: new Date()
				}
			});
		} else {
			console.error(`[/authenticate] failed to create dota user so couldn't create normal user`);
			throw error(500, 'Failed to create user account');
		}
	}

	// Create session
	const session = await createSession(dbUser.id);
	setSessionCookie(cookies, session.id, session.expiresAt);

	// Redirect to turbotown
	throw redirect(302, '/turbotown');
};
