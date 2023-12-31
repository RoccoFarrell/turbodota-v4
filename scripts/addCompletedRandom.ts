import prisma from '$lib/server/prisma'
import dayjs from 'dayjs'

let randomHeroId = 65
let fakeAccountID = 65110965

const latestMatchResult = await prisma.match.findFirst({
    orderBy: {
        match_id: 'desc'
    }
})

console.log(latestMatchResult)

let fakeMatch = {
    "match_id": parseInt("999999" + Math.floor(Math.random() * 9999)),
    "account_id": fakeAccountID,
    "player_slot": 2,
    "radiant_win": true,
    "game_mode": 23,
    "hero_id": randomHeroId,
    "start_time": dayjs().unix(),
    "duration": 1323,
    "lobby_type": 0,
    "version": null,
    "kills": 20,
    "deaths": 0,
    "assists": 20,
    "skill": null,
    "average_rank": 35,
    "leaver_status": 0,
    "party_size": null
    }

const matchInsertResult = await prisma.match.upsert({
    where: {
        matchPlusAccount: { match_id: fakeMatch.match_id, account_id: fakeMatch.account_id }
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Unreachable code error
    update: { ...fakeMatch },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Unreachable code error
    create: { ...fakeMatch }
})

console.log(`[matchInsertResult]: ${matchInsertResult}`)