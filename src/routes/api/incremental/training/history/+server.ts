import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';

/**
 * GET /api/incremental/training/history – recent training sessions for a hero.
 * Query: saveId (optional), heroId (required), limit (optional, default 10).
 */
export const GET: RequestHandler = async (event) => {
	const saveId = event.url.searchParams.get('saveId') ?? undefined;
	const heroIdStr = event.url.searchParams.get('heroId');
	if (!heroIdStr) return json({ error: 'heroId is required' }, { status: 400 });
	const heroId = parseInt(heroIdStr, 10);
	if (Number.isNaN(heroId)) return json({ error: 'heroId must be an integer' }, { status: 400 });

	const limitStr = event.url.searchParams.get('limit');
	const limit = Math.min(50, Math.max(1, parseInt(limitStr ?? '10', 10) || 10));

	const { saveId: resolvedSaveId } = await resolveIncrementalSave(event, { saveId });

	const sessions = await prisma.incrementalActionHistory.findMany({
		where: {
			saveId: resolvedSaveId,
			actionType: 'training',
			actionHeroId: heroId,
			endedAt: { not: null }
		},
		orderBy: { endedAt: 'desc' },
		take: limit,
		select: {
			actionStatKey: true,
			completions: true,
			startedAt: true,
			endedAt: true
		}
	});

	return json({
		heroId,
		sessions: sessions.map((s) => ({
			statKey: s.actionStatKey,
			completions: s.completions,
			startedAt: s.startedAt.toISOString(),
			endedAt: s.endedAt!.toISOString()
		}))
	});
};
