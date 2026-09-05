import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import { visualElementStore } from 'motion-dom';
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
		const before = Number(value.get());
		expect(before).toBeLessThan(0);
		flushSync(() => screen.component.retarget());
		await microtasks();
		expect(Number(value.get())).toBeCloseTo(before, 3);
		await expect.poll(() => Number(value.get()), { timeout: 600 }).toBeCloseTo(180, 2);
		expect(new DOMMatrix(getComputedStyle(node).transform).e).toBeCloseTo(180, 2);
	}
);

it('does not replace the native intro when an options getter returns equivalent targets', async () => {
	const screen = render(IntroRetarget);
	flushSync(() => screen.component.toggle());
	await frame();
	await frame();
	const node = screen.getByTestId('intro-retarget').element();
	const value = visualElementStore.get(node)!.getValue('x')!;
	const before = Number(value.get());
	flushSync(() => screen.component.refresh());
	await microtasks();
	await frame();
	expect(value.animation).toBeUndefined();
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
	flushSync(() => screen.component.retarget());
	await expect.poll(renderedX, { interval: 10, timeout: 700 }).toBeGreaterThan(0);
	const value = visualElementStore.get(node)!.getValue('x')!;
	expect(value.animation?.state).toBe('running');
	const sampledAt = performance.now();
	const beforeExit = renderedX();
	expect(beforeExit).toBeLessThan(100);
	flushSync(() => screen.component.toggle());
	await microtasks();
	expect(node.isConnected).toBe(true);
	const afterExit = renderedX();
	// Stopping Motion samples playback between rendered frames. Allow that small
	// linear advancement, but reject resetting to initial, animate, or exit poses.
	const speed = 280 / replacementDuration;
	const samplingAllowance = 20 + (speed * (performance.now() - sampledAt)) / 1000;
	expect(Math.abs(afterExit - beforeExit)).toBeLessThan(samplingAllowance);
	await frame();
	await frame();
	const beforeReentry = renderedX();
	expect(beforeReentry).toBeLessThan(afterExit);
	flushSync(() => screen.component.toggle());
	await microtasks();
	expect(screen.getByTestId('intro-retarget').element()).toBe(node);
	expect(renderedX()).toBeCloseTo(beforeReentry, 1);
	await expect.poll(renderedX).toBeCloseTo(180, 2);
	await delay(400);
	expect(renderedX()).toBeCloseTo(180, 2);
	expect(Number(getComputedStyle(node).opacity)).toBe(1);
	flushSync(() => screen.component.toggle());
	await expect.poll(() => node.isConnected).toBe(false);
});
