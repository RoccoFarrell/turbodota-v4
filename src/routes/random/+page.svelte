<script lang="ts">
	import { fade, fly, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	//page data
	import type { PageData } from './$types';
	export let data: PageData;
	console.log(data);

	//skeleton
	import { getToastStore, storeHighlightJs } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';
	const toastStore = getToastStore();

	//constants
	import { heroRoles } from '$lib/constants/heroRoles';

	//stores
	import { randomStore } from '$lib/stores/randomStore';

	//images
	import Lock from '$lib/assets/lock.png';

	console.log('data: ', data);
	$: console.log('store data: ', $randomStore);

	let generatedRandomHero: Hero | null = null;

	let randomFound = false;
	//evaluate if there is an active random stored in the DB
	if ('randoms' in data && data?.randoms.length > 0) {
		randomFound = true;
		const { availableHeroes, bannedHeroes, selectedRoles, expectedGold, modifierAmount, modifierTotal, randomedHero } =
			data.randoms[0];

		let allHeroesCopy = [...data.heroDescriptions.allHeroes];
		console.log(availableHeroes.split(','));
		console.log(
			availableHeroes.split(',').map((randomID: string) => {
				return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
			})
		);

		//console.log(allHeroesCopy.filter((hero: Hero) => hero.id === 1)[0])

		randomStore.set({
			allHeroes: data.heroDescriptions.allHeroes,
			availableHeroes: availableHeroes.split(',').map((randomID: string) => {
				return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
			}),
			bannedHeroes:
				bannedHeroes.length > 0
					? bannedHeroes.split(',').map((randomID: string) => {
							return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
					  })
					: [],
			selectedRoles: selectedRoles.split(',') || [],
			startingGold: 100,
			expectedGold,
			banMultiplier: 8,
			modifierAmount,
			modifierTotal,
			maxBans: 10,
			randomedHero: allHeroesCopy.filter((hero: Hero) => hero.id === randomedHero)[0]
		});

		generatedRandomHero = $randomStore.randomedHero;
	} else if (data.session && data.session.user) {
		const t: ToastSettings = {
			message: `No randoms found for user`,
			background: 'variant-filled-warning'
		};

		toastStore.trigger(t);
	}

	$: showHeroGrid = true;

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

	$: heroRandom.bannedHeroes;

	const banHero = (hero: Hero) => {
		let banIndex = $randomStore.bannedHeroes.indexOf(hero);

		if ($randomStore.bannedHeroes.length + 1 > $randomStore.maxBans && banIndex === -1) banLimitErrorVisible = true;
		else {
			randomStore.banHero(hero);
		}
	};

	let autoBanLists = {
		garbage: data.heroDescriptions.allHeroes.filter((hero: Hero) =>
			[
				'Chen',
				'Meepo',
				'Tinker',
				'Broodmother',
				'Io',
				'Naga Siren',
				'Lone Druid',
				'Alchemist',
				'Arc Warden',
				'Templar Assassin',
				'Huskar',
				'Medusa'
			].includes(hero.localized_name)
		)
	};

	const setBanList = (inputList?: string) => {
		if (inputList) {
			if (inputList === 'garbage') randomStore.setBanList(autoBanLists.garbage);
		} else {
			randomStore.reset(data.heroDescriptions.allHeroes);
			//randomStore.setAllHeroes(data.heroDescriptions.allHeroes)
		}
	};

	const handleRoleSelect = (role: string) => {
		console.log(role);
		if (role === 'All') {
			//if All was already selected, set to empty
			//if not selected, set to all roles
			$randomStore.selectedRoles.includes('All')
				? ($randomStore.selectedRoles = [])
				: ($randomStore.selectedRoles = heroRoles);
		} else {
			//if not All, remove role if already there
			//or add role if missing
			if ($randomStore.selectedRoles.includes(role))
				$randomStore.selectedRoles = $randomStore.selectedRoles.filter((r) => r !== role && r !== 'All');
			else $randomStore.selectedRoles.push(role);
		}

		$randomStore.availableHeroes = data.heroDescriptions.allHeroes.filter((heroDesc: Hero) => {
			let returnVal = false;
			$randomStore.selectedRoles.forEach((role) => {
				if (heroDesc.roles.includes(role)) returnVal = true;
			});
			return returnVal;
		});
		console.log(`${data.heroDescriptions.allHeroes.length} filtered to ${$randomStore.availableHeroes.length}`);

		$randomStore.bannedHeroes = data.heroDescriptions.allHeroes.filter((heroDesc: Hero) => {
			let returnVal = true;
			$randomStore.selectedRoles.forEach((role) => {
				if (heroDesc.roles.includes(role)) returnVal = false;
			});
			return returnVal;
		});

		if ($randomStore.availableHeroes.length === 0) randomStore.reset(data.heroDescriptions.allHeroes);
		else randomStore.updateCalculations();
		//console.log($randomStore.selectedRoles);
	};

	const generateRandomHero = async () => {
		generatedRandomHero = $randomStore.availableHeroes[Math.floor(Math.random() * $randomStore.availableHeroes.length)];

		$randomStore.randomedHero = generatedRandomHero;

		if (data.session) {
			let bodyData = {
				...$randomStore,
				availableHeroes: $randomStore.availableHeroes.map((hero: Hero) => hero.id),
				bannedHeroes: $randomStore.bannedHeroes.map((hero: Hero) => hero.id),
				randomedHero: $randomStore.randomedHero.id
			};
			//bodyData.availableHeroes = bodyData.availableHeroes.map((hero: Hero) => hero.id);
			let response = await fetch(`/api/random/${data.session.user.account_id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(bodyData)
			});

			console.log(response);
		}
	};

	//toast settings
	const t: ToastSettings = {
		message: `Max bans of ${$randomStore.maxBans} reached!`,
		background: 'variant-filled-warning'
	};

	let banLimitErrorVisible: boolean = false;
	$: if (banLimitErrorVisible === true)
		setTimeout(() => {
			banLimitErrorVisible = false;
		}, 5000);

	$: {
		randomStore.updateCalculations();
		if (banLimitErrorVisible) toastStore.trigger(t);
	}
</script>

<div class="container md:m-4 my-4 h-full mx-auto w-full max-sm:mb-20">
	<div class="flex flex-col items-center text-center space-y-2 md:mx-8 mx-2">
		<div class="flex justify-around items-center w-3/4">
			<h1 class="h1 text-primary-700 max-md:font-bold">The Walker Random™</h1>
			{#if data.session && data.session.user}
				<div class="text-xs">
					Logged in as: <p class="text-secondary-500 text-lg font-bold">{data.session.user.username}</p>
				</div>
			{/if}
		</div>

		<div>
			{#if randomFound}
				<div class="w-full">
					<h3 class="h3">{data.randoms.length} Random Found</h3>
				</div>
			{/if}
		</div>

		<div
			class="sm:grid sm:grid-cols-2 max-sm:flex max-sm:flex-col items-center max-sm:space-y-4 h-full sm:place-content-start"
		>
			<!-- Hero ban grid -->
			<div class="w-full flex flex-col mx-auto max-w-[95%] items-center sm:h-full relative">
				<div class="z-50 absolute h-full w-full bg-slate-800/80 flex flex-col items-center justify-center rounded-xl">
					<h3 class="h3 text-primary-500 rounded-xl m-4 bg-surface-500/90 p-4">
						Randoming Locked, you have an active random!
					</h3>
					<img src={Lock} class="h-32 w-32 inline" alt="locked" />
				</div>

				<div class="mb-4 bg-surface-500/10 p-4 rounded-full xl:w-1/2 w-4/5 shadow-md">
					<h3 class="h3 dark:text-yellow-500 text-primary-500">1. Ban heroes below</h3>
					<p class="text-xs">Click a hero to ban!</p>
				</div>

				<!-- Show hero grid button -->
				<div
					class="w-full py-2 bg-primary-200 rounded-t-full text-primary-900 font-bold hover:-translate-y-1 max-w-[95%] shadow-lg md:hidden z-0"
				>
					<button
						class="w-full"
						on:click={() => {
							showHeroGrid = !showHeroGrid;
						}}
					>
						{`${!showHeroGrid ? 'Show' : 'Hide'}  Hero Ban Grid`}
					</button>
				</div>
				<!-- Desktop Hero Grid -->
				<div
					class={`z-0 flex flex-wrap max-w-[95%] p-4 max-md:hidden xs:visible justify-center overflow-y-auto w-full max-h-[50rem] ${
						showHeroGrid ? 'visible border border-dashed border-red-500' : 'border-double border-t-4 border-amber-500'
					}`}
				>
					{#if showHeroGrid}
						{#each data.heroDescriptions.allHeroes as hero}
							<div class="object-contain m-1 relative">
								{#if $randomStore.bannedHeroes.indexOf(hero) !== -1}
									<div class="w-full h-full bg-red-600 rounded-xl z-10 absolute bg-opacity-70">
										<button on:click={() => banHero(hero)} class="w-full h-full"></button>
									</div>
								{/if}
								<button on:click={() => banHero(hero)}><i class={`z-0 d2mh hero-${hero.id}`}></i></button>
							</div>
						{/each}
					{/if}
				</div>
				<!-- Mobile Hero Grid -->
				<div
					class={`w-full flex flex-wrap max-w-[95%] p-2 md:hidden max-md:visible justify-center overflow-y-auto max-h-96 ${
						showHeroGrid ? 'visible border border-dashed border-red-500' : 'border-double border-b-4 border-amber-500'
					}`}
				>
					{#if showHeroGrid}
						{#each data.heroDescriptions.allHeroes as hero}
							<div class={`object-contain m-3 relative`}>
								{#if $randomStore.bannedHeroes.indexOf(hero) !== -1}
									<div class="w-full h-full bg-red-600 rounded-xl z-10 absolute bg-opacity-70">
										<button on:click={() => banHero(hero)} class="w-full h-full"></button>
									</div>
								{/if}
								<button on:click={() => banHero(hero)}><i class={`z-0 d2mh hero-${hero.id} scale-150`}></i></button>
							</div>
						{/each}
					{/if}
				</div>

				<!-- Banned heroes -->
				<div class="w-full space-x-1 max-w-[90%] flex-wrap p-2 md:p-4 my-1 md:my-4 md:mb-10">
					<h4 class="h4">Banned Heroes:</h4>
					{#if $randomStore.bannedHeroes.length > 0}
						<div>
							{#each $randomStore.bannedHeroes as bannedHero}
								<span class="badge variant-filled-secondary">{bannedHero?.localized_name}</span>
							{/each}
						</div>
						<button class="btn bg-red-500 w-1/2 my-4" on:click={() => setBanList()}>Clear</button>
					{:else}
						<p>none</p>
					{/if}
				</div>
				<!-- {#if !showHeroGrid}
					<div class="border-double border-b-4 border-amber-500 w-full"></div>
				{/if} -->
			</div>

			<div
				class="md:w-full max-sm:w-fit text-center h-full items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-8 max-sm:py-4 mx-4"
			>
				{#if generatedRandomHero}
					<div
						class="flex flex-col items-center space-y-2 bg-yellow-600/30 rounded-2xl py-4 mb-4"
						in:slide={{ delay: 250, duration: 300, easing: quintOut, axis: 'x' }}
					>
						<h1 class="h1">Your random:</h1>
						<h1 class="h1 vibrating animate-pulse text-amber-600">
							{generatedRandomHero.localized_name}
						</h1>
						<i class={`vibrating d2mh hero-${generatedRandomHero.id} scale-150`}></i>
					</div>
				{:else}
					<div />
				{/if}

				<!-- Auto Bans -->
				<div class="relative">
					<div class="z-50 absolute h-full w-full bg-slate-800/80 flex flex-col items-center justify-center rounded-xl">
						<!-- <h2 class="h2 text-primary-500 rounded-full bg-surface-500 p-4">
							Randoming Locked, you have an active random!
						</h2> -->
						<img src={Lock} class="h-32 w-32 inline" alt="locked" />
					</div>

					<div class="mb-2 bg-surface-500/10 p-4 rounded-full xl:w-1/2 w-4/5 mx-auto shadow-md">
						<h3 class="h3 dark:text-yellow-500 text-primary-500">2. Autobans</h3>
						<p class="text-xs">Use the preset lists below to eliminate the worst.</p>
					</div>

					<div class="mx-8 md:my-4 my-2">
						<!-- <h3 class="h3">Auto Bans</h3> -->
						<button class="btn dark:bg-amber-800 bg-amber-500 w-1/2 my-4" on:click={() => setBanList('garbage')}
							>Garbage</button
						>
					</div>

					<!-- Role filtering -->
					<div class="mb-2 bg-surface-500/10 p-4 rounded-full xl:w-1/2 w-4/5 mx-auto shadow-md">
						<h3 class="h3 dark:text-yellow-500 text-primary-500">3. Roles</h3>
						<p class="text-xs">Filter by role to fit your comp</p>
					</div>

					<div class="mx-8 md:my-4 my-2">
						<!-- <h3 class="h3">Auto Bans</h3> -->
						<!-- <button class="btn dark:bg-amber-800 bg-amber-500 w-1/2 my-4" on:click={() => setBanList('garbage')}>Garbage</button> -->

						<div class="grid grid-cols-3">
							{#each heroRoles as role}
								<label class="flex items-center space-x-2">
									<input
										class="checkbox"
										type="checkbox"
										on:click={() => handleRoleSelect(role)}
										checked={$randomStore.selectedRoles.includes(role)}
									/>
									<p>{role}</p>
								</label>
							{/each}
						</div>
					</div>
				</div>

				<!-- Modifier calculation -->
				<div class="mb-2 bg-surface-500/10 p-4 rounded-full xl:w-1/2 w-4/5 mx-auto shadow-md">
					<h3 class="h3 dark:text-yellow-500 text-primary-500">4. Modifier Calculations</h3>
					<p class="text-xs">See how much gold your random will get you on win!</p>
				</div>
				<div class="w-fullmax-w-[90%] mx-auto p-4">
					<!-- <h3 class="h3 border-b border-primary-200 border-dashed py-2">Modifier calculations</h3> -->
					<div class="grid grid-cols-2">
						<div>
							<p>Number of bans:</p>
							<p>Heroes in random pool:</p>
							<p>Modifier amount:</p>
							<p>Total gold on win:</p>
						</div>
						<div>
							<p>{$randomStore.bannedHeroes.length}</p>
							<p class="text-green-600">{$randomStore.availableHeroes.length}</p>
							<p class="text-red-500">-{$randomStore.modifierTotal}</p>
							<p class="text-amber-500 font-bold">
								<!-- {$randomStore.startingGold - $randomStore.modifierTotal > 25
									? $randomStore.startingGold - $randomStore.modifierTotal
									: `25 (min)`} -->
								{$randomStore.expectedGold}
							</p>
						</div>
					</div>
				</div>

				<!-- Random Button-->
				<button
					on:click={generateRandomHero}
					class="btn variant-filled-primary w-full my-4 max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:my-8 max-sm:mx-4 max-sm:max-w-[90%] md:max-w-[80%]"
					>Random me</button
				>
			</div>
		</div>
	</div>
</div>
