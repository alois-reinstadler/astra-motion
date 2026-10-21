// Adapted scenarios: Humanspeak f2b5d76, e2e/motion/hover-tap-disjoint-keys.spec.ts.
// Provenance, adaptations and MIT notice: tests/competitor-baseline/README.md.
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { motion } from '../motion/index.js';

function hover(node: HTMLElement, active: boolean) {
	node.dispatchEvent(
		new PointerEvent(active ? 'pointerenter' : 'pointerleave', {
			pointerType: 'mouse',
			isPrimary: true
		})
	);
}

it.each(['enter', 'leave'] as const)(
	'hover %s changes opacity while a held keyboard tap owns scale',
	async (boundary) => {
		// Move the real mouse away before mounting; synthetic events do not move it.
		const parking = document.createElement('div');
		parking.style.cssText =
			'position:fixed;left:200px;top:150px;width:20px;height:20px;z-index:2147483647;';
		document.body.append(parking);
		try {
			await userEvent.hover(parking);
		} finally {
			parking.remove();
		}
		const screen = render(motion.button, {
			'aria-label': 'Disjoint gesture ownership',
			whileHover: { opacity: 0.5 },
			whileTap: { scale: 0.9 },
			transition: { type: false },
			style: { opacity: 1, scale: 1, width: 120, height: 60 }
		});
		const button = document.querySelector<HTMLButtonElement>(
			'[aria-label="Disjoint gesture ownership"]'
		)!;
		const opacity = () => Number(getComputedStyle(button).opacity);
		const scale = () => new DOMMatrix(getComputedStyle(button).transform).a;
		try {
			await expect.poll(opacity).toBe(1);
			if (boundary === 'leave') {
				hover(button, true);
				await expect.poll(opacity).toBe(0.5);
			}
			button.focus();
			button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
			// Establish that tap really is active before crossing the hover boundary.
			// Firefox exposes the computed matrix through single-precision float values.
			await expect.poll(scale).toBeCloseTo(0.9, 6);
			hover(button, boundary === 'enter');
			await expect.poll(opacity).toBe(boundary === 'enter' ? 0.5 : 1);
			expect(scale()).toBeCloseTo(0.9, 6);
			button.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
			await expect.poll(scale).toBe(1);
			expect(opacity()).toBe(boundary === 'enter' ? 0.5 : 1);
		} finally {
			await screen.unmount();
		}
	}
);
