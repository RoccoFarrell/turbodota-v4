/**
 * GET /api/incremental/history – paginated action history sessions + aggregate totals for a save.
 *
 * Each session = one continuous stretch of an action on a slot (startedAt → endedAt).
 * Open sessions (endedAt = null) are still active. Item-use sessions are instant (startedAt = endedAt).
 *
 * Query params:
 *   saveId?        – explicit save id (resolved from session if omitted)
 *   limit?         – max sessions to return (default 50, max 200)
 *   cursor?        – id-based cursor for pagination
 *   actionType?    – filter by action type ("mining" | "training")
 *   actionHeroId?  – filter by hero id (number)
 *   actionStatKey? – filter by stat key (string)
 *   source?        – filter by source ("idle" | "item")
 *   status?        – "open" | "closed" | omit for all
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';

export const GET: RequestHandler = async (event) => {
	const params = event.url.searchParams;
	const { saveId } = await resolveIncrementalSave(event, {
		saveId: params.get('saveId') ?? undefined
	});

	const limit = Math.min(Math.max(1, parseInt(params.get('limit') ?? '50', 10) || 50), 200);
	const cursor = params.get('cursor') ?? undefined;
	const actionType = params.get('actionType') ?? undefined;
	const actionHeroId = params.get('actionHeroId')
		? parseInt(params.get('actionHeroId')!, 10)
		: undefined;
	const actionStatKey = params.get('actionStatKey') ?? undefined;
	const source = params.get('source') ?? undefined;
	const status = params.get('status') ?? undefined;

	const where: Record<string, unknown> = { saveId };
	if (actionType) where.actionType = actionType;
	if (actionHeroId !== undefined && !isNaN(actionHeroId)) where.actionHeroId = actionHeroId;
	if (actionStatKey) where.actionStatKey = actionStatKey;
	if (source) where.source = source;
	if (status === 'open') where.endedAt = null;
	else if (status === 'closed') where.endedAt = { not: null };

	// Fetch sessions (newest first by startedAt)
	const sessions = await prisma.incrementalActionHistory.findMany({
		where,
		orderBy: { startedAt: 'desc' },
		take: limit + 1,
		...(cursor
			? {
					cursor: { id: cursor },
					skip: 1
				}
			: {}),
		select: {
			id: true,
			slotIndex: true,
			actionType: true,
			actionHeroId: true,
			actionStatKey: true,
			completions: true,
			source: true,
			itemId: true,
			startedAt: true,
			endedAt: true
		}
	});

	const hasMore = sessions.length > limit;
	const items = hasMore ? sessions.slice(0, limit) : sessions;
	const nextCursor = hasMore ? items[items.length - 1].id : null;

	// Aggregate totals (all-time, respecting filters except cursor/pagination)
	const totalsWhere: Record<string, unknown> = { saveId };
	if (actionType) totalsWhere.actionType = actionType;
	if (actionHeroId !== undefined && !isNaN(actionHeroId)) totalsWhere.actionHeroId = actionHeroId;
	if (actionStatKey) totalsWhere.actionStatKey = actionStatKey;
	if (source) totalsWhere.source = source;

	const totals = await prisma.incrementalActionHistory.groupBy({
		by: ['actionType', 'actionHeroId', 'actionStatKey'],
		where: totalsWhere,
		_sum: {
			completions: true
		},
		_count: true
	});

	return json({
		saveId,
		sessions: items,
		nextCursor,
		totals: totals.map((t) => ({
			actionType: t.actionType,
			actionHeroId: t.actionHeroId,
			actionStatKey: t.actionStatKey,
			totalCompletions: t._sum.completions ?? 0,
			sessionCount: t._count
		}))
	});
};
