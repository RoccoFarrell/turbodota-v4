<script lang="ts">
	import dayjs from 'dayjs';

	export let data;
	console.log('leagues slug layout data:', data);

	import Trophy_light from '$lib/assets/trophy_light.png';
</script>

<main class="w-full">
	<div class="fixed lg:w-[calc(100%-256px)] rounded-b-xl border-b border-primary-500 shadow-xl flex justify-around items-center p-4 z-50 dark:bg-surface-600 bg-surface-100">
        <ol class="breadcrumb w-1/4">
            <li class="crumb"><a class="anchor" href="/leagues">Leagues</a></li>
            <li class="crumb-separator" aria-hidden>&rsaquo;</li>
            <li>{data.selectedLeague.id}</li>
        </ol>
		<div class="flex justify-center items-center space-x-4">
			<img src={Trophy_light} class="w-10 h-10" alt="leagues page" />
			<h4 class="h4 text-amber-500 animate-pulse">{data.selectedLeague.name}</h4>
		</div>

		<div class="grid grid-cols-4 gap-4 place-items-center">
			<div class="text-sm">
				Commissioner: <p class="inline font-semibold text-xl text-primary-500">
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
