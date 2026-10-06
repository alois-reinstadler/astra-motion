import { flushSync, hydrate, tick, unmount as unmountSvelte } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './LayoutStateFixture.svelte';
import { layoutStateHTML } from './layout-state-ssr.js';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const item = (id: number) =>
	document.querySelector<HTMLElement>(`[data-layout-state-item="${id}"]`);

it('coalesces replacements and accumulates functional updates against the pending value', async () => {
	const rendered: number[] = [];
	const { component } = render(Fixture, { onRender: (count) => rendered.push(count) });
	await tick();
	const { counter } = component.states();
	counter.set(3);
	counter.update((value) => value + 2);
	counter.update((value) => value * 4);
	expect(counter.current).toBe(0);
	await tick();
	expect(counter.current).toBe(20);
	expect(rendered).toEqual([0, 20]);
	counter.set(99);
	counter.set(20);
	await tick();
	expect(rendered).toEqual([0, 20]);
});

it('publishes multiple state objects in one observable render', async () => {
	const rendered: number[][] = [];
	const { component } = render(Fixture, {
		onRender: (count, columns) => rendered.push([count, columns])
	});
	await tick();
	const { counter, scene } = component.states();
	counter.set(7);
	scene.update((value) => ({ ...value, columns: 5 }));
	await tick();
	expect(rendered).toEqual([
		[0, 10],
		[7, 5]
	]);
});

it('accepts mount and effect writes outside Svelte lifecycle flushing', async () => {
	const onMountWrite = vi.fn();
	const { component } = render(Fixture, { mountWrite: true, onMountWrite });
	await expect.poll(() => component.states().counter.current).toBe(1);
	expect(onMountWrite).toHaveBeenCalledExactlyOnceWith(0, 0);
	flushSync(() => component.requestFromEffect());
	await expect.poll(() => component.states().counter.current).toBe(2);
	expect(document.querySelector('[data-layout-state-count]')?.textContent).toBe('2');
});

it('hydrates initialization changes without replacing server nodes or producing mismatch warnings', async () => {
	const container = document.createElement('div');
	container.innerHTML = layoutStateHTML;
	document.body.append(container);
	const original = [...container.querySelectorAll('[data-layout-state-item]')];
	const grid = container.querySelector<HTMLElement>('[data-layout-state-grid]')!;
	const warn = vi.spyOn(console, 'warn');
	const error = vi.spyOn(console, 'error');
	let component: Record<string, unknown> | undefined;
	try {
		component = hydrate(Fixture, { target: container, props: { initializeScene: true } });
		await tick();
		await frame();
		expect(original).toHaveLength(28);
		expect(container.querySelector('[data-layout-state-grid]')).toBe(grid);
		expect(grid.style.gridTemplateColumns).toBe('repeat(5, minmax(0px, 1fr))');
		const hydrated = [...container.querySelectorAll('[data-layout-state-item]')];
		expect(hydrated).toHaveLength(original.length);
		for (let index = 0; index < original.length; index++)
			expect(hydrated[index]).toBe(original[index]);
		expect([...warn.mock.calls, ...error.mock.calls].flat().join(' ')).not.toContain('hydration');
	} finally {
		if (component) await unmountSvelte(component);
		container.remove();
		warn.mockRestore();
		error.mockRestore();
	}
});

it('initialization requests publish before subsequent interaction', async () => {
	const { component } = render(Fixture, { initializeCount: 4 });
	await expect.poll(() => component.states().counter.current).toBe(4);
	component.states().counter.update((value) => value + 1);
	await tick();
	expect(component.states().counter.current).toBe(5);
});

it('cancels pending publication and future updates when the component is disposed', async () => {
	const observed = vi.fn();
	const { component, unmount } = render(Fixture, { onRender: observed });
	await tick();
	const { counter } = component.states();
	const calls = observed.mock.calls.length;
	counter.set(8);
	await unmount();
	await tick();
	counter.update(() => {
		throw new Error('An updater must not run after disposal');
	});
	expect(counter.current).toBe(0);
	expect(observed).toHaveBeenCalledTimes(calls);
	expect(document.querySelector('[data-layout-state-grid]')).toBeNull();
});

it('queues a reentrant effect request after publishing the current batch', async () => {
	const rendered: number[] = [];
	const { component } = render(Fixture, {
		onRender: (count) => {
			rendered.push(count);
			if (count === 1) counter.set(2);
		}
	});
	const { counter } = component.states();
	await tick();
	counter.set(1);
	await expect.poll(() => counter.current).toBe(2);
	expect(rendered).toEqual([0, 1, 2]);
});

it.each([false, true])(
	'captures outgoing geometry before parent reflow (interrupted: %s)',
	async (interrupted) => {
		const complete = vi.fn();
		const { component } = render(Fixture, { onExitComplete: complete });
		await tick();
		await frame();
		await frame();
		if (interrupted) {
			component.states().scene.update((value) => ({ ...value, items: [...value.items].reverse() }));
			await new Promise((resolve) => setTimeout(resolve, 90));
			expect(
				[...document.querySelectorAll<HTMLElement>('[data-layout-state-item]')].some(
					(node) => node.style.transform && node.style.transform !== 'none'
				)
			).toBe(true);
		}
		const outgoing = [0, 5];
		const before = new Map(outgoing.map((id) => [id, item(id)!.getBoundingClientRect()]));
		const errors = new Map<number, number>();
		const observer = new MutationObserver(() => {
			for (const id of outgoing) {
				const node = item(id);
				if (!node || errors.has(id) || getComputedStyle(node).position !== 'absolute') continue;
				const old = before.get(id)!;
				const next = node.getBoundingClientRect();
				errors.set(
					id,
					Math.max(
						...(['x', 'y', 'width', 'height'] as const).map((key) => Math.abs(old[key] - next[key]))
					)
				);
			}
		});
		observer.observe(document.querySelector('[data-layout-state-grid]')!, {
			childList: true,
			attributes: true,
			subtree: true
		});
		try {
			const { scene } = component.states();
			scene.update((value) => ({
				columns: 5,
				items: [...value.items].reverse().filter((id) => !outgoing.includes(id))
			}));
			await expect.poll(() => errors.size).toBe(outgoing.length);
			expect(Math.max(...errors.values())).toBeLessThanOrEqual(0.75);
			await expect.poll(() => outgoing.every((id) => item(id) === null)).toBe(true);
			expect(complete).toHaveBeenCalledTimes(1);
			expect(
				[...document.querySelectorAll<HTMLElement>('[data-layout-state-item]')].map((node) =>
					Number(node.dataset.layoutStateItem)
				)
			).toEqual(scene.current.items);
		} finally {
			observer.disconnect();
		}
	}
);
