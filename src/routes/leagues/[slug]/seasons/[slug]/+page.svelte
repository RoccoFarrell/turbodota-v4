<script lang="ts">
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);

	export let data;
	console.log(data);

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
		</div>
	</div>
</section>
