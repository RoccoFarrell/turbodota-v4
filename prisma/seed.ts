import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: ['query', 'error'] });

//dayjs
import dayjs from 'dayjs';
import bigIntSupport from 'dayjs/plugin/bigIntSupport.js';
dayjs.extend(bigIntSupport);

//constants
import { playersWeCareAbout } from '../src/lib/constants/playersWeCareAbout.ts';
import winOrLoss from '../src/lib/helpers/winOrLoss.ts';

function sleep(ms: any) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateDotaUsers(){
	const DotaUserResponse = await prisma.dotaUser.createMany({
		data: [
			{ account_id: 80636612, lastUpdated: new Date() },
			{ account_id: 125251142, lastUpdated: new Date() },
			{ account_id: 67762413, lastUpdated: new Date() },
			{ account_id: 113003047, lastUpdated: new Date() },
			{ account_id: 65110965, lastUpdated: new Date() },
			{ account_id: 68024789, lastUpdated: new Date() },
			{ account_id: 423076846, lastUpdated: new Date() },
			{ account_id: 34940151, lastUpdated: new Date() }
		]
	})
}

async function main() {
	await generateDotaUsers()
	//get available heroes
	const response = await fetch(`http://localhost:5173/api/getHeroes`, {
		method: 'Get',
		headers: {
			'content-type': 'application/json'
		}
	});

	let responseData = await response.json();
	//console.log(responseData)

	console.log(`found ${responseData.allHeroes.length} heroes`);

	let allHeroes = responseData.allHeroes;
	//console.log(allHeroes[0]);

	//add randoms

	playersWeCareAbout.map(async (player) => {
		await sleep(1000);
		let allRandoms: any[] = [];
		let randomCount = Math.floor(Math.random() * 10) + 1;
		console.log(`Generating ${randomCount} randoms for ${player.playerID}`);
		while (randomCount > 0) {
			console.log(`Generating random #${randomCount}`);
			randomCount -= 1;

			let randomHero = allHeroes[Math.floor(Math.random() * allHeroes.length)];

			//find match with that hero

			const matchResult = await prisma.match.findFirst({
				where: { AND: [{ hero_id: randomHero.id }, { account_id: player.playerID }] }
			});

			//console.log(matchResult);

			let randomDays = Math.floor(Math.random() * 3);
			let randomDateStart = dayjs(Number(matchResult?.start_time) * 1000).subtract(randomDays + 1, 'days');
			let randomDateEnd = dayjs(Number(matchResult?.start_time) * 1000);

			if (matchResult) {
				let randomWin = winOrLoss(matchResult.player_slot, matchResult.radiant_win);
				console.log(`${randomWin ? 'Won ' : 'Lost '} on hero ${randomHero.localized_name}`);

				let randomObj = {
					account_id: player.playerID,
					date: randomDateStart.format(),
					availableHeroes: allHeroes.map((hero: any) => hero.id).toString(),
					bannedHeroes: [].toString(),
					selectedRoles: [].toString(),
					expectedGold: 100,
					modifierAmount: 3,
					modifierTotal: 0,
					randomedHero: randomHero.id,
					active: false,
					status: 'completed',
					win: randomWin,
					endDate: randomDateEnd.format(),
					endMatchID: matchResult.id,
					endGold: randomWin ? 100 : 0
				};
				allRandoms.push(randomObj);
			}
		}

		console.log(`${allRandoms.length} total randoms for ${player.playerID}`);

		//create randoms in table

		console.log(allRandoms[0]);

		let writeCopy = { ...allRandoms[0]}
		// delete writeCopy.account_id
		// delete writeCopy.endMatchID
		const result = await prisma.random.create({ 
			data: {
				...writeCopy,
				match: {
					connect: {id: allRandoms[0].endMatchID}
				},
				user: {
					connect: {account_id: allRandoms[0].account_id}
				}
			}
		});
		// allRandoms.map(async (random) => {
		// 	sleep(500);
		// 	console.log(`attempting insert of random ${JSON.stringify(random)}`)
		// 	const result = await prisma.random.create({ data: random });
		// 	console.log(`Insert result: ${result}`);
		// });
	});
}
main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
