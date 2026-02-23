<script lang="ts">
	import { formatDate } from '$lib/utils';
	import * as config from '$lib/config';

	let { data } = $props();

	const featuredPost = $derived(data.posts[0]);
	const remainingPosts = $derived(data.posts.slice(1));
</script>

<svelte:head>
	<title>Blog | {config.title}</title>
</svelte:head>

<div class="w-full">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
		<!-- Header -->
		<header class="text-center space-y-4">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/8 border border-red-500/15 text-red-400/80 text-[11px] font-semibold tracking-[0.2em] uppercase">
				No Salt Studios
			</div>
			<h1 class="text-5xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-gray-100 via-gray-200 to-red-300/60">
				Turbodota Blog
			</h1>
			<p class="text-gray-500 text-sm max-w-sm mx-auto">
				Patch notes, features, and dispatches from the front lines.
			</p>
		</header>

		{#if featuredPost}
			<!-- Featured post hero card -->
			<a
				href={`/blog/${featuredPost.slug}`}
				class="group block rounded-2xl border border-red-500/15 bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-red-950/20 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-red-500/30 hover:shadow-[0_0_40px_rgba(220,38,38,0.06)]"
			>
				<div class="p-8 sm:p-10 space-y-4">
					<div class="flex items-center gap-3 flex-wrap">
						<span class="px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-semibold tracking-wider uppercase">
							Latest
						</span>
						<span class="text-gray-600 text-sm">{formatDate(featuredPost.date)}</span>
					</div>
					<h2 class="text-2xl sm:text-3xl font-black text-gray-100 group-hover:text-red-200 transition-colors leading-tight">
						{featuredPost.title}
					</h2>
					<p class="text-gray-400 text-base leading-relaxed max-w-2xl">
						{featuredPost.description}
					</p>
					<div class="flex items-center gap-2 text-sm text-red-400/70 group-hover:text-red-400 transition-colors font-medium pt-2">
						Read post
						<span class="transition-transform group-hover:translate-x-1">&rarr;</span>
					</div>
				</div>
			</a>
		{/if}

		<!-- Post grid -->
		{#if remainingPosts.length > 0}
			<div class="space-y-3">
				<h2 class="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] pl-1">
					Previous Posts
				</h2>
				<div class="grid gap-3">
					{#each remainingPosts as post, i}
						<a
							href={`/blog/${post.slug}`}
							class="group flex items-start gap-5 rounded-xl border border-gray-800/60 bg-gray-900/40 hover:bg-gray-900/70 hover:border-gray-700/60 backdrop-blur-sm p-5 transition-all duration-200"
							style="animation: fadeSlideIn 0.4s ease-out {60 * i}ms both"
						>
							<!-- Date column -->
							<div class="hidden sm:flex flex-col items-center shrink-0 w-14 pt-0.5">
								<span class="text-2xl font-black text-gray-600 leading-none">
									{new Date(formatDate(post.date)).getDate?.() || post.date.split('-')[2]?.replace(/^0/, '') || ''}
								</span>
								<span class="text-[10px] text-gray-700 uppercase tracking-wider font-semibold">
									{new Date(post.date.replaceAll('-', '/')).toLocaleDateString('en', { month: 'short', year: '2-digit' })}
								</span>
							</div>

							<!-- Accent line -->
							<div class="hidden sm:block w-px self-stretch bg-gradient-to-b from-red-500/30 via-red-500/10 to-transparent shrink-0"></div>

							<!-- Content -->
							<div class="flex-1 min-w-0 space-y-1.5">
								<h3 class="text-base font-bold text-gray-200 group-hover:text-red-200 transition-colors leading-snug">
									{post.title}
								</h3>
								<p class="text-sm text-gray-500 leading-relaxed line-clamp-2">
									{post.description}
								</p>
								<div class="flex items-center gap-2 pt-1">
									{#each post.categories?.slice(0, 3) ?? [] as category}
										<span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700/50">
											{category}
										</span>
									{/each}
									<span class="sm:hidden text-xs text-gray-600">{formatDate(post.date)}</span>
								</div>
							</div>

							<!-- Arrow -->
							<div class="text-gray-700 group-hover:text-gray-500 transition-colors shrink-0 self-center">
								<span class="transition-transform group-hover:translate-x-0.5 inline-block">&rarr;</span>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Footer -->
		<footer class="text-center pt-4 pb-8">
			<div class="w-16 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mx-auto mb-4"></div>
			<p class="text-xs text-gray-700">No Salt Studios</p>
		</footer>
	</div>
</div>

<style>
	@keyframes fadeSlideIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
