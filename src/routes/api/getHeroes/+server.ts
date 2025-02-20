import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Hero } from '@prisma/client';
import prisma from '$lib/server/prisma';

export const GET: RequestHandler = async ({ params, url }) => {
	console.log(`-----------\n[api/getHeroes] - received GET to ${url.href}\n-----------`);
	//console.log(`params: ${JSON.stringify(params)}`)
	//check if user was updated recently, otherwise use the database

	let forceUpdate: boolean = false;
	let updateInterval = new Date();
	let dataSource: string = '';

	let allHeroes: Hero[] = [];

	//updateInterval.setMinutes(rightNow.getMinutes() - (60 * 24));
	if (!forceUpdate) {
		console.log('[/api/getHeroes] fetch from DB');
		const heroResult = await prisma.hero.findMany();

		//console.log(matchesResult)
		allHeroes = heroResult;
		dataSource = 'db';
	} else {
		console.log('[/api/getHeroes] fetch from OD');
		dataSource = 'od';

		async function processHeroesInChunks(heroes: Hero[], chunkSize = 10) {
			const results = [];
			for (let i = 0; i < heroes.length; i += chunkSize) {
				const chunk = heroes.slice(i, i + chunkSize);
				const chunkResult = await prisma.$transaction(async (tx) => {
					return await Promise.all(
						chunk.map(async (hero: Hero) => {
							return await tx.hero.upsert({
								where: { id: hero.id },
								update: { ...hero },
								create: { ...hero }
							});
						})
					);
				}, {
					maxWait: 20000,
					timeout: 30000
				});
				results.push(...chunkResult);
			}
			return results;
		}

		allHeroes = await fetch(encodeURI(`https://api.opendota.com/api/heroes`), {
			method: 'get',
			headers: { 'Content-Type': 'application/json' }
		})
			//.then(data => console.log(data))
			.then((data) => data.json())
			.then((json) => json);

		//console.log(allHeroes.length)

		// //write to DB
		allHeroes = allHeroes.map((hero) => {
			return {
				...hero,
				roles: JSON.stringify(hero.roles)
			};
		});

		const heroCollection = await processHeroesInChunks(allHeroes);
	}

	return new Response(JSON.stringify({ allHeroes, dataSource }), {
		headers: {
			'cache-control': `max-age=2592000`
		}
	});
};
