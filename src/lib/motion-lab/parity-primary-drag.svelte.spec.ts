import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { isDragActive, visualElementStore } from 'motion-dom';
import Fixture from './parity-primary-drag-fixture.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const node = () => document.querySelector<HTMLElement>('[data-primary-drag]')!;
const selectionProperty = CSS.supports('user-select', 'none')
	? 'user-select'
	: '-webkit-user-select';
function pointer(target: EventTarget, type: string, x: number, y = 0) {
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			pointerType: 'mouse',
			isPrimary: true,
			pointerId: 1,
			button: 0,
			clientX: x,
			clientY: y
		})
	);
}
async function ready(authored = false) {
	const result = render(Fixture, { authored });
	await tick();
	await frame();
	await frame();
	return result;
}
async function drag() {
	pointer(node(), 'pointerdown', 0);
	await frame();
	pointer(window, 'pointermove', 80);
	await frame();
	expect(isDragActive()).toBe(true);
}

it.each(['never', 'always'] as const)(
	'uses normal native pointercancel release with enabled inertia under reducedMotion=%s',
	async (policy) => {
		const { component } = await ready();
		component.configure('x', policy);
		await tick();
		await frame();
		expect(visualElementStore.get(node())!.shouldReduceMotion).toBe(policy === 'always');
		await drag();
		const before = component.inspect().x;
		pointer(window, 'pointercancel', -1000);
		expect(isDragActive()).toBe(false);
		expect(component.inspect().events).toEqual(['start']);
		await expect.poll(() => component.inspect().events).toEqual(['start', 'pointercancel']);
		await expect.poll(() => component.inspect().x).toBeGreaterThan(before);
	}
);

it('flushes a pending move on native cancellation without using cancellation coordinates', async () => {
	const { component } = await ready();
	pointer(node(), 'pointerdown', 0);
	await frame();
	pointer(window, 'pointermove', 80);
	pointer(window, 'pointercancel', -1000);
	expect(component.inspect().x).toBe(80);
	expect(isDragActive()).toBe(false);
	await expect.poll(() => component.inspect().events).toEqual(['start', 'pointercancel']);
});

it('keeps explicit controller cancellation free of inertia and drag-end callbacks', async () => {
	const { component } = await ready();
	await drag();
	component.cancel();
	const before = component.inspect().x;
	await frame();
	await frame();
	expect(component.inspect().x).toBe(before);
	expect(component.inspect().events).toEqual(['start']);
	expect(isDragActive()).toBe(false);
});

it('keeps window blur cancellation free of release inertia', async () => {
	const { component } = await ready();
	await drag();
	const before = component.inspect().x;
	window.dispatchEvent(new Event('blur'));
	await frame();
	await frame();
	expect(component.inspect().x).toBe(before);
	expect(isDragActive()).toBe(false);
});

it('continues window tracking after capture loss until an actual release', async () => {
	const { component } = await ready();
	await drag();
	// A native keyed DOM move can lose implicit pointer capture while held.
	// It must not terminate the window-owned Motion component session.
	pointer(node(), 'lostpointercapture', 80);
	pointer(window, 'pointermove', 120);
	await frame();
	expect(component.inspect().x).toBe(120);
	expect(component.inspect().events).toEqual(['start']);
	expect(isDragActive()).toBe(true);
	pointer(window, 'pointerup', 120);
	await expect.poll(() => component.inspect().events).toEqual(['start', 'pointerup']);
	expect(isDragActive()).toBe(false);
});

it('preserves stylesheet touch and selection policies instead of replacing them', async () => {
	const { component } = await ready(true);
	expect(node().style.touchAction).toBe('');
	expect(getComputedStyle(node()).touchAction).toBe('manipulation');
	expect(node().style.getPropertyValue(selectionProperty)).toBe('');
	expect(getComputedStyle(node()).getPropertyValue(selectionProperty)).toBe('all');
	component.configure('y');
	await tick();
	expect(node().style.touchAction).toBe('');
	expect(getComputedStyle(node()).touchAction).toBe('manipulation');
	component.configure(false);
	await tick();
	expect(getComputedStyle(node()).getPropertyValue(selectionProperty)).toBe('all');
});

it('still suppresses release animation when the visual explicitly skips animations', async () => {
	const { component } = await ready();
	await drag();
	visualElementStore.get(node())!.shouldSkipAnimations = true;
	const before = component.inspect().x;
	pointer(window, 'pointerup', 80);
	await frame();
	await frame();
	expect(component.inspect().x).toBe(before);
	expect(component.inspect().events).toEqual(['start', 'pointerup']);
});

it('refreshes inferred touch policy during a live axis change without replacing the session', async () => {
	const { component } = await ready();
	expect(node().style.touchAction).toBe('pan-y');
	expect(node().style.getPropertyValue(selectionProperty)).toBe('none');
	expect(getComputedStyle(node()).getPropertyValue(selectionProperty)).toBe('none');
	await drag();
	component.configure('y');
	await tick();
	expect(node().style.touchAction).toBe('pan-x');
	expect(isDragActive()).toBe(true);
	pointer(window, 'pointermove', 80, 40);
	await frame();
	expect(component.inspect().x).toBe(80);
	expect(component.inspect().y).toBe(40);
	expect(component.inspect().events).toEqual(['start']);
	component.configure(true);
	await tick();
	expect(node().style.touchAction).toBe('none');
	expect(isDragActive()).toBe(true);
	component.configure(false);
	await tick();
	expect(node().style.touchAction).toBe('');
	expect(node().style.getPropertyValue(selectionProperty)).toBe('');
	expect(node().getAttribute('draggable')).toBeNull();
	expect(isDragActive()).toBe(false);
});

it('preserves authored style replacement when axes change and dragging is disabled', async () => {
	const { component } = await ready();
	node().style.setProperty('touch-action', 'manipulation', 'important');
	node().style.setProperty(selectionProperty, 'text', 'important');
	node().setAttribute('draggable', 'true');
	component.configure('y');
	await tick();
	expect(node().style.touchAction).toBe('manipulation');
	expect(node().style.getPropertyPriority('touch-action')).toBe('important');
	expect(node().style.getPropertyValue(selectionProperty)).toBe('text');
	expect(node().style.getPropertyPriority(selectionProperty)).toBe('important');
	component.configure(false);
	await tick();
	expect(node().style.touchAction).toBe('manipulation');
	expect(node().style.getPropertyValue(selectionProperty)).toBe('text');
	expect(node().getAttribute('draggable')).toBe('true');
});
