/**
 * Seeds the dev database with one user (Rocco) and "Dev Test League".
 * Also uploads incremental game balance data from data/heroes_base_stats.csv and data/hero_abilities.csv.
 * Order matters: DotaUser → User → Key (Lucia Steam) → League.
 * The Key is required so Steam login (auth.useKey('steam', steamid)) works.
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
if (!connectionString) {
	throw new Error('Prisma seed: set DIRECT_URL or DATABASE_URL in .env');
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
	const now = new Date('2024-01-16T03:10:25.957Z');

	// 1. DotaUser (required for User and League members)
	await prisma.dotaUser.upsert({
		where: { account_id: 65110965 },
		create: {
			account_id: 65110965,
			createdDate: now,
			lastUpdated: now
		},
		update: {}
	});

	// 2. User (Lucia auth user; id = steam_id string for Steam login)
	await prisma.user.upsert({
		where: { account_id: 65110965 },
		create: {
			id: '76561198025376693',
			name: 'Rocco',
			username: 'The Dog Petter',
			account_id: 65110965,
			steam_id: BigInt('76561198025376693'),
			profile_url: 'https://steamcommunity.com/profiles/76561198025376693/',
			avatar_url:
				'https://avatars.steamstatic.com/6f8292e77e9ae4384e0028668c7b7b0049bd1ee5.jpg',
			roles: 'dev',
			createdDate: now,
			lastUpdated: now
		},
		update: {}
	});

	// 3. Lucia Key for Steam (required for auth.useKey('steam', steamid); id = "providerId:providerUserId")
	await prisma.key.upsert({
		where: { id: 'steam:76561198025376693' },
		create: {
			id: 'steam:76561198025376693',
			user_id: '76561198025376693',
			hashed_password: null
		},
		update: {}
	});

	// 4. Dev Test League (creator = this user, member = their DotaUser)
	const existing = await prisma.league.findFirst({ where: { name: 'Dev Test League' } });
	if (existing) {
		await prisma.league.update({
			where: { id: existing.id },
			data: { lastUpdated: new Date(), members: { set: [{ account_id: 65110965 }] } }
		});
	} else {
		await prisma.league.create({
			data: {
				name: 'Dev Test League',
				creatorID: 65110965,
				createdDate: now,
				lastUpdated: now,
				members: { connect: [{ account_id: 65110965 }] }
			}
		});
	}

	// 5. Incremental game: hero base stats and abilities from CSVs
	await seedIncrementalHeroData(prisma);
}

function parseCsv(content: string): string[][] {
	const lines: string[][] = [];
	let i = 0;
	while (i < content.length) {
		const row: string[] = [];
		while (i < content.length) {
			if (content[i] === '"') {
				i++;
				let field = '';
				while (i < content.length && (content[i] !== '"' || content[i + 1] === '"')) {
					if (content[i] === '"' && content[i + 1] === '"') {
						field += '"';
						i += 2;
					} else {
						field += content[i++];
					}
				}
				if (content[i] === '"') i++;
				row.push(field);
			} else {
				let field = '';
				while (i < content.length && content[i] !== ',' && content[i] !== '\n' && content[i] !== '\r')
					field += content[i++];
				row.push(field.trim());
			}
			if (content[i] === ',') {
				i++;
			} else if (content[i] === '\r' || content[i] === '\n') {
				while (content[i] === '\r' || content[i] === '\n') i++;
				break;
			}
		}
		if (row.some((c) => c.length > 0)) lines.push(row);
	}
	return lines;
}

async function seedIncrementalHeroData(prisma: PrismaClient) {
	const dataDir = path.join(process.cwd(), 'data');
	const abilitiesPath = path.join(dataDir, 'hero_abilities.csv');
	const baseStatsPath = path.join(dataDir, 'heroes_base_stats.csv');
	if (!fs.existsSync(abilitiesPath) || !fs.existsSync(baseStatsPath)) {
		console.log('[seed] Skipping incremental hero data: hero_abilities.csv or heroes_base_stats.csv not found in data/');
		return;
	}
	const now = new Date();

	// Abilities: id, ability_name, type, trigger, effect, target, damageType, baseDamage, returnDamageRatio
	const abilityRows = parseCsv(fs.readFileSync(abilitiesPath, 'utf-8'));
	const abilityHeader = abilityRows[0] ?? [];
	const abilityCol = (name: string) => {
		const i = abilityHeader.indexOf(name);
		return i >= 0 ? i : -1;
	};
	const idxId = abilityCol('id');
	const idxName = abilityCol('ability_name');
	const idxDesc = abilityCol('description');
	const idxType = abilityCol('type');
	const idxTrigger = abilityCol('trigger');
	const idxEffect = abilityCol('effect');
	const idxTarget = abilityCol('target');
	const idxDmgType = abilityCol('damageType');
	const idxBaseDmg = abilityCol('baseDamage');
	const idxReturnRatio = abilityCol('returnDamageRatio');
	const description = idxDesc >= 0 ? (row: string[]) => row[idxDesc]?.trim() || null : () => null;
	if (
		idxId < 0 ||
		idxName < 0 ||
		idxType < 0 ||
		idxTrigger < 0 ||
		idxEffect < 0 ||
		idxTarget < 0
	) {
		console.warn('[seed] hero_abilities.csv missing expected columns, skipping abilities.');
	} else {
		for (let r = 1; r < abilityRows.length; r++) {
			const row = abilityRows[r] ?? [];
			const id = row[idxId]?.trim() ?? '';
			if (!id) continue;
			const baseDamage = row[idxBaseDmg]?.trim();
			const returnRatio = row[idxReturnRatio]?.trim();
			const descVal = description(row);
			await prisma.incrementalHeroAbility.upsert({
				where: { id },
				create: {
					id,
					abilityName: row[idxName]?.trim() ?? '',
					description: descVal,
					type: row[idxType]?.trim() ?? 'active',
					trigger: row[idxTrigger]?.trim() ?? 'timer',
					effect: row[idxEffect]?.trim() ?? '',
					target: row[idxTarget]?.trim() ?? '',
					damageType: row[idxDmgType]?.trim() || null,
					baseDamage: baseDamage !== '' && baseDamage != null ? parseInt(baseDamage, 10) : null,
					returnDamageRatio:
						returnRatio !== '' && returnRatio != null ? parseFloat(returnRatio) : null,
					updatedAt: now
				},
				update: {
					abilityName: row[idxName]?.trim() ?? '',
					description: descVal,
					type: row[idxType]?.trim() ?? 'active',
					trigger: row[idxTrigger]?.trim() ?? 'timer',
					effect: row[idxEffect]?.trim() ?? '',
					target: row[idxTarget]?.trim() ?? '',
					damageType: row[idxDmgType]?.trim() || null,
					baseDamage: baseDamage !== '' && baseDamage != null ? parseInt(baseDamage, 10) : null,
					returnDamageRatio:
						returnRatio !== '' && returnRatio != null ? parseFloat(returnRatio) : null,
					updatedAt: now
				}
			});
		}
		console.log(`[seed] Upserted ${abilityRows.length - 1} incremental hero abilities.`);
	}

	// Base stats: heroId, localized_name, primaryAttribute, baseAttackInterval, baseAttackDamage, baseMaxHp, baseArmor, baseMagicResist, baseSpellInterval, abilityId1, abilityId2
	const baseRows = parseCsv(fs.readFileSync(baseStatsPath, 'utf-8'));
	const baseHeader = baseRows[0] ?? [];
	const baseCol = (name: string) => {
		const i = baseHeader.indexOf(name);
		return i >= 0 ? i : -1;
	};
	const bHeroId = baseCol('heroId');
	const bName = baseCol('localized_name');
	const bAttr = baseCol('primaryAttribute');
	const bAtkInt = baseCol('baseAttackInterval');
	const bAtkDmg = baseCol('baseAttackDamage');
	const bHp = baseCol('baseMaxHp');
	const bArmor = baseCol('baseArmor');
	const bMr = baseCol('baseMagicResist');
	const bSpellInt = baseCol('baseSpellInterval');
	const bAb1 = baseCol('abilityId1');
	const bAb2 = baseCol('abilityId2');
	if (
		bHeroId < 0 ||
		bName < 0 ||
		bAttr < 0 ||
		bAtkInt < 0 ||
		bAtkDmg < 0 ||
		bHp < 0 ||
		bArmor < 0 ||
		bMr < 0 ||
		bAb1 < 0 ||
		bAb2 < 0
	) {
		console.warn('[seed] heroes_base_stats.csv missing expected columns, skipping base stats.');
		return;
	}
	for (let r = 1; r < baseRows.length; r++) {
		const row = baseRows[r] ?? [];
		const heroId = parseInt(row[bHeroId] ?? '', 10);
		if (isNaN(heroId)) continue;
		const spellInt = row[bSpellInt]?.trim();
		await prisma.incrementalHeroBaseStat.upsert({
			where: { heroId },
			create: {
				heroId,
				localizedName: row[bName]?.trim() ?? '',
				primaryAttribute: row[bAttr]?.trim() ?? 'str',
				baseAttackInterval: parseFloat(row[bAtkInt] ?? '1.7'),
				baseAttackDamage: parseInt(row[bAtkDmg] ?? '0', 10),
				baseMaxHp: parseInt(row[bHp] ?? '150', 10),
				baseArmor: parseFloat(row[bArmor] ?? '0'),
				baseMagicResist: parseFloat(row[bMr] ?? '0.25'),
				baseSpellInterval:
					spellInt !== '' && spellInt != null ? parseFloat(spellInt) : null,
				abilityId1: row[bAb1]?.trim() ?? '',
				abilityId2: row[bAb2]?.trim() ?? '',
				updatedAt: now
			},
			update: {
				localizedName: row[bName]?.trim() ?? '',
				primaryAttribute: row[bAttr]?.trim() ?? 'str',
				baseAttackInterval: parseFloat(row[bAtkInt] ?? '1.7'),
				baseAttackDamage: parseInt(row[bAtkDmg] ?? '0', 10),
				baseMaxHp: parseInt(row[bHp] ?? '150', 10),
				baseArmor: parseFloat(row[bArmor] ?? '0'),
				baseMagicResist: parseFloat(row[bMr] ?? '0.25'),
				baseSpellInterval:
					spellInt !== '' && spellInt != null ? parseFloat(spellInt) : null,
				abilityId1: row[bAb1]?.trim() ?? '',
				abilityId2: row[bAb2]?.trim() ?? '',
				updatedAt: now
			}
		});
	}
	console.log(`[seed] Upserted ${baseRows.length - 1} incremental hero base stats.`);
}

main()
	.then(async () => {
		// Populate Hero table from OpenDota (same as GET /api/getHeroes?forceUpdate=true)
		const origin = process.env.SITE_ORIGIN ?? process.env.ORIGIN ?? 'http://localhost:5173';
		const url = `${origin}/api/getHeroes?forceUpdate=true`;
		try {
			const res = await fetch(url);
			if (res.ok) {
				const data = await res.json();
				console.log(`[seed] Heroes synced from OpenDota (${data.allHeroes?.length ?? 0} heroes).`);
			} else {
				console.warn(`[seed] GET ${url} returned ${res.status}. Start the app and run the seed again, or visit that URL to sync heroes.`);
			}
		} catch (e) {
			console.warn('[seed] Could not fetch /api/getHeroes?forceUpdate=true:', (e as Error).message);
			console.warn('Start the dev server (npm run dev) and run "npx prisma db seed" again, or visit /api/getHeroes?forceUpdate=true in the browser to populate heroes.');
		}
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
