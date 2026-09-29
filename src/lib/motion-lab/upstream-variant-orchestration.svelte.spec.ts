// Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion.
import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamVariantOrchestration.svelte';
const node = (id: number) => document.querySelector<HTMLElement>(`[data-upstream-child="${id}"]`)!;
const x = (id: number) => new DOMMatrix(getComputedStyle(node(id)).transform).m41;
const frames = async (count = 3) => {
	for (let i = 0; i < count; i++) await new Promise<void>((r) => requestAnimationFrame(() => r()));
};
it.each(['prop', 'variant'] as const)(
	'variant-delay-tree: %s delay holds children and grandchildren',
	async (via) => {
		const { component } = render(Fixture, { scenario: 'delay', via });
		await frames();
		flushSync(() => component.show());
		await frames();
		expect(x(0)).toBe(0);
		const grandchild = () =>
			new DOMMatrix(
				getComputedStyle(document.querySelector('[data-upstream-orchestration="grandchild"]')!)
					.transform
			).m41;
		expect(grandchild()).toBe(0);
		await expect.poll(() => x(0)).toBe(100);
		await expect.poll(grandchild).toBe(100);
	}
);
it.each([
	{ method: 'number' as const, perValue: false },
	{ method: 'number' as const, perValue: true },
	{ method: 'function' as const, perValue: false },
	{ method: 'function' as const, perValue: true }
])(
	'variant-delay-tree: $method stagger with perValue=$perValue preserves order through wrappers',
	async (options) => {
		const moves: number[] = [];
		const { component } = render(Fixture, {
			...options,
			onMove: (id, value) => {
				if (value > 0 && !moves.includes(id)) moves.push(id);
			}
		});
		await frames();
		flushSync(() => component.show());
		await expect.poll(() => x(0)).toBe(100);
		expect(x(1)).toBe(0);
		await expect.poll(() => x(1)).toBe(100);
		expect(moves).toEqual([0, 1]);
	}
);
it.each(['number', 'function'] as const)(
	'variant-delay-tree: reverse %s stagger counts only participating descendants',
	async (method) => {
		const moves: number[] = [];
		const { component } = render(Fixture, {
			method,
			reverse: true,
			onMove: (id, value) => {
				if (value > 0 && !moves.includes(id)) moves.push(id);
			}
		});
		await frames();
		flushSync(() => component.add());
		flushSync(() => component.show());
		await expect.poll(() => x(2)).toBe(100);
		expect(x(0)).toBe(0);
		await expect.poll(() => x(0)).toBe(100);
		expect(moves).toEqual([2, 1, 0]);
	}
);
it('variant-late-cohorts: a late cohort starts from inherited initial, staggers distinctly and leaves existing children settled', async () => {
	const moves: number[] = [];
	let laterAtFirstComplete: number[] | undefined;
	const { component } = render(Fixture, {
		scenario: 'cohort',
		onMove: (id, value) => {
			if (value > 0 && !moves.includes(id)) moves.push(id);
			if (id === 2 && value === 100 && !laterAtFirstComplete) laterAtFirstComplete = [x(3), x(4)];
		}
	});
	await frames();
	flushSync(() => component.show());
	await expect.poll(() => x(1)).toBe(100);
	moves.length = 0;
	flushSync(() => component.add(3));
	expect([x(2), x(3), x(4)]).toEqual([0, 0, 0]);
	await expect.poll(() => laterAtFirstComplete).toBeDefined();
	expect(laterAtFirstComplete).toEqual([0, 0]);
	expect([x(0), x(1)]).toEqual([100, 100]);
	await expect.poll(() => x(4)).toBe(100);
	expect(moves).toEqual([2, 3, 4]);
});
it('variant-late-cohorts: asynchronous child insertion during a parent animation retains its entrance', async () => {
	const { component } = render(Fixture, { scenario: 'late' });
	await frames();
	flushSync(() => component.show());
	const parent = document.querySelector('[data-upstream-orchestration="parent"]')!;
	await expect.poll(() => Number(getComputedStyle(parent).opacity)).toBeGreaterThan(0.2);
	expect(Number(getComputedStyle(parent).opacity)).toBeLessThan(1);
	await Promise.resolve();
	flushSync(() => component.add());
	expect(x(2)).toBe(0);
	await expect.poll(() => x(2)).toBeGreaterThan(0);
	await expect.poll(() => x(2)).toBe(100);
});
it('variant-late-cohorts: after Activity reveal a later child has no obsolete cohort delay', async () => {
	const { component } = render(Fixture, { scenario: 'activity' });
	await frames();
	flushSync(() => component.activity('hidden'));
	await frames();
	flushSync(() => component.show());
	flushSync(() => component.activity('visible'));
	await expect.poll(() => x(1)).toBe(100);
	flushSync(() => component.add());
	expect(x(2)).toBe(0);
	// An independently entering control provides a frame-relative deadline.
	const reference = () =>
		new DOMMatrix(
			getComputedStyle(document.querySelector('[data-upstream-orchestration="late-control"]')!)
				.transform
		).m41;
	await expect.poll(reference, { interval: 10 }).toBe(100);
	expect(x(2)).toBeCloseTo(100, 2);
});
