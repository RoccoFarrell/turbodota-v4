import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
const prisma = new PrismaClient();

import { playersWeCareAbout } from '../src/lib/constants/playersWeCareAbout.ts';

function sleep(ms: any) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
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

    let allHeroes = responseData.allHeroes

	//add randoms
	playersWeCareAbout.forEach(async player => {
        await sleep(500)
		let randomCount = Math.floor(Math.random() * 10) + 1;
        console.log(`Inserting ${randomCount} randoms for ${player.playerID}`)
		while (randomCount > 0) {
            await sleep(500)
            console.log(`Inserting ${randomCount} random`)
			randomCount -= 1;

            let randomHero = allHeroes[Math.floor(Math.random() * allHeroes.length)]
            let randomDays = Math.floor(Math.random() * 7)
            let randomDateStart = dayjs().subtract(randomDays +1, 'days')
            let randomDateEnd = dayjs().subtract(randomDays, 'days')
            let randomWin = Math.floor(Math.random() * 2) === 0 ? false : true

            console.log(`${randomWin ? "Won " : "Lost "} on hero ${randomHero.localized_name}`)

            
			const randomResults = await prisma.random.create({
				data: {
					account_id: player.playerID,
					date: randomDateStart.toDate(),
					availableHeroes: allHeroes.map((hero: any) => hero.id),
					bannedHeroes: [].toString(),
					selectedRoles: [].toString(),
					expectedGold: 100,
					modifierAmount: 3,
					modifierTotal: 0,
					randomedHero: randomHero.hero_id,
					active: false,
					status: 'completed',
					win: randomWin,
					endDate: randomDateEnd.toDate(),
					endMatchID: 123456789,
					endGold: randomWin
						? 100
						: 0
				}
			});
		}
	})
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
