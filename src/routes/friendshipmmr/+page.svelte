<script lang="ts">
	import dayjs from 'dayjs';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';
	import { draw, fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	//import { playersWeCareAbout } from '$lib/constants/playersWeCareAbout.ts';
	import type { FriendshipMMR } from '@prisma/client';
	// TODO: Re-enable chart after migrating to Svelte 5 compatible chart library
	// import { Line } from 'svelte-chartjs';

	// import {
	// 	Chart as ChartJS,
	// 	Title,
	// 	Tooltip,
	// 	Legend,
	// 	LineElement,
	// 	LinearScale,
	// 	PointElement,
	// 	CategoryScale,
	// 	TimeScale,
	// 	Decimation
	// } from 'chart.js';

	// import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';

	// ChartJS.register(
	// 	Title,
	// 	Tooltip,
	// 	Legend,
	// 	LineElement,
	// 	LinearScale,
	// 	PointElement,
	// 	CategoryScale,
	// 	TimeScale,
	// 	Decimation
	// );

	let { data } = $props();
	console.log(data);

	/* 
		Start transform data
	*/

	let chartData = { ...data.streamed.mmr.returnMMRData };

	console.log(`chart data before transformation: `, chartData);

	Object.keys(chartData).forEach((player: string) => {
		let cumulativeMMR = 1000;
		chartData[player] = chartData[player]
			.map((mmrItem: FriendshipMMR, i: any) => {
				if (mmrItem.win) cumulativeMMR += mmrItem.mmrModifier;
				else cumulativeMMR -= mmrItem.mmrModifier;

				return {
					matchTime: dayjs(mmrItem.start_time).valueOf(),
					mmr: cumulativeMMR
				};

				//12-29-23 i think this is broken, im not adding the mmrs right \/ \/ \/
			})
			.sort((a: any, b: any) => {
				if (a.matchTime < b.matchTime) return -1;
				else return 1;
			});

		chartData[player][0].mmr = 1000
	});

	console.log(`chart data after transformation: `, chartData);

	//filter by one id for testing
	// chartData = {
	// 	65110965: chartData[65110965]
	// }

	const chartLineData = {
		datasets: Object.keys(chartData).map((playerID: any) => {
			return {
				label: `User ${playerID}`,
				fill: true,
				indexAxis: 'x',
				type: 'line',
				lineTension: 0.1,
				backgroundColor: 'rgba(225, 204,230, .3)',
				borderColor: `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(
					Math.random() * 256
				)})`,
				data: chartData[playerID].map((mmrItem: any) => {
					//console.log(mmrItem)
					return {
						x: mmrItem.matchTime,
						y: mmrItem.mmr
					};
				})
			};
		})
	};

	console.log(`chartLineData: `, chartLineData);

	/* 
		End transform data
	*/
	const testLineData = {
		//labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
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
				data: [30, 50, 70, 20, 90, 10, 40]
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

	const chartOptions = {
		maintainAspectRatio: false,
		responsive: true,
		scales: {
			xAxis: {
				type: 'time'
			},
			y: {
				suggestedMin: 800,
				suggestedMax: 1200
			}
		},
		parsing: false,
		plugins: {
			decimation: {
				algorithm: 'lttb',
				enabled: true,
				samples: 5,
				threshold: 5
			}
		}
	};
</script>

<div class="flex flex-col">
	<div class="grid grid-cols-1 m-10 max-w-[calc(100%-80px)]">
		<div>
			<!-- TODO: Re-enable chart after migrating to Svelte 5 compatible chart library -->
			<!-- Chart temporarily disabled - svelte-chartjs is incompatible with Svelte 5 -->
			<div class="p-8 bg-surface-500/10 rounded-lg border border-surface-500">
				<p class="text-lg font-semibold mb-2">MMR Chart Temporarily Disabled</p>
				<p class="text-sm text-surface-500">
					The chart is temporarily disabled while we migrate to a Svelte 5 compatible charting library.
					Chart data is still being processed and will be displayed once the migration is complete.
				</p>
			</div>
			<!-- <Line data={chartLineData} width={1200} height={1080} options={chartOptions} /> -->
		</div>
	</div>
</div>
