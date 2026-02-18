import { Google } from 'arctic';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

/**
 * Google OAuth provider using Arctic
 *
 * Required environment variables:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_REDIRECT_URI (e.g., http://localhost:5173/api/auth/google/callback or https://yourdomain.com/api/auth/google/callback)
 */

const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = env.GOOGLE_REDIRECT_URI || (dev
	? 'http://localhost:5173/api/auth/google/callback'
	: 'https://turbodota.com/api/auth/google/callback'
);

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
	console.warn('⚠️ Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
}

export const google = new Google(
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GOOGLE_REDIRECT_URI
);
