// Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion.
import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { MotionOptions } from '../motion/index.js';
import Fixture from './UpstreamTransformTemplate.svelte';
const node = () => document.querySelector<HTMLElement>('[data-upstream-target]')!;
const matrix = () => new DOMMatrix(getComputedStyle(node()).transform);
it('transform-template: initializes, animates and reactively replaces the template', async () => {
	const template: MotionOptions['transformTemplate'] = ({ x }, generated) =>
		`translateY(${x}) ${generated}`;
	const { component } = render(Fixture, {
		options: { initial: { x: 10 }, transformTemplate: template }
	});
	expect([matrix().m41, matrix().m42]).toEqual([10, 10]);
	flushSync(() =>
		component.set({ animate: { x: 30 }, transition: { duration: 0.4, ease: 'linear' } })
	);
	await expect.poll(() => matrix().m41).toBeGreaterThan(10);
	expect(matrix().m41).toBeLessThan(30);
	expect(matrix().m42).toBeCloseTo(matrix().m41, 3);
	await expect.poll(() => [matrix().m41, matrix().m42]).toEqual([30, 30]);
	flushSync(() =>
		component.set({
			transformTemplate: ({ x }, generated) =>
				`translateY(${parseFloat(String(x)) * 2}px) ${generated}`
		})
	);
	await expect.poll(() => [matrix().m41, matrix().m42]).toEqual([30, 60]);
});
it.each(['changed', 'unchanged', 'absent'] as const)(
	'transform-template: removing template restores %s transforms',
	async (mode) => {
		const { component } = render(Fixture, {
			options: {
				style: mode === 'absent' ? {} : { x: 10 },
				transformTemplate: () => 'translateY(20px)'
			}
		});
		expect(matrix().m42).toBe(20);
		flushSync(() =>
			component.set({
				transformTemplate: undefined,
				style: mode === 'absent' ? {} : { x: mode === 'changed' ? 20 : 10 }
			})
		);
		await expect
			.poll(() => [matrix().m41, matrix().m42])
			.toEqual([mode === 'absent' ? 0 : mode === 'changed' ? 20 : 10, 0]);
	}
);
it('transform-template: composes a template with style-based transform', () => {
	render(Fixture, {
		options: {
			style: { x: 10 },
			transformTemplate: (_, generated) => `translateY(20px) ${generated}`
		}
	});
	expect([matrix().m41, matrix().m42]).toEqual([10, 20]);
});
