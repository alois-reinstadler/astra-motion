import { expect } from '@playwright/test';
/** Shared installed-archive regression; no source aliases or internal APIs. */
export async function verifyRC(page) {
	await verifyPopContainingBlock(page);
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

async function verifyPopContainingBlock(page) {
	await page.locator('.pop-shell').scrollIntoViewIfNeeded();
	const result = await page.evaluate(async () => {
		const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
		await frame();
		await frame();
		const shell = document.querySelector('.pop-shell');
		const child = shell.querySelector('.outgoing');
		const before = child.getBoundingClientRect();
		const origin = { x: before.x + scrollX, y: before.y + scrollY };
		const parent = child.offsetParent;
		const styles = document.querySelectorAll('style').length;
		shell.querySelector('button').click();
		const start = performance.now();
		let error = 0,
			samples = 0,
			late = 0,
			changedParent = false;
		while (performance.now() - start < 340) {
			await frame();
			const box = child.getBoundingClientRect();
			error = Math.max(
				error,
				// Page-bottom collapse can clamp scrolling; compare document coordinates.
				Math.abs(box.x + scrollX - origin.x),
				Math.abs(box.y + scrollY - origin.y),
				Math.abs(box.width - before.width)
			);
			changedParent ||= child.offsetParent !== parent;
			samples++;
			if (performance.now() - start > 230) late++;
		}
		return { error, samples, late, changedParent, styles };
	});
	expect(result.error).toBeLessThan(2);
	expect(result.samples).toBeGreaterThan(5);
	expect(result.late).toBeGreaterThan(2);
	expect(result.changedParent).toBe(true);
	await expect(page.locator('.pop-shell .outgoing')).toHaveCount(0);
	await expect(page.locator('[data-astra-presence-pop]')).toHaveCount(0);
	expect(await page.locator('style').count()).toBe(result.styles);
}
