import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user
	if (user) {
		redirect(302, '/')
	}
}

// Legacy username/password registration actions disabled - auth now uses Steam OpenID / Google OAuth
// export const actions: Actions = {
// 	default: async ({ request, locals }) => {
// 		// Old Lucia auth flow removed
// 	}
// }
