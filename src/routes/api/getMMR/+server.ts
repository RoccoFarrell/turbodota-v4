import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma'
import type { FriendshipMMR } from '@prisma/client';
import type { League } from '@prisma/client';

export const GET: RequestHandler = async ({ params, url }) => {
    console.log(url)
    console.log(`[api] - received GET to ${url.href}`)
    console.log(`params: ${JSON.stringify(params)}`)

    let dataSource: string = ""

    let mmr: FriendshipMMR[] = []
    let players: League[] = []

    console.log('fetch from DB')
    const mmrResult = await prisma.friendshipMMR.findMany()
    const playerList = await prisma.league.findMany()

    //console.log(matchesResult)
    mmr = mmrResult
    players = playerList
    dataSource = "db"

    return new Response(JSON.stringify({ mmr, players, dataSource }))
};