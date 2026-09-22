import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.MOTION_LAB_URL;
if (!baseURL) {
	throw new Error(
		'Set MOTION_LAB_URL to your running preview URL before running E2E tests. This config does not start a server.'
	);
}
const parsed = new URL(baseURL);
if (!['http:', 'https:'].includes(parsed.protocol)) {
	throw new Error('MOTION_LAB_URL must be an HTTP or HTTPS preview URL.');
}

/** Uses an existing server; never starts a dev server, build or preview. */
export default defineConfig({
	testDir: './tests/motion',
	forbidOnly: Boolean(process.env.CI),
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL,
		trace: 'retain-on-failure'
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } }
	]
});
