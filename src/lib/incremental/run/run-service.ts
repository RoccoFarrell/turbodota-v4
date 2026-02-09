/**
 * Run lifecycle: startRun (create run + map), advanceRun (move to next node, return encounter when combat/elite/boss).
 */

import type { RunState, BattleState } from '../types';
import { createRunMap, getRunState, type MapRunDb } from '../data/run-map';
import { createBattleState } from '../engine/battle-state';

const MIN_HEROES = 1;
const MAX_HEROES = 5;
const PLACEHOLDER_NODE_ID = '';

/** Node types that start an encounter (battle). */
const ENCOUNTER_NODE_TYPES = new Set(['COMBAT', 'ELITE', 'BOSS']);

/** Run as returned by findUnique (includes lineupId for advanceRun; Phase 7 rewards fields). */
export interface RunRecord {
	id: string;
	userId: string;
	lineupId: string;
	status: string;
	currentNodeId: string;
	heroHp?: number[] | null;
	gold?: number;
	xpByHeroId?: Record<string, number> | null;
}

/** DB interface for run service: MapRunDb + run create + run findUnique with RunRecord + lineup findUnique. */
export interface RunServiceDb extends Omit<MapRunDb, 'incrementalRun'> {
	incrementalLineup: {
		findUnique: (args: { where: { id: string } }) => Promise<{
			id: string;
			userId: string;
			heroIds: number[];
		} | null>;
	};
	incrementalRun: {
		findUnique: (args: { where: { id: string } }) => Promise<RunRecord | null>;
		update: MapRunDb['incrementalRun']['update'];
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
			seed: string | null;
		}>;
	};
}

export interface StartRunResult {
	runState: RunState;
	runId: string;
}

export interface AdvanceRunResult {
	runState: RunState;
	/** Set when the new node is combat/elite/boss: encounter and initial battle state for this request. */
	encounter?: {
		encounterId: string;
		heroIds: number[];
		battleState: BattleState;
	};
}

/**
 * Start a run: validate lineup (1–5 heroes, owned by user), create run with placeholder node id,
 * create map and set current node to first node. Returns run state.
 */
export async function startRun(
	db: RunServiceDb,
	userId: string,
	lineupId: string,
	options?: { seed?: string }
): Promise<StartRunResult> {
	const lineup = await db.incrementalLineup.findUnique({ where: { id: lineupId } });
	if (!lineup) throw new Error('Lineup not found');
	if (lineup.userId !== userId) throw new Error('Lineup does not belong to user');
	if (lineup.heroIds.length < MIN_HEROES || lineup.heroIds.length > MAX_HEROES) {
		throw new Error(`Lineup must have ${MIN_HEROES}–${MAX_HEROES} heroes`);
	}

	const run = await db.incrementalRun.create({
		data: {
			userId,
			lineupId,
			currentNodeId: PLACEHOLDER_NODE_ID,
			status: 'ACTIVE',
			seed: options?.seed ?? null
		}
	});

	await createRunMap(db, run.id, options?.seed);

	const runState = await getRunState(db, run.id);
	if (!runState) throw new Error('Run state not found after create');

	return { runState, runId: run.id };
}

/**
 * Advance run to next node. Validates nextNodeId is in current node's nextNodeIds and run belongs to user.
 * If the new node is combat/elite/boss, returns encounterId, lineup heroIds, and initial battle state.
 */
export async function advanceRun(
	db: RunServiceDb,
	runId: string,
	userId: string,
	nextNodeId: string
): Promise<AdvanceRunResult> {
	const run = await db.incrementalRun.findUnique({ where: { id: runId } });
	if (!run) throw new Error('Run not found');
	if (run.userId !== userId) throw new Error('Run does not belong to user');
	if (run.status !== 'ACTIVE') throw new Error('Run is not active');

	const currentNode = await db.incrementalMapNode.findUnique({
		where: { id: run.currentNodeId }
	});
	if (!currentNode) throw new Error('Current node not found');
	if (!currentNode.nextNodeIds.includes(nextNodeId)) {
		throw new Error('Invalid next node');
	}

	const newNode = await db.incrementalMapNode.findUnique({
		where: { id: nextNodeId }
	});
	const isBaseNode = newNode?.nodeType === 'BASE';

	await db.incrementalRun.update({
		where: { id: runId },
		data: {
			currentNodeId: nextNodeId,
			...(isBaseNode ? { heroHp: null } : {})
		}
	});

	const runState = await getRunState(db, runId);
	if (!runState) throw new Error('Run state not found after advance');

	const result: AdvanceRunResult = { runState };

	if (newNode && ENCOUNTER_NODE_TYPES.has(newNode.nodeType) && newNode.encounterId) {
		const lineup = await db.incrementalLineup.findUnique({ where: { id: run.lineupId } });
		if (!lineup) throw new Error('Lineup not found');
		const initialHeroHp =
			Array.isArray(run.heroHp) && run.heroHp.length === lineup.heroIds.length
				? run.heroHp
				: undefined;
		const battleState = createBattleState(lineup.heroIds, newNode.encounterId, {
			initialHeroHp
		});
		result.encounter = {
			encounterId: newNode.encounterId,
			heroIds: lineup.heroIds,
			battleState
		};
	}

	return result;
}
