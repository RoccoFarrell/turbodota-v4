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
	
	let townCreateResult;
	let status: string = ''

	if (session && session.user) {
        //console.log(`session: `, JSON.stringify(session))
        //reject the call if the user is not authenticated
		if (params.slug?.toString() !== session.user.account_id.toString())
			return new Response(JSON.stringify({ status: 'unauthorized' }), { status: 401 });

		//console.log(`params: ${JSON.stringify(params)}`);

		let account_id: number = parseInt(params.slug || '0');
		console.log(`\n-----------\n[/api/town/${account_id}/create] account_id: ${account_id}\n-------------\n`);

		//let townValues = await request.json();
		//console.log('request json: ', townValues);

		//console.log(`[api/random/${account_id}/create] creating random for: ${townValues.randomedHero}`);

		//check if user was updated recently, otherwise use the database
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

		let seasonID = -1;
		if (userResult && userResult.seasons) {
			let randomSeasonIndex = userResult.seasons.findIndex((season) => season.type === 'random' && season.active);
			if (randomSeasonIndex !== -1) {
				seasonID = userResult.seasons[randomSeasonIndex].id;
			} else {
				console.warn('[town create] randomSeasonIndex was -1');
			}
		}

        let season = userResult ? userResult.seasons.filter(season => season.id === seasonID)[0] : null

        if(season){
            console.log(`[town create] season found: ${seasonID}`, season)
            console.log(`[town create] turbotowns found: ${season.turbotowns}`)
    
            if(season.turbotowns.length === 0){
                townCreateResult = await prisma.turbotown.create({
                    data: {
                        account_id,
                        seasonID,
						createdDate: new Date(),
						metrics: {
							create: [
								{ label: 'gold', value: 0 },
								{ label: 'xp', value: 0 }
							]
						}
                    }
                })

				if(townCreateResult) status = "created a town"
			
            } else {
                console.log('[town create] town already found for user')
				status = "already has a town"
            }
        }
	} else {
		return new Response(JSON.stringify({ status: 'unauthorized to create town for this user' }), { status: 401 });
	}

	let newResponse = new Response(JSON.stringify({ status, insert: townCreateResult }));
	return newResponse;
};
