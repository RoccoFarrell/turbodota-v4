import { dev } from '$app/environment';
import prisma from '$lib/server/prisma';
import type { User, UserSession } from '@prisma/client';
import type { Cookies } from '@sveltejs/kit';

const SESSION_COOKIE_NAME = 'auth_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

/**
 * Generate a cryptographically secure random session ID
 */
function generateSessionId(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string): Promise<UserSession> {
	const sessionId = generateSessionId();
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

	const session = await prisma.userSession.create({
		data: {
			id: sessionId,
			userId,
			expiresAt
		}
	});

	return session;
}

/**
 * Validate a session by ID
 * Returns the session and user if valid, null if invalid/expired
 */
export async function validateSession(
	sessionId: string
): Promise<{ session: UserSession; user: User } | null> {
	const session = await prisma.userSession.findUnique({
		where: { id: sessionId },
		include: { user: true }
	});

	if (!session) {
		return null;
	}

	// Check if session is expired
	if (session.expiresAt < new Date()) {
		await prisma.userSession.delete({ where: { id: sessionId } });
		return null;
	}

	// Extend session if it's more than halfway to expiration
	const halfwayPoint = new Date(session.createdAt.getTime() + SESSION_DURATION_MS / 2);
	if (new Date() > halfwayPoint) {
		const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
		await prisma.userSession.update({
			where: { id: sessionId },
			data: { expiresAt: newExpiresAt }
		});
		session.expiresAt = newExpiresAt;
	}

	return { session, user: session.user };
}

/**
 * Invalidate (delete) a session
 */
export async function invalidateSession(sessionId: string): Promise<void> {
	await prisma.userSession.delete({ where: { id: sessionId } }).catch(() => {
		// Ignore errors if session doesn't exist
	});
}

/**
 * Set session cookie
 */
export function setSessionCookie(cookies: Cookies, sessionId: string, expiresAt: Date): void {
	cookies.set(SESSION_COOKIE_NAME, sessionId, {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		expires: expiresAt
	});
}

/**
 * Delete session cookie
 */
export function deleteSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE_NAME, {
		path: '/'
	});
}

/**
 * Get session ID from cookies
 */
export function getSessionId(cookies: Cookies): string | undefined {
	return cookies.get(SESSION_COOKIE_NAME);
}
