<script lang="ts">
	import { page } from '$app/stores';
	import dayjs from 'dayjs';

	let { data, children } = $props();

	let breadcrumbs = $page.url.pathname.split('/');
</script>

<main class="relative min-h-screen w-full bg-gray-950">
	<!-- Background atmosphere -->
	<div class="pointer-events-none absolute inset-0">
		<div class="absolute inset-0 bg-gradient-to-b from-gray-950 via-emerald-950/30 to-gray-950"></div>
		<div
			class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-600/8 rounded-full blur-[120px]"
		></div>
	</div>

	<!-- Sticky header -->
	<div
		class="sticky top-0 z-50 w-full rounded-b-xl border-b border-emerald-500/20 bg-gray-900/80 backdrop-blur-sm shadow-lg shadow-emerald-900/10"
	>
		<div class="flex items-center justify-between px-6 py-4">
			<!-- Breadcrumbs -->
			<ol class="flex items-center gap-3 xl:w-1/3 md:w-3/4 w-full min-w-0">
				<li>
					<a
						class="text-sm text-gray-400 transition-colors hover:text-emerald-300 hover:underline"
						href="/leagues"
					>
						Leagues
					</a>
				</li>
				<li class="text-gray-600" aria-hidden="true">&rsaquo;</li>
				{#if breadcrumbs.length > 3}
					<li class="max-w-[200px] min-w-0">
						<a
							class="block transition-colors hover:underline"
							href="/leagues/{data.selectedLeague.id}"
						>
							<p
								class="truncate font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-emerald-400 hover:from-emerald-100 hover:to-emerald-300"
							>
								{data.selectedLeague.name}
							</p>
						</a>
					</li>
				{:else}
					<li class="max-w-[200px] min-w-0">
						<p
							class="truncate font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-emerald-400"
						>
							{data.selectedLeague.name}
						</p>
					</li>
				{/if}

				{#if $page.url.pathname.includes('/seasons')}
					<li class="text-gray-600" aria-hidden="true">&rsaquo;</li>
					{#if breadcrumbs.length === 4}
						<li class="text-sm text-emerald-300/80">Seasons</li>
					{:else if breadcrumbs.length === 5}
						<li>
							<a
								class="text-sm text-gray-400 transition-colors hover:text-emerald-300 hover:underline"
								href={`/leagues/${data.selectedLeague.id}/seasons`}
							>
								Seasons
							</a>
						</li>
					{/if}
				{/if}
			</ol>

			<!-- League meta info -->
			<div class="hidden items-center gap-6 lg:flex">
				<div
					class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs"
				>
					<span class="text-gray-400">Commissioner</span>
					<span class="font-semibold text-emerald-300"
						>{data.selectedLeague.creator.username}</span
					>
				</div>
				<div
					class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs"
				>
					<span class="text-gray-400">Created</span>
					<span class="font-semibold text-emerald-300"
						>{dayjs(data.selectedLeague.createdDate).format('MM/DD/YYYY')}</span
					>
				</div>
				<div
					class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs"
				>
					<span class="text-gray-400">Members</span>
					<span class="font-semibold text-emerald-300"
						>{data.selectedLeague.members.length}</span
					>
				</div>
			</div>
		</div>
	</div>

	<!-- Child content -->
	<div class="relative z-10 pt-6">
		{@render children?.()}
	</div>
</main>
