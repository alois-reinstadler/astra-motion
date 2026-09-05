import { defineConfig, devices } from '@playwright/test';

/** Uses an existing dev server; never starts a dev server, build or preview. */
export default defineConfig({
	testDir: './tests/motion',
	use: {
		baseURL: process.env.MOTION_LAB_URL ?? 'http://localhost:5173',
		trace: 'retain-on-failure'
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } }
	]
});
