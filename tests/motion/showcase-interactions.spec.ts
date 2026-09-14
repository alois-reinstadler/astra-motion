import { expect, test, type Page } from '@playwright/test';

const pageErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
	const errors: string[] = [];
	pageErrors.set(page, errors);
	page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(({ page }) => {
	expect(pageErrors.get(page)).toEqual([]);
});

test('photographs exit and enter in the requested direction, including rapid reversal', async ({
	page
}) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/showcase');
	await page.locator('[data-contact-open="namib"]').click();
	const frame = page.locator('.photo-replace');
	const x = () => frame.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m41);
	const next = page.getByRole('button', { name: 'Next photograph' });
	await next.click();
	await expect.poll(x).toBeLessThan(-1);
	await expect(page.locator('.detail-copy h3')).toHaveText('The edge of stillness');
	await expect.poll(x).toBeGreaterThan(1);
	await expect.poll(x).toBeCloseTo(0, 1);
	await page.getByRole('button', { name: 'Previous photograph' }).click();
	await expect.poll(x).toBeGreaterThan(1);
	await expect(page.locator('.detail-copy h3')).toHaveText('A quiet immensity');
	await expect.poll(x).toBeLessThan(-1);
	await page.evaluate(() => {
		const next = document.querySelector<HTMLButtonElement>('[aria-label="Next photograph"]')!;
		const previous = document.querySelector<HTMLButtonElement>(
			'[aria-label="Previous photograph"]'
		)!;
		next.click();
		next.click();
		previous.click();
	});
	await expect(page.locator('.detail-copy h3')).toHaveText('The edge of stillness');
	await expect(frame).toHaveCSS('opacity', '1');
	await expect.poll(x).toBeCloseTo(0, 1);
	await page.locator('[data-contact-close]').click();
	await expect(page.locator('[data-contact-open="namib"]')).toBeFocused();
});

test('edition and arrow stay within the paper through interrupted layout changes', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/showcase#editing-desk');
	const desk = page.getByTestId('editing-desk');
	await expect(desk.getByRole('button', { name: 'Cover', exact: true })).toBeEnabled();
	const overflow = await desk.evaluate(async (scene) => {
		let worst = 0;
		for (let frame = 0; frame < 100; frame++) {
			if (frame % 17 === 0) {
				const tabs = scene.querySelectorAll<HTMLButtonElement>('.canvas-tabs button');
				tabs[tabs[0].getAttribute('aria-pressed') === 'true' ? 1 : 0].click();
			}
			if (frame % 29 === 0) scene.querySelector<HTMLButtonElement>('.desk-toolbar button')!.click();
			await new Promise(requestAnimationFrame);
			const card = scene.querySelector('[data-testid="desk-canvas"]')!.getBoundingClientRect();
			for (const node of scene.querySelectorAll(
				'[data-testid="desk-edition"], [data-testid="desk-arrow"]'
			)) {
				const box = node.getBoundingClientRect();
				worst = Math.max(
					worst,
					box.right - card.right,
					card.left - box.left,
					box.bottom - card.bottom,
					card.top - box.top
				);
			}
		}
		return worst;
	});
	expect(overflow).toBeLessThan(1);
});

test('queue grips drag rows and preserve keyboard reordering', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 1000 });
	await page.goto('/showcase');
	const list = page.getByTestId('queue-list');
	await list.evaluate((node) =>
		window.scrollBy({ top: node.getBoundingClientRect().top - 150, behavior: 'instant' })
	);
	const handle = page.getByRole('button', { name: 'Drag A quiet immensity to reorder' });
	const row = page.locator('[data-queue-item="namib"]');
	await expect(row).toHaveCSS('opacity', '1');
	await handle.hover();
	const rowBox = await row.boundingBox();
	const start = await handle.boundingBox();
	const target = await page.locator('[data-queue-item="caicos"]').boundingBox();
	if (!start || !target || !rowBox) throw new Error('Queue is not visible');
	await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
	await page.mouse.down();
	const pauseY = start.y + start.height / 2 + 170;
	const grabOffset = start.y + start.height / 2 - (rowBox.y + rowBox.height / 2);
	await page.mouse.move(start.x + start.width / 2, pauseY, { steps: 16 });
	await expect(row).toHaveCSS('order', '1');
	// Crossing a sibling must keep the card under the pointer even before it moves again.
	await expect
		.poll(() =>
			row.evaluate((node, desiredCenter) => {
				const box = node.getBoundingClientRect();
				return Math.abs(box.top + box.height / 2 - desiredCenter);
			}, pauseY - grabOffset)
		)
		.toBeLessThan(2);
	await page.mouse.move(start.x + start.width / 2, target.y + target.height / 2 + grabOffset + 15, {
		steps: 35
	});
	await page.mouse.up();
	await expect(list.locator('[data-queue-item]').last()).toHaveAttribute(
		'data-queue-item',
		'namib'
	);
	await expect
		.poll(() =>
			page
				.locator('[data-queue-item="namib"]')
				.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m42)
		)
		.toBeCloseTo(0, 1);
	await expect(handle).toBeFocused();
	await page.keyboard.press('ArrowUp');
	await expect(list.locator('[data-queue-item]').nth(1)).toHaveAttribute(
		'data-queue-item',
		'namib'
	);
	await expect(handle).toBeFocused();
	const original = await list
		.locator('[data-queue-item]')
		.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-queue-item')));
	const grip = await handle.boundingBox();
	const first = await list.locator('[data-queue-item]').first().boundingBox();
	if (!grip || !first) throw new Error('Queue is not visible');
	await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
	await page.mouse.down();
	await page.mouse.move(grip.x + grip.width / 2, first.y + 10, { steps: 20 });
	await page.keyboard.press('Escape');
	await page.mouse.up();
	await expect
		.poll(() =>
			list
				.locator('[data-queue-item]')
				.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-queue-item')))
		)
		.toEqual(original);
	await expect(page.locator('.queue-item.dragging')).toHaveCount(0);
});

