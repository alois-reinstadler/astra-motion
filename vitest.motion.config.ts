import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import base from './vite.config.js';

const engines = ['chromium', 'firefox', 'webkit'] as const;
const selected = process.env.MOTION_BROWSER;
if (selected && !engines.some((engine) => engine === selected)) {
	throw new Error(`MOTION_BROWSER must be one of: ${engines.join(', ')}`);
}
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
			screenshotDirectory: `test-results/components/${selected ?? 'matrix'}`,
			provider: playwright(),
			instances: engines
				.filter((browser) => !selected || selected === browser)
				.map((browser) => ({ browser, headless: true }))
		}
	}
});
