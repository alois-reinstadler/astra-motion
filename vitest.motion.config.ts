import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import base from './vite.config.js';

const engines = ['chromium', 'firefox', 'webkit'] as const;
export default defineConfig({
	...base,
	optimizeDeps: { include: ['bits-ui'] },
	test: {
		expect: { requireAssertions: true },
		fileParallelism: false,
		include: ['src/lib/motion-lab/**/*.svelte.spec.ts'],
		exclude: ['src/lib/motion-lab/performance.svelte.spec.ts'],
		browser: {
			enabled: true,
			provider: playwright(),
			instances: engines
				.filter((browser) => !process.env.MOTION_BROWSER || process.env.MOTION_BROWSER === browser)
				.map((browser) => ({ browser, headless: true }))
		}
	}
});
