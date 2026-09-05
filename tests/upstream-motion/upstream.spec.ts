import { expect, test } from '@playwright/test';
import type {} from './repros.js';

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.waitForFunction(() => !!window.upstream);
});

// These characterize the pinned upstream defects. A changed result is a signal to
// reassess/remove the shim, not an instruction to preserve an upstream bug forever.
test('Motion 13.2 finished cancellation still writes the old endpoint', async ({
	page
}, testInfo) => {
	const result = await page.evaluate(() => window.upstream.nativeFinishCancel());
	await testInfo.attach('upstream-result', {
		body: JSON.stringify(result, null, 2),
		contentType: 'application/json'
	});
	expect(result).toEqual({ desired: 0.75, actual: 0.25, remainingAnimations: 0 });
});

test('the public pending animation getter flushes unrelated measurements', async ({
	page
}, testInfo) => {
	const result = await page.evaluate(() => window.upstream.pendingGetterMeasurements());
	await testInfo.attach('upstream-result', {
		body: JSON.stringify(result, null, 2),
		contentType: 'application/json'
	});
	expect(result).toEqual({ beforeGetter: 0, afterGetter: 2 });
});

test('timeline scroll cleanup retains listeners while the information callback releases them', async ({
	page
}, testInfo) => {
	const result = await page.evaluate(() => window.upstream.scrollCleanupComparison());
	await testInfo.attach('upstream-result', {
		body: JSON.stringify(result, null, 2),
		contentType: 'application/json'
	});
	expect(result.timelinePlayback.remainingScrollListeners).toBe(3);
	expect(result.informationCallback.remainingScrollListeners).toBe(0);
});

test('the adapter-required engine shapes and private shim handles still exist', async ({
	page
}, testInfo) => {
	const result = await page.evaluate(async () => {
		const path = '/contracts.ts';
		const contract = (await import(/* @vite-ignore */ path)) as typeof import('./contracts.js');
		return contract.inspectContracts();
	});
	await testInfo.attach('engine-contracts', {
		body: JSON.stringify(result, null, 2),
		contentType: 'application/json'
	});
	expect(result.errors).toEqual([]);
	expect(result.projectionStack).toBe(true);
	const scripts = await page.evaluate(() =>
		performance.getEntriesByType('resource').map((entry) => entry.name)
	);
	expect(scripts.some((url) => /\/src\/lib\/|svelte|react(?:_dom)?\./.test(url))).toBe(false);
});
