import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import { visualElementStore, type HTMLVisualElement } from 'motion-dom';
import { createLayout } from '../motion/layout.js';
import { createPresenceTimeline } from '../motion/presence-state.js';
import PresenceStateSpike from './PresenceStateSpike.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const frames = async () => {
	await frame();
	await frame();
};
const microtasks = async () => {
	for (let i = 0; i < 12; i++) await Promise.resolve();
};
async function participant() {
	const node = document.createElement('div');
	node.style.cssText = 'width:100px;height:100px';
	document.body.append(node);
	const cleanup = createLayout({ automatic: false })()(node);
	await microtasks();
	await frames();
	const visual = visualElementStore.get(node) as HTMLVisualElement;
	return {
		node,
		visual,
		cleanup: async () => {
			cleanup?.();
			node.remove();
			await microtasks();
		}
	};
}

it('applies transitionEnd at its own end while the native clock retains child exits', async () => {
	const { visual, cleanup } = await participant();
	try {
		visual.getValue('opacity', 1).jump(1);
		const complete = vi.fn();
		const timeline = createPresenceTimeline(
			visual,
			{ opacity: 1 },
			{ opacity: 0.5, transitionEnd: { visibility: 'hidden' } },
			{ duration: 0.2, ease: 'linear' },
			'out',
			{ complete },
			undefined,
			true
		);
		timeline.schedule(0, 1000);
		timeline.tick!(1, 0);
		timeline.tick!(0.7, 0.3);
		expect(visual.getValue('visibility')?.get()).toBe('hidden');
		expect(visual.getValue('opacity')?.get()).toBe(0.5);
		expect(complete).not.toHaveBeenCalled();
		timeline.tick!(0, 1);
		expect(complete).toHaveBeenCalledOnce();
	} finally {
		await cleanup();
	}
});

it('normalizes asymmetric reversal from its current pose and suppresses replaced completion', async () => {
	const { visual, cleanup } = await participant();
	try {
		visual.getValue('scale', 0.5).jump(0.5);
		const complete = vi.fn();
		const intro = createPresenceTimeline(
			visual,
			{ scale: 0.5 },
			{ scale: 1 },
			{ duration: 1, ease: 'linear' },
			'in',
			{ complete }
		);
		intro.tick!(0, 1);
		intro.tick!(0.4, 0.6);
		expect(visual.getValue('scale')!.get()).toBeCloseTo(0.7, 5);
		intro.cancel();
		const exit = createPresenceTimeline(
			visual,
			{ ...visual.latestValues },
			{ scale: 0.85 },
			{ duration: 0.5, ease: 'linear' },
			'out',
			{},
			intro.progress
		);
		expect(exit.duration).toBe(1250);
		exit.tick!(0.4, 0.6);
		expect(visual.getValue('scale')!.get()).toBeCloseTo(0.7, 5);
		exit.tick!(0.2, 0.8);
		expect(visual.getValue('scale')!.get()).toBeCloseTo(0.775, 5);
		intro.tick!(1, 0);
		expect(complete).not.toHaveBeenCalled();
		exit.tick!(0, 1);
		expect(visual.getValue('scale')!.get()).toBe(0.85);
	} finally {
		await cleanup();
	}
});

it('samples colors, keyframes, per-property delay, and transitionEnd with Motion interpolation', async () => {
	const { visual, cleanup } = await participant();
	try {
		visual.getValue('opacity', 0).jump(0);
		visual.getValue('backgroundColor', '#000000').jump('#000000');
		const timeline = createPresenceTimeline(
			visual,
			{ ...visual.latestValues },
			{
				opacity: [null, 0.5, 1],
				backgroundColor: '#ffffff',
				transitionEnd: { visibility: 'hidden' }
			},
			{
				duration: 0.4,
				ease: 'linear',
				opacity: { delay: 0.2, duration: 0.4, ease: 'linear' },
				backgroundColor: { duration: 0.4, ease: 'linear' }
			},
			'in'
		);
		expect(timeline.duration).toBeCloseTo(600, 5);
		timeline.tick!(0, 1);
		timeline.tick!(1 / 6, 5 / 6);
		expect(visual.getValue('opacity')!.get()).toBe(0);
		expect(visual.getValue('backgroundColor')!.get()).not.toBe('#000000');
		timeline.tick!(2 / 3, 1 / 3);
		expect(Number(visual.getValue('opacity')!.get())).toBeCloseTo(0.5, 5);
		timeline.tick!(1, 0);
		expect(visual.getValue('backgroundColor')!.get()).toBe('#ffffff');
		expect(visual.getValue('visibility')!.get()).toBe('hidden');
	} finally {
		await cleanup();
	}
});

