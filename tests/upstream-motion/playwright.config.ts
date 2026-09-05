import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: '.',
	testMatch: 'upstream.spec.ts',
	workers: 1,
	use: { baseURL: 'http://127.0.0.1:5194', trace: 'retain-on-failure' },
	webServer: {
		command: 'pnpm exec vite --config vite.config.ts',
		url: 'http://127.0.0.1:5194',
		reuseExistingServer: false
	},
	projects: ['chromium', 'firefox', 'webkit'].map((browserName) => ({
		name: browserName,
		use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' }
	}))
});
