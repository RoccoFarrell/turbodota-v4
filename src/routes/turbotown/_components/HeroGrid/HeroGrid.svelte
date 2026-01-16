<script lang="ts">
	import { run } from 'svelte/legacy';

	import { setContext, getContext } from 'svelte';
	import type { Hero, Session, UserPrefs } from '@prisma/client';

	//skeleton
	// ToastSettings type (not exported from Skeleton v3)
	type ToastSettings = {
		message: string;
		background?: string;
		timeout?: number;
	};
	const toastStore = getContext<any>('toaster');
	
	// Helper function to create toasts with Skeleton v3 API
	function showToast(message: string, background?: string) {
		if (toastStore && typeof toastStore.create === 'function') {
			toastStore.create({
				title: message,
				description: '',
				type: background?.includes('error') ? 'error' : 
				       background?.includes('success') ? 'success' : 
				       background?.includes('warning') ? 'warning' : 'info',
				meta: { background }
			});
		}
	}

	//constants
	import { heroRoles } from '$lib/constants/heroRoles';

	//images
	import Lock from '$lib/assets/lock.png';

	//types
	import type { createRandomStore } from '$lib/stores/randomStore'
	type BanStore = ReturnType<typeof createRandomStore>
	import { banStore } from '$lib/stores/banStore'

	
	interface Props {
		randomFound?: boolean;
		session?: Session | null;
		heroes?: Hero[];
		//export let parent: any;
		freeBans?: number;
		onClose?: () => void;
	}

	let {
		randomFound = false,
		session = $bindable(null),
		heroes = $bindable([]),
		freeBans = 3,
		onClose
	}: Props = $props();
	
	if (heroes.length === 0) heroes = getContext('heroes');


	console.log('banStore: ', $banStore)
	run(() => {
		console.log('banStore changed: ', $banStore)
	});

	/* Get session from context */
	if (!session) session = getContext('session');
	// let preferences: UserPrefs[] = [];
	// if (!preferences || preferences.length === 0) preferences = getContext('userPreferences');
	// console.log('[herogrid] preferences: ', preferences);

	let showHeroGrid = $state(true);
	

	const handleRoleSelect = (role: string) => {
		//console.log(role);
		if (role === 'All') {
			//if All was already selected, set to empty
			//if not selected, set to all roles
			$banStore.selectedRoles.includes('All')
				? ($banStore.selectedRoles = [])
				: ($banStore.selectedRoles = heroRoles);
		} else {
			//if not All, remove role if already there
			//or add role if missing
			if ($banStore.selectedRoles.includes(role))
				$banStore.selectedRoles = $banStore.selectedRoles.filter((r) => r !== role && r !== 'All');
			else $banStore.selectedRoles.push(role);
		}

		$banStore.availableHeroes = heroes.filter((heroDesc: Hero) => {
			let returnVal = false;
			$banStore.selectedRoles.forEach((role) => {
				if (heroDesc.roles.includes(role)) returnVal = true;
			});
			return returnVal;
		});
		console.log(`${heroes.length} filtered to ${$banStore.availableHeroes.length}`);

		$banStore.bannedHeroes = heroes.filter((heroDesc: Hero) => {
			let returnVal = true;
			$banStore.selectedRoles.forEach((role) => {
				if (heroDesc.roles.includes(role)) returnVal = false;
			});
			return returnVal;
		});

		if ($banStore.availableHeroes.length === 0) banStore.reset(heroes);
		else console.log('this is where we would update calculations');
		//banStore.updateCalculations();
		//console.log($randomStore.selectedRoles);
	};

	let autoBanLists = {
		garbage: heroes.filter((hero: Hero) =>
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
			if (inputList === 'garbage') banStore.setBanList(autoBanLists.garbage);
		} else {
			banStore.reset(heroes);
			//randomStore.setAllHeroes(data.heroDescriptions.allHeroes)
		}
	};

	const saveBanList = async () => {
		if ($banStore.bannedHeroes.length <= 3 && session) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore: Unreachable code error
			let response = await fetch(`/api/preferences/${session.user.account_id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: 'randomBanList',
					value: JSON.stringify($banStore.bannedHeroes.map((hero: Hero) => hero.id))
				})
			});

			let prefsResponse = await response.json();
			//console.log(prefsResponse);
			if (prefsResponse.status === 'success') {
				showToast(`Bans saved!`, 'preset-filled-success-500');
			}
		} else {
			showToast(`Need either 0 or 3 bans selected to save!`, 'preset-filled-warning-500');
		}
	};
</script>

<div class="card w-full max-w-4xl flex flex-col justify-center items-center p-4">
	<div class="flex justify-between items-center w-full mb-4">
		<h2 class="h2 text-primary-500">Ban Heroes</h2>
		{#if onClose}
			<button class="btn btn-sm preset-filled-surface-500" onclick={() => onClose?.()}>✕</button>
		{/if}
	</div>
	<div class="md:grid md:grid-cols-2 max-md:flex max-md:flex-col">
		<!-- Hero ban grid -->
		<div class="w-full flex flex-col items-center sm:h-fit relative max-md:max-w-sm">
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
					onclick={() => {
						showHeroGrid = !showHeroGrid;
					}}
				>
					{`${!showHeroGrid ? 'Show' : 'Hide'}  Hero Ban Grid`}
				</button>
			</div>
			<!-- Desktop Hero Grid -->
			<div
				id="desktopHeroGrid"
				class={`z-0 flex flex-wrap max-w-[95%] p-4 max-md:hidden xs:visible justify-center overflow-y-auto w-full max-h-200 ${
					showHeroGrid ? 'visible border border-dashed border-red-500' : 'border-double border-t-4 border-amber-500'
				}`}
			>
				{#if showHeroGrid}
					{#each heroes as hero}
						<div class="object-contain m-1 relative">
							{#if $banStore.bannedHeroes.indexOf(hero) !== -1}
								<div class="w-full h-full bg-red-600 rounded-xl z-10 absolute bg-opacity-70">
									<button onclick={() => banStore.banHero(hero)} class="w-full h-full"></button>
								</div>
							{/if}
							<button onclick={() => banStore.banHero(hero)}><i class={`z-0 d2mh hero-${hero.id}`}></i></button>
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
					{#each heroes as hero}
						<div class={`object-contain m-3 relative`}>
							{#if $banStore.bannedHeroes.indexOf(hero) !== -1}
								<div class="w-full h-full bg-red-600 rounded-xl z-10 absolute bg-opacity-70">
									<button onclick={() => banStore.banHero(hero)} class="w-full h-full"></button>
								</div>
							{/if}
							<button onclick={() => banStore.banHero(hero)}
								><i class={`z-0 d2mh hero-${hero.id} scale-125`}></i></button
							>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Banned heroes -->
			<div id="bannedHeroes" class="w-full space-x-1 max-w-[90%] flex-wrap p-2 my-2 md:mb-10">
				<div class="my-2 justify-center flex flex-col items-center">
					<h4 class="h4">Banned Heroes:</h4>
					{#if $banStore.bannedHeroes.length > 0}
						<div>
							{#each $banStore.bannedHeroes as bannedHero}
								<span class="badge preset-filled-secondary-500">{bannedHero?.localized_name}</span>
							{/each}
						</div>
					{:else}
						<p>none</p>
					{/if}
				</div>
				<div class="flex justify-around">
					<button
						class={'btn dark:bg-purple-800/50 bg-purple-500/50 w-1/3'}
						disabled={!session}
						onclick={() => saveBanList()}>{!session ? 'Log In to save 3 Free Bans' : 'Save Bans to account'}</button
					>
					<button
						class="btn bg-red-500 w-1/3"
						disabled={$banStore.bannedHeroes.length === 0}
						onclick={() => setBanList()}>Clear</button
					>
				</div>
			</div>
			<!-- {#if !showHeroGrid}
					<div class="border-double border-b-4 border-amber-500 w-full"></div>
				{/if} -->
		</div>

		<!-- Autobans Roles and Modifiers -->
		<div
			class="md:w-full max-md:max-w-sm text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2"
		>
			<!-- Auto Bans -->
			<div class="relative">
				{#if randomFound}
					<div class="z-40 absolute h-full w-full bg-slate-800/80 flex flex-col items-center justify-center rounded-xl">
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
					<button class="btn dark:bg-amber-800 bg-amber-500 w-1/2 my-4" onclick={() => setBanList('garbage')}
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
									onclick={() => handleRoleSelect(role)}
									checked={$banStore.selectedRoles.includes(role)}
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
						<p>{$banStore.bannedHeroes.length}</p>
						<p>
							{$banStore.bannedHeroes.length < freeBans ? freeBans - $banStore.bannedHeroes.length : 0}
						</p>
						<p class="text-green-600">{$banStore.availableHeroes.length}</p>
						<p class="text-red-500">-{$banStore.modifierTotal}</p>
						<p class="text-amber-500 font-bold">
							{$banStore.expectedGold}
						</p>
					</div>
				</div>
			</div>

			{#if !randomFound}
				<!-- Random Button-->
				<!-- <button
			on:click={generateRandomHero}
			disabled={randomFound}
			class="z-50 btn variant-filled-primary w-full my-4 max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
			>Random me</button
		> -->
			{/if}
		</div>
	</div>
</div>
