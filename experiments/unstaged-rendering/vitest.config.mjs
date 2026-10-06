import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
const records = [];
const provenance = JSON.parse(
	readFileSync('experiments/unstaged-rendering/.generated/provenance.json', 'utf8')
);
export default defineConfig({
	cacheDir: './.svelte-kit/vite-unstaged-probes',

	resolve: { dedupe: ['svelte', 'motion-dom', 'motion-utils'] },
	optimizeDeps: {
		noDiscovery: true,
		include: ['motion-utils'],
		exclude: ['svelte', 'svelte/internal/client']
	},
	test: {
		include: ['experiments/unstaged-rendering/*.spec.js'],
		fileParallelism: false,
		browser: {
			commands: {
				recordResult(_context, row) {
					records.push(row);
					writeFileSync(
						process.env.PROBE_RESULTS ?? 'experiments/unstaged-rendering/results.json',
						JSON.stringify({ status: 'running', provenance, records }, null, 2) + '\n'
					);
				}
			},
			enabled: true,
			provider: playwright({
				launchOptions: {
					executablePath: process.env.BROWSER_EXECUTABLE_PATH ?? '/usr/bin/google-chrome',
					args: ['--no-sandbox']
				}
			}),
			instances: [{ browser: 'chromium', headless: true }]
		}
	}
});
