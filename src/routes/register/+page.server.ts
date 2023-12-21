import { auth } from '$lib/server/lucia'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate()
	if (session) {
		redirect(302, '/');
	}
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { name, username, password } = Object.fromEntries(await request.formData()) as Record<
			string,
			string
		>
		try {
			console.log(name, username, password)
			const user = await auth.createUser({
				key: {
					providerId: 'username',
					providerUserId: username.toLowerCase(),
					password
				},
				attributes: {
					name,
					username
				}
			})
			const session = await auth.createSession({
				userId: user.userId,
				attributes: {}
			});

			locals.auth.setSession(session)
		} catch (err) {
			console.error(err)
			return fail(400, { message: 'Could not register user' })
		}
		redirect(302, '/login');
	}
}
