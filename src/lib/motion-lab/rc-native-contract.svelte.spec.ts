import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './RCNativeContract.svelte';
const nodes = () =>
	['native', 'component'].map((name) => document.querySelector<HTMLElement>(`[data-rc-${name}]`)!);
const x = (node: HTMLElement) => new DOMMatrix(getComputedStyle(node).transform).m41;
it('shares nested reactive targets, callbacks, reduced motion, exit retention and reversal', async () => {
	const { component } = render(Fixture);
	await expect.poll(() => nodes().map(x)).toEqual([80, 80]);
	await expect.poll(() => Object.values(component.counts())).toEqual([1, 1]);
	flushSync(() => component.setTarget(120));
	await expect.poll(() => nodes().map(x)).toEqual([120, 120]);
	flushSync(() => component.reduce());
	await expect.poll(() => nodes().map(x)).toEqual([160, 160]);
	const identity = nodes();
	flushSync(() => component.setShown(false));
	expect(identity.every((node) => node.isConnected)).toBe(true);
	flushSync(() => component.setShown(true));
	await expect
		.poll(() => nodes().map((node) => Number(getComputedStyle(node).opacity)))
		.toEqual([1, 1]);
	expect(nodes()).toEqual(identity);
	flushSync(() => component.setShown(false));
	await expect.poll(() => identity.some((node) => node.isConnected)).toBe(false);
});
