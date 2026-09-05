import { expect, test } from '@playwright/test';

test('hydrates declared-parent initial=false keyframes without replay through an intervening binding', async ({
	browser,
	page,
	baseURL
}) => {
	const server = await browser.newContext({ javaScriptEnabled: false, baseURL });
	const unhydrated = await server.newPage();
	await unhydrated.goto('/motion-lab/inheritance');
	await expect(unhydrated.locator('[data-lexical="leaf"]')).toHaveCSS(
		'transform',
		'matrix(1, 0, 0, 1, 80, 0)'
	);
	await server.close();
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (message) => {
		if (/hydration/i.test(message.text())) errors.push(message.text());
	});
	await page.addInitScript(() => {
		const samples: number[] = [];
		Object.assign(window, { lexicalSamples: samples });
		const read = () => {
			const node = document.querySelector('[data-lexical="leaf"]');
			if (node) samples.push(new DOMMatrix(getComputedStyle(node).transform).e);
			if (samples.length < 40) requestAnimationFrame(read);
		};
		requestAnimationFrame(read);
	});
	await page.goto('/motion-lab/inheritance');
	const samples = () =>
		page.evaluate(() => (window as Window & { lexicalSamples?: number[] }).lexicalSamples ?? []);
	await expect.poll(async () => (await samples()).length).toBe(40);
	expect(await samples()).toEqual(Array(40).fill(80));
	await page.locator('[data-lexical="middle-toggle"]').click();
	await expect(page.locator('[data-lexical="leaf"]')).toHaveCSS(
		'transform',
		'matrix(1, 0, 0, 1, 80, 0)'
	);
	await page.locator('[data-lexical="outer-toggle"]').click();
	await expect(page.locator('[data-lexical="leaf"]')).toHaveCSS(
		'transform',
		'matrix(1, 0, 0, 1, 120, 0)'
	);
	expect(errors).toEqual([]);
});