it('settles finite springs, applies zero-duration targets without tick, and rejects repeating exits', async () => {
	const { visual, cleanup } = await participant();
	try {
		visual.getValue('scale', 1).jump(1);
		const spring = createPresenceTimeline(
			visual,
			{ scale: 1 },
			{ scale: 0.8 },
			{ type: 'spring', stiffness: 420, damping: 38 },
			'out'
		);
		expect(spring.duration).toBeGreaterThan(0);
		expect(spring.duration).toBeLessThan(2000);
		spring.tick!(1, 0);
		spring.tick!(0.5, 0.5);
		expect(Number(visual.getValue('scale')!.get())).toBeLessThan(1);
		spring.finish();
		expect(spring.progress).toBe(0);
		spring.tick!(0.8, 0.2);
		expect(visual.getValue('scale')!.get()).toBe(0.8);
		const complete = vi.fn();
		createPresenceTimeline(visual, { scale: 0.8 }, { scale: 1 }, { duration: 0 }, 'in', {
			complete
		});
		expect(visual.getValue('scale')!.get()).toBe(1);
		expect(complete).toHaveBeenCalledOnce();
		expect(() =>
			createPresenceTimeline(visual, { scale: 1 }, { scale: 0 }, { repeat: Infinity }, 'out')
		).toThrow('repeated');
	} finally {
		await cleanup();
	}
});

it('reverses asymmetric native Svelte transitions repeatedly while layout remains active', async () => {
	const screen = render(PresenceStateSpike);
	await screen.getByRole('button', { name: 'Toggle asymmetric' }).click();
	const node = screen.getByTestId('presence-state').element() as HTMLElement;
	await frames();
	await screen.getByRole('button', { name: 'Move asymmetric' }).click();
	const visual = visualElementStore.get(node)!;
	for (let index = 0; index < 6; index++) {
		const before = Number(visual.getValue('scale')!.get());
		flushSync(() =>
			(
				screen.getByRole('button', { name: 'Toggle asymmetric' }).element() as HTMLButtonElement
			).click()
		);
		await microtasks();
		expect(node.isConnected).toBe(true);
		expect(Math.abs(Number(visual.getValue('scale')!.get()) - before)).toBeLessThan(0.001);
		await frames();
	}
	await expect.poll(() => Number(visual.getValue('scale')!.get())).toBeCloseTo(1, 3);
	await screen.getByRole('button', { name: 'Toggle asymmetric' }).click();
	await expect.poll(() => node.isConnected).toBe(false);
});

it('reads the exact previous native clock lazily when Svelte starts a reversed timeline', async () => {
	const { visual, cleanup } = await participant();
	try {
		visual.getValue('scale', 0.5).jump(0.5);
		const intro = createPresenceTimeline(
			visual,
			{ scale: 0.5 },
			{ scale: 1 },
			{ duration: 1, ease: 'linear' },
			'in'
		);
		intro.tick!(0, 1);
		intro.easing!(0.4);
		intro.tick!(0.4, 0.6);
		intro.cancel();
		const exit = createPresenceTimeline(
			visual,
			{ ...visual.latestValues },
			{ scale: 0.85 },
			{ duration: 0.5, ease: 'linear' },
			'out',
			{},
			() => intro.progress
		);
		expect(exit.duration).toBeCloseTo(1250, 5);
		// Svelte reads counterpart.t() after its deferred setup/delay, before duration.
		intro.easing!(0.45);
		expect(intro.progress).toBeCloseTo(0.45, 5);
		expect(Number(exit.duration) * intro.progress).toBeCloseTo(500, 5);
		// Its first real tick has already consumed 20% of the new timeline.
		exit.easing!(0.2);
		exit.tick!(0.36, 0.64);
		expect(visual.getValue('scale')!.get()).toBeCloseTo(0.73, 5);
		exit.finish();
	} finally {
		await cleanup();
	}
});

it('does not retain unchanged scalar targets for an invisible no-op intro', async () => {
	const { visual, cleanup } = await participant();
	try {
		visual.getValue('opacity', 1).jump(1);
		visual.getValue('scale', 1).jump(1);
		const complete = vi.fn();
		const timeline = createPresenceTimeline(
			visual,
			{ opacity: 1, scale: 1 },
			{ opacity: 1, scale: 1 },
			{ duration: 1 },
			'in',
			{ complete }
		);
		expect(timeline.duration).toBe(0);
		expect(complete).toHaveBeenCalledOnce();
	} finally {
		await cleanup();
	}
});
