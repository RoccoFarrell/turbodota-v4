<script lang="ts">
    import type { PageData } from './$types';
    import town_logo_light from '$lib/assets/turbotownlight.png'
    import town_logo_dark from '$lib/assets/turbotowndark.png'
    //export let data: PageData;

</script>

<div class="container mx-auto p-16 space-y-8">
    <div class="flex flex-col md:flex-row items-center text-center">
        <h1 class="h1">ONLY THE BEST CAN BECOME MAYOR OF </h1>
        <img class="block dark:hidden w-64" alt="TurboTownLight" src={town_logo_light} />
        <img class="hidden dark:block w-64" alt="TurboTownDark" src={town_logo_dark} />
    </div>
</div>