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
    const user = locals.user;

    let statusValues = await request.json();
    let statusResult: any = null;
    let turbotown: any = null;
    if (user) {
        //reject the call if the user is not authenticated
        if (params.slug?.toString() !== user.account_id?.toString())
            return new Response(JSON.stringify({ status: 'unauthorized' }), { status: 401 });

        //console.log(`params: ${JSON.stringify(params)}`);

        let account_id: number = parseInt(params.slug || '0');
        console.log(`\n-----------\n[POST /api/town/${account_id}/status] account_id: ${account_id}\n-------------\n`);

        turbotown = await prisma.turbotown.findMany({
            where: {
                account_id
            },
            include: {
                statuses: true
            },
            orderBy: {
                seasonID: 'desc'
            }
        })

        let currentTown = turbotown[0]

        statusResult = await prisma.turbotown.update({
            where: {
                id: currentTown.id
            },
            data: {
                statuses: {
                    create: {
                        name: statusValues.item,
                        isActive: true,
                        appliedDate: new Date(),
                        value: JSON.stringify(statusValues.info)
                    }
                }
            },
            include: {
                statuses: true
            }
        })

    } else {
        return new Response(JSON.stringify({ status: 'unauthorized to create status for this user' }), { status: 401 });
    }

    let newResponse: Response;
    if(statusResult){
        newResponse = new Response(JSON.stringify({ status: "success", turbotown: statusResult}));
    } else {
        newResponse = new Response(JSON.stringify({ status: "duplicate", turbotown }))
    }

    return newResponse;
};