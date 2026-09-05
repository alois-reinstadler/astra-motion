import { expect, test } from '@playwright/test';

test('home demo keeps identity through repeated layout changes and links into the docs', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Make room');
	await page.getByRole('button', { name: 'Stack', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Stack', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await page
		.locator('.motion-piece')
		.first()
		.evaluate((node) => node.setAttribute('data-original', 'true'));
	for (let index = 0; index < 6; index++) {
		await page.getByRole('button', { name: index % 2 ? 'Stack' : 'Grid', exact: true }).click();
		await page.getByRole('button', { name: 'Reorder' }).click();
	}
	await expect(page.locator('.motion-piece')).toHaveCount(3);
	await expect(page.locator('[data-original="true"]')).toHaveCount(1);
	await expect
		.poll(() =>
			page
				.locator('.motion-piece')
				.evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).transform === 'none'))
		)
		.toBe(true);
	await page.getByRole('link', { name: 'Start building' }).click();
	await expect(page).toHaveURL(/\/docs\/getting-started$/);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	expect(errors).toEqual([]);
});

test('example discovery filters, searches, recovers empty results and leads back from the lab', async ({
	page
}) => {
	await page.goto('/examples');
	await page.getByRole('button', { name: 'Routes', exact: true }).click();
	await expect(page.locator('.example')).toHaveCount(1);
	await expect(page.locator('.example')).toContainText('Shared route elements');
	await page.getByRole('searchbox', { name: 'Search examples' }).fill('no-such-example');
	await expect(page.getByRole('heading', { name: 'No examples found.' })).toBeVisible();
	await page.getByRole('button', { name: 'Show all examples' }).click();
	await expect(page.locator('.example')).toHaveCount(11);
	await page.getByRole('searchbox', { name: 'Search examples' }).fill('accordion');
	await expect(page.locator('.example')).toHaveCount(1);
	await page.locator('.example').click();
	await expect(page).toHaveURL(/\/motion-lab\/components$/);
	await page
		.getByRole('navigation', { name: 'Laboratory navigation' })
		.getByRole('link', { name: 'All examples' })
		.click();
	await expect(page).toHaveURL(/\/examples$/);
});

test('home and catalogue keep navigation accessible on a narrow screen', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	for (const route of ['/', '/examples']) {
		await page.goto(route);
		await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
		await page.keyboard.press('Tab');
		await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/#site-content$/);
	}
});

test('home labels and symbols keep their proportions throughout layout projection', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Stack', exact: true })).toBeEnabled();
	const result = await page.evaluate(async () => {
		const nodes = [
			...document.querySelectorAll<HTMLElement>('.motion-piece strong, .piece-symbol')
		];
		const fontSizes = nodes.map((node) => getComputedStyle(node).fontSize);
		const button = [...document.querySelectorAll('button')].find(
			(node) => node.textContent === 'Stack'
		);
		button?.click();
		let maximumScaleError = 0;
		let animatedFrames = 0;
		for (let frame = 0; frame < 24; frame++) {
			await new Promise(requestAnimationFrame);
			if (getComputedStyle(document.querySelector('.motion-piece')!).transform !== 'none')
				animatedFrames++;
			for (const node of nodes) {
				let matrix = new DOMMatrix();
				for (
					let current: HTMLElement | null = node;
					current && !current.classList.contains('playground-stage');
					current = current.parentElement
				) {
					const transform = getComputedStyle(current).transform;
					if (transform !== 'none') matrix = new DOMMatrix(transform).multiply(matrix);
				}
				maximumScaleError = Math.max(
					maximumScaleError,
					Math.abs(Math.hypot(matrix.a, matrix.b) - 1),
					Math.abs(Math.hypot(matrix.c, matrix.d) - 1)
				);
			}
		}
		return {
			maximumScaleError,
			animatedFrames,
			originalFonts: fontSizes,
			currentFonts: nodes.map((node) => getComputedStyle(node).fontSize)
		};
	});
	expect(result.animatedFrames).toBeGreaterThan(0);
	expect(result.maximumScaleError).toBeLessThan(0.002);
	expect(result.currentFonts).toEqual(result.originalFonts);
});

test('a presence example has a visible matching guide return on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/docs/presence');
	await page.locator('#wait .try-example').click();
	await expect(page).toHaveURL(/\/motion-lab\/presence$/);
	const guide = page
		.getByRole('navigation', { name: 'Laboratory navigation' })
		.getByRole('link', { name: 'Presence guide' });
	await expect(guide).toBeInViewport();
	await guide.click();
	await expect(page).toHaveURL(/\/docs\/presence$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Presence & exits');
});
