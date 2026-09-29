import { expect, it, onTestFinished } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import { visualElementStore, AsyncMotionValueAnimation } from 'motion-dom';
import IntroRetarget from './IntroRetarget.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const microtasks = async () => {
	for (let i = 0; i < 12; i++) await Promise.resolve();
};
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

it.each(['object', 'custom', 'labels'] as const)(
	'interrupts native intros immediately when %s targets change without a pose jump',
	async (mode) => {
		const screen = render(IntroRetarget, { mode });
		flushSync(() => screen.component.toggle());
		const node = screen.getByTestId('intro-retarget').element() as HTMLElement;
		await frame();
		await frame();
		const visual = visualElementStore.get(node)!;
		const value = visual.getValue('x')!;
		const entry = value.animation;
		expect(entry).toBeInstanceOf(AsyncMotionValueAnimation);
		if (!(entry instanceof AsyncMotionValueAnimation))
			throw new Error('Expected Motion entry playback');
		entry.pause();
		entry.time = 0.3;
		await frame();
		const before = Number(value.get());
		expect(before).toBeLessThan(0);
		flushSync(() => screen.component.retarget());
		await microtasks();
		expect(Number(value.get())).toBeCloseTo(before, 3);
		await expect.poll(() => Number(value.get()), { timeout: 600 }).toBeCloseTo(180, 2);
		expect(new DOMMatrix(getComputedStyle(node).transform).e).toBeCloseTo(180, 2);
	}
);

it('keeps the Motion entry playback when an options getter returns equivalent targets', async () => {
	const screen = render(IntroRetarget);
	flushSync(() => screen.component.toggle());
	await frame();
	await frame();
	const node = screen.getByTestId('intro-retarget').element();
	const value = visualElementStore.get(node)!.getValue('x')!;
	const before = Number(value.get());
	const playback = value.animation;
	expect(playback).toBeDefined();
	flushSync(() => screen.component.refresh());
	await microtasks();
	await frame();
	expect(value.animation).toBe(playback);
	expect(Number(value.get())).toBeGreaterThan(before);
	expect(Number(value.get())).toBeLessThan(0);
});

it('suppresses the cancelled intro ticks and transitionEnd after the old native clock completes', async () => {
	const screen = render(IntroRetarget);
	flushSync(() => screen.component.toggle());
	const node = screen.getByTestId('intro-retarget').element() as HTMLElement;
	await frame();
	await frame();
	flushSync(() => screen.component.retarget());
	await expect
		.poll(() => new DOMMatrix(getComputedStyle(node).transform).e, { timeout: 600 })
		.toBe(180);
	await delay(1300);
	expect(new DOMMatrix(getComputedStyle(node).transform).e).toBe(180);
	expect(Number(getComputedStyle(node).opacity)).toBe(1);
});

it('retains native outro reversal and eventual removal after interrupting an intro', async () => {
	const screen = render(IntroRetarget);
	flushSync(() => screen.component.toggle());
	const node = screen.getByTestId('intro-retarget').element() as HTMLElement;
	await frame();
	await frame();
	flushSync(() => screen.component.retarget());
	await frame();
	await frame();
	const value = visualElementStore.get(node)!.getValue('x')!;
	await expect.poll(() => Number(value.get()), { timeout: 600 }).toBeCloseTo(180, 2);
	const beforeExit = Number(value.get());
	flushSync(() => screen.component.toggle());
	await microtasks();
	expect(node.isConnected).toBe(true);
	expect(Number(value.get())).toBeCloseTo(beforeExit, 3);
	await frame();
	await frame();
	const beforeReentry = Number(value.get());
	flushSync(() => screen.component.toggle());
	await microtasks();
	expect(screen.getByTestId('intro-retarget').element()).toBe(node);
	expect(Number(value.get())).toBeCloseTo(beforeReentry, 3);
	await expect.poll(() => Number(value.get())).toBeCloseTo(180, 2);
	flushSync(() => screen.component.toggle());
	await expect.poll(() => node.isConnected).toBe(false);
});

