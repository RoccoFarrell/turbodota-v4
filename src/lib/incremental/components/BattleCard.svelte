<script lang="ts">
	import { getStatusEffectDef } from '$lib/incremental/constants';

	/**
	 * Shared battle card for heroes and enemies: name, icon, health bar, armor/MR badges,
	 * attack/spell info, status effects (stun, poison, etc.), hover tooltip with stats and DPS.
	 */
	export type BuffProp = { id: string; duration: number; value?: number };
	export type SpellInfoAbility = {
		id: string;
		displayName: string;
		type: string;
		damageType?: string;
		baseDamage?: number;
		effect?: string;
		/** Passive: e.g. 0.2 = 20% return */
		returnDamageRatio?: number;
		/** From DB (IncrementalHeroAbility.description). */
		description?: string;
	};
	export type SpellInfoActive = {
		abilityId: string;
		displayName: string;
		damageType?: string;
		baseDamage?: number;
		intervalSec: number;
		timer: number;
		progress: number;
	};

	interface Props {
		kind: 'hero' | 'enemy';
		displayName: string;
		currentHp: number;
		maxHp: number;
		armor: number;
		magicResist: number; // 0–1
		/** Visual state: Front Liner (hero) or Target (enemy) */
		selected: boolean;
		selectedClass: string; // e.g. green or red border/glow
		disabled?: boolean;
		onclick?: () => void;
		// Hero-only
		heroId?: number;
		attackDamage?: number;
		attackIntervalSec?: number;
		spellIntervalSec?: number | null;
		attackTimer?: number;
		spellTimer?: number;
		attackProgress?: number; // 0–1
		spellProgress?: number; // 0–1
		/** Spell(s) for this hero: list + which one is on cooldown (active). */
		spellInfo?: { abilities: SpellInfoAbility[]; active?: SpellInfoActive };
		// Enemy-only
		enemyAttackDamage?: number;
		enemyAttackInterval?: number;
		enemyAttackTimer?: number;
		enemyAttackProgress?: number; // 0–1
		/** Status effects on this unit (stun, poison, etc.) for visual feedback and paused timers. */
		buffs?: BuffProp[];
	}

	let {
		kind,
		displayName,
		currentHp,
		maxHp,
		armor,
		magicResist,
		selected,
		selectedClass,
		disabled = false,
		onclick,
		heroId,
		attackDamage = 0,
		attackIntervalSec = 0,
		spellIntervalSec = null,
		attackTimer = 0,
		spellTimer = 0,
		attackProgress = 0,
		spellProgress = 0,
		spellInfo,
		enemyAttackDamage = 0,
		enemyAttackInterval = 0,
		enemyAttackTimer = 0,
		enemyAttackProgress = 0,
		buffs = []
	}: Props = $props();

	const buffsList = $derived(buffs ?? []);
	const isStunned = $derived(
		buffsList.some((b) => getStatusEffectDef(b.id)?.stun === true)
	);
	/** For UI: label and style per buff (e.g. Stun 1.2s, Poison 3.0s). */
	const statusBadges = $derived(
		buffsList.map((b) => {
			const def = getStatusEffectDef(b.id);
			const label = def?.stun ? 'Stun' : b.id.replace(/_/g, ' ');
			const name = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
			return { id: b.id, duration: b.duration, name, isStun: def?.stun === true };
		})
	);

	// Explicit $derived so health bar and text update when props change (fixes stale display)
	const hpPercent = $derived(maxHp > 0 ? Math.min(1, Math.max(0, currentHp / maxHp)) : 0);
	const currentHpDisplay = $derived(currentHp.toFixed(2));
	const mrPercent = $derived(Math.round(magicResist * 100));

	/** DPS: damage per second from auto-attacks */
	const atkDps =
		kind === 'hero'
			? attackIntervalSec > 0
				? attackDamage / attackIntervalSec
				: 0
			: enemyAttackInterval > 0
				? enemyAttackDamage / enemyAttackInterval
				: 0;

	/** One-line description for an ability (effect + damage). */
	function abilityLine(ab: SpellInfoAbility): string {
		const parts: string[] = [];
		if (ab.returnDamageRatio != null)
			parts.push(`return ${Math.round(ab.returnDamageRatio * 100)}% ${ab.damageType ?? 'dmg'}`);
		if (ab.baseDamage != null) parts.push(`${ab.baseDamage} ${ab.damageType ?? 'dmg'}`);
		if (ab.effect) parts.push(ab.effect.replace(/_/g, ' '));
		if (ab.type === 'passive' && parts.length === 0) parts.push('passive');
		return parts.length ? parts.join(' · ') : ab.type;
	}

	const hasSpells = $derived(
		kind === 'hero' && ((spellInfo?.abilities?.length ?? 0) > 0 || spellIntervalSec != null)
	);
</script>

