import { auth } from '$lib/server/lucia'
import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ locals }) => {
	const session = await locals.auth.validate()
	if (!session) {
		redirect(302, '/')
	}

	await auth.invalidateSession(session.sessionId)
	locals.auth.setSession(null)

	redirect(302, '/')
}
