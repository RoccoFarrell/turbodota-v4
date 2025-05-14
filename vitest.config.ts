import { defineConfig } from 'vitest/config';
import path from 'path'
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		globals: true,
		environment: 'jsdom'
	},
  resolve: {
    alias: {
      '@lib': path.resolve(__dirname, './src/lib'),
      '$lib': path.resolve(__dirname, './src/lib')
    }
  }
});
