<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import { TRAINING_BUILDINGS, type TrainingStatKey, TRAINING_STAT_KEYS } from '$lib/incremental/actions/constants';
	import type { ItemDef, ItemTarget } from '$lib/incremental/constants/item-definitions';

	interface Props {
		open: boolean;
		onOpenChange: (details: { open: boolean }) => void;
		itemDef: ItemDef;
		quantity: number;
		saveId: string | null;
		rosterHeroIds: number[];
		heroNameFn: (heroId: number) => string;
		onUsed?: (result: Record<string, unknown>) => void;
	}

	let {
		open,
		onOpenChange,
		itemDef,
		quantity,
		saveId,
		rosterHeroIds,
		heroNameFn,
		onUsed
	}: Props = $props();

	// ---- Local state ----
	let selectedTarget = $state<ItemTarget | null>(null);
	let selectedHeroId = $state<number | null>(null);
	let selectedStatKey = $state<TrainingStatKey | null>(null);
	let submitting = $state(false);
	let resultMessage = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);

	function reset() {
		selectedTarget = null;
		selectedHeroId = null;
		selectedStatKey = null;
		submitting = false;
		resultMessage = null;
		errorMessage = null;
	}

	function handleOpenChange(details: { open: boolean }) {
		if (!details.open) reset();
		onOpenChange(details);
	}

	function canSubmit(): boolean {
		if (!selectedTarget || submitting) return false;
		if (selectedTarget === 'training') {
			return selectedHeroId != null && selectedStatKey != null;
		}
		return true;
	}

	function targetLabel(target: ItemTarget): string {
		if (target === 'mining') return 'Mining (1hr Essence)';
		if (target === 'training') return 'Training (1hr on a hero stat)';
		return target;
	}

	function statLabel(key: TrainingStatKey): string {
		return TRAINING_BUILDINGS[key]?.name ?? key;
	}

	async function submit() {
		if (!canSubmit() || !saveId) return;
		submitting = true;
		errorMessage = null;
		resultMessage = null;

		try {
			const body: Record<string, unknown> = {
				saveId,
				itemId: itemDef.id,
				targetType: selectedTarget
			};
			if (selectedTarget === 'training') {
				body.targetHeroId = selectedHeroId;
				body.targetStatKey = selectedStatKey;
			}

			const res = await fetch('/api/incremental/items/use', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				errorMessage = data.message || `Failed (${res.status})`;
				return;
			}

			const data = await res.json();

			if (selectedTarget === 'mining') {
				resultMessage = `Applied 1hr of mining: +${data.completions ?? 0} completions. Essence: ${data.essence ?? 0}`;
			} else if (selectedTarget === 'training' && selectedHeroId != null && selectedStatKey) {
				resultMessage = `Applied 1hr of ${statLabel(selectedStatKey)} training on ${heroNameFn(selectedHeroId)}. New value: ${Number(data.newTrainingValue ?? 0).toFixed(1)}`;
			} else {
				resultMessage = 'Item used successfully.';
			}

			onUsed?.(data);
		} catch (err) {
			errorMessage = 'Network error. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog
	open={open}
	onOpenChange={handleOpenChange}
>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
			<Dialog.Content class="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-6 space-y-4">
				<div class="text-center">
					<Dialog.Title class="text-xl font-bold text-gray-900 dark:text-gray-100">
						Use {itemDef.name}
					</Dialog.Title>
					<Dialog.Description class="text-sm text-gray-500 dark:text-gray-400 mt-1">
						{itemDef.description}
					</Dialog.Description>
					<p class="text-xs text-gray-400 mt-1">You have {quantity}</p>
				</div>

				{#if resultMessage}
					<!-- Success state -->
					<div class="rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-4 py-3 text-center">
						<p class="text-sm font-medium text-green-800 dark:text-green-200">{resultMessage}</p>
					</div>
					<Dialog.CloseTrigger
						class="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
					>
						Close
					</Dialog.CloseTrigger>
				{:else}
					<!-- Target selection -->
					<div class="space-y-3">
						<p class="text-sm font-medium text-gray-700 dark:text-gray-300">Apply to:</p>
						<div class="flex flex-col gap-2">
							{#each itemDef.applicableTargets as target}
								<button
									type="button"
									class="w-full text-left rounded-lg border px-4 py-3 text-sm font-medium transition-colors {selectedTarget === target
										? 'border-primary bg-primary/10 text-primary'
										: 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}"
									onclick={() => { selectedTarget = target; }}
								>
									{targetLabel(target)}
								</button>
							{/each}
						</div>
					</div>

					<!-- Training sub-selectors -->
					{#if selectedTarget === 'training'}
						<div class="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
							<div>
								<label for="hero-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hero</label>
								<select
									id="hero-select"
									class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
									value={selectedHeroId ?? ''}
									onchange={(e) => { selectedHeroId = Number(e.currentTarget.value) || null; }}
								>
									<option value="">Select a hero...</option>
									{#each rosterHeroIds as heroId}
										<option value={heroId}>{heroNameFn(heroId)}</option>
									{/each}
								</select>
							</div>
							<div>
								<label for="stat-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stat</label>
								<select
									id="stat-select"
									class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
									value={selectedStatKey ?? ''}
									onchange={(e) => { selectedStatKey = (e.currentTarget.value || null) as TrainingStatKey | null; }}
								>
									<option value="">Select a stat...</option>
									{#each TRAINING_STAT_KEYS as key}
										<option value={key}>{statLabel(key)}</option>
									{/each}
								</select>
							</div>
						</div>
					{/if}

					{#if errorMessage}
						<div class="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-2 text-center">
							<p class="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
						</div>
					{/if}

					<!-- Confirm -->
					{#if selectedTarget}
						<button
							type="button"
							class="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
							disabled={!canSubmit()}
							onclick={submit}
						>
							{#if submitting}
								Using...
							{:else if selectedTarget === 'mining'}
								Use 1 {itemDef.name} for 1hr Mining
							{:else if selectedTarget === 'training' && selectedHeroId != null && selectedStatKey}
								Use 1 {itemDef.name} for 1hr {statLabel(selectedStatKey)} on {heroNameFn(selectedHeroId)}
							{:else}
								Select hero and stat
							{/if}
						</button>
					{/if}

					<Dialog.CloseTrigger
						class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
					>
						Cancel
					</Dialog.CloseTrigger>
				{/if}
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>
