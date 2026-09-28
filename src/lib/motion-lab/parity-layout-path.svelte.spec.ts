import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { visualElementStore } from 'motion-dom';
import Fixture from '../site/examples/ParityLayoutArc.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const traveller = (position: 'start' | 'end') =>
	document.querySelector<HTMLElement>(`[data-arc-position="${position}"]`)!;
const center = (node: HTMLElement) => {
	const box = node.getBoundingClientRect();
	return { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
};

it.each([false, true])(
	'curves a layout path and settles after reversal (shared=%s)',
	async (shared) => {
		await render(Fixture);
		if (shared) {
			const input = document.querySelector('input')!;
			input.checked = true;
			input.dispatchEvent(new Event('change', { bubbles: true }));
		}
		await tick();
		await frame();
		await frame();
		const start = center(traveller('start'));
		document.querySelector('button')!.click();
		await expect
			.poll(() => Boolean(visualElementStore.get(traveller('end'))?.projection?.currentAnimation))
			.toBe(true);
		const projection = visualElementStore.get(traveller('end'))!.projection!;
		const animation = projection.currentAnimation!;
		expect(animation.duration).toBe(0.8);
		animation.pause();
		animation.time = animation.duration / 2;
		await frame();
		await frame();
		const middle = center(traveller('end'));
		expect(middle.x).toBeGreaterThan(start.x + 20);
		expect(middle.y).toBeGreaterThan(start.y + 20);
		expect(visualElementStore.get(traveller('end'))!.latestValues.rotate).toBe(8);
		animation.time = animation.duration / 4;
		await frame();
		const matrix = new DOMMatrixReadOnly(getComputedStyle(traveller('end')).transform);
		const renderedAngle = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
		expect(Math.abs(renderedAngle - 8)).toBeGreaterThan(0.1);
		document.querySelector('button')!.click();
		await expect
			.poll(() => center(traveller('start')).x, { timeout: 3000 })
			.toBeCloseTo(start.x, 1);
		await expect.poll(() => center(traveller('start')).y).toBeCloseTo(start.y, 1);
		expect(visualElementStore.get(traveller('start'))!.latestValues.rotate).toBe(8);
	}
);
