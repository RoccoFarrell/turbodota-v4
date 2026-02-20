/**
 * Run lifecycle: startRun (create run + map), advanceRun (move to next node, return encounter when combat/elite/boss).
 */

import type { RunState, BattleState, HeroDef } from '../types';
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
	level?: number;
	heroHp?: number[] | null;
	gold?: number;
	xpByHeroId?: Record<string, number> | null;
}

/** DB interface for run service: MapRunDb + run create + run findUnique with RunRecord + lineup findUnique. */
export interface RunServiceDb extends Omit<MapRunDb, 'incrementalRun'> {
	incrementalLineup: {
		findUnique: (args: {
			where: { id: string };
			include?: { save: { select: { userId: true } } };
		}) => Promise<{
			id: string;
			saveId: string;
			heroIds: number[];
			save?: { userId: string };
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
				level?: number;
			};
		}) => Promise<{
			id: string;
			userId: string;
			lineupId: string;
			status: string;
			currentNodeId: string;
			startedAt: Date;
			seed: string | null;
			level: number;
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
	options?: { seed?: string; level?: number }
): Promise<StartRunResult> {
	const lineup = await db.incrementalLineup.findUnique({
		where: { id: lineupId },
		include: { save: { select: { userId: true } } }
	});
	if (!lineup) throw new Error('Lineup not found');
	if (lineup.save?.userId !== userId) throw new Error('Lineup does not belong to user');
	if (lineup.heroIds.length < MIN_HEROES || lineup.heroIds.length > MAX_HEROES) {
		throw new Error(`Lineup must have ${MIN_HEROES}–${MAX_HEROES} heroes`);
	}

	const level = options?.level ?? 1;
	const run = await db.incrementalRun.create({
		data: {
			userId,
			lineupId,
			currentNodeId: PLACEHOLDER_NODE_ID,
			status: 'ACTIVE',
			seed: options?.seed ?? null,
			level
		}
	});

	await createRunMap(db, run.id, options?.seed);

	const runState = await getRunState(db, run.id);
	if (!runState) throw new Error('Run state not found after create');

	return { runState, runId: run.id };
}

/** Options for advanceRun when creating a battle (e.g. hero defs from DB). */
export interface AdvanceRunOptions {
	getHeroDef?: (heroId: number) => HeroDef | undefined;
}

/**
 * Advance run to next node. Validates nextNodeId is in current node's nextNodeIds and run belongs to user.
 * If the new node is combat/elite/boss, returns encounterId, lineup heroIds, and initial battle state.
 */
export async function advanceRun(
	db: RunServiceDb,
	runId: string,
	userId: string,
	nextNodeId: string,
	options?: AdvanceRunOptions
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
			initialHeroHp,
			getHeroDef: options?.getHeroDef,
			level: run.level ?? 1
		});
		result.encounter = {
			encounterId: newNode.encounterId,
			heroIds: lineup.heroIds,
			battleState
		};
	}

	return result;
}

/**
 * Create encounter (battle state) for a given next node without advancing the run.
 * Use when user "enters" battle; advance run only when they win.
 * Validates nextNodeId is in current node's nextNodeIds; throws if node is not combat/elite/boss.
 */
export async function createEncounterForNode(
	db: RunServiceDb,
	runId: string,
	userId: string,
	nextNodeId: string,
	options?: AdvanceRunOptions
): Promise<{ encounterId: string; heroIds: number[]; battleState: BattleState }> {
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
	if (!newNode || !ENCOUNTER_NODE_TYPES.has(newNode.nodeType) || !newNode.encounterId) {
		throw new Error('Node is not a combat/elite/boss encounter');
	}

	const lineup = await db.incrementalLineup.findUnique({ where: { id: run.lineupId } });
	if (!lineup) throw new Error('Lineup not found');
	const initialHeroHp =
		Array.isArray(run.heroHp) && run.heroHp.length === lineup.heroIds.length
			? run.heroHp
			: undefined;
	const battleState = createBattleState(lineup.heroIds, newNode.encounterId, {
		initialHeroHp,
		getHeroDef: options?.getHeroDef,
		level: run.level ?? 1
	});
	return {
		encounterId: newNode.encounterId,
		heroIds: lineup.heroIds,
		battleState
	};
}
