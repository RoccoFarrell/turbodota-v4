<script lang="ts">
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
    import DataTableCheckbox from "./data-table-checkbox.svelte";

	export let data;
	//console.log(data);

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
			header: ''
		})
	]);

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } = table.createViewModel(columns);

    const { selectedDataIds } = pluginStates.select;

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
		<div class="flex items-center w-full justify-around space-x-4 border-b border-dashed border-primary-500">
			<div class="flex items-center space-x-4">
				<p class="text-xs text-tertiary-500">season:</p>
				<h2 class="h2 text-primary-500">{data.selectedSeason.name}</h2>
			</div>

			<div>
				<div class="text-tertiary-500">
					<p class="inline text-xs">started:</p>
					<p class="inline font-semibold text-primary-500">{dayjs().to(dayjs(data.selectedSeason.startDate))}</p>
				</div>
				<div class="text-tertiary-500">
					<p class="inline text-xs">ends:</p>
					<p class="inline font-semibold text-green-500">{dayjs().to(dayjs(data.selectedSeason.endDate))}</p>
				</div>
			</div>
		</div>
		<div class="grid grid-cols-2"></div>
		<div>
			{JSON.stringify(data.selectedSeason, null, 4)}
			<div class="rounded-md border">
				<Table.Root {...$tableAttrs}>
					<Table.Header>
						{#each $headerRows as headerRow}
							<Subscribe rowAttrs={headerRow.attrs()}>
								<Table.Row>
									{#each headerRow.cells as cell (cell.id)}
										<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
											<Table.Head {...attrs} class="[&:has([role=checkbox])]:pl-3">
												<Render of={cell.render()} />
											</Table.Head>
										</Subscribe>
									{/each}
								</Table.Row>
							</Subscribe>
						{/each}
					</Table.Header>
					<Table.Body {...$tableBodyAttrs}>
						{#each $pageRows as row (row.id)}
							<Subscribe rowAttrs={row.attrs()} let:rowAttrs>
								<Table.Row {...rowAttrs} data-state={$selectedDataIds[row.id] && 'selected'}>
									{#each row.cells as cell (cell.id)}
										<Subscribe attrs={cell.attrs()} let:attrs>
											<Table.Cell {...attrs}>
												<Render of={cell.render()} />
											</Table.Cell>
										</Subscribe>
									{/each}
								</Table.Row>
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
	</div>
</section>
