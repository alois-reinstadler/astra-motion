import { expect, test } from '@playwright/test';

declare global {
	interface Window {
		__astraRouteSkips: number;
		__astraRouteActivity: { ready: number; active: number[]; skipped: number };
		__astraRouteTest: {
			supported: boolean;
			started: number;
			ready: number;
			rejected: number;
			oldNames: number;
			newNames: number;
		};
	}
}

test('SSR, hydration, standard links and browser history', async ({ page, request }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'warning' && message.text().includes('hydration'))
			errors.push(message.text());
	});
	const response = await request.get('/motion-lab/product');
	expect(response.ok()).toBe(true);
	expect(await response.text()).toContain('Object No. 01');
	await page.goto('/motion-lab/product');
	// Native snapshot assertions require Kit's client navigation hook to be mounted.
	await expect(page.getByTestId('delayed-detail')).toBeEnabled();
	await page.getByTestId('product-01').click();
	await expect(page).toHaveURL(/product\/01$/);
	await expect(page.locator('h1')).toHaveText('Object No. 01');
	await page.goBack();
	await expect(page.getByTestId('product-01')).toBeVisible();
	await page.goForward();
	await expect(page.locator('h1')).toHaveText('Object No. 01');
	await expect.poll(() => page.locator('[style*="view-transition-name"]').count()).toBe(0);
	expect(errors).toEqual([]);
});

test('a live reduced-motion change skips the active snapshot without interrupting navigation', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.addInitScript(() => {
		window.__astraRouteSkips = 0;
		if (!document.startViewTransition) return;
		const start = document.startViewTransition.bind(document);
		document.startViewTransition = (...args: Parameters<Document['startViewTransition']>) => {
			const transition = start(...args);
			const skip = transition.skipTransition.bind(transition);
			transition.skipTransition = () => {
				window.__astraRouteSkips++;
				skip();
			};
			return transition;
		};
	});
	await page.goto('/motion-lab/product');
	// Native snapshot assertions require Kit's client navigation hook to be mounted.
	await expect(page.getByTestId('delayed-detail')).toBeEnabled();
	await page.addStyleTag({
		content: '::view-transition-group(*) { animation-duration: 20s !important; }'
	});
	await page.getByTestId('product-02').click();
	await expect(page.locator('h1')).toHaveText('Object No. 02');
	if (await page.evaluate(() => Boolean(document.startViewTransition))) {
		await expect.poll(() => page.locator('[style*="view-transition-name"]').count()).toBe(3);
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await expect.poll(() => page.evaluate(() => window.__astraRouteSkips)).toBe(1);
	}
	await expect.poll(() => page.locator('[style*="view-transition-name"]').count()).toBe(0);
	await expect(page).toHaveURL(/product\/02$/);
	expect(errors).toEqual([]);
});

test('temporary scoped names win over important authored CSS and are restored afterward', async ({
	page
}) => {
	await page.goto('/motion-lab/product');
	// Native snapshot assertions require Kit's client navigation hook to be mounted.
	await expect(page.getByTestId('delayed-detail')).toBeEnabled();
	await page.addStyleTag({
		content: 'img { view-transition-name: authored-collision !important; }'
	});
	await page.evaluate(() => {
		if (!document.startViewTransition) return;
		const start = document.startViewTransition.bind(document);
		window.__astraRouteSkips = 0;
		document.startViewTransition = (...args: Parameters<Document['startViewTransition']>) => {
			const transition = start(...args);
			void transition.ready.catch(() => window.__astraRouteSkips++);
			return transition;
		};
	});
	await page.getByTestId('product-01').click();
	await expect(page.locator('h1')).toHaveText('Object No. 01');
	await expect.poll(() => page.locator('[style*="view-transition-name"]').count()).toBe(0);
	if (await page.evaluate(() => Boolean(document.startViewTransition))) {
		expect(await page.evaluate(() => window.__astraRouteSkips)).toBe(0);
	}
	await expect(page.locator('img')).toHaveCSS('view-transition-name', 'authored-collision');
});

test('reduced motion navigation stays functional without temporary names', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/motion-lab/product');
	// Native snapshot assertions require Kit's client navigation hook to be mounted.
	await expect(page.getByTestId('delayed-detail')).toBeEnabled();
	await page.getByTestId('product-02').click();
	await expect(page.locator('h1')).toHaveText('Object No. 02');
	expect(await page.locator('[style*="view-transition-name"]').count()).toBe(0);
});

