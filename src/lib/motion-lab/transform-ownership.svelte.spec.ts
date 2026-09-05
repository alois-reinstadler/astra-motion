import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TransformOwnership from './TransformOwnership.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
it('rejects imperative raw targets without replacing an existing decomposed pose', async () => {
	const screen = render(TransformOwnership, { config: { animate: { x: 30 } } });
	await frame();
	const node = document.querySelector<HTMLElement>('[data-transform-owner]')!;
	await expect(screen.component.animate({ transform: 'rotate(30deg)' })).rejects.toThrow(
		'raw transform'
	);
	expect(new DOMMatrix(getComputedStyle(node).transform).e).toBeCloseTo(30, 1);
	await screen.component.animate({ x: 60 });
	await expect.poll(() => new DOMMatrix(getComputedStyle(node).transform).e).toBeCloseTo(60, 1);
});
it('guards imperative transform history even when it was absent from declarative options', async () => {
	const screen = render(TransformOwnership);
	await frame();
	await screen.component.animate({ x: 30 });
	await expect(screen.component.animate({ transform: 'none' })).rejects.toThrow('raw transform');
});
it('keeps raw-only transforms usable and diagnoses switching them to decomposed values', async () => {
	const screen = render(TransformOwnership, {
		config: { animate: { transform: 'rotate(30deg)' } }
	});
	await frame();
	await screen.component.animate({ transform: 'rotate(60deg)' });
	await expect(screen.component.animate({ scale: 2 })).rejects.toThrow('raw transform');
});
