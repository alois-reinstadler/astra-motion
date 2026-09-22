import { expect, test } from '@playwright/test';

test('contact sheet filters, opens shared details and restores keyboard focus', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/showcase');
	const scene = page.getByTestId('contact-sheet');
	await expect(scene.getByRole('button', { name: 'Land', exact: true })).toBeEnabled();
	await scene.getByRole('button', { name: 'Water', exact: true }).click();
	await expect(scene.locator('[data-contact-open]')).toHaveCount(2);
	await scene.getByRole('button', { name: 'All', exact: true }).click();
	const photo = scene.getByRole('button', { name: 'Open A quiet immensity', exact: true });
	await photo.focus();
	await page.keyboard.press('Enter');
	await expect(scene.locator('[data-contact-close]')).toBeFocused();
	await expect(scene.locator('.folio')).toHaveText('FIELD NOTE / 01');
	await scene.getByRole('button', { name: 'Next photograph' }).click();
	await expect(scene.getByRole('heading', { name: 'The edge of stillness' })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(photo).toBeFocused();
	await expect(scene.locator('[data-contact-open]')).toHaveCount(4);
	expect(errors).toEqual([]);
});

test('shared photo keeps its 3:2 crop through rapid open, close and density changes', async ({
	page,
	browserName
}) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/showcase');
	await expect(page.locator('[data-contact-open=namib]')).toBeEnabled();
	const result = await page.getByTestId('contact-sheet').evaluate(async (scene) => {
		let largestAspectError = 0;
		let pixelError = 0;
		let imageScaleError = 0;
		let largestTextScaleError = 0;
		for (let frame = 0; frame < 75; frame++) {
			if ([0, 24, 48].includes(frame))
				scene.querySelector<HTMLButtonElement>('[data-contact-open=namib]')?.click();
			if ([12, 36, 60].includes(frame))
				scene.querySelector<HTMLButtonElement>('[data-contact-close]')?.click();
			if ([14, 38, 62].includes(frame)) scene.querySelector<HTMLButtonElement>('.density')?.click();
			await new Promise(requestAnimationFrame);
			for (const image of scene.querySelectorAll('img')) {
				const rect = image.getBoundingClientRect();
				largestAspectError = Math.max(largestAspectError, Math.abs(rect.width / rect.height - 1.5));
				pixelError = Math.max(pixelError, Math.abs(rect.width - rect.height * 1.5));
				let x = 1,
					y = 1;
				for (
					let node: Element | null = image;
					node && scene.contains(node);
					node = node.parentElement
				) {
					const matrix = new DOMMatrix(getComputedStyle(node).transform);
					x *= Math.hypot(matrix.a, matrix.b);
					y *= Math.hypot(matrix.c, matrix.d);
				}
				imageScaleError = Math.max(imageScaleError, Math.abs(x / y - 1));
			}
			for (const label of scene.querySelectorAll('h3, .expand')) {
				let x = 1,
					y = 1;
				for (
					let parent: Element | null = label;
					parent && scene.contains(parent);
					parent = parent.parentElement
				) {
					const matrix = new DOMMatrix(getComputedStyle(parent).transform);
					x *= Math.hypot(matrix.a, matrix.b);
					y *= Math.hypot(matrix.c, matrix.d);
				}
				largestTextScaleError = Math.max(largestTextScaleError, Math.abs(x - 1), Math.abs(y - 1));
			}
		}
		return { largestAspectError, largestTextScaleError, pixelError, imageScaleError };
	});
	console.log('Contact sheet frame measurements:', JSON.stringify(result));
	// Motion rounds measured box edges to integer CSS pixels in Safari.
	// Bound that transient quantization in pixels AND scale, then verify exact settled crops.
	expect(result.pixelError).toBeLessThanOrEqual(1.25);
	expect(result.imageScaleError).toBeLessThan(browserName === 'webkit' ? 0.005 : 0.002);
	if (browserName !== 'webkit') expect(result.largestAspectError).toBeLessThan(0.002);
	expect(result.largestTextScaleError).toBeLessThan(0.002);
	await expect(page.locator('[data-contact-open]')).toHaveCount(4);
	await expect
		.poll(() =>
			page.getByTestId('contact-sheet').evaluate((scene) =>
				Math.max(
					...[...scene.querySelectorAll('img')].map((image) => {
						const box = image.getBoundingClientRect();
						return Math.abs(box.width / box.height - 1.5);
					})
				)
			)
		)
		.toBeLessThan(0.0001);
});

test('mobile showcase navigation, complete source and reduced motion are usable', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/showcase');
	await page.getByTestId('showcase-reduced').check();
	await page
		.getByRole('navigation', { name: 'Showcase scenes' })
		.getByRole('link', { name: '01 Collect' })
		.click();
	await page.locator('[data-contact-open=namib]').click();
	await expect(page.locator('[data-contact-close]')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.locator('[data-contact-open=namib]')).toBeFocused();
	const source = page.locator('#contact-sheet summary');
	// Stop the previous anchor scroll before a real click opens the native disclosure.
	await source.evaluate((node) => node.scrollIntoView({ behavior: 'instant', block: 'center' }));
	await source.click();
	await expect(page.locator('#contact-sheet details')).toHaveAttribute('open');
	await expect(
		page.getByRole('button', { name: 'Copy ContactSheet.svelte', exact: true })
	).toBeVisible();
	await expect(
		page.getByRole('button', { name: 'Copy collection.ts', exact: true }).first()
	).toBeVisible();

	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	await page
		.getByRole('navigation', { name: 'Main navigation' })
		.getByRole('link', { name: 'Documentation' })
		.click();
	await expect(page).toHaveURL(/\/docs$/);
});