it('hands a still-running retarget to native exit and reentry without resetting its rendered pose', async () => {
	const replacementDuration = 0.8;
	const screen = render(IntroRetarget, { replacementDuration });
	flushSync(() => screen.component.toggle());
	const node = screen.getByTestId('intro-retarget').element() as HTMLElement;
	const renderedX = () => new DOMMatrix(getComputedStyle(node).transform).e;
	await frame();
	await frame();
	const value = visualElementStore.get(node)!.getValue('x')!;
	let replacement: AsyncMotionValueAnimation<number> | undefined;
	const stop = value.on('animationStart', () => {
		const animation = value.animation;
		if (!(animation instanceof AsyncMotionValueAnimation)) return;
		replacement = animation;
		animation.pause();
	});
	onTestFinished(stop);
	try {
		flushSync(() => screen.component.retarget());
		await expect.poll(() => Boolean(replacement)).toBe(true);
	} finally {
		stop();
	}
	const animation = replacement!;
	animation.time = animation.duration / 2;
	await frame();
	expect(renderedX()).toBeGreaterThan(0);
	expect(renderedX()).toBeLessThan(100);

	let afterExit: number | undefined;
	let reversing = false;
	let finishReentry: () => void;
	const reentered = new Promise<void>((resolve) => (finishReentry = resolve));
	const onIntroEnd = () => {
		if (reversing) finishReentry();
	};
	let observer: MutationObserver;
	const reversal = new Promise<{ before: number; after: number; sameNode: boolean }>(
		(resolve, reject) => {
			observer = new MutationObserver(() => {
				try {
					if (afterExit === undefined || reversing) return;
					if (!node.isConnected) throw new Error('Native exit detached before reversal');
					const before = renderedX();
					if (before >= afterExit) return;
					if (before <= -160) throw new Error('Native exit completed before reversal');
					// Reverse at a rendered partial exit, in this microtask checkpoint.
					// Two awaited frames can outlast the entire 300ms native outro.
					reversing = true;
					observer.disconnect();
					flushSync(() => screen.component.toggle());
					void microtasks()
						.then(() => ({
							before,
							after: renderedX(),
							sameNode: screen.getByTestId('intro-retarget').element() === node
						}))
						.then(resolve, reject);
				} catch (error) {
					reject(error);
				}
			});
		}
	);
	const cleanup = () => {
		observer.disconnect();
		node.removeEventListener('introend', onIntroEnd);
	};
	onTestFinished(cleanup);
	observer!.observe(node, { attributes: true, attributeFilter: ['style'] });
	node.addEventListener('introend', onIntroEnd);
	try {
		// Resume immediately before handoff: this must exercise a running driver,
		// not a paused driver, while keeping the sampled starting pose deterministic.
		animation.play();
		expect(value.animation).toBe(animation);
		expect(animation.state).toBe('running');
		const sampledAt = performance.now();
		const beforeExit = renderedX();
		expect(beforeExit).toBeLessThan(100);
		flushSync(() => screen.component.toggle());
		await microtasks();
		expect(node.isConnected).toBe(true);
		afterExit = renderedX();
		// Stopping Motion samples playback between rendered frames. Allow that small
		// linear advancement, but reject resetting to initial, animate, or exit poses.
		const speed = 280 / replacementDuration;
		const samplingAllowance = 20 + (speed * (performance.now() - sampledAt)) / 1000;
		expect(Math.abs(afterExit - beforeExit)).toBeLessThan(samplingAllowance);
		const reversed = await reversal;
		expect(reversed.before).toBeLessThan(afterExit);
		expect(reversed.before).toBeGreaterThan(-160);
		expect(reversed.sameNode).toBe(true);
		expect(reversed.after).toBeCloseTo(reversed.before, 1);
		await reentered;
		await expect.poll(renderedX).toBeCloseTo(180, 2);
		// Preserve the original stale-clock check: the cancelled intro lasts 1.2s,
		// longer than the 800ms replacement/reentry; its transitionEnd must not win.
		await delay(400);
		expect(renderedX()).toBeCloseTo(180, 2);
		expect(Number(getComputedStyle(node).opacity)).toBe(1);
		flushSync(() => screen.component.toggle());
		await expect.poll(() => node.isConnected).toBe(false);
	} finally {
		cleanup();
	}
});
