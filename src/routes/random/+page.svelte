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

	let bannedHeroes: Hero[] = [];
	$: bannedHeroes;

	let banLimitErrorVisible: boolean = false;
	$: if (banLimitErrorVisible === true)
		setTimeout(() => {
			banLimitErrorVisible = false;
		}, 5000);

	const banHero = (hero: Hero) => {
		let index = bannedHeroes.indexOf(hero);

		if (bannedHeroes.length + 1 > heroRandom.maxBans && index === -1) banLimitErrorVisible = true;
		else {
			if (index === -1) {
				bannedHeroes = [...bannedHeroes, hero];
			} else {
				bannedHeroes = bannedHeroes.filter((arrHero) => arrHero !== hero);
			}
			console.log(bannedHeroes);
		}
	};

	interface HeroRandom {
		bannedHeroes: number[];
		selectedRoles: string[];
		startingGold: number;
		expectedGold: number;
		banMultiplier: number;
		modifierAmount: number;
		modifierTotal: number;
		maxBans: number;
	}

	let heroRandom: HeroRandom = {
		bannedHeroes: [],
		selectedRoles: [],
		startingGold: 100,
		expectedGold: 100,
		banMultiplier: 8,
		modifierAmount: 0,
		modifierTotal: 0,
		maxBans: 1
	};

	const t: ToastSettings = {
		message: `Max bans of ${heroRandom.maxBans} reached!`
	};

	$: {
		heroRandom.modifierAmount = bannedHeroes.length;
		heroRandom.modifierTotal = bannedHeroes.length * heroRandom.banMultiplier;
	}
</script>

<div class="container md:m-4 my-4 h-screen">
	<div class="flex flex-col items-center text-center space-y-4 md:mx-8 mx-2">
		<h1 class="h1 text-primary-700">The Walker Random</h1>

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
						{#if bannedHeroes.indexOf(hero) !== -1}
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
						{#if bannedHeroes.indexOf(hero) !== -1}
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
		<div>
			{#each bannedHeroes as bannedHero}
				<div>{bannedHero.localized_name}</div>
			{/each}
		</div>

		<!-- Modifier calculation -->
		<div class="w-full border border-orange-400 border-dashed max-w-[90%] mx-auto">
			<h2 class="h2">Modifier calculations</h2>
			<div class="grid grid-cols-2">
				<div>
					<p>Number of bans:</p>
					<p>Modifier amount:</p>
					<p>Total gold on win:</p>
				</div>
				<div>
					<p>{bannedHeroes.length}</p>
					<p class="text-red-500">-{heroRandom.modifierTotal}</p>
					<p class="text-amber-500 font-bold">
						{heroRandom.startingGold - heroRandom.modifierTotal}
					</p>
				</div>
			</div>
		</div>

		<!-- Random Button-->
		<button class="btn variant-filled-primary w-full">Random me</button>
	</div>
</div>
