import { expect } from '@playwright/test';
/** Shared installed-archive regression; no source aliases or internal APIs. */
export async function verifyRC(page) {
	const x = () =>
		page
			.locator('[data-rc-native]')
			.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m41);
	await expect.poll(x).toBe(20);
	await page.getByRole('button', { name: 'RC update', exact: true }).click();
	await expect.poll(x).toBe(80);
	await expect(page.locator('[data-rc-native]')).toHaveCSS('will-change', 'transform');
	await expect(page.locator('[data-rc-follow]')).toHaveText('80');
	await expect(page.locator('[data-rc-item]')).toHaveText('Beta');
	await page.getByRole('button', { name: 'RC stop', exact: true }).click();
	await expect(page.locator('[data-rc-settled]')).toHaveText('stopped');
	const first = page.locator('[data-rc-reorder="1"]');
	await first.scrollIntoViewIfNeeded();
	const box = await first.boundingBox();
	if (!box) throw new Error('Missing packed reorder item');
	await page.mouse.move(box.x + 40, box.y + 25);
	await page.mouse.down();
	try {
		await page.mouse.move(box.x + 40, box.y + 85, { steps: 12 });
		await expect(page.locator('[data-rc-order]')).toHaveText('2,1');
	} finally {
		await page.mouse.up();
	}
	const supported = await page.evaluate(() => typeof document.startViewTransition === 'function');
	await page.getByRole('button', { name: 'RC view', exact: true }).click();
	await expect(page.locator('[data-rc-view]')).toHaveText('After');
	await expect(page.locator('[data-rc-view-outcome]')).toHaveText(
		supported ? 'finished' : 'unsupported'
	);
	if (!supported) {
		const native = await page.evaluate(() => {
			delete document.startViewTransition;
			return typeof document.startViewTransition === 'function';
		});
		try {
			if (native) {
				await page.getByRole('button', { name: 'RC view', exact: true }).click();
				await expect(page.locator('[data-rc-view-outcome]')).toHaveText('finished');
			}
		} finally {
			await page.evaluate(() =>
				Object.defineProperty(document, 'startViewTransition', {
					configurable: true,
					value: undefined
				})
			);
		}
	}
}
