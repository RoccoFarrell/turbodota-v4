import { auth } from '$lib/server/lucia'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate()
	if (!session) {
		redirect(302, '/');
	}
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { leagueName, dotaUsersList } = Object.fromEntries(await request.formData()) as Record<
			string,
			string
		>

		try {
			console.log(leagueName, dotaUsersList)
		} catch (err) {
			console.error(err)
			return fail(400, { message: 'Could not create league' })
		}
		console.log("league created")
		//console.log('username:', username, ' password:', password)
		redirect(302, '/leagues');
	}
}
