import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import LiteState from './LiteState.svelte';
import RemountInitial from './RemountInitial.svelte';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

it('uses current initial=false targets on remount without requiring a native transition', async () => {
	const { component } = await render(RemountInitial);
	await frame();
	component.show(false);
	await tick();
	component.change(80);
	component.show(true);
	await tick();
	await frame();
	const node = document.querySelector<HTMLElement>('[data-remount]')!;
	expect(new DOMMatrix(getComputedStyle(node).transform).e).toBe(80);
	component.change(160);
	await expect.poll(() => new DOMMatrix(getComputedStyle(node).transform).e).toBeGreaterThan(90);
	component.rename();
	await tick();
	expect(new DOMMatrix(getComputedStyle(node).transform).e).toBeLessThan(155);
});

it('supports inherited state, native coordinated reversal and cleanup without a projection feature', async () => {
	const { component, unmount } = await render(LiteState);
	await tick();
	await frame();
	await frame();
	const parent = document.querySelector<HTMLElement>('[data-lite="parent"]')!;
	const child = document.querySelector<HTMLElement>('[data-lite="child"]')!;
	component.change();
	await expect.poll(() => new DOMMatrix(getComputedStyle(child).transform).e).toBeCloseTo(80, 1);
	await expect.poll(() => Number(getComputedStyle(parent).opacity)).toBeCloseTo(0.8, 2);
	component.toggle();
	await expect.poll(() => Number(getComputedStyle(child).opacity)).toBeLessThan(0.8);
	expect(Number(getComputedStyle(parent).opacity)).toBeCloseTo(0.8, 2);
	component.toggle();
	await expect.poll(() => Number(getComputedStyle(child).opacity)).toBeCloseTo(1, 2);
	expect(document.querySelector('[data-lite="parent"]')).toBe(parent);
	component.toggle();
	await expect.poll(() => parent.isConnected).toBe(false);
	await unmount();
	expect(child.getAnimations()).toHaveLength(0);
});
