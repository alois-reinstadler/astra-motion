import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import MotionStatePerformance from './MotionStatePerformance.svelte';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

it('animates 100 opacity and color states without remeasuring their layout every frame', async () => {
	const screen = render(MotionStatePerformance);
	for (let i = 0; i < 6; i++) await frame();
	const nodes = [...document.querySelectorAll<HTMLElement>('[data-motion-paint]')];
	expect(nodes).toHaveLength(100);
	let reads = 0;
	const originals = nodes.map((node) => node.getBoundingClientRect);
	nodes.forEach((node, index) => {
		node.getBoundingClientRect = () => {
			reads++;
			return originals[index].call(node);
		};
	});
	try {
		flushSync(() =>
			(
				screen
					.getByRole('button', { name: 'Animate 100 paint states' })
					.element() as HTMLButtonElement
			).click()
		);
		await expect.poll(() => Number(getComputedStyle(nodes[0]).opacity)).toBeCloseTo(0.4, 3);
		expect(getComputedStyle(nodes[0]).backgroundColor).toBe('rgb(0, 0, 255)');
		expect(reads).toBe(0);
	} finally {
		nodes.forEach((node, index) => {
			node.getBoundingClientRect = originals[index];
		});
	}
});
