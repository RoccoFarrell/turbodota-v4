import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { resolveIncrementalSave } from '$lib/server/incremental-save';

/** GET /api/incremental/wallet – return Essence for current save. Query: saveId (optional). */
export const GET: RequestHandler = async (event) => {
	const { url } = event;
	const saveId = url.searchParams.get('saveId') ?? undefined;
	const { essence, saveId: resolvedSaveId } = await resolveIncrementalSave(event, { saveId });
	return json({ essence, saveId: resolvedSaveId });
};
