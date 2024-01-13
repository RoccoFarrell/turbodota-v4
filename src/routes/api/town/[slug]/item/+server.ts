import type { RequestHandler } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';
import prisma from '$lib/server/prisma';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

export const POST: RequestHandler = async ({ request, params, url, locals }) => {
	const session = await locals.auth.validate();

	//console.log(`[/api/town/${params.slug}/create] session in API call: `,session, JSON.stringify(session), `params.slug: `, params.slug);
	
	let turbotownItemCreateResult;

	if (session && session.user) {
        //console.log(`session: `, JSON.stringify(session))
        //reject the call if the user is not authenticated
		if (params.slug?.toString() !== session.user.account_id.toString())
			return new Response(JSON.stringify({ status: 'unauthorized' }), { status: 401 });

		//console.log(`params: ${JSON.stringify(params)}`);

		let account_id: number = parseInt(params.slug || '0');
		console.log(`\n-----------\n[/api/town/${account_id}/create] account_id: ${account_id}\n-------------\n`);

		const userResult = await prisma.dotaUser.findUnique({
			where: {
				account_id
			},
			include: {
				seasons: {
                    where: {
                        active: true
                    },
					include: {
						turbotowns: {
                            where: {account_id: account_id}
                        }
					}
				}
			}
		});

	} else {
		return new Response(JSON.stringify({ status: 'unauthorized to add item for this user' }), { status: 401 });
	}

	let newResponse = new Response(JSON.stringify({ status: 'success', insert: turbotownItemCreateResult }));
	return newResponse;
};
