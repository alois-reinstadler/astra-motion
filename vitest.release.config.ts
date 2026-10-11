import { defineConfig } from 'vitest/config';
import motion from './vitest.motion.config.js';

// Release qualification includes every source browser test, including the
// informational benchmark. Keep its measurements outside historical research.
export default defineConfig({
	...motion,
	define: {
		'import.meta.env.VITE_PERFORMANCE_OUTPUT_DIR': JSON.stringify(
			'artifacts/releases/final-main/performance'
		)
	},
	test: {
		...motion.test,
		include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
		exclude: []
	}
});
