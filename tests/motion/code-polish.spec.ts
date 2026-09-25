import { expect, test } from '@playwright/test';

test('highlighting preserves copied source and copy feedback does not move the code', async ({
	page
}) => {
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
	const example = page.locator('[data-example="layout"]');
	await example.locator('summary').click();
	const code = example.locator('details pre code');
	await expect(code).toHaveAttribute('data-language', 'svelte');
	expect(
		await code
			.locator('span')
			.evaluateAll((nodes) => new Set(nodes.map((node) => getComputedStyle(node).color)).size)
	).toBeGreaterThan(4);
	const original = await code.textContent();
	const button = example.getByRole('button', { name: 'Copy LayoutExample.svelte' });
	// Finish the page's smooth scroll before a native pointer click chooses its coordinates.
	await button.evaluate((node) => node.scrollIntoView({ behavior: 'instant', block: 'center' }));
	const width = await button.evaluate((node) => node.getBoundingClientRect().width);
	const height = await example.evaluate((node) => node.getBoundingClientRect().height);
	await button.click();
	await expect(button).toHaveClass(/copied/);
	await expect(example.locator('details').getByRole('status')).toHaveText('Copied to clipboard');
	expect(await page.locator('html').getAttribute('data-copied-source')).toBe(original);
	expect(await button.evaluate((node) => node.getBoundingClientRect().width)).toBe(width);
	expect(await example.evaluate((node) => node.getBoundingClientRect().height)).toBe(height);
	await expect(button).not.toHaveClass(/copied/, { timeout: 4000 });
	await button.click();
	await expect(button).toHaveClass(/copied/);
});

test('clipboard failure remains actionable and reduced motion disables feedback transitions', async ({
	page
}) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.addInitScript(() => {
		let attempts = 0;
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: {
				writeText: async () => {
					if (++attempts === 1) throw new Error('Clipboard denied');
				}
			}
		});
	});
	await page.goto('/docs/layout');
	const example = page.locator('[data-example="layout"]');
	await example.locator('summary').click();
	const button = example.getByRole('button', { name: 'Copy LayoutExample.svelte' });
	await button.click();
	await expect(example.locator('details').getByRole('status')).toContainText(
		'Clipboard access is unavailable'
	);
	await expect(button).toBeEnabled();
	await button.click();
	await expect(button).toHaveClass(/copied/);
	await expect(button).toHaveCSS('transition-duration', '0s');
	await expect(button.locator('.check path')).toHaveCSS('transition-duration', '0s');
});
