<script lang="ts">
	import Landscape from '$lib/assets/landscape3.png';
	import TurbotownDark from '$lib/assets/turbotown_dark_noText.png';
	import WantedPoster from '$lib/assets/wantedPoster.png';
	import Item from '$lib/assets/item_generic.png';
	import Tournament from '$lib/assets/tournament_light.png';
	import League from '$lib/assets/league.png';

	import { getContext } from 'svelte';
	let session: any = getContext('session')

</script>

<div class="w-full flex flex-col items-center space-y-4 pb-20">
	<div class="w-full relative">
		<div class="absolute z-20 flex flex-col justify-center h-full w-full my-auto p-8">
			<div class="flex justify-center items-center h-full max-h-96">
				<img src={TurbotownDark} class="w-1/2 bg-surface-900/1 object-scale-down" alt="turbotown" />
				<h1 class="h1 text-tertiary-100 font-bold text-center xl:text-8xl text-4xl">TurboTown</h1>
			</div>
			<h2 class="h2 z-20 italic text-center text-amber-500 h-1/4">Will you be The King?</h2>

			<!-- <div class="w-full h-3/4 border border-red-500"></div> -->
		</div>

		<div class="h-full z-10 absolute top-0 bg-linear-to-b from-surface-900/50 to-surface-900 w-full"></div>
		<img src={Landscape} class="z-0 w-full" alt="the battle rages in the valley below" />
	</div>

	<div
		id="townBullets"
		class="3xl:w-1/2 2xl:w-3/4 xl:w-4/5 md:w-7/8 w-9/10 flex flex-col justify-center items-center px-8 space-y-4"
	>
		<!-- Quests Tavern -->
		<div class="w-full border-b border-dashed border-amber-500 flex flex-col gap-y-2 pb-2">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-y-2 px-4 py-2">
				<div class="min-h-10 rounded-full flex items-center justify-center">
					<img src={WantedPoster} class="h-40 rounded-full border-2 shadow-xl border-amber-500" alt="questboard" />
				</div>
				<div class="flex flex-col items-center justify-between space-y-10 min-h-20">
					<h3 class="h4">
						Visit <p class="font-bold text-emerald-500 inline">The Tavern</p>
						to fill your questboard and embark on an epic adventure to become king of TurboTown.
					</h3>
					<div class="svg-wrapper">
						<a href = { session ? "/turbotown/quests" : "/api/auth/steam"}>
							<svg height="60" width="320" xmlns="http://www.w3.org/2000/svg">
								<rect class="shape hover:bg-amber-500" height="60" width="320" />
							</svg>
							<div class="boxText w-full text-center">
								<p class="font-bold text-emerald-500">Visit Tavern</p>
							</div>
						</a>
					</div>
				</div>
			</div>
		</div>
		<!-- Shop -->
		<div class="w-full border-b border-dashed border-amber-500 flex flex-col gap-y-2 pb-2">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-y-2 px-4 py-2">
				<div class="flex flex-col items-center justify-between space-y-10 min-h-20">
					<h3 class="h4">
						Visit the <p class="font-bold text-primary-500 inline">Secret Shop</p>
						to spend your acquired gold on unique and magical items.
					</h3>
					<div class="svg-wrapper">
						<a href = { session ? "/turbotown/shop" : "/api/auth/steam"}>
							<svg height="60" width="320" xmlns="http://www.w3.org/2000/svg">
								<rect class="shape hover:bg-amber-500" height="60" width="320" />
							</svg>
							<div class="boxText w-full text-center">
								<p class="font-bold text-primary-500">Secret Shop</p>
							</div>
						</a>
					</div>
				</div>
				<div class="min-h-40 rounded-full flex items-center justify-center">
					<img src={Item} class="h-40 rounded-full border-2 shadow-xl border-amber-500 object-fit" alt="questboard" />
				</div>
			</div>
		</div>
		<!-- Leagues -->
		<div class="w-full border-b border-dashed border-amber-500 flex flex-col gap-y-4 pb-8">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 p-8">
				<div class="min-h-40 rounded-full flex items-center justify-center">
					<img src={League} class="h-40 rounded-full border-2 shadow-xl border-amber-500 object-fit" alt="questboard" />
				</div>
				<div class="flex flex-col items-center justify-between space-y-10 min-h-40">
					<h3 class="h4">
						Create and manage your own <p class="font-bold text-indigo-500 inline">League</p>
						with your friends. Launch each season with unique functionality to change the TurboTown Strategy.
					</h3>
					<div class="svg-wrapper">
						<a href = { session ? "/leagues" : "/api/auth/steam"}>
							<svg height="60" width="320" xmlns="http://www.w3.org/2000/svg">
								<rect class="shape hover:bg-amber-500" height="60" width="320" />
							</svg>
							<div class="boxText w-full text-center">
								<p class="font-bold text-indigo-500">Leagues</p>
							</div>
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- 


Fill your questboard and embark on an epic adventure to become king of TurboTown. {Questboard Image}


{Secret Shop Image} Visit the secret shop to spend your acquired gold on unique and magical items.


Battle your way up the leaderboard by winning turbo dota games and strategically managing your TurboTown! {Leaderboard Image}


{League Creation Image} Create and manage your own TurbowTown leagues with your friends. 


Launch each season with unique functionality to change the TurboTown Strategy. {Season Creation Image}


{Hero Stats Image} Track your turbodota statistics and compare amongst your friends and peers with our Hero Stats calculator.
//stroke: theme(colors.amber.500);
-->

<style>
	.svg-wrapper {
		position: relative;
		width: 320px;
		max-width: 100%;
	}

	@media (max-width: 640px) {
		.svg-wrapper {
			width: 100%;
		}

		.svg-wrapper svg {
			width: 100%;
		}
	}

	.boxText {
		top: -42px;
		position: relative;
		pointer-events: none;
	}

	.shape {
		stroke-dasharray: 140 540;
		stroke-dashoffset: -467;
		stroke-width: 8px;
		fill: transparent;
		border-bottom: 5px solid black;
		transition:
			fill 1s ease,
			stroke-width 1s,
			stroke-dashoffset 1s,
			stroke-dasharray 1s;
		stroke: #f59e0b; /* amber-500 */
	}

	.shape:hover {
		fill: rgba(245, 158, 11, 0.1); /* amber-500/10 */
		stroke-width: 2px;
		stroke-dashoffset: 0;
		stroke-dasharray: 760;
	}
</style>
