import { tick } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { isDragActive, visualElementStore } from 'motion-dom';
import Fixture from './RCReorder.svelte';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const item = (id: string) => document.querySelector<HTMLElement>(`[data-rc-reorder="${id}"]`)!;
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
async function drag(id: string, grid = false) {
	await tick();
	await frame();
	await frame();
	const rect = item(id).getBoundingClientRect();
	const x = rect.x + 20,
		y = rect.y + 20;
	pointer(item(id), 'pointerdown', x, y);
	await frame();
	pointer(window, 'pointermove', x + (grid ? 100 : 0), y + (grid ? 0 : 80));
	return () => pointer(window, 'pointerup', x + (grid ? 100 : 0), y + (grid ? 0 : 80));
}
it.each([false, true])(
	'binds pointer proposals preserving objects and DOM (grid=%s)',
	async (grid) => {
		const { component } = render(Fixture);
		if (grid) component.wrap();
		const node = item('a');
		const release = await drag('a', grid);
		try {
			await expect.poll(() => component.inspect().values[0].id).toBe('b');
		} finally {
			release();
		}
		await expect.poll(() => isDragActive()).toBe(false);
		const { values, originals, proposals } = component.inspect();
		expect(values[1]).toBe(originals[0]);
		expect(item('a')).toBe(node);
		expect(proposals).toBe(0);
		component.reverse();
		await tick();
		expect(
			[...document.querySelectorAll<HTMLElement>('[data-rc-reorder]')].map(
				(node) => node.dataset.rcReorder
			)
		).toEqual(component.inspect().values.map((value) => value.id));
		expect(item('a')).toBe(node);
	}
);

it('retains callback proposal authority with a binding and deduplicates rejection', async () => {
	const { component } = render(Fixture, { controlled: true });
	const release = await drag('a');
	try {
		await expect.poll(() => component.inspect().proposals).toBe(1);
		await frame();
		await frame();
		expect(component.inspect().values).toBe(component.inspect().originals);
		expect(component.inspect().proposals).toBe(1);
	} finally {
		release();
	}
	await expect.poll(() => isDragActive()).toBe(false);
	await expect
		.poll(() => Number(visualElementStore.get(item('a'))?.getValue('y', 0).get()))
		.toBeCloseTo(0, 1);
	component.accepting();
	await tick();
	expect(component.inspect().proposals).toBe(1);
	const releaseAccepted = await drag('a');
	try {
		await expect.poll(() => component.inspect().values[0].id).toBe('b');
	} finally {
		releaseAccepted();
	}
	await expect.poll(() => isDragActive()).toBe(false);
	expect(component.inspect().orders).toEqual(['b,a,c', 'b,a,c']);
});

it('accepts application array replacement without notifying and preserves surviving identities', async () => {
	const { component } = render(Fixture, { controlled: true });
	const originalNode = item('a');
	const originalValue = component.inspect().values[0];
	component.replace();
	await tick();
	expect(component.inspect().values.map((value) => value.id)).toEqual(['c', 'a', 'd']);
	expect(component.inspect().values[1]).toBe(originalValue);
	expect(item('a')).toBe(originalNode);
	await expect.poll(() => item('b')).toBeNull();
	expect(item('d')).not.toBeNull();
	expect(component.inspect().proposals).toBe(0);
});
