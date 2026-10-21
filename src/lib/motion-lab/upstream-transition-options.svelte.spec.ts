// Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion.
import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import {
	visualElementStore,
	AsyncMotionValueAnimation,
	type AnimationPlaybackControls
} from 'motion-dom';
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
		const screen = render(Fixture, { options: { ...options, animate: { x: 0 } } });
		await frames();
		const value = visualElementStore.get(node())!.getValue('x')!;
		let playback: AnimationPlaybackControls | undefined;
		const stop = value.on('animationStart', () => {
			const animation = value.animation;
			if (!(animation instanceof AsyncMotionValueAnimation))
				throw new Error('Expected the transform animation playback');
			playback = animation;
			playback!.pause();
			playback!.time = 0;
		});
		try {
			flushSync(() => screen.component.set(options));
			await frames();
			expect(playback).toBeDefined();
			stop();
			expect(x()).toBe(0);
			// Seek the real playback, including its delay. A global JS frame clock
			// cannot advance the compositor clock used by ordinary 14.5 transforms.
			playback!.time = delay - 0.001;
			await frames();
			expect(x()).toBe(0);
			if (kind === 'value-tween') {
				playback!.time = delay + 0.025;
				await frames();
				expect(x()).toBeCloseTo(20, 2);
			}
			playback!.time = delay + 0.1;
			await frames();
			expect(x()).toBe(40);
		} finally {
			stop();
			await screen.unmount();
		}
	}
);
