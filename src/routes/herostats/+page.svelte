<script lang="ts">
    import type { PageData } from './$types';
    import turboking from '$lib/assets/turboking.png'
    export let data: PageData;
</script>

<div class="container mx-auto p-16 space-y-8">
    <div class="flex justify-center items-center space-x-8">
        <h1 class="h1">ONLY THE TRUE KING WILL RULE</h1>
        <img class="w-32" alt="turboking" src={turboking} />
    </div>
</div>