import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import StyleComposition from './StyleComposition.svelte';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

it('preserves the current projection and native paint effect when application style props change', async () => {
	const screen = render(StyleComposition);
	await frame();
	await frame();
	const node = document.querySelector<HTMLElement>('[data-style-composition]')!;
	screen.component.resize();
	await expect.poll(() => node.getBoundingClientRect().width).toBeGreaterThan(210);
	const before = node.getBoundingClientRect().width;
	expect(before).toBeLessThan(400);
	const opacity = Number(getComputedStyle(node).opacity);
	flushSync(() => screen.component.recolor());
	expect(node.getBoundingClientRect().width).toBeCloseTo(before, 0);
	expect(Number(getComputedStyle(node).opacity)).toBeCloseTo(opacity, 2);
	expect(getComputedStyle(node).backgroundColor).toBe('rgb(0, 0, 255)');
	await expect.poll(() => node.getBoundingClientRect().width).toBeCloseTo(420, 0);
	await expect.poll(() => Number(getComputedStyle(node).opacity)).toBeCloseTo(0.3, 2);
});
