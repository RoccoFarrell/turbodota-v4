import { google } from '$lib/server/arctic';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Initiate Google OAuth flow
 * GET /api/auth/google
 */
/**
 * Generate a cryptographically secure PKCE code verifier
 * Must be 43-128 characters from [A-Z, a-z, 0-9, -, ., _, ~]
 */
function generateCodeVerifier(): string {
	const randomBytes = new Uint8Array(32);
	crypto.getRandomValues(randomBytes);
	return btoa(String.fromCharCode(...randomBytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

export const GET: RequestHandler = async ({ cookies }) => {
	// Generate CSRF state and PKCE code verifier
	const state = crypto.randomUUID();
	const codeVerifier = generateCodeVerifier();

	// Create authorization URL (state, codeVerifier, scopes)
	const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

	// Store state and code verifier in cookies for callback
	cookies.set('google_oauth_state', state, {
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: 'lax',
		secure: false // Allow in development
	});

	cookies.set('google_code_verifier', codeVerifier, {
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax',
		secure: false
	});

	// Redirect to Google
	throw redirect(302, url.toString());
};
