import type { LayoutServerLoad } from './$types'
import { fail, redirect, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { League } from '@prisma/client';


export const load: LayoutServerLoad = async ({ locals, url, parent, params  }) => {
	const parentData = await parent();

    //console.log(`URL LINE 10 LEAGUES SLUG LAYOUT SERVER: `, url)

    let leagueID = url.pathname.split("/")[2]

    //console.log(`LEAGUE ID LINE 14 LEAGUES SLUG LAYOUT SERVER`, leagueID)
    let selectedLeague: any = parentData.leagues.filter(league => league.id === parseInt(leagueID))[0] || null

    return {...parentData, selectedLeague}
}