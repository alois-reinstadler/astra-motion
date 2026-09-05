import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import ScrollRetention from './ScrollRetention.svelte';
import { hasMotionOwnership } from '../motion/ownership.js';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const scale = (node: Element) => new DOMMatrix(getComputedStyle(node).transform).a;

it('reconnects current scroll progress after reduced-policy changes reverse a retained outro', async () => {
	const screen = render(ScrollRetention);
	const container = screen.getByTestId('retained-scroll-container').element() as HTMLElement;
	const fill = screen.getByTestId('retained-scroll-fill').element();
	try {
		await expect.poll(() => scale(fill)).toBeCloseTo(0, 2);
		for (let index = 0; index < 12; index++) {
			screen.component.update({ open: false, reduced: true });
			await tick();
			await expect.poll(() => scale(fill)).toBeCloseTo(1, 2);
			container.style.height = `${100 + (index % 3) * 10}px`;
			container.scrollTop = (container.scrollHeight - container.clientHeight) * 0.4;
			await frame();
			screen.component.update({ open: true, reduced: false });
			await tick();
			await expect.poll(() => scale(fill)).toBeCloseTo(0.4, 2);
			expect(screen.getByTestId('retained-scroll-fill').element()).toBe(fill);
			expect(fill.getAnimations().length).toBeLessThanOrEqual(1);
		}
	} finally {
		await screen.unmount();
	}
	await frame();
	expect(hasMotionOwnership(fill)).toBe(false);
	expect(fill.getAnimations()).toHaveLength(0);
}, 15000);
