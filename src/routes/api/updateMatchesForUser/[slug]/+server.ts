import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma'
import { match } from 'assert';

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
    //console.log(`params: ${JSON.stringify(params)}`)
    //console.log(params)
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

    let account_id: number = parseInt(params.slug || "0")
    console.log(`\n-----------\n[matches] account_id: ${account_id}\n-------------\n`)
    //let account_id: number = parseInt(url.searchParams.get('account_id') || "80636612")

    //check if user was updated recently, otherwise use the database
    const userResult = await prisma.dotaUser.findUnique({
        where: {
            account_id
        },
    })

    /*
     ------------Evaluate Date for OD query
    */
    let rightNow = new Date()
    let startDate = userResult?.newestMatch
    let d_diff: number | null = null
    if(startDate){ 
        console.log(`[matches][${account_id}] newest match present in query: `, startDate.toLocaleString())
        let t_diff = rightNow.getTime() - startDate.getTime()
        d_diff = Math.floor(t_diff / (1000 * 3600 * 24)) + 1;
        //console.log(`d_diff: ${d_diff}`)
    }

    let matchStats: Match[] = []
    let allowUpdates: boolean = true;

    let dataSource: string = ""
    let updateInterval = new Date()

    let od_url;
    updateInterval.setHours(rightNow.getHours() - 12);

    console.log(`[matches][${account_id}] updateInterval: ${updateInterval}`)
    if ((userResult && userResult.lastUpdated >= updateInterval)) {
        console.log(`[matches][${account_id}] user was last updated <12 hours - fetch from DB`)
        const matchesResult = await prisma.match.findMany({
            where: { account_id },
        })

        //console.log(matchesResult)
        matchStats = matchesResult
        dataSource = "db"
    } else if(allowUpdates){
        console.log(`[matches][${account_id}] allow update true, and user was last updated >12 hours - fetch from OD`)

        //query OD
        if(d_diff){
            console.log(`[matches][${account_id}] d_diff calculated, fetching matches ${d_diff} days back for ${userResult?.account_id}`)
            od_url = encodeURI(`https://api.opendota.com/api/players/${account_id}/matches?significant=0&game_mode=23&date=${d_diff}`)
        } 
        else {
            console.log(`[matches][${account_id}] no d_diff calculated, fetching matches ${d_diff} from beginning of time for ${userResult?.account_id}`)
            od_url = encodeURI(`https://api.opendota.com/api/players/${account_id}/matches?significant=0&game_mode=23`)
        }
        console.log(od_url)

        //perform fetch to OD
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

        //add account ID to all matches
        matchStats = matchStats.map(match => {
            //console.log(match.match_id, account_id, match.match_id.toString() + account_id.toString())
            return {
                ...match,
                account_id: BigInt(account_id)
            }
        })

        //sort by start time
        matchStats = matchStats.sort((a, b) => {
            if (a.start_time < b.start_time) return -1
            else return 1
        })

        dataSource = "opendota"

        //add matches to DB
        //https://github.com/prisma/prisma/discussions/19022
        const matchCollection = await prisma.$transaction(async (tx) => {
            await Promise.all(matchStats.map(((match: Match) => {
                tx.match.upsert({
                    where: {
                        matchPlusAccount: { match_id: match.match_id, account_id: match.account_id }
                    },
                    update: { ...match },
                    create: { ...match }
                })
            })))
        })

        //updated last updated on Dota User
        await prisma.dotaUser.upsert({
            where: { account_id: account_id },
            update: {
                account_id: account_id,
                lastUpdated: new Date(),
                oldestMatch: new Date(Number(matchStats[0].start_time) * 1000),
                newestMatch: new Date(Number(matchStats[matchStats.length - 1].start_time) * 1000)
            },
            create: {
                account_id: account_id,
                lastUpdated: new Date(),
                oldestMatch: new Date(Number(matchStats[0].start_time) * 1000),
                newestMatch: new Date(Number(matchStats[matchStats.length - 1].start_time) * 1000)
            }
        })
    }

    let cacheTimeoutSeconds = 3600

    setHeaders({
        "cache-control": "max-age=" + cacheTimeoutSeconds,
    });
    
    let newResponse = new Response(JSON.stringify({ dataSource: dataSource, matchData: matchStats, od_url: od_url }), {
        headers: {
            'cache-control': `max-age=${cacheTimeoutSeconds}`
        }
    })
    return newResponse
};