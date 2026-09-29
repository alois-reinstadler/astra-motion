// Motion v13.4.4 cypress/integration/layout.ts and render/dom/scroll/__tests__/index.test.ts.
// Source mapping and MIT attribution: tests/motion-baseline/README.md and LICENSE.motion.
import { tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import UpstreamLayoutScroll from './UpstreamLayoutScroll.svelte';

const frames = () =>
	new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
	);

for (const mode of ['position', 'size'] as const) {
	it(`layout="${mode}" animates only its selected geometry and reaches the final rectangle`, async () => {
		const report = vi.fn();
		const view = render(UpstreamLayoutScroll, { mode, report });
		try {
			await tick();
			await frames();
			const box = view.getByTestId('layout-box').element();
			const before = box.getBoundingClientRect();
			expect(before.width).toBe(100);
			expect(before.height).toBe(200);
			view.component.expand();
			await expect.poll(() => report.mock.calls.map(([event]) => event)).toContain('start');
			await expect
				.poll(
					() => {
						const during = box.getBoundingClientRect();
						return mode === 'position' ? during.left - before.left : during.width;
					},
					{ interval: 10 }
				)
				.toBeCloseTo(mode === 'position' ? 100 : 200, 0);
			const during = box.getBoundingClientRect();
			if (mode === 'position') {
				expect(during.top - before.top).toBeCloseTo(50, 0);
				expect(during.width).toBeCloseTo(300, 0);
				expect(during.height).toBeCloseTo(300, 0);
			} else {
				expect(during.left - before.left).toBeCloseTo(200, 0);
				expect(during.top - before.top).toBeCloseTo(100, 0);
				expect(during.height).toBeCloseTo(250, 0);
			}
			await expect
				.poll(() => report.mock.calls.map(([event]) => event))
				.toEqual(['start', 'complete']);
			const after = box.getBoundingClientRect();
			expect(after.left - before.left).toBeCloseTo(200, 0);
			expect(after.top - before.top).toBeCloseTo(100, 0);
			expect(after.width).toBeCloseTo(300, 0);
			expect(after.height).toBeCloseTo(300, 0);
		} finally {
			await view.unmount();
		}
	});
}

for (const mode of ['enter', 'cross'] as const) {
	it(`useScroll maps ${mode} target offsets, clamps outside the range, and reverses through it`, async () => {
		const view = render(UpstreamLayoutScroll, { mode });
		try {
			await tick();
			const container = view.getByTestId('scroll-container').element() as HTMLElement;
			const target = view.getByTestId('scroll-target').element() as HTMLElement;
			expect(target.offsetTop).toBe(200);
			expect(container.clientHeight).toBe(100);
			expect(target.clientHeight).toBe(200);
			// Entry runs from scrollTop 100 to 300; crossing runs from 100 to 400.
			const range = mode === 'enter' ? 200 : 300;
			for (const [position, progress] of [
				[50, 0],
				[100 + range * 0.25, 0.25],
				[100 + range * 0.75, 0.75],
				[500, 1],
				[100 + range * 0.5, 0.5],
				[0, 0]
			]) {
				container.scrollTop = position;
				// Firefox quantizes scroll coordinates to fractional CSS pixels. Allow less
				// than one pixel, while keeping fixed expectations for target-relative progress.
				await expect
					.poll(() => Math.abs(view.component.readScroll().position - position))
					.toBeLessThan(1);
				await expect.poll(() => view.component.readScroll().progress).toBeCloseTo(progress, 2);
			}
		} finally {
			await view.unmount();
		}
	});
}
