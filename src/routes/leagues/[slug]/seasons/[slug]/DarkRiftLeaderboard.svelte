<script lang="ts">
	import type { DarkRiftLeaderboardRow } from '$lib/server/league-leaderboard';

	interface Props {
		leaderboard: DarkRiftLeaderboardRow[];
	}

	let { leaderboard }: Props = $props();
</script>

<section class="rounded-xl border border-emerald-500/20 bg-gray-900/60 backdrop-blur-sm overflow-hidden w-full">
	<header class="px-6 py-4 border-b border-emerald-500/10">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<h2 class="text-lg font-bold text-gray-100">Dark Rift Leaderboard</h2>
				{#if leaderboard.length > 0}
					<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-300">
						{leaderboard.length} players
					</span>
				{/if}
			</div>
		</div>
	</header>

	{#if leaderboard.length > 0}
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="bg-gray-800/50 text-left">
						<th class="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400 w-16">Rank</th>
						<th class="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Player</th>
						<th class="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">Deepest Level</th>
						<th class="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">Best DPS</th>
						<th class="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">Runs</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-800">
					{#each leaderboard as entry (entry.accountId)}
						<tr class={entry.rank === 1
							? 'bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors'
							: 'hover:bg-gray-800/50 transition-colors'}>
							<td class="py-3 px-4">
								{#if entry.rank === 1}
									<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20">
										{entry.rank}
									</span>
								{:else if entry.rank === 2}
									<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-gray-200 font-bold text-sm">
										{entry.rank}
									</span>
								{:else if entry.rank === 3}
									<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-700/60 text-gray-300 font-bold text-sm">
										{entry.rank}
									</span>
								{:else}
									<span class="inline-flex items-center justify-center w-8 h-8 text-gray-400 font-medium text-sm">
										{entry.rank}
									</span>
								{/if}
							</td>
							<td class="py-3 px-4">
								<div class="flex items-center gap-3">
									{#if entry.avatarUrl}
										<img
											class="w-8 h-8 rounded-full shrink-0 {entry.rank === 1 ? 'ring-2 ring-emerald-400/50' : ''}"
											src={entry.avatarUrl}
											alt=""
										/>
									{:else}
										<div class="w-8 h-8 rounded-full shrink-0 bg-gray-700 flex items-center justify-center {entry.rank === 1 ? 'ring-2 ring-emerald-400/50' : ''}">
											<svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
											</svg>
										</div>
									{/if}
									<span class="font-medium {entry.rank === 1 ? 'text-emerald-200' : 'text-gray-200'}">{entry.displayName}</span>
								</div>
							</td>
							<td class="py-3 px-4 text-right">
								<span class="font-bold {entry.rank === 1 ? 'text-emerald-300' : 'text-gray-200'}">
									{entry.deepestLevel}
								</span>
							</td>
							<td class="py-3 px-4 text-right">
								<span class="text-gray-300 tabular-nums">{entry.totalDps.toFixed(1)}</span>
							</td>
							<td class="py-3 px-4 text-right">
								<span class="text-gray-400">{entry.runCount}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="p-12 text-center">
			<div class="rounded-xl border border-dashed border-emerald-500/30 p-8 max-w-md mx-auto">
				<svg class="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
				</svg>
				<p class="text-gray-400 font-medium mb-1">No leaderboard data yet</p>
				<p class="text-sm text-gray-500">Complete Dark Rift runs during an active season to appear on the leaderboard.</p>
			</div>
		</div>
	{/if}
</section>
