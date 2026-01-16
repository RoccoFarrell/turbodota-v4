<script lang="ts">
        import dotadeckLogo from '$lib/assets/dotadeck_logo.png';
</script>

<div class="card p-8 w-[1000px] max-h-[80vh] overflow-y-auto">
    <div class="grid grid-cols-2 gap-8">
        <div class="flex items-center justify-center">
            <img src={dotadeckLogo} alt="DotaDeck Logo" class="w-full max-w-md border border-amber-500 shadow-2xl">
        </div>
        <div>
            <h2 class="h2 text-primary-500 mb-4">DotaDeck Rules</h2>

            <div class="space-y-4">
                <div>
                    <h3 class="h3 text-secondary-500">Overview</h3>
                    <p>DotaDeck is a competitive card game where players draw Hero Cards and compete to win matches with them.</p>
                </div>

                <div>
                    <h3 class="h3 text-secondary-500">Drawing Cards</h3>
                    <ul class="list-disc list-inside space-y-2">
                        <li>Draw up to 3 Hero Cards into your hand</li>
                        <li>Each card has Gold and XP values that increase when players lose with them</li>
                        <li>The higher the values, the bigger the reward for winning!</li>
                    </ul>
                </div>

                <div>
                    <h3 class="h3 text-secondary-500">Playing Matches</h3>
                    <ul class="list-disc list-inside space-y-2">
                        <li>Play a match with any hero in your hand</li>
                        <li>Win: Claim the card's Gold and XP values as points!</li>
                        <li>Lose: The card's values increase, making it more valuable</li>
                    </ul>
                </div>

                <div>
                    <h3 class="h3 text-secondary-500">Discarding</h3>
                    <ul class="list-disc list-inside space-y-2">
                        <li>You have 5 discard tokens</li>
                        <li>Use a token to discard an unwanted hero</li>
                        <li>Discarding slightly increases the card's values</li>
                        <li>Tokens refresh after completing a match</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div> 