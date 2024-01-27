<script lang="ts">
	import AddRandomsToSeason from './AddRandomsToSeason.svelte';

	import { browser } from '$app/environment';

	//components
	import SeasonHeaderCard from './SeasonHeaderCard.svelte';
	import SeasonLeaderboard from './SeasonLeaderboard.svelte';

	//SVELTE
	import { enhance } from '$app/forms';

	//day js
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);

	import type { Random } from '@prisma/client';

	/* 
        Data table setup
    */
	import { createTable, Render, Subscribe, createRender } from 'svelte-headless-table';
	import { addSelectedRows } from 'svelte-headless-table/plugins';
	import { readable } from 'svelte/store';
	import * as Table from '$lib/components/ui/table';
	import DataTableCheckbox from './data-table-checkbox.svelte';

	export let data;
	if(browser){
		console.log(`[/seasons/<ID>] data: `, data);
	}
	

	const table = createTable(readable(data.random.allRandoms), {
		select: addSelectedRows()
	});

	const columns = table.createColumns([
		table.column({
			accessor: 'id',
			header: (_, { pluginStates }) => {
				const { allPageRowsSelected } = pluginStates.select;
				return createRender(DataTableCheckbox, {
					checked: allPageRowsSelected
				});
			},
			cell: ({ row }, { pluginStates }) => {
				const { getRowState } = pluginStates.select;
				const { isSelected } = getRowState(row);
				return createRender(DataTableCheckbox, {
					checked: isSelected
				});
			}
		}),
		table.column({
			accessor: 'status',
			header: 'Status'
		}),
		table.column({
			accessor: 'date',
			header: 'Start Date'
		}),
		table.column({
			accessor: 'randomedHero',
			header: 'Hero'
		}),
		table.column({
			accessor: ({ id }) => id,
			header: 'Random ID'
		})
	]);

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } = table.createViewModel(columns);

	const { selectedDataIds } = pluginStates.select;

	let formDataIds: any;
	$: {
		formDataIds = Object.keys($selectedDataIds).map((dataId: any) => {
			if ($selectedDataIds[dataId]) return data.allRandoms[dataId].id;
		});
		console.log('selectedDataIDs', $selectedDataIds);
	}

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	BigInt.prototype.toJSON = function (): number {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore: Unreachable code error
		return this.toString();
	};
</script>

<section>
	<div class="flex flex-col items-center justify-center w-3/4 mx-auto">
		<div class="flex items-center w-full justify-around space-x-4 border-b border-dashed border-primary-500 p-4">
			<div class="flex items-center space-x-4">
				<p class="text-sm text-tertiary-500">season:</p>
				<h2 class="h2 text-primary-500">{data.league.currentSeason.name}</h2>
			</div>

			<div>
				<div class="text-tertiary-500">
					<p class="inline text-xs">started:</p>
					<p class="inline font-semibold text-primary-500">{dayjs().to(dayjs(data.league.currentSeason.startDate))}</p>
				</div>
				<div class="text-tertiary-500">
					<p class="inline text-xs">ends:</p>
					<p class="inline font-semibold text-green-500">{dayjs().to(dayjs(data.league.currentSeason.endDate))}</p>
				</div>
			</div>
		</div>
		<div class="container py-4 flex flex-col space-y-4">
			<!-- <div>
				<HeroGrid heroes={data.heroDescriptions.allHeroes}/>
			</div> -->
			<SeasonHeaderCard data={data}></SeasonHeaderCard>
			<div class="flex flex-col space-y-4 justify-center items-center border border-secondary-500/10 rounded-xl">
				{#if data.league.currentSeason && data.league.currentSeason.turbotowns}
					<SeasonLeaderboard
						turbotowns={data.league.currentSeason.turbotowns}
						members={data.league.leagueAndSeasonsResult[0].members}
						randoms={data.league.currentSeason.randoms}
					/>
				{/if}
			</div>
		</div>

		<!-- <AddRandomsToSeason data={data}></AddRandomsToSeason> -->
	</div>
</section>
