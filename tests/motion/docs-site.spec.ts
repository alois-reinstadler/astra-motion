import { expect, test } from '@playwright/test';

test('live docs examples keep their interactions, reset, and source on the page', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/docs/getting-started');
	const list = page.locator('[data-example="motion-component"]');
	await list.getByRole('button', { name: 'Complete: Collect a little inspiration' }).click();
	await expect(list.locator('li.task')).toHaveCount(2);
	await list.getByRole('button', { name: 'Start again' }).click();
	await expect(list.locator('li.task')).toHaveCount(3);
	const notification = page.locator('[data-example="state"]');
	await notification.getByRole('button', { name: 'Dismiss notification' }).click();
	await expect(notification.locator('.notification')).toHaveCount(0);
	await notification.getByRole('button', { name: 'Reset A little good news' }).click();
	await expect(notification.locator('.notification')).toHaveCount(1);
	await expect(notification.locator('.notification')).toHaveCSS('opacity', '1');
	await expect(page.locator('a[href*="motion-lab"]')).toHaveCount(0);
	expect(errors).toEqual([]);
});

test('layout, shared selection, gestures and stagger work inside their guides', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/docs/layout');
	const layout = page.locator('[data-example="layout"]');
	const before = await layout.locator('.record').evaluate((node) => node.clientHeight);
	await layout.getByRole('button', { name: 'Open player' }).click();
	await expect
		.poll(() => layout.locator('.record').evaluate((node) => node.clientHeight))
		.toBeGreaterThan(before);
	await page.goto('/docs/shared-layout');
	const shared = page.locator('[data-example="shared"]');
	await shared.getByRole('button', { name: 'Rest', exact: true }).click();
	await expect(shared.getByRole('heading', { name: 'Take the long way.' })).toBeVisible();
	await page.goto('/docs/state');
	const variants = page.locator('[data-example="inheritance"]');
	await variants.getByRole('button', { name: 'Hide menu', exact: false }).click();
	await expect(variants.locator('.item').last()).toHaveCSS('opacity', '0');
	await variants.getByRole('button', { name: 'Reveal menu', exact: false }).click();
	await expect(variants.locator('.item').last()).toHaveCSS('opacity', '1');
	const gestures = page.locator('[data-example="gestures"]');
	await gestures.getByRole('button', { name: 'Save to collection' }).click();
	await expect(gestures.getByRole('button', { name: 'Saved to collection' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await gestures.getByRole('slider').fill('120');
	await expect
		.poll(() =>
			gestures
				.locator('.handle')
				.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m41)
		)
		.toBeCloseTo(120, 0);
	expect(errors).toEqual([]);
});

test('scroll, visibility and timelines stay local and usable with reduced motion', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/docs/scroll');
	const scroll = page.locator('[data-example="scroll"]');
	await scroll.locator('.reader').evaluate((node) => {
		node.scrollTop = node.scrollHeight;
	});
	await expect(scroll.locator('progress')).toHaveAttribute('value', '1');
	const visibility = page.locator('[data-example="in-view"]');
	await expect(visibility.getByRole('status')).toHaveText('Out of view');
	await visibility.locator('.viewport').evaluate((node) => {
		node.scrollTop = node.scrollHeight;
	});
	await expect(visibility.getByRole('status')).toHaveText('In view');
	await expect(visibility.locator('.card')).toHaveCSS('opacity', '1');
	await visibility.locator('.viewport').evaluate((node) => {
		node.scrollTop = 0;
	});
	await expect(visibility.getByRole('status')).toHaveText('Out of view');
	await page.goto('/docs/timelines');
	const timeline = page.locator('[data-example="timeline"]');
	await timeline.getByRole('button', { name: 'Replay' }).click();
	await expect(timeline.locator('.disc')).toHaveCSS('opacity', '1');
	await expect(timeline.getByRole('button', { name: 'Play sequence' })).toBeVisible();
	expect(errors).toEqual([]);
});

test('documentation has connected navigation, topic filtering and complete copyable source', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: {
				writeText: async (text: string) => {
					document.documentElement.dataset.copiedSource = text;
				}
			}
		});
	});
	await page.goto('/docs/layout');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Automatic layout');
	const navigation = page.getByRole('navigation', { name: 'Documentation', exact: true });
	await expect(navigation.getByRole('link', { name: 'Automatic layout' })).toHaveAttribute(
		'aria-current',
		'page'
	);
	const example = page.locator('[data-example="layout"]');
	await example.locator('summary').click();
	const copy = example.getByRole('button', { name: 'Copy LayoutExample.svelte', exact: true });
	// Position the control before clicking: WebKit can continue native smooth scrolling
	// after Playwright's actionability check. Keep the actual pointer interaction.
	await copy.evaluate((node) => node.scrollIntoView({ behavior: 'instant', block: 'center' }));
	await copy.click();
	await expect(page.getByRole('status')).toHaveText('Copied to clipboard');
	expect(await page.locator('html').getAttribute('data-copied-source')).toContain(
		"from 'astra-motion'"
	);
	await page.getByRole('searchbox', { name: 'Find a guide' }).fill('scroll');
	await expect(navigation.getByRole('link', { name: 'Scroll-linked motion' })).toBeVisible();
	await expect(navigation.getByRole('link', { name: 'Introduction', exact: true })).toHaveCount(0);
	await navigation.getByRole('link', { name: 'Scroll-linked motion' }).click();
	await expect(page).toHaveURL(/\/docs\/scroll$/);
	await expect(page.getByRole('searchbox', { name: 'Find a guide' })).toHaveValue('');
	await page
		.getByRole('navigation', { name: 'Previous and next guide' })
		.getByRole('link', { name: 'Next' })
		.click();
	await expect(page).toHaveURL(/\/docs\/timelines$/);
	await page.goBack();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Scroll-linked motion');
	expect(errors).toEqual([]);
});

