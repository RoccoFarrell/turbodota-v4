import { defineConfig } from 'vitest/config';
import path from 'path'
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./vitest-setup.ts'],
		// Test database setup for card battler tests
		testTimeout: 10000, // 10 seconds for database operations
		hookTimeout: 30000, // 30 seconds for setup/teardown
		// Coverage configuration
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'src/**/*.test.ts',
				'src/**/*.spec.ts',
				'**/*.d.ts',
				'**/mocks/**',
				'**/fixtures/**'
			]
		}
	},
  resolve: {
    alias: {
      '@lib': path.resolve(__dirname, './src/lib')
    }
  }
});
