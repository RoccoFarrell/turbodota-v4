import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '$env/dynamic/private';

// Prisma 7 with engine type "client" requires a driver adapter for PostgreSQL.
const connectionString = env.DIRECT_URL || env.DATABASE_URL || '';
if (!connectionString) {
	throw new Error(
		'Prisma: set DIRECT_URL or DATABASE_URL in your environment (e.g. .env)'
	);
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// prisma.$on('query', (e) => {
// 	console.log(e);
// });

export default prisma;
