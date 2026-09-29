// Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion.
import { flushSync } from 'svelte';
import { expect, it, vi, onTestFinished } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { motionValue } from '../motion/index.js';
import Fixture from './UpstreamAnimationEvents.svelte';
const node = () => document.querySelector<HTMLElement>('[data-upstream-event="parent"]')!;
const frames = async (count = 3) => {
	for (let i = 0; i < count; i++) await new Promise<void>((r) => requestAnimationFrame(() => r()));
};
it('animation-callbacks: object targets emit one definition and final updates, unchanged targets stay quiet', async () => {
	const start = vi.fn(),
		complete = vi.fn(),
		update = vi.fn();
	const target = { x: 40, y: 20 };
	const { component } = render(Fixture, {
		options: {
			initial: { x: 0, y: 0 },
			animate: target,
			transition: { duration: 0.08 },
			onAnimationStart: start,
			onAnimationComplete: complete,
			onUpdate: update
		}
	});
	await expect.poll(() => complete.mock.calls.length).toBe(1);
	await frames();
	expect(start.mock.calls.map((call) => call[0])).toEqual([target]);
	expect(complete.mock.calls.map((call) => call[0])).toEqual([target]);
	expect(update.mock.lastCall?.[0]).toMatchObject(target);
	const count = update.mock.calls.length;
	flushSync(() => component.set({ animate: { ...target } }));
	await frames();
	expect(update).toHaveBeenCalledTimes(count);
	expect(complete).toHaveBeenCalledTimes(1);
});
it('animation-callbacks: inherited children receive parent labels at start and completion', async () => {
	const start = vi.fn(),
		complete = vi.fn();
	render(Fixture, {
		child: true,
		childStart: start,
		childComplete: complete,
		options: { initial: 'hidden', animate: 'visible' }
	});
	await expect.poll(() => complete.mock.calls.length).toBeGreaterThan(0);
	expect(start.mock.calls.length).toBeGreaterThan(0);
	expect(start.mock.calls.every((call) => call[0] === 'visible')).toBe(true);
	expect(complete.mock.calls.every((call) => call[0] === 'visible')).toBe(true);
	await expect
		.poll(
			() =>
				new DOMMatrix(
					getComputedStyle(document.querySelector('[data-upstream-event="child"]')!).transform
				).m41
		)
		.toBe(80);
});
it.each([false, 'settled'] as const)(
	'initial-transitionend: initial=%s applies terminal styles without completion',
	async (initial) => {
		const complete = vi.fn();
		const settled = { x: 20, y: 20, transitionEnd: { x: 10, z: 20 } };
		render(Fixture, {
			options: {
				initial,
				animate: initial === false ? settled : undefined,
				variants: { settled },
				onAnimationComplete: complete
			}
		});
		await frames();
		const matrix = new DOMMatrix(getComputedStyle(node()).transform);
		expect([matrix.m41, matrix.m42, matrix.m43]).toEqual([10, 20, 20]);
		expect(complete).not.toHaveBeenCalled();
	}
);
it.each([0, [0, 0]])(
	'target-noop: unchanged target %j emits no motion but different keyframes move',
	async (target) => {
		const update = vi.fn();
		const value = motionValue(0);
		onTestFinished(() => value.destroy());
		const { component } = render(Fixture, {
			options: {
				initial: { x: 0 },
				animate: { x: target },
				transition: { duration: 0.2 },
				style: { x: value, willChange: 'transform' },
				onUpdate: update
			}
		});
		await frames(5);
		expect(update.mock.calls.every(([value]) => value.x === 0)).toBe(true);
		expect(value.isAnimating()).toBe(false);
		update.mockClear();
		flushSync(() => component.set({ animate: { x: [0, 40, 0] } }));
		await expect.poll(() => update.mock.calls.some(([value]) => value.x > 0)).toBe(true);
		await expect.poll(() => new DOMMatrix(getComputedStyle(node()).transform).m41).toBe(0);
	}
);
it('target-noop: nonzero spring velocity moves despite equal endpoints', async () => {
	const update = vi.fn();
	render(Fixture, {
		options: {
			initial: { x: 0 },
			animate: { x: 0 },
			transition: { type: 'spring', velocity: 300, stiffness: 150, damping: 18 },
			onUpdate: update
		}
	});
	await expect.poll(() => update.mock.calls.some(([value]) => Math.abs(value.x) > 1)).toBe(true);
	await expect
		.poll(() => Math.abs(new DOMMatrix(getComputedStyle(node()).transform).m41))
		.toBeLessThan(0.01);
});
it('target-noop: external MotionValue updates stay singular after rerenders and detach on unmount', async () => {
	const x = motionValue(0),
		update = vi.fn();
	const { component, unmount } = render(Fixture, { options: { style: { x }, onUpdate: update } });
	try {
		await frames();
		for (let i = 0; i < 3; i++) flushSync(() => component.set({ style: { x }, onUpdate: update }));
		await frames();
		update.mockClear();
		x.set(35);
		await frames();
		expect(update.mock.calls.map(([value]) => value.x)).toEqual([35]);
		const element = node();
		expect(new DOMMatrix(getComputedStyle(element).transform).m41).toBe(35);
		await unmount();
		update.mockClear();
		const before = element.style.transform;
		x.set(70);
		await frames();
		expect(update).not.toHaveBeenCalled();
		expect(element.style.transform).toBe(before);
	} finally {
		x.destroy();
	}
});
