<script lang="ts">
    export let x: number;
    export let y: number;
</script>

<div 
    class="fixed z-[100] bg-surface-800 border border-surface-700 rounded-lg p-2 shadow-xl w-64"
    style="left: {x - 270}px; top: {y}px"
>
    <p class="text-sm">
        When enabled, automatically checks for matches when you return to this tab
    </p>
</div> 