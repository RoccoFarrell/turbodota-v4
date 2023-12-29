<script lang="ts">
	import * as d3 from 'd3';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';
	import { draw, fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	//import { playersWeCareAbout } from '$lib/constants/playersWeCareAbout.ts';
	import type { FriendshipMMR } from '@prisma/client';

	export let data;
	console.log(data);

	let testMMRData: FriendshipMMR[] = [];
	let testMMRData2: FriendshipMMR[] = [];

	let mmrData = [];
	let mmrData2 = [];

	const playersWeCareAbout = [
		{ playerID: 65110965, playerName: 'Rocco', selected: true },
		{ playerID: 34940151, playerName: 'Roberts', selected: true },
		{ playerID: 80636612, playerName: 'Martin', selected: true },
		{ playerID: 113003047, playerName: 'Danny', selected: true },
		{ playerID: 125251142, playerName: 'Matt', selected: true },
		{ playerID: 423076846, playerName: 'Chris', selected: true },
		{ playerID: 67762413, playerName: 'Walker', selected: true },
		{ playerID: 68024789, playerName: 'Ben', selected: true }
	];

	//temporary - try building graph for just 2 people first
	const result = data.streamed.mmr.mmr.filter((val: FriendshipMMR) => val.account_id === 34940151);
	const result2 = data.streamed.mmr.mmr.filter((val: FriendshipMMR) => val.account_id === 80636612);

	//recalculate MMR after each match
	//need to reverse the data because script outputs data with newest match first
	result
		.slice()
		.reverse()
		.forEach((element, i = 0) => {
			if (i == 0) {
				if (element.winorloss == 1) {
					mmrData[i] = 1000 + element.mmrModifier;
				} else {
					mmrData[i] = 1000 - element.mmrModifier;
				}
			} else if (element.winorloss == 1) {
				mmrData[i] = mmrData[i - 1] + element.mmrModifier;
			} else if (element.winorloss == 0) {
				mmrData[i] = mmrData[i - 1] - element.mmrModifier;
			}
			i = i + 1;
		});

	// calculate MMR for second user
	result2
		.slice()
		.reverse()
		.forEach((element, i = 0) => {
			if (i == 0) {
				if (element.winorloss == 1) {
					mmrData2[i] = 1000 + element.mmrModifier;
				} else {
					mmrData2[i] = 1000 - element.mmrModifier;
				}
			} else if (element.winorloss == 1) {
				mmrData2[i] = mmrData2[i - 1] + element.mmrModifier;
			} else if (element.winorloss == 0) {
				mmrData2[i] = mmrData2[i - 1] - element.mmrModifier;
			}
			i = i + 1;
		});

	//setup graph size and margins
	let width = 1280;
	let height = 720;
	let marginTop = 20;
	let marginRight = 20;
	let marginBottom = 20;
	let marginLeft = 50;
	$: x = d3.scaleLinear([0, mmrData2.length - 1], [marginLeft, width - marginRight]);
	$: y = d3.scaleLinear(d3.extent(mmrData2) as [number, number], [height - marginBottom, marginTop]);
	$: line = d3.line((d, i) => x(i), y);

	//setup axis
	let gx: any;
	let gy: any;
	$: d3.select(gy).call(d3.axisLeft(y));
	$: d3.select(gx).call(d3.axisBottom(x));

	//display both by default
	onMount(() => {
		players.Martin = true
		players.Roberts = true
	});

	let players: Record<string, boolean> = {
		Martin: true,
		Roberts: false
	};

	function toggle(name: string): void {
		players[name] = !players[name];
	}
</script>

<!-- Add chart -->
<svg {width} {height}>
	<!-- Add x-axis -->
	<g bind:this={gx} transform="translate(0,{height - marginBottom})" color="white" />
	<!-- Add y-axis -->
	<g bind:this={gy} transform="translate({marginLeft},0)" color="white" />
	<!-- Add line -->
	{#if players.Martin}
		<path
			stroke-width="1"
			fill="none"
			d={line(mmrData2)}
			stroke="green"
			transition:draw={{ easing: (t) => t, duration: 500 }}
		/>
		<!-- Add data points -->
	{/if}
	{#if players.Roberts}
		<path
			stroke-width="1"
			fill="none"
			d={line(mmrData)}
			stroke="red"
			transition:draw={{ easing: (t) => t, duration: 500 }}
		/>
	{/if}
	<g stroke-width="1.5">
		{#each mmrData2 as d, i}
			<!-- <circle cx={x(i)} cy={y(d)} r="2.5" fill="white" /> -->
		{/each}
	</g>
</svg>

<div>
	{#each playersWeCareAbout as player}
		<button
			class="chip {player.selected} 'variant-filled' : 'variant-soft'"
			on:click={() => {
				toggle(player.playerName);
			}}
			on:keypress
		>
			{#if player.selected}<span></span>{/if}
			<span class="capitalize">{player.playerName}</span>
		</button>
	{/each}
</div>
