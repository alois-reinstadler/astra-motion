import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { isDragActive, visualElementStore } from 'motion-dom';
import { flushSync, tick } from 'svelte';
import Fixture from './parity-reorder-fixture.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const item = (value: number) =>
	document.querySelector<HTMLElement>(`[data-reorder-item="${value}"]`)!;
const handle = (value: number) =>
	document.querySelector<HTMLElement>(`[data-reorder-handle="${value}"]`)!;
function pointer(target: EventTarget, type: string, x: number, y: number) {
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			isPrimary: true,
			pointerType: 'mouse',
			button: 0,
			pointerId: 1,
			clientX: x,
			clientY: y
		})
	);
}
async function ready() {
	const result = render(Fixture);
	await tick();
	await frame();
	await frame();
	return result;
}

it('preserves focus on the same keyed handle after its controlled position changes', async () => {
	const { component } = await ready();
	const focused = handle(0);
	focused.focus();
	component.move(0, 2);
	await tick();
	expect(component.inspect().values).toEqual([1, 2, 0, 3]);
	expect(handle(0)).toBe(focused);
	await expect.poll(() => document.activeElement).toBe(focused);
});

it('does not steal focus intentionally moved outside a reordering group', async () => {
	const { component } = await ready();
	const external = document.createElement('button');
	document.body.append(external);
	try {
		handle(0).focus();
		flushSync(() => component.move(0, 2));
		external.focus();
		await tick();
		expect(component.inspect().values).toEqual([1, 2, 0, 3]);
		expect(document.activeElement).toBe(external);
	} finally {
		external.remove();
	}
});

it('does not restore a moved item after an explicit document-body focus reset', async () => {
	const { component } = await ready();
	const previous = document.body.getAttribute('tabindex');
	document.body.tabIndex = -1;
	try {
		handle(0).focus();
		flushSync(() => component.move(0, 2));
		document.body.focus();
		await tick();
		await frame();
		expect(document.activeElement).toBe(document.body);
	} finally {
		if (previous === null) document.body.removeAttribute('tabindex');
		else document.body.setAttribute('tabindex', previous);
	}
});

it('uses controlled list values, native custom tags and a separate drag handle', async () => {
	const { component } = await ready();
	expect(document.querySelector('[data-reorder-group]')?.tagName).toBe('OL');
	const node = item(0);
	expect(node.tagName).toBe('LI');
	expect(getComputedStyle(node).position).toBe('relative');
	const start = node.getBoundingClientRect();
	pointer(node, 'pointerdown', start.x + 20, start.y + 20);
	pointer(window, 'pointermove', start.x + 20, start.y + 90);
	await frame();
	expect(component.inspect().values).toEqual([0, 1, 2, 3]);
	pointer(window, 'pointerup', start.x + 20, start.y + 90);
	pointer(handle(0), 'pointerdown', start.x + 20, start.y + 20);
	await frame();
	pointer(window, 'pointermove', start.x + 20, start.y + 100);
	await expect.poll(() => component.inspect().values[0]).toBe(1);
	pointer(window, 'pointerup', start.x + 20, start.y + 100);
	await expect.poll(() => isDragActive()).toBe(false);
	await expect
		.poll(() => Number(visualElementStore.get(node)?.getValue('y', 0).get()), { timeout: 3000 })
		.toBeCloseTo(0, 1);
});
it('detects wrapped grids and releases drag resources when the active item is removed', async () => {
	const { component } = await ready();
	component.wrap();
	await tick();
	await frame();
	await frame();
	const node = item(0);
	const start = node.getBoundingClientRect();
	pointer(handle(0), 'pointerdown', start.x + 20, start.y + 20);
	await frame();
	pointer(window, 'pointermove', start.x + 150, start.y + 20);
	await expect.poll(() => component.inspect().values[0]).toBe(1);
	component.remove(0);
	await tick();
	await expect.poll(() => isDragActive()).toBe(false);
	expect(component.inspect().values.includes(0)).toBe(false);
	pointer(window, 'pointerup', start.x + 150, start.y + 20);
});

it('keeps the dragged element under its pointer when siblings are inserted and removed', async () => {
	const { component } = await ready();
	const node = item(1);
	const start = node.getBoundingClientRect();
	pointer(handle(1), 'pointerdown', start.x + 20, start.y + 20);
	await frame();
	pointer(window, 'pointermove', start.x + 20, start.y + 45);
	await frame();
	await frame();
	const dragged = node.getBoundingClientRect();
	component.insert(4);
	await tick();
	await frame();
	await frame();
	expect(item(1)).toBe(node);
	expect(isDragActive()).toBe(true);
	expect(Math.abs(node.getBoundingClientRect().top - dragged.top)).toBeLessThan(1.5);
	component.remove(0);
	await tick();
	await frame();
	await frame();
	expect(isDragActive()).toBe(true);
	expect(Math.abs(node.getBoundingClientRect().top - dragged.top)).toBeLessThan(1.5);
	pointer(window, 'pointerup', start.x + 20, start.y + 45);
	await expect.poll(() => isDragActive()).toBe(false);
});

it('switches from a vertical list to wrapped axes during a live drag', async () => {
	const { component } = await ready();
	const node = item(0);
	const start = node.getBoundingClientRect();
	pointer(handle(0), 'pointerdown', start.x + 20, start.y + 20);
	await frame();
	pointer(window, 'pointermove', start.x + 20, start.y + 40);
	await frame();
	expect(isDragActive()).toBe(true);
	component.wrap();
	await tick();
	await frame();
	await frame();
	expect(visualElementStore.get(node)?.getProps().drag).toBe(true);
	expect(isDragActive()).toBe(true);
	pointer(window, 'pointermove', start.x + 70, start.y + 40);
	await frame();
	expect(Number(visualElementStore.get(node)?.getValue('x', 0).get())).toBeGreaterThan(0);
	pointer(window, 'pointerup', start.x + 70, start.y + 40);
	await expect.poll(() => isDragActive()).toBe(false);
});

it('continues edge scrolling for a stationary pointer and stops scrolling on removal', async () => {
	const { component } = await ready();
	component.extend();
	await tick();
	await frame();
	await frame();
	const scroller = document.querySelector<HTMLElement>('[data-reorder-scroll]')!;
	const start = item(0).getBoundingClientRect();
	const edge = scroller.getBoundingClientRect();
	pointer(handle(0), 'pointerdown', start.x + 20, start.y + 20);
	await frame();
	pointer(window, 'pointermove', start.x + 20, edge.bottom - 5);
	await expect.poll(() => scroller.scrollTop).toBeGreaterThan(20);
	const first = scroller.scrollTop;
	await frame();
	await frame();
	await frame();
	expect(scroller.scrollTop).toBeGreaterThan(first);
	component.remove(0);
	await tick();
	await expect.poll(() => isDragActive()).toBe(false);
	await frame();
	const stopped = scroller.scrollTop;
	await frame();
	await frame();
	expect(scroller.scrollTop).toBe(stopped);
	pointer(window, 'pointerup', start.x + 20, edge.bottom - 5);
});
