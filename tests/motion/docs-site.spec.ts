import { expect, test } from '@playwright/test';

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
	await page.getByRole('button', { name: 'Copy Example.svelte', exact: true }).click();
	await expect(page.getByRole('status')).toHaveText('Copied to clipboard');
	expect(await page.locator('html').getAttribute('data-copied-source')).toContain(
		"from 'astra-motion/layout'"
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
	await expect(page.getByRole('region', { name: 'Example.svelte source' }).first()).toHaveAttribute(
		'tabindex',
		'0'
	);
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
		await expect(
			page.locator(`#${id}`).getByRole('region', { name: 'Example.svelte source' })
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
