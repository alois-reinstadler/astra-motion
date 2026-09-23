import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { visualElementStore } from 'motion-dom';
import NestedOptions from './NestedOptions.svelte';
import TransformBoundary from './TransformBoundary.svelte';

it('tracks nested object/getter/component targets, keyframes and custom reads without replacing MotionValues', async () => {
	const screen = render(NestedOptions);
	const nodes = ['object', 'getter', 'component', 'variant', 'custom'].map(
		(key) => document.querySelector(`[data-nested-${key}]`) as HTMLElement
	);
	await expect.poll(() => nodes.every((node) => visualElementStore.has(node))).toBe(true);
	const visuals = nodes.map((node) => visualElementStore.get(node)!);
	const value = screen.component.external();
	expect(visuals[3].getValue('opacity')).toBe(value);
	screen.component.mutate(80);
	for (const visual of visuals) await expect.poll(() => visual.getValue('x')?.get()).toBe(80);
	screen.component.replace(30);
	for (const visual of visuals.slice(0, 3))
		await expect.poll(() => visual.getValue('x')?.get()).toBe(30);
	expect(nodes.map((node) => visualElementStore.get(node))).toEqual(visuals);
	expect(visuals[3].getValue('opacity')).toBe(value);
	await screen.unmount();
	expect(nodes.every((node) => !node.isConnected)).toBe(true);
});

it('catches deferred transform takeover in the nearest Svelte boundary', async () => {
	const sheet = document.createElement('style');
	sheet.textContent = '[data-transform-owner] { transform: translateX(15px); }';
	document.head.append(sheet);
	try {
		const screen = render(TransformBoundary);
		const node = document.querySelector('[data-transform-owner]') as HTMLElement;
		await expect.poll(() => visualElementStore.has(node)).toBe(true);
		expect(new DOMMatrix(getComputedStyle(node).transform).e).toBe(15);
		await screen.rerender({ takeover: true });
		await expect
			.poll(() => document.querySelector('[data-transform-error]')?.textContent)
			.toContain('Motion owns');
		expect(node.isConnected).toBe(false);
	} finally {
		sheet.remove();
	}
});

it('catches an initial CSS transform conflict before the deferred visual mounts', async () => {
	const sheet = document.createElement('style');
	sheet.textContent = '[data-transform-owner] { translate: 15px; }';
	document.head.append(sheet);
	try {
		render(TransformBoundary, { takeover: true });
		await expect
			.poll(() => document.querySelector('[data-transform-error]')?.textContent)
			.toContain('Motion owns');
		expect(document.querySelector('[data-transform-owner]')).toBeNull();
	} finally {
		sheet.remove();
	}
});
