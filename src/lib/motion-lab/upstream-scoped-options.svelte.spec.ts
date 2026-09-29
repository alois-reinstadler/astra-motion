// Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion.
import { tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { motionValue, stagger } from '../motion/index.js';
import Fixture from './UpstreamScopedOptions.svelte';
const node = (name = 'first') =>
	document.querySelector<HTMLElement>(`[data-upstream-option="${name}"]`)!;
const opacity = (name = 'first') => Number(getComputedStyle(node(name)).opacity);
const frames = async (count = 3) => {
	for (let i = 0; i < count; i++) await new Promise<void>((r) => requestAnimationFrame(() => r()));
};
it.each(['hybrid', 'mini'] as const)(
	'scoped-options: %s per-value duration and stagger preserve independent intermediate states',
	async (kind) => {
		const { component } = render(Fixture);
		await tick();
		const api = component.api();
		const animate = kind === 'mini' ? api.mini : api.animate;
		const first = node(kind === 'mini' ? 'mini' : 'first'),
			second = node(kind === 'mini' ? 'mini-second' : 'second');
		const paint = (el: Element) => Number(getComputedStyle(el).opacity);
		const run = animate(
			first,
			{ opacity: [1, 0], width: ['20px', '100px'] },
			{ duration: 1, width: { duration: 2, ease: 'linear' }, autoplay: false, ease: 'linear' }
		);
		run.pause();
		run.time = 1;
		await frames();
		expect(paint(first)).toBe(0);
		expect(parseFloat(getComputedStyle(first).width)).toBeCloseTo(60, 1);
		run.complete();
		await run;
		const targets = [first, second];
		targets.forEach((el) => {
			el.style.opacity = '0';
		});
		const group = animate(
			targets,
			{ opacity: [0, 1] },
			{ duration: 0.1, delay: stagger(0.4), ease: 'linear' }
		);
		await expect.poll(() => paint(first)).toBe(1);
		expect(paint(second)).toBe(0);
		await group;
		expect(paint(second)).toBe(1);
	}
);
it('scoped-options: no-op plus animated values and sequences each complete exactly once', async () => {
	const { component } = render(Fixture);
	await tick();
	const { animate } = component.api();
	const complete = vi.fn();
	await animate(node(), { opacity: 1, width: 50 }, { duration: 0.05, onComplete: complete });
	await frames();
	expect(complete).toHaveBeenCalledOnce();
	expect(parseFloat(node().style.width)).toBe(50);
	complete.mockClear();
	await animate(
		[
			[node(), { opacity: 0.5 }, { duration: 0.04 }],
			[node('second'), { opacity: 0.3 }, { duration: 0.04 }]
		],
		{ onComplete: complete }
	);
	await frames();
	expect(complete).toHaveBeenCalledOnce();
	expect([opacity(), opacity('second')]).toEqual([0.5, 0.3]);
});
it('scoped-options: DOM, MotionValue and mini wildcard origins hydrate before interpolation', async () => {
	const { component } = render(Fixture);
	await tick();
	const { animate, mini } = component.api();
	const value = motionValue(40);
	try {
		const valueRun = animate(value, [null, 80], { duration: 1, ease: 'linear', autoplay: false });
		valueRun.time = 0.5;
		await frames();
		expect(value.get()).toBeCloseTo(60, 2);
		valueRun.complete();
		await valueRun;
		node().style.opacity = '0.8';
		const dom = animate(
			node(),
			{ opacity: [null, 0.2] },
			{ duration: 1, ease: 'linear', autoplay: false }
		);
		dom.time = 0.5;
		await frames();
		expect(opacity()).toBeCloseTo(0.5, 2);
		dom.complete();
		await dom;
		const native = mini(
			node('mini'),
			{ opacity: [null, 0.2] },
			{ duration: 1, ease: 'linear', autoplay: false }
		);
		native.time = 0.5;
		await frames();
		expect(opacity('mini')).toBeCloseTo(0.5, 2);
		native.complete();
		await native;
		const explicit = animate(
			node(),
			{ opacity: [0.6, 1] },
			{ duration: 1, ease: 'linear', autoplay: false }
		);
		explicit.time = 0;
		await frames();
		expect(opacity()).toBeCloseTo(0.6, 2);
	} finally {
		value.destroy();
	}
});
it('scoped-options: transitionEnd applies only after completion and custom ease interruption keeps replacement target', async () => {
	const { component } = render(Fixture);
	await tick();
	const { animate } = component.api();
	const first = animate(
		node(),
		{ opacity: [1, 0], transitionEnd: { display: 'none' } },
		{ duration: 1, autoplay: false, ease: () => 0.25 }
	);
	first.time = 0.5;
	await frames();
	expect(opacity()).toBeCloseTo(0.75, 2);
	expect(getComputedStyle(node()).display).not.toBe('none');
	first.complete();
	await first;
	await expect.poll(() => node().style.display).toBe('none');
	node().style.display = 'block';
	const interrupted = animate(node(), { opacity: [0, 1] }, { duration: 1, ease: () => 0.25 });
	await expect.poll(opacity).toBeCloseTo(0.25, 2);
	const replacement = animate(node(), { opacity: 0.4 }, { duration: 0.05, ease: 'linear' });
	expect(opacity()).toBeCloseTo(0.25, 2);
	void interrupted;
	await replacement;
	await frames();
	expect(opacity()).toBeCloseTo(0.4, 3);
	expect(node().style.display).toBe('block');
});
it.each([1, 100])(
	'scoped-callback-sequence: callback receives bounded progress ending at %s',
	async (endpoint) => {
		const { component } = render(Fixture);
		await tick();
		const { animate } = component.api();
		const values: number[] = [];
		const callback = (value: number) => values.push(value);
		const run =
			endpoint === 1
				? animate([
						[node(), { opacity: 0.5 }, { duration: 0.05 }],
						[callback, { duration: 0.1, ease: 'linear' }]
					])
				: animate([
						[node(), { opacity: 0.5 }, { duration: 0.05 }],
						[callback, [0, endpoint], { duration: 0.1, ease: 'linear' }]
					]);
		await run;
		expect(values.length).toBeGreaterThan(1);
		expect(values.every((value) => value >= 0 && value <= endpoint)).toBe(true);
		expect(values.at(-1)).toBe(endpoint);
		expect(values.some((value) => value > 0 && value < endpoint)).toBe(true);
	}
);
it('scoped-callback-sequence: scrubbing a marker invokes do undo do and unmount stops callback writes', async () => {
	const { component, unmount } = render(Fixture);
	await tick();
	const { animate } = component.api();
	const events: string[] = [];
	let active = false;
	const marker = (p: number) => {
		if (p >= 1 && !active) {
			active = true;
			events.push('do');
		} else if (p < 1 && active) {
			active = false;
			events.push('undo');
		}
	};
	const run = animate([
		[node(), { opacity: 0.5 }, { duration: 1 }],
		[marker, { duration: 0 }],
		[node(), { opacity: 1 }, { duration: 1 }]
	]);
	run.pause();
	for (const time of [0.5, 1.5, 0.5, 1.5]) {
		run.time = time;
		await frames();
	}
	expect(events).toEqual(['do', 'undo', 'do']);
	run.stop();
	const update = vi.fn();
	const live = animate([[update, { duration: 10, ease: 'linear' }]]);
	await expect.poll(() => update.mock.calls.length).toBeGreaterThan(0);
	await unmount();
	const count = update.mock.calls.length;
	await frames(5);
	expect(update).toHaveBeenCalledTimes(count);
	expect(() => live.play()).toThrow(/stopped|detached/);
});
