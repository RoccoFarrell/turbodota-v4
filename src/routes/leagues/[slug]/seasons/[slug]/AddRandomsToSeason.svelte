<script lang="ts">
	import { run } from 'svelte/legacy';

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

	let { data = $bindable() } = $props();
	console.log(`[/seasons/<ID>] data: `, data);

	const table = createTable(readable(data.allRandoms), {
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

	let formDataIds: any = $state();
	run(() => {
		formDataIds = Object.keys($selectedDataIds).map((dataId: any) => {
			if ($selectedDataIds[dataId]) return data.allRandoms[dataId].id;
		});
		console.log('selectedDataIDs', $selectedDataIds);
	});

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	BigInt.prototype.toJSON = function (): number {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore: Unreachable code error
		return this.toString();
	};
</script>

<div class="flex flex-col w-full space-y-4 my-4">
			<h2 class="h2">Add Randoms</h2>
			<form method="POST" class="space-y-8" action="?/updateSeasonRandoms" use:enhance>
				<button class="btn preset-filled-primary-500" type="submit">Update Randoms in Season</button>
				
				<label class="label w-1/4">
					<span>League ID</span>
					<input class="input text-xs" type="text" disabled name="seasonID" bind:value={data.selectedSeason.id} />
					<input class="input text-xs" type="text" hidden name="seasonID" bind:value={data.selectedSeason.id} />
				</label>
				<label class="label">
					<span>Random IDs</span>
					<textarea class="textarea" rows="3" name="selectedDataIds" bind:value={formDataIds}></textarea>
				</label>
				
			</form>
			<!-- Data Table -->
			<div class="rounded-md border">
				<Table.Root {...$tableAttrs}>
					<Table.Header>
						{#each $headerRows as headerRow}
							<Subscribe rowAttrs={headerRow.attrs()}>
								<Table.Row>
									{#each headerRow.cells as cell (cell.id)}
										<Subscribe attrs={cell.attrs()}  props={cell.props()}>
											{#snippet children({ attrs })}
																		<Table.Head {...attrs} class="[&:has([role=checkbox])]:pl-3">
													<Render of={cell.render()} />
												</Table.Head>
																												{/snippet}
																</Subscribe>
									{/each}
								</Table.Row>
							</Subscribe>
						{/each}
					</Table.Header>
					<Table.Body {...$tableBodyAttrs}>
						{#each $pageRows as row (row.id)}
							<Subscribe rowAttrs={row.attrs()} >
								{#snippet children({ rowAttrs })}
												<Table.Row {...rowAttrs} data-state={$selectedDataIds[row.id] && 'selected'}>
										{#each row.cells as cell (cell.id)}
											<Subscribe attrs={cell.attrs()} >
												{#snippet children({ attrs })}
																		<Table.Cell {...attrs}>
														<Render of={cell.render()} />
													</Table.Cell>
																													{/snippet}
																</Subscribe>
										{/each}
									</Table.Row>
																			{/snippet}
										</Subscribe>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
			<div class="flex items-center justify-end space-x-4 py-4">
				<div class="flex-1 text-sm text-muted-foreground">
					{Object.keys($selectedDataIds).length} of{' '}
					{$pageRows.length} row(s) selected.
				</div>
			</div>
		</div>

