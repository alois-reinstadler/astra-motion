import { expect, test } from '@playwright/test';
import type {} from './repros.js';

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.waitForFunction(() => !!window.upstream);
});

// These characterize the pinned engine, including upstream fixes. Changed results
// require reassessing the adapter shims rather than preserving old engine defects.
test('finished cancellation still writes the old endpoint', async ({ page }, testInfo) => {
	const result = await page.evaluate(() => window.upstream.nativeFinishCancel());
	await testInfo.attach('upstream-result', {
		body: JSON.stringify(result, null, 2),
		contentType: 'application/json'
	});
	expect(result).toEqual({ desired: 0.75, actual: 0.25, remainingAnimations: 0 });
});

test('a resolved animation getter leaves unrelated measurements pending', async ({
	page
}, testInfo) => {
	const result = await page.evaluate(() => window.upstream.pendingGetterMeasurements());
	await testInfo.attach('upstream-result', {
		body: JSON.stringify(result, null, 2),
		contentType: 'application/json'
	});
	expect(result.beforeGetter).toBe(0);
	expect(result.afterGetter).toBe(0);
	expect(result.afterFlush).toBeGreaterThan(0);
});

test('timeline and information scroll cleanup both release their listeners', async ({
	page
}, testInfo) => {
	const result = await page.evaluate(() => window.upstream.scrollCleanupComparison());
	await testInfo.attach('upstream-result', {
		body: JSON.stringify(result, null, 2),
		contentType: 'application/json'
	});
	expect(result.timelinePlayback.remainingScrollListeners).toBe(0);
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
