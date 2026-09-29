import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import StateExample from '../site/examples/StateExample.svelte';

const frames = async (count = 4) => {
	for (let i = 0; i < count; i++)
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};
const pose = (node: HTMLElement) => {
	const style = getComputedStyle(node);
	const matrix = new DOMMatrix(style.transform);
	return { opacity: Number(style.opacity), y: matrix.f, scale: matrix.a };
};

for (const repetitions of [1, 5]) {
	it(`restores the same notification after ${repetitions} interrupted exits and still removes it on dismissal`, async () => {
		await render(StateExample);
		const node = document.querySelector<HTMLElement>('.notification')!;
		const button = document.querySelector<HTMLButtonElement>('.state-example button')!;
		await expect.poll(() => pose(node).opacity).toBeCloseTo(1, 3);
		for (let i = 0; i < repetitions; i++) {
			flushSync(() => button.click());
			await frames();
			const exiting = pose(node);
			expect(exiting.opacity).toBeLessThan(0.99);
			flushSync(() => button.click());
			expect(document.querySelector('.notification')).toBe(node);
			await frames(1);
			expect(Math.abs(pose(node).opacity - exiting.opacity)).toBeLessThan(0.2);
		}
		await expect.poll(() => pose(node).opacity).toBeCloseTo(1, 3);
		await expect.poll(() => pose(node).y).toBeCloseTo(0, 2);
		await expect.poll(() => pose(node).scale).toBeCloseTo(1, 3);
		expect(node.inert).toBe(false);
		expect(button.getAttribute('aria-pressed')).toBe('true');
		flushSync(() => button.click());
		await expect.poll(() => node.isConnected).toBe(false);
		flushSync(() => button.click());
		await expect.poll(() => document.querySelector('.notification')).not.toBeNull();
		const replacement = document.querySelector<HTMLElement>('.notification')!;
		expect(replacement).not.toBe(node);
		await expect.poll(() => pose(replacement).opacity).toBeCloseTo(1, 3);
	});
}
