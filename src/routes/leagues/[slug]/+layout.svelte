<script lang="ts">
	import { page } from '$app/stores';
	import dayjs from 'dayjs';

	export let data;
	//console.log('leagues slug layout data:', data);

	import Trophy_light from '$lib/assets/trophy_light.png';

	//console.log($page.url);
	let breadcrumbs = $page.url.pathname.split('/');
	//console.log(`breadcrumbs length: `, breadcrumbs);
</script>

<main class="w-full">
	<div
		class="fixed lg:w-[calc(100%-256px)] w-full rounded-b-xl border-b border-primary-500 shadow-xl flex justify-around items-center p-4 z-50 dark:bg-surface-600 bg-surface-100"
	>
		<ol class="breadcrumb xl:w-1/3 md:w-3/4 w-full">
			<li class="crumb"><a class="anchor" href="/leagues">Leagues</a></li>
			<li class="crumb-separator" aria-hidden>&rsaquo;</li>
			{#if breadcrumbs.length > 3}
				<li class="max-w-[200px]">
					<a class="" href="/leagues/{data.selectedLeague.id}"
						><p class="text-amber-500 font-bold truncate hover:text-primary-400 hover:underline">
							{data.selectedLeague.name}
						</p></a
					>
				</li>
			{:else}
				<li class="max-w-[200px]">
					<p class="text-amber-500 font-bold truncate">{data.selectedLeague.name}</p>
				</li>
			{/if}

			{#if $page.url.pathname.includes('/seasons')}
				<li class="crumb-separator" aria-hidden>&rsaquo;</li>
				{#if breadcrumbs.length === 4}
					<li>Seasons</li>
				{:else if breadcrumbs.length === 5}
					<li class="crumb"><a class="anchor" href={`/leagues/${data.selectedLeague.id}/seasons`}>Seasons</a></li>
				{/if}
			{/if}
			<!-- <li>{data.selectedLeague.id}</li> -->
		</ol>
		<!-- <div class="flex justify-center items-center space-x-4">
			<img src={Trophy_light} class="w-10 h-10" alt="leagues page" />
			<h4 class="h4 text-amber-500 animate-pulse">{data.selectedLeague.name}</h4>
		</div> -->

		<div class="flex justify-between items-center w-1/2 max-lg:hidden">
			<div class="text-sm">
				Commissioner: <p class="inline font-semibold text-primary-500">
					{data.selectedLeague.creator.username}
				</p>
			</div>
			<div>
				Created on: <p class="inline font-semibold text-primary-500">
					{dayjs(data.selectedLeague.createdDate).format('MM/DD/YYYY')}
				</p>
			</div>
			<div>
				Members: <p class="inline font-semibold text-primary-500">{data.selectedLeague.members.length}</p>
			</div>
		</div>

		<!-- <div class="card w-full border border-dashed border-red-500 p-4">
			
		</div> -->
	</div>
	<div class="mt-24">
		<slot />
	</div>
</main>
