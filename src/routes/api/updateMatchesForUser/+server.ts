import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number { return this.toString(); };

export const config = {
    isr: {
        expiration: 600,
        bypassToken: 'fbybpmuenv4foogdrax2ab2u863gxtqa4p15or78',
    },
};

export const GET: RequestHandler = async ({ params, url, setHeaders }) => {
    // console.log(url)
    // console.log(`[api] - received GET to ${url.href}`)
    // console.log(`params: ${JSON.stringify(params)}`)
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

    //check if user was updated recently, otherwise use the database
    const result = await prisma.dotaUser.findUnique({
        where: {
            account_id
        },
    })

    let matchStats: Match[] = []
    let forceUpdate: boolean = false;

    let dataSource: string = ""
    let updateInterval = new Date()

    let od_url;
    updateInterval.setHours(rightNow.getHours() - 12);
    if (!forceUpdate && (result && result.lastUpdated >= updateInterval)) {
        console.log('fetch from DB')
        const matchesResult = await prisma.match.findMany({
            where: { account_id },
        })

        //console.log(matchesResult)
        matchStats = matchesResult
        dataSource = "db"
    } else {
        console.log('fetch from OD')

        //query OD
        od_url = encodeURI(`https://api.opendota.com/api/players/${account_id}/matches?significant=0&game_mode=23&date=${d_diff}`)
        //od_url = encodeURI(`https://api.opendota.com/api/players/${account_id}/matches?significant=0&game_mode=23`)
        console.log(od_url)
        matchStats = await fetch(od_url, {
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
        })
            //.then(data => console.log(data))
            .then(data => data.json())
            .then((json) => {
                //console.log('search results: ', json)
                return (json)
            });

        //write to DB
        matchStats = matchStats.map(match => {
            //console.log(match.match_id, account_id, match.match_id.toString() + account_id.toString())
            return {
                ...match,
                account_id: BigInt(account_id)
            }
        })

        dataSource = "opendota"

        //add matches to DB
        //https://github.com/prisma/prisma/discussions/19022
        matchStats.forEach(async (match: Match) => {
            await prisma.match.upsert({
                where: {
                    matchPlusAccount: { match_id: match.match_id, account_id: match.account_id }
                },
                update: { ...match },
                create: { ...match }
            })
        })

        //updated last updated on Dota User
        await prisma.dotaUser.upsert({
            where: { account_id: account_id },
            update: {
                account_id: account_id,
                lastUpdated: new Date()
            },
            create: {
                account_id: account_id,
                lastUpdated: new Date()
            }
        })
    }

    setHeaders({
        "cache-control": "max-age=3600",
    });

    let cacheTimeoutSeconds = 3600
    let newResponse = new Response(JSON.stringify({ dataSource: dataSource, matchData: matchStats, od_url: od_url }), {
        headers: {
            'cache-control': `max-age=${cacheTimeoutSeconds}`
        }
    })
    return newResponse
};