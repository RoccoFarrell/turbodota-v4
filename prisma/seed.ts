/**
 * Seeds the dev database with one user (Rocco) and "Dev Test League".
 * Order matters: DotaUser → User → Key (Lucia Steam) → League.
 * The Key is required so Steam login (auth.useKey('steam', steamid)) works.
 */
import 'dotenv/config';
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
