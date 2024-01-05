import prisma from '$lib/server/prisma'
import type { Match } from '@prisma/client'

export const createDotaUser = async (account_id: number) => {
    let createDUResult = await prisma.dotaUser.upsert({
        where: { account_id},
        create: {
            account_id,
            lastUpdated: new Date()
        }, 
        update: {
            account_id,
            lastUpdated: new Date()
        }
    })

    return createDUResult
}

export async function writeRecordsChunked(partialArr: Match[], account_id: number) {
	let result_match;
	let returnObj = {
		error: true,
		message: ""
	}
	const result_tx = await prisma.$transaction(
		async (tx) => {
			try {
				result_match = await Promise.all(
					partialArr.map(async (match: Match) => {
						return await tx.match.upsert({
							where: {
								matchPlusAccount: { match_id: match.match_id, account_id: match.account_id }
							},
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore: Unreachable code error
							update: { ...match },
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore: Unreachable code error
							create: { ...match }
						});
					})
				);

				console.log(`[helpers/writeRecordsChunked] - result_match length: ${result_match.length}`);

				if(result_match.length !== partialArr.length){
					returnObj.error = true
					returnObj.message = "[writeRecordsChunked] could not insert all the matches"
				} else {
					returnObj.error = false;
					returnObj.message = `[writeRecordsChunked] Successfully inserted ${result_match.length} matches starting with ${partialArr[0].match_id} and ending with ${partialArr[partialArr.length - 1].match_id}`
				}
			} catch (e) {
				console.error(e);
			}
		},
		{
			maxWait: 10000, // default: 2000
			timeout: 20000 // default: 5000
		}
	);

	return { match: result_match, tx: result_tx };
}

