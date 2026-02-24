import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from '$env/dynamic/private';

// Prisma 7 with engine type "client" requires a driver adapter for PostgreSQL.
// (Bank system: IncrementalBankCurrency + IncrementalBankItem added in 20260215 migration)
const connectionString = env.DATABASE_URL || env.DIRECT_URL || '';
if (!connectionString) {
	throw new Error(
		'Prisma: set DIRECT_URL or DATABASE_URL in your environment (e.g. .env)'
	);
}
// Construct our own Pool so we can control SSL settings directly.
// Supabase's pooler cert chain isn't trusted by Node in serverless envs,
// so we disable cert verification while keeping the connection encrypted.
const pool = new pg.Pool({
	connectionString,
	ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg({ pool });
const prisma = new PrismaClient({ adapter });

// prisma.$on('query', (e) => {
// 	console.log(e);
// });

export default prisma;
