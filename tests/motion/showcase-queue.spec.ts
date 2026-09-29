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
	const result = await page.getByTestId('publishing-queue').evaluate((desk) => {
		const rows = () => [...desk.querySelectorAll<HTMLElement>('[data-queue-item]')];
		const row = rows()[0];
		const id = row.dataset.queueItem!;
		const layoutParent = row.offsetParent as HTMLElement;
		const renderedTop = () =>
			row.getBoundingClientRect().top - layoutParent.getBoundingClientRect().top;
		const initialRenderedTop = renderedTop();
		const initialLayoutTop = row.offsetTop;
		const reversedIds = rows()
			.map((node) => node.dataset.queueItem!)
			.reverse();
		return new Promise<{
			popped: boolean;
			flowing: number;
			sameNode: boolean;
			inert: boolean;
			reorderedIds: string[];
			reorderLayoutDelta: number;
			reorderProgress: number;
			restoredIds: string[];
			expectedIds: string[];
			positionAfterReversal: string;
		}>((resolve, reject) => {
			let phase: 'reordering' | 'exiting' | 'restoring' = 'reordering';
			let reorderedIds: string[] = [];
			let reorderLayoutDelta = 0;
			let reorderProgress = 0;
			let popped = false;
			let flowing = 0;
			let restoringStarted = false;
			let restoringEnded = false;
			const cleanup = () => {
				clearTimeout(timeout);
				observer.disconnect();
				row.removeEventListener('introstart', onIntroStart);
				row.removeEventListener('introend', onIntroEnd);
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
				restoringEnded = true;
				queueMicrotask(inspect);
			};
			const inspect = () => {
				try {
					if (!desk.contains(row)) throw new Error(`Original queue row detached while ${phase}`);
					if (phase === 'reordering') {
						const currentIds = rows().map((node) => node.dataset.queueItem!);
						if (currentIds.join(',') !== reversedIds.join(',')) return;
						const layoutDelta = row.offsetTop - initialLayoutTop;
						const renderedTravel = renderedTop() - initialRenderedTop;
						const progress = renderedTravel / layoutDelta;
						// A committed reorder jumps to its endpoint before projection renders.
						// Remove only after playback has moved away from the start and is
						// still visibly short of that endpoint, not at the initial inversion.
						if (
							!Number.isFinite(progress) ||
							layoutDelta <= 0 ||
							progress <= 0 ||
							progress >= 1 ||
							Math.abs(renderedTravel) <= 1 ||
							Math.abs(layoutDelta - renderedTravel) <= 1
						)
							return;
						reorderedIds = currentIds;
						reorderLayoutDelta = layoutDelta;
						reorderProgress = progress;
						phase = 'exiting';
						row.querySelector<HTMLButtonElement>('[data-queue-action="remove"]')!.click();
					} else if (phase === 'exiting') {
						const undo = desk.querySelector<HTMLButtonElement>('[data-testid="queue-undo"]');
						if (
							!row.inert ||
							getComputedStyle(row).position !== 'absolute' ||
							!undo ||
							undo.disabled
						)
							return;
						popped = row.inert && getComputedStyle(row).position === 'absolute';
						flowing = rows().filter(
							(node) => getComputedStyle(node).position !== 'absolute'
						).length;
						// Undo at the observed pop, before yielding to another animation frame.
						phase = 'restoring';
						undo.click();
					} else if (restoringEnded && !row.inert) {
						cleanup();
						resolve({
							popped,
							flowing,
							sameNode: desk.querySelector(`[data-queue-item="${id}"]`) === row,
							inert: row.inert,
							reorderedIds,
							reorderLayoutDelta,
							reorderProgress,
							restoredIds: rows().map((node) => node.dataset.queueItem!),
							expectedIds: reversedIds,
							positionAfterReversal: row.style.position
						});
					}
				} catch (error) {
					fail(error);
				}
			};
			const observer = new MutationObserver(inspect);
			const timeout = setTimeout(
				() => fail(new Error(`Queue reversal stalled while ${phase}`)),
				5000
			);
			observer.observe(desk, { childList: true, subtree: true, attributes: true });
			row.addEventListener('introstart', onIntroStart);
			row.addEventListener('introend', onIntroEnd);
			desk.querySelector<HTMLButtonElement>('[data-testid="queue-reverse"]')!.click();
		});
	});
	expect(result).toMatchObject({ popped: true, flowing: 2, sameNode: true, inert: false });
	expect(result.reorderedIds).toEqual(result.expectedIds);
	expect(result.reorderLayoutDelta).toBeGreaterThan(0);
	expect(result.reorderProgress).toBeGreaterThan(0);
	expect(result.reorderProgress).toBeLessThan(1);
	expect(Math.abs(result.reorderLayoutDelta * result.reorderProgress)).toBeGreaterThan(1);
	expect(Math.abs(result.reorderLayoutDelta * (1 - result.reorderProgress))).toBeGreaterThan(1);
	expect(result.restoredIds).toEqual(result.expectedIds);
	expect(result.positionAfterReversal).toBe('');
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
