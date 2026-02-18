import { google } from '$lib/server/arctic';
import { createSession, setSessionCookie } from '$lib/server/session';
import prisma from '$lib/server/prisma';
import { error, isHttpError, isRedirect, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface GoogleUser {
	sub: string; // Google user ID
	email: string;
	email_verified: boolean;
	name: string;
	picture: string;
	given_name?: string;
	family_name?: string;
}

/**
 * Generate a unique username from email
 */
function generateUsername(email: string): string {
	const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
	const random = Math.random().toString(36).substring(2, 6);
	return `${prefix}_${random}`;
}

/**
 * Handle Google OAuth callback
 * GET /api/auth/google/callback
 */
export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	const storedState = cookies.get('google_oauth_state');
	const storedCodeVerifier = cookies.get('google_code_verifier');

	// Verify state parameter (CSRF protection)
	if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
		throw error(400, 'Invalid OAuth state or missing code verifier');
	}

	// Clear the cookies
	cookies.delete('google_oauth_state', { path: '/' });
	cookies.delete('google_code_verifier', { path: '/' });

	try {
		// Exchange authorization code for tokens (requires code verifier for PKCE)
		const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);

		// Fetch user info from Google
		const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken()}`
			}
		});

		if (!response.ok) {
			throw error(500, 'Failed to fetch user info from Google');
		}

		const googleUser: GoogleUser = await response.json();

		// Find or create user by google_id
		let user = await prisma.user.findUnique({
			where: { google_id: googleUser.sub }
		});

		if (!user) {
			// Check if email already exists (account linking scenario)
			const existingEmailUser = await prisma.user.findUnique({
				where: { email: googleUser.email }
			});

			if (existingEmailUser) {
				// Email exists but not linked to this Google account
				// For now, we'll create a new user with a different email
				// TODO: In the future, add account merging flow
				const uniqueEmail = `${googleUser.sub}@google-oauth.turbodota.com`;
				user = await prisma.user.create({
					data: {
						id: crypto.randomUUID(),
						google_id: googleUser.sub,
						email: uniqueEmail,
						name: googleUser.name,
						username: generateUsername(googleUser.email),
						avatar_url: googleUser.picture
					}
				});
			} else {
				// New user: create with google_id
				user = await prisma.user.create({
					data: {
						id: crypto.randomUUID(),
						google_id: googleUser.sub,
						email: googleUser.email,
						name: googleUser.name,
						username: generateUsername(googleUser.email),
						avatar_url: googleUser.picture
					}
				});
			}
		} else {
			// Existing Google user: update profile info (avatar, name may have changed)
			user = await prisma.user.update({
				where: { id: user.id },
				data: {
					name: googleUser.name,
					avatar_url: googleUser.picture,
					email: googleUser.email // Update email in case it changed
				}
			});
		}

		// Create session
		const session = await createSession(user.id);
		setSessionCookie(cookies, session.id, session.expiresAt);

		// Redirect to home or profile page
		// If user doesn't have account_id, redirect to profile to link Steam or enter manually
		if (!user.account_id) {
			throw redirect(302, '/profile?welcome=true');
		}

		throw redirect(302, '/');
	} catch (err) {
		// SvelteKit throws Redirect/HttpError objects, not Response instances
		if (isRedirect(err) || isHttpError(err)) {
			throw err;
		}
		// Log actual errors
		console.error('Google OAuth error:', err);
		throw error(500, 'Authentication failed');
	}
};
