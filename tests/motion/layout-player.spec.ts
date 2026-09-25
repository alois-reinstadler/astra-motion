import { expect, test } from '@playwright/test';

for (const width of [1280, 320]) {
	test(`player contents stay clipped during opening and rapid reversal at ${width}px`, async ({
		page
	}) => {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/docs/layout');
		const demo = page.locator('[data-example="layout"]');
		await expect(demo.getByRole('button', { name: 'Open player' })).toBeEnabled();
		await demo.evaluate((node) => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
		const result = await demo.evaluate(async (node) => {
			const button = node.querySelector<HTMLButtonElement>('.layout-example button')!;
			const escaped: string[] = [];
			let checked = 0;
			button.click();
			for (let frame = 0; frame < 80; frame++) {
				await new Promise(requestAnimationFrame);
				if (frame === 7 || frame === 11) button.click();
				const card = node.querySelector('.record')!.getBoundingClientRect();
				for (const el of node.querySelectorAll('.record p, .record h3, .record span')) {
					const rect = el.getBoundingClientRect();
					for (const y of [rect.top + 2, rect.bottom - 2]) {
						if (y >= card.top && y <= card.bottom) continue;
						checked++;
						if (el.contains(document.elementFromPoint(rect.left + 2, y))) {
							escaped.push(`${frame}: ${el.textContent}`);
						}
					}
				}
			}
			return { escaped, checked };
		});
		expect(result.escaped).toEqual([]);
		// Ensure the test exercised projected content extending beyond the growing card.
		expect(result.checked).toBeGreaterThan(0);
		await expect(demo.locator('.details')).toHaveCSS('opacity', '1');
		const contained = await demo.locator('.record').evaluate((node) => {
			const card = node.getBoundingClientRect();
			return [...node.querySelectorAll('h3, p, .play')].every((child) => {
				const rect = child.getBoundingClientRect();
				return rect.left >= card.left && rect.right <= card.right && rect.bottom <= card.bottom;
			});
		});
		expect(contained).toBe(true);
		await demo.getByRole('button', { name: 'Close player' }).click();
		await demo.getByRole('button', { name: 'Open player' }).click();
		await demo.getByRole('button', { name: /Reset/ }).click();
		await expect(demo.locator('.details')).toHaveCount(0);
		await expect(demo.getByRole('button', { name: 'Open player' })).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	});
}

test('player settles immediately with reduced motion and complete source mounts on demand', async ({
	page
}) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/docs/layout');
	const demo = page.locator('[data-example="layout"]');
	await demo.getByRole('button', { name: 'Open player' }).click();
	await expect(demo.locator('.details')).toHaveCSS('opacity', '1');
	await expect(demo.locator('.details')).toHaveCSS('animation-name', 'none');
	const excerpt = demo.locator('.concept-code pre');
	const source = demo.locator('details');
	await expect(excerpt).toBeVisible();
	await expect(excerpt).toContainText('createLayout');
	await expect(source.locator('pre')).toHaveCount(0);
	await source.locator('summary').click();
	await expect(source.locator('pre code')).toHaveAttribute('data-language', 'svelte');
	await expect(source.locator('pre')).toContainText('overflow: hidden');
	await expect(excerpt).toBeVisible();
	await source.locator('summary').click();
	await expect(source.locator('pre')).toHaveCount(0);
	await expect(excerpt).toBeVisible();
	await source.locator('summary').click();
	await expect(source.getByRole('button', { name: 'Copy LayoutExample.svelte' })).toBeEnabled();
});
