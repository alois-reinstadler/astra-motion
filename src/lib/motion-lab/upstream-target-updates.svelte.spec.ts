// Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion.
import { flushSync } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { MotionOptions } from '../motion/index.js';
import Fixture from './UpstreamTargetUpdates.svelte';
const node = () => document.querySelector<HTMLElement>('[data-upstream-target]')!;
const matrix = () => new DOMMatrix(getComputedStyle(node()).transform);
const frames = async () => {
	for (let i = 0; i < 3; i++) await new Promise<void>((r) => requestAnimationFrame(() => r()));
};
it.each([
	{ initial: { opacity: 0 }, expected: 0 },
	{ initial: { opacity: 0.5 }, expected: 0.5 },
	{ initial: {}, expected: 1 }
])(
	'target-fallback: removed opacity uses current initial $expected',
	async ({ initial, expected }) => {
		const complete = vi.fn();
		const updates = vi.fn();
		const { component } = render(Fixture, {
			options: {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				transition: { type: false },
				onAnimationComplete: complete,
				onUpdate: updates
			}
		});
		await expect.poll(() => node().style.opacity).toBe('1');
		await frames();
		complete.mockClear();
		updates.mockClear();
		flushSync(() => component.set({ initial, animate: {} }));
		await frames();
		expect(Number(getComputedStyle(node()).opacity)).toBe(expected);
		if (expected === 1)
			expect(updates.mock.calls.every(([value]) => value.opacity === 1)).toBe(true);
	}
);
it('target-fallback: removing x restores initial and re-adding it completes while unrelated initial scale remains', async () => {
	const complete = vi.fn();
	const { component } = render(Fixture, {
		options: {
			initial: { x: 0, scale: 0.5 },
			animate: { x: 100 },
			transition: { type: false },
			onAnimationComplete: complete
		}
	});
	await expect.poll(() => matrix().m41).toBe(100);
	expect(matrix().a).toBe(0.5);
	flushSync(() => component.set({ animate: {} }));
	await expect.poll(() => matrix().m41).toBe(0);
	complete.mockClear();
	flushSync(() => component.set({ animate: { x: 100 } }));
	await expect.poll(() => complete.mock.calls.length).toBe(1);
	await expect.poll(() => matrix().m41).toBe(100);
	expect(matrix().a).toBe(0.5);
});
it.each([{ type: false as const }, { duration: 0 }])(
	'target-new-properties: replaces x with previously absent y using %j',
	async (transition) => {
		const { component } = render(Fixture, { options: { animate: { x: 100 }, transition } });
		await expect.poll(() => matrix().m41).toBe(100);
		flushSync(() => component.set({ animate: { y: 80 } }));
		await expect.poll(() => [matrix().m41, matrix().m42]).toEqual([0, 80]);
	}
);
it('target-new-properties: non-pixel keyframes preserve final percentage', async () => {
	render(Fixture, {
		options: {
			initial: { width: '0%' },
			animate: { width: ['0%', '75%'] },
			transition: { duration: 0.08 }
		}
	});
	await expect.poll(() => node().style.width).toBe('75%');
});
it('target-new-properties: times and per-segment easing survive option snapshots', async () => {
	const updates: number[] = [];
	const options: MotionOptions = {
		initial: { x: 0 },
		animate: { x: [0, 40, 100] },
		transition: { duration: 0.3, times: [0, 0.5, 1], ease: [() => 0.25, () => 0.75] },
		onUpdate: (v) => updates.push(Number(v.x))
	};
	render(Fixture, { options });
	await expect.poll(() => updates.some((value) => Math.abs(value - 10) < 0.01)).toBe(true);
	await expect.poll(() => updates.some((value) => Math.abs(value - 85) < 0.01)).toBe(true);
	await expect.poll(() => matrix().m41).toBe(100);
});

it('target-new-properties: coincident explicit times jump over excluded endpoint intervals', async () => {
	const updates: number[] = [];
	render(Fixture, {
		options: {
			animate: { x: [50, 100, 200, 300] },
			transition: { duration: 10, times: [0, 0, 1, 1], ease: () => 0.5 },
			onUpdate: (v) => updates.push(Number(v.x))
		}
	});
	await expect.poll(() => updates.length).toBeGreaterThan(0);
	expect(updates.every((value) => value >= 100 && value <= 200)).toBe(true);
	expect(matrix().m41).toBeCloseTo(150, 2);
});
