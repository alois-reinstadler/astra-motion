import { expect, test, type Locator } from '@playwright/test';

async function geometry(dialog: Locator) {
	return dialog.evaluate((node) => {
		const bounds = node.getBoundingClientRect();
		return {
			height: bounds.height,
			horizontalOffset: Math.abs(bounds.x + bounds.width / 2 - innerWidth / 2),
			verticalOffset: Math.abs(bounds.y + bounds.height / 2 - innerHeight / 2)
		};
	});
}

test('preserves actual dialog focus, labeling, centering and Escape dismissal', async ({
	page
}) => {
	await page.setViewportSize({ width: 414, height: 896 });
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error' || /hydration/i.test(message.text()))
			errors.push(message.text());
	});
	await page.goto('/motion-lab/components');
	// The card is opacity 0 in SSR markup; reaching 1 proves the client binding ran.
	await expect(page.getByTestId('component-card-2')).toHaveCSS('opacity', '1');
	const trigger = page.getByTestId('component-dialog-trigger');
	const dialog = page.getByTestId('component-dialog');
	await trigger.click();
	await expect(dialog).toHaveCSS('opacity', '1', { timeout: 1000 });
	await expect(dialog).toHaveAttribute('role', 'dialog');
	await expect(dialog).toHaveAttribute('aria-labelledby', /.+/);
	await expect(dialog).toHaveAccessibleName('A dialog that can change');
	expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
	const before = await geometry(dialog);
	expect(before.horizontalOffset).toBeLessThan(2);
	expect(before.verticalOffset).toBeLessThan(2);
	await expect
		.poll(
			() =>
				dialog.evaluate(
					(node) =>
						node
							.getAnimations()
							.filter((animation) => animation.pending || animation.playState === 'running').length
				),
			{ timeout: 1000 }
		)
		.toBe(0);

	await page.getByTestId('component-dialog-expand').click();
	await expect
		.poll(async () => (await geometry(dialog)).height, { timeout: 1000 })
		.toBeGreaterThan(before.height + 2);
	await expect(page.getByTestId('component-dialog-extra')).toBeVisible();
	await expect(dialog).toHaveCSS('transform', 'none', { timeout: 1000 });
	const after = await geometry(dialog);
	expect(after.height).toBeGreaterThan(before.height);
	expect(after.horizontalOffset).toBeLessThan(2);
	expect(after.verticalOffset).toBeLessThan(2);

	const retainedDialog = await dialog.elementHandle();
	expect(retainedDialog).not.toBeNull();
	await page.keyboard.press('Escape');
	expect(await trigger.evaluate((node) => document.activeElement === node)).toBe(true);
	await expect(dialog).toHaveCount(0, { timeout: 1000 });
	await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0, { timeout: 1000 });
	expect(await retainedDialog!.evaluate((node) => node.getAnimations().length)).toBe(0);
	await retainedDialog!.dispose();
	expect(errors).toEqual([]);
});
