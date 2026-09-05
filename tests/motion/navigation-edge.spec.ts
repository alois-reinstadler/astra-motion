import { expect, test, type Page } from '@playwright/test';

declare global {
	interface Window {
		__astraDelayProbe: { started: number; completed: number };
	}
}

async function observeDelayedLoad(page: Page) {
	await page.addInitScript(() => {
		const state = { started: 0, completed: 0 };
		Object.defineProperty(window, '__astraDelayProbe', { value: state });
		const browserWindow: Window = window;
		const schedule = browserWindow.setTimeout.bind(browserWindow);
		browserWindow.setTimeout = (handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
			// Observe the real fixture's 400 ms universal load without changing its duration.
			if (timeout === 400 && typeof handler === 'function') {
				state.started++;
				return schedule(() => {
					state.completed++;
					Reflect.apply(handler, window, args);
				}, timeout);
			}
			return schedule(handler, timeout, ...args);
		};
	});
}

async function delayCount(page: Page, key: 'started' | 'completed') {
	return page.evaluate((name) => window.__astraDelayProbe[name], key);
}

async function settled(page: Page) {
	await expect.poll(() => page.locator('[style*="view-transition-name"]').count()).toBe(0);
}

test('Kit resets forward navigation focus/scroll and restores collection scroll on browser back', async ({
	page
}) => {
	await page.setViewportSize({ width: 480, height: 600 });
	await page.goto('/motion-lab/product');
	await expect(page.getByTestId('delayed-detail')).toBeEnabled();
	const product = page.getByTestId('product-03');
	await product.scrollIntoViewIfNeeded();
	await product.focus();
	const collectionScroll = await page.evaluate(() => scrollY);
	expect(collectionScroll).toBeGreaterThan(200);
	await product.click();
	await expect(page.locator('h1')).toHaveText('Object No. 03');
	await settled(page);
	await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
	await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
	await page.goBack();
	await expect(page.locator('h1')).toHaveText('Objects in space.');
	await settled(page);
	await expect
		.poll(() => page.evaluate((previous) => Math.abs(scrollY - previous), collectionScroll))
		.toBeLessThan(2);
	await page.goForward();
	await expect(page.locator('h1')).toHaveText('Object No. 03');
	await settled(page);
	await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test('a later link supersedes a genuinely pending universal load', async ({ page }) => {
	await observeDelayedLoad(page);
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/motion-lab/product');
	await page.getByTestId('delayed-detail').click();
	await expect.poll(() => delayCount(page, 'started')).toBe(1);
	await expect(page.locator('h1')).toHaveText('Objects in space.');
	await page.getByTestId('product-02').click();
	await expect(page.locator('h1')).toHaveText('Object No. 02');
	await expect.poll(() => delayCount(page, 'completed')).toBe(1);
	await settled(page);
	await expect(page).toHaveURL(/product\/02$/);
	await expect(page.locator('h1')).toHaveText('Object No. 02');
	expect(errors).toEqual([]);
});

test('browser back supersedes a pending load without adding its abandoned target to history', async ({
	page
}) => {
	await observeDelayedLoad(page);
	await page.goto('/motion-lab/product');
	await expect(page.getByTestId('delayed-detail')).toBeEnabled();
	await page.getByTestId('product-02').click();
	await expect(page.locator('h1')).toHaveText('Object No. 02');
	await settled(page);
	await page.getByTestId('collection').click();
	await expect(page.getByTestId('delayed-detail')).toBeEnabled();
	await settled(page);
	await page.getByTestId('delayed-detail').click();
	await expect.poll(() => delayCount(page, 'started')).toBe(1);
	await page.goBack();
	await expect(page.locator('h1')).toHaveText('Object No. 02');
	await expect.poll(() => delayCount(page, 'completed')).toBe(1);
	await settled(page);
	await expect(page).toHaveURL(/product\/02$/);
	await page.goForward();
	await expect(page.locator('h1')).toHaveText('Objects in space.');
	await settled(page);
	await expect(page).toHaveURL(/product$/);
});
