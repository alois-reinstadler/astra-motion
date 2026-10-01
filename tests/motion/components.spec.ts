import { expect, test, type Locator, type Page } from '@playwright/test';

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

async function loadComponents(page: Page) {
	await page.setViewportSize({ width: 414, height: 896 });
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error' || /hydration/i.test(message.text()))
			errors.push(message.text());
	});
	await page.goto('/motion-lab/components');
	// This waits for module loading, hydration and the entrance, not just animation
	// duration. Keep the tighter timing assertions below for hydrated interactions.
	await expect(page.getByTestId('component-card-2')).toHaveCSS('opacity', '1');
	return errors;
}

test('preserves actual dialog focus, labeling, centering and Escape dismissal', async ({
	page
}) => {
	const errors = await loadComponents(page);
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

test('reverses the actual accordion without stretching text or losing expanded state', async ({
	page
}) => {
	const errors = await loadComponents(page);
	await page.getByTestId('component-accordion-toggle').click();
	const content = page.getByTestId('component-accordion-content');
	await expect
		.poll(() => content.evaluate((node) => node.getBoundingClientRect().height), { timeout: 1000 })
		.toBeGreaterThan(0);
	const result = await content.evaluate(async (original) => {
		const toggle = document.querySelector<HTMLButtonElement>(
			'[data-testid="component-accordion-toggle"]'
		)!;
		const beforeHeight = original.getBoundingClientRect().height;
		// Keep the interruption inside the page, independent of automation round trips.
		toggle.click();
		await new Promise((resolve) => setTimeout(resolve, 30));
		toggle.click();
		await new Promise((resolve) => setTimeout(resolve, 350));
		const text = original.querySelector('p')!;
		const transform = new DOMMatrix(getComputedStyle(text).transform);
		return {
			beforeHeight,
			sameNode: document.querySelector('[data-testid="component-accordion-content"]') === original,
			expanded: document
				.querySelector('[data-testid="component-accordion-trigger"]')!
				.getAttribute('aria-expanded'),
			scaleX: transform.a,
			scaleY: transform.d
		};
	});
	expect(result.beforeHeight).toBeGreaterThan(0);
	expect(result.sameNode).toBe(true);
	expect(result.expanded).toBe('true');
	expect(result.scaleX).toBe(1);
	expect(result.scaleY).toBe(1);
	await page.getByTestId('component-extra').click();
	await expect(page.getByTestId('component-extra-content')).toContainText('extra paragraph');
	expect(errors).toEqual([]);
});

test('reopens the same dialog during exit and cleans up a destroyed owner', async ({ page }) => {
	const errors = await loadComponents(page);
	await page.getByTestId('component-dialog-trigger').click();
	const dialog = page.getByTestId('component-dialog');
	await expect
		.poll(() => dialog.evaluate((node) => Number(getComputedStyle(node).opacity)), {
			timeout: 1000
		})
		.toBeGreaterThan(0.3);
	const sameNode = await dialog.evaluate(async (original) => {
		document.querySelector<HTMLButtonElement>('[data-testid="component-dialog-close"]')!.click();
		await new Promise((resolve) => setTimeout(resolve, 30));
		document.querySelector<HTMLButtonElement>('[data-testid="component-dialog-trigger"]')!.click();
		await new Promise((resolve) => setTimeout(resolve, 300));
		return document.querySelector('[data-testid="component-dialog"]') === original;
	});
	expect(sameNode).toBe(true);
	await page.getByTestId('component-dialog-destroy').click();
	await expect(dialog).toHaveCount(0, { timeout: 1000 });
	expect(await page.locator('[data-slot="dialog-overlay"]').count()).toBe(0);
	const reset = page.getByTestId('component-dialog-reset');
	await reset.focus();
	expect(await reset.evaluate((node) => document.activeElement === node)).toBe(true);
	expect(errors).toEqual([]);
});

test('removes cards from flow during filter exits and restores current keyed cards under reversal', async ({
	page
}) => {
	const errors = await loadComponents(page);
	const card = page.getByTestId('component-card-2');
	await card.scrollIntoViewIfNeeded();
	await expect(card).toHaveCSS('opacity', '1', { timeout: 1000 });
	const result = await card.evaluate((original) => {
		const grid = document.querySelector<HTMLElement>('[data-testid="component-grid"]')!;
		const button = (id: string) =>
			document.querySelector<HTMLButtonElement>(`[data-testid="component-${id}"]`)!;
		const ids = () => [...grid.children].map((node) => node.getAttribute('data-testid'));
		return new Promise<{
			positionDuringExit: string;
			retainedDuringExit: boolean;
			reorderedIds: string[];
			retainedWhenReversing: boolean;
			retainedAfterReversal: boolean;
			positionAfterReversal: string;
			count: number;
			ids: (string | null)[];
		}>((resolve, reject) => {
			let phase: 'exiting' | 'reordering' | 'restoring' = 'exiting';
			let positionDuringExit = '';
			let retainedDuringExit = false;
			let reorderedIds: string[] = [];
			let retainedWhenReversing = false;
			let restoringStarted = false;
			const cleanup = () => {
				clearTimeout(timeout);
				observer.disconnect();
				original.removeEventListener('introstart', onIntroStart);
				original.removeEventListener('introend', onIntroEnd);
			};
			const fail = (error: unknown) => {
				cleanup();
				reject(error);
			};
			const onIntroStart = () => {
				if (phase === 'restoring') restoringStarted = true;
			};
			const onIntroEnd = () => {
				if (phase !== 'restoring' || !restoringStarted) return;
				queueMicrotask(() => {
					cleanup();
					resolve({
						positionDuringExit,
						retainedDuringExit,
						reorderedIds,
						retainedWhenReversing,
						retainedAfterReversal:
							grid.querySelector('[data-testid="component-card-2"]') === original,
						positionAfterReversal: original.style.position,
						count: grid.querySelectorAll('[data-testid^="component-card-"]').length,
						ids: ids()
					});
				});
			};
			const observer = new MutationObserver(() => {
				try {
					if (!grid.contains(original)) throw new Error(`Original card detached while ${phase}`);
					if (phase === 'exiting' && original.style.position === 'absolute') {
						positionDuringExit = original.style.position;
						retainedDuringExit =
							grid.querySelector('[data-testid="component-card-2"]') === original;
						phase = 'reordering';
						button('reorder').click();
					} else if (phase === 'reordering') {
						const flowingIds = [...grid.children]
							.filter((node) => (node as HTMLElement).style.position !== 'absolute')
							.map((node) => node.getAttribute('data-testid')!);
						if (flowingIds.join(',') !== 'component-card-5,component-card-3,component-card-1')
							return;
						// Observe the committed reorder, then reverse in this same microtask checkpoint.
						reorderedIds = flowingIds;
						retainedWhenReversing =
							original.style.position === 'absolute' && grid.contains(original);
						if (!retainedWhenReversing) throw new Error('Card stopped exiting before reversal');
						phase = 'restoring';
						button('filter').click();
					}
				} catch (error) {
					fail(error);
				}
			});
			const timeout = setTimeout(
				() => fail(new Error(`Card reversal stalled while ${phase}`)),
				5000
			);
			observer.observe(grid, { childList: true, subtree: true, attributes: true });
			original.addEventListener('introstart', onIntroStart);
			original.addEventListener('introend', onIntroEnd);
			button('filter').click();
		});
	});
	expect(result.positionDuringExit).toBe('absolute');
	expect(result.retainedDuringExit).toBe(true);
	expect(result.reorderedIds).toEqual([5, 3, 1].map((id) => `component-card-${id}`));
	expect(result.retainedWhenReversing).toBe(true);
	expect(result.retainedAfterReversal).toBe(true);
	expect(result.positionAfterReversal).toBe('');
	expect(result.count).toBe(6);
	expect(result.ids).toEqual([6, 5, 4, 3, 2, 1].map((id) => `component-card-${id}`));
	expect(errors).toEqual([]);
});

test('keeps form text unscaled throughout an interrupted dialog resize', async ({ page }) => {
	const errors = await loadComponents(page);
	await page.getByTestId('component-dialog-trigger').click();
	await expect(page.getByTestId('component-dialog')).toHaveCSS('opacity', '1', { timeout: 1000 });
	const result = await page.evaluate(async () => {
		await new Promise((resolve) => setTimeout(resolve, 250));
		let worstScaleError = 0;
		let sampledFrames = 0;
		for (let cycle = 0; cycle < 3; cycle++) {
			document.querySelector<HTMLButtonElement>('[data-testid="component-dialog-expand"]')!.click();
			await Promise.resolve();
			for (let frame = 0; frame < 7; frame++) {
				await new Promise(requestAnimationFrame);
				const input = document.querySelector<HTMLElement>('[data-testid="component-dialog-input"]');
				if (!input) throw new Error('Dialog input disappeared during resize');
				let scaleY = 1;
				for (let node: HTMLElement | null = input; node; node = node.parentElement) {
					scaleY *= new DOMMatrix(getComputedStyle(node).transform).d;
				}
				worstScaleError = Math.max(worstScaleError, Math.abs(scaleY - 1));
				sampledFrames++;
			}
		}
		return { worstScaleError, sampledFrames };
	});
	expect(result.sampledFrames).toBe(21);
	expect(result.worstScaleError).toBeLessThan(0.025);
	expect(errors).toEqual([]);
});
