<script lang="ts">
	import { formatDate } from '$lib/utils';

	let { data } = $props();
</script>

<!-- SEO -->
<svelte:head>
	<title>{data.meta.title}</title>
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.meta.title} />
</svelte:head>

<div class="w-full flex justify-center">
	{#if data.posts}
		<div class="w-64 xl:h-full fixed max-lg:bottom-0 lg:left-64 max-lg:hidden">
			<div class="h-full border-r border-dashed border-orange-500/30 flex flex-col items-center p-2 space-y-2">
				<h4 class="h4 text-amber-500">Blog Posts</h4>
				{#each data.posts as post}
					<div class="card p-4">
						<a href={`/blog/${post.slug}`} class="h5 text-secondary-500">{post.title}</a>
						<p class="italic text-tertiary-400 text-xs">{post.description}</p>
						<p class="date text-xs">{formatDate(post.date)}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}
	<article class="p-8 lg:min-w-[50%] lg:ml-64">
		<div class="container flex flex-col">
			<!-- Title -->
			<hgroup class="mb-8">
				<h1 class="h1 font-bold text-center">{data.meta.title}</h1>
				<h4 class="h4 text-amber-500 text-center">{data.meta.description}</h4>
			</hgroup>

			<div class="flex justify-between items-center my-4">
				<!-- Tags -->
				<div class="tags">
					{#each data.meta.categories as category}
						<span class="chip rounded-xl p-2 m-1 variant-filled-secondary">&num;{category}</span>
					{/each}
				</div>
				<p class="text-tertiary-500 italic">Published on {formatDate(data.meta.date)}</p>
			</div>

			<div class="w-full border-b border-dashed border-primary-500 my-4"></div>
			<!-- Post -->
			<div class="prose dark:prose-invert mb-20">
				<data.content />
			</div>
		</div>
	</article>
</div>
