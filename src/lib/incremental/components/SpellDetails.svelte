<script lang="ts">
	import type { AbilityDef } from '$lib/incremental/types';
	import {
		abilityDisplayName,
		humanizeTrigger,
		humanizeTarget,
		humanizeEffect,
		damageTypeColor,
		spellIconStyle
	} from './spell-details-utils';

	// ── Props ──
	interface Props {
		abilities: (AbilityDef | null | undefined)[];
		/** 'tavern' uses warm stone/amber tones; 'default' uses neutral grays */
		theme?: 'default' | 'tavern';
	}
	const { abilities, theme = 'default' }: Props = $props();

	function damageTypeLabel(dt: string): string {
		return dt.charAt(0).toUpperCase() + dt.slice(1);
	}

	const validAbilities = $derived(abilities.filter((a): a is AbilityDef => a != null));
</script>

{#if validAbilities.length > 0}
	<div class="spell-details" class:spell-details--tavern={theme === 'tavern'}>
		{#each validAbilities as ability, i}
			<div
				class="spell-card"
				class:spell-card--active={ability.type === 'active'}
				class:spell-card--passive={ability.type === 'passive'}
				style="animation-delay: {i * 60}ms;"
			>
				<!-- Left edge: type indicator bar -->
				<div class="spell-card__edge" aria-hidden="true"></div>

				<div class="spell-card__body">
					<!-- Row 1: Icon + Name + Type badge -->
					<div class="spell-card__header">
						<div
							class="spell-icon spell-icon--sm spell-card__icon"
							style={spellIconStyle(ability.id)}
							title={abilityDisplayName(ability)}
							aria-hidden="true"
						></div>
						<div class="spell-card__title-group">
							<h4 class="spell-card__name">{abilityDisplayName(ability)}</h4>
							<span
								class="spell-card__type-badge"
								class:spell-card__type-badge--active={ability.type === 'active'}
								class:spell-card__type-badge--passive={ability.type === 'passive'}
							>
								{ability.type}
							</span>
						</div>
					</div>

					<!-- Row 2: Description -->
					{#if ability.description}
						<p class="spell-card__desc">{ability.description}</p>
					{/if}

					<!-- Row 3: Stat pills -->
					<div class="spell-card__stats">
						<!-- Trigger -->
						<span class="spell-stat" title="Trigger condition">
							<svg class="spell-stat__icon" viewBox="0 0 16 16" fill="currentColor">
								<path d="M8 1a.5.5 0 0 1 .5.5v5.793l3.854 3.853a.5.5 0 0 1-.708.708l-4-4A.5.5 0 0 1 7.5 7.5v-6A.5.5 0 0 1 8 1z"/>
								<path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
							</svg>
							{humanizeTrigger(ability.trigger)}
						</span>

						<!-- Target -->
						{#if humanizeTarget(ability.target)}
							<span class="spell-stat" title="Target">
								<svg class="spell-stat__icon" viewBox="0 0 16 16" fill="currentColor">
									<path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm0 2a5 5 0 1 0 0 10A5 5 0 0 0 8 3zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
								</svg>
								{humanizeTarget(ability.target)}
							</span>
						{/if}

						<!-- Damage type + base damage -->
						{#if ability.damageType}
							<span class="spell-stat {damageTypeColor(ability.damageType)}" title="Damage type">
								<svg class="spell-stat__icon" viewBox="0 0 16 16" fill="currentColor">
									<path d="M8 16c3.314 0 6-2.686 6-6s-6-10-6-10S2 6.686 2 10s2.686 6 6 6zm0-1c-2.76 0-5-2.24-5-5s5-9 5-9 5 6.24 5 9-2.24 5-5 5z"/>
								</svg>
								{damageTypeLabel(ability.damageType)}
								{#if ability.baseDamage != null}
									<span class="spell-stat__value">{ability.baseDamage}</span>
								{/if}
							</span>
						{/if}

						<!-- Return damage (passives) -->
						{#if ability.returnDamageRatio != null}
							<span class="spell-stat spell-dmg--physical" title="Damage reflected back to attacker">
								<svg class="spell-stat__icon" viewBox="0 0 16 16" fill="currentColor">
									<path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 1 1 .908-.418A6 6 0 1 1 8 2v1z"/>
									<path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
								</svg>
								Reflects {Math.round(ability.returnDamageRatio * 100)}%
							</span>
						{/if}

						<!-- Effect -->
						{#if humanizeEffect(ability.effect)}
							<span class="spell-stat spell-stat--effect" title="Special effect">
								<svg class="spell-stat__icon" viewBox="0 0 16 16" fill="currentColor">
									<path d="M5.52.359A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .474.658L8.694 6H12.5a.5.5 0 0 1 .395.807l-7 9a.5.5 0 0 1-.873-.454L6.823 9.5H3.5a.5.5 0 0 1-.48-.641l2.5-8.5z"/>
								</svg>
								{humanizeEffect(ability.effect)}
							</span>
						{/if}

						<!-- Status effect on hit -->
						{#if ability.statusEffectOnHit}
							<span class="spell-stat spell-stat--status" title="Applies status effect">
								<svg class="spell-stat__icon" viewBox="0 0 16 16" fill="currentColor">
									<path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5zM4.884 12.632a.5.5 0 0 1-.17-.921C5.728 11.118 6.8 10.5 8 10.5s2.272.618 3.286 1.211a.5.5 0 0 1-.572.822C9.8 12.032 8.9 11.5 8 11.5s-1.8.532-2.714 1.033a.5.5 0 0 1-.402.1z"/>
								</svg>
								{ability.statusEffectOnHit.statusEffectId.replace(/_/g, ' ')} ({ability.statusEffectOnHit.duration}s)
							</span>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	/* ── Container ── */
	.spell-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* ── Card ── */
	.spell-card {
		display: flex;
		border-radius: 0.5rem;
		overflow: hidden;
		opacity: 0;
		animation: spell-card-enter 0.3s ease-out forwards;
	}

	@keyframes spell-card-enter {
		from {
			opacity: 0;
			transform: translateX(-6px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Default theme card bg */
	.spell-card {
		background: rgba(31, 41, 55, 0.5); /* gray-800/50 */
		border: 1px solid rgba(75, 85, 99, 0.4); /* gray-600/40 */
	}

	/* Tavern theme card bg */
	.spell-details--tavern .spell-card {
		background: rgba(30, 24, 18, 0.6);
		border: 1px solid rgba(120, 80, 30, 0.2);
	}

	/* ── Type indicator edge (left bar) ── */
	.spell-card__edge {
		width: 3px;
		flex-shrink: 0;
	}
	.spell-card--active .spell-card__edge {
		background: linear-gradient(180deg, #60a5fa, #3b82f6); /* blue-400 → blue-500 */
	}
	.spell-card--passive .spell-card__edge {
		background: linear-gradient(180deg, #fbbf24, #d97706); /* amber-400 → amber-600 */
	}

	/* ── Card body ── */
	.spell-card__body {
		flex: 1;
		min-width: 0;
		padding: 0.5rem 0.625rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	/* ── Header row ── */
	.spell-card__header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.spell-card__icon {
		flex-shrink: 0;
	}
	/* Override the border color in tavern theme */
	.spell-details--tavern .spell-card__icon {
		border-color: rgba(180, 120, 40, 0.4);
	}

	.spell-card__title-group {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		min-width: 0;
		flex: 1;
	}

	.spell-card__name {
		font-size: 0.8125rem; /* 13px */
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: #e5e7eb; /* gray-200 */
	}
	.spell-details--tavern .spell-card__name {
		color: #fef3c7; /* amber-100 */
	}

	/* ── Type badge ── */
	.spell-card__type-badge {
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 1px 5px;
		border-radius: 3px;
		flex-shrink: 0;
	}
	.spell-card__type-badge--active {
		background: rgba(59, 130, 246, 0.2); /* blue-500/20 */
		color: #93c5fd; /* blue-300 */
	}
	.spell-card__type-badge--passive {
		background: rgba(245, 158, 11, 0.2); /* amber-500/20 */
		color: #fcd34d; /* amber-300 */
	}

	/* ── Description ── */
	.spell-card__desc {
		font-size: 0.6875rem; /* 11px */
		line-height: 1.4;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		color: #9ca3af; /* gray-400 */
	}
	.spell-details--tavern .spell-card__desc {
		color: #a8a29e; /* stone-400 */
	}

	/* ── Stat pills row ── */
	.spell-card__stats {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 2px;
	}

	.spell-stat {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 10px;
		font-weight: 500;
		padding: 1px 6px;
		border-radius: 3px;
		background: rgba(55, 65, 81, 0.5); /* gray-700/50 */
		color: #d1d5db; /* gray-300 */
	}
	.spell-details--tavern .spell-stat {
		background: rgba(42, 33, 24, 0.7);
		color: #d6d3d1; /* stone-300 */
	}

	.spell-stat__icon {
		width: 10px;
		height: 10px;
		flex-shrink: 0;
		opacity: 0.6;
	}

	.spell-stat__value {
		font-weight: 700;
		margin-left: 1px;
	}

	/* ── Damage type coloring ── */
	.spell-dmg--physical {
		color: #fbbf24; /* amber-400 */
	}
	.spell-dmg--magical {
		color: #a78bfa; /* violet-400 */
	}
	.spell-dmg--pure {
		color: #e2e8f0; /* slate-200 */
	}
	.spell-dmg--physical .spell-stat__value,
	.spell-dmg--magical .spell-stat__value,
	.spell-dmg--pure .spell-stat__value {
		color: inherit;
	}

	/* ── Effect pill ── */
	.spell-stat--effect {
		color: #6ee7b7; /* emerald-300 */
	}

	/* ── Status effect pill ── */
	.spell-stat--status {
		color: #f87171; /* red-400 */
	}
</style>
