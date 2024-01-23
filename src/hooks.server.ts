// import { handleHooks } from "@lucia-auth/sveltekit"
import { auth } from '$lib/server/lucia'
import type { Handle } from '@sveltejs/kit'
// import { sequence } from "@sveltejs/kit/hooks"

export const handle: Handle = async ({ event, resolve }) => {
	//might need this to force ISR rerender to fix multiple username issue
	//if(event.url) console.log(event.url)
	console.log(`[hooks] - setting locals auth`)
	event.locals.auth = auth.handleRequest(event)
	console.log('[hooks] - local auth returning')

	// const session = await event.locals.auth.validate()
	// event.locals.session = session;
	// console.log(`session in hooks: `, session)
	return await resolve(event)
}
