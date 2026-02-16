import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { resolveIncrementalSave } from '$lib/server/incremental-save';
import { addBankItem } from '$lib/incremental/bank/bank.service.server';

/**
 * POST /api/incremental/debug/grant-arcane-rune
 *
 * Debug-only: add Arcane Runes directly to your current save (no Dota match).
 * Use this to test the Inventory page and "Use item" flow.
 *
 * Body: { saveId?, count? } — count defaults to 1.
 * Only available when import.meta.env.DEV is true.
 */
export const POST: RequestHandler = async (event) => {
	if (!import.meta.env.DEV) {
		error(404, 'Not found');
	}

	let body: { saveId?: string; count?: number } = {};
	try {
		body = await event.request.json();
	} catch {
		// optional body
	}
	const { saveId } = await resolveIncrementalSave(event, { saveId: body.saveId });
	const count = Math.min(Math.max(1, Math.floor(Number(body.count) || 1)), 99);

	await addBankItem(saveId, 'arcane_rune', count);

	const { getBankItemQuantity } = await import('$lib/incremental/bank/bank.service.server');
	const newTotal = await getBankItemQuantity(saveId, 'arcane_rune');

	return json({
		success: true,
		saveId,
		added: count,
		arcaneRuneTotal: newTotal,
		message: `Added ${count} Arcane Rune(s). Total: ${newTotal}. Open Inventory to use them.`
	});
};
