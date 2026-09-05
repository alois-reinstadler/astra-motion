import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { visualElementStore, prefersReducedMotion } from 'motion-dom';
import Lab from '../../routes/motion-lab/+page.svelte';
import { createLayout } from '../motion/layout.js';

const cleanups: Array<() => void> = [];
afterEach(() =>
	cleanups
		.splice(0)
		.reverse()
		.forEach((cleanup) => cleanup())
);

describe('independent browser architecture review', () => {
	it('links nested Svelte attachments to the nearest projected ancestor', async () => {
		await render(Lab);
		const child = document.querySelector<HTMLElement>('[data-testid="nested-child"]')!;
		const childProjection = visualElementStore.get(child)?.projection;
		const parentProjection = visualElementStore.get(child.parentElement!)?.projection;
		expect(childProjection?.parent === parentProjection).toBe(true);
	});
	it('honors the explicit reduced motion override inside the Motion visual element', async () => {
		const previous = prefersReducedMotion.current;
		prefersReducedMotion.current = true;
		cleanups.push(() => {
			prefersReducedMotion.current = previous;
		});
		const layout = createLayout({ reducedMotion: 'never' });
		const node = document.createElement('div');
		node.style.cssText = 'width:100px;height:100px';
		document.body.append(node);
		cleanups.push(() => node.remove());
		const stop = layout()(node);
		if (stop) cleanups.push(stop);
		await Promise.resolve();
		expect(visualElementStore.get(node)?.shouldReduceMotion).toBe(false);
	});
	it('snapshots every group even when only an unrelated group changes', async () => {
		await render(Lab);
		const nodes = [...document.querySelectorAll<HTMLElement>('.tile')];
		let reads = 0;
		for (const node of nodes) {
			const original = node.getBoundingClientRect;
			node.getBoundingClientRect = function () {
				reads++;
				return original.call(this);
			};
			cleanups.push(() => {
				node.getBoundingClientRect = original;
			});
		}
		createLayout().update(() => {});
		await Promise.resolve();
		expect(reads).toBeGreaterThanOrEqual(nodes.length);
	});
});
