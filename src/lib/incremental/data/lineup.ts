/**
 * Data layer: create and query IncrementalLineup and IncrementalRun.
 * Accepts a Prisma-like client so callers pass prisma from src/lib/server/prisma.
 */

/** Minimal client interface for lineup/run operations (avoids importing Prisma in incremental lib). */
export interface IncrementalDb {
	incrementalLineup: {
		create: (args: {
			data: { userId: string; name: string; heroIds: number[] };
		}) => Promise<{ id: string; userId: string; name: string; heroIds: number[] }>;
		findMany: (args: { where: { userId: string } }) => Promise<
			Array<{ id: string; userId: string; name: string; heroIds: number[] }>
		>;
	};
	incrementalRun: {
		create: (args: {
			data: {
				userId: string;
				lineupId: string;
				currentNodeId: string;
				status?: string;
				seed?: string | null;
			};
		}) => Promise<{
			id: string;
			userId: string;
			lineupId: string;
			status: string;
			currentNodeId: string;
			startedAt: Date;
			finishedAt: Date | null;
			seed: string | null;
		}>;
		findMany: (args: { where: { userId: string } }) => Promise<
			Array<{
				id: string;
				lineupId: string;
				status: string;
				currentNodeId: string;
				startedAt: Date;
				finishedAt: Date | null;
			}>
		>;
	};
}

export async function createLineup(
	db: IncrementalDb,
	data: { userId: string; name: string; heroIds: number[] }
) {
	return db.incrementalLineup.create({ data });
}

export async function getLineupsByUserId(db: IncrementalDb, userId: string) {
	return db.incrementalLineup.findMany({ where: { userId } });
}

export async function createRun(
	db: IncrementalDb,
	data: {
		userId: string;
		lineupId: string;
		currentNodeId: string;
		seed?: string | null;
	}
) {
	return db.incrementalRun.create({
		data: {
			userId: data.userId,
			lineupId: data.lineupId,
			currentNodeId: data.currentNodeId,
			status: 'ACTIVE',
			seed: data.seed ?? null
		}
	});
}

export async function getRunsByUserId(db: IncrementalDb, userId: string) {
	return db.incrementalRun.findMany({ where: { userId } });
}
