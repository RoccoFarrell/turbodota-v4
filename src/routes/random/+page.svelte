<script lang="ts">
	import { fade, fly, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	//page data
	import type { PageData } from './$types';
	export let data: PageData;

	//helpers
	import winOrLoss from '$lib/helpers/winOrLoss';

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

	//set user preferences on page
	if (data.userPreferences && data.userPreferences.length > 0) {
		let banListPref = data.userPreferences.filter((pref: any) => pref.name === 'randomBanList');

		try {
			if (banListPref.length > 0 && banListPref[0].value) {
				let randomBanListParsed = JSON.parse(banListPref[0].value);

				let setList = data.heroDescriptions.allHeroes.filter((hero: Hero) => randomBanListParsed.includes(hero.id));

				randomStore.setBanList(setList);
			}
		} catch (e) {
			console.error('error in setting preferences');
		}
	}

	let generatedRandomHero: Hero | null = null;

	let randomFound = false;
	//evaluate if there is an active random stored in the DB
	if ('randoms' in data && data?.randoms.length > 0 && data.randoms.filter((random) => random.active).length > 0) {
		randomFound = true;
		const { availableHeroes, bannedHeroes, selectedRoles, expectedGold, modifierAmount, modifierTotal, randomedHero } =
			data.randoms
				.filter((random) => random.active)
				.sort((a: any, b: any) => {
					if (a.start_time < b.start_time) return -1;
					else return 1;
				})[0];

		let allHeroesCopy = [...data.heroDescriptions.allHeroes];
		// console.log(availableHeroes.split(','));
		// console.log(
		// 	availableHeroes.split(',').map((randomID: string) => {
		// 		return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
		// 	})
		// );

		//console.log("randomed hero: ", allHeroesCopy.filter((hero: Hero) => hero.id === randomedHero)[0])

		console.log(`bannedHeroes: ${bannedHeroes} selectedRoles: ${selectedRoles} randomedHero: ${randomedHero}`);

		if (typeof bannedHeroes === 'string' && typeof selectedRoles === 'string' && randomedHero) {
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
				freeBans: 3,
				maxBans: 10,
				randomedHero: allHeroesCopy.filter((hero: Hero) => hero.id === randomedHero)[0]
			});
		} else {
			console.error('[set locked random hero] - couldnt set locked random');
		}

		generatedRandomHero = $randomStore.randomedHero;
	} else if (data.session && data.session.user) {
		const t: ToastSettings = {
			message: `No active randoms found for user`,
			background: 'variant-filled-warning'
		};

		toastStore.trigger(t);
	}

	//calc random lifetime stats on load
	let randomLifetimeStats = {
		wins: 0,
		losses: 0,
		totalGoldWon: 0,
		totalLostGoldModifier: 0
	};

	let completedRandoms = data.randoms.filter((random) => !random.active);
	if (completedRandoms.length > 0) {
		randomLifetimeStats = {
			wins: completedRandoms.filter((random) => random.win).length || 0,
			losses: completedRandoms.filter((random) => !random.active && !random.win).length,
			totalGoldWon: completedRandoms.reduce((acc, cur) => acc + (cur.endGold || 0), 0),
			totalLostGoldModifier: completedRandoms.reduce((acc, cur) => acc + cur.modifierTotal, 0)
		};
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
		if (typeof inputList === 'string') {
			if (inputList === 'garbage') randomStore.setBanList(autoBanLists.garbage);
		} else {
			randomStore.reset(data.heroDescriptions.allHeroes);
			//randomStore.setAllHeroes(data.heroDescriptions.allHeroes)
		}
	};

	const saveBanList = async () => {
		if ($randomStore.bannedHeroes.length <= 3) {
			let response = await fetch(`/api/preferences/${data.session.user.account_id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: 'randomBanList',
					value: JSON.stringify($randomStore.bannedHeroes.map((hero: Hero) => hero.id))
				})
			});

			let prefsResponse = await response.json();
			console.log(prefsResponse);
			if (prefsResponse.status === 'success') {
				const t: ToastSettings = {
					message: `Bans saved!`,
					background: 'variant-filled-success'
				};
				toastStore.trigger(t);
			}
		} else {
			const t: ToastSettings = {
				message: `Need either 0 or 3 bans selected to save!`,
				background: 'variant-filled-warning'
			};
			toastStore.trigger(t);
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
			let response = await fetch(`/api/random/${data.session.user.account_id}/create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(bodyData)
			});

			console.log(response);

			randomFound = true;
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
		<div class="flex max-sm:flex-col max-sm:space-y-2 justify-around items-center w-3/4">
			<h1 class="h1 text-primary-700 max-md:font-bold">The Walker Random™</h1>
			<div class="flex space-x-4">
				<a href="/random/leaderboard"><button class="btn variant-ghost-primary">Leaderboard</button></a>
				
				{#if data.session && data.session.user}
					<div class="text-xs">
						Logged in as: <p class="text-secondary-500 text-lg font-bold">{data.session.user.username}</p>
					</div>
				{/if}
			</div>
		</div>

		<div>
			{#if randomFound}
				<div class="w-full">
					{#if data.randoms}
						<h3 class="h3">{data.randoms?.length} Randoms Found</h3>
					{:else}
						<h3 class="h3">New random locked!</h3>
					{/if}
				</div>
			{/if}
		</div>

		<div
			class="lg:grid lg:grid-cols-3 max-sm:flex max-sm:flex-col items-center max-lg:space-y-8 sm:place-content-start lg:gap-x-8"
		>
			<!-- Hero ban grid -->
			<div class="w-full flex flex-col items-center sm:h-full relative max-md:max-w-sm">
				{#if randomFound}
					<div class="z-50 absolute h-full w-full bg-slate-800/80 flex flex-col items-center justify-center rounded-xl">
						<h3 class="h3 text-primary-500 rounded-xl m-4 bg-surface-500/90 p-4">
							Randoming Locked, you have an active random!
						</h3>
						<img src={Lock} class="h-32 w-32 inline" alt="locked" />
					</div>
				{/if}
				<div class="mb-4 bg-surface-500/10 p-4 rounded-full w-4/5 shadow-md">
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
					id="desktopHeroGrid"
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
					id="mobileHeroGrid"
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
				<div id="bannedHeroes" class="w-full space-x-1 max-w-[90%] flex-wrap p-2 my-2 md:mb-10">
					<button
						class={'btn dark:bg-purple-800/50 bg-purple-500/50 w-3/4'}
						disabled={!data.session}
						on:click={() => saveBanList()}
						>{!data.session ? 'Log In to save 3 Free Bans' : 'Save Bans to account'}</button
					>
					<div class="my-2">
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
				</div>
				<!-- {#if !showHeroGrid}
					<div class="border-double border-b-4 border-amber-500 w-full"></div>
				{/if} -->
			</div>

			<!-- Autobans Roles and Modifiers -->
			<div
				class="md:w-full max-sm:w-fit text-center h-full items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-8 max-sm:py-4"
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
					{#if randomFound}
						<div
							class="z-40 absolute h-full w-full bg-slate-800/80 flex flex-col items-center justify-center rounded-xl"
						>
							<!-- <h2 class="h2 text-primary-500 rounded-full bg-surface-500 p-4">
							Randoming Locked, you have an active random!
						</h2> -->
							<img src={Lock} class="h-32 w-32 inline" alt="locked" />
						</div>
					{/if}

					<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
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
					<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
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
				<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
					<h3 class="h3 dark:text-yellow-500 text-primary-500">4. Modifier Calculations</h3>
					<p class="text-xs">See how much gold your random will get you on win!</p>
				</div>
				<div class="w-fullmax-w-[90%] mx-auto p-4">
					<!-- <h3 class="h3 border-b border-primary-200 border-dashed py-2">Modifier calculations</h3> -->
					<div class="grid grid-cols-2">
						<div>
							<p>Number of bans:</p>
							<p>Free bans left (max 3):</p>
							<p>Heroes in random pool:</p>
							<p>Modifier amount:</p>
							<p>Total gold on win:</p>
						</div>
						<div>
							<p>{$randomStore.bannedHeroes.length}</p>
							<p>
								{$randomStore.bannedHeroes.length < $randomStore.freeBans
									? $randomStore.freeBans - $randomStore.bannedHeroes.length
									: 0}
							</p>
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

				{#if !randomFound}
					<!-- Random Button-->
					<button
						on:click={generateRandomHero}
						disabled={randomFound}
						class="z-50 btn variant-filled-primary w-full my-4 max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
						>Random me</button
					>
				{/if}
			</div>

			<!-- Stats and History -->
			<div
				class="w-full h-full max-md:max-w-sm space-y-10 dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 rounded-lg relative"
			>
				{#if !data.session}
					<div class="z-10 absolute h-full w-full bg-slate-800/80 flex flex-col items-center justify-center rounded-lg">
						<h3 class="h3 text-primary-500 rounded-xl m-4 bg-surface-500/90 p-4">
							Log in to start your Turbodota Random journey!
						</h3>
						<img src={Lock} class="h-32 w-32 inline" alt="locked" />
					</div>
				{/if}
				<div class="mx-4 my-2">
					<!-- Stats -->
					<div>
						<h2 class="h2 text-primary-500 w-full border-b border-primary-500 border-dashed py-2 mb-2">Stats</h2>
						<h2 class="h2">
							<p class="text-green-700 inline font-bold h1">
								{randomLifetimeStats.wins}
							</p>
							W -
							<p class="inline text-red-600 font-bold h1">
								{randomLifetimeStats.losses}
							</p>
							L
						</h2>
						<div class="my-2">
							<div>
								Total Gold Acquired: <p class="text-amber-500 inline">{randomLifetimeStats.totalGoldWon}g</p>
							</div>
							<div>
								Gold missed from Bans: <p class="text-red-500 inline">
									{randomLifetimeStats.totalLostGoldModifier}g
								</p>
							</div>
						</div>

						<!-- Add these later once people get more games -->
						<!-- <p>Most randomed</p>
				<p>Most randomed wins: Techies</p>
				<p>Most randomed losses: Broodmother</p> -->
					</div>
					<!-- History-->
					<div class="w-full flex flex-col space-y-4">
						<h2 class="h2 text-primary-500 w-full border-b border-primary-500 border-dashed py-2">History</h2>
						<div class="h-full">
							<div class="grid grid-cols-4 text-secondary-500">
								<div>Hero</div>
								<div>Win or Loss</div>
								<div>Gold</div>
								<div>Lost Gold</div>
							</div>
							<div class="grid grid-cols-4 place-items-center">
								{#each completedRandoms as random}
									<!-- Hero-->
									<div class="flex items-center space-x-2">
										<i class={`z-0 d2mh hero-${random.randomedHero}`}></i>
										<p class="inline">
											{data.heroDescriptions.allHeroes.filter((hero) => hero.id === random.randomedHero)[0]
												.localized_name}
										</p>
									</div>
									<!-- Win or loss -->
									<div class="flex items-center space-x-2">
										{#if random.win}
											<h2 class="h2 text-green-600">W</h2>
										{:else}
											<h2 class="h2 text-red-600">L</h2>
										{/if}
									</div>
									<!-- Gold -->
									<div class="flex items-center space-x-2">
										<div class="text-amber-500 inline font-bold">
											{random.endGold}g
											{#if !random.win}
												<p class="inline text-xs text-secondary-600">(-{random.expectedGold}g)</p>
											{/if}
										</div>
									</div>
									<!-- Lost gold -->
									<div class="flex items-center space-x-2">
										<p class="text-red-500 inline font-bold">{random.modifierTotal}g</p>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
				<!-- {JSON.stringify(data.randoms, null, 4)} -->
			</div>
		</div>
	</div>
</div>
