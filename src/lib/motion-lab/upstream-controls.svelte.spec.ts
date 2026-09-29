// Adapted from Motion v13.4.4; sources and MIT notice: tests/motion-baseline/README.md, LICENSE.motion.
import { tick } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamControls.svelte';

const frames = async (count = 3) => {
	for (let i = 0; i < count; i++)
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};
const nodes = () => [...document.querySelectorAll<HTMLElement>('[data-upstream-control]')];
const x = (element: HTMLElement) => new DOMMatrix(getComputedStyle(element).transform).m41;

it('controls.set broadcasts immediately and resolves each subscriber custom value', async () => {
	const { component } = render(Fixture);
	await tick();
	const controls = component.getControls();
	controls.set({ x: 25 });
	expect(component.values().map((value) => value.get())).toEqual([25, 25]);
	controls.set((custom: number) => ({ x: custom * 30 }));
	expect(component.values().map((value) => value.get())).toEqual([30, 60]);
	await expect.poll(() => nodes().map(x)).toEqual([30, 60]);
});

it('controls.stop freezes every active subscriber at its current value', async () => {
	const { component } = render(Fixture);
	await tick();
	const controls = component.getControls();
	void controls.start({ x: 100 }, { duration: 1, ease: 'linear' });
	await expect
		.poll(() => component.values().every((value) => value.get() > 0 && value.get() < 100))
		.toBe(true);
	controls.stop();
	const stopped = component.values().map((value) => value.get());
	expect(component.values().every((value) => !value.isAnimating())).toBe(true);
	await frames(5);
	expect(component.values().map((value) => value.get())).toEqual(stopped);
	await expect.poll(() => nodes().map(x)).toEqual(stopped.map((value) => expect.closeTo(value, 4)));
});

it('a newer controls.start wins when it interrupts an active target', async () => {
	const { component } = render(Fixture);
	await tick();
	const controls = component.getControls();
	void controls.start({ x: 100 }, { duration: 0.2, ease: 'linear' });
	await expect.poll(() => component.values()[0].get()).toBeGreaterThan(0);
	expect(component.values()[0].get()).toBeLessThan(100);
	// The replacement outlasts the first animation's original deadline.
	await controls.start({ x: -40 }, { duration: 0.3, ease: 'linear' });
	expect(component.values().map((value) => value.get())).toEqual([-40, -40]);
	await frames();
	expect(component.values().map((value) => value.get())).toEqual([-40, -40]);
	await expect.poll(() => nodes().map(x)).toEqual([-40, -40]);
});

it('label arrays merge targets and retain legacy first-label precedence for set', async () => {
	const { component } = render(Fixture);
	await tick();
	const controls = component.getControls();
	await controls.start(['position', 'paint'], { duration: 0 });
	await expect.poll(() => nodes().map(x)).toEqual([80, 80]);
	expect(nodes().map((node) => node.style.opacity)).toEqual(['0.5', '0.5']);
	controls.set(['position', 'paint']);
	expect(component.values().map((value) => value.get())).toEqual([40, 40]);
	await expect.poll(() => nodes().map(x)).toEqual([40, 40]);
	expect(nodes().map((node) => node.style.opacity)).toEqual(['0.5', '0.5']);
});
