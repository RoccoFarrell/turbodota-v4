<script lang="ts">
	import { formatDate } from '$lib/utils';

	let { data } = $props();

	const otherPosts = $derived(
		(data.posts ?? []).filter((p: Post) => p.slug !== data.meta?.slug).slice(0, 4)
	);
</script>

<!-- SEO -->
<svelte:head>
	<title>{data.meta.title}</title>
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.meta.title} />
</svelte:head>

<div class="w-full">
	<div class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
		<!-- Back navigation -->
		<nav class="mb-8">
			<a
				href="/blog"
				class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors group"
			>
				<span class="transition-transform group-hover:-translate-x-0.5">&larr;</span>
				All Posts
			</a>
		</nav>

		<article>
			<!-- Article header -->
			<header class="mb-10 space-y-5">
				<!-- Categories + Date row -->
				<div class="flex items-center gap-3 flex-wrap">
					{#each data.meta.categories as category}
						<span class="text-[11px] px-2 py-0.5 rounded-md bg-red-500/8 border border-red-500/15 text-red-400/80 font-semibold tracking-wider uppercase">
							{category}
						</span>
					{/each}
					<span class="text-gray-600 text-sm">&middot;</span>
					<time class="text-sm text-gray-500">{formatDate(data.meta.date)}</time>
				</div>

				<!-- Title -->
				<h1 class="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-gray-100 to-gray-300 leading-[1.15]">
					{data.meta.title}
				</h1>

				<!-- Description -->
				<p class="text-lg text-gray-400 leading-relaxed">
					{data.meta.description}
				</p>

				<!-- Divider -->
				<div class="h-px bg-gradient-to-r from-red-500/20 via-red-500/10 to-transparent"></div>
			</header>

			<!-- Post content -->
			<div class="blog-prose mb-16">
				<data.content />
			</div>
		</article>

		<!-- More posts section -->
		{#if otherPosts.length > 0}
			<footer class="border-t border-gray-800/60 pt-10 pb-8 space-y-5">
				<h2 class="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">
					More from the blog
				</h2>
				<div class="grid gap-3">
					{#each otherPosts as post}
						<a
							href={`/blog/${post.slug}`}
							class="group flex items-center gap-4 rounded-lg border border-gray-800/40 bg-gray-900/30 hover:bg-gray-900/60 hover:border-gray-700/50 p-4 transition-all duration-200"
						>
							<div class="flex-1 min-w-0">
								<h3 class="text-sm font-bold text-gray-300 group-hover:text-red-200 transition-colors truncate">
									{post.title}
								</h3>
								<p class="text-xs text-gray-600 mt-0.5">{formatDate(post.date)}</p>
							</div>
							<span class="text-gray-700 group-hover:text-gray-500 transition-colors shrink-0">&rarr;</span>
						</a>
					{/each}
				</div>
			</footer>
		{/if}
	</div>
</div>