test('programmatic navigation supersedes an active native transition', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.addInitScript(() => {
		const state = (window.__astraRouteActivity = { ready: 0, active: [] as number[], skipped: 0 });
		if (!document.startViewTransition) return;
		const start = document.startViewTransition.bind(document);
		let sequence = 0;
		document.startViewTransition = (...args: Parameters<Document['startViewTransition']>) => {
			const transition = start(...args);
			const id = ++sequence;
			void transition.ready.then(
				() => {
					state.ready++;
					state.active.push(id);
				},
				() => {}
			);
			void transition.finished.then(
				() => {
					state.active = state.active.filter((active) => active !== id);
				},
				() => {}
			);
			const skip = transition.skipTransition.bind(transition);
			transition.skipTransition = () => {
				state.skipped++;
				skip();
			};
			return transition;
		};
	});
	await page.goto('/motion-lab/product');
	await expect(page.getByTestId('delayed-detail')).toBeEnabled();
	expect(await page.evaluate(() => Boolean(document.startViewTransition))).toBe(true);
	const duration = await page.addStyleTag({
		content: '::view-transition-group(*) { animation-duration: 20s !important; }'
	});
	await page.getByTestId('product-01').click();
	await expect.poll(() => page.evaluate(() => window.__astraRouteActivity.active)).toEqual([1]);
	// Exercise interruption while snapshots are active. Pointer navigation and history
	// are covered separately; native snapshot overlays can intercept pointer input.
	await page.getByTestId('collection').evaluate((link: HTMLAnchorElement) => link.click());
	await expect(page.getByTestId('product-03')).toBeVisible();
	await expect.poll(() => page.evaluate(() => window.__astraRouteActivity.active)).toEqual([2]);
	await page.getByTestId('product-03').evaluate((link: HTMLAnchorElement) => link.click());
	await expect(page.locator('h1')).toHaveText('Object No. 03');
	await expect(page).toHaveURL(/product\/03$/);
	await expect.poll(() => page.evaluate(() => window.__astraRouteActivity.ready)).toBe(3);
	expect(await page.evaluate(() => window.__astraRouteActivity.skipped)).toBe(2);
	await duration.evaluate((style) => style.parentNode?.removeChild(style));
	await expect.poll(() => page.evaluate(() => window.__astraRouteActivity.active)).toEqual([]);
	await expect.poll(() => page.locator('[style*="view-transition-name"]').count()).toBe(0);
	expect(errors).toEqual([]);
});

test('native snapshots accept scoped shared names after programmatic async loading', async ({
	page
}) => {
	await page.addInitScript(() => {
		const state = {
			supported: Boolean(document.startViewTransition),
			started: 0,
			ready: 0,
			rejected: 0,
			oldNames: 0,
			newNames: 0
		};
		Object.defineProperty(window, '__astraRouteTest', { value: state });
		if (!document.startViewTransition) return;
		const start = document.startViewTransition.bind(document);
		document.startViewTransition = (...args: Parameters<Document['startViewTransition']>) => {
			state.started++;
			state.oldNames = document.querySelectorAll('[style*="view-transition-name"]').length;
			const transition = start(...args);
			void transition.ready.then(
				() => {
					state.ready++;
					state.newNames = document.querySelectorAll('[style*="view-transition-name"]').length;
				},
				() => state.rejected++
			);
			return transition;
		};
	});
	await page.goto('/motion-lab/product');
	// Native snapshot assertions require Kit's client navigation hook to be mounted.
	await expect(page.getByTestId('delayed-detail')).toBeEnabled();
	await page.getByTestId('delayed-detail').click();
	await expect(page.locator('h1')).toHaveText('Object No. 01');
	const state = await page.evaluate(() => window.__astraRouteTest);
	expect(state.supported).toBe(true);
	if (state.supported) {
		await expect.poll(() => page.evaluate(() => window.__astraRouteTest.ready)).toBe(1);
		const result = await page.evaluate(() => window.__astraRouteTest);
		expect(result.rejected).toBe(0);
		expect(result.oldNames).toBe(9);
		expect(result.newNames).toBe(3);
	}
	await expect.poll(() => page.locator('[style*="view-transition-name"]').count()).toBe(0);
});
