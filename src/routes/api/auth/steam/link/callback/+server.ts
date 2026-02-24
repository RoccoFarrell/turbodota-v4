import { isHttpError, isRedirect, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { deriveAccountId } from '$lib/server/steam-utils';
import { steamLink } from '../steam-link';
import { createDotaUser } from '../../../../helpers';
import { createSession, setSessionCookie, invalidateSession } from '$lib/server/session';

/**
 * Handle Steam OpenID callback for account linking
 * GET /api/auth/steam/link/callback
 */
export const GET: RequestHandler = async ({ request, locals, cookies }) => {
	// User must still be logged in
	if (!locals.user || !locals.session) {
		throw redirect(302, '/profile?link_error=session_expired');
	}

	try {
		// Verify Steam OpenID response
		const steamUser = await steamLink.authenticate(request);

		if (!steamUser || !steamUser.steamid) {
			throw redirect(302, '/profile?link_error=steam_failed');
		}

		const steamId = BigInt(steamUser.steamid);
		const account_id = deriveAccountId(steamUser.steamid);

		// Check if this Steam account is already linked to another user
		const existingSteamUser = await prisma.user.findUnique({
			where: { steam_id: steamId }
		});

		if (existingSteamUser && existingSteamUser.id !== locals.user.id) {
			if (existingSteamUser.google_id) {
				// Both users have Google — can't auto-merge
				throw redirect(302, '/profile?link_error=already_linked');
			}

			// The old user is Steam-only. Instead of stripping their account_id
			// (which would break FK references from UserPrefs, Random, Turbotown, League),
			// we merge by adding Google credentials to the OLD user and deleting the
			// current Google-only user. The old user keeps all their data intact.
			const currentUser = locals.user;
			const googleId = currentUser.google_id;
			const email = currentUser.email;
			const name = currentUser.name;

			// Delete the Google-only user first (to free up unique google_id/email)
			await invalidateSession(locals.session.id);
			await prisma.userSession.deleteMany({ where: { userId: currentUser.id } });
			await prisma.incrementalSave.deleteMany({ where: { userId: currentUser.id } });
			await prisma.incrementalRun.deleteMany({ where: { userId: currentUser.id } });
			await prisma.user.delete({ where: { id: currentUser.id } });

			// Now add Google identity to the old Steam user
			await prisma.user.update({
				where: { id: existingSteamUser.id },
				data: {
					google_id: googleId,
					email: email,
					name: name ?? existingSteamUser.name,
					username: steamUser.username,
					avatar_url: steamUser.avatar?.small || existingSteamUser.avatar_url,
					profile_url: steamUser.profile?.url || existingSteamUser.profile_url
				}
			});

			// Create a new session for the merged (old Steam) user
			const session = await createSession(existingSteamUser.id);
			setSessionCookie(cookies, session.id, session.expiresAt);

			throw redirect(302, '/profile?linked=steam');
		}

		// No conflict — simple link: just add Steam fields to current user

		// Check if this account_id is already used by another user (manual entry)
		const accountIdUser = await prisma.user.findUnique({
			where: { account_id }
		});

		if (accountIdUser && accountIdUser.id !== locals.user.id) {
			// The other user had this ID via manual entry.
			// We can't just NULL their account_id if they have FK references.
			// Delete their dependent records first (these are unverified claims).
			await prisma.userPrefs.deleteMany({ where: { account_id } });
			await prisma.$executeRaw`
				UPDATE "User" SET account_id = NULL WHERE id = ${accountIdUser.id}
			`;
		}

		// Ensure DotaUser row exists before setting FK
		await createDotaUser(account_id);

		// Update user with Steam information
		await prisma.user.update({
			where: { id: locals.user.id },
			data: {
				steam_id: steamId,
				account_id: account_id,
				username: steamUser.username,
				avatar_url: steamUser.avatar?.small || locals.user.avatar_url,
				profile_url: steamUser.profile?.url || null
			}
		});

		throw redirect(302, '/profile?linked=steam');
	} catch (err) {
		if (isRedirect(err) || isHttpError(err)) {
			throw err;
		}
		console.error('Steam linking error:', err);
		throw redirect(302, '/profile?link_error=unknown');
	}
};