<button
	type="button"
	class="group rounded-lg border-2 p-3 w-[168px] min-w-[168px] max-w-[168px] box-border text-left transition relative
		{selected ? selectedClass : 'border-gray-300 dark:border-gray-600'}
		{disabled ? 'pointer-events-none opacity-90' : ''}
		{currentHp <= 0 ? 'opacity-60' : ''}"
	disabled={disabled || currentHp <= 0}
	onclick={onclick}
	title={displayName}
>
	<!-- Armor / MR badges -->
	<div class="absolute top-2 right-2 flex gap-1">
		<span
			class="rounded px-1.5 py-0.5 text-[10px] font-medium bg-gray-600 text-gray-200"
			title="Armor (reduces physical damage)"
		>
			🛡 {armor}
		</span>
		<span
			class="rounded px-1.5 py-0.5 text-[10px] font-medium bg-purple-700 text-purple-100"
			title="Magic resist"
		>
			✨ {mrPercent}%
		</span>
	</div>

	<div class="flex items-center gap-2 pr-16">
		{#if kind === 'hero' && heroId != null}
			<i
				class="d2mh hero-{heroId} shrink-0 w-9 h-9 rounded bg-gray-700"
				title={displayName}
				aria-hidden="true"
			></i>
		{:else}
			<div
				class="shrink-0 w-9 h-9 rounded bg-gray-600 flex items-center justify-center text-lg font-bold text-gray-300"
				title={displayName}
			>
				{displayName.charAt(0)}
			</div>
		{/if}
		<div class="min-w-0">
			<div class="font-medium text-gray-800 dark:text-gray-200 truncate">
				{displayName}{#if selected} <span class="font-semibold">({kind === 'hero' ? 'Front Liner' : 'Target'})</span>{/if}
			</div>
		</div>
	</div>

	<!-- Health bar (red) -->
	<div class="mt-2">
		<div class="h-4 w-full rounded bg-gray-800 dark:bg-gray-900 overflow-hidden border border-gray-700">
			<div
				class="h-full rounded-l transition-all bg-red-600"
				style="width: {hpPercent * 100}%"
			></div>
		</div>
		<p class="text-xs text-gray-400 mt-0.5">
			{currentHpDisplay} / {maxHp} HP
		</p>
	</div>

	<!-- Status effects: stun, poison, etc. (any unit) -->
	{#if statusBadges.length > 0}
		<div class="mt-1.5 flex flex-wrap gap-1">
			{#each statusBadges as badge}
				<span
					class="rounded px-1.5 py-0.5 text-[10px] font-semibold {badge.isStun
						? 'bg-amber-500/90 text-amber-950'
						: 'bg-gray-600 text-gray-200'}"
					title="{badge.name} — {badge.duration.toFixed(1)}s remaining"
				>
					{#if badge.isStun}⏸ {/if}{badge.name} {badge.duration.toFixed(1)}s
				</span>
			{/each}
		</div>
	{/if}

	{#if kind === 'hero'}
		<!-- Attack bar (paused when stunned) -->
		<div class="mt-2 space-y-1">
			<div
				class="relative rounded {isStunned ? 'bg-amber-900/40 border border-amber-600/60' : ''}"
				class:opacity-60={isStunned}
			>
				{#if isStunned}
					<div class="absolute inset-0 flex items-center justify-center z-1 text-amber-400 text-[10px] font-bold">
						⏸ Stunned — timers paused
					</div>
				{/if}
				<div class="flex items-center gap-1 {isStunned ? 'pointer-events-none' : ''}">
					<div class="h-2 flex-1 rounded bg-gray-700 overflow-hidden">
						<div
							class="h-full rounded bg-amber-500 transition-all"
							style="width: {attackProgress * 100}%"
						></div>
					</div>
					<span class="text-[10px] text-amber-400 w-14 truncate" title="Attack timer">
						{attackTimer.toFixed(1)}/{attackIntervalSec.toFixed(1)}s
					</span>
				</div>
			</div>

			<!-- Spells: one card per ability (paused when stunned) -->
			{#if hasSpells}
				<div class="mt-2 border-t border-gray-600 pt-1.5 {isStunned ? 'opacity-70' : ''}">
					{#if isStunned}
						<p class="text-[10px] text-amber-400 font-medium mb-1">⏸ Spells paused (stunned)</p>
					{/if}
					<p class="text-[10px] font-semibold text-blue-400 uppercase tracking-wide mb-1.5">Spells</p>
					{#if (spellInfo?.abilities?.length ?? 0) > 0}
						<div class="space-y-1.5">
							{#each spellInfo?.abilities ?? [] as ab}
								{@const isCasting = spellInfo?.active?.abilityId === ab.id}
								<div
									class="rounded border p-1.5 text-[10px] min-w-0 {isCasting
										? 'border-blue-500 bg-blue-900/30'
										: 'border-gray-600 bg-gray-800/50'}"
								>
									<p class="font-medium text-blue-300 truncate" title={ab.displayName}>{ab.displayName}</p>
									<p class="text-gray-400 mt-0.5">{abilityLine(ab)}</p>
									{#if ab.description}
										<p class="text-gray-500 mt-0.5 italic">{ab.description}</p>
									{/if}
									{#if isCasting && spellInfo?.active}
										<div class="mt-1 pt-1 border-t border-gray-600">
											<p class="text-blue-200 font-medium">Casting — {spellInfo.active.timer.toFixed(1)}/{spellInfo.active.intervalSec.toFixed(1)}s</p>
											<div class="h-1.5 w-full rounded bg-gray-700 overflow-hidden mt-0.5">
												<div
													class="h-full rounded bg-blue-500 transition-all"
													style="width: {spellInfo.active.progress * 100}%"
												></div>
											</div>
										</div>
									{:else if ab.type === 'passive' && ab.returnDamageRatio != null}
										<p class="text-amber-400/90 mt-0.5">Proc: on damage taken</p>
									{/if}
								</div>
							{/each}
						</div>
					{:else if spellIntervalSec != null}
						<div class="rounded border border-gray-600 bg-gray-800/50 p-1.5">
							<p class="text-[10px] text-blue-300/80">Cooldown</p>
							<div class="flex items-center gap-1 mt-0.5">
								<div class="h-2 flex-1 rounded bg-gray-700 overflow-hidden">
									<div
										class="h-full rounded bg-blue-500 transition-all"
										style="width: {spellProgress * 100}%"
									></div>
								</div>
								<span class="text-[10px] text-blue-400">{spellTimer.toFixed(1)}/{spellIntervalSec.toFixed(1)}s</span>
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<p class="text-[10px] text-gray-500 mt-1">Spell: —</p>
			{/if}
		</div>
	{:else}
		<!-- Enemy: attack timer (paused when stunned) -->
		<div class="mt-2">
			<div
				class="relative rounded {isStunned ? 'bg-amber-900/40 border border-amber-600/60' : ''}"
				class:opacity-60={isStunned}
			>
				{#if isStunned}
					<div class="absolute inset-0 flex items-center justify-center z-1 text-amber-400 text-[10px] font-bold">
						⏸ Stunned — attack paused
					</div>
				{/if}
				<div class="flex items-center gap-1 {isStunned ? 'pointer-events-none' : ''}">
					<div class="h-2 flex-1 rounded bg-gray-700 overflow-hidden">
						<div
							class="h-full rounded bg-amber-600 transition-all"
							style="width: {enemyAttackProgress * 100}%"
						></div>
					</div>
					<span class="text-[10px] text-amber-400">
						{enemyAttackTimer.toFixed(1)}/{enemyAttackInterval.toFixed(1)}s
					</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Hover tooltip: stats + DPS -->
	<div
		class="absolute left-0 bottom-full mb-1 hidden group-hover:block z-10 w-56 rounded-lg border border-gray-600 bg-gray-800 p-2 text-xs text-left shadow-xl"
		role="tooltip"
	>
		<p class="font-semibold text-gray-200 border-b border-gray-600 pb-1">{displayName}</p>
		<p class="text-gray-400">HP: {currentHpDisplay} / {maxHp} · Armor: {armor} · MR: {mrPercent}%</p>
		{#if statusBadges.length > 0}
			<p class="text-amber-400 mt-0.5 font-medium">Status: {statusBadges.map((b) => `${b.name} ${b.duration.toFixed(1)}s`).join(', ')}</p>
		{/if}
		{#if kind === 'hero'}
			<p class="text-amber-400 mt-1">Atk: {attackDamage} dmg every {attackIntervalSec.toFixed(2)}s</p>
			<p class="text-amber-300 font-medium">Auto-attack DPS: {atkDps.toFixed(1)}</p>
			{#if (spellInfo?.abilities?.length ?? 0) > 0}
				<p class="text-blue-400 mt-0.5 font-medium">Spells:</p>
				{#each spellInfo?.abilities ?? [] as ab}
					<p class="text-blue-300 text-[11px] pl-1">
						{ab.displayName}
						{#if ab.baseDamage != null}<span class="text-blue-200"> — {ab.baseDamage} {ab.damageType ?? 'dmg'}</span>{/if}
						{#if ab.effect}<span class="text-gray-400"> ({ab.effect})</span>{/if}
					</p>
				{/each}
				{#if spellInfo?.active}
					<p class="text-blue-200 mt-0.5">Next cast: {spellInfo.active.displayName} in {(spellInfo.active.intervalSec - spellInfo.active.timer).toFixed(1)}s</p>
				{/if}
			{:else if spellIntervalSec != null}
				<p class="text-blue-400 mt-0.5">Spell: {spellIntervalSec.toFixed(1)}s CD</p>
			{/if}
		{:else}
			<p class="text-amber-400 mt-1">Atk: {enemyAttackDamage} dmg every {enemyAttackInterval.toFixed(2)}s</p>
			<p class="text-amber-300 font-medium">DPS: {atkDps.toFixed(1)}</p>
		{/if}
	</div>
</button>
