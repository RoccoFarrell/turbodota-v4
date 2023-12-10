import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { match } from 'assert';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

async function writeRecordsChunked(partialArr: Match[], account_id: number) {
	let result_match;
	const result_tx = await prisma.$transaction(
		async (tx) => {
			try {
				result_match = await Promise.all(
					partialArr.map(async (match: Match) => {
						await tx.match.upsert({
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

				console.log(`result_match: ${result_match}`);
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

	let account_id: number = parseInt(params.slug || '0');
	console.log(`\n-----------\n[matches] account_id: ${account_id}\n-------------\n`);
	//let account_id: number = parseInt(url.searchParams.get('account_id') || "80636612")

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
	let startDate = userResult?.newestMatch;
	let d_diff: number | null = null;
	if (startDate) {
		console.log(`[matches][${account_id}] newest match present in query: `, startDate.toLocaleString());
		let t_diff = rightNow.getTime() - startDate.getTime();
		d_diff = Math.floor(t_diff / (1000 * 3600 * 24)) + 1;
		//console.log(`d_diff: ${d_diff}`)
	}

	let matchStats: Match[] = [];
	let allowUpdates: boolean = true;
	let forceFullUpdate: boolean = false;

	let dataSource: string = '';
	let updateInterval = new Date();

	let od_url;
	updateInterval.setHours(rightNow.getHours() - 12);

	console.log(`[matches][${account_id}] updateInterval: ${updateInterval}`);
	if (userResult && userResult.lastUpdated >= updateInterval && !forceFullUpdate) {
		console.log(`[matches][${account_id}] user was last updated <12 hours - fetch from DB`);
		const matchesResult = await prisma.match.findMany({
			where: { account_id }
		});

        console.log(`[matches][${account_id}] ${matchStats.length} matches returned from Database`);
		//console.log(matchesResult)
		matchStats = matchesResult;
		dataSource = 'db';
	} else if (allowUpdates) {
		console.log(`[matches][${account_id}] allow update true, and user was last updated >12 hours - fetch from OD`);

		//query OD
		if (d_diff && !forceFullUpdate) {
			console.log(`[matches][${account_id}] d_diff calculated, fetching matches ${d_diff} days back for ${userResult?.account_id}`);
			od_url = encodeURI(`https://api.opendota.com/api/players/${account_id}/matches?significant=0&game_mode=23&date=${d_diff}`);
		} else {
			console.log(`[matches][${account_id}] no d_diff calculated, fetching matches ${d_diff} from beginning of time for ${userResult?.account_id}`);
			od_url = encodeURI(`https://api.opendota.com/api/players/${account_id}/matches?significant=0&game_mode=23`);
		}
		console.log(od_url);

		//perform fetch to OD
		matchStats = await fetch(od_url, {
			method: 'get',
			headers: { 'Content-Type': 'application/json' }
		})
			//.then(data => console.log(data))
			.then((data) => data.json())
			.then((json) => {
				//console.log('search results: ', json)
				return json;
			});

        console.log(`[matches][${account_id}] ${matchStats.length} matches returned from OpenDota`);
		//add account ID to all matches
		matchStats = matchStats.map((match) => {
			//console.log(match.match_id, account_id, match.match_id.toString() + account_id.toString())
			return {
				...match,
				account_id: BigInt(account_id)
			};
		});

		//sort by start time
		matchStats = matchStats.sort((a, b) => {
			if (a.start_time < b.start_time) return -1;
			else return 1;
		});

		dataSource = 'opendota';

		//add matches to DB
		//https://github.com/prisma/prisma/discussions/19022

		console.log(`[matches][${account_id}] - trying to insert ${matchStats.length} match records`);

		let txRecordCount = matchStats.length;
		let txBlockSize = 1000;
		let loopCount = 0;
		let chunkInsertFail = false;

		while (txRecordCount > 0 && loopCount < 10) {
			if (txRecordCount - txBlockSize > 0) {
				let partialMatchArr = matchStats.slice(txRecordCount - txBlockSize, txRecordCount - 1);

				console.log(`[matches][${account_id}] - too many records, chunked insert with block size ${txBlockSize}`);
				console.log(`[matches][${account_id}] - from index ${txRecordCount - txBlockSize} to ${txRecordCount - 1}`);

				let { match, tx } = await writeRecordsChunked(partialMatchArr, account_id);

				if (!match) chunkInsertFail = true;
				console.log(`tx results: ${match} | ${tx}`);
				txRecordCount = txRecordCount - txBlockSize;
			} else {
				let partialMatchArr = matchStats.slice(0, txRecordCount - 1);
				console.log(`[matches][${account_id}] - too many records, chunked insert with block size ${txBlockSize}`);
				console.log(`[matches][${account_id}] - final insert from index 0 to ${txRecordCount - 1}`);

				let { match, tx } = await writeRecordsChunked(partialMatchArr, account_id);

				if (!match) chunkInsertFail = true;
				console.log(`tx results: ${match} | ${tx}`);
				txRecordCount = 0;
			}

			console.log('loop count: '), loopCount;
			loopCount++;
		}

		//updated last updated on Dota User
		if (!chunkInsertFail) {
			let result_dotaUser = await prisma.dotaUser.upsert({
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
			});
			console.log(`result_dotaUser: ${JSON.stringify(result_dotaUser)}`);
		}
	}

	//after updates, if d_diff, query entire DB for full time range + matches added from the d_diff
	console.log(`[matches][${account_id}] fetching full history after addition of d_diff matches - fetch from DB`);
	const matchesResult = await prisma.match.findMany({
		where: { account_id }
	});

    console.log(`[matches][${account_id}] ${matchStats.length} matches returned from Database`);
	//console.log(matchesResult)
	matchStats = matchesResult;
	dataSource = 'db';

	let cacheTimeoutSeconds = 3600;

	setHeaders({
		'cache-control': 'max-age=' + cacheTimeoutSeconds
	});

	let newResponse = new Response(JSON.stringify({ dataSource: dataSource, matchData: matchStats, od_url: od_url }), {
		headers: {
			'cache-control': `max-age=${cacheTimeoutSeconds}`
		}
	});
	return newResponse;
};
