import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import dayjs from 'dayjs';
import {
	INITIAL_FETCH_DAYS,
	MATCH_CUTOFF_START_TIME,
	RECENT_MATCH_DAYS
} from '$lib/constants/matches';

/** OpenDota may cap results per request; we paginate to get all matches in the date window. */
const OPENDOTA_MATCHES_PAGE_SIZE = 500;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

async function writeRecordsChunked(partialArr: Match[], account_id: number) {
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

				console.log(`result_match length: ${result_match.length}`);

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
			maxWait: 20000, // default: 2000
			timeout: 30000 // default: 5000
		}
	);

	return { match: result_match, tx: result_tx };
}

export const GET: RequestHandler = async ({ params, url, setHeaders }) => {
	let account_id: number = parseInt(params.slug || '0');
	console.log(`\n-----------\n[matches] account_id: ${account_id}\n-------------\n`);
	//let account_id: number = parseInt(url.searchParams.get('account_id') || "80636612")


	let forceSource: string = url.searchParams.get('source') || '';
	const forceFullRefresh = url.searchParams.get('full') === '1';

	//check if user was updated recently, otherwise use the database
	const userResult = await prisma.dotaUser.findUnique({
		where: {
			account_id
		}
	});

	/*
     ------------Evaluate Date for OD query
    */
	let rightNow = new Date();
	let createdDate = userResult?.createdDate
	let d_diff_created: number | null = null
	if(createdDate){
		let date1 = dayjs(createdDate)
		d_diff_created = Math.ceil(dayjs().diff(date1, 'day', true))
	}


	let startDate = userResult?.newestMatch;
	let d_diff: number | null = null;
	if (startDate) {
		console.log(`[matches][${account_id}] newest match present in query: `, startDate.toLocaleString());
		let t_diff = rightNow.getTime() - startDate.getTime();
		d_diff = Math.floor(t_diff / (1000 * 3600 * 24)) + 1;
		//console.log(`d_diff: ${d_diff}`)
	}

	type ODError = {
		error: boolean,
		source?: string,
		url?: string,
		code?: number
	}

	let matchStats: Match[] = [];
	let allowUpdates: boolean = true;
	let forceFullUpdate: boolean = forceFullRefresh;

	let dataSource: string = '';
	let updateInterval = new Date();

	let od_url: string = "";
	let timeoutInterval: number = 1
	updateInterval.setMinutes(rightNow.getMinutes() - timeoutInterval);

	//console.log(`[matches][${account_id}] updateInterval: ${updateInterval}`);
	if ((userResult && userResult.lastUpdated >= updateInterval && !forceFullUpdate) || forceSource === "db") {
		if(forceSource === "db") console.log(`[updateMatchesForUser] FORCING source "db"`)
		console.log(`[matches][${account_id}] user was last updated <${timeoutInterval} minutes - fetch from DB`);
		const matchesResult = await prisma.match.findMany({
			where: {
				account_id,
				start_time: { gte: MATCH_CUTOFF_START_TIME }
			}
		});

		console.log(`[matches][${account_id}] ${matchesResult.length} matches returned from Database`);
		//console.log(matchesResult)
		matchStats = matchesResult;
		dataSource = 'db';
	} else if (userResult && allowUpdates) {
		console.log(`[matches][${account_id}] allow update true, and user was last updated >${timeoutInterval} minutes - fetch from OD`);

		// Cap date at days since 2026-01-01 so we never request matches older than the site-wide cutoff
		const cutoffDate = new Date('2026-01-01T00:00:00Z');
		const daysSinceCutoff = Math.max(
			0,
			Math.ceil((rightNow.getTime() - cutoffDate.getTime()) / (1000 * 3600 * 24))
		);

		// Query OpenDota: use full 30-day window when full=1 or initial backfill; otherwise incremental (d_diff) days.
		let dateParam: number;
		if (forceFullUpdate) {
			dateParam = Math.min(RECENT_MATCH_DAYS, daysSinceCutoff);
			console.log(
				`[matches][${account_id}] full refresh requested, fetching matches ${dateParam} days back for ${userResult?.account_id}`
			);
		} else if (d_diff != null) {
			dateParam = Math.min(d_diff, daysSinceCutoff);
			console.log(
				`[matches][${account_id}] d_diff calculated, fetching matches ${dateParam} days back (capped by cutoff) for ${userResult?.account_id}`
			);
		} else {
			// No newestMatch: initial backfill. Use at least INITIAL_FETCH_DAYS so we don't only get 0–1 day when the row was just created.
			const daysForBackfill = Math.max(d_diff_created ?? 0, INITIAL_FETCH_DAYS);
			dateParam = Math.min(daysForBackfill, daysSinceCutoff);
			console.log(
				`[matches][${account_id}] no d_diff calculated (initial backfill), fetching matches ${dateParam} days back (capped by cutoff) for ${userResult?.account_id}`
			);
		}

		let odError: ODError = {
			error: false
		};

		// Paginate OpenDota requests so we get all matches in the date window (API may cap per-request results).
		const baseUrl = `https://api.opendota.com/api/players/${account_id}/matches?significant=0&date=${dateParam}`;
		let offset = 0;
		let page: Match[] = [];
		do {
			if (offset > 0) await new Promise((r) => setTimeout(r, 400));
			od_url = encodeURI(`${baseUrl}&limit=${OPENDOTA_MATCHES_PAGE_SIZE}&offset=${offset}`);
			page = await fetch(od_url, {
				method: 'get',
				headers: { 'Content-Type': 'application/json' }
			})
				.then((response) => {
					if (response.headers.get('x-rate-limit-remaining-minute'))
						console.log(
							`[updateMatchesForUser] RATE LIMIT- Open Dota Minutes: ${response.headers.get('x-rate-limit-remaining-minute')}`
						);
					if (response.headers.get('x-rate-limit-remaining-month'))
						console.log(
							`[updateMatchesForUser] RATE LIMIT- Open Dota Month: ${response.headers.get('x-rate-limit-remaining-month')}`
						);
					if (response.status === 200) return response.json();
					odError = {
						error: true,
						source: 'opendota',
						url: od_url,
						code: response.status
					};
					return [];
				})
				.catch((e: unknown) => {
					console.error(e);
					return [];
				});
			if (odError.error) return new Response(JSON.stringify({ ...odError }));
			matchStats = matchStats.concat(page);
			offset += OPENDOTA_MATCHES_PAGE_SIZE;
		} while (page.length === OPENDOTA_MATCHES_PAGE_SIZE);

		console.log(`[matches][${account_id}] ${matchStats.length} matches returned from OpenDota`);
		//add account ID to all matches
		matchStats = matchStats.map((match) => {
			//console.log(match.match_id, account_id, match.match_id.toString() + account_id.toString())
			return {
				...match,
				account_id: account_id
			};
		});

		//filter abandons
		matchStats = matchStats.filter(match => match.radiant_win !== null);

		// site-wide cutoff: do not store or return matches before 2026-01-01
		const cutoff = Number(MATCH_CUTOFF_START_TIME);
		matchStats = matchStats.filter((match) => {
			const t =
				typeof match.start_time === 'bigint'
					? Number(match.start_time)
					: match.start_time instanceof Date
						? Math.floor(match.start_time.getTime() / 1000)
						: Number(match.start_time);
			return t >= cutoff;
		});

		//sort by start time
		matchStats = matchStats.sort((a, b) => {
			if (a.start_time <= b.start_time) return -1;
			else return 1;
		});

		dataSource = 'opendota';

		//add matches to DB
		//https://github.com/prisma/prisma/discussions/19022

		console.log(`[matches][${account_id}] - trying to insert ${matchStats.length} match records`);

		let txRecordCount = matchStats.length;
		let txBlockSize = 100;
		let loopCount = 0;
		let chunkInsertFail = false;

		while (txRecordCount > 0 && loopCount < 10) {
			if (txRecordCount - txBlockSize > 0) {
				let partialMatchArr = matchStats.slice(txRecordCount - txBlockSize, txRecordCount);

				//console.log(`[matches][${account_id}] - too many records, chunked insert with block size ${txBlockSize}`);
				//console.log(`[matches][${account_id}] - from index ${txRecordCount - txBlockSize} to ${txRecordCount}`);

				let { match, tx } = await writeRecordsChunked(partialMatchArr, account_id);

				if (!match) chunkInsertFail = true;
				//console.log(`tx results: ${match} | ${tx}`);
				txRecordCount = txRecordCount - txBlockSize;
			} else {
				let partialMatchArr = matchStats.slice(0, txRecordCount);
				//console.log(`[matches][${account_id}] - too many records, chunked insert with block size ${txRecordCount}`);
				//console.log(`[matches][${account_id}] - final insert from index 0 to ${txRecordCount}`);

				let { match, tx } = await writeRecordsChunked(partialMatchArr, account_id);

				if (!match) chunkInsertFail = true;
				//console.log(`tx results: ${match} | ${tx}`);
				txRecordCount = 0;
			}

			//console.log('loop count: ', loopCount);
			loopCount++;
		}

		//updated last updated on Dota User
		if (!chunkInsertFail) {
			if(matchStats.length > 0){
				console.log(`[updateMatchesForUser][${account_id}] - updating Dota User`)
				let result_dotaUser = await prisma.dotaUser.upsert({
					where: { account_id: account_id },
					update: {
						account_id: account_id,
						lastUpdated: new Date(),
						newestMatch: new Date(Number(matchStats[matchStats.length - 1].start_time) * 1000),
						newestMatchID: matchStats[matchStats.length - 1].match_id
					},
					create: {
						account_id: account_id,
						lastUpdated: new Date(),
						oldestMatch: new Date(Number(matchStats[0].start_time) * 1000),
						oldestMatchID: matchStats[0].match_id,
						newestMatch: new Date(Number(matchStats[matchStats.length - 1].start_time) * 1000),
						newestMatchID: matchStats[matchStats.length - 1].match_id
					}
				});
				console.log(`result_dotaUser: ${JSON.stringify(result_dotaUser)}`);
			} else {
				console.log(`[updateMatchesForUser][${account_id}] - updating Dota User`)
				let result_dotaUser = await prisma.dotaUser.upsert({
					where: { account_id: account_id },
					update: {
						account_id: account_id,
						lastUpdated: new Date()
					},
					create: {
						account_id: account_id,
						lastUpdated: new Date()
					}
				});
				console.log(`result_dotaUser: ${JSON.stringify(result_dotaUser)}`);
			}

		}

		//after updates, if d_diff, query entire DB for full time range + matches added from the d_diff
		console.log(`[matches][${account_id}] fetching full history after addition of d_diff matches - fetch from DB`);
		const matchesResult = await prisma.match.findMany({
			where: {
				account_id,
				start_time: { gte: MATCH_CUTOFF_START_TIME }
			}
		});

		console.log(`[matches][${account_id}] ${matchStats.length} matches returned from OpenDota`);
		console.log(`[matches][${account_id}] ${matchesResult.length} matches returned from Database`);
		//if(matchStats.filter(match => match.id === 7482782346).length > 0) console.log('found 7482782346 in Open Dota')
		//if(matchesResult.filter(match => match.id === 7482782346).length > 0) console.log('found 7482782346 in matches result')
		matchStats = matchesResult;
		dataSource = 'db';
	}

	//sort match stats by match_id before return
	matchStats = matchStats.sort((a: any, b: any) => {
		if(parseInt(a.match_id) < parseInt(b.match_id)) return 1
		else return -1
	})

	/* 
		used to force update in dotaUser table
	*/
	// let result_dotaUser = await prisma.dotaUser.upsert({
	// 	where: { account_id: account_id },
	// 	update: {
	// 		account_id: account_id,
	// 		lastUpdated: new Date(),
	// 		newestMatch: new Date(Number(matchStats[0].start_time) * 1000),
	// 		newestMatchID: matchStats[0].match_id,
	// 		oldestMatch: new Date(Number(matchStats[matchStats.length - 1].start_time) * 1000),
	// 		oldestMatchID: matchStats[matchStats.length - 1].match_id
	// 	},
	// 	create: {
	// 		account_id: account_id,
	// 		lastUpdated: new Date(),
	// 		oldestMatch: new Date(Number(matchStats[0].start_time) * 1000),
	// 		oldestMatchID: matchStats[0].match_id,
	// 		newestMatch: new Date(Number(matchStats[matchStats.length - 1].start_time) * 1000),
	// 		newestMatchID: matchStats[matchStats.length - 1].match_id
	// 	}
	// });

	let cacheTimeoutSeconds = 3600;

	setHeaders({
		'cache-control': 'max-age=' + cacheTimeoutSeconds
	});

	let newResponse = new Response(JSON.stringify({ account_id, dataSource: dataSource, matchData: matchStats, od_url: od_url }), {
		headers: {
			'cache-control': `max-age=${cacheTimeoutSeconds}`
		}
	});
	return newResponse;
};
