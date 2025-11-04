<script lang="ts">
    import { getModalStore } from '@skeletonlabs/skeleton';
    const modalStore = getModalStore();

    interface Props {
        players?: {
        user: {
            username: string;
            avatar_url: string | null;
        };
        stats: {
            gold: number;
            xp: number;
            wins: number;
            losses: number;
            discards: number;
            avgBounty?: {
                gold: number;
                xp: number;
            };
        };
        currentHand: {
            id: number;
            localized_name: string;
            xp: number;
            gold: number;
        }[];
    }[];
    }

    let { players = [] }: Props = $props();
</script>

<div class="card p-4 w-full max-w-3/4">
    <header class="flex justify-between items-center mb-4">
        <h2 class="h2 text-primary-500">Leaderboard</h2>
        <button class="btn btn-sm variant-filled-surface" onclick={() => modalStore.close()}>✕</button>
    </header>

    <div class="table-container">
        {#if players.length > 0}
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th class="bg-amber-500/20">XP</th>
                        <th>Gold</th>
                        <th>Wins</th>
                        <th>Losses</th>
                        <th>Discards</th>
                        <th>Avg Bounty</th>
                        <th>Current Hand</th>
                    </tr>
                </thead>
                <tbody>
                    {#each players.sort((a, b) => b.stats.xp - a.stats.xp) as player, i}
                        <tr>
                            <td>{i + 1}</td>
                            <td class="flex items-center gap-2">
                                {#if player.user.avatar_url}
                                    <img src={player.user.avatar_url} alt="avatar" class="w-6 h-6 rounded-full" />
                                {/if}
                                {player.user.username}
                            </td>
                            <td class="text-blue-400 font-bold bg-amber-500/20">{player.stats.xp}xp</td>
                            <td class="text-yellow-400 font-bold">{player.stats.gold}g</td>
                            <td class="text-green-400">{player.stats.wins}</td>
                            <td class="text-red-400">{player.stats.losses}</td>
                            <td class="text-surface-400">{player.stats.discards}</td>
                            <td>
                                {#if player.stats.avgBounty}
                                    <span class="text-yellow-400">{player.stats.avgBounty.gold}g</span>
                                    /
                                    <span class="text-blue-400">{player.stats.avgBounty.xp}xp</span>
                                {:else}
                                    -
                                {/if}
                            </td>
                            <td class="flex gap-1">
                                {#each player.currentHand as hero}
                                    <div class="relative h-12 w-12 border-lime-700 border-2 rounded-lg">
                                        <div class="w-full h-4 transition-all duration-200 relative flex items-center justify-center mt-2">
                                            <i class={`d2mh hero-${hero.id}`} title={hero.localized_name}></i>
                                        </div>
                                        <div class="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-blue-500 border border-blue-400 flex items-center justify-center">
                                            <span class="text-[8px] font-bold text-black">{hero.xp}</span>
                                        </div>
                                        <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 border border-yellow-400 flex items-center justify-center">
                                            <span class="text-[8px] font-bold text-black">{hero.gold}</span>
                                        </div>
                                    </div>
                                {/each}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {:else}
            <p class="text-center p-4">Loading leaderboard data...</p>
        {/if}
    </div>
</div> 