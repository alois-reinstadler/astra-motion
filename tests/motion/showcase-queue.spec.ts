import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.goto('/showcase#queue');
	await expect(page.getByTestId('publishing-queue')).toBeVisible();
	await expect(page.locator('[data-queue-item]:not([inert])')).toHaveCount(3);
	await expect
		.poll(() =>
			page
				.locator('[data-queue-item]')
				.first()
				.evaluate((node) => Number(getComputedStyle(node).opacity))
		)
		.toBe(1);
});

test('keeps text and photographs proportional during density changes and repeated reordering', async ({
	page
}) => {
	const faults = await page.getByTestId('publishing-queue').evaluate(async (desk) => {
		const errors: { kind: string; ratio: number }[] = [];
		const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		const click = (testid: string) =>
			desk.querySelector<HTMLButtonElement>(`[data-testid="${testid}"]`)!.click();
		for (let i = 0; i < 6; i++) {
			click(i % 2 ? 'queue-reverse' : 'queue-density');
			for (let sample = 0; sample < 4; sample++) {
				await frame();
				for (const image of desk.querySelectorAll<HTMLImageElement>('[data-queue-thumbnail] img')) {
					const box = image.getBoundingClientRect();
					const ratio = box.width / box.height;
					if (Math.abs(ratio - 1.5) > 0.06) errors.push({ kind: 'image', ratio });
				}
				for (const text of desk.querySelectorAll<HTMLElement>('[data-queue-caption]')) {
					let matrix = new DOMMatrix();
					for (
						let node: HTMLElement | null = text;
						node && node !== desk;
						node = node.parentElement
					)
						matrix = new DOMMatrix(getComputedStyle(node).transform).multiply(matrix);
					const ratio = Math.hypot(matrix.a, matrix.b) / Math.hypot(matrix.c, matrix.d);
					if (Math.abs(ratio - 1) > 0.03) errors.push({ kind: 'text', ratio });
				}
			}
		}
		return errors;
	});
	expect(faults).toEqual([]);
});

test('removes during a reorder, immediately reflows, and undoes on the retained native node', async ({
	page
}) => {
	const result = await page.getByTestId('publishing-queue').evaluate(async (desk) => {
		const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		const row = desk.querySelector<HTMLElement>('[data-queue-item]')!;
		const id = row.dataset.queueItem!;
		desk.querySelector<HTMLButtonElement>('[data-testid="queue-reverse"]')!.click();
		await frame();
		row.querySelector<HTMLButtonElement>('[data-queue-action="remove"]')!.click();
		await frame();
		await frame();
		const popped = row.inert && getComputedStyle(row).position === 'absolute';
		const flowing = [...desk.querySelectorAll<HTMLElement>('[data-queue-item]')].filter(
			(node) => getComputedStyle(node).position !== 'absolute'
		).length;
		desk.querySelector<HTMLButtonElement>('[data-testid="queue-undo"]')!.click();
		await frame();
		await frame();
		return {
			popped,
			flowing,
			sameNode: desk.querySelector(`[data-queue-item="${id}"]`) === row,
			inert: row.inert
		};
	});
	expect(result).toEqual({ popped: true, flowing: 2, sameNode: true, inert: false });
	await expect(page.locator('[data-queue-item]:not([inert])')).toHaveCount(3);
});

test('supports keyboard editing, undo focus, and adding the remaining photograph', async ({
	page
}) => {
	const first = page.locator('[data-queue-item]').first();
	const id = await first.getAttribute('data-queue-item');
	const later = page.locator(`[data-queue-item="${id}"] [data-queue-action="later"]`);
	await later.focus();
	await later.press('Enter');
	await expect(page.locator('[data-queue-item]').nth(1)).toHaveAttribute('data-queue-item', id!);
	await expect(later).toBeFocused();
	const remove = page.locator(`[data-queue-item="${id}"] [data-queue-action="remove"]`);
	await remove.focus();
	await remove.press('Enter');
	await expect(page.getByTestId('publishing-queue').getByRole('status')).toContainText(
		'Undo is available'
	);
	await expect
		.poll(() =>
			page.evaluate(() =>
				document.activeElement?.closest('[data-queue-item]')?.getAttribute('data-queue-item')
			)
		)
		.not.toBe(id);
	await page.getByTestId('queue-undo').focus();
	await page.getByTestId('queue-undo').press('Enter');
	await expect(remove).toBeFocused();
	await page.getByTestId('queue-add').focus();
	await page.getByTestId('queue-add').press('Enter');
	await expect(page.locator('[data-queue-item]:not([inert])')).toHaveCount(4);
	await expect(page.getByTestId('queue-add')).toBeDisabled();
	await expect
		.poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-queue-action')))
		.toBe('earlier');
});

test('handles reduced motion and narrow screens without trapped controls or overflow', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.getByTestId('showcase-reduced').check();
	await page.getByTestId('queue-density').click();
	await page.getByTestId('queue-reverse').click();
	await page.locator('[data-queue-item]').first().locator('[data-queue-action="remove"]').click();
	await expect(page.locator('[data-queue-item]')).toHaveCount(2);
	await page.getByTestId('queue-undo').click();
	await expect(page.locator('[data-queue-item]')).toHaveCount(3);
	const dimensions = await page.getByTestId('publishing-queue').evaluate((node) => ({
		width: node.clientWidth,
		scroll: node.scrollWidth,
		inert: node.querySelectorAll('[data-queue-item][inert]').length
	}));
	expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
	expect(dimensions.inert).toBe(0);
});
