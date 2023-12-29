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

	let newArr = Array();
	playersWeCareAbout.forEach(function (element, i) {
		newArr[i] = data.streamed.mmr.mmr.filter((val: FriendshipMMR) => val.account_id === element.playerID);
	});

	//newArr.slice(1,2).reverse().forEach((element, i) => {console.log(element)})

	//temporary - try building graph for just 2 people first
	// const result = data.streamed.mmr.mmr.filter((val: FriendshipMMR) => val.account_id === 80636612);
	// const result2 = data.streamed.mmr.mmr.filter((val: FriendshipMMR) => val.account_id === 34940151);


	//recalculate MMR after each match
	//need to reverse the data because script outputs data with newest match first
	newArr
		.slice(1,2)
		.reverse()[0]
		.forEach((element, i) => {
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
	newArr
		.slice(2,3)
		.reverse()[0]
		.forEach((element, i) => {
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

	let testLineData = {
		labels: newArr[1].map((row) => row.start_time),
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
				data: mmrData
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
				data: mmrData2
			}
		]
	};
</script>

<div class="flex flex-col">
	<div class="grid grid-cols-1 m-10 max-w-[calc(100%-80px)]">
		<div>
			<Line data={testLineData} width={1200} height={1080} options={{ maintainAspectRatio: false, responsive: true }} />
		</div>
	</div>
</div>
