import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import base from '../vite.config.js';

export default defineConfig({
	...base,
	test: {
		expect: { requireAssertions: true },
		fileParallelism: false,
		include: [
			process.env.MOTION_PROFILE_TRACE
				? 'scripts/trace-layout.spec.ts'
				: 'scripts/profile-layout.spec.ts'
		],
		browser: {
			enabled: true,
			provider: playwright(),
			viewport: { width: 1280, height: 720 },
			instances: [{ browser: 'chromium', headless: true }]
		}
	}
});