test('mobile documentation opens its contents and navigates without horizontal overflow', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/docs');
	const menu = page.locator('details.mobile-navigation');
	await expect(menu).not.toHaveAttribute('open');
	await menu.locator('summary').click();
	await expect(menu).toHaveAttribute('open');
	await page
		.getByRole('navigation', { name: 'Documentation', exact: true })
		.getByRole('link', { name: 'Presence & exits', exact: true })
		.click();
	await expect(page).toHaveURL(/\/docs\/presence$/);
	await expect(menu).not.toHaveAttribute('open');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Presence & exits');
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	await page.locator('[data-example="state"] summary').click();
	await expect(
		page.getByRole('region', { name: 'StateExample.svelte source' }).first()
	).toHaveAttribute('tabindex', '0');
});

test('documentation renders without JavaScript and missing guides return 404', async ({
	browser,
	baseURL,
	request
}) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	const page = await context.newPage();
	await page.goto('/docs/getting-started');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Getting started');
	for (const id of ['motion-component', 'first-component']) {
		await page.locator(`#${id} summary`).click();
		await expect(
			page.locator(`#${id}`).getByRole('region', { name: /Example.svelte source/ })
		).toContainText('initial:');
	}
	await expect(
		page
			.getByRole('navigation', { name: 'Previous and next guide' })
			.getByRole('link', { name: 'Next' })
	).toHaveAttribute('href', /docs\/state$/);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.locator('details.mobile-navigation summary').click();
	await expect(
		page
			.getByRole('navigation', { name: 'Documentation', exact: true })
			.getByRole('link', { name: 'Presence & exits', exact: true })
	).toBeVisible();
	await context.close();
	expect((await request.get('/docs/not-a-guide')).status()).toBe(404);
});

test('client navigation disposes demo exits instead of retaining previous guide sections', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/docs/shared-layout');
	await page.getByRole('button', { name: 'Rest', exact: true }).click();
	const navigation = page.getByRole('navigation', { name: 'Documentation', exact: true });
	await navigation.getByRole('link', { name: 'Scroll-linked motion' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Scroll-linked motion');
	await expect(page.locator('#identity')).toHaveCount(0);
	await expect(page.locator('[data-example="shared"]')).toHaveCount(0);
	await expect(page.locator('article > section')).toHaveCount(5);
	await navigation.getByRole('link', { name: 'Presence & exits', exact: true }).click();
	await page
		.locator('[data-example="state"]')
		.getByRole('button', { name: 'Dismiss notification' })
		.click();
	await navigation.getByRole('link', { name: 'Automatic layout' }).click();
	await expect(page.locator('[data-example="state"]')).toHaveCount(0);
	await expect(page.locator('[data-example="wait"]')).toHaveCount(0);
	await expect(page.locator('[data-example="layout"]')).toHaveCount(1);
	await page.goBack();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Presence & exits');
	await expect(page.locator('[data-example="state"] .notification')).toHaveCount(1);
	await expect(page.locator('[data-example="layout"]')).toHaveCount(0);
	expect(errors).toEqual([]);
});

test('the pinned scroll composition assembles, reverses and resets', async ({ page }) => {
	await page.goto('/docs/scroll');
	const demo = page.locator('[data-example="scroll"]');
	const reader = demo.locator('.reader');
	const paper = demo.locator('.paper').first();
	await expect(paper).toBeVisible();
	// Visibility precedes the scroll attachment's first animation frame.
	await expect(paper).not.toHaveCSS('transform', 'none');
	const initial = await paper.evaluate((node) => getComputedStyle(node).transform);
	await reader.evaluate((node) => {
		node.scrollTop = (node.scrollHeight - node.clientHeight) / 2;
	});
	await expect(demo.locator('progress')).toHaveAttribute('value', '0.5');
	await expect(demo.getByRole('heading', { name: 'Bring them together.' })).toBeVisible();
	await expect
		.poll(() =>
			paper.evaluate((node) => {
				const m = new DOMMatrix(getComputedStyle(node).transform);
				return Math.abs(m.m41) + Math.abs(m.m42) + Math.abs(m.b);
			})
		)
		.toBeLessThan(0.01);
	await reader.evaluate((node) => {
		node.scrollTop = node.scrollHeight;
	});
	await expect(demo.locator('progress')).toHaveAttribute('value', '1');
	await expect(demo.getByRole('heading', { name: 'Let them go.' })).toBeVisible();
	await reader.evaluate((node) => {
		node.scrollTop = 0;
	});
	await expect.poll(() => paper.evaluate((node) => getComputedStyle(node).transform)).toBe(initial);
	await reader.evaluate((node) => {
		node.scrollTop = node.scrollHeight;
	});
	await demo.getByRole('button', { name: 'Reset Make it move' }).click();
	await expect(demo.locator('progress')).toHaveAttribute('value', '0');
});
