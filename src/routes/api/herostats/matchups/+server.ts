import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import prisma from '$lib/server/prisma';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	console.log(`-----------\n[api/herostats/matchups] - received GET to ${url.href}\n-----------`);

	try {
		// Check if a specific hero ID is requested via query parameter
		const heroIdParam = url.searchParams.get('heroId');
		const heroIdsParam = url.searchParams.get('heroIds');

		let heroIds: number[] = [];

		if (heroIdParam) {
			// Query single hero
			heroIds = [parseInt(heroIdParam)];
		} else if (heroIdsParam) {
			// Query specific hero IDs (comma-separated)
			heroIds = heroIdsParam.split(',').map((id) => parseInt(id.trim())).filter((id) => !isNaN(id));
		} else {
			// Get all heroes from database
			const allHeroes = await prisma.hero.findMany({
				select: { id: true },
				orderBy: { id: 'asc' }
			});
			heroIds = allHeroes.map((hero) => hero.id);
		}

		console.log(`[api/herostats/matchups] Querying matchups for ${heroIds.length} heroes`);

		// Query Stratz GraphQL API for matchups
		// The matchUp query returns matchups WITH and VS other heroes for each hero queried
		const query = `
			query GetHeroMatchups($heroIds: [Short!]) {
				heroStats {
					matchUp(heroIds: $heroIds) {
						heroId
						matchCountWith
						matchCountVs
						with {
							heroId1
							heroId2
							matchCount
							winCount
							winRateHeroId1
							winRateHeroId2
							synergy
							kills
							deaths
							assists
							networth
							duration
							firstBloodTime
							cs
							dn
							goldEarned
							xp
							heroDamage
							towerDamage
							heroHealing
							level
							winsAverage
						}
						vs {
							heroId1
							heroId2
							matchCount
							winCount
							winRateHeroId1
							winRateHeroId2
							synergy
							kills
							deaths
							assists
							networth
							duration
							firstBloodTime
							cs
							dn
							goldEarned
							xp
							heroDamage
							towerDamage
							heroHealing
							level
							winsAverage
						}
					}
				}
			}
		`;

		const stratz_response = await fetch('https://api.stratz.com/graphql', {
			method: 'POST',
			headers: new Headers({
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env.STRATZ_TOKEN}`
			}),
			body: JSON.stringify({
				query,
				variables: {
					heroIds: heroIds
				}
			})
		});

		if (!stratz_response.ok) {
			throw new Error(`Stratz API error: ${stratz_response.status} ${stratz_response.statusText}`);
		}

		const stratz_data = await stratz_response.json();

		if (stratz_data.errors) {
			console.error('[api/herostats/matchups] GraphQL errors:', stratz_data.errors);
			throw new Error(`GraphQL errors: ${JSON.stringify(stratz_data.errors)}`);
		}

		// Set cache headers
		setHeaders({
			'cache-control': 'max-age=3600', // Cache for 1 hour
			'x-ratelimit-remaining-minute': stratz_response.headers.get('x-ratelimit-remaining-minute') || '-1',
			'x-ratelimit-remaining-hour': stratz_response.headers.get('x-ratelimit-remaining-hour') || '-1',
			'x-ratelimit-remaining-day': stratz_response.headers.get('x-ratelimit-remaining-day') || '-1'
		});

		return new Response(
			JSON.stringify({
				status: 'success',
				data: stratz_data.data,
				heroCount: heroIds.length,
				queriedHeroIds: heroIds
			}),
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	} catch (error) {
		console.error('[api/herostats/matchups] Error:', error);
		return new Response(
			JSON.stringify({
				status: 'error',
				message: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	}
};
