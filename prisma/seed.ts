import { PrismaClient } from '@prisma/client';
import { EffectType, StatType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	const cards = [
		{
			name: "Kill Kill Kill",
			cost: 3,
			baseFormula: "x3",
			effectType: EffectType.STAT_MULTIPLIER,
			statType: StatType.KILLS,
			description: "Multiplies kill stat multiplier by 3",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: false,
			isDurationBased: false,
			isStackable: false
		},
		{
			name: "Touch, Don't Kill",
			cost: 3,
			baseFormula: "x3",
			effectType: EffectType.STAT_MULTIPLIER,
			statType: StatType.ASSISTS,
			description: "Multiplies assist stat multiplier by 3",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: false,
			isDurationBased: false,
			isStackable: false
		},
		{
			name: "Line Goes Up",
			cost: 3,
			baseFormula: "x3",
			effectType: EffectType.STAT_MULTIPLIER,
			statType: StatType.NET_WORTH,
			description: "Multiplies net worth stat multiplier by 3",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: false,
			isDurationBased: false,
			isStackable: false
		},
		{
			name: "Stop Taking My Last Hits",
			cost: 3,
			baseFormula: "x3",
			effectType: EffectType.STAT_MULTIPLIER,
			statType: StatType.LAST_HITS,
			description: "Multiplies last hit stat multiplier by 3",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: false,
			isDurationBased: false,
			isStackable: false
		},
		{
			name: "Denied",
			cost: 3,
			baseFormula: "x3",
			effectType: EffectType.STAT_MULTIPLIER,
			statType: StatType.DENIES,
			description: "Multiplies denies stat multiplier by 3",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: false,
			isDurationBased: false,
			isStackable: false
		},
		{
			name: "Zeus Spammer",
			cost: 3,
			baseFormula: "x3",
			effectType: EffectType.STAT_MULTIPLIER,
			statType: StatType.DAMAGE,
			description: "Multiplies damage stat multiplier by 3",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: false,
			isDurationBased: false,
			isStackable: false
		},
		{
			name: "I Need Healing",
			cost: 3,
			baseFormula: "x3",
			effectType: EffectType.STAT_MULTIPLIER,
			statType: StatType.HEALING,
			description: "Multiplies healing stat multiplier by 3",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: false,
			isDurationBased: false,
			isStackable: false
		},
		{
			name: "Ben AFK Splitpush",
			cost: 3,
			baseFormula: "x3",
			effectType: EffectType.STAT_MULTIPLIER,
			statType: StatType.BUILDING,
			description: "Multiplies building stat multiplier by 3",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: false,
			isDurationBased: false,
			isStackable: false
		},
		{
			name: "4/10",
			cost: 4,
			baseFormula: "+1",
			effectType: EffectType.STAT_ADDER,
			statType: StatType.SUPPORT,
			description: "Adds 1 to the support multiplier",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: false,
			isDurationBased: false,
			isStackable: false
		},
		{
			name: "Just End",
			cost: 5,
			baseFormula: "x3 - (.1 * 20-gamelength(minutes))",
			effectType: EffectType.SCORE_MULTIPLIER,
			statType: StatType.SCORE,
			description: "3X mult if game is under 20 minutes, -.1X mult for every minute over, minimum of x1",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: false,
			isDurationBased: false,
			isStackable: false
		},
		{
			name: "All I Do Is Win",
			cost: 5,
			baseFormula: "x2 + (.1 * # of wins)",
			effectType: EffectType.SCORE_MULTIPLIER,
			statType: StatType.SCORE,
			description: "Adds 0.1 to base 2x score per win while having the card active",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: false,
			isDurationBased: false,
			isStackable: true
		},
		{
			name: "Playstreak",
			cost: 3,
			baseFormula: "x3 + (.2 * days played in a row)",
			effectType: EffectType.SCORE_MULTIPLIER,
			statType: StatType.SCORE,
			description: "Multiplies score by 3 + 0.2* days with a game played in a row",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: false,
			isDurationBased: false,
			isStackable: true
		},
		{
			name: "Get A Life",
			cost: 4,
			baseFormula: "x3 + (.5 every 5 games played solo)",
			effectType: EffectType.SCORE_MULTIPLIER,
			statType: StatType.SCORE,
			description: "Multiplies score by 3 + 0.5* every 5 games played solo",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: false,
			isDurationBased: false,
			isStackable: true
		},
		{
			name: "Party Time",
			cost: 4,
			baseFormula: "x1 + (.1 per game per teammate in your stack)",
			effectType: EffectType.SCORE_MULTIPLIER,
			statType: StatType.SCORE,
			description: "Add .1 to multiplier for every game and every teammate in your stack",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: false,
			isDurationBased: false,
			isStackable: true
		},
		{
			name: "Dota is Dead",
			cost: 3,
			baseFormula: "x3 + (.1 per day you don't play a game of dota)",
			effectType: EffectType.SCORE_MULTIPLIER,
			statType: StatType.SCORE,
			description: "Add .1 to multiplier every day you don't queue a game of dota",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: false,
			isDurationBased: false,
			isStackable: true
		},
		{
			name: "The Duel",
			cost: 5,
			baseFormula: "+2x mult per stat (1 round)",
			effectType: EffectType.SCORE_MULTIPLIER,
			statType: StatType.SCORE,
			description: "+2x mult for this round per stat you beat a chosen duel member",
			imageUrl: "/cards/default.png",
			isActive: true,
			requiresTarget: true,
			isDurationBased: true,
			isStackable: false
		}
	];

	const items = [
		{
			id: 'item_discard_token_1',
			name: 'Discard Token',
			description: 'Allows you to discard a card from your hand',
			cost: 100,
			sellValue: 50,
			effectType: 'DISCARD_TOKEN',
			effectValue: 1
		},
		{
			id: 'item_discard_token_3',
			name: 'Discard Token Pack',
			description: 'Allows you to discard up to 3 cards from your hand',
			cost: 250,
			sellValue: 50,
			effectType: 'DISCARD_TOKEN',
			effectValue: 3
		},
		{
			id: 'item_bounty_1.5x',
			name: 'Bounty Charm',
			description: 'Increases gold earned from matches by 50%',
			cost: 200,
			sellValue: 50,
			effectType: 'BOUNTY_MULTIPLIER',
			effectValue: 1.5
		},
		{
			id: 'item_bounty_2x',
			name: 'Bounty Charm (2x)',
			description: 'Doubles gold earned from matches for your next game',
			cost: 350,
			sellValue: 50,
			effectType: 'BOUNTY_MULTIPLIER',
			effectValue: 2
		},
		{
			id: 'item_bounty_3x',
			name: 'Bounty Charm (3x)',
			description: 'Triples gold earned from matches for your next game',
			cost: 500,
			sellValue: 50,
			effectType: 'BOUNTY_MULTIPLIER',
			effectValue: 3
		},
		{
			id: 'item_xp_1.5x',
			name: 'XP Charm',
			description: 'Increases XP earned from matches by 50%',
			cost: 200,
			sellValue: 50,
			effectType: 'XP_MULTIPLIER',
			effectValue: 1.5
		},
		{
			id: 'item_xp_2x',
			name: 'XP Charm (2x)',
			description: 'Doubles XP earned from matches for your next game',
			cost: 350,
			sellValue: 50,
			effectType: 'XP_MULTIPLIER',
			effectValue: 2
		}
	];

	for (const card of cards) {
		console.log(`Upserting card: ${card.name}`);
		await prisma.heroCard.upsert({
			where: { name: card.name },
			update: card,
			create: card,
		});
	}

	for (const item of items) {
		console.log(`Upserting item: ${item.name}`);
		await prisma.dotadeckItem.upsert({
			where: { id: item.id },
			update: item,
			create: item,
		});
	}

	console.log('Seed completed successfully');
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
