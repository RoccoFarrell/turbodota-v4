/**
 * Shared reactive store for action slot state.
 * Lives at the incremental layout level so tick loops persist across page navigation.
 * Uses Svelte 5 runes ($state) via .svelte.ts module.
 */

import { getDurationSec, formatSlotLabel } from '$lib/incremental/actions';

export interface SlotState {
	slotIndex: number;
	actionType: string;
	progress: number;
	lastTickAt: number;
	actionHeroId: number | null;
	actionStatKey: string | null;
	partyHeroIds: number[];
}

export interface CatchUpResult {
	/** How many seconds the user was away */
	awaySeconds: number;
	/** Per-slot summaries of what happened */
	slotResults: {
		actionLabel: string;
		currenciesEarned: Record<string, number>;
	}[];
	/** Total currencies earned while away, keyed by currencyKey */
	totalCurrenciesEarned: Record<string, number>;
	/** New essence balance (kept for balance display) */
	newEssence: number;
}

// ---- Reactive state ----
let saveId = $state<string | null>(null);
let essence = $state(0);
let maxSlots = $state(1);
let slots = $state<SlotState[]>([]);
let displayTime = $state(Date.now());
let isRunning = $state(true);

// ---- Timers & in-flight tracking ----
let tickInterval: ReturnType<typeof setInterval> | null = null;
let displayInterval: ReturnType<typeof setInterval> | null = null;
const tickingSlots = new Set<number>(); // slotIndex values currently awaiting server response

const TICK_MS = 200;
const DISPLAY_MS = 50;

// ---- Public getters (reactive) ----
export function getSaveId() { return saveId; }
export function getEssence() { return essence; }
export function getMaxSlots() { return maxSlots; }
export function getSlots() { return slots; }
export function getDisplayTime() { return displayTime; }
export function getIsRunning() { return isRunning; }

// ---- Setters for child page use ----
export function setEssence(v: number) { essence = v; }
export function setSlots(v: SlotState[]) { slots = v; }
export function setMaxSlots(v: number) { maxSlots = v; }
export function setSaveId(v: string | null) { saveId = v; }

// ---- Hero busy tracking ----

/**
 * Returns a Set of all hero IDs currently "busy" across all active slots.
 * A hero is busy if they are the training hero (actionHeroId) or a scavenging party member (partyHeroIds).
 */
export function getBusyHeroIds(): Set<number> {
	const busy = new Set<number>();
	for (const slot of slots) {
		if (slot.actionHeroId != null) busy.add(slot.actionHeroId);
		for (const id of slot.partyHeroIds) busy.add(id);
	}
	return busy;
}

// ---- Data fetching ----

function saveParam(): string {
	return saveId ? `?saveId=${encodeURIComponent(saveId)}` : '';
}

export async function ensureSave(): Promise<string | null> {
	if (saveId) return saveId;
	const res = await fetch('/api/incremental/saves');
	if (res.ok) {
		const list = await res.json();
		if (list.length > 0) saveId = list[0].id;
	}
	if (!saveId) {
		const w = await fetch('/api/incremental/bank');
		if (w.ok) {
			const data = await w.json();
			saveId = data.saveId ?? null;
			essence = data.essence ?? 0;
		}
	}
	return saveId;
}

export async function fetchBank(): Promise<void> {
	await ensureSave();
	const res = await fetch(`/api/incremental/bank${saveParam()}`);
	if (res.ok) {
		const data = await res.json();
		essence = data.essence ?? 0;
		if (data.saveId) saveId = data.saveId;
	}
}

export async function fetchSlots(): Promise<void> {
	if (!saveId) return;
	const res = await fetch(`/api/incremental/action/slots${saveParam()}`);
	if (res.ok) {
		const data = await res.json();
		maxSlots = data.maxSlots ?? 1;
		slots = (data.slots ?? []).map((s: Record<string, unknown>) => ({
			slotIndex: s.slotIndex as number,
			actionType: s.actionType as string,
			progress: s.progress as number,
			lastTickAt: s.lastTickAt as number,
			actionHeroId: (s.actionHeroId ?? null) as number | null,
			actionStatKey: (s.actionStatKey ?? null) as string | null,
			partyHeroIds: (s.actionPartyHeroIds as number[]) ?? []
		}));
	}
}

// ---- Tick logic ----

async function tickSlot(slot: SlotState): Promise<{ currenciesEarned: Record<string, number> } | null> {
	const now = Date.now();
	const body: Record<string, unknown> = {
		saveId,
		slotIndex: slot.slotIndex,
		lastTickAt: slot.lastTickAt,
		progress: slot.progress,
		actionType: slot.actionType
	};
	if (slot.actionType === 'training' && slot.actionHeroId != null && slot.actionStatKey != null) {
		body.actionHeroId = slot.actionHeroId;
		body.actionStatKey = slot.actionStatKey;
	}
	if (slot.partyHeroIds.length > 0) {
		body.actionPartyHeroIds = slot.partyHeroIds;
	}
	const res = await fetch('/api/incremental/action', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) return null;
	const data = await res.json();
	essence = data.essence ?? essence;
	const idx = slots.findIndex((s) => s.slotIndex === slot.slotIndex);
	if (idx !== -1) {
		slots[idx] = {
			...slots[idx],
			progress: data.progress ?? 0,
			lastTickAt: data.lastTickAt ?? now
		};
	}
	return { currenciesEarned: (data.currenciesEarned as Record<string, number>) ?? {} };
}

