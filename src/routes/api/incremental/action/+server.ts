import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { advanceIdleTimer } from '$lib/incremental/actions/idle-timer';
import { getActionDef, TRAINING_ACTION_ID } from '$lib/incremental/actions/action-definitions';
import { applyRewards } from '$lib/incremental/actions/action-rewards.server';
import { TRAINING_STAT_KEYS, SCAVENGING_PARTY_YIELD_BONUS, SCAVENGING_PARTY_MAX_SIZE, type TrainingStatKey } from '$lib/incremental/actions/constants';
import { getAffinityRateModifier } from '$lib/incremental/actions/hero-affinity';
import { resolveIncrementalSave } from '$lib/server/incremental-save';
import { getRateModifier } from '$lib/incremental/actions/talent-rate-modifier';
import { getMaxSlots } from '$lib/incremental/actions/slot-helpers';
import { getBankBalance } from '$lib/incremental/bank/bank.service.server';

function isValidStatKey(key: unknown): key is TrainingStatKey {
	return typeof key === 'string' && (TRAINING_STAT_KEYS as readonly string[]).includes(key);
}

/** POST /api/incremental/action – tick or set action for a slot. */
export const POST: RequestHandler = async (event) => {
	const { request } = event;
	let body: {
		saveId?: string;
		slotIndex?: number;
		lastTickAt?: number;
		progress?: number;
		actionType?: string;
		actionHeroId?: number;
		actionStatKey?: string;
		actionPartyHeroIds?: number[];
	};
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const { saveId } = await resolveIncrementalSave(event, { saveId: body.saveId });

	const slotIndex = typeof body.slotIndex === 'number' ? body.slotIndex : 0;
	const maxSlots = await getMaxSlots(saveId);
	if (slotIndex < 0 || slotIndex >= maxSlots) {
		error(400, `Invalid slot index ${slotIndex}. You have ${maxSlots} slot(s) available.`);
	}

	// Registry lookup — returns 400 for unknown action types
	const actionDef = getActionDef(body.actionType ?? '');
	if (!actionDef) {
		error(400, `Unknown action type: ${body.actionType}`);
	}
	const actionId = actionDef.id;

	const now = Date.now();
	const lastTickAt = typeof body.lastTickAt === 'number' ? body.lastTickAt : now;
	const progress = typeof body.progress === 'number' ? Math.max(0, Math.min(1, body.progress)) : 0;

	// ---- Per-category validation and modifier computation ----
	let actionHeroId: number | null = null;
	let actionStatKey: string | null = null;
	let partyHeroIds: number[] = [];
	let rateModifier = 1;
	let rewardMultiplier = 1;

	if (actionDef.category === 'training') {
		actionHeroId = typeof body.actionHeroId === 'number' ? body.actionHeroId : null;
		actionStatKey = isValidStatKey(body.actionStatKey) ? body.actionStatKey : null;

		if (typeof actionHeroId !== 'number' || !isValidStatKey(actionStatKey)) {
			error(400, 'Training requires actionHeroId (number) and actionStatKey (valid stat key)');
		}
		const roster = await prisma.incrementalRosterHero.findMany({
			where: { saveId },
			select: { heroId: true }
		});
		if (!roster.some((r) => r.heroId === actionHeroId)) {
			error(400, 'Hero is not on your roster');
		}

		// Talent rate modifier
		const talentModifier = await getRateModifier(saveId, actionId, actionStatKey);

		// Affinity modifier: query hero's primary attribute
		const hero = await prisma.hero.findUnique({ where: { id: actionHeroId! }, select: { primary_attr: true } });
		const affinityModifier = hero?.primary_attr && isValidStatKey(actionStatKey)
			? getAffinityRateModifier(hero.primary_attr, actionStatKey)
			: 1;

		rateModifier = talentModifier * affinityModifier;

	} else {
		// Scavenging category (mining, woodcutting, future)
		const talentModifier = await getRateModifier(saveId, actionId, null);
		rateModifier = talentModifier;

		// Validate and clamp party hero IDs
		if (Array.isArray(body.actionPartyHeroIds) && body.actionPartyHeroIds.length > 0) {
			const rawParty = body.actionPartyHeroIds.filter((id): id is number => typeof id === 'number');
			const clamped = rawParty.slice(0, SCAVENGING_PARTY_MAX_SIZE);

			if (clamped.length > 0) {
				const roster = await prisma.incrementalRosterHero.findMany({
					where: { saveId },
					select: { heroId: true }
				});
				const rosterSet = new Set(roster.map((r) => r.heroId));
				partyHeroIds = clamped.filter((id) => rosterSet.has(id));
			}

			rewardMultiplier = 1 + partyHeroIds.length * SCAVENGING_PARTY_YIELD_BONUS;
		}
	}

	// ---- Hero conflict check: ensure no hero is assigned to multiple slots ----
	// Check other slots for the same hero (training heroId) or party members
	const heroToCheck = actionHeroId;
	const partyToCheck = partyHeroIds;
	if (heroToCheck != null || partyToCheck.length > 0) {
		const otherSlots = await prisma.incrementalActionSlot.findMany({
			where: { saveId, slotIndex: { not: slotIndex } },
			select: { actionHeroId: true, actionPartyHeroIds: true }
		});
		for (const other of otherSlots) {
			if (heroToCheck != null && other.actionHeroId === heroToCheck) {
				error(409, `Hero ${heroToCheck} is already assigned to another slot`);
			}
			for (const pid of partyToCheck) {
				if (other.actionHeroId === pid || other.actionPartyHeroIds.includes(pid)) {
					error(409, `Hero ${pid} is already assigned to another slot`);
				}
			}
		}
	}

	// ---- Advance idle timer ----
	const durationPerCompletionSec = actionDef.durationPerCompletionSec;
	const { progress: newProgress, completions } = advanceIdleTimer({
		progress,
		lastTickAt,
		now,
		durationPerCompletionSec,
		rateModifier
	});

	// ---- Build action params ----
	const params: Record<string, unknown> =
		actionDef.category === 'training' && actionHeroId != null && actionStatKey != null
			? { heroId: actionHeroId, statKey: actionStatKey }
			: {};

	// ---- Apply rewards and persist ----
	let currenciesEarned: Record<string, number> = {};

	await prisma.$transaction(async (tx) => {
		currenciesEarned = await applyRewards(actionId, params, completions, { saveId, tx }, { rewardMultiplier });

		await tx.incrementalActionSlot.upsert({
			where: { saveId_slotIndex: { saveId, slotIndex } },
			create: {
				saveId,
				slotIndex,
				actionType: actionId,
				progress: newProgress,
				lastTickAt: new Date(now),
				actionHeroId: actionHeroId ?? undefined,
				actionStatKey: actionStatKey ?? undefined,
				actionPartyHeroIds: partyHeroIds
			},
			update: {
				actionType: actionId,
				progress: newProgress,
				lastTickAt: new Date(now),
				actionHeroId: actionHeroId ?? null,
				actionStatKey: actionStatKey ?? null,
				actionPartyHeroIds: partyHeroIds
			}
		});

		// Keep legacy table in sync for backward compat (slot 0 only)
		if (slotIndex === 0) {
			await tx.incrementalActionState.upsert({
				where: { saveId },
				create: {
					saveId,
					actionType: actionId,
					progress: newProgress,
					lastTickAt: new Date(now),
					actionHeroId: actionHeroId ?? undefined,
					actionStatKey: actionStatKey ?? undefined
				},
				update: {
					actionType: actionId,
					progress: newProgress,
					lastTickAt: new Date(now),
					actionHeroId: actionHeroId ?? null,
					actionStatKey: actionStatKey ?? null
				}
			});
		}

		// Session-based action history
		const openSession = await tx.incrementalActionHistory.findFirst({
			where: { saveId, slotIndex, endedAt: null, source: 'idle' },
			select: { id: true, actionType: true, actionHeroId: true, actionStatKey: true }
		});
		const sameAction =
			openSession &&
			openSession.actionType === actionId &&
			openSession.actionHeroId === (actionHeroId ?? null) &&
			openSession.actionStatKey === (actionStatKey ?? null);
		if (openSession && !sameAction) {
			await tx.incrementalActionHistory.update({
				where: { id: openSession.id },
				data: { endedAt: new Date(now) }
			});
		}
		if (sameAction && completions > 0) {
			await tx.incrementalActionHistory.update({
				where: { id: openSession!.id },
				data: { completions: { increment: completions } }
			});
		} else if (!sameAction) {
			await tx.incrementalActionHistory.create({
				data: {
					saveId,
					slotIndex,
					actionType: actionId,
					actionHeroId: actionHeroId ?? null,
					actionStatKey: actionStatKey ?? null,
					completions: Math.max(0, completions),
					source: 'idle',
					startedAt: new Date(now)
				}
			});
		}
	});

	const essenceBalance = await getBankBalance(saveId, 'essence');

	return json({
		essence: essenceBalance,
		saveId,
		slotIndex,
		progress: newProgress,
		lastTickAt: now,
		currenciesEarned,
		actionType: actionId,
		actionHeroId: actionHeroId ?? null,
		actionStatKey: actionStatKey ?? null,
		actionPartyHeroIds: partyHeroIds
	});
};
