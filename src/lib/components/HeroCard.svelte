<script lang="ts">
    import type { HeroCard as HeroCardType } from '$lib/types';

    export let card: HeroCardType;
    export let selected = false;
    export let disabled = false;
    export let showStats = false;
    export let timesPlayed = 0;
    export let totalScore = 0;
    export let ringColor = 'red';

    const colors = {
        STAT_MULTIPLIER: '#4A90E2',
        STAT_ADDER: '#50E3C2',
        SCORE_MULTIPLIER: '#F5A623'
    } as const;

    function generateCardPattern(card: HeroCardType): string {
        const baseColor = colors[card.effectType] || '#4A90E2';
        return `
            <svg width="100%" height="100%" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="pattern-${card.id}" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M20,0 L40,20 L20,40 L0,20 Z" fill="${baseColor}" opacity="0.2"/>
                        <path d="M20,0 L40,20 L20,40 L0,20 Z" fill="none" stroke="black" stroke-width="1" opacity="0.1"/>
                    </pattern>
                    <filter id="turbulence-${card.id}">
                        <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="2" seed="${card.cost}"/>
                        <feDisplacementMap in="SourceGraphic" scale="20"/>
                    </filter>
                </defs>
                <rect width="100%" height="100%" fill="white"/>
                <rect width="100%" height="100%" fill="url(#pattern-${card.id})"/>
                <path d="M150,80 L250,200 L150,320 L50,200 Z" 
                      fill="${baseColor}" 
                      stroke="black" 
                      stroke-width="8"
                      opacity="0.8"
                      transform="rotate(${card.cost * 45}, 150, 200)">
                </path>
                <path d="M150,100 L230,200 L150,300 L70,200 Z" 
                      fill="black" 
                      opacity="0.2"
                      transform="rotate(${card.cost * 45}, 150, 200)">
                </path>
            </svg>
        `;
    }
</script>

<button type="button" 
    class="relative bg-white border-2 border-[#8B4513] rounded-lg p-2 cursor-pointer transition-all duration-200"
    class:opacity-50={disabled}
    class:ring-4={selected}
    class:ring-red-500={selected && ringColor === 'red'}
    class:ring-green-500={selected && ringColor === 'green'}
    class:hover:scale-110={!selected}
    class:hover:z-50={!selected}
    class:hover:-translate-y-4={!selected}
    on:click
    {...$$restProps}>
    <div class="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full 
                flex items-center justify-center shadow-lg z-10
                ring-2 ring-amber-500">
        <span class="text-amber-500 font-bold drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]">
            ${card.cost}
        </span>
    </div>
    <div class="card-container w-full max-w-[140px]">
        <div class="relative w-[140px] aspect-[3/4] rounded-lg overflow-hidden"
             style="background-image: url('data:image/svg+xml;utf8,{encodeURIComponent(generateCardPattern(card))}')">
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-2xl font-bold" style="color: {colors[card.effectType]}">
                    {card.statType.charAt(0)}
                </div>
            </div>
        </div>
        <div class="mt-2 text-center transition-all duration-300">
            <div class="text-black font-bold text-sm">{card.name}</div>
            <div class="text-xs text-gray-700 mt-1 line-clamp-2">{card.description}</div>
            <div class="text-xs text-gray-600">
                {card.effectType} • {card.statType}
            </div>
            {#if showStats}
                <div class="mt-1 text-xs text-gray-500">
                    Played: {timesPlayed} | Score: {totalScore}
                </div>
            {/if}
        </div>
    </div>
</button> 