function clientTick(): void {
	if (!isRunning || slots.length === 0) return;
	const now = Date.now();

	for (const slot of slots) {
		const dur = getDurationSec(slot.actionType);
		const elapsedSec = (now - slot.lastTickAt) / 1000;
		const deltaProgress = elapsedSec / dur;
		slot.progress = Math.min(1, slot.progress + deltaProgress);
		slot.lastTickAt = now;
	}

	for (const slot of slots) {
		if (slot.progress >= 1 && !tickingSlots.has(slot.slotIndex)) {
			tickingSlots.add(slot.slotIndex);
			tickSlot(slot).finally(() => tickingSlots.delete(slot.slotIndex));
		}
	}
}

// ---- Catch-up after visibility change ----

/** Tick all active slots with the server to catch up after being away. */
export async function catchUpAllSlots(
	heroNameFn: (id: number) => string,
	statLabelFn: (key: string) => string
): Promise<CatchUpResult | null> {
	if (slots.length === 0 || !saveId) return null;

	const now = Date.now();
	const oldestTick = Math.min(...slots.map((s) => s.lastTickAt));
	const awaySeconds = (now - oldestTick) / 1000;

	const slotResults: CatchUpResult['slotResults'] = [];
	const totalCurrenciesEarned: Record<string, number> = {};

	for (const slot of slots) {
		const result = await tickSlot(slot);
		const currencies = result?.currenciesEarned ?? {};
		for (const [k, v] of Object.entries(currencies)) {
			totalCurrenciesEarned[k] = (totalCurrenciesEarned[k] ?? 0) + v;
		}
		const actionLabel = formatSlotLabel(slot, { heroName: heroNameFn, statLabel: statLabelFn });
		slotResults.push({ actionLabel, currenciesEarned: currencies });
	}

	return {
		awaySeconds,
		slotResults,
		totalCurrenciesEarned,
		newEssence: essence
	};
}

// ---- Slot assignment ----

export async function assignSlot(
	slotIndex: number,
	actionType: string,
	heroId?: number,
	statKey?: string,
	partyHeroIds?: number[]
): Promise<boolean> {
	const now = Date.now();
	const body: Record<string, unknown> = {
		saveId,
		slotIndex,
		lastTickAt: now,
		progress: 0,
		actionType
	};
	if (actionType === 'training' && heroId != null && statKey != null) {
		body.actionHeroId = heroId;
		body.actionStatKey = statKey;
	}
	if (partyHeroIds && partyHeroIds.length > 0) {
		body.actionPartyHeroIds = partyHeroIds;
	}
	const res = await fetch('/api/incremental/action', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) return false;
	const data = await res.json();
	essence = data.essence ?? essence;
	const newSlot: SlotState = {
		slotIndex,
		actionType: data.actionType,
		progress: data.progress ?? 0,
		lastTickAt: data.lastTickAt ?? now,
		actionHeroId: data.actionHeroId ?? null,
		actionStatKey: data.actionStatKey ?? null,
		partyHeroIds: (data.actionPartyHeroIds as number[]) ?? []
	};
	const idx = slots.findIndex((s) => s.slotIndex === slotIndex);
	if (idx !== -1) {
		slots[idx] = newSlot;
	} else {
		slots = [...slots, newSlot].sort((a, b) => a.slotIndex - b.slotIndex);
	}
	return true;
}

export async function clearSlot(slotIndex: number): Promise<void> {
	const res = await fetch('/api/incremental/action/slots', {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ saveId, slotIndex })
	});
	if (res.ok) {
		slots = slots.filter((s) => s.slotIndex !== slotIndex);
		tickingSlots.delete(slotIndex);
	}
}

// ---- Display helpers ----

export function slotDisplayProgress(slot: SlotState): number {
	if (!isRunning) return slot.progress;
	const dur = getDurationSec(slot.actionType);
	const elapsedSec = (displayTime - slot.lastTickAt) / 1000;
	return Math.min(1, Math.max(0, slot.progress + elapsedSec / dur));
}

export function slotNextIn(slot: SlotState): number {
	const dp = slotDisplayProgress(slot);
	const dur = getDurationSec(slot.actionType);
	return dp >= 1 ? 0 : Math.max(0, (1 - dp) * dur);
}

// ---- Lifecycle (called by layout) ----

export function startTickLoop(): void {
	if (tickInterval) return; // already running
	displayTime = Date.now();
	tickInterval = setInterval(clientTick, TICK_MS);
	displayInterval = setInterval(() => { displayTime = Date.now(); }, DISPLAY_MS);
}

export function stopTickLoop(): void {
	if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
	if (displayInterval) { clearInterval(displayInterval); displayInterval = null; }
}

/** Pause ticking (e.g. when page hidden). Does NOT clear slot state. */
export function pauseTicking(): void {
	isRunning = false;
}

/** Resume ticking (e.g. when page visible again). */
export function resumeTicking(): void {
	isRunning = true;
	const now = Date.now();
	for (const slot of slots) {
		slot.lastTickAt = now;
	}
}
