import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { steamLink } from './steam-link';

/**
 * Initiate Steam OpenID for account linking
 * Must be authenticated to use this endpoint
 * GET /api/auth/steam/link
 */
export const GET: RequestHandler = async ({ locals }) => {
	// User must be logged in to link Steam account
	if (!locals.user) {
		throw error(401, 'You must be logged in to link a Steam account');
	}

	// Get Steam OpenID redirect URL
	const redirectUrl = await steamLink.getRedirectUrl();

	// Redirect to Steam
	throw redirect(302, redirectUrl);
};
