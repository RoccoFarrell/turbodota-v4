import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { deriveAccountId } from '$lib/server/steam-utils';
import { steamLink } from '../steam-link';

/**
 * Handle Steam OpenID callback for account linking
 * GET /api/auth/steam/link/callback
 */
export const GET: RequestHandler = async ({ request, locals }) => {
	// User must still be logged in
	if (!locals.user) {
		throw error(401, 'Session expired. Please log in again.');
	}

	try {
		// Verify Steam OpenID response
		const steamUser = await steamLink.authenticate(request);

		if (!steamUser || !steamUser.steamid) {
			throw error(400, 'Failed to authenticate with Steam');
		}

		// Check if this Steam account is already linked to another user
		const existingUser = await prisma.user.findUnique({
			where: { steam_id: BigInt(steamUser.steamid) }
		});

		if (existingUser && existingUser.id !== locals.user.id) {
			throw error(400, 'This Steam account is already linked to another user');
		}

		// Derive account_id from steam_id
		const account_id = deriveAccountId(steamUser.steamid);

		// Check if this account_id is already used by another user
		const accountIdUser = await prisma.user.findUnique({
			where: { account_id }
		});

		if (accountIdUser && accountIdUser.id !== locals.user.id) {
			throw error(400, 'This Dota 2 account is already linked to another user');
		}

		// Update user with Steam information
		await prisma.user.update({
			where: { id: locals.user.id },
			data: {
				steam_id: BigInt(steamUser.steamid),
				account_id: account_id,
				// Optionally update username if not set
				username: locals.user.username || steamUser.username,
				// Optionally update avatar if not set or prefer Steam avatar
				avatar_url: steamUser.avatar?.small || locals.user.avatar_url,
				profile_url: steamUser.profile
			}
		});

		// Redirect to profile with success message
		throw redirect(302, '/profile?linked=steam');
	} catch (err) {
		console.error('Steam linking error:', err);
		if (err instanceof Response) {
			throw err; // Re-throw redirects and errors
		}
		throw error(500, 'Failed to link Steam account');
	}
};
