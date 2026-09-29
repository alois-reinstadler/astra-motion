import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TransformOwnership from './TransformOwnership.svelte';
import TransformBoundary from './TransformBoundary.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
it('lets an imperative raw transform take precedence and explicitly clears it before aliases resume', async () => {
	const screen = render(TransformOwnership, { config: { animate: { x: 30 } } });
	await frame();
	const node = document.querySelector<HTMLElement>('[data-transform-owner]')!;
	await screen.component.animate({ transform: 'rotate(30deg)' });
	expect(new DOMMatrix(getComputedStyle(node).transform).e).toBe(0);
	expect(new DOMMatrix(getComputedStyle(node).transform).a).toBeCloseTo(Math.cos(Math.PI / 6), 5);
	await screen.component.animate({ transform: '', x: 60 });
	await expect.poll(() => new DOMMatrix(getComputedStyle(node).transform).e).toBeCloseTo(60, 1);
});
it('applies a literal raw none endpoint through transitionEnd after prior aliases', async () => {
	const screen = render(TransformOwnership);
	await frame();
	const node = document.querySelector<HTMLElement>('[data-transform-owner]')!;
	await screen.component.animate({ x: 30 });
	// Motion 13.4.4 normalizes an animated matrix-to-none target to a zero matrix.
	// transitionEnd preserves the literal endpoint without that interpolation.
	await screen.component.animate({
		transform: 'matrix(1, 0, 0, 1, 0, 0)',
		transitionEnd: { transform: 'none' }
	});
	expect(getComputedStyle(node).transform).toBe('none');
});
it('retains raw-transform precedence until it is explicitly cleared', async () => {
	const screen = render(TransformOwnership, {
		config: { animate: { transform: 'rotate(30deg)' } }
	});
	await frame();
	const node = document.querySelector<HTMLElement>('[data-transform-owner]')!;
	await screen.component.animate({ transform: 'rotate(60deg)' });
	await screen.component.animate({ scale: 2 });
	expect(new DOMMatrix(getComputedStyle(node).transform).a).toBeCloseTo(0.5, 5);
	await screen.component.animate({ transform: '', scale: 2 });
	expect(new DOMMatrix(getComputedStyle(node).transform).a).toBe(2);
});
it('lets inherited Motion targets acquire the transform under reduced motion', async () => {
	const screen = render(TransformBoundary, { inherited: true });
	await frame();
	const node = screen.container.querySelector<HTMLElement>('[data-reduced-inherited-transform]')!;
	node.style.transform = 'scale(2)';
	await screen.rerender({ inherited: true, takeover: true });
	await expect
		.poll(() => new DOMMatrix(getComputedStyle(node).transform).e)
		.toBeCloseTo(12.123456789, 3);
	expect(screen.container.querySelector('[data-transform-error]')).toBeNull();
	expect(node.isConnected).toBe(true);
});

it('claims a newly inherited fractional transform when reduced motion settles it immediately', async () => {
	const screen = render(TransformBoundary, { inherited: true });
	await frame();
	const node = screen.container.querySelector<HTMLElement>('[data-reduced-inherited-transform]')!;
	await screen.rerender({ inherited: true, takeover: true });
	await expect
		.poll(() => new DOMMatrix(getComputedStyle(node).transform).e)
		.toBeCloseTo(12.123456789, 3);
	expect(screen.container.querySelector('[data-transform-error]')).toBeNull();
	expect(node.isConnected).toBe(true);
});
