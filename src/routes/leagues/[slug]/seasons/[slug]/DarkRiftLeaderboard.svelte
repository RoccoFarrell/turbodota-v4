<script lang="ts">
	import type { DarkRiftLeaderboardRow } from '$lib/server/league-leaderboard';

	interface Props {
		leaderboard: DarkRiftLeaderboardRow[];
	}

	let { leaderboard }: Props = $props();
</script>

<div class="bg-gray-900/60 border border-emerald-500/20 backdrop-blur-sm rounded-xl p-6 w-full">
	<!-- Title -->
	<h3 class="text-xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
		Dark Rift Leaderboard
	</h3>

	{#if leaderboard.length === 0 || leaderboard.every((row) => row.runCount === 0)}
		<!-- Empty state -->
		<div class="border-2 border-dashed border-emerald-500/30 rounded-lg p-8 text-center">
			<p class="text-gray-400 text-sm">No runs completed yet</p>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="bg-gray-800/50">
						<th class="text-left text-gray-400 font-medium px-4 py-3">Rank</th>
						<th class="text-left text-gray-400 font-medium px-4 py-3">Player</th>
						<th class="text-right text-gray-400 font-medium px-4 py-3">Deepest Level</th>
						<th class="text-right text-gray-400 font-medium px-4 py-3">Best Lineup DPS</th>
						<th class="text-right text-gray-400 font-medium px-4 py-3">Runs Completed</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-800">
					{#each leaderboard as row (row.accountId)}
						<tr class="hover:bg-gray-800/50 transition-colors">
							<!-- Rank -->
							<td class="px-4 py-3">
								{#if row.rank === 1 && row.runCount > 0}
									<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40">
										<span class="text-emerald-400 font-bold text-sm">1</span>
									</span>
								{:else}
									<span class="text-gray-300 pl-2">{row.rank}</span>
								{/if}
							</td>

							<!-- Player -->
							<td class="px-4 py-3">
								<div class="flex items-center gap-3">
									{#if row.avatarUrl}
										<img
											src={row.avatarUrl}
											alt={row.displayName}
											class="rounded-full h-8 w-8 object-cover"
										/>
									{:else}
										<div class="rounded-full h-8 w-8 bg-gray-700 flex items-center justify-center">
											<span class="text-gray-400 text-xs font-bold">
												{row.displayName.charAt(0).toUpperCase()}
											</span>
										</div>
									{/if}
									<span class={row.rank === 1 && row.runCount > 0 ? 'font-bold text-emerald-400' : 'text-gray-200'}>
										{row.displayName}
									</span>
								</div>
							</td>

							<!-- Deepest Level -->
							<td class="px-4 py-3 text-right">
								{#if row.deepestLevel > 0}
									<span class={row.rank === 1 ? 'text-emerald-400 font-semibold' : 'text-gray-200'}>
										{row.deepestLevel}
									</span>
								{:else}
									<span class="text-gray-500">-</span>
								{/if}
							</td>

							<!-- Best Lineup DPS -->
							<td class="px-4 py-3 text-right">
								{#if row.totalDps > 0}
									<span class="text-gray-200">{row.totalDps.toFixed(1)}</span>
								{:else}
									<span class="text-gray-500">-</span>
								{/if}
							</td>

							<!-- Runs Completed -->
							<td class="px-4 py-3 text-right">
								{#if row.runCount > 0}
									<span class="text-gray-200">{row.runCount}</span>
								{:else}
									<span class="text-gray-500">0</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
