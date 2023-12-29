import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma'
import type { FriendshipMMR } from '@prisma/client';
import type { League } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

export const GET: RequestHandler = async ({ params, url }) => {
    console.log(url)
    console.log(`[api] - received GET to ${url.href}`)
    console.log(`params: ${JSON.stringify(params)}`)

    let dataSource: string = ""

    let mmr: FriendshipMMR[] = []

    console.log('fetch from DB')
    const mmrResult = await prisma.friendshipMMR.findMany({
        include: {
            match: true,
            dota_user: {
                include: {
                    user: true
                }
            }
        }
    })

    let returnMMRData: any = {}
    mmrResult.forEach(mmrItem => {
        if(!returnMMRData[mmrItem.account_id.toString()]) {
            returnMMRData[mmrItem.account_id] = []
            returnMMRData[mmrItem.account_id].push(mmrItem)  
        } else {
            returnMMRData[mmrItem.account_id].push(mmrItem)  
        }
    })

    //console.log(matchesResult)
    mmr = mmrResult
    dataSource = "db"

    return new Response(JSON.stringify({ returnMMRData, dataSource }))
};