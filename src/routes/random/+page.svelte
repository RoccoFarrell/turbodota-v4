<script lang="ts">
	import { fade } from 'svelte/transition';
	//page data
	import type { PageData } from './$types';
	export let data: PageData;
	console.log(data);

	//skeleton
	import { getToastStore } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';

	const toastStore = getToastStore();

	$: showHeroGrid = true;

	const handleCollapseHeroGrid = () => {
		showHeroGrid = !showHeroGrid;
	};

	let banLimitErrorVisible: boolean = false;
	$: if (banLimitErrorVisible === true)
		setTimeout(() => {
			banLimitErrorVisible = false;
		}, 5000);

	interface HeroRandom {
		availableHeroes: Hero[];
		bannedHeroes: Hero[];
		selectedRoles: string[];
		startingGold: number;
		expectedGold: number;
		banMultiplier: number;
		modifierAmount: number;
		modifierTotal: number;
		maxBans: number;
	}

	let heroRandom: HeroRandom = {
		availableHeroes: [...data.heroDescriptions.allHeroes],
		bannedHeroes: [],
		selectedRoles: [],
		startingGold: 100,
		expectedGold: 100,
		banMultiplier: 8,
		modifierAmount: 0,
		modifierTotal: 0,
		maxBans: 10
	};

    $: heroRandom.bannedHeroes

	const banHero = (hero: Hero) => {
		let bannedHeroes = heroRandom.bannedHeroes;
		let banIndex = bannedHeroes.indexOf(hero);

		if (bannedHeroes.length + 1 > heroRandom.maxBans && banIndex === -1)
			banLimitErrorVisible = true;
		else {
			if (banIndex === -1) {
				bannedHeroes = [...bannedHeroes, hero];
				let availableIndex = heroRandom.availableHeroes.indexOf(hero);
				if (availableIndex > -1) heroRandom.availableHeroes.splice(availableIndex, 1);
			} else {
				bannedHeroes = bannedHeroes.filter((arrHero) => arrHero !== hero);
			}
			console.log(bannedHeroes);
		}

		heroRandom.bannedHeroes = bannedHeroes;
	};

	let generatedRandomHero: Hero | null = null;
	const generateRandomHero = () => {
		generatedRandomHero =
			heroRandom.availableHeroes[Math.floor(Math.random() * heroRandom.availableHeroes.length)];
	};

	const t: ToastSettings = {
		message: `Max bans of ${heroRandom.maxBans} reached!`,
		background: 'variant-filled-warning'
	};

	$: {
		heroRandom.modifierAmount = heroRandom.bannedHeroes.length;
		heroRandom.modifierTotal = heroRandom.bannedHeroes.length * heroRandom.banMultiplier;
		if (banLimitErrorVisible) toastStore.trigger(t);
	}
</script>

<div class="container md:m-4 my-4 h-screen">
	<div class="flex flex-col items-center text-center space-y-4 md:mx-8 mx-2">
		<h1 class="h1 text-primary-700">The Walker Random™</h1>

		<div class="w-full flex flex-col mx-auto max-w-[95%] items-center">
			<!-- Show hero grid button -->
			<div
				class="w-full py-2 bg-primary-200 rounded-t-full text-primary-900 font-bold hover:-translate-y-1 max-w-[95%] shadow-lg"
			>
				<button class="w-full" on:click={handleCollapseHeroGrid}> Show Hero Ban Grid </button>
			</div>
			<!-- Desktop -->
			<div
				class={`flex flex-wrap border border-dashed border-red-500 max-w-[95%] p-4 max-md:hidden xs:visible justify-center ${
					showHeroGrid ? 'visible' : 'hidden'
				}`}
			>
				{#each data.heroDescriptions.allHeroes as hero}
					<div class="object-contain m-1 relative">
						{#if heroRandom.bannedHeroes.indexOf(hero) !== -1}
							<div class="w-full h-full bg-red-600 rounded-xl z-10 absolute bg-opacity-70">
								<button on:click={() => banHero(hero)} class="w-full h-full"></button>
							</div>
						{/if}
						<button on:click={() => banHero(hero)}
							><i class={`z-0 d2mh hero-${hero.id}`}></i></button
						>
					</div>
				{/each}
			</div>
			<!-- Mobile -->
			<div
				class={`w-full flex flex-wrap border border-dashed border-red-500 max-w-[95%] p-2 md:hidden max-md:visible justify-center overflow-y-auto max-h-96 ${
					showHeroGrid ? 'visible' : 'hidden'
				}`}
			>
				{#each data.heroDescriptions.allHeroes as hero}
					<div class={`object-contain m-3 relative`}>
						{#if heroRandom.bannedHeroes.indexOf(hero) !== -1}
							<div class="w-full h-full bg-red-600 rounded-xl z-10 absolute bg-opacity-70">
								<button on:click={() => banHero(hero)} class="w-full h-full"></button>
							</div>
						{/if}
						<button on:click={() => banHero(hero)}
							><i class={`z-0 d2mh hero-${hero.id} scale-150`}></i></button
						>
					</div>
				{/each}
			</div>
		</div>

		<!-- Banned heroes -->
		<div class="flex space-x-1 max-w-[95%] flex-wrap">
			<h4 class="inline h4">Banned Heroes:</h4>
			{#each heroRandom.bannedHeroes as bannedHero}
				<span class="badge variant-filled-secondary">{bannedHero.localized_name}</span>
			{/each}
		</div>

		<!-- Modifier calculation -->
		<div class="w-full border border-orange-400 border-dashed max-w-[90%] mx-auto">
			<h2 class="h2">Modifier calculations</h2>
			<div class="grid grid-cols-2">
				<div>
					<p>Number of bans:</p>
					<p>Heroes in random pool:</p>
					<p>Modifier amount:</p>
					<p>Total gold on win:</p>
				</div>
				<div>
					<p>{heroRandom.bannedHeroes.length}</p>
					<p class="text-green-600">{heroRandom.availableHeroes.length}</p>
					<p class="text-red-500">-{heroRandom.modifierTotal}</p>
					<p class="text-amber-500 font-bold">
						{heroRandom.startingGold - heroRandom.modifierTotal}
					</p>
				</div>
			</div>
		</div>

		<!-- Random Button-->
		<button on:click={generateRandomHero} class="btn variant-filled-primary w-full"
			>Random me</button
		>

		{#if generatedRandomHero}
			<div class="flex flex-col items-center">
				<h1 class="h1">Your random:</h1>
				<h1 class="h1 vibrating animate-pulse text-amber-600">
					{generatedRandomHero.localized_name}
				</h1>
				<i class={`vibrating d2mh hero-${generatedRandomHero.id} scale-150`}></i>
			</div>
		{/if}
	</div>
</div>
