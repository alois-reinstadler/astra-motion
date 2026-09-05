import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { visualElementStore } from 'motion-dom';
import { tick } from 'svelte';
import InitialFalse from './InitialFalse.svelte';

it('initial:false keeps the final keyframe throughout first client appearance', async () => {
	await render(InitialFalse);
	const node = document.querySelector<HTMLElement>('[data-testid="initial-false"]')!;
	const samples: number[] = [];
	for (let i = 0; i < 12; i++) {
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		samples.push(new DOMMatrix(getComputedStyle(node).transform).m41);
	}
	expect(
		samples.every((value) => value === 80),
		JSON.stringify(samples)
	).toBe(true);
});

const frame = async () => {
	await tick();
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};
const state = () =>
	visualElementStore.get(document.querySelector<HTMLElement>('[data-testid="initial-false"]')!)!;

it('imperative animation respects live reduced motion', async () => {
	const screen = render(InitialFalse);
	await frame();
	screen.component.reduce();
	await frame();
	await screen.component.run();
	expect(state().getValue('x')!.get()).toBe(160);
	expect(state().getValue('x')!.isAnimating()).toBe(false);
});

it('imperative animation rejects replacing a retained exit', async () => {
	const screen = render(InitialFalse);
	await frame();
	screen.component.hide();
	await frame();
	await expect(screen.component.run()).rejects.toThrow('retained exit');
});

it('stop cancels the native intro sampler and imperative animation can replace it', async () => {
	const screen = render(InitialFalse, { props: { intro: true } });
	await expect.poll(() => state().getValue('x')).toBeDefined();
	await frame();
	screen.component.stop();
	const stopped = state().getValue('x')!.get();
	for (let i = 0; i < 4; i++) await frame();
	expect(state().getValue('x')!.get()).toBe(stopped);
	await screen.component.run();
	expect(state().getValue('x')!.get()).toBe(160);
	for (let i = 0; i < 4; i++) await frame();
	expect(state().getValue('x')!.get()).toBe(160);
});
