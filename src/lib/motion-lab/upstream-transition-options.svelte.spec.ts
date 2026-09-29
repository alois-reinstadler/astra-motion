// Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion.
import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { frameData, time } from 'motion-dom';
import { MotionGlobalConfig } from 'motion-utils';
import type { MotionOptions, Transition } from '../motion/index.js';
import Fixture from './UpstreamTransitionOptions.svelte';
const node = () => document.querySelector<HTMLElement>('[data-upstream-target]')!;
const x = () => new DOMMatrix(getComputedStyle(node()).transform).m41;
const frames = async () => {
	for (let i = 0; i < 3; i++) await new Promise<void>((r) => requestAnimationFrame(() => r()));
};
it.each(['base', 'default', 'variant'] as const)(
	'transition-options: %s fallback preserves value-specific from/ease',
	async (kind) => {
		const transition: Transition = {
			...(kind === 'default' ? { default: { type: false } } : { type: false }),
			x: { type: 'tween', from: 10, duration: 10, ease: () => 0.5 }
		};
		const options: MotionOptions = {
			initial: { x: 100, opacity: 0 },
			animate: kind === 'variant' ? 'visible' : { x: 20, opacity: 1 },
			variants: { visible: { x: 20, opacity: 1, transition } },
			transition
		};
		render(Fixture, { options });
		await expect.poll(x).toBeCloseTo(15, 2);
		expect(Number(getComputedStyle(node()).opacity)).toBe(1);
	}
);
it('transition-options: latest transition and transitionEnd override earlier targets and zero beats defaults', async () => {
	const { component } = render(Fixture, {
		options: { initial: { x: 0 }, animate: { x: 10 }, transition: { duration: 10 } }
	});
	await frames();
	expect(x()).toBeLessThan(10);
	for (const value of [20, 30]) {
		flushSync(() =>
			component.set({
				animate: { x: value, transition: { duration: 0 }, transitionEnd: { x: value * 10 } }
			})
		);
		await expect.poll(x).toBe(value * 10);
	}
});
it.each(['transition', 'value-instant', 'value-tween', 'target', 'variant'] as const)(
	'transition-delay: %s holds origin and then reaches target',
	async (kind) => {
		const delay = 0.3;
		const delayed: Transition = { delay, type: false };
		const options: MotionOptions = { initial: { x: 0 }, animate: { x: 40 }, transition: delayed };
		if (kind === 'value-instant') options.transition = { x: delayed };
		if (kind === 'value-tween')
			options.transition = { x: { delay, duration: 0.05, ease: 'linear' } };
		if (kind === 'target') {
			options.transition = undefined;
			options.animate = { x: 40, transition: delayed };
		}
		if (kind === 'variant') {
			options.transition = undefined;
			options.animate = 'show';
			options.variants = { show: { x: 40, transition: delayed } };
		}
		const previousManualTiming = MotionGlobalConfig.useManualTiming;
		const previousTimestamp = frameData.timestamp;
		const startedAt = performance.now();
		MotionGlobalConfig.useManualTiming = true;
		frameData.timestamp = startedAt;
		time.set(startedAt);
		let screen: ReturnType<typeof render<typeof Fixture>> | undefined;
		try {
			screen = render(Fixture, { options });
			await frames();
			expect(x()).toBe(0);
			// Drive Motion's actual delay clock, independently of how long the
			// browser takes to return these frames to the test runner.
			frameData.timestamp = startedAt + delay * 1000 - 1;
			time.set(frameData.timestamp);
			await frames();
			expect(x()).toBe(0);
			if (kind === 'value-tween') {
				frameData.timestamp = startedAt + delay * 1000 + 25;
				time.set(frameData.timestamp);
				await frames();
				expect(x()).toBeGreaterThan(0);
				expect(x()).toBeLessThan(40);
			}
			frameData.timestamp = startedAt + delay * 1000 + 100;
			time.set(frameData.timestamp);
			await frames();
			await expect.poll(x).toBe(40);
		} finally {
			try {
				await screen?.unmount();
			} finally {
				MotionGlobalConfig.useManualTiming = previousManualTiming;
				frameData.timestamp = previousManualTiming ? previousTimestamp : performance.now();
				time.set(frameData.timestamp);
			}
		}
	}
);
