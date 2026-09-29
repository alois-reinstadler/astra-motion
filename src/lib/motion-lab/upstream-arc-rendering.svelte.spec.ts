// Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion.
import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamArcRendering.svelte';
const node = () => document.querySelector<HTMLElement>('[data-upstream-arc]')!;
const matrix = () => new DOMMatrix(getComputedStyle(node()).transform);
const frames = async () => {
	for (let i = 0; i < 3; i++) await new Promise<void>((r) => requestAnimationFrame(() => r()));
};
it.each([
	{ enabled: true, distance: 400, bends: true },
	{ enabled: false, distance: 400, bends: false },
	{ enabled: true, distance: 10, bends: false }
])(
	'arc-rotation: layout arc enabled=$enabled distance=$distance selects the correct path',
	async ({ enabled, distance, bends }) => {
		const { component } = render(Fixture, { layout: true, enabled, distance, progress: 0.5 });
		await frames();
		const before = node().getBoundingClientRect();
		flushSync(() => component.move());
		await expect
			.poll(() => node().getBoundingClientRect().left - before.left)
			.toBeCloseTo(distance / 2, 0);
		const offset = node().getBoundingClientRect().top - before.top;
		if (bends) expect(Math.abs(offset)).toBeGreaterThan(100);
		else expect(offset).toBeCloseTo(0, 1);
	}
);
it.each([false, true])(
	'arc-rotation: rotate=%s preserves or adds tangent orientation',
	async (rotate) => {
		const { component } = render(Fixture, { rotate, progress: 0.25 });
		await frames();
		flushSync(() => component.move());
		await expect.poll(() => matrix().m41).toBeGreaterThan(20);
		expect(Math.abs(matrix().m42)).toBeGreaterThan(50);
		const angle = (Math.atan2(matrix().b, matrix().a) * 180) / Math.PI;
		if (rotate) expect(Math.abs(angle)).toBeGreaterThan(5);
		else expect(angle).toBeCloseTo(0, 2);
	}
);
it('arc-rotation: tangent orientation composes with the user rotate animation', async () => {
	const { component } = render(Fixture, { rotate: true, compose: true, progress: 0.5 });
	await frames();
	flushSync(() => component.move());
	await expect.poll(() => matrix().m41).toBeCloseTo(200, 0);
	expect((Math.atan2(matrix().b, matrix().a) * 180) / Math.PI).toBeCloseTo(45, 1);
});
