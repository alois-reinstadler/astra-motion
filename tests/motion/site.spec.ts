import { expect, test } from '@playwright/test';

test('home demo keeps identity through repeated layout changes and links into the docs', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Make room');
	const stack = page.getByRole('button', { name: 'Stack', exact: true });
	// The entrance clips the controls before revealing them. Wait for the reveal,
	// then center the target so native smooth scrolling cannot move a pointer click.
	await expect(page.locator('.hero-playground')).toHaveCSS(
		'clip-path',
		/^inset\(0(?:%|px)?(?: 0(?:%|px)?){0,3}\)$/
	);
	await stack.evaluate((node) => node.scrollIntoView({ behavior: 'instant', block: 'center' }));
	await stack.click();
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

test('example discovery filters, searches, and opens a dedicated live example', async ({
	page
}) => {
	await page.goto('/examples');
	await page.getByRole('button', { name: 'Routes', exact: true }).click();
	await expect(page.locator('.example-grid > .example')).toHaveCount(1);
	await expect(page.locator('.example-grid > .example')).toContainText(
		'Connect two views with a shared cover'
	);
	await page.getByRole('searchbox', { name: 'Search examples' }).fill('no-such-example');
	await expect(page.getByRole('heading', { name: 'No examples found.' })).toBeVisible();
	await page.getByRole('button', { name: 'Show all examples' }).click();
	await expect(page.locator('.example-grid > .example')).toHaveCount(45);
	await page.getByRole('searchbox', { name: 'Search examples' }).fill('drag feedback');
	await expect(page.locator('.example-grid > .example')).toHaveCount(1);
	await page.locator('.example-grid > .example').click();
	await expect(page).toHaveURL(/\/examples\/gestures$/);
	await expect(page.locator('[data-example="gestures"]')).toBeVisible();
	await page
		.getByRole('navigation', { name: 'Main navigation' })
		.getByRole('link', { name: 'Examples', exact: true })
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
	// SSR buttons are enabled before hydration; the completed entrance proves handlers are attached.
	await expect(page.locator('.hero-playground')).toHaveCSS(
		'clip-path',
		/^inset\(0(?:%|px)?(?: 0(?:%|px)?){0,3}\)$/
	);
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
	await expect(page.getByRole('button', { name: 'Stack', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	expect(result.animatedFrames).toBeGreaterThan(0);
	expect(result.maximumScaleError).toBeLessThan(0.002);
	expect(result.currentFonts).toEqual(result.originalFonts);
});

test('a preserved presence composition can be tried and inspected on a narrow screen', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/examples/wait');
	const example = page.locator('[data-example="wait"]');
	await example.getByRole('button', { name: 'Next note' }).click();
	await expect(example.locator('.chapter')).toContainText('02');
	await example.locator('summary').click();
	await expect(
		example.getByRole('region', { name: 'PresenceExample.svelte source' })
	).toBeVisible();
	await expect(page.locator('a[href*="motion-lab"]')).toHaveCount(0);
	await expect(page).toHaveURL(/\/examples\/wait$/);
});

test('the first lesson exposes runnable code and every catalog entry opens its promised destination', async ({
	page
}) => {
	// The expanded catalogue deliberately opens all 45 destinations and their reference anchors.
	test.setTimeout(180_000);
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});
	await page.goto('/docs');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Getting started');
	await expect(page.locator('[data-example="state"]')).toHaveCount(1);
	await page.goto('/docs/getting-started#motion-component');
	const first = page.locator('#first-component');
	await expect(first.getByRole('region', { name: 'Notification.svelte source' })).toBeVisible();
	await expect(first.getByRole('region', { name: 'Notification.svelte source' })).toContainText(
		"import { motion } from 'astra-motion'"
	);
	await expect(first.getByRole('region', { name: 'Notification.svelte source' })).toContainText(
		'{#if visible}'
	);
	await expect(page.locator('[data-example]')).toHaveCount(1);
	await page.goto('/examples');
	const destinations = await page.locator('.example-grid > .example').evaluateAll((nodes) =>
		nodes.map((node) => ({
			href: (node as HTMLAnchorElement).getAttribute('href')!,
			title: node.querySelector('h2')!.textContent!
		}))
	);
	expect(destinations).toHaveLength(45);
	for (const destination of destinations) {
		// Keep the pointer off document links between independently loaded destinations.
		await page.mouse.move(0, 0);
		await page.goto(destination.href);
		if (destination.href.includes('/showcase')) {
			await expect(page.getByRole('heading', { level: 1 })).toContainText('Fieldwork');
		} else {
			const id = new URL(page.url()).pathname.split('/').at(-1)!;
			const example = page.locator(`[data-example="${id}"]`);
			await expect(page.getByRole('heading', { level: 1 })).toHaveText(destination.title);
			await expect(example).toBeVisible();
			await expect(example.locator('.preview-heading')).toContainText(destination.title);
			// A live demo can contain its own native disclosures, as LayoutGroup does.
			await expect(example.locator(':scope > details > summary')).toContainText('Complete source');
			await expect(example.locator('.preview-root')).toHaveCount(1);
			const reference = page.getByRole('link', { name: /^Read / });
			const href = await reference.getAttribute('href');
			expect(href).toMatch(/^\/docs\/[^#]+#[^#]+$/);
			await reference.click();
			await page.mouse.move(0, 0);
			await expect(page).toHaveURL(href!);
			const anchor = new URL(page.url()).hash.slice(1);
			await expect(page.locator(`[id="${anchor}"]`)).toHaveCount(1);
		}
		// Finish hover preloads before destroying this document with the next goto.
		// Otherwise WebKit can report an unload-cancelled fetch as an access error.
		await page.waitForLoadState('networkidle');
		expect(errors, `browser errors at ${destination.href}`).toEqual([]);
		expect(await page.locator('body').innerText()).not.toMatch(
			/[\u2190-\u21ff\u27f0-\u27ff\u2900-\u297f\u2b00-\u2b11]/u
		);
	}
});
