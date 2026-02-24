import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from '$env/dynamic/private';

// Prisma 7 with engine type "client" requires a driver adapter for PostgreSQL.
// (Bank system: IncrementalBankCurrency + IncrementalBankItem added in 20260215 migration)
const rawUrl = env.DATABASE_URL || env.DIRECT_URL || '';
if (!rawUrl) {
	throw new Error(
		'Prisma: set DIRECT_URL or DATABASE_URL in your environment (e.g. .env)'
	);
}
// Strip sslmode from the URL so it doesn't override our programmatic SSL config.
// pg treats sslmode=require as verify-full, which rejects Supabase's cert chain.
const url = new URL(rawUrl);
url.searchParams.delete('sslmode');
const connectionString = url.toString();

// Construct our own Pool so we can control SSL settings directly.
// Supabase's pooler cert chain isn't trusted by Node in serverless envs,
// so we disable cert verification while keeping the connection encrypted.
// Local dev (127.0.0.1 / localhost) doesn't support SSL, so skip it there.
const isLocal = url.hostname === '127.0.0.1' || url.hostname === 'localhost';
const pool = new pg.Pool({
	connectionString,
	ssl: isLocal ? false : { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// prisma.$on('query', (e) => {
// 	console.log(e);
// });

export default prisma;
