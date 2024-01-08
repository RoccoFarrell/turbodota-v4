<script lang="ts">
	import { formatDate } from '$lib/utils';

	export let data;
</script>

<!-- SEO -->
<svelte:head>
	<title>{data.meta.title}</title>
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.meta.title} />
</svelte:head>

<article class="p-8">
	<div class="container flex flex-col space-y-8">
		<!-- Title -->
		<hgroup>
			<h1 class="h1 font-bold">{data.meta.title}</h1>
            <h4 class="h4 text-amber-500 text-center">{data.meta.description}</h4>
			
		</hgroup>

		<div class="flex justify-between items-center">
            
			<!-- Tags -->
			<div class="tags">
				{#each data.meta.categories as category}
					<span class="chip rounded-xl p-2 m-1 variant-filled-secondary">&num;{category}</span>
				{/each}
			</div>
            <p class="text-tertiary-500 italic">Published on {formatDate(data.meta.date)}</p>
		</div>

        <div class="w-full border-b border-dashed border-primary-500"></div>
		<!-- Post -->
		<div class="prose dark:prose-invert">
			<svelte:component this={data.content} />
		</div>
	</div>
</article>
