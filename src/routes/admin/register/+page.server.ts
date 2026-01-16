import { auth } from '$lib/server/lucia'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { createDotaUser } from '../../api/helpers';
import { findRandomDotaUser } from '$lib/helpers/randomDotaUser'

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate()
	if (session) {
		redirect(302, '/')
	}
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		console.log('[register] - creating user')
		const { name, username, password } = Object.fromEntries(await request.formData()) as Record<
			string,
			string
		>
		try {
			let account_id = await findRandomDotaUser()
			if(account_id){
				console.error('[register] - generating with account_id: ', account_id)
				let createDUResult = await createDotaUser(account_id)

				const user = await auth.createUser({
					key: {
						providerId: 'username',
						providerUserId: username,
						password
					},
					attributes: {
						name,
						username,
						account_id,
						createdDate: new Date()
					}
				})

				console.log(`[register] - created user: `, user)

				if(!user) return(fail(400, { message: 'could not create user'}))
	
				const session = await auth.createSession({
					userId: user.userId,
					attributes: {}
				});
	
				locals.auth.setSession(session)
			} else {
				console.error('[register] - could not generate with account_id: ', account_id)
				return fail(400, { message: 'could not get random dota ID'})
			}

		} catch (err) {
			console.error(err)
			return fail(400, { message: 'Could not register user' })
		}
		//throw redirect(302, '/admin/login')
	}
}
