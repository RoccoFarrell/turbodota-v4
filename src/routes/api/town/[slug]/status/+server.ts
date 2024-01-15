import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Hero } from '@prisma/client'
import prisma from '$lib/server/prisma'

export const GET: RequestHandler = async ({ params, url }) => {
    console.log(`-----------\n[/api/town/status] - received GET to ${url.href}\n-----------`)

    return new Response(JSON.stringify({ test: true }), {
		headers: {
			'cache-control': `max-age=60`
		}
	})
};

export const POST: RequestHandler = async ({ request, params, url, locals }) => {
	const session = await locals.auth.validate();

    let statusValues = await request.json();
    let statusResult: any = null;
    let turbotown: any = null;
	if (session && session.user) {
        //console.log(`session: `, JSON.stringify(session))
        //reject the call if the user is not authenticated
		if (params.slug?.toString() !== session.user.account_id.toString())
			return new Response(JSON.stringify({ status: 'unauthorized' }), { status: 401 });

		//console.log(`params: ${JSON.stringify(params)}`);

		let account_id: number = parseInt(params.slug || '0');
		console.log(`\n-----------\n[POST /api/town/${account_id}/status] account_id: ${account_id}\n-------------\n`);

        turbotown = await prisma.turbotown.findUnique({
            where: {
                account_id
            },
            include: {
                statuses: true
            }
        })

        if(turbotown?.statuses.length === 0){
            statusResult = await prisma.turbotown.update({
                where: {
                    account_id
                },
                data: {
                    statuses: {
                        create: {
                            name: "observer",
                            isActive: true,
                            appliedDate: new Date(),
                            value: JSON.stringify(statusValues.info)
                        }
                    }
                }
            })
        }
	} else {
		return new Response(JSON.stringify({ status: 'unauthorized to create status for this user' }), { status: 401 });
	}

    let newResponse: Response;
    if(statusResult){
        newResponse = new Response(JSON.stringify({ status: "success", insert: statusResult}));
    } else {
        newResponse = new Response(JSON.stringify({ status: "duplicate", turbotown}))
    }
	
	return newResponse;
};