import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { visualElementStore } from 'motion-dom';
import { tick } from 'svelte';
import Fixture from './parity-layout-fixture.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const node = (name: string) =>
	document.querySelector<HTMLElement>(`[data-parity-layout="${name}"]`)!;
const visual = (name: string) => visualElementStore.get(node(name))!;
async function ready() {
	const result = await render(Fixture);
	await tick();
	await frame();
	await frame();
	return result;
}

it('measures only when layoutDependency changes and reports ordered previous/current boxes', async () => {
	const { component } = await ready();
	await expect.poll(() => component.inspect().measurements.length).toBeGreaterThan(0);
	const initial = component.inspect().measurements.length;
	component.resize(150);
	await tick();
	await frame();
	await frame();
	expect(component.inspect().measurements).toHaveLength(initial);
	component.resize(200, true);
	await expect.poll(() => component.inspect().measurements.at(-1)?.width).toBe(200);
	expect(component.inspect().measurements.at(-1)?.previous).toBe(100);
	const events = component.inspect().events;
	for (let index = 0; index < events.length; index++)
		if (events[index] === 'measure') expect(events[index - 1]).toBe('before');
});

it('retains disabled crossfade through geometry commits and reactive layout configuration', async () => {
	const { component } = await ready();
	const projection = visual('configured').projection!;
	expect(projection.options.crossfade).toBe(false);
	component.resize(180, true);
	await tick();
	await frame();
	await frame();
	expect(projection.options.crossfade).toBe(false);
	expect(projection.options.layoutAnchor).toEqual({ x: 1, y: 0 });
	component.configure(false, false);
	await tick();
	await frame();
	await frame();
	expect(visual('configured').projection).toBe(projection);
	expect(projection.options.layoutAnchor).toBe(false);
	expect(projection.options.crossfade).toBe(false);
});

it('keeps drag-only measurement separate from layout animation after configuration changes', async () => {
	const { component } = await ready();
	expect(visual('measure-only').projection?.options.layout).toBe(false);
	component.configure({ x: 0, y: 1 }, true);
	await tick();
	await frame();
	await frame();
	expect(visual('measure-only').projection?.options.layout).toBe(false);
	expect(visual('measure-only').getProps().layout).toBe(false);
});

it('still measures draggable geometry when its layout dependency is unchanged', async () => {
	await ready();
	const element = node('measure-only');
	const projection = visual('measure-only').projection!;
	const previous = projection.layout!.layoutBox.x.min;
	element.style.marginLeft = '50px';
	await frame();
	await frame();
	await expect.poll(() => projection.layout?.layoutBox.x.min).toBe(previous + 50);
});
