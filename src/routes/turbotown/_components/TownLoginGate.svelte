<script lang="ts">
    import seasonLogo from '$lib/assets/seasonLogo.png'
    import TurbotownIntro from '$lib/components/TurbotownIntro.svelte';
</script>

<div class="w-full flex flex-col items-center justify-center space-y-4">
    <TurbotownIntro/>
    <h1 class="h1">Please login to play Turbotown!</h1>
    <div class="rounded-full border-4 border-b border-amber-500">
        <img src={seasonLogo} alt="town logo" class="w-96 rounded-full"/>
    </div>
</div>