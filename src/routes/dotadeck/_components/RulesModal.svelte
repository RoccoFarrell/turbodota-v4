<script lang="ts">
    import { getModalStore } from '@skeletonlabs/skeleton';
    const modalStore = getModalStore();
</script>

<div class="card p-4 w-full max-w-3xl">
    <header class="flex justify-between items-center mb-4">
        <h2 class="h2 text-primary-500">DotaDeck Rules</h2>
        <button class="btn btn-sm variant-filled-surface" on:click={() => modalStore.close()}>✕</button>
    </header>

    <div class="space-y-2">
        <section>
            <h3 class="h3 text-primary-400 mb-2">Overview</h3>
            <p>DotaDeck is a card game where you draw heroes and play matches with them to earn rewards.</p>
        </section>

        <section>
            <h3 class="h3 text-primary-400 mb-2">Drawing Cards</h3>
            <ul class="list-disc list-inside space-y-2">
                <li>Each player has a hand of up to 3 hero cards</li>
                <li>Draw a hero card by clicking the "Draw" button in an empty slot</li>
                <li>Each hero card starts with base stats of 100 XP and 100 Gold</li>
            </ul>
        </section>

        <section>
            <h3 class="h3 text-primary-400 mb-2">Playing Matches</h3>
            <ul class="list-disc list-inside space-y-2">
                <li>Play a Dota 2 match with any hero in your hand</li>
                <li>Click "Check for Wins" to see if you've won with your heroes</li>
                <li>Winning a match adds the gold and xp to your user stats and resets the hero's stats to 100/100</li>
                <li>Losing a match adds +50 XP and +50 Gold</li>
                <li>When you win with a hero, their current XP and Gold are added to your total score</li>
            </ul>
        </section>

        <section>
            <h3 class="h3 text-primary-400 mb-2">Scoring</h3>
            <ul class="list-disc list-inside space-y-2">
                <li>Your total score consists of accumulated Gold and XP from successful hero matches</li>
                <li>The higher a hero's stats when you win with them, the more points you earn</li>
                <li>Strategy tip: Build up a hero's stats through losses or discards before winning with them</li>
                <li>Example: Winning with a 200/200 hero gives you 200 gold and 200 xp</li>
            </ul>
        </section>

        <section>
            <h3 class="h3 text-primary-400 mb-2">Discarding</h3>
            <ul class="list-disc list-inside space-y-2">
                <li>You can discard a hero card if you don't want to play it</li>
                <li>Discarding gives the hero +20 XP and +20 Gold</li>
                <li>These bonuses are permanent and carry over to future draws</li>
            </ul>
        </section>

        <section>
            <h3 class="h3 text-primary-400 mb-2">Leaderboard</h3>
            <ul class="list-disc list-inside space-y-2">
                <li>The leaderboard shows all players' current standings</li>
                <li>Players are ranked by their total gold earned</li>
                <li>You can see other players' current hands and win/loss records</li>
            </ul>
        </section>
    </div>
</div> 