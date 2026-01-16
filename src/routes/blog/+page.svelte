<script lang="ts">
	import { formatDate } from '$lib/utils';
	import * as config from '$lib/config';

	let { data } = $props();
</script>

<svelte:head>
	<title>{config.title}</title>
</svelte:head>

<!-- Posts -->
<section class="p-8 w-full">
	<div class="grid grid-cols-1 gap-y-4 w-1/2 mx-auto">
		<h1 class="h1 text-primary-500 text-center">Turbodota Blog</h1>
		{#each data.posts as post}
			<div class="card w-full p-4">
				<a href={`/blog/${post.slug}`} class="h3 text-secondary-500">{post.title}</a>
                <p class="italic text-tertiary-400">{post.description}</p>
				<p class="date">{formatDate(post.date)}</p>
				
			</div>
		{/each}
	</div>
</section>
