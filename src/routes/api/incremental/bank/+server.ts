import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';
import { getBankBalances, getBankItems } from '$lib/incremental/bank/bank.service.server';

/** GET /api/incremental/bank – return currencies, item inventory, and current action state for idle UI. Query: saveId (optional). */
export const GET: RequestHandler = async (event) => {
	const saveId = event.url.searchParams.get('saveId') ?? undefined;
	const { saveId: resolvedSaveId } = await resolveIncrementalSave(event, { saveId });
	const [balances, inventory, actionState] = await Promise.all([
		getBankBalances(resolvedSaveId),
		getBankItems(resolvedSaveId),
		prisma.incrementalActionState.findUnique({
			where: { saveId: resolvedSaveId },
			select: { actionType: true, progress: true, lastTickAt: true, actionHeroId: true, actionStatKey: true }
		})
	]);
	return json({
		// Backward compatible: essence at top level
		essence: balances.essence ?? 0,
		// Full currency balances
		currencies: balances,
		// Item inventory (only items with quantity > 0)
		inventory,
		saveId: resolvedSaveId,
		actionType: actionState?.actionType ?? 'mining',
		progress: actionState?.progress ?? 0,
		lastTickAt: actionState?.lastTickAt ? new Date(actionState.lastTickAt).getTime() : Date.now(),
		actionHeroId: actionState?.actionHeroId ?? null,
		actionStatKey: actionState?.actionStatKey ?? null
	});
};
