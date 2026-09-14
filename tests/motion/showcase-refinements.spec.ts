import { expect, test } from '@playwright/test';

for (const scene of ['photograph', 'story'] as const) {
	test(`${scene} replacement never paints a visible frame before the entrance`, async ({
		page
	}) => {
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.goto('/showcase');
		if (scene === 'photograph') await page.locator('[data-contact-open="namib"]').click();
		else await expect(page.getByTestId('story-next')).toBeEnabled();
		const result = await page.evaluate(async (scene) => {
			const isPhoto = scene === 'photograph';
			const root = document.querySelector(isPhoto ? '.detail' : '.cover')!;
			root.scrollIntoView({ behavior: 'instant', block: 'center' });
			document
				.querySelector<HTMLButtonElement>(
					isPhoto ? '[aria-label="Next photograph"]' : '[data-testid="story-next"]'
				)!
				.click();
			const samples: number[][] = [];
			for (let frame = 0; frame < 110; frame++) {
				await new Promise(requestAnimationFrame);
				if (!root.querySelector('img')!.getAttribute('src')!.includes('urmia')) continue;
				const selectors = isPhoto
					? ['.photo-replace', '.copy-replace']
					: ['.cover-photograph', '.story-word'];
				samples.push(
					selectors.map((selector) =>
						Number(getComputedStyle(root.querySelector(selector)!).opacity)
					)
				);
			}
			return {
				first: samples[0],
				last: samples.at(-1),
				drops: samples.flatMap((sample, index) =>
					index ? sample.map((opacity, channel) => samples[index - 1][channel] - opacity) : []
				)
			};
		}, scene);
		for (const opacity of result.first) expect(opacity).toBeLessThan(0.15);
		expect(Math.max(...result.drops)).toBeLessThan(0.08);
		expect(result.last).toEqual([1, 1]);
	});
}

test('anchor links scroll smoothly and retain native hashes, with a reduced-motion fallback', async ({
	page
}) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/showcase');
	await expect(page.getByTestId('story-next')).toBeEnabled();
	const result = await page.evaluate(async () => {
		const anchor = document.querySelector<HTMLAnchorElement>('a[href="#story"]')!;
		window.scrollTo({ top: 0, behavior: 'instant' });
		const start = scrollY;
		anchor.click();
		const positions: number[] = [];
		for (let frame = 0; frame < 100; frame++) {
			await new Promise(requestAnimationFrame);
			positions.push(scrollY);
		}
		return {
			start,
			positions,
			hash: location.hash,
			target: document.getElementById('story')!.getBoundingClientRect().top
		};
	});
	expect(result.hash).toBe('#story');
	const destination = result.positions.at(-1)!;
	expect(
		result.positions.some((position) => position > result.start + 1 && position < destination - 1)
	).toBe(true);
	expect(result.target).toBeCloseTo(24, 0);
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
	await page.goto('/docs/layout');
	await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'smooth');
});

test('queue handles precede the arrow buttons and cards clip their moving thumbnails', async ({
	page
}) => {
	await page.goto('/showcase');
	const list = page.getByTestId('queue-list');
	await list.scrollIntoViewIfNeeded();
	const result = await list.evaluate(async (list) => {
		let escapedPixels = 0;
		for (let frame = 0; frame < 65; frame++) {
			if (frame % 12 === 0)
				document.querySelector<HTMLButtonElement>('[data-testid="queue-reverse"]')!.click();
			await new Promise(requestAnimationFrame);
			for (const row of list.querySelectorAll<HTMLElement>('[data-queue-item]')) {
				const box = row.getBoundingClientRect();
				const image = row.querySelector('img')!;
				const imageBox = image.getBoundingClientRect();
				for (const [x, y] of [
					[imageBox.x + imageBox.width / 2, box.top - 2],
					[imageBox.x + imageBox.width / 2, box.bottom + 2]
				]) {
					if (document.elementFromPoint(x, y) === image) escapedPixels++;
				}
			}
		}
		return {
			escapedPixels,
			order: [...list.querySelectorAll('[data-queue-item]')].map((row) => ({
				handle: row.querySelector('[data-queue-drag]')!.getBoundingClientRect().right,
				arrows: row.querySelector('.move-buttons')!.getBoundingClientRect().left
			}))
		};
	});
	expect(result.escapedPixels).toBe(0);
	for (const row of result.order) expect(row.handle).toBeLessThanOrEqual(row.arrows);
});
