<script lang="ts">
    import Landscape from "$lib/assets/landscape.png"
    import TurbotownDark from "$lib/assets/turbotown_dark_noText.png"
</script>

<div class="w-full relative">
    <div class="absolute z-20 flex flex-col justify-center h-full w-full my-auto p-8">
        <div class="flex justify-center items-center h-full">
            <img src={TurbotownDark} class="w-1/2 bg-surface-900/1" alt="turbotown"/>
            <h1 class="h1 text-tertiary-100  font-bold text-center text-8xl">TurboTown</h1>
        </div>
        
        <h2 class="h2 z-20 italic text-center text-amber-500">Can you be king?</h2>
        <!-- <div class="w-full h-3/4 border border-red-500"></div> -->
    </div>
   
    <div class="h-full z-10 absolute top-0 bg-gradient-to-b from-surface-900/50 to-surface-900/100 w-full"/>
    <img src={Landscape} class="z-0" alt="the battle rages in the valley below"/>
</div>

<!-- <div class="w-full grid grid-cols-2 divide-x-2 divide-y-2">
    <div>
        <div>test</div>
        <div>test</div>
    </div>
    <div>
        <div>test</div>
        <div>test</div>
    </div>
</div> -->
