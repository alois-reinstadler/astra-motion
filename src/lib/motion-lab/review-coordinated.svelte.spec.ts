import { tick } from 'svelte';
import { render } from 'vitest-browser-svelte';
import { expect, it } from 'vitest';
import Fixture from './ReviewCoordinatedIntegration.svelte';

const surface = () => document.querySelector<HTMLElement>('[data-review-composed]');
const opacity = (node: HTMLElement) => Number(getComputedStyle(node).opacity);

it('coalesces wait changes through coordinated exits while popLayout reflows a shared group', async () => {
	const { component } = await render(Fixture);
	await expect.poll(() => opacity(surface()!)).toBe(1);
	const original = surface()!;
	const sibling = document.querySelector<HTMLElement>('[data-review-survivor]')!;
	expect(sibling.offsetLeft).toBeGreaterThan(100);
	await new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
	);
	component.select('b');
	await tick();
	await expect.poll(() => original.style.position).toBe('absolute');
	expect(sibling.offsetLeft).toBe(0);
	component.select('c');
	await tick();
	expect(surface()).toBe(original);
	await expect.poll(() => surface()?.dataset.reviewComposed).toBe('c');
	await expect.poll(() => opacity(surface()!)).toBe(1);
	expect(document.querySelectorAll('[data-review-composed]')).toHaveLength(1);
});

it('does not resurrect a wait branch and releases layout participants after owner destruction', async () => {
	const { component } = await render(Fixture);
	await expect.poll(() => opacity(surface()!)).toBe(1);
	await new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
	);
	component.select('b');
	await tick();
	await expect.poll(() => surface()?.style.position).toBe('absolute');
	component.destroy();
	await tick();
	await expect.poll(() => surface()).toBeNull();
	await expect.poll(() => component.participants()).toBe(0);
});
