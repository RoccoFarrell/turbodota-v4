import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

export const GET: RequestHandler = async ({ params, url, locals }) => {
    // const session = await locals.auth.validate();

    // console.log(`[preferences/GET] session in API call: `, JSON.stringify(session), `params.slug: `, params.slug)
    // //reject the call if the user is not authenticated
    // if(params.slug?.toString() !== session.user.account_id.toString()) return new Response(JSON.stringify({"status": "unauthorized"}),{status: 401})

    //console.log(`params: ${JSON.stringify(params)}`)
    let account_id: number = parseInt(params.slug || '0');
	console.log(`-----------\n[preferences] received GET to ${url.href}, account_id: ${account_id}\n-------------`);

    //console.log(`[api/preferences/${account_id}]getting preferences for: ${account_id}`);

    const prefsResult = await prisma.userPrefs.findMany({
        where: { account_id }
    });

    return new Response(JSON.stringify(prefsResult))
};

export const POST: RequestHandler = async ({ request, params, url, locals }) => {
    const user = locals.user;

    console.log(`user in API call: `, JSON.stringify(user), `params.slug: `, params.slug)
    //reject the call if the user is not authenticated
    if(!user || params.slug?.toString() !== user.account_id?.toString()) return new Response(JSON.stringify({"status": "unauthorized"}),{status: 401})
    
    console.log(`params: ${JSON.stringify(params)}`)

	let account_id: number = parseInt(params.slug || '0');
	console.log(`\n-----------\n[preferences] account_id: ${account_id}\n-------------\n`);

    let preferences = await request.json()

    console.log(`[api/preferences/${account_id}] creating preference for: ${account_id}`);

	//check if user was updated recently, otherwise use the database
    
    const prefsResult = await prisma.userPrefs.upsert({
        where:{
            userPlusName: { account_id, name: preferences.name}
        },
        update: {
            account_id,
            name: preferences.name,
            value: preferences.value
        },
        create: {
            account_id,
            name: preferences.name,
            value: preferences.value
        } 
    })

	let newResponse = new Response(JSON.stringify({"status": "success", "table": "UserPrefs", "upsert": prefsResult}));
	return newResponse;
};
