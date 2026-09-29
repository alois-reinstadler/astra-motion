import { flushSync, tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './ParityCoreContracts.svelte';
const node = (name: string) => document.querySelector<HTMLElement>(`[data-${name}]`)!;
const x = (element: Element) => new DOMMatrix(getComputedStyle(element).transform).m41;
const frames = async () => {
	for (let i = 0; i < 3; i++)
		await new Promise<void>((done) => requestAnimationFrame(() => done()));
};

it('starts imperative variants from onMount, sequences descendants, replaces controls and unsubscribes on destroy', async () => {
	const start = vi.fn();
	const { component, unmount } = render(Fixture, { onStart: start });
	await expect.poll(() => x(node('controls'))).toBe(40);
	await expect.poll(() => node('controls-child').style.opacity).toBe('1');
	expect(start).toHaveBeenCalledExactlyOnceWith('shown', undefined, undefined);
	flushSync(() => component.swapControls());
	await tick();
	await frames();
	await component.control('first').start({ x: 10 }, { duration: 0 });
	expect(x(node('controls'))).toBe(40);
	await component.control('second').start('more', { duration: 0 });
	await expect.poll(() => x(node('controls'))).toBe(80);
	await expect.poll(() => node('controls-child').style.opacity).toBe('0.5');
	const controls = component.control('second');
	await unmount();
	expect(() => controls.start({ x: 0 })).toThrow('mounted component');
});

it('gives raw transforms precedence, retains their initial base and supports an explicit raw reset', async () => {
	const { component } = render(Fixture);
	await expect.poll(() => node('raw').style.transform).toBe('rotate(30deg)');
	flushSync(() => component.releaseRaw());
	await frames();
	expect(node('raw').style.transform).toBe('rotate(30deg)');
	flushSync(() => component.clearRaw());
	await expect.poll(() => x(node('raw'))).toBe(75);
});

it('restores hover then animate after a higher-priority tap completes', async () => {
	render(Fixture);
	await frames();
	const target = node('priority');
	target.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse', isPrimary: true }));
	await expect.poll(() => x(target)).toBe(30);
	target.dispatchEvent(
		new PointerEvent('pointerdown', {
			pointerType: 'mouse',
			pointerId: 1,
			isPrimary: true,
			bubbles: true
		})
	);
	await expect.poll(() => x(target)).toBe(60);
	target.dispatchEvent(
		new PointerEvent('pointerup', {
			pointerType: 'mouse',
			pointerId: 1,
			isPrimary: true,
			bubbles: true
		})
	);
	await expect.poll(() => x(target)).toBe(30);
	target.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse', isPrimary: true }));
	await expect.poll(() => x(target)).toBe(0);
});

it('reactively reduces positional targets while allowing paint animation to finish', async () => {
	const { component } = render(Fixture);
	await frames();
	flushSync(() => component.changePolicy());
	await expect.poll(() => x(node('policy'))).toBe(100);
	// Position reaches its reduced-motion target before paint reaches its endpoint.
	await expect
		.poll(() => Number(getComputedStyle(node('policy')).opacity), { interval: 10 })
		.toBeLessThan(1);
	expect(Number(getComputedStyle(node('policy')).opacity)).toBeGreaterThan(0.3);
	await expect.poll(() => Number(getComputedStyle(node('policy')).opacity)).toBe(0.3);
});

it('uses presenceAffectsLayout as an explicit measurement hint without requiring a DOM mutation', async () => {
	const measure = vi.fn();
	const { component } = render(Fixture, { onMeasure: measure });
	await frames();
	measure.mockClear();
	flushSync(() => component.invalidate(false));
	await frames();
	expect(measure).not.toHaveBeenCalled();
	flushSync(() => component.invalidate(true));
	await expect.poll(() => measure.mock.calls.length).toBeGreaterThan(0);
});
