import { expect, test } from '@playwright/test';

test('state initial styles exist without JavaScript, hydrate cleanly, and retain the real article', async ({
	browser,
	page,
	baseURL
}) => {
	const server = await browser.newContext({ javaScriptEnabled: false, baseURL });
	const unhydrated = await server.newPage();
	await unhydrated.goto('/motion-lab/state');
	await expect(unhydrated.locator('[data-state="presence-card"]')).toHaveAttribute(
		'style',
		/opacity:0/
	);
	await expect(unhydrated.locator('[data-state="presence-card"]')).toHaveAttribute(
		'style',
		/scale\(0\.94\)/
	);
	await server.close();
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (message) => {
		if (/hydration/i.test(message.text())) errors.push(message.text());
	});
	await page.goto('/motion-lab/state');
	const card = page.locator('[data-state="presence-card"]');
	await expect(card).toHaveCSS('opacity', '1');
	await card.evaluate((node) => node.setAttribute('data-original', 'true'));
	await page.locator('[data-state="toggle"]').click();
	await expect(card).toHaveAttribute('data-original', 'true');
	await page.locator('[data-state="toggle"]').click();
	await expect(card).toHaveCSS('opacity', '1');
	await expect(card).toHaveAttribute('data-original', 'true');
	await page.locator('[data-state="stress"]').click();
	await expect(page.locator('[data-state="stress"]')).toBeEnabled({ timeout: 10000 });
	await expect(card).toHaveCount(1);
	await expect(card).toHaveCSS('opacity', '1');
	expect(errors).toEqual([]);
});

test('OS reduced motion interrupts state animation and stays correct after route teardown', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/motion-lab/state');
	const card = page.locator('[data-state="presence-card"]');
	await expect(card).toHaveCSS('opacity', '1');
	await page.locator('[data-state="toggle"]').click();
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await expect(card).toHaveCount(0);
	await page.locator('[data-state="toggle"]').click();
	await expect(card).toHaveCSS('opacity', '1');
	await page.getByRole('link', { name: 'Layout experiments', exact: false }).click();
	await expect(page).toHaveURL(/motion-lab$/);
	await page.goBack();
	await expect(card).toHaveCSS('opacity', '1');
	expect(errors).toEqual([]);
});
