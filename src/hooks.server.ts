// import { handleHooks } from "@lucia-auth/sveltekit"
import { auth } from '$lib/server/lucia'
import type { Handle } from '@sveltejs/kit'
// import { sequence } from "@sveltejs/kit/hooks"

export const handle: Handle = async ({ event, resolve }) => {
	//might need this to force ISR rerender to fix multiple username issue
	//if(event.url) console.log(event.url)
	event.locals.auth = auth.handleRequest(event)
	return await resolve(event)
}
