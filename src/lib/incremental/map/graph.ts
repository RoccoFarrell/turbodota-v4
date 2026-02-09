/**
 * Map graph: minimal template and generator for run maps.
 * Linear path: 3 combat → 1 elite → 1 boss. Encounter ids match constants (e.g. wolf_pack).
 */

/** Node type string matching Prisma IncrementalNodeType enum. */
export type MapNodeType = 'COMBAT' | 'ELITE' | 'BOSS' | 'SHOP' | 'EVENT' | 'REST' | 'BASE';

export interface MapNodeTemplate {
	nodeType: MapNodeType;
	encounterId: string | null;
	nextTemplateIndices: number[]; // indices into the template array
}

/** Minimal linear graph: combat → combat → combat → elite → boss. */
const DEFAULT_GRAPH_TEMPLATE: MapNodeTemplate[] = [
	{ nodeType: 'COMBAT', encounterId: 'wolf_pack', nextTemplateIndices: [1] },
	{ nodeType: 'COMBAT', encounterId: 'wolf_pack', nextTemplateIndices: [2] },
	{ nodeType: 'COMBAT', encounterId: 'wolf_pack', nextTemplateIndices: [3] },
	{ nodeType: 'ELITE', encounterId: 'wolf_pack', nextTemplateIndices: [4] },
	{ nodeType: 'BOSS', encounterId: 'wolf_pack', nextTemplateIndices: [] }
];

export interface GeneratedMapNode {
	id: string;
	runId: string;
	nodeType: MapNodeType;
	encounterId: string | null;
	nextNodeIds: string[];
	floor?: number;
	act?: number;
}

/** Simple string hash for deterministic ids when seed is provided. */
function hashString(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) {
		h = (h << 5) - h + s.charCodeAt(i);
		h |= 0;
	}
	return Math.abs(h);
}

/** Generate a deterministic id from runId, seed and index, or random. */
function generateId(runId: string, seed: string | undefined, index: number): string {
	if (seed) {
		const h = hashString(`${runId}-${seed}-${index}`);
		return `node_${h.toString(36)}_${index}`;
	}
	return `node_${Math.random().toString(36).slice(2, 11)}_${index}`;
}

/**
 * Generate map nodes for a run. Uses template indices to build nextNodeIds from generated ids.
 * With seed, ids are deterministic for the same runId and seed.
 */
export function generateMapForRun(
	runId: string,
	seed?: string
): GeneratedMapNode[] {
	const template = DEFAULT_GRAPH_TEMPLATE;
	const ids = template.map((_, i) => generateId(runId, seed, i));
	return template.map((t, i) => ({
		id: ids[i],
		runId,
		nodeType: t.nodeType,
		encounterId: t.encounterId,
		nextNodeIds: t.nextTemplateIndices.map((idx) => ids[idx]),
		floor: 1,
		act: 1
	}));
}
