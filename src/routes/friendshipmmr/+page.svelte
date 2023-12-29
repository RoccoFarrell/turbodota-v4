<script lang="ts">
	import * as d3 from 'd3';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';
	import { draw, fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	//import { playersWeCareAbout } from '$lib/constants/playersWeCareAbout.ts';
	import type { FriendshipMMR } from '@prisma/client';
	import { Line } from 'svelte-chartjs';

	import {
		Chart as ChartJS,
		Title,
		Tooltip,
		Legend,
		LineElement,
		LinearScale,
		PointElement,
		CategoryScale
	} from 'chart.js';

	ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale);

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
	const result = data.streamed.mmr.mmr.filter((val: FriendshipMMR) => val.account_id === 80636612);
	const result2 = data.streamed.mmr.mmr.filter((val: FriendshipMMR) => val.account_id === 34940151);

	console.log(result);
	console.log(result2);

	//recalculate MMR after each match
	//need to reverse the data because script outputs data with newest match first
	result
		.slice()
		.reverse()
		.forEach((element, i = 0) => {
			if (i == 0) {
				if (element.win == true) {
					mmrData[i] = 1000 + element.mmrModifier;
				} else {
					mmrData[i] = 1000 - element.mmrModifier;
				}
			} else if (element.win == true) {
				mmrData[i] = mmrData[i - 1] + element.mmrModifier;
			} else if (element.win == 0) {
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
				if (element.win == true) {
					mmrData2[i] = 1000 + element.mmrModifier;
				} else {
					mmrData2[i] = 1000 - element.mmrModifier;
				}
			} else if (element.win == true) {
				mmrData2[i] = mmrData2[i - 1] + element.mmrModifier;
			} else if (element.win == 0) {
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
		players.Martin = true;
		players.Roberts = true;
	});

	let players: Record<string, boolean> = {
		Martin: true,
		Roberts: true
	};

	function toggle(name: string): void {
		players[name] = !players[name];
	}

	let testLineData = {
		labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
		datasets: [
			{
				label: 'My First dataset',
				fill: true,
				lineTension: 0.3,
				backgroundColor: 'rgba(225, 204,230, .3)',
				borderColor: 'rgb(205, 130, 158)',
				borderCapStyle: 'butt',
				borderDash: [],
				borderDashOffset: 0.0,
				borderJoinStyle: 'miter',
				pointBorderColor: 'rgb(205, 130,1 58)',
				pointBackgroundColor: 'rgb(255, 255, 255)',
				pointBorderWidth: 10,
				pointHoverRadius: 5,
				pointHoverBackgroundColor: 'rgb(0, 0, 0)',
				pointHoverBorderColor: 'rgba(220, 220, 220,1)',
				pointHoverBorderWidth: 2,
				pointRadius: 1,
				pointHitRadius: 10,
				data: [65, 59, 80, 81, 56, 55, 40]
			},
			{
				label: 'My Second dataset',
				fill: true,
				lineTension: 0.3,
				backgroundColor: 'rgba(184, 185, 210, .3)',
				borderColor: 'rgb(35, 26, 136)',
				borderCapStyle: 'butt',
				borderDash: [],
				borderDashOffset: 0.0,
				borderJoinStyle: 'miter',
				pointBorderColor: 'rgb(35, 26, 136)',
				pointBackgroundColor: 'rgb(255, 255, 255)',
				pointBorderWidth: 10,
				pointHoverRadius: 5,
				pointHoverBackgroundColor: 'rgb(0, 0, 0)',
				pointHoverBorderColor: 'rgba(220, 220, 220, 1)',
				pointHoverBorderWidth: 2,
				pointRadius: 1,
				pointHitRadius: 10,
				data: [28, 48, 40, 19, 86, 27, 90]
			}
		]
	};
</script>

<div class="flex flex-col">
	<div class="flex m-10 font-xl items-center justify-center">
		{#each playersWeCareAbout as player}
			<button
				class="btn variant-filled-primary {player.selected} 'variant-filled' : 'variant-soft'"
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

	<div class="grid grid-cols-2 m-10 gap-10 max-w-[calc(100%-80px)]">
		<div>
			<Line data={testLineData} width={100} height={50} options={{ maintainAspectRatio: false, responsive: true }} />
		</div>
		

		<div>
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
						d={line(mmrData)}
						stroke="green"
						transition:draw={{ easing: (t) => t, duration: 500 }}
					/>
					<!-- Add data points -->
				{/if}
				{#if players.Roberts}
					<path
						stroke-width="1"
						fill="none"
						d={line(mmrData2)}
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
		</div>
	</div>
</div>
