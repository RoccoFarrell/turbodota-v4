import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma'

export const POST: RequestHandler = async ({ request, params, url, locals }) => {
    console.log(`[api] - received GET to ${url.href}`)
    console.log(`params: ${JSON.stringify(params)}`)

    let newResponse = new Response(JSON.stringify({"status": "success", "update": "test"}));
	return newResponse;
}

export const GET: RequestHandler = async ({ params, url }) => {
    console.log(url)
    console.log(`[api] - received GET to ${url.href}`)
    console.log(`params: ${JSON.stringify(params)}`)

    let match_id: number = parseInt(params.slug || '0');
	console.log(`\n-----------\n[matches] match_id: ${match_id}\n-------------\n`);
	//let match_id: number = parseInt(url.searchParams.get('match_id') || "80636612")

	//check if user was updated recently, otherwise use the database
	const matchDetailResult = await prisma.matchDetail.findFirst({
		where: {
			match_id
		}
	});
    
    console.log(matchDetailResult)

    return new Response(JSON.stringify({"matchDetailResult": matchDetailResult}))
};