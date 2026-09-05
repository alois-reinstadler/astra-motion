import { expect, test } from '@playwright/test';

test('story scroll stays current through reversals and responsive resize', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/showcase#story');
	const reader = page.getByTestId('story-reader');
	await expect(reader).toBeVisible();
	for (let index = 0; index < 12; index++) {
		await page.setViewportSize({ width: index % 2 ? 390 : 1180, height: 900 });
		const progress = index % 3 === 0 ? 0.85 : 0.25;
		await reader.evaluate((node, value) => {
			node.scrollTop = (node.scrollHeight - node.clientHeight) * value;
		}, progress);
		await expect
			.poll(async () => {
				const text = await page.getByTestId('story-progress-label').textContent();
				return Number.parseInt(text ?? '', 10);
			})
			.toBeCloseTo(progress * 100, 0);
		await expect
			.poll(() =>
				page
					.getByTestId('story-progress')
					.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a)
			)
			.toBeCloseTo(progress, 1);
		expect(
			await page.getByTestId('story-image').evaluate((node) => node.getAnimations().length)
		).toBeLessThanOrEqual(1);
	}
	await reader.focus();
	await page.keyboard.press('End');
	await expect(page.getByTestId('story-progress-label')).toHaveText('100% read');
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	expect(errors).toEqual([]);
});

test('opening can pause, resume and replay rapidly without stale completion', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/showcase#story');
	const play = page.getByTestId('story-play');
	await play.click();
	await expect(page.getByTestId('story-sequence-state')).toHaveText('Playing');
	await play.click();
	await expect(page.getByTestId('story-sequence-state')).toHaveText('Paused');
	const firstLine = page.getByTestId('story-opening').locator('.opening-line').first();
	const paused = await firstLine.evaluate((node) => getComputedStyle(node).transform);
	await page.waitForTimeout(100);
	expect(await firstLine.evaluate((node) => getComputedStyle(node).transform)).toBe(paused);
	await play.click();
	for (let index = 0; index < 8; index++) await page.getByTestId('story-replay').click();
	await expect(page.getByTestId('story-sequence-state')).toHaveText('Complete');
	await expect
		.poll(() => firstLine.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m42))
		.toBeCloseTo(0, 2);
	await expect(firstLine).toHaveCSS('opacity', '1');
	expect(errors).toEqual([]);
});

test('system reduced motion settles the artwork and finite opening', async ({ page, request }) => {
	const response = await request.get('/showcase');
	expect(response.ok()).toBe(true);
	expect(await response.text()).toContain('A slower kind');
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/showcase#story');
	await expect
		.poll(() =>
			page
				.getByTestId('story-image')
				.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a)
		)
		.toBeCloseTo(1, 3);
	await expect
		.poll(() =>
			page
				.getByTestId('story-progress')
				.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a)
		)
		.toBeCloseTo(1, 3);
	await expect
		.poll(() =>
			page
				.getByTestId('story-progress')
				.evaluate(
					(node) =>
						node.getBoundingClientRect().width / node.parentElement!.getBoundingClientRect().width
				)
		)
		.toBeCloseTo(0, 3);
	await page.getByTestId('story-play').click();
	await expect(page.getByTestId('story-sequence-state')).toHaveText('Complete');
	for (const line of await page.getByTestId('story-opening').locator('.opening-line').all()) {
		await expect(line).toHaveCSS('opacity', '1');
		expect(
			await line.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m42)
		).toBeCloseTo(0, 3);
	}
});

test('leaving during playback cleans detached animations and permits fresh playback', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/showcase#story');
	await page.getByTestId('story-play').click();
	await expect
		.poll(() =>
			page
				.getByTestId('story-opening')
				.evaluate((node) => node.getAnimations({ subtree: true }).length)
		)
		.toBeGreaterThan(0);
	await page.evaluate(() => {
		const nodes = [
			...document.querySelectorAll(
				'[data-testid="story-image"], [data-testid="story-progress"], [data-testid="story-opening"] *'
			)
		];
		const host = window as Window & {
			__storyCleanup?: () => { connected: number; animations: number };
		};
		host.__storyCleanup = () => ({
			connected: nodes.filter((node) => node.isConnected).length,
			animations: nodes.reduce((count, node) => count + node.getAnimations().length, 0)
		});
		const link = document.createElement('a');
		link.href = '/motion-lab';
		document.body.append(link);
		link.click();
		link.remove();
	});
	await expect(page).toHaveURL(/\/motion-lab$/);
	await expect
		.poll(() =>
			page.evaluate(() => {
				const host = window as Window & {
					__storyCleanup?: () => { connected: number; animations: number };
				};
				return host.__storyCleanup?.();
			})
		)
		.toEqual({ connected: 0, animations: 0 });
	await page.evaluate(() => {
		delete (window as Window & { __storyCleanup?: unknown }).__storyCleanup;
	});
	await page.goBack();
	await page.getByTestId('story-play').click();
	await expect
		.poll(() =>
			page
				.getByTestId('story-opening')
				.evaluate((node) => node.getAnimations({ subtree: true }).length)
		)
		.toBeGreaterThan(0);
	expect(errors).toEqual([]);
});

test('the showcase policy settles active playback and restores current scroll progress', async ({
	page
}) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/showcase#story');
	await page.getByTestId('story-reader').evaluate((node) => {
		node.scrollTop = (node.scrollHeight - node.clientHeight) * 0.35;
	});
	await expect(page.getByTestId('story-progress-label')).toHaveText('35% read');
	await page.getByTestId('story-play').click();
	await expect(page.getByTestId('story-sequence-state')).toHaveText('Playing');
	// Avoid scrolling to the distant toolbar letting the sequence finish first.
	await page.getByTestId('showcase-reduced').evaluate((node) => (node as HTMLInputElement).click());
	await expect(page.getByTestId('story-sequence-state')).toHaveText('Complete');
	await expect
		.poll(() =>
			page
				.getByTestId('story-progress')
				.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a)
		)
		.toBeCloseTo(1, 3);
	await expect
		.poll(() =>
			page
				.getByTestId('story-progress')
				.evaluate(
					(node) =>
						node.getBoundingClientRect().width / node.parentElement!.getBoundingClientRect().width
				)
		)
		.toBeCloseTo(0.35, 2);
	await expect(page.getByTestId('story-progress-label')).toHaveText('35% read');
	await page.getByTestId('showcase-reduced').uncheck();
	await expect
		.poll(() =>
			page
				.getByTestId('story-progress')
				.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a)
		)
		.toBeCloseTo(0.35, 2);
	await page.getByTestId('story-play').click();
	await page.getByTestId('story-play').click();
	await expect(page.getByTestId('story-sequence-state')).toHaveText('Paused');
	await page.getByTestId('showcase-reduced').evaluate((node) => (node as HTMLInputElement).click());
	await expect(page.getByTestId('story-sequence-state')).toHaveText('Complete');
	await page.getByTestId('showcase-reduced').evaluate((node) => (node as HTMLInputElement).click());
	await page.getByTestId('story-play').click();
	await expect(page.getByTestId('story-sequence-state')).toHaveText('Playing');
	await expect(page.getByTestId('story-sequence-state')).toHaveText('Complete');
});
