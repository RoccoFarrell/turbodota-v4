/**
 * Map graph: generateMapForRun produces valid path.
 */

import { describe, it, expect } from 'vitest';
import { generateMapForRun } from './graph';

describe('map graph', () => {
	it('generateMapForRun produces 5 nodes in linear order (3 combat, 1 elite, 1 boss)', () => {
		const runId = 'run_1';
		const nodes = generateMapForRun(runId);
		expect(nodes).toHaveLength(5);
		expect(nodes[0].nodeType).toBe('COMBAT');
		expect(nodes[1].nodeType).toBe('COMBAT');
		expect(nodes[2].nodeType).toBe('COMBAT');
		expect(nodes[3].nodeType).toBe('ELITE');
		expect(nodes[4].nodeType).toBe('BOSS');
		expect(nodes[0].encounterId).toBe('wolf_pack');
		expect(nodes[4].nextNodeIds).toEqual([]);
	});

	it('generateMapForRun: first node nextNodeIds points to second node', () => {
		const runId = 'run_2';
		const nodes = generateMapForRun(runId);
		expect(nodes[0].nextNodeIds).toHaveLength(1);
		expect(nodes[0].nextNodeIds[0]).toBe(nodes[1].id);
	});

	it('generateMapForRun with seed: deterministic ids for same runId and seed', () => {
		const runId = 'run_3';
		const seed = 'abc';
		const a = generateMapForRun(runId, seed);
		const b = generateMapForRun(runId, seed);
		expect(a.map((n) => n.id)).toEqual(b.map((n) => n.id));
	});

	it('generateMapForRun: all nodes have same runId', () => {
		const runId = 'run_4';
		const nodes = generateMapForRun(runId);
		expect(nodes.every((n) => n.runId === runId)).toBe(true);
	});
});
