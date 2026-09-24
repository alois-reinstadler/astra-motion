import { defineConfig } from '@playwright/test';

const externalURL = process.env.UPSTREAM_MOTION_URL;

export default defineConfig({
	testDir: '.',
	testMatch: 'upstream.spec.ts',
	workers: 1,
	use: { baseURL: externalURL ?? 'http://127.0.0.1:5194', trace: 'retain-on-failure' },
	webServer: externalURL
		? undefined
		: {
				command: 'pnpm exec vite --config vite.config.ts',
				url: 'http://127.0.0.1:5194',
				reuseExistingServer: false
			},
	projects: ['chromium', 'firefox', 'webkit'].map((browserName) => ({
		name: browserName,
		use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' }
	}))
});
