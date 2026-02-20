<script lang="ts">
	import { getStatusEffectDef } from '$lib/incremental/constants';
	import type { BuffProp } from './BattleCard.svelte';
	import { STATUS_ICONS } from './game-icons';

	interface Props {
		buff: BuffProp;
		/** Maximum duration for calculating percentage (optional, defaults to buff.duration) */
		maxDuration?: number;
		/** Size of the badge in pixels */
		size?: number;
	}

	let {
		buff,
		maxDuration,
		size = 32
	}: Props = $props();

	const def = $derived(getStatusEffectDef(buff.id));
	const displayName = $derived.by(() => {
		if (!def) return buff.id.replace(/_/g, ' ');
		if (def.stun) return 'Stun';
		if (def.tickDamage) return 'Poison';
		if (def.armorMod) return 'Armor Mod';
		if (def.magicResistMod) return 'MR Mod';
		if (def.healPerSecond) return 'Heal';
		if (def.attackDamageMult) return 'Atk Mod';
		if (def.spellDamageMult) return 'Spell Mod';
		return buff.id.replace(/_/g, ' ');
	});

	const isDebuff = $derived.by(() => {
		if (!def) return false;
		return def.stun || def.tickDamage || 
		       (def.armorMod != null && def.armorMod < 0) ||
		       (def.magicResistMod != null && def.magicResistMod < 0) ||
		       (def.attackDamageMult != null && def.attackDamageMult < 0);
	});

	const badgeColor = $derived.by(() => {
		if (def?.stun) return 'bg-amber-500';
		if (def?.tickDamage) return 'bg-green-600';
		if (isDebuff) return 'bg-red-600';
		return 'bg-blue-600';
	});

	const iconSrc = $derived.by(() => {
		if (def?.stun) return STATUS_ICONS.stun;
		if (def?.tickDamage) return STATUS_ICONS.poison;
		if (def?.healPerSecond) return STATUS_ICONS.heal;
		return STATUS_ICONS.generic;
	});

	// Calculate remaining time percentage for circular timer (0-100, where 100 = full duration remaining)
	const remainingPercent = $derived.by(() => {
		const max = maxDuration ?? buff.duration;
		// Use the current duration (which decreases over time) divided by max
		return max > 0 ? Math.max(0, Math.min(100, (buff.duration / max) * 100)) : 0;
	});

	// Generate description for tooltip
	const description = $derived.by(() => {
		const parts: string[] = [];
		if (def?.stun) parts.push('Stuns target, preventing actions');
		if (def?.tickDamage) {
			const dmg = buff.value ?? 0;
			parts.push(`Deals ${dmg} ${def.tickDamageType ?? 'magical'} damage per second`);
		}
		if (def?.armorMod) {
			const mod = def.armorMod > 0 ? `+${def.armorMod}` : `${def.armorMod}`;
			parts.push(`Armor: ${mod}`);
		}
		if (def?.magicResistMod) {
			const mod = def.magicResistMod > 0 ? `+${Math.round(def.magicResistMod * 100)}%` : `${Math.round(def.magicResistMod * 100)}%`;
			parts.push(`Magic Resist: ${mod}`);
		}
		if (def?.attackDamageMult) {
			const mult = def.attackDamageMult > 0 ? `+${Math.round(def.attackDamageMult * 100)}%` : `${Math.round(def.attackDamageMult * 100)}%`;
			parts.push(`Attack Damage: ${mult}`);
		}
		if (def?.spellDamageMult) {
			const mult = def.spellDamageMult > 0 ? `+${Math.round(def.spellDamageMult * 100)}%` : `${Math.round(def.spellDamageMult * 100)}%`;
			parts.push(`Spell Damage: ${mult}`);
		}
		if (def?.healPerSecond) {
			const heal = buff.value ?? 0;
			parts.push(`Heals ${heal} HP per second`);
		}
		return parts.length > 0 ? parts.join('\n') : 'Status effect';
	});
</script>

<div class="relative group" style="width: {size}px; height: {size}px;">
	<!-- Circular timer background (shadow effect) -->
	<svg class="absolute inset-0 transform -rotate-90" width={size} height={size}>
		<circle
			cx={size / 2}
			cy={size / 2}
			r={(size - 4) / 2}
			fill="none"
			stroke="rgba(0, 0, 0, 0.3)"
			stroke-width="3"
			class="opacity-50"
		/>
		<!-- Timer arc -->
		<circle
			cx={size / 2}
			cy={size / 2}
			r={(size - 4) / 2}
			fill="none"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
			class="transition-all duration-150 {isDebuff ? 'text-red-300' : 'text-blue-300'}"
			stroke-dasharray={2 * Math.PI * ((size - 4) / 2)}
			stroke-dashoffset={2 * Math.PI * ((size - 4) / 2) * (1 - (remainingPercent ?? 0) / 100)}
		/>
	</svg>
	
	<!-- Badge background -->
	<div class="absolute inset-0 rounded-full {badgeColor} flex items-center justify-center text-white font-bold shadow-lg">
		<span class="gi" style="--gi: url({iconSrc}); width: {size * 0.55}px; height: {size * 0.55}px;"></span>
	</div>

	<!-- Duration text overlay -->
	<div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[8px] font-bold text-white bg-black/70 px-1 rounded whitespace-nowrap">
		{buff.duration.toFixed(1)}s
	</div>

	<!-- Tooltip on hover -->
	<div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-48 rounded-lg border border-gray-600 bg-gray-900 p-2 text-xs text-left shadow-xl pointer-events-none">
		<p class="font-semibold text-gray-200 border-b border-gray-600 pb-1 mb-1">{displayName}</p>
		<p class="text-gray-300 whitespace-pre-line">{description}</p>
		<p class="text-gray-400 mt-1 text-[10px]">Duration: {buff.duration.toFixed(1)}s</p>
		{#if buff.value != null}
			<p class="text-gray-400 text-[10px]">Value: {buff.value}</p>
		{/if}
	</div>
</div>
