// purgeCss plugin removed - required before Tailwind v4 migration
// import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit()
		// purgeCss plugin removed - required before Tailwind v4 migration
		// Note: safelist pattern [/.*d2mh.*/] will need to be handled in Tailwind v4
		// purgeCss({
		// 	safelist: {
		// 		greedy: [/.*d2mh.*/]
		// 	}
		// })
	]
});
