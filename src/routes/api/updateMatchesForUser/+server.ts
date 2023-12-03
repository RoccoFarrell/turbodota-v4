import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma'

export const GET: RequestHandler = async ({ params, url }) => {
    console.log(url)
    console.log(`[api] - received GET to ${url.href}`)
    console.log(`params: ${JSON.stringify(params)}`)
    const playersWeCareAbout = [
        { playerID: 113003047, playerName: 'Danny' },
        //{ playerID: 123794823, playerName: 'Steven' },
        { playerID: 125251142, playerName: 'Matt' },
        { playerID: 34940151, playerName: 'Roberts' },
        { playerID: 423076846, playerName: 'Chris' },
        { playerID: 65110965, playerName: 'Rocco' },
        { playerID: 67762413, playerName: 'Walker' },
        { playerID: 68024789, playerName: 'Ben' },
        { playerID: 80636612, playerName: 'Martin' }
        //{ playerID: 214308966, playerName: 'Andy' }
    ];

    let account_id: number = parseInt(url.searchParams.get('account_id') || "80636612")
    let startDate = new Date("2023/11/01")
    console.log('[matches] start date present in query, fetching matches after ', startDate.toLocaleString())
    let rightNow = new Date()

    let t_diff = rightNow.getTime() - startDate.getTime()

    let d_diff = Math.floor(t_diff / (1000 * 3600 * 24)) + 1;


    let matchStats: Match[] = await fetch(encodeURI(`https://api.opendota.com/api/players/${account_id}/matches?significant=0&game_mode=23&date=${d_diff}`), {
    	method: 'get',
    	headers: { 'Content-Type': 'application/json' },
    })
    	//.then(data => console.log(data))
    	.then(data => data.json())
    	.then((json) => {
    		//console.log('search results: ', json)
    		return (json)
    	});

    // //write to DB
    
    console.log(`accountid: ${account_id}`)


    //need to properly query for combination of match id and account id 
    //https://github.com/prisma/prisma/discussions/19022
    matchStats = matchStats.map(match => {
        console.log(match.match_id, account_id, match.match_id.toString() + account_id.toString())
    	return {
    		...match,
            id: parseInt(match.match_id.toString() + account_id.toString()),
    		account_id
    	}
    })

    //commented  out before i can fix
    // matchStats.forEach(async (match: Match) => {
    //     console.log(match, match.match_id, match.account_id)
    //     let uniqueId = match.match_id + match.account_id
    //     await prisma.match.upsert({
    //         where: { id: uniqueId },
    //         update: { ...match },
    //         create: { ...match }
    //     })
    // })

    // await prisma.match.createMany({
    // 	data: matchStats
    // })

    return new Response(JSON.stringify(matchStats))
};