<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
	import HeroGrid from '$lib/components/HeroGrid.svelte';
	import type { TableSource } from '@skeletonlabs/skeleton';
	import {
		Table,
		tableSourceValues,
		tableMapperValues,
		ProgressRadial,
		filter,
		TabGroup,
		Tab,
		TabAnchor
	} from '@skeletonlabs/skeleton';
	import Loading from '$lib/components/Loading.svelte';
	//import { draftStore } from '$lib/stores/draftStore';
	console.log(data);

	const testData2 = [
		{ name: 'John', email: 'john@example.com' },
		{ name: 'Mark', email: 'mark@gmail.com' }
	];

	class TableRow {
		heroID: number = 0;
	}

	let tabSet: number = 0;

	let tableData: TableSource = {
		head: [],
		body: []
	};

	tableData = {
		head: tableData.head,
		body: tableData.body
	};

	const heroList = data.heroDescriptions.allHeroes;
	let leftOverHeroes = heroList.length % data.leagues[0].members.length;
	let numberOfRounds = (heroList.length - leftOverHeroes) / data.leagues[0].members.length;
	let pickList = Array();
	let numberOfUsers = data.leagues[0].members.length

	for (let i = 0; i < numberOfRounds * numberOfUsers; i++) {
		pickList[i] = {
			id: null,
			name: '',
			localized_name: '',
			primary_attr: '',
			attack_type: '',
			roles: '',
			legs: null
		};
	}

	let currentPick: number = 1;
	let myPosition=1;

	const onHeroSelect = (heroEvent: CustomEvent) => {
		//pickList = [...pickList, heroEvent.detail];

		if (currentPick % (2 * numberOfUsers) == (2 * numberOfUsers - (myPosition - 1)) % (2 * numberOfUsers) || currentPick % (2 * numberOfUsers) == myPosition) {
			console.log('I picked a hero!');
		}

		pickList[currentPick - 1] = heroEvent.detail;
		currentPick += 1;
		//console.log(pickList);
	};
</script>

<div class="container md:m-4 my-4 h-full mx-auto w-full max-sm:mb-20">
	<div>
		<div class="my-4"><HeroGrid on:heroclick={onHeroSelect} allHeroes={heroList} /></div>
	</div>

	<div class="table-container">
		<table class="table table-hover">
			<thead>
				<tr class="dotaUserRow">
					<!-- <th>&nbsp</th> -->
					{#each data.leagues[0].members as member}
						<th>{member.account_id}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				<!-- {#each { length: numberOfRounds } as _, i} -->
				<!-- <tr> -->
				<!-- {i} -->
				{#each pickList as _, i}
					{#if ((i + 1) & data.leagues[0].members.length) == 0}
						<tr></tr>
					{/if}
					{#if pickList[i].id !== null}
						<td>{pickList[i].localized_name}</td>
					{/if}
				{/each}
				<!-- </tr> -->
				<!-- {/each} -->
			</tbody>
		</table>
	</div>
</div>

<div class="mb-2 bg-surface-500/10 p-4 w-1/5 mx-auto shadow-md h-32">
	<h3 class="h3 dark:text-yellow-500 text-primary-500">On The Clock:</h3>
	<p class="text-xl h-8">Slippypeppy</p>
	<p class="text-xs">Next turn in: 4 picks</p>
</div>