test('story replaces its photograph and staggered words, then settles a live policy change', async ({
	page
}) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/showcase#story');
	await page.getByTestId('story-next').click();
	await expect(page.getByTestId('story-title')).toHaveAttribute(
		'aria-label',
		'Where the water holds its breath.'
	);
	await expect(page.getByTestId('story-image')).toHaveAttribute('src', '/showcase/urmia.jpg');
	const words = page.locator('.story-word');
	await expect
		.poll(() =>
			words.evaluateAll((nodes) => nodes.map((node) => Number(getComputedStyle(node).opacity)))
		)
		.not.toEqual([1, 1, 1, 1, 1, 1]);
	await expect(words.last()).toHaveCSS('opacity', '1');
	await page.getByTestId('story-previous').click();
	await page.getByTestId('showcase-reduced').evaluate((node) => (node as HTMLInputElement).click());
	await expect(page.getByTestId('story-title')).toHaveAttribute(
		'aria-label',
		'A slower kind of looking.'
	);
	await expect(page.locator('.cover-photograph')).toHaveCSS('opacity', '1');
	await expect(words.last()).toHaveCSS('opacity', '1');
	await page.getByTestId('story-previous').click();
	await expect(page.getByTestId('story-title')).toHaveAttribute(
		'aria-label',
		'Every river finds a way.'
	);
	await expect(page.getByTestId('story-image')).toHaveAttribute('src', '/showcase/lena.jpg');
	await expect(page.getByTestId('story-previous')).toBeFocused();
});

test('touch drag commits visual order on release on a narrow screen', async ({
	page,
	browserName
}) => {
	test.skip(browserName !== 'chromium', 'Uses Chromium touch input emulation.');
	await page.setViewportSize({ width: 390, height: 844 });
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/showcase');
	const list = page.getByTestId('queue-list');
	await list.evaluate((node) =>
		window.scrollBy({ top: node.getBoundingClientRect().top - 130, behavior: 'instant' })
	);
	const grip = await page.locator('[data-queue-item="namib"] [data-queue-drag]').boundingBox();
	const destination = await page.locator('[data-queue-item="caicos"]').boundingBox();
	const rowBox = await page.locator('[data-queue-item="namib"]').boundingBox();
	if (!grip || !destination || !rowBox) throw new Error('Queue is not visible');
	const client = await page.context().newCDPSession(page);
	await client.send('Emulation.setTouchEmulationEnabled', { enabled: true });
	const x = grip.x + grip.width / 2;
	const y = grip.y + grip.height / 2;
	const grabOffset = y - (rowBox.y + rowBox.height / 2);
	await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
	for (let step = 1; step <= 25; step++) {
		await client.send('Input.dispatchTouchEvent', {
			type: 'touchMove',
			touchPoints: [
				{ x, y: y + ((destination.y + destination.height / 2 + grabOffset + 15 - y) * step) / 25 }
			]
		});
		await page.evaluate(() => new Promise(requestAnimationFrame));
	}
	await expect(page.locator('[data-queue-item="namib"]')).toHaveCSS('order', '2');
	await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
	await expect(list.locator('[data-queue-item]').last()).toHaveAttribute(
		'data-queue-item',
		'namib'
	);
	await expect(page.locator('.queue-item.dragging')).toHaveCount(0);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	await client.detach();
});